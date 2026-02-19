/**
 * useWallet — Web3 钱包连接 composable
 *
 * 解决 OKX 钱包劫持 window.ethereum 的问题：
 * 当 OKX 安装后，window.ethereum 被 OKX 接管，其上的 isMetaMask / isTokenPocket 等 flag 不可信。
 * 即使在 providers 数组中找到看似正确的 provider，调用 .request() 仍可能弹出 OKX。
 *
 * 策略：
 *   ① EIP-6963 — 钱包主动声明 RDNS 身份（最可靠）
 *   ② 独立全局注入 — window.okxwallet / window.tokenpocket.ethereum 等
 *   ③ providers 数组 — 带 _metamask 真实性校验
 *   ④ window.ethereum — 仅当确认无 OKX 劫持时才使用
 *   ⑤ 绝不使用通用回退 — 找不到就是找不到，不弹错误钱包
 */
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useAppStore } from '../stores/app'

/* ══════════ 类型定义 ══════════ */
export interface WalletProvider {
  id: string
  name: string
  icon: string
  color: string
  description: string
  downloadUrl: string
  detected: boolean
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

interface EIP6963ProviderInfo {
  uuid: string
  name: string
  icon: string
  rdns: string
}

interface EIP6963ProviderDetail {
  info: EIP6963ProviderInfo
  provider: EthereumProvider
}

/* ══════════ 链信息映射 ══════════ */
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

/* ══════════ ethereum provider 类型扩展 ══════════ */
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
  _metamask?: unknown
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
    trustwallet?: EthereumProvider
    coinbaseWalletExtension?: EthereumProvider
    imToken?: boolean
    onekey?: { ethereum?: EthereumProvider }
    $onekey?: { ethereum?: EthereumProvider }
  }
}

/* ══════════ EIP-6963 多钱包发现（模块级单例） ══════════ */
const RDNS_TO_WALLET: Record<string, string> = {
  'io.metamask': 'metamask',
  'io.metamask.flask': 'metamask',
  'io.metamask.mmi': 'metamask',
  'pro.tokenpocket': 'tokenpocket',
  'com.okex.wallet': 'okx',
  'com.okx.wallet': 'okx',
  'com.trustwallet.app': 'trust',
  'com.coinbase.wallet': 'coinbase',
  'com.coinbase': 'coinbase',
  'com.binance.w3w': 'binance',
  'com.binance': 'binance',
  'im.token': 'imtoken',
  'im.token.app': 'imtoken',
  'so.onekey.app.wallet': 'onekey',
}

const eip6963Providers = ref<EIP6963ProviderDetail[]>([])
let eip6963Initialized = false

function initEIP6963() {
  if (eip6963Initialized || typeof window === 'undefined') return
  eip6963Initialized = true

  window.addEventListener('eip6963:announceProvider', ((event: Event) => {
    const detail = (event as CustomEvent).detail as EIP6963ProviderDetail
    if (!detail?.info?.rdns) return
    const idx = eip6963Providers.value.findIndex(d => d.info.rdns === detail.info.rdns)
    if (idx >= 0) {
      const copy = [...eip6963Providers.value]
      copy[idx] = detail
      eip6963Providers.value = copy
    } else {
      eip6963Providers.value = [...eip6963Providers.value, detail]
    }
  }) as EventListener)

  window.dispatchEvent(new Event('eip6963:requestProvider'))
}

initEIP6963()

/* ══════════ EIP-6963 辅助 ══════════ */
function findEIP6963Provider(walletId: string): EthereumProvider | null {
  for (const detail of eip6963Providers.value) {
    if (RDNS_TO_WALLET[detail.info.rdns] === walletId) return detail.provider
  }
  const nameKeywords: Record<string, string[]> = {
    metamask: ['metamask'],
    tokenpocket: ['tokenpocket', 'token pocket'],
    okx: ['okx', 'okex'],
    trust: ['trust wallet'],
    coinbase: ['coinbase'],
    binance: ['binance'],
    imtoken: ['imtoken'],
    onekey: ['onekey'],
    huobi: ['huobi', 'htx'],
  }
  const keywords = nameKeywords[walletId]
  if (keywords) {
    for (const detail of eip6963Providers.value) {
      const n = detail.info.name.toLowerCase()
      if (keywords.some(k => n.includes(k))) return detail.provider
    }
  }
  return null
}

function isDetectedViaEIP6963(walletId: string): boolean {
  for (const detail of eip6963Providers.value) {
    if (RDNS_TO_WALLET[detail.info.rdns] === walletId) return true
  }
  return false
}

/* ══════════ OKX 劫持检测 ══════════ */
function isOKXPresent(): boolean {
  return !!window.okxwallet
    || !!window.ethereum?.isOKExWallet
    || !!window.ethereum?.isOkxWallet
}

/* ══════════ 工具函数 ══════════ */
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

/* ══════════ 诊断日志 ══════════ */
function logWalletDiagnostics() {
  const eth = window.ethereum
  console.group('%c[ChainLog] 钱包环境诊断', 'color:#63b3ed;font-weight:bold')
  console.log('window.ethereum:', eth ? '✅ 存在' : '❌ 不存在')
  if (eth) {
    console.log('  flags:', {
      isMetaMask: !!eth.isMetaMask,
      isOKExWallet: !!eth.isOKExWallet,
      isOkxWallet: !!eth.isOkxWallet,
      isTokenPocket: !!eth.isTokenPocket,
      isTrust: !!eth.isTrust,
      isBinance: !!eth.isBinance,
      isImToken: !!eth.isImToken,
      _metamask: !!(eth as EthereumProvider)._metamask,
    })
    if (eth.providers && Array.isArray(eth.providers)) {
      console.log('  providers 数组:', eth.providers.length, '个')
      eth.providers.forEach((p, i) => {
        console.log(`    [${i}]:`, {
          isMetaMask: !!p.isMetaMask,
          isOKExWallet: !!p.isOKExWallet,
          isOkxWallet: !!p.isOkxWallet,
          isTokenPocket: !!p.isTokenPocket,
          _metamask: !!(p as EthereumProvider)._metamask,
        })
      })
    } else {
      console.log('  providers 数组: 无')
    }
  }
  console.log('window.okxwallet:', window.okxwallet ? '✅' : '❌')
  console.log('window.tokenpocket?.ethereum:', window.tokenpocket?.ethereum ? '✅' : '❌')
  console.log('window.BinanceChain:', window.BinanceChain ? '✅' : '❌')
  console.log('window.trustwallet:', window.trustwallet ? '✅' : '❌')
  console.log('window.$onekey?.ethereum:', window.$onekey?.ethereum ? '✅' : '❌')
  console.log('OKX 劫持 window.ethereum:', isOKXPresent() ? '⚠️ 是' : '否')
  console.log('EIP-6963 已发现:', eip6963Providers.value.map(d => `${d.info.name} (${d.info.rdns})`))
  console.groupEnd()
}

/* ══════════ Composable ══════════ */
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

  /* ── 钱包列表 ── */
  const walletList = computed<WalletProvider[]>(() => {
    const eth = window.ethereum
    const _deps = eip6963Providers.value
    const okxHijack = isOKXPresent()

    return [
      {
        id: 'metamask',
        name: 'MetaMask',
        icon: 'metamask',
        color: 'linear-gradient(135deg, #E2761B, #CD6116)',
        description: '最流行的浏览器钱包插件',
        downloadUrl: 'https://metamask.io/download/',
        detected: isDetectedViaEIP6963('metamask')
          || !!(eth?.providers?.some(p => p.isMetaMask && (p as EthereumProvider)._metamask))
          || (!okxHijack && !!eth?.isMetaMask && !!(eth as EthereumProvider)._metamask)
      },
      {
        id: 'tokenpocket',
        name: 'TokenPocket',
        icon: 'tokenpocket',
        color: 'linear-gradient(135deg, #2980FE, #1A6AFF)',
        description: '多链数字资产钱包',
        downloadUrl: 'https://www.tokenpocket.pro/',
        detected: isDetectedViaEIP6963('tokenpocket')
          || !!window.tokenpocket?.ethereum
      },
      {
        id: 'okx',
        name: 'OKX Wallet',
        icon: 'okx',
        color: 'linear-gradient(135deg, #FFFFFF, #C4C4C4)',
        description: 'OKX 多链钱包',
        downloadUrl: 'https://www.okx.com/web3',
        detected: isDetectedViaEIP6963('okx')
          || !!window.okxwallet
          || !!eth?.isOKExWallet
          || !!eth?.isOkxWallet
      },
      {
        id: 'binance',
        name: 'Binance Web3',
        icon: 'binance',
        color: 'linear-gradient(135deg, #F0B90B, #F8D12F)',
        description: '币安官方 Web3 钱包',
        downloadUrl: 'https://www.binance.com/web3wallet',
        detected: isDetectedViaEIP6963('binance')
          || !!window.BinanceChain
      },
      {
        id: 'trust',
        name: 'Trust Wallet',
        icon: 'trust',
        color: 'linear-gradient(135deg, #3375BB, #0500FF)',
        description: '安全可信赖的多链钱包',
        downloadUrl: 'https://trustwallet.com/',
        detected: isDetectedViaEIP6963('trust')
          || !!window.trustwallet
      },
      {
        id: 'imtoken',
        name: 'imToken',
        icon: 'imtoken',
        color: 'linear-gradient(135deg, #11C4D1, #0062AD)',
        description: '去中心化数字钱包',
        downloadUrl: 'https://token.im/',
        detected: isDetectedViaEIP6963('imtoken')
          || !!window.imToken
      },
      {
        id: 'coinbase',
        name: 'Coinbase Wallet',
        icon: 'coinbase',
        color: 'linear-gradient(135deg, #0052FF, #0039B3)',
        description: 'Coinbase 官方钱包',
        downloadUrl: 'https://www.coinbase.com/wallet',
        detected: isDetectedViaEIP6963('coinbase')
          || !!window.coinbaseWalletExtension
      },
      {
        id: 'huobi',
        name: '火币钱包',
        icon: 'huobi',
        color: 'linear-gradient(135deg, #2DAF68, #1B8A4E)',
        description: '火币生态链官方钱包',
        downloadUrl: 'https://www.htx.com/wallet',
        detected: isDetectedViaEIP6963('huobi')
      },
      {
        id: 'onekey',
        name: 'OneKey',
        icon: 'onekey',
        color: 'linear-gradient(135deg, #00B812, #009A0F)',
        description: '开源硬件钱包',
        downloadUrl: 'https://onekey.so/',
        detected: isDetectedViaEIP6963('onekey')
          || !!window.onekey?.ethereum
          || !!window.$onekey?.ethereum
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

  /* ══════════ 获取特定 Provider ══════════ */
  function getSpecificProvider(walletId: string): EthereumProvider | null {
    const eth = window.ethereum
    const okxHijack = isOKXPresent()

    // ① EIP-6963 — 最可靠，钱包用 RDNS 自证身份
    const eip6963 = findEIP6963Provider(walletId)
    if (eip6963) return eip6963

    // ② 独立全局注入 — 各钱包的专属命名空间，不受 OKX 劫持影响
    if (walletId === 'okx' && window.okxwallet) return window.okxwallet
    if (walletId === 'tokenpocket' && window.tokenpocket?.ethereum) return window.tokenpocket.ethereum
    if (walletId === 'binance' && window.BinanceChain) return window.BinanceChain
    if (walletId === 'trust' && window.trustwallet) return window.trustwallet
    if (walletId === 'coinbase' && window.coinbaseWalletExtension) return window.coinbaseWalletExtension
    if (walletId === 'onekey') {
      const ok = window.$onekey?.ethereum || window.onekey?.ethereum
      if (ok) return ok
    }

    if (!eth) return null

    // ③ providers 数组 — 用 _metamask 等内部属性验证真实性
    if (eth.providers && Array.isArray(eth.providers)) {
      for (const p of eth.providers) {
        switch (walletId) {
          case 'metamask':
            // 真正的 MetaMask 有 _metamask 内部属性
            if (p.isMetaMask && (p as EthereumProvider)._metamask && !p.isOKExWallet && !p.isOkxWallet) return p
            break
          case 'tokenpocket':
            if (p.isTokenPocket && !p.isOKExWallet && !p.isOkxWallet) return p
            break
          case 'coinbase':
            if (p.isCoinbaseWallet) return p
            break
          case 'imtoken':
            if (p.isImToken) return p
            break
          case 'onekey':
            if (p.isOneKey) return p
            break
          case 'trust':
            if (p.isTrust) return p
            break
          case 'okx':
            if (p.isOKExWallet || p.isOkxWallet) return p
            break
          case 'binance':
            if (p.isBinance) return p
            break
          case 'huobi':
            if (p.isHuobiWallet) return p
            break
        }
      }
    }

    // ④ 单 provider — 仅当 OKX 未劫持时才信任 window.ethereum 上的 flag
    if (!okxHijack) {
      if (walletId === 'metamask' && eth.isMetaMask && !eth.isTokenPocket) return eth
      if (walletId === 'tokenpocket' && eth.isTokenPocket && !eth.isMetaMask) return eth
      if (walletId === 'trust' && eth.isTrust) return eth
      if (walletId === 'binance' && eth.isBinance) return eth
      if (walletId === 'imtoken' && eth.isImToken) return eth
      if (walletId === 'coinbase' && eth.isCoinbaseWallet) return eth
      if (walletId === 'huobi' && eth.isHuobiWallet) return eth
      if (walletId === 'onekey' && eth.isOneKey) return eth
    }

    // OKX 本身可以用 window.ethereum
    if (walletId === 'okx' && (eth.isOKExWallet || eth.isOkxWallet)) return eth

    // ⑤ 硬件钱包通过 MetaMask 桥接
    if (walletId === 'ledger' || walletId === 'trezor') {
      const mm = findEIP6963Provider('metamask')
      if (mm) return mm
      const mmFromProviders = eth.providers?.find(
        (p: EthereumProvider) => p.isMetaMask && (p as EthereumProvider)._metamask
      )
      return mmFromProviders || null
    }

    // ⑥ 找不到 → 返回 null，绝不回退到通用 provider
    return null
  }

  /* ══════════ 连接钱包 ══════════ */
  async function connectWallet(walletId: string) {
    connecting.value = true
    error.value = ''

    try {
      const provider = getSpecificProvider(walletId)

      if (!provider) {
        const wallet = walletList.value.find(w => w.id === walletId)
        const name = wallet?.name || walletId
        if (!window.ethereum) {
          error.value = '未检测到任何钱包扩展，请安装后刷新页面'
        } else {
          error.value = `未找到 ${name} 的专属连接通道，请确认已安装 ${name} 浏览器扩展并刷新页面`
        }
        connecting.value = false
        return
      }

      currentProvider = provider

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
      const actualName = detectProviderName(provider) || walletId

      state.value = {
        connected: true,
        address,
        shortAddress: shortenAddress(address),
        chainId,
        chainName: CHAIN_MAP[chainId] || `Chain ${chainId}`,
        balance: `${balance} ETH`,
        providerName: actualName
      }

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

  function detectProviderName(p: EthereumProvider): string {
    if (p === window.okxwallet || p.isOKExWallet || p.isOkxWallet) return 'OKX Wallet'
    if (p === window.tokenpocket?.ethereum || p.isTokenPocket) return 'TokenPocket'
    if (p === window.BinanceChain || p.isBinance) return 'Binance Web3'
    if (p === window.trustwallet || p.isTrust) return 'Trust Wallet'
    if (p.isCoinbaseWallet) return 'Coinbase Wallet'
    if (p.isImToken) return 'imToken'
    if (p.isOneKey) return 'OneKey'
    if (p.isHuobiWallet) return '火币钱包'
    if ((p as EthereumProvider)._metamask || p.isMetaMask) return 'MetaMask'
    return 'Web3 Wallet'
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

  /* ── 自动恢复连接 ── */
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
        const actualName = detectProviderName(provider) || walletId

        state.value = {
          connected: true,
          address: accounts[0],
          shortAddress: shortenAddress(accounts[0]),
          chainId,
          chainName: CHAIN_MAP[chainId] || `Chain ${chainId}`,
          balance: `${balance} ETH`,
          providerName: actualName
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
    // 重新触发 EIP-6963 发现（可能有延迟加载的钱包）
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('eip6963:requestProvider'))
    }
    logWalletDiagnostics()
  }

  function closeModal() {
    showModal.value = false
    error.value = ''
  }

  watch(state, (s) => {
    appStore.setWalletState(s.connected, s.address, s.shortAddress, s.providerName, s.balance)
  }, { deep: true })

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
