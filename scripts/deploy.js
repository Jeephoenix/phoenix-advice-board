const { ethers } = require("hardhat");
const fs   = require("fs");
const path = require("path");

async function main() {
  console.log("\n🔥 Deploying Phoenix Advice Board...\n");

  const [deployer] = await ethers.getSigners();
  console.log("📬 Deployer    :", deployer.address);

  const balance = await deployer.provider.getBalance(deployer.address);
  console.log("💰 Balance     :", ethers.formatEther(balance), "ETH\n");

  const Phoenix = await ethers.getContractFactory("PhoenixAdviceBoard");
  const phoenix = await Phoenix.deploy();
  await phoenix.waitForDeployment();

  const address = await phoenix.getAddress();
  console.log("✅ Deployed to :", address);
  console.log("🌐 Network     :", hre.network.name);

  // Save deployment info for frontend
  const artifactPath = path.join(
    __dirname,
    "../artifacts/contracts/PhoenixAdviceBoard.sol/PhoenixAdviceBoard.json"
  );
  const artifact = JSON.parse(fs.readFileSync(artifactPath));

  const deploymentInfo = {
    contractAddress : address,
    deployer        : deployer.address,
    network         : hre.network.name,
    chainId         : hre.network.config.chainId,
    deployedAt      : new Date().toISOString(),
    abi             : artifact.abi
  };

  const outputPath = path.join(
    __dirname,
    "../frontend/src/utils/deploymentInfo.json"
  );

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));

  console.log("\n📄 Deployment info saved to frontend/src/utils/");
  console.log("\n🎉 Phoenix Advice Board is live!\n");

  if (hre.network.name !== "hardhat") {
    console.log("🔍 Verify with:");
    console.log(`npx hardhat verify --network ${hre.network.name} ${address}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => { console.error("❌", err); process.exit(1); });
