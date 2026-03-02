// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title Phoenix Advice Board
/// @notice A decentralized paid advice board on Base blockchain
/// @dev Users pay to ask questions and tip the best answer

contract PhoenixAdviceBoard {

    // ── Constants ─────────────────────────────────────
    uint256 public constant ASK_FEE         = 0.0001 ether;  // Updated fee
    uint256 public constant OWNER_SHARE     = 20;   // 20%
    uint256 public constant ANSWERER_SHARE  = 80;   // 80%

    // ── Structs ───────────────────────────────────────
    struct Answer {
        uint256 id;
        address payable answerer;
        string  content;
        uint256 tipAmount;
        bool    isBest;
        uint256 createdAt;
    }

    struct Question {
        uint256  id;
        address  payable asker;
        string   content;
        string   category;
        uint256  tipPool;
        bool     isOpen;
        bool     bestAnswerPicked;
        uint256  answerCount;
        uint256  createdAt;
        uint256  bestAnswerId;
    }

    // ── State Variables ───────────────────────────────
    address payable public owner;
    uint256 public questionCount;
    uint256 public totalFeesCollected;
    uint256 public totalTipsDistributed;

    mapping(uint256 => Question)                    public questions;
    mapping(uint256 => mapping(uint256 => Answer))  public answers;
    mapping(address => uint256)                     public questionsAsked;
    mapping(address => uint256)                     public answersGiven;
    mapping(address => uint256)                     public tipsEarned;

    // ── Events ────────────────────────────────────────
    event QuestionPosted(
        uint256 indexed id,
        address indexed asker,
        string  content,
        string  category,
        uint256 tipPool
    );

    event AnswerPosted(
        uint256 indexed questionId,
        uint256 indexed answerId,
        address indexed answerer,
        string  content
    );

    event BestAnswerPicked(
        uint256 indexed questionId,
        uint256 indexed answerId,
        address indexed answerer,
        uint256 answererPayout,
        uint256 ownerPayout
    );

    event TipAdded(
        uint256 indexed questionId,
        address indexed tipper,
        uint256 amount
    );

    // ── Modifiers ─────────────────────────────────────
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the owner");
        _;
    }

    modifier questionExists(uint256 _id) {
        require(_id > 0 && _id <= questionCount, "Question not found");
        _;
    }

    modifier questionOpen(uint256 _id) {
        require(questions[_id].isOpen, "Question is closed");
        _;
    }

    // ── Constructor ───────────────────────────────────
    constructor() {
        owner = payable(msg.sender);
    }

    // ── Core Functions ────────────────────────────────

    /// @notice Post a new question with ETH tip pool
    /// @param _content The question text
    /// @param _category The question category
    function postQuestion(
        string memory _content,
        string memory _category
    ) external payable {
        require(msg.value >= ASK_FEE, "Minimum fee is 0.0001 ETH");
        require(bytes(_content).length > 0, "Question cannot be empty");
        require(bytes(_category).length > 0, "Category cannot be empty");

        // Owner takes 20% of ask fee immediately
        uint256 ownerCut    = (msg.value * OWNER_SHARE) / 100;
        uint256 tipPool     = msg.value - ownerCut;

        owner.transfer(ownerCut);
        totalFeesCollected += ownerCut;

        questionCount++;
        questions[questionCount] = Question({
            id                  : questionCount,
            asker               : payable(msg.sender),
            content             : _content,
            category            : _category,
            tipPool             : tipPool,
            isOpen              : true,
            bestAnswerPicked    : false,
            answerCount         : 0,
            createdAt           : block.timestamp,
            bestAnswerId        : 0
        });

        questionsAsked[msg.sender]++;

        emit QuestionPosted(
            questionCount,
            msg.sender,
            _content,
            _category,
            tipPool
        );
    }

    /// @notice Post an answer to a question
    /// @param _questionId The ID of the question to answer
    /// @param _content The answer text
    function postAnswer(
        uint256 _questionId,
        string memory _content
    )
        external
        questionExists(_questionId)
        questionOpen(_questionId)
    {
        require(
            msg.sender != questions[_questionId].asker,
            "Cannot answer your own question"
        );
        require(bytes(_content).length > 0, "Answer cannot be empty");

        Question storage q  = questions[_questionId];
        q.answerCount++;
        uint256 answerId    = q.answerCount;

        answers[_questionId][answerId] = Answer({
            id          : answerId,
            answerer    : payable(msg.sender),
            content     : _content,
            tipAmount   : 0,
            isBest      : false,
            createdAt   : block.timestamp
        });

        answersGiven[msg.sender]++;

        emit AnswerPosted(_questionId, answerId, msg.sender, _content);
    }

    /// @notice Pick the best answer and distribute tip pool
    /// @param _questionId The question ID
    /// @param _answerId The answer ID chosen as best
    function pickBestAnswer(
        uint256 _questionId,
        uint256 _answerId
    )
        external
        questionExists(_questionId)
        questionOpen(_questionId)
    {
        Question storage q = questions[_questionId];
        require(msg.sender == q.asker, "Only the asker can pick best answer");
        require(!q.bestAnswerPicked,   "Best answer already picked");
        require(_answerId > 0 && _answerId <= q.answerCount, "Invalid answer");

        Answer storage a = answers[_questionId][_answerId];

        // Calculate payouts from tip pool
        uint256 answererPayout  = (q.tipPool * ANSWERER_SHARE) / 100;
        uint256 ownerPayout     = q.tipPool - answererPayout;

        // Mark best answer
        a.isBest            = true;
        a.tipAmount         = answererPayout;
        q.bestAnswerPicked  = true;
        q.bestAnswerId      = _answerId;
        q.isOpen            = false;

        // Distribute payouts
        a.answerer.transfer(answererPayout);
        owner.transfer(ownerPayout);

        tipsEarned[a.answerer]      += answererPayout;
        totalTipsDistributed        += answererPayout;
        totalFeesCollected          += ownerPayout;

        emit BestAnswerPicked(
            _questionId,
            _answerId,
            a.answerer,
            answererPayout,
            ownerPayout
        );
    }

    /// @notice Add extra tip to an open question's pool
    /// @param _questionId The question to tip
    function addTip(uint256 _questionId)
        external
        payable
        questionExists(_questionId)
        questionOpen(_questionId)
    {
        require(msg.value > 0, "Tip must be greater than 0");
        questions[_questionId].tipPool += msg.value;
        emit TipAdded(_questionId, msg.sender, msg.value);
    }

    // ── View Functions ────────────────────────────────

    function getQuestion(uint256 _id)
        external
        view
        questionExists(_id)
        returns (Question memory)
    {
        return questions[_id];
    }

    function getAnswer(uint256 _questionId, uint256 _answerId)
        external
        view
        returns (Answer memory)
    {
        return answers[_questionId][_answerId];
    }

    function getQuestionCount() external view returns (uint256) {
        return questionCount;
    }

    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    function getStats() external view returns (
        uint256 totalQuestions,
        uint256 feesCollected,
        uint256 tipsDistributed,
        uint256 contractBalance
    ) {
        return (
            questionCount,
            totalFeesCollected,
            totalTipsDistributed,
            address(this).balance
        );
    }
}
