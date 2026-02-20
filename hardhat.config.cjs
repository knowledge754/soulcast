const DEPLOYER_KEY = process.env.DEPLOYER_KEY || "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
      viaIR: true,
    },
  },
  paths: {
    sources: "./contracts",
    artifacts: "./artifacts",
    cache: "./cache",
  },
  networks: {
    hardhat: {
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    bscTestnet: {
      url: "https://data-seed-prebsc-1-s1.binance.org:8545",
      chainId: 97,
      accounts: [DEPLOYER_KEY],
    },
    sepolia: {
      url: process.env.SEPOLIA_RPC || "https://rpc.sepolia.org",
      chainId: 11155111,
      accounts: [DEPLOYER_KEY],
    },
    baseTestnet: {
      url: "https://sepolia.base.org",
      chainId: 84532,
      accounts: [DEPLOYER_KEY],
    },
    avalancheTestnet: {
      url: "https://api.avax-test.network/ext/bc/C/rpc",
      chainId: 43113,
      accounts: [DEPLOYER_KEY],
    },
  },
};
