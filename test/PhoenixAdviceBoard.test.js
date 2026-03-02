const { expect }  = require("chai");
const { ethers }  = require("hardhat");

describe("PhoenixAdviceBoard", function () {
  let phoenix;
  let owner, asker, answerer1, answerer2;
  const ASK_FEE = ethers.parseEther("0.001");

  beforeEach(async function () {
    [owner, asker, answerer1, answerer2] = await ethers.getSigners();
    const Phoenix = await ethers.getContractFactory("PhoenixAdviceBoard");
    phoenix = await Phoenix.deploy();
    await phoenix.waitForDeployment();
  });

  // ── Deployment ────────────────────────────────────
  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await phoenix.owner()).to.equal(owner.address);
    });

    it("Should start with zero questions", async function () {
      expect(await phoenix.getQuestionCount()).to.equal(0);
    });

    it("Should have correct ask fee", async function () {
      expect(await phoenix.ASK_FEE()).to.equal(ASK_FEE);
    });
  });

  // ── Post Question ─────────────────────────────────
  describe("Post Question", function () {
    it("Should post a question successfully", async function () {
      await phoenix.connect(asker).postQuestion(
        "What is the best DeFi strategy?",
        "DeFi",
        { value: ASK_FEE }
      );
      expect(await phoenix.getQuestionCount()).to.equal(1);
    });

    it("Should reject question below minimum fee", async function () {
      await expect(
        phoenix.connect(asker).postQuestion(
          "Test question", "General",
          { value: ethers.parseEther("0.0001") }
        )
      ).to.be.revertedWith("Minimum fee is 0.001 ETH");
    });

    it("Should reject empty question", async function () {
      await expect(
        phoenix.connect(asker).postQuestion("", "General", { value: ASK_FEE })
      ).to.be.revertedWith("Question cannot be empty");
    });

    it("Should emit QuestionPosted event", async function () {
      await expect(
        phoenix.connect(asker).postQuestion(
          "Best crypto wallet?", "Security",
          { value: ASK_FEE }
        )
      ).to.emit(phoenix, "QuestionPosted");
    });

    it("Should split fee — owner gets 20%", async function () {
      const before  = await ethers.provider.getBalance(owner.address);
      await phoenix.connect(asker).postQuestion(
        "Test?", "General", { value: ASK_FEE }
      );
      const after = await ethers.provider.getBalance(owner.address);
      const ownerCut = ASK_FEE * 20n / 100n;
      expect(after - before).to.be.closeTo(ownerCut, ethers.parseEther("0.0001"));
    });
  });

  // ── Post Answer ───────────────────────────────────
  describe("Post Answer", function () {
    beforeEach(async function () {
      await phoenix.connect(asker).postQuestion(
        "How to stay safe in crypto?", "Security",
        { value: ASK_FEE }
      );
    });

    it("Should post an answer successfully", async function () {
      await phoenix.connect(answerer1).postAnswer(1, "Use a hardware wallet!");
      const question = await phoenix.getQuestion(1);
      expect(question.answerCount).to.equal(1);
    });

    it("Should reject empty answer", async function () {
      await expect(
        phoenix.connect(answerer1).postAnswer(1, "")
      ).to.be.revertedWith("Answer cannot be empty");
    });

    it("Should prevent asker from answering own question", async function () {
      await expect(
        phoenix.connect(asker).postAnswer(1, "Self answer")
      ).to.be.revertedWith("Cannot answer your own question");
    });

    it("Should emit AnswerPosted event", async function () {
      await expect(
        phoenix.connect(answerer1).postAnswer(1, "Great answer here!")
      ).to.emit(phoenix, "AnswerPosted");
    });
  });

  // ── Pick Best Answer ──────────────────────────────
  describe("Pick Best Answer", function () {
    beforeEach(async function () {
      await phoenix.connect(asker).postQuestion(
        "Best blockchain for DApps?", "Development",
        { value: ASK_FEE }
      );
      await phoenix.connect(answerer1).postAnswer(1, "Ethereum for security.");
      await phoenix.connect(answerer2).postAnswer(1, "Base for low fees!");
    });

    it("Should pick best answer and close question", async function () {
      await phoenix.connect(asker).pickBestAnswer(1, 2);
      const question = await phoenix.getQuestion(1);
      expect(question.isOpen).to.be.false;
      expect(question.bestAnswerId).to.equal(2);
    });

    it("Should pay out 80% of tip pool to answerer", async function () {
      const before  = await ethers.provider.getBalance(answerer2.address);
      await phoenix.connect(asker).pickBestAnswer(1, 2);
      const after   = await ethers.provider.getBalance(answerer2.address);
      expect(after).to.be.gt(before);
    });

    it("Should prevent non-asker from picking best answer", async function () {
      await expect(
        phoenix.connect(answerer1).pickBestAnswer(1, 2)
      ).to.be.revertedWith("Only the asker can pick best answer");
    });

    it("Should prevent picking best answer twice", async function () {
      await phoenix.connect(asker).pickBestAnswer(1, 1);
      await expect(
        phoenix.connect(asker).pickBestAnswer(1, 2)
      ).to.be.revertedWith("Question is closed");
    });

    it("Should emit BestAnswerPicked event", async function () {
      await expect(
        phoenix.connect(asker).pickBestAnswer(1, 1)
      ).to.emit(phoenix, "BestAnswerPicked");
    });
  });
});
