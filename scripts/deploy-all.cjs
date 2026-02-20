/**
 * 一键多链部署 — ChainLog Capsule
 *
 * 用法:
 *   设置环境变量 DEPLOYER_KEY 为你的私钥，然后运行:
 *   node scripts/deploy-all.cjs
 *
 *   或者只部署到特定网络:
 *   node scripts/deploy-all.cjs bscTestnet
 *   node scripts/deploy-all.cjs sepolia
 */
const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

const PRIVATE_KEY = process.env.DEPLOYER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

const NETWORKS = {
  localhost: {
    rpc: "http://127.0.0.1:8545",
    chainId: 31337,
    name: "Localhost (Hardhat)",
    chainsTsVar: "LOCAL_CONTRACT",
  },
  bscTestnet: {
    rpc: "https://data-seed-prebsc-1-s1.binance.org:8545",
    chainId: 97,
    name: "BSC Testnet",
    chainsTsVar: "BSC_TESTNET_CONTRACT",
  },
  sepolia: {
    rpc: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
    chainId: 11155111,
    name: "Sepolia Testnet",
    chainsTsVar: "SEPOLIA_CONTRACT",
  },
  avalancheFuji: {
    rpc: "https://api.avax-test.network/ext/bc/C/rpc",
    chainId: 43113,
    name: "Avalanche Fuji",
    chainsTsVar: "FUJI_CONTRACT",
  },
};

async function deployTo(networkKey) {
  const net = NETWORKS[networkKey];
  if (!net) {
    console.error(`Unknown network: ${networkKey}`);
    return null;
  }

  console.log(`\n── Deploying to ${net.name} (${networkKey}) ──`);

  try {
    const provider = new ethers.JsonRpcProvider(net.rpc);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    const balance = await provider.getBalance(wallet.address);

    console.log(`   Deployer: ${wallet.address}`);
    console.log(`   Balance:  ${ethers.formatEther(balance)} native`);

    if (balance === 0n && networkKey !== "localhost") {
      console.log(`   ⚠️  No balance! Get testnet tokens from faucet first.`);
      console.log(`   Faucets:`);
      if (networkKey === "bscTestnet") console.log(`     https://www.bnbchain.org/en/testnet-faucet`);
      if (networkKey === "sepolia") console.log(`     https://sepoliafaucet.com`);
      if (networkKey === "avalancheFuji") console.log(`     https://faucet.avax.network`);
      console.log(`   Skipping ${networkKey}...`);
      return null;
    }

    const artifactPath = path.join(__dirname, "..", "artifacts", "contracts", "ChainLogCapsule.sol", "ChainLogCapsule.json");
    if (!fs.existsSync(artifactPath)) {
      console.log(`   ❌ Artifact not found. Run 'npx hardhat compile' first.`);
      return null;
    }

    const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
    const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);

    console.log(`   Sending deploy tx...`);
    const capsule = await factory.deploy(wallet.address);
    console.log(`   Waiting for confirmation...`);
    await capsule.waitForDeployment();
    const addr = await capsule.getAddress();

    console.log(`   ✅ Deployed: ${addr}`);
    console.log(`   TX: ${capsule.deploymentTransaction()?.hash}`);

    const deploymentsDir = path.join(__dirname, "..", "deployments");
    if (!fs.existsSync(deploymentsDir)) fs.mkdirSync(deploymentsDir, { recursive: true });
    fs.writeFileSync(
      path.join(deploymentsDir, `chainlog-capsule-${net.chainId}.json`),
      JSON.stringify({
        address: addr,
        chainId: net.chainId,
        network: networkKey,
        deployer: wallet.address,
        timestamp: new Date().toISOString(),
        txHash: capsule.deploymentTransaction()?.hash,
      }, null, 2)
    );

    return { networkKey, address: addr, chainId: net.chainId, varName: net.chainsTsVar };
  } catch (err) {
    console.log(`   ❌ Failed: ${err.message}`);
    if (err.message.includes("insufficient funds")) {
      console.log(`   → Need testnet tokens. Visit faucet for ${net.name}.`);
    }
    return null;
  }
}

async function main() {
  const target = process.argv[2];
  const targets = target ? [target] : Object.keys(NETWORKS);

  console.log("╔════════════════════════════════════════════╗");
  console.log("║  ChainLog Capsule — Multi-Chain Deploy     ║");
  console.log("╚════════════════════════════════════════════╝");

  const wallet = new ethers.Wallet(PRIVATE_KEY);
  console.log(`\nDeployer address: ${wallet.address}`);
  console.log(`Networks: ${targets.join(", ")}\n`);

  const results = [];
  for (const net of targets) {
    const r = await deployTo(net);
    if (r) results.push(r);
  }

  if (results.length === 0) {
    console.log("\n⚠️  No successful deployments.");
    console.log("   Make sure your deployer wallet has testnet tokens.");
    return;
  }

  console.log("\n╔════════════════════════════════════════════╗");
  console.log("║          Deployment Summary                ║");
  console.log("╚════════════════════════════════════════════╝");
  for (const r of results) {
    console.log(`  ${r.networkKey.padEnd(16)} → ${r.address}`);
  }

  console.log("\n🔧 Updating src/services/blockchain/chains.ts ...");
  const chainsPath = path.join(__dirname, "..", "src", "services", "blockchain", "chains.ts");
  let chainsContent = fs.readFileSync(chainsPath, "utf-8");

  for (const r of results) {
    const regex = new RegExp(`(const ${r.varName} = ')([^']*)(')`);
    if (regex.test(chainsContent)) {
      chainsContent = chainsContent.replace(regex, `$1${r.address}$3`);
      console.log(`   ✅ ${r.varName} → ${r.address}`);
    } else {
      console.log(`   ⚠️ Could not find ${r.varName} in chains.ts`);
    }
  }

  fs.writeFileSync(chainsPath, chainsContent);
  console.log("\n✅ Done! Refresh your browser to use the new contracts.\n");
}

main().catch(console.error);
