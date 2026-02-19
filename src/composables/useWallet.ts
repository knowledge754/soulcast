/**
 * useWallet — Web3 钱包连接 composable
 * 支持 MetaMask、TokenPocket、Binance Web3 Wallet、OKX Wallet 等
 * 使用原生 EIP-1193 provider API
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/app'

/* ── 类型定义 ── */
export interface WalletProvider {
  id: string
  name: string
  icon: string          // SVG icon path data (Lucide style)
  color: string         // 品牌渐变色
  description: string
  downloadUrl: string
  detected: boolean     // 是否检测到已安装
}

export interface WalletState {
  connected: boolean
  address: string
  shortAddress: string
  chainId: number
  chainName: string
  balance: string
  providerName: string
}

/* ── 链信息映射 ── */
const CHAIN_MAP: Record<number, string> = {
  1: 'Ethereum Mainnet',
  5: 'Goerli Testnet',
  11155111: 'Sepolia Testnet',
  56: 'BNB Smart Chain',
  97: 'BSC Testnet',
  137: 'Polygon',
  42161: 'Arbitrum One',
  10: 'Optimism',
  8453: 'Base',
  43114: 'Avalanche',
  250: 'Fantom',
}

/* ── ethereum provider 类型扩展 ── */
interface EthereumProvider {
  isMetaMask?: boolean
  isTokenPocket?: boolean
  isBinance?: boolean
  isOKExWallet?: boolean
  isOkxWallet?: boolean
  isTrust?: boolean
  isCoinbaseWallet?: boolean
  isImToken?: boolean
  isOneKey?: boolean
  isHuobiWallet?: boolean
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener: (event: string, handler: (...args: unknown[]) => void) => void
  providers?: EthereumProvider[]
}

declare global {
  interface Window {
    ethereum?: EthereumProvider
    okxwallet?: EthereumProvider
    tokenpocket?: { ethereum?: EthereumProvider }
    BinanceChain?: EthereumProvider
    imToken?: boolean
    onekey?: { ethereum?: EthereumProvider }
    $onekey?: { ethereum?: EthereumProvider }
  }
}

/* ── 工具函数 ── */
function shortenAddress(addr: string): string {
  if (!addr) return ''
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

function hexToNumber(hex: string): number {
  return parseInt(hex, 16)
}

async function getBalance(provider: EthereumProvider, address: string): Promise<string> {
  try {
    const balanceHex = await provider.request({
      method: 'eth_getBalance',
      params: [address, 'latest']
    }) as string
    const balanceWei = BigInt(balanceHex)
    const balanceEth = Number(balanceWei) / 1e18
    return balanceEth.toFixed(4)
  } catch {
    return '0.0000'
  }
}

/* ── Composable ── */
export function useWallet() {
  const appStore = useAppStore()

  const state = ref<WalletState>({
    connected: false,
    address: '',
    shortAddress: '',
    chainId: 0,
    chainName: '',
    balance: '0',
    providerName: ''
  })

  const showModal = computed({
    get: () => appStore.showWalletModal,
    set: (v: boolean) => { appStore.showWalletModal = v }
  })
  const connecting = ref(false)
  const error = ref('')
  let currentProvider: EthereumProvider | null = null

  /* ── 钱包列表（包含检测） ── */
  const walletList = computed<WalletProvider[]>(() => {
    const eth = window.ethereum
    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        icon: 'metamask',
        color: 'linear-gradient(135deg, #E2761B, #CD6116)',
        description: '最流行的浏览器钱包插件',
        downloadUrl: 'https://metamask.io/download/',
        detected: !!eth?.isMetaMask || !!getSpecificProvider('metamask')
      },
      {
        id: 'tokenpocket',
        name: 'TokenPocket',
        icon: 'tokenpocket',
        color: 'linear-gradient(135deg, #2980FE, #1A6AFF)',
        description: '多链数字资产钱包',
        downloadUrl: 'https://www.tokenpocket.pro/',
        detected: !!eth?.isTokenPocket || !!window.tokenpocket?.ethereum
      },
      {
        id: 'binance',
        name: 'Binance Web3',
        icon: 'binance',
        color: 'linear-gradient(135deg, #F0B90B, #F8D12F)',
        description: '币安官方 Web3 钱包',
        downloadUrl: 'https://www.binance.com/web3wallet',
        detected: !!eth?.isBinance || !!window.BinanceChain
      },
      {
        id: 'okx',
        name: 'OKX Wallet',
        icon: 'okx',
        color: 'linear-gradient(135deg, #FFFFFF, #C4C4C4)',
        description: 'OKX 多链钱包',
        downloadUrl: 'https://www.okx.com/web3',
        detected: !!window.okxwallet || !!eth?.isOKExWallet || !!eth?.isOkxWallet
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        icon: 'trust',
        color: 'linear-gradient(135deg, #3375BB, #0500FF)',
        description: '安全可信赖的多链钱包',
        downloadUrl: 'https://trustwallet.com/',
        detected: !!eth?.isTrust
      },
      {
        id: 'imtoken',
        name: 'imToken',
        icon: 'imtoken',
        color: 'linear-gradient(135deg, #11C4D1, #0062AD)',
        description: '去中心化数字钱包',
        downloadUrl: 'https://token.im/',
        detected: !!window.imToken || !!eth?.isImToken
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: 'coinbase',
        color: 'linear-gradient(135deg, #0052FF, #0039B3)',
        description: 'Coinbase 官方钱包',
        downloadUrl: 'https://www.coinbase.com/wallet',
        detected: !!eth?.isCoinbaseWallet
      },
      {
        id: 'huobi',
        name: '火币钱包',
        icon: 'huobi',
        color: 'linear-gradient(135deg, #2DAF68, #1B8A4E)',
        description: '火币生态链官方钱包',
        downloadUrl: 'https://www.htx.com/wallet',
        detected: !!eth?.isHuobiWallet
      },
      {
        id: 'onekey',
        name: 'OneKey',
        icon: 'onekey',
        color: 'linear-gradient(135deg, #00B812, #009A0F)',
        description: '开源硬件钱包',
        downloadUrl: 'https://onekey.so/',
        detected: !!window.onekey?.ethereum || !!window.$onekey?.ethereum || !!eth?.isOneKey
      },
      {
        id: 'ledger',
        name: 'Ledger',
        icon: 'ledger',
        color: 'linear-gradient(135deg, #000000, #333333)',
        description: '硬件冷钱包，需通过 Ledger Live 连接',
        downloadUrl: 'https://www.ledger.com/',
        detected: false
      },
      {
        id: 'trezor',
        name: 'Trezor',
        icon: 'trezor',
        color: 'linear-gradient(135deg, #001E2B, #00854D)',
        description: '硬件冷钱包，需通过 Trezor Suite 连接',
        downloadUrl: 'https://trezor.io/',
        detected: false
      }
    ]
  })

  /* ── 获取特定 Provider ── */
  function getSpecificProvider(walletId: string): EthereumProvider | null {
    const eth = window.ethereum
    if (!eth) return null

    // 多 provider 注入场景 (EIP-5749)
    if (eth.providers && Array.isArray(eth.providers)) {
      for (const p of eth.providers) {
        if (walletId === 'metamask' && p.isMetaMask) return p
        if (walletId === 'tokenpocket' && p.isTokenPocket) return p
        if (walletId === 'coinbase' && p.isCoinbaseWallet) return p
        if (walletId === 'imtoken' && p.isImToken) return p
        if (walletId === 'onekey' && p.isOneKey) return p
      }
    }

    // 特定全局对象
    if (walletId === 'okx' && window.okxwallet) return window.okxwallet
    if (walletId === 'tokenpocket' && window.tokenpocket?.ethereum) return window.tokenpocket.ethereum
    if (walletId === 'binance' && window.BinanceChain) return window.BinanceChain
    if (walletId === 'onekey' && (window.onekey?.ethereum || window.$onekey?.ethereum)) {
      return window.onekey?.ethereum || window.$onekey?.ethereum || null
    }
    // Ledger & Trezor connect via MetaMask/generic ethereum
    if (walletId === 'ledger' || walletId === 'trezor') return eth

    // 回退到默认 ethereum
    return eth
  }

  /* ── 连接钱包 ── */
  async function connectWallet(walletId: string) {
    connecting.value = true
    error.value = ''

    try {
      const provider = getSpecificProvider(walletId)
      if (!provider) {
        const wallet = walletList.value.find(w => w.id === walletId)
        if (wallet?.downloadUrl) {
          window.open(wallet.downloadUrl, '_blank')
        }
        error.value = '未检测到该钱包，请先安装'
        connecting.value = false
        return
      }

      currentProvider = provider

      // 请求连接
      const accounts = await provider.request({
        method: 'eth_requestAccounts'
      }) as string[]

      if (!accounts || accounts.length === 0) {
        error.value = '用户拒绝了连接'
        connecting.value = false
        return
      }

      const address = accounts[0]
      const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
      const chainId = hexToNumber(chainIdHex)
      const balance = await getBalance(provider, address)
      const walletInfo = walletList.value.find(w => w.id === walletId)

      state.value = {
        connected: true,
        address,
        shortAddress: shortenAddress(address),
        chainId,
        chainName: CHAIN_MAP[chainId] || `Chain ${chainId}`,
        balance: `${balance} ETH`,
        providerName: walletInfo?.name || walletId
      }

      // 持久化到 localStorage
      localStorage.setItem('chainlog_wallet', JSON.stringify({
        walletId,
        address,
        chainId
      }))

      showModal.value = false
      setupListeners(provider)
    } catch (err: unknown) {
      const e = err as { code?: number; message?: string }
      if (e.code === 4001) {
        error.value = '用户取消了连接'
      } else {
        error.value = e.message || '连接失败，请重试'
      }
    } finally {
      connecting.value = false
    }
  }

  /* ── 断开钱包 ── */
  function disconnectWallet() {
    if (currentProvider) {
      removeListeners(currentProvider)
    }
    currentProvider = null
    state.value = {
      connected: false,
      address: '',
      shortAddress: '',
      chainId: 0,
      chainName: '',
      balance: '0',
      providerName: ''
    }
    localStorage.removeItem('chainlog_wallet')
  }

  /* ── 监听事件 ── */
  function handleAccountsChanged(accounts: unknown) {
    const accs = accounts as string[]
    if (!accs || accs.length === 0) {
      disconnectWallet()
    } else {
      state.value.address = accs[0]
      state.value.shortAddress = shortenAddress(accs[0])
      if (currentProvider) {
        getBalance(currentProvider, accs[0]).then(bal => {
          state.value.balance = `${bal} ETH`
        })
      }
    }
  }

  function handleChainChanged(chainId: unknown) {
    const id = hexToNumber(chainId as string)
    state.value.chainId = id
    state.value.chainName = CHAIN_MAP[id] || `Chain ${id}`
    // 刷新余额
    if (currentProvider && state.value.address) {
      getBalance(currentProvider, state.value.address).then(bal => {
        state.value.balance = `${bal} ETH`
      })
    }
  }

  function setupListeners(provider: EthereumProvider) {
    provider.on('accountsChanged', handleAccountsChanged)
    provider.on('chainChanged', handleChainChanged)
  }

  function removeListeners(provider: EthereumProvider) {
    provider.removeListener('accountsChanged', handleAccountsChanged)
    provider.removeListener('chainChanged', handleChainChanged)
  }

  /* ── 尝试自动恢复连接 ── */
  async function tryAutoConnect() {
    try {
      const saved = localStorage.getItem('chainlog_wallet')
      if (!saved) return

      const { walletId } = JSON.parse(saved)
      const provider = getSpecificProvider(walletId)
      if (!provider) return

      const accounts = await provider.request({ method: 'eth_accounts' }) as string[]
      if (accounts && accounts.length > 0) {
        currentProvider = provider
        const chainIdHex = await provider.request({ method: 'eth_chainId' }) as string
        const chainId = hexToNumber(chainIdHex)
        const balance = await getBalance(provider, accounts[0])
        const walletInfo = walletList.value.find(w => w.id === walletId)

        state.value = {
          connected: true,
          address: accounts[0],
          shortAddress: shortenAddress(accounts[0]),
          chainId,
          chainName: CHAIN_MAP[chainId] || `Chain ${chainId}`,
          balance: `${balance} ETH`,
          providerName: walletInfo?.name || walletId
        }
        setupListeners(provider)
      }
    } catch {
      // silent fail
    }
  }

  /* ── 弹窗控制 ── */
  function openModal() {
    error.value = ''
    showModal.value = true
  }

  function closeModal() {
    showModal.value = false
    error.value = ''
  }

  watch(state, (s) => {
    appStore.setWalletState(s.connected, s.address, s.shortAddress, s.providerName, s.balance)
  }, { deep: true })

  /* ── 生命周期 ── */
  onMounted(() => {
    tryAutoConnect()
  })

  onUnmounted(() => {
    if (currentProvider) {
      removeListeners(currentProvider)
    }
  })

  return {
    state,
    showModal,
    connecting,
    error,
    walletList,
    connectWallet,
    disconnectWallet,
    openModal,
    closeModal
  }
}
