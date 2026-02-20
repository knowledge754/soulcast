export type ChainType = 'evm' | 'solana' | 'sui'

export interface ChainConfig {
  key: string
  name: string
  symbol: string
  type: ChainType
  chainId?: number
  rpcUrl: string
  rpcUrlTestnet?: string
  explorerUrl: string
  capsuleContract: string
  capsuleContractTestnet?: string
  color: string
  fee: string
  icon: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
  ipfsGateway?: string
}

// Hardhat 本地节点部署的合约地址
const LOCAL_CONTRACT = '0x5FbDB2315678afecb367f032d93F642f64180aa3'

export const CHAINS: Record<string, ChainConfig> = {
  localhost: {
    key: 'localhost',
    name: 'Localhost',
    symbol: 'ETH',
    type: 'evm',
    chainId: 31337,
    rpcUrl: 'http://127.0.0.1:8545',
    explorerUrl: 'http://localhost:8545',
    capsuleContract: LOCAL_CONTRACT,
    color: '#22c55e',
    fee: '~$0.00',
    icon: 'hexagon',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  bsc: {
    key: 'bsc',
    name: 'BSC',
    symbol: 'BNB',
    type: 'evm',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    rpcUrlTestnet: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://bscscan.com',
    capsuleContract: '0x0000000000000000000000000000000000000000',
    capsuleContractTestnet: '0x0000000000000000000000000000000000000000',
    color: '#F0B90B',
    fee: '~$0.05',
    icon: 'hexagon',
    nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
  },
  ethereum: {
    key: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    type: 'evm',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    rpcUrlTestnet: 'https://eth-sepolia.g.alchemy.com/v2/demo',
    explorerUrl: 'https://etherscan.io',
    capsuleContract: '0x0000000000000000000000000000000000000000',
    capsuleContractTestnet: '0x0000000000000000000000000000000000000000',
    color: '#627EEA',
    fee: '~$2.5',
    icon: 'hexagon',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  base: {
    key: 'base',
    name: 'Base',
    symbol: 'ETH',
    type: 'evm',
    chainId: 8453,
    rpcUrl: 'https://mainnet.base.org',
    rpcUrlTestnet: 'https://sepolia.base.org',
    explorerUrl: 'https://basescan.org',
    capsuleContract: '0x0000000000000000000000000000000000000000',
    capsuleContractTestnet: '0x0000000000000000000000000000000000000000',
    color: '#0052FF',
    fee: '~$0.005',
    icon: 'hexagon',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
  avalanche: {
    key: 'avalanche',
    name: 'Avalanche',
    symbol: 'AVAX',
    type: 'evm',
    chainId: 43114,
    rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
    rpcUrlTestnet: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://snowtrace.io',
    capsuleContract: '0x0000000000000000000000000000000000000000',
    capsuleContractTestnet: '0x0000000000000000000000000000000000000000',
    color: '#E84142',
    fee: '~$0.01',
    icon: 'hexagon',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  solana: {
    key: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    type: 'solana',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    rpcUrlTestnet: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io',
    capsuleContract: '11111111111111111111111111111111',
    color: '#9945FF',
    fee: '~$0.001',
    icon: 'hexagon',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  },
  sui: {
    key: 'sui',
    name: 'Sui',
    symbol: 'SUI',
    type: 'sui',
    rpcUrl: 'https://fullnode.mainnet.sui.io',
    rpcUrlTestnet: 'https://fullnode.testnet.sui.io',
    explorerUrl: 'https://suiscan.xyz',
    capsuleContract: '0x0000000000000000000000000000000000000000000000000000000000000000',
    color: '#4DA2FF',
    fee: '~$0.002',
    icon: 'hexagon',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
  },
  chainlink: {
    key: 'chainlink',
    name: 'Chainlink',
    symbol: 'LINK',
    type: 'evm',
    chainId: 1,
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/demo',
    explorerUrl: 'https://etherscan.io',
    capsuleContract: '0x0000000000000000000000000000000000000000',
    color: '#375BD2',
    fee: '~$2.0',
    icon: 'hexagon',
    nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  },
}

export const EVM_CHAINS = Object.values(CHAINS).filter(c => c.type === 'evm')
export const CHAIN_LIST = Object.values(CHAINS)

export function getChainByChainId(chainId: number): ChainConfig | undefined {
  return EVM_CHAINS.find(c => c.chainId === chainId)
}

export function isTestnet(): boolean {
  return localStorage.getItem('chainlog_testnet') === 'true'
}

export function getRpcUrl(chain: ChainConfig): string {
  if (chain.key === 'localhost') return chain.rpcUrl
  return (isTestnet() && chain.rpcUrlTestnet) ? chain.rpcUrlTestnet : chain.rpcUrl
}

export function getContractAddress(chain: ChainConfig): string {
  if (chain.key === 'localhost') return chain.capsuleContract
  return (isTestnet() && chain.capsuleContractTestnet)
    ? chain.capsuleContractTestnet
    : chain.capsuleContract
}
