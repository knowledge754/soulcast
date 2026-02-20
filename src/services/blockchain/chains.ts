export type ChainType = 'evm' | 'solana' | 'sui'

export interface ChainConfig {
  key: string
  name: string
  symbol: string
  type: ChainType
  chainId?: number
  rpcUrl: string
  explorerUrl: string
  capsuleContract: string
  color: string
  fee: string
  icon: string
  nativeCurrency: {
    name: string
    symbol: string
    decimals: number
  }
}

// Hardhat 本地节点部署的合约地址
const LOCAL_CONTRACT = '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0'

// 测试网合约地址 — 部署后由 deploy-all.cjs 自动回写
const BSC_TESTNET_CONTRACT = '0x0000000000000000000000000000000000000000'
const SEPOLIA_CONTRACT = '0x0000000000000000000000000000000000000000'
const FUJI_CONTRACT = '0x0000000000000000000000000000000000000000'

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
    name: 'BSC Testnet',
    symbol: 'tBNB',
    type: 'evm',
    chainId: 97,
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    explorerUrl: 'https://testnet.bscscan.com',
    capsuleContract: BSC_TESTNET_CONTRACT,
    color: '#F0B90B',
    fee: '~$0.01',
    icon: 'hexagon',
    nativeCurrency: { name: 'BNB', symbol: 'tBNB', decimals: 18 },
  },
  ethereum: {
    key: 'ethereum',
    name: 'Sepolia',
    symbol: 'SepoliaETH',
    type: 'evm',
    chainId: 11155111,
    rpcUrl: 'https://rpc.sepolia.org',
    explorerUrl: 'https://sepolia.etherscan.io',
    capsuleContract: SEPOLIA_CONTRACT,
    color: '#627EEA',
    fee: '~$0.05',
    icon: 'hexagon',
    nativeCurrency: { name: 'Sepolia Ether', symbol: 'SepoliaETH', decimals: 18 },
  },
  avalanche: {
    key: 'avalanche',
    name: 'Fuji (AVAX)',
    symbol: 'AVAX',
    type: 'evm',
    chainId: 43113,
    rpcUrl: 'https://api.avax-test.network/ext/bc/C/rpc',
    explorerUrl: 'https://testnet.snowtrace.io',
    capsuleContract: FUJI_CONTRACT,
    color: '#E84142',
    fee: '~$0.005',
    icon: 'hexagon',
    nativeCurrency: { name: 'Avalanche', symbol: 'AVAX', decimals: 18 },
  },
  solana: {
    key: 'solana',
    name: 'Solana Devnet',
    symbol: 'SOL',
    type: 'solana',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://solscan.io',
    capsuleContract: '11111111111111111111111111111111',
    color: '#9945FF',
    fee: '~$0.001',
    icon: 'hexagon',
    nativeCurrency: { name: 'Solana', symbol: 'SOL', decimals: 9 },
  },
  sui: {
    key: 'sui',
    name: 'Sui Testnet',
    symbol: 'SUI',
    type: 'sui',
    rpcUrl: 'https://fullnode.testnet.sui.io',
    explorerUrl: 'https://suiscan.xyz/testnet',
    capsuleContract: '0x0000000000000000000000000000000000000000000000000000000000000000',
    color: '#4DA2FF',
    fee: '~$0.002',
    icon: 'hexagon',
    nativeCurrency: { name: 'Sui', symbol: 'SUI', decimals: 9 },
  },
}

export const EVM_CHAINS = Object.values(CHAINS).filter(c => c.type === 'evm')
export const CHAIN_LIST = Object.values(CHAINS)

export function getChainByChainId(chainId: number): ChainConfig | undefined {
  return EVM_CHAINS.find(c => c.chainId === chainId)
}

export function getRpcUrl(chain: ChainConfig): string {
  return chain.rpcUrl
}

export function getContractAddress(chain: ChainConfig): string {
  return chain.capsuleContract
}
