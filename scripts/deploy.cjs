const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const RPC_URL = process.env.RPC_URL || "http://127.0.0.1:8545";
const PRIVATE_KEY = process.env.DEPLOYER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const network = await provider.getNetwork();

  console.log(`\n══════════════════════════════════════`);
  console.log(`  ChainLog Capsule — Deploy`);
  console.log(`  RPC:      ${RPC_URL}`);
  console.log(`  Chain ID: ${network.chainId}`);
  console.log(`  Deployer: ${wallet.address}`);
  const balance = await provider.getBalance(wallet.address);
  console.log(`  Balance:  ${ethers.formatEther(balance)} ETH`);
  console.log(`══════════════════════════════════════\n`);

  const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ChainLogCapsule.sol", "ChainLogCapsule.json");
  if (!fs.existsSync(artifactPath)) {
    console.error("Artifact not found. Run `npx hardhat compile --config hardhat.config.cjs` first.");
    process.exit(1);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

  console.log("Deploying ChainLogCapsule...");
  const treasury = wallet.address;
  const capsule = await factory.deploy(treasury);
  await capsule.waitForDeployment();

  const addr = await capsule.getAddress();
  console.log(`\n✅ ChainLogCapsule deployed!`);
  console.log(`   Address:  ${addr}`);
  console.log(`   Treasury: ${treasury}`);
  console.log(`   Chain ID: ${network.chainId}`);
  console.log(`   Tx Hash:  ${capsule.deploymentTransaction()?.hash}`);

  // Verify basic functionality
  console.log(`\n   Verifying...`);
  const nextId = await capsule.nextCapsuleId();
  console.log(`   nextCapsuleId: ${nextId}`);
  const penaltyBps = await capsule.earlyUnlockPenaltyBps();
  console.log(`   penaltyBps: ${penaltyBps}`);
  const owner = await capsule.owner();
  console.log(`   owner: ${owner}`);

  console.log(`\n📋 Contract Address: ${addr}\n`);

  // Save deployment info
  const deployInfo = {
    address: addr,
    chainId: Number(network.chainId),
    deployer: wallet.address,
    treasury,
    timestamp: new Date().toISOString(),
    txHash: capsule.deploymentTransaction()?.hash,
  };

  const deploymentsDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
  const filename = `chainlog-capsule-${network.chainId}.json`;
  fs.writeFileSync(path.join(deploymentsDir, filename), JSON.stringify(deployInfo, null, 2));
  console.log(`Deployment info saved to deployments/${filename}`);
}

main().catch(console.error);
