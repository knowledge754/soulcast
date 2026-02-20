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
  eip6963Icon?: string
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

interface SolanaWallet {
  publicKey: { toBase58: () => string } | null
  isConnected: boolean
  connect: () => Promise<{ publicKey: { toBase58: () => string } }>
  disconnect: () => Promise<void>
  signTransaction: (tx: unknown) => Promise<unknown>
  signAllTransactions: (txs: unknown[]) => Promise<unknown[]>
}

interface SuiWalletAdapter {
  hasPermissions: () => Promise<boolean>
  requestPermissions: () => Promise<boolean>
  getAccounts: () => Promise<{ address: string }[]>
  disconnect: () => Promise<void>
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
    phantom?: { solana?: SolanaWallet }
    solflare?: SolanaWallet
    suiWallet?: SuiWalletAdapter
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

function getEIP6963Icon(walletId: string): string | undefined {
  for (const detail of eip6963Providers.value) {
    if (RDNS_TO_WALLET[detail.info.rdns] === walletId && detail.info.icon) {
      return detail.info.icon
    }
  }
  return undefined
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
  console.log('EIP-6963 已发现:')
  eip6963Providers.value.forEach((d, i) => {
    console.log(`  [${i}] ${d.info.name} | rdns: ${d.info.rdns} | mapped: ${RDNS_TO_WALLET[d.info.rdns] || '未映射'}`, {
      '===okxwallet': d.provider === window.okxwallet,
      '===ethereum': d.provider === window.ethereum,
      isOKExWallet: !!d.provider.isOKExWallet,
      isOkxWallet: !!d.provider.isOkxWallet,
      isMetaMask: !!d.provider.isMetaMask,
      isTokenPocket: !!d.provider.isTokenPocket,
    })
  })
  if (eip6963Providers.value.length === 0) console.log('  (无)')
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
  const connectingId = ref('')
  const error = ref('')
  let currentProvider: EthereumProvider | null = null

  /* ── 钱包列表 ── */
  const walletList = computed<WalletProvider[]>(() => {
    const eth = window.ethereum
    const _deps = eip6963Providers.value
    const okxHijack = isOKXPresent()

    return [
      {
        id: 'metamask', name: 'MetaMask', icon: 'metamask',
        color: 'linear-gradient(135deg, #E2761B, #CD6116)',
        description: '最流行的浏览器钱包插件',
        downloadUrl: 'https://metamask.io/download/',
        detected: isDetectedViaEIP6963('metamask')
          || !!(eth?.providers?.some(p => p.isMetaMask && (p as EthereumProvider)._metamask))
          || (!okxHijack && !!eth?.isMetaMask && !!(eth as EthereumProvider)._metamask),
        eip6963Icon: getEIP6963Icon('metamask'),
      },
      {
        id: 'tokenpocket', name: 'TokenPocket', icon: 'tokenpocket',
        color: 'linear-gradient(135deg, #2980FE, #1A6AFF)',
        description: '多链数字资产钱包',
        downloadUrl: 'https://www.tokenpocket.pro/',
        detected: isDetectedViaEIP6963('tokenpocket') || !!window.tokenpocket?.ethereum,
        eip6963Icon: getEIP6963Icon('tokenpocket'),
      },
      {
        id: 'okx', name: 'OKX Wallet', icon: 'okx',
        color: 'linear-gradient(135deg, #FFFFFF, #C4C4C4)',
        description: 'OKX 多链钱包',
        downloadUrl: 'https://www.okx.com/web3',
        detected: isDetectedViaEIP6963('okx') || !!window.okxwallet || !!eth?.isOKExWallet || !!eth?.isOkxWallet,
        eip6963Icon: getEIP6963Icon('okx'),
      },
      {
        id: 'binance', name: 'Binance Web3', icon: 'binance',
        color: 'linear-gradient(135deg, #F0B90B, #F8D12F)',
        description: '币安官方 Web3 钱包',
        downloadUrl: 'https://www.binance.com/web3wallet',
        detected: isDetectedViaEIP6963('binance') || !!window.BinanceChain,
        eip6963Icon: getEIP6963Icon('binance'),
      },
      {
        id: 'trust', name: 'Trust Wallet', icon: 'trust',
        color: 'linear-gradient(135deg, #3375BB, #0500FF)',
        description: '安全可信赖的多链钱包',
        downloadUrl: 'https://trustwallet.com/',
        detected: isDetectedViaEIP6963('trust') || !!window.trustwallet,
        eip6963Icon: getEIP6963Icon('trust'),
      },
      {
        id: 'imtoken', name: 'imToken', icon: 'imtoken',
        color: 'linear-gradient(135deg, #11C4D1, #0062AD)',
        description: '去中心化数字钱包',
        downloadUrl: 'https://token.im/',
        detected: isDetectedViaEIP6963('imtoken') || !!window.imToken,
        eip6963Icon: getEIP6963Icon('imtoken'),
      },
      {
        id: 'coinbase', name: 'Coinbase Wallet', icon: 'coinbase',
        color: 'linear-gradient(135deg, #0052FF, #0039B3)',
        description: 'Coinbase 官方钱包',
        downloadUrl: 'https://www.coinbase.com/wallet',
        detected: isDetectedViaEIP6963('coinbase') || !!window.coinbaseWalletExtension,
        eip6963Icon: getEIP6963Icon('coinbase'),
      },
      {
        id: 'huobi', name: '火币钱包', icon: 'huobi',
        color: 'linear-gradient(135deg, #2DAF68, #1B8A4E)',
        description: '火币生态链官方钱包',
        downloadUrl: 'https://www.htx.com/wallet',
        detected: isDetectedViaEIP6963('huobi'),
        eip6963Icon: getEIP6963Icon('huobi'),
      },
      {
        id: 'onekey', name: 'OneKey', icon: 'onekey',
        color: 'linear-gradient(135deg, #00B812, #009A0F)',
        description: '开源硬件钱包',
        downloadUrl: 'https://onekey.so/',
        detected: isDetectedViaEIP6963('onekey') || !!window.onekey?.ethereum || !!window.$onekey?.ethereum,
        eip6963Icon: getEIP6963Icon('onekey'),
      },
      {
        id: 'ledger', name: 'Ledger', icon: 'ledger',
        color: 'linear-gradient(135deg, #000000, #333333)',
        description: '硬件冷钱包，需通过 Ledger Live 连接',
        downloadUrl: 'https://www.ledger.com/',
        detected: false,
        eip6963Icon: getEIP6963Icon('ledger'),
      },
      {
        id: 'trezor', name: 'Trezor', icon: 'trezor',
        color: 'linear-gradient(135deg, #001E2B, #00854D)',
        description: '硬件冷钱包，需通过 Trezor Suite 连接',
        downloadUrl: 'https://trezor.io/',
        detected: false,
        eip6963Icon: getEIP6963Icon('trezor'),
      },
      {
        id: 'phantom', name: 'Phantom', icon: 'phantom',
        color: 'linear-gradient(135deg, #AB9FF2, #7B61FF)',
        description: 'Solana 生态首选钱包，支持多链',
        downloadUrl: 'https://phantom.app/',
        detected: !!window.phantom?.solana,
        eip6963Icon: getEIP6963Icon('phantom'),
      },
      {
        id: 'suiwallet', name: 'Sui Wallet', icon: 'suiwallet',
        color: 'linear-gradient(135deg, #4DA2FF, #2D7DD2)',
        description: 'Sui 链官方钱包',
        downloadUrl: 'https://chrome.google.com/webstore/detail/sui-wallet',
        detected: !!window.suiWallet,
        eip6963Icon: getEIP6963Icon('suiwallet'),
      }
    ]
  })

  /**
   * 验证一个命名空间 provider 不是被 OKX 劫持的假冒品。
   * 检查：1) 不能是 window.ethereum 的同一引用（如果 OKX 已劫持）
   *       2) 不能是 window.okxwallet 的同一引用
   *       3) 自身不能带有 OKX 标志
   */
  function isGenuineNamespaceProvider(p: EthereumProvider, label: string): boolean {
    if (p.isOKExWallet || p.isOkxWallet) {
      console.warn(`[ChainLog] ${label} 带有 OKX flag → 被 OKX 劫持`)
      return false
    }
    if (window.okxwallet && p === window.okxwallet) {
      console.warn(`[ChainLog] ${label} === window.okxwallet → 被 OKX 劫持`)
      return false
    }
    if (isOKXPresent() && window.ethereum && p === window.ethereum) {
      console.warn(`[ChainLog] ${label} === window.ethereum（已被 OKX 劫持）→ 跳过`)
      return false
    }
    return true
  }

  /* ══════════ 获取特定 Provider ══════════ */
  function getSpecificProvider(walletId: string): EthereumProvider | null {
    const eth = window.ethereum
    const okxHijack = isOKXPresent()

    console.log(`[ChainLog] 查找 ${walletId} provider... (OKX劫持: ${okxHijack})`)

    // ① EIP-6963 — 需要验证不是 OKX 伪装
    const eip6963 = findEIP6963Provider(walletId)
    if (eip6963) {
      const matchedDetail = eip6963Providers.value.find(d => d.provider === eip6963)
      console.log(`[ChainLog] EIP-6963 匹配到 ${walletId}:`, {
        rdns: matchedDetail?.info.rdns,
        name: matchedDetail?.info.name,
        '===okxwallet': eip6963 === window.okxwallet,
        '===ethereum': eip6963 === window.ethereum,
        isOKExWallet: !!eip6963.isOKExWallet,
        isOkxWallet: !!eip6963.isOkxWallet,
      })
      // 验证 EIP-6963 结果不是 OKX 伪装
      if (walletId !== 'okx' && isGenuineNamespaceProvider(eip6963, `EIP-6963(${matchedDetail?.info.rdns})`)) {
        console.log(`[ChainLog] ✅ ${walletId} → EIP-6963 (${matchedDetail?.info.rdns}) 验证通过`)
        return eip6963
      } else if (walletId === 'okx') {
        console.log(`[ChainLog] ✅ okx → EIP-6963`)
        return eip6963
      }
      console.warn(`[ChainLog] ⚠️ EIP-6963 的 ${walletId} provider 被 OKX 劫持，跳过`)
    }

    // ② 独立全局注入 — 验证不是 OKX 的伪装
    if (walletId === 'okx' && window.okxwallet) {
      console.log(`[ChainLog] ✅ ${walletId} → window.okxwallet`)
      return window.okxwallet
    }
    if (walletId === 'tokenpocket' && window.tokenpocket?.ethereum) {
      if (isGenuineNamespaceProvider(window.tokenpocket.ethereum, 'window.tokenpocket.ethereum')) {
        console.log(`[ChainLog] ✅ ${walletId} → window.tokenpocket.ethereum`)
        return window.tokenpocket.ethereum
      }
    }
    if (walletId === 'binance' && window.BinanceChain) {
      if (isGenuineNamespaceProvider(window.BinanceChain, 'window.BinanceChain')) {
        console.log(`[ChainLog] ✅ ${walletId} → window.BinanceChain`)
        return window.BinanceChain
      }
    }
    if (walletId === 'trust' && window.trustwallet) {
      if (isGenuineNamespaceProvider(window.trustwallet, 'window.trustwallet')) {
        console.log(`[ChainLog] ✅ ${walletId} → window.trustwallet`)
        return window.trustwallet
      }
    }
    if (walletId === 'coinbase' && window.coinbaseWalletExtension) {
      if (isGenuineNamespaceProvider(window.coinbaseWalletExtension, 'window.coinbaseWalletExtension')) {
        console.log(`[ChainLog] ✅ ${walletId} → window.coinbaseWalletExtension`)
        return window.coinbaseWalletExtension
      }
    }
    if (walletId === 'onekey') {
      const ok = window.$onekey?.ethereum || window.onekey?.ethereum
      if (ok && isGenuineNamespaceProvider(ok, 'window.onekey.ethereum')) {
        console.log(`[ChainLog] ✅ ${walletId} → window.onekey.ethereum`)
        return ok
      }
    }

    if (!eth) {
      console.log(`[ChainLog] ❌ ${walletId} → window.ethereum 不存在`)
      return null
    }

    // ③ providers 数组 — 严格校验 + 排除 OKX 伪装
    if (eth.providers && Array.isArray(eth.providers)) {
      console.log(`[ChainLog] 扫描 providers 数组 (${eth.providers.length} 个)...`)
      for (let i = 0; i < eth.providers.length; i++) {
        const p = eth.providers[i]
        // 跳过所有 OKX 的 provider（除非就是在找 OKX）
        if (walletId !== 'okx' && (p.isOKExWallet || p.isOkxWallet || p === window.okxwallet)) continue

        switch (walletId) {
          case 'metamask':
            if (p.isMetaMask && (p as EthereumProvider)._metamask) {
              console.log(`[ChainLog] ✅ ${walletId} → providers[${i}] (有 _metamask)`)
              return p
            }
            break
          case 'tokenpocket':
            if (p.isTokenPocket) {
              console.log(`[ChainLog] ✅ ${walletId} → providers[${i}] (isTokenPocket)`)
              return p
            }
            break
          case 'coinbase':
            if (p.isCoinbaseWallet) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'imtoken':
            if (p.isImToken) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'onekey':
            if (p.isOneKey) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'trust':
            if (p.isTrust) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'okx':
            if (p.isOKExWallet || p.isOkxWallet) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'binance':
            if (p.isBinance) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
          case 'huobi':
            if (p.isHuobiWallet) { console.log(`[ChainLog] ✅ ${walletId} → providers[${i}]`); return p }
            break
        }
      }
    }

    // ④ 单 provider — 仅当 OKX 未劫持时才信任 window.ethereum
    if (!okxHijack) {
      let matched = false
      if (walletId === 'metamask' && eth.isMetaMask && !eth.isTokenPocket) matched = true
      if (walletId === 'tokenpocket' && eth.isTokenPocket) matched = true
      if (walletId === 'trust' && eth.isTrust) matched = true
      if (walletId === 'binance' && eth.isBinance) matched = true
      if (walletId === 'imtoken' && eth.isImToken) matched = true
      if (walletId === 'coinbase' && eth.isCoinbaseWallet) matched = true
      if (walletId === 'huobi' && eth.isHuobiWallet) matched = true
      if (walletId === 'onekey' && eth.isOneKey) matched = true
      if (matched) {
        console.log(`[ChainLog] ✅ ${walletId} → window.ethereum (无 OKX 劫持)`)
        return eth
      }
    }

    // OKX 本身可以用 window.ethereum
    if (walletId === 'okx' && (eth.isOKExWallet || eth.isOkxWallet)) {
      console.log(`[ChainLog] ✅ okx → window.ethereum`)
      return eth
    }

    // ⑤ 硬件钱包通过 MetaMask 桥接
    if (walletId === 'ledger' || walletId === 'trezor') {
      const mm = findEIP6963Provider('metamask')
      if (mm) return mm
      const mmFromProviders = eth.providers?.find(
        (p: EthereumProvider) => p.isMetaMask && (p as EthereumProvider)._metamask
      )
      return mmFromProviders || null
    }

    console.log(`[ChainLog] ❌ ${walletId} → 未找到匹配的 provider`)
    return null
  }

  /* ══════════ 连接钱包 ══════════ */
  async function connectWallet(walletId: string) {
    connecting.value = true
    connectingId.value = walletId
    error.value = ''
    let requestStart = Date.now()

    // Handle Solana wallet (Phantom)
    if (walletId === 'phantom') {
      try {
        const phantom = window.phantom?.solana
        if (!phantom) {
          error.value = '未检测到 Phantom 钱包，请安装 Phantom 浏览器扩展'
          connecting.value = false
          connectingId.value = ''
          return
        }
        const resp = await phantom.connect()
        const address = resp.publicKey.toBase58()
        state.value = {
          connected: true,
          address,
          shortAddress: address.slice(0, 4) + '...' + address.slice(-4),
          chainId: 0,
          chainName: 'Solana',
          balance: '- SOL',
          providerName: 'Phantom'
        }
        localStorage.setItem('chainlog_wallet', JSON.stringify({ walletId: 'phantom', address, chainId: 0 }))
        showModal.value = false
      } catch (err: unknown) {
        const e = err as { message?: string }
        error.value = e.message || 'Phantom 连接失败'
      } finally {
        connecting.value = false
        connectingId.value = ''
      }
      return
    }

    // Handle Sui wallet
    if (walletId === 'suiwallet') {
      try {
        const suiWallet = window.suiWallet
        if (!suiWallet) {
          error.value = '未检测到 Sui Wallet，请安装 Sui Wallet 浏览器扩展'
          connecting.value = false
          connectingId.value = ''
          return
        }
        const hasPerms = await suiWallet.hasPermissions()
        if (!hasPerms) await suiWallet.requestPermissions()
        const accounts = await suiWallet.getAccounts()
        if (accounts.length === 0) {
          error.value = 'Sui Wallet 未授权'
          connecting.value = false
          connectingId.value = ''
          return
        }
        const address = accounts[0].address
        state.value = {
          connected: true,
          address,
          shortAddress: address.slice(0, 6) + '...' + address.slice(-4),
          chainId: 0,
          chainName: 'Sui',
          balance: '- SUI',
          providerName: 'Sui Wallet'
        }
        localStorage.setItem('chainlog_wallet', JSON.stringify({ walletId: 'suiwallet', address, chainId: 0 }))
        showModal.value = false
      } catch (err: unknown) {
        const e = err as { message?: string }
        error.value = e.message || 'Sui Wallet 连接失败'
      } finally {
        connecting.value = false
        connectingId.value = ''
      }
      return
    }

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

      console.log(`[ChainLog] 即将调用 eth_requestAccounts，provider 信息:`, {
        isMetaMask: !!provider.isMetaMask,
        isOKExWallet: !!provider.isOKExWallet,
        isOkxWallet: !!provider.isOkxWallet,
        isTokenPocket: !!provider.isTokenPocket,
        _metamask: !!(provider as EthereumProvider)._metamask,
        '===okxwallet': provider === window.okxwallet,
        '===ethereum': provider === window.ethereum,
        '===tp.ethereum': provider === window.tokenpocket?.ethereum,
      })

      currentProvider = provider

      requestStart = Date.now()
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
      const elapsed = Date.now() - requestStart
      const e = err as { code?: number; message?: string }
      if (e.code === 4001) {
        if (elapsed < 1500) {
          const wallet = walletList.value.find(w => w.id === walletId)
          error.value = `${wallet?.name || walletId} 连接被自动拒绝（可能被其他钱包扩展劫持），请在浏览器扩展中禁用冲突的钱包后重试`
          console.warn(`[ChainLog] ⚠️ eth_requestAccounts 在 ${elapsed}ms 内被拒绝（<1.5s），疑似 provider 被劫持`)
        } else {
          error.value = '用户取消了连接'
        }
      } else {
        error.value = e.message || '连接失败，请重试'
      }
    } finally {
      connecting.value = false
      connectingId.value = ''
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
    connectingId,
    error,
    walletList,
    connectWallet,
    disconnectWallet,
    openModal,
    closeModal
  }
}
