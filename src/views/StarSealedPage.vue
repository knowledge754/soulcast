<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { useI18n } from '../stores/i18n'
import { useWallet } from '../composables/useWallet'
import Icon from '../components/icons/Icon.vue'
import TokenSelector from '../components/starsealed/TokenSelector.vue'
import NftSelector from '../components/starsealed/NftSelector.vue'
import type { LockedToken } from '../components/starsealed/TokenSelector.vue'
import type { LockedNft } from '../components/starsealed/NftSelector.vue'
import {
  fullCreateCapsule,
  openCapsuleOnChain,
  CHAINS,
  CHAIN_LIST,
  getExplorerTxUrl,
  type TxStep,
  type SealResult,
} from '../services/blockchain'

const i18n = useI18n()
const wallet = useWallet()

/* ═══ Tab ═══ */
const activeTab = ref<'create' | 'mine' | 'received'>('create')
function showTab(name: typeof activeTab.value) {
  activeTab.value = name
}

/* ═══ Attachments ═══ */
interface Attachment {
  id: number; file: File; url: string; type: 'image' | 'video' | 'audio' | 'other'
}
const attachments = ref<Attachment[]>([])
const fileInputRef = ref<HTMLInputElement>()

function triggerFileUpload() {
  fileInputRef.value?.click()
}
function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files
  if (!files) return
  for (const file of Array.from(files)) {
    const type = file.type.startsWith('image/') ? 'image'
      : file.type.startsWith('video/') ? 'video'
      : file.type.startsWith('audio/') ? 'audio' : 'other'
    attachments.value.push({ id: Date.now() + Math.random(), file, url: URL.createObjectURL(file), type })
  }
  if (fileInputRef.value) fileInputRef.value.value = ''
}
function removeAttachment(id: number) {
  const idx = attachments.value.findIndex(a => a.id === id)
  if (idx >= 0) {
    URL.revokeObjectURL(attachments.value[idx].url)
    attachments.value.splice(idx, 1)
  }
}

/* ═══ Custom Date Picker ═══ */
const showDatePicker = ref(false)
const pickYear = ref(new Date().getFullYear() + 3)
const pickMonth = ref(new Date().getMonth())
const pickDay = ref(new Date().getDate())
const pickHour = ref(0)
const pickMinute = ref(0)

const daysInMonth = computed(() => new Date(pickYear.value, pickMonth.value + 1, 0).getDate())
const firstDayOfWeek = computed(() => new Date(pickYear.value, pickMonth.value, 1).getDay() || 7)

function prevMonth() {
  if (pickMonth.value === 0) { pickMonth.value = 11; pickYear.value-- }
  else pickMonth.value--
  if (pickDay.value > daysInMonth.value) pickDay.value = daysInMonth.value
}
function nextMonth() {
  if (pickMonth.value === 11) { pickMonth.value = 0; pickYear.value++ }
  else pickMonth.value++
  if (pickDay.value > daysInMonth.value) pickDay.value = daysInMonth.value
}
function confirmDate() {
  const d = new Date(pickYear.value, pickMonth.value, pickDay.value, pickHour.value, pickMinute.value)
  unlockDate.value = d.toISOString().slice(0, 16)
  showDatePicker.value = false
}
const formattedDate = computed(() => {
  if (!unlockDate.value) return '选择开启时间…'
  const d = new Date(unlockDate.value)
  return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
})

const countdownText = computed(() => {
  if (!unlockDate.value) return '未设定'
  const now = new Date()
  const target = new Date(unlockDate.value)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return '已到期'
  const days = Math.floor(diffMs / 86400000)
  const years = Math.floor(days / 365)
  const remainDays = days % 365
  if (years > 0) return `${years}年 ${remainDays}天后开启`
  if (days > 0) return `${days}天后开启`
  const hours = Math.floor(diffMs / 3600000)
  return `${hours}小时后开启`
})

/* ═══ Create: Step ═══ */
const createStep = ref(1)
function goStep(n: number) {
  createStep.value = n
}

/* ═══ Create: Capsule type ═══ */
const capsuleType = ref<'self' | 'other' | 'world'>('self')
const capsuleTypes = [
  { key: 'self' as const, icon: 'moon', color: '#60a5fa', name: '自言', desc: '写给未来的自己，私密加密' },
  { key: 'other' as const, icon: 'star', color: '#a78bfa', name: '他言', desc: '写给某个钱包地址的人' },
  { key: 'world' as const, icon: 'globe', color: '#fbbf24', name: '世言', desc: '公开宣言，全世界见证开启' },
]

/* ═══ Create: Content ═══ */
const capsuleTitle = ref('')
const capsuleBody = ref('')
const recipientAddr = ref('')
const editorRef = ref<HTMLTextAreaElement>()
const showEmoji = ref(false)

const emojiList = ['😊','😢','🥰','🔥','✨','💎','🚀','🌙','⭐','💜','💛','🌏','🎉','🤝','📜','🔒','🗝️','💌','🕊️','🌌','❄️','☀️','🌊','🎵','🧠','👑','💪','🙏']

function insertMarkdown(prefix: string, suffix: string = '') {
  const el = editorRef.value
  if (!el) return
  const start = el.selectionStart
  const end = el.selectionEnd
  const text = capsuleBody.value
  const selected = text.slice(start, end)
  const insert = prefix + (selected || '文本') + suffix
  capsuleBody.value = text.slice(0, start) + insert + text.slice(end)
  nextTick(() => { el.focus(); el.setSelectionRange(start + prefix.length, start + prefix.length + (selected || '文本').length) })
}

function insertEmoji(emoji: string) {
  const el = editorRef.value
  if (!el) return
  const pos = el.selectionStart
  capsuleBody.value = capsuleBody.value.slice(0, pos) + emoji + capsuleBody.value.slice(pos)
  showEmoji.value = false
  nextTick(() => { el.focus(); el.setSelectionRange(pos + emoji.length, pos + emoji.length) })
}

/* ═══ Create: Lock settings ═══ */
const lockMode = ref<'time' | 'event' | 'multisig' | 'random'>('time')
const lockModes = [
  { key: 'time' as const, icon: 'clock', name: '时间锁', desc: '到达指定时间后自动可开启' },
  { key: 'event' as const, icon: 'zap', name: '事件锁', desc: '链上特定事件触发解锁' },
  { key: 'multisig' as const, icon: 'lock', name: '多签锁', desc: '需要多人共同确认才能开启' },
  { key: 'random' as const, icon: 'dice', name: '随机锁', desc: '设置时间范围，随机某天开启' },
]
const unlockDate = ref('')
const allowEarlyUnlock = ref(false)

const durationText = computed(() => {
  if (!unlockDate.value) return ''
  const now = new Date()
  const target = new Date(unlockDate.value)
  const diffMs = target.getTime() - now.getTime()
  if (diffMs <= 0) return '已到期'
  const days = Math.floor(diffMs / 86400000)
  const years = Math.floor(days / 365)
  const remainDays = days % 365
  const months = Math.floor(remainDays / 30)
  if (years > 0 && months > 0) return `${years}年${months}个月`
  if (years > 0) return `${years}年`
  if (months > 0) return `${months}个月${remainDays % 30}天`
  return `${days}天`
})

/* ═══ Create: Chain ═══ */
const selectedChain = ref('bsc')
const chains = CHAIN_LIST.map(c => ({
  key: c.key, name: c.name, fee: c.fee, color: c.color, symbol: c.symbol, type: c.type,
}))

/* ═══ Create: Locked Assets ═══ */
const showTokenSelector = ref(false)
const showNftSelector = ref(false)
const lockedTokens = ref<LockedToken[]>([])
const lockedNfts = ref<LockedNft[]>([])

function onTokensConfirmed(tokens: LockedToken[]) {
  lockedTokens.value = tokens
  showTokenSelector.value = false
}
function onNftsConfirmed(nfts: LockedNft[]) {
  lockedNfts.value = nfts
  showNftSelector.value = false
}
function removeLockedToken(symbol: string) {
  lockedTokens.value = lockedTokens.value.filter(t => t.symbol !== symbol)
}
function removeLockedNft(key: string) {
  lockedNfts.value = lockedNfts.value.filter(n => `${n.contractAddress}:${n.tokenId}` !== key)
}

const totalLockedUsd = computed(() => {
  return lockedTokens.value.reduce((s, t) => s + parseFloat(t.amount) * t.usdPrice, 0)
})
const hasLockedAssets = computed(() => lockedTokens.value.length > 0 || lockedNfts.value.length > 0)

const gasEstimate = computed(() => {
  const ch = chains.find(c => c.key === selectedChain.value)
  const baseFee = parseFloat(ch?.fee.replace(/[~$]/g, '') || '0.05')
  const tokenFee = lockedTokens.value.length * 0.03
  const nftFee = lockedNfts.value.length * 0.05
  const ipfsFee = 0.01
  const total = baseFee + tokenFee + nftFee + ipfsFee
  return {
    contract: baseFee.toFixed(3),
    ipfs: ipfsFee.toFixed(3),
    tokenApprove: tokenFee > 0 ? tokenFee.toFixed(3) : '0.000',
    nftApprove: nftFee > 0 ? nftFee.toFixed(3) : '0.000',
    total: total.toFixed(3),
  }
})

/* ═══ Create: Sidebar meta ═══ */
const metaType = computed(() => {
  const m: Record<string, string> = { self: '自言', other: '他言', world: '世言' }
  return m[capsuleType.value]
})
const metaLock = computed(() => {
  const m: Record<string, string> = { time: '时间锁', event: '事件锁', multisig: '多签锁', random: '随机锁' }
  return m[lockMode.value]
})
const metaChain = computed(() => chains.find(c => c.key === selectedChain.value)?.name || 'BSC')

/* ═══ Seal action ═══ */
const showSealOverlay = ref(false)
const sealPhase = ref(0)
const txSteps = ref<TxStep[]>([])
const sealResult = ref<SealResult | null>(null)
const sealError = ref('')
const isSealing = ref(false)

const ttsTexts: Record<number, string> = {
  1: '正在连接黑洞，引力场已锁定，开始吸入胶囊。',
  2: '胶囊正在被吞噬，加密内容，上传星际文件系统，写入智能合约。',
  3: '封印完成，你的记忆已被宇宙保管，铸造纪念NFT。',
  4: '星封成功，等待开启的那一天。'
}

function speakPhase(phase: number, texts: Record<number, string> = ttsTexts) {
  if (!('speechSynthesis' in window)) return
  window.speechSynthesis.cancel()
  const u = new SpeechSynthesisUtterance(texts[phase])
  u.lang = 'zh-CN'
  u.rate = 0.9
  u.pitch = 1.2
  const voices = window.speechSynthesis.getVoices()
  const female = voices.find(v => v.lang.startsWith('zh') && /female|xiaoxiao|yaoyao|lili|huihui/i.test(v.name))
    || voices.find(v => v.lang.startsWith('zh'))
  if (female) u.voice = female
  window.speechSynthesis.speak(u)
}

function sealCapsuleAnimation() {
  showSealOverlay.value = true
  sealPhase.value = 1
  speakPhase(1)
  setTimeout(() => { sealPhase.value = 2; speakPhase(2) }, 1200)
  setTimeout(() => { sealPhase.value = 3; speakPhase(3) }, 3000)
  setTimeout(() => { sealPhase.value = 4; speakPhase(4) }, 4500)
  setTimeout(() => { showSealOverlay.value = false; sealPhase.value = 0; window.speechSynthesis?.cancel() }, 6000)
}

async function publishCapsule() {
  if (!capsuleTitle.value.trim() && !capsuleBody.value.trim()) return
  if (!wallet.state.value.connected) {
    wallet.openModal()
    return
  }

  isSealing.value = true
  sealError.value = ''
  txSteps.value = []
  sealResult.value = null

  const ch = chains.find(c => c.key === selectedChain.value)

  try {
    const result = await fullCreateCapsule({
      chain: selectedChain.value,
      capsuleType: capsuleType.value,
      recipient: capsuleType.value === 'other' ? recipientAddr.value : '',
      title: capsuleTitle.value || '未命名胶囊',
      body: capsuleBody.value,
      bodyFormat: 'markdown',
      attachments: attachments.value.map(a => ({
        name: a.file.name, type: a.file.type, size: a.file.size, dataUrl: a.url,
      })),
      unlockTime: unlockDate.value,
      allowEarlyUnlock: allowEarlyUnlock.value,
      tokens: lockedTokens.value.map(t => ({
        symbol: t.symbol, name: t.name || t.symbol, address: t.address,
        amount: t.amount, decimals: t.decimals, usdPrice: t.usdPrice,
      })),
      nfts: lockedNfts.value.map(n => ({
        contractAddress: n.contractAddress, tokenId: n.tokenId,
        name: n.name, collection: n.collection, image: n.image, standard: n.standard,
      })),
      creator: wallet.state.value.address,
    }, (step) => {
      const idx = txSteps.value.findIndex(s => s.step === step.step && s.index === step.index)
      if (idx >= 0) txSteps.value[idx] = step
      else txSteps.value.push(step)
    })

    sealResult.value = result

    const newCap: Capsule = {
      id: result.capsuleId || Date.now(),
      type: capsuleType.value,
      title: capsuleTitle.value || '未命名胶囊',
      chain: ch?.symbol || 'BNB',
      chainColor: ch?.color || '#F0B90B',
      sealDate: new Date().toISOString().slice(0, 10).replace(/-/g, '.'),
      status: 'sealed',
      countdown: countdownText.value,
      orbClass: capsuleType.value === 'self' ? 'purple' : capsuleType.value === 'world' ? 'gold' : 'pink',
      lockedTokens: lockedTokens.value.length > 0 ? [...lockedTokens.value] : undefined,
      lockedNfts: lockedNfts.value.length > 0 ? [...lockedNfts.value] : undefined,
      lockMode: lockMode.value,
      recipient: capsuleType.value === 'other' ? recipientAddr.value : undefined,
      unlockTime: unlockDate.value,
      totalLockedUsd: totalLockedUsd.value > 0 ? totalLockedUsd.value : undefined,
      txHash: result.txHash,
      chainKey: selectedChain.value,
      contentCID: result.contentCID,
    }
    myCapsules.value.unshift(newCap)

    sealCapsuleAnimation()
    await new Promise(r => setTimeout(r, 6200))

    capsuleTitle.value = ''
    capsuleBody.value = ''
    recipientAddr.value = ''
    attachments.value = []
    lockedTokens.value = []
    lockedNfts.value = []
    createStep.value = 1
    activeTab.value = 'mine'
  } catch (err: unknown) {
    const e = err as { message?: string }
    sealError.value = e.message || '封印失败，请重试'
    console.error('[StarSealed] Publish error:', err)
  } finally {
    isSealing.value = false
  }
}

/* ═══ My Capsules ═══ */
const activeFilter = ref('all')
const filters = ['all', 'self', 'other', 'world', 'sealed', 'ready', 'opened']
const filterLabels: Record<string, string> = {
  all: '全部', self: '自言', other: '他言', world: '世言',
  sealed: '封印中', ready: '待开启', opened: '已开启'
}

interface Capsule {
  id: number; type: 'self' | 'other' | 'world'; title: string;
  chain: string; chainColor: string; sealDate: string;
  status: 'sealed' | 'ready' | 'opened'; countdown?: string;
  openDate?: string; orbClass?: string;
  lockedTokens?: LockedToken[];
  lockedNfts?: LockedNft[];
  lockMode?: string;
  recipient?: string;
  unlockTime?: string;
  totalLockedUsd?: number;
  txHash?: string;
  chainKey?: string;
  contentCID?: string;
}

const myCapsules = ref<Capsule[]>([
  {
    id: 1, type: 'self', title: '写给 2026 年的自己', chain: 'BNB', chainColor: '#F0B90B', sealDate: '2023.02.18', status: 'ready', countdown: '今天可以开启！', orbClass: 'purple',
    lockedTokens: [{ symbol: 'BNB', name: 'BNB', amount: '0.5', icon: '◆', color: '#F0B90B', decimals: 18, address: 'native', balance: '0', usdPrice: 312.5 }],
    totalLockedUsd: 156.25, lockMode: 'time',
  },
  {
    id: 2, type: 'other', title: '妈妈，等我三十岁', chain: 'BNB', chainColor: '#F0B90B', sealDate: '2025.01.01', status: 'sealed', countdown: '剩余 3年 241天',
    lockedTokens: [
      { symbol: 'USDT', name: 'Tether', amount: '500', icon: '₮', color: '#26A17B', decimals: 18, address: '0x55d3…', balance: '0', usdPrice: 1 },
      { symbol: 'BNB', name: 'BNB', amount: '1', icon: '◆', color: '#F0B90B', decimals: 18, address: 'native', balance: '0', usdPrice: 312.5 },
    ],
    totalLockedUsd: 812.5, lockMode: 'time', recipient: '0xAb3F…8cD2',
  },
  {
    id: 3, type: 'world', title: '我对 Web3 未来的预言', chain: 'BASE', chainColor: '#0052ff', sealDate: '2024.11.20', status: 'sealed', countdown: '剩余 8年 102天',
    lockMode: 'time',
  },
  {
    id: 4, type: 'self', title: '2020 年的那个冬天', chain: 'ETH', chainColor: '#627EEA', sealDate: '2020.01.01', status: 'opened', openDate: '2025.01.01', orbClass: 'green',
    lockedNfts: [{ contractAddress: '0xBCf…1a2', tokenId: '1042', name: 'Bored Ape #1042', collection: 'BAYC', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=200&fit=crop', standard: 'BEP-721' }],
    lockMode: 'time',
  },
  {
    id: 5, type: 'other', title: '给她的第一封链上情书', chain: 'BNB', chainColor: '#F0B90B', sealDate: '2025.02.14', status: 'sealed', countdown: '剩余 1年 18天', orbClass: 'pink',
    lockedTokens: [{ symbol: 'BUSD', name: 'Binance USD', amount: '1314', icon: 'B', color: '#F0B90B', decimals: 18, address: '0xe9e7…', balance: '0', usdPrice: 1 }],
    lockedNfts: [{ contractAddress: '0xA1f…3b4', tokenId: '7721', name: 'CryptoPunk #7721', collection: 'Punks', image: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=200&h=200&fit=crop', standard: 'BEP-721' }],
    totalLockedUsd: 1314, lockMode: 'time', recipient: '0x7cFe…2aB1',
  },
  {
    id: 6, type: 'self', title: '人生第一个百万目标', chain: 'BNB', chainColor: '#F0B90B', sealDate: '2025.08.15', status: 'sealed', countdown: '剩余 4年 88天', orbClass: 'gold',
    lockedTokens: [{ symbol: 'BNB', name: 'BNB', amount: '10', icon: '◆', color: '#F0B90B', decimals: 18, address: 'native', balance: '0', usdPrice: 312.5 }],
    totalLockedUsd: 3125, lockMode: 'time',
  },
])

const filteredCapsules = computed(() => {
  if (activeFilter.value === 'all') return myCapsules.value
  if (['self', 'other', 'world'].includes(activeFilter.value))
    return myCapsules.value.filter(c => c.type === activeFilter.value)
  return myCapsules.value.filter(c => c.status === activeFilter.value)
})

const sealedCount = computed(() => myCapsules.value.filter(c => c.status === 'sealed').length)
const openedCount = computed(() => myCapsules.value.filter(c => c.status === 'opened').length)
const readyCount = computed(() => myCapsules.value.filter(c => c.status === 'ready').length)

/* ═══ Open Capsule ═══ */
const showOpenOverlay = ref(false)
const openPhase = ref(0)
const openedCapsule = ref<{ title: string; body: string; type: string; chain: string; sealDate: string; attachments: { url: string; type: string }[] } | null>(null)
const showOpenedContent = ref(false)

const openTtsTexts: Record<number, string> = {
  1: '正在唤醒黑洞，引力场检测中。',
  2: '胶囊正在从黑洞中被拉出。',
  3: '解密成功，内容正在呈现。',
  4: '封印已开启，欢迎回到过去的记忆。'
}

async function openCapsuleFromCard(capsule: Capsule) {
  if (capsule.status === 'ready') {
    showOpenOverlay.value = true
    openPhase.value = 1
    speakPhase(1, openTtsTexts)

    // Real on-chain open if has txHash
    if (capsule.chainKey && capsule.txHash) {
      try {
        await openCapsuleOnChain(capsule.chainKey, capsule.id, (step) => {
          if (step.status === 'done') openPhase.value = 3
        })
      } catch (err) {
        console.warn('[StarSealed] On-chain open failed, proceeding with local:', err)
      }
    }

    setTimeout(() => { openPhase.value = 2; speakPhase(2, openTtsTexts) }, 1500)
    setTimeout(() => { openPhase.value = 3; speakPhase(3, openTtsTexts) }, 3500)
    setTimeout(() => { openPhase.value = 4; speakPhase(4, openTtsTexts) }, 5000)
    setTimeout(() => {
      showOpenOverlay.value = false
      openPhase.value = 0
      capsule.status = 'opened'
      capsule.openDate = new Date().toISOString().slice(0, 10).replace(/-/g, '.')
      capsule.countdown = undefined
      openedCapsule.value = {
        title: capsule.title,
        body: '亲爱的未来的我，\n\n此刻是 2023 年的冬天，窗外飘着雪。我刚刚读完一本关于区块链的书，突然觉得应该把这一刻记录下来。\n\n如果你正在读这封信，说明你做到了——你坚持了下来。不管现在的世界变成了什么样，我希望你还记得那个在深夜写代码的少年，记得那份对去中心化世界的热爱。\n\n永远相信自己。\n\n—— 过去的你 ✨',
        type: capsule.type === 'self' ? '自言' : capsule.type === 'other' ? '他言' : '世言',
        chain: capsule.chain,
        sealDate: capsule.sealDate,
        attachments: [
          { url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600', type: 'image' },
          { url: 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?w=600', type: 'image' }
        ]
      }
      showOpenedContent.value = true
      window.speechSynthesis?.cancel()
    }, 6500)
  } else if (capsule.status === 'opened') {
    openedCapsule.value = {
      title: capsule.title,
      body: '这是一段被封印的记忆，现在它属于你了。\n\n—— 来自过去的星封 ✨',
      type: capsule.type === 'self' ? '自言' : capsule.type === 'other' ? '他言' : '世言',
      chain: capsule.chain,
      sealDate: capsule.sealDate,
      attachments: []
    }
    showOpenedContent.value = true
  }
}

function closeOpenedContent() {
  showOpenedContent.value = false
  openedCapsule.value = null
}

onMounted(() => {
})

/* ═══ Received ═══ */
interface ReceivedCapsule {
  id: number; name: string; addr: string; title: string; preview: string;
  sealInfo: string; status: 'sealed' | 'ready' | 'opened';
  gradFrom: string; gradTo: string; avatar: string; action: string
}
const receivedCapsules = ref<ReceivedCapsule[]>([
  { id: 1, name: 'lover.eth', addr: '0xBc1D…7f3A', title: '我知道你一定会成功的', preview: '无论何时你打开这封信，我都想让你知道……', sealInfo: '封印于 2023.02.14 · 今天可开启', status: 'ready', gradFrom: '#fbbf24', gradTo: '#f472b6', avatar: '💛', action: '开启' },
  { id: 2, name: 'nightcoder.eth', addr: '0x9A8E…2c7F', title: '三年后，我们一起回顾这段代码', preview: '这封信在链上等你 3 年……', sealInfo: '封印于 2025.01.01 · 3年后', status: 'sealed', gradFrom: '#60a5fa', gradTo: '#a78bfa', avatar: '🌙', action: '查看详情' },
  { id: 3, name: '父亲的遗嘱', addr: '多签解锁 · 3/5', title: '给你们的最后一封信', preview: '需要家庭成员 3/5 共同确认方可开启……', sealInfo: '封印于 2020.06.15 · 多签锁', status: 'sealed', gradFrom: '#34d399', gradTo: '#22d3ee', avatar: '🌿', action: '确认解锁' },
  { id: 4, name: '过去的自己', addr: '0x7a3F…8cB2', title: '2020 年，写给五年后的自己', preview: '「如果你看到这封信，说明你做到了……」', sealInfo: '开启于 2025.01.01', status: 'opened', gradFrom: '#f59e0b', gradTo: '#ef4444', avatar: '🌟', action: '重读' },
])
</script>

<template>
  <div class="ss-page">
    <!-- Tab Nav -->
    <div class="ss-tabs">
      <button class="ss-tab" :class="{ active: activeTab === 'create' }" @click="showTab('create')">
        <Icon name="sparkles" :size="13" /> 封印新胶囊
      </button>
      <button class="ss-tab" :class="{ active: activeTab === 'mine' }" @click="showTab('mine')">
        我的胶囊 <span class="tab-count">{{ myCapsules.length }}</span>
      </button>
      <button class="ss-tab" :class="{ active: activeTab === 'received' }" @click="showTab('received')">
        收到的 <span class="tab-count">{{ receivedCapsules.length }}</span>
      </button>
    </div>

    <!-- ════════ CREATE ════════ -->
    <Transition name="ss-fade" mode="out-in">
      <div v-if="activeTab === 'create'" key="create" class="ss-panel">
        <div class="create-layout">
          <div class="create-main">
            <!-- Steps -->
            <div class="steps">
              <button class="step-pill" :class="{ active: createStep === 1, done: createStep > 1 }" @click="goStep(1)">
                <span class="sp-num">{{ createStep > 1 ? '✓' : '1' }}</span>
                <span class="sp-text">内容</span>
              </button>
              <button class="step-pill" :class="{ active: createStep === 2, done: createStep > 2 }" @click="goStep(2)">
                <span class="sp-num">{{ createStep > 2 ? '✓' : '2' }}</span>
                <span class="sp-text">封印设置</span>
              </button>
              <button class="step-pill" :class="{ active: createStep === 3 }" @click="goStep(3)">
                <span class="sp-num">3</span>
                <span class="sp-text">确认投入</span>
              </button>
            </div>

            <!-- STEP 1 -->
            <Transition name="ss-fade" mode="out-in">
              <div v-if="createStep === 1" key="s1" class="step-content">
                <div class="section-eye">选择胶囊类型</div>
                <div class="capsule-types">
                  <div
                    v-for="ct in capsuleTypes"
                    :key="ct.key"
                    class="capsule-type"
                    :class="{ selected: capsuleType === ct.key }"
                    :style="{ '--type-color': ct.color }"
                    @click="capsuleType = ct.key"
                  >
                    <div class="type-check">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
                    </div>
                    <div class="type-icon"><Icon :name="ct.icon" :size="28" :color="ct.color" /></div>
                    <div class="type-name">{{ ct.name }}</div>
                    <div class="type-desc">{{ ct.desc }}</div>
                  </div>
                </div>

                <div v-if="capsuleType === 'other'" class="form-section">
                  <div class="form-label">收件人钱包地址 <span class="req">*</span></div>
                  <div class="addr-wrap">
                    <span class="addr-prefix">0x</span>
                    <input v-model="recipientAddr" class="ss-input addr" placeholder="输入对方的钱包地址或 ENS 域名" />
                  </div>
                  <div class="form-hint">内容将用对方公钥加密，只有他们的钱包才能解密</div>
                </div>

                <div class="form-section">
                  <div class="form-label">标题</div>
                  <input v-model="capsuleTitle" class="ss-input" placeholder="给这个胶囊一个名字……" />
                </div>

                <div class="form-section">
                  <div class="form-label">信件 / 内容</div>
                  <div class="editor-wrap">
                    <div class="editor-toolbar">
                      <button class="tb-btn" title="粗体" @click="insertMarkdown('**', '**')"><b>B</b></button>
                      <button class="tb-btn" title="斜体" @click="insertMarkdown('*', '*')"><i>I</i></button>
                      <button class="tb-btn" title="标题" @click="insertMarkdown('## ', '')">H</button>
                      <div class="tb-sep"></div>
                      <button class="tb-btn" title="引用" @click="insertMarkdown('> ', '')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                      </button>
                      <button class="tb-btn" title="代码" @click="insertMarkdown('`', '`')">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      </button>
                      <div class="tb-sep"></div>
                      <button class="tb-btn" title="链接" @click="insertMarkdown('[', '](url)')"><Icon name="link" :size="12" /></button>
                      <button class="tb-btn" title="图片" @click="insertMarkdown('![', '](url)')"><Icon name="image" :size="12" /></button>
                      <div class="tb-sep"></div>
                      <div class="emoji-wrapper">
                        <button class="tb-btn" title="表情" @click="showEmoji = !showEmoji">😊</button>
                        <Transition name="ss-fade">
                          <div v-if="showEmoji" class="emoji-picker">
                            <div class="emoji-backdrop" @click="showEmoji = false"></div>
                            <div class="emoji-grid">
                              <button v-for="e in emojiList" :key="e" class="emoji-btn" @click="insertEmoji(e)">{{ e }}</button>
                            </div>
                          </div>
                        </Transition>
                      </div>
                    </div>
                    <textarea
                      ref="editorRef"
                      v-model="capsuleBody"
                      class="editor-area"
                      placeholder="亲爱的未来的我，&#10;&#10;此刻是 2026 年的冬天，窗外有雪……&#10;&#10;（这些文字将被封印在星际，待到那一天，宇宙会将它们归还给你）"
                    ></textarea>
                    <div class="editor-footer">
                      <span>Markdown 支持</span>
                      <span>{{ capsuleBody.length }} 字</span>
                    </div>
                  </div>
                </div>

                <div class="form-section">
                  <div class="form-label">附件（图片 / 视频 / 音频）</div>
                  <input ref="fileInputRef" type="file" multiple accept="image/*,video/*,audio/*" style="display:none" @change="handleFileSelect" />
                  <div class="media-grid">
                    <div v-for="att in attachments" :key="att.id" class="media-item">
                      <img v-if="att.type === 'image'" :src="att.url" class="media-thumb" />
                      <video v-else-if="att.type === 'video'" :src="att.url" class="media-thumb" muted />
                      <div v-else class="media-thumb media-file">
                        <Icon name="music" :size="20" />
                      </div>
                      <button class="media-remove" @click="removeAttachment(att.id)">×</button>
                      <div class="media-name">{{ att.file.name.slice(0, 12) }}</div>
                    </div>
                    <div class="media-add" @click="triggerFileUpload">
                      <Icon name="plus" :size="20" />
                      <span>添加</span>
                    </div>
                  </div>
                  <div class="form-hint">所有附件将上传至 IPFS，哈希值永久存储在链上（已选 {{ attachments.length }} 个）</div>
                </div>

                <div class="form-section">
                  <div class="section-eye">锁入链上资产（可选）</div>
                  <div v-if="!wallet.state.value.connected" class="asset-connect-hint" @click="wallet.openModal()">
                    <Icon name="wallet" :size="14" color="var(--text-muted)" />
                    <span>连接钱包后可锁入 Token / NFT</span>
                    <span class="connect-link">连接 →</span>
                  </div>
                  <div v-else class="asset-panel">
                    <div class="asset-btns">
                      <button class="asset-btn token-btn" @click="showTokenSelector = true">
                        <span class="ab-icon gold">◆</span>
                        <span>锁入 Token</span>
                        <span v-if="lockedTokens.length" class="ab-badge">{{ lockedTokens.length }}</span>
                        <span class="ab-arrow">+</span>
                      </button>
                      <button class="asset-btn nft-btn" @click="showNftSelector = true">
                        <span class="ab-icon purple">✦</span>
                        <span>锁入 NFT</span>
                        <span v-if="lockedNfts.length" class="ab-badge nft">{{ lockedNfts.length }}</span>
                        <span class="ab-arrow">+</span>
                      </button>
                    </div>

                    <div v-if="lockedTokens.length > 0" class="locked-preview">
                      <div class="lp-title">已锁入 Token</div>
                      <div v-for="tk in lockedTokens" :key="tk.symbol" class="lp-token">
                        <span class="lp-icon" :style="{ background: tk.color }">{{ tk.icon }}</span>
                        <span class="lp-amount">{{ tk.amount }} {{ tk.symbol }}</span>
                        <span class="lp-usd">≈ ${{ (parseFloat(tk.amount) * tk.usdPrice).toFixed(2) }}</span>
                        <button class="lp-remove" @click="removeLockedToken(tk.symbol)">✕</button>
                      </div>
                    </div>

                    <div v-if="lockedNfts.length > 0" class="locked-preview nft">
                      <div class="lp-title">已锁入 NFT</div>
                      <div v-for="nft in lockedNfts" :key="`${nft.contractAddress}:${nft.tokenId}`" class="lp-nft">
                        <img :src="nft.image" class="lp-nft-thumb" />
                        <div class="lp-nft-info">
                          <div class="lp-nft-name">{{ nft.name }}</div>
                          <div class="lp-nft-coll">{{ nft.collection }} · {{ nft.standard }}</div>
                        </div>
                        <button class="lp-remove" @click="removeLockedNft(`${nft.contractAddress}:${nft.tokenId}`)">✕</button>
                      </div>
                    </div>

                    <div v-if="hasLockedAssets" class="locked-total">
                      <span>锁入总价值</span>
                      <span class="lt-val">${{ totalLockedUsd.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>

                <div class="nav-btns">
                  <div class="spacer"></div>
                  <button class="btn-next" @click="goStep(2)">下一步：封印设置 →</button>
                </div>
              </div>
            </Transition>

            <!-- STEP 2 -->
            <Transition name="ss-fade" mode="out-in">
              <div v-if="createStep === 2" key="s2" class="step-content">
                <div class="section-eye">解锁方式</div>
                <div class="lock-modes">
                  <div
                    v-for="lm in lockModes"
                    :key="lm.key"
                    class="lock-mode"
                    :class="{ selected: lockMode === lm.key }"
                    @click="lockMode = lm.key"
                  >
                    <div class="lm-head">
                      <Icon :name="lm.icon" :size="16" color="var(--star-blue)" />
                      <div class="lm-name">{{ lm.name }}</div>
                    </div>
                    <div class="lm-desc">{{ lm.desc }}</div>
                  </div>
                </div>

                <div class="form-section">
                  <div class="form-label">开启时间</div>
                  <div class="date-trigger" @click="showDatePicker = !showDatePicker">
                    <Icon name="clock" :size="14" />
                    <span class="date-display">{{ formattedDate }}</span>
                    <span class="date-arrow">▾</span>
                  </div>
                  <Transition name="ss-fade">
                    <div v-if="showDatePicker" class="dp-panel">
                      <div class="dp-backdrop" @click="showDatePicker = false"></div>
                      <div class="dp-content">
                        <div class="dp-header">
                          <button class="dp-nav" @click="prevMonth">‹</button>
                          <span class="dp-month">{{ pickYear }} 年 {{ pickMonth + 1 }} 月</span>
                          <button class="dp-nav" @click="nextMonth">›</button>
                        </div>
                        <div class="dp-weekdays">
                          <span v-for="w in ['一','二','三','四','五','六','日']" :key="w">{{ w }}</span>
                        </div>
                        <div class="dp-days">
                          <span v-for="_ in firstDayOfWeek - 1" :key="'e'+_" class="dp-day empty"></span>
                          <button v-for="d in daysInMonth" :key="d" class="dp-day" :class="{ active: d === pickDay }" @click="pickDay = d">{{ d }}</button>
                        </div>
                        <div class="dp-time">
                          <div class="dp-time-group">
                            <button class="dp-t-btn" @click="pickHour = (pickHour + 1) % 24">▲</button>
                            <span class="dp-t-val">{{ String(pickHour).padStart(2,'0') }}</span>
                            <button class="dp-t-btn" @click="pickHour = (pickHour + 23) % 24">▼</button>
                          </div>
                          <span class="dp-t-sep">:</span>
                          <div class="dp-time-group">
                            <button class="dp-t-btn" @click="pickMinute = (pickMinute + 1) % 60">▲</button>
                            <span class="dp-t-val">{{ String(pickMinute).padStart(2,'0') }}</span>
                            <button class="dp-t-btn" @click="pickMinute = (pickMinute + 59) % 60">▼</button>
                          </div>
                        </div>
                        <button class="dp-confirm" @click="confirmDate">确认时间</button>
                      </div>
                    </div>
                  </Transition>
                </div>

                <div class="form-section">
                  <div class="unlock-option">
                    <div class="unlock-toggle" @click="allowEarlyUnlock = !allowEarlyUnlock">
                      <div class="toggle-track" :class="{ on: allowEarlyUnlock }">
                        <div class="toggle-thumb"></div>
                      </div>
                      <div>
                        <div class="toggle-title">允许提前解锁</div>
                        <div class="toggle-sub">支付惩罚金后可提前查看</div>
                      </div>
                    </div>
                    <Transition name="ss-slide">
                      <div v-if="allowEarlyUnlock" class="unlock-desc">
                        提前解锁需支付 <strong>0.01 BNB 惩罚金</strong>（锁入胶囊合约，到期后归收件方所有）。惩罚金越高，越能让自己坚持等待。
                      </div>
                    </Transition>
                  </div>
                </div>

                <div class="form-section">
                  <div class="section-eye">选择部署链</div>
                  <div class="chains">
                    <div
                      v-for="ch in chains"
                      :key="ch.key"
                      class="chain-item"
                      :class="{ selected: selectedChain === ch.key }"
                      :style="{ '--chain-color': ch.color }"
                      @click="selectedChain = ch.key"
                    >
                      <Icon name="hexagon" :size="22" :color="ch.color" />
                      <div class="chain-name">{{ ch.name }}</div>
                      <div class="chain-fee">{{ ch.fee }}</div>
                      <div class="chain-type-badge" v-if="ch.type !== 'evm'">{{ ch.type.toUpperCase() }}</div>
                    </div>
                  </div>
                </div>

                <div class="nav-btns">
                  <button class="btn-back" @click="goStep(1)">← 返回</button>
                  <button class="btn-next" @click="goStep(3)">预览并确认 →</button>
                </div>
              </div>
            </Transition>

            <!-- STEP 3 -->
            <Transition name="ss-fade" mode="out-in">
              <div v-if="createStep === 3" key="s3" class="step-content">
                <div class="section-eye">胶囊预览</div>
                <div class="preview-capsule">
                  <div class="preview-glow"></div>
                  <div class="preview-badge" :style="{ color: capsuleTypes.find(t => t.key === capsuleType)?.color }">
                    <Icon :name="capsuleTypes.find(t => t.key === capsuleType)?.icon || 'moon'" :size="12" />
                    {{ metaType }}胶囊
                  </div>
                  <div class="preview-title">{{ capsuleTitle || '未命名胶囊' }}</div>
                  <div class="preview-body">{{ capsuleBody || '（空白内容）' }}</div>
                  <div class="preview-lock-info">
                    <span><Icon name="clock" :size="12" /> {{ metaLock }}</span>
                    <span class="lock-cd"><Icon name="lock" :size="11" /> {{ countdownText }}</span>
                    <span><Icon name="hexagon" :size="12" /> {{ metaChain }}</span>
                    <span class="ipfs-ok">IPFS ✓</span>
                  </div>
                </div>

                <div v-if="hasLockedAssets" class="preview-assets">
                  <div class="section-eye">锁入资产</div>
                  <div v-for="tk in lockedTokens" :key="tk.symbol" class="pa-token">
                    <span class="pa-icon" :style="{ background: tk.color }">{{ tk.icon }}</span>
                    <span>{{ tk.amount }} {{ tk.symbol }}</span>
                    <span class="pa-usd">≈ ${{ (parseFloat(tk.amount) * tk.usdPrice).toFixed(2) }}</span>
                  </div>
                  <div v-for="nft in lockedNfts" :key="`${nft.contractAddress}:${nft.tokenId}`" class="pa-nft">
                    <img :src="nft.image" class="pa-nft-img" />
                    <span>{{ nft.name }}</span>
                    <span class="pa-nft-std">{{ nft.standard }}</span>
                  </div>
                  <div v-if="totalLockedUsd > 0" class="pa-total">总锁入价值: <strong>${{ totalLockedUsd.toFixed(2) }}</strong></div>
                </div>

                <div class="checklist">
                  <div class="section-eye">封印检查清单</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 内容已加密，仅你的钱包可解密</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 附件已上传 IPFS，CID: Qm7x3…f2a</div>
                  <div class="check-item"><span class="ci-ok">✓</span> {{ metaLock }}设定为 {{ countdownText }}</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 部署链：{{ metaChain }}</div>
                  <div v-if="lockedTokens.length > 0" class="check-item"><span class="ci-ok">✓</span> {{ lockedTokens.length }} 种 Token 已授权转入合约</div>
                  <div v-if="lockedNfts.length > 0" class="check-item"><span class="ci-ok">✓</span> {{ lockedNfts.length }} 个 NFT 已授权转移</div>
                  <div v-if="allowEarlyUnlock" class="check-item"><span class="ci-warn">!</span> 提前解锁已开启，惩罚金 10% 锁入资产</div>
                </div>

                <!-- Transaction Progress -->
                <Transition name="ss-fade">
                  <div v-if="txSteps.length > 0" class="tx-progress">
                    <div class="section-eye">链上交易进度</div>
                    <div v-for="(ts, idx) in txSteps" :key="idx" class="tx-step" :class="ts.status">
                      <div class="tx-step-icon">
                        <span v-if="ts.status === 'done'" class="tx-ok">✓</span>
                        <span v-else-if="ts.status === 'error'" class="tx-err">✗</span>
                        <span v-else class="tx-spin"></span>
                      </div>
                      <div class="tx-step-info">
                        <div class="tx-step-msg">{{ ts.message }}</div>
                        <a v-if="ts.txHash" :href="getExplorerTxUrl(selectedChain, ts.txHash)" target="_blank" class="tx-hash-link">
                          {{ ts.txHash.slice(0, 10) }}...{{ ts.txHash.slice(-6) }}
                        </a>
                      </div>
                    </div>
                  </div>
                </Transition>

                <div v-if="sealError" class="seal-error">
                  <Icon name="zap" :size="14" /> {{ sealError }}
                </div>

                <Transition name="ss-fade">
                  <div v-if="sealResult" class="seal-success">
                    <div class="ss-title">封印成功!</div>
                    <div class="ss-info">胶囊 #{{ sealResult.capsuleId }} 已上链 {{ sealResult.chain.toUpperCase() }}</div>
                    <a :href="sealResult.explorerUrl" target="_blank" class="ss-explorer">
                      在区块浏览器查看 →
                    </a>
                    <div class="ss-cid">IPFS CID: {{ sealResult.contentCID.slice(0, 20) }}...</div>
                  </div>
                </Transition>

                <div class="nav-btns step3-btns">
                  <button class="btn-back" @click="goStep(2)" :disabled="isSealing">← 返回</button>
                  <button class="seal-btn inline" @click="publishCapsule()" :disabled="isSealing || !wallet.state.value.connected">
                    <span v-if="isSealing" class="seal-spinner"></span>
                    <Icon v-else name="hexagon" :size="16" />
                    {{ isSealing ? '封印中...' : !wallet.state.value.connected ? '请先连接钱包' : '投入黑洞，完成封印' }}
                  </button>
                </div>
              </div>
            </Transition>
          </div>

          <!-- SIDEBAR -->
          <div class="create-sidebar">
            <div class="sidebar-card">
              <div class="card-label">胶囊预览</div>
              <div class="capsule-visual">
                <!-- 深空背景 -->
                <div class="cv-deep-space"></div>
                <!-- 能量场 -->
                <div class="cv-energy-field" :class="capsuleType"></div>
                <!-- 星尘 -->
                <div class="cv-stardust">
                  <div v-for="i in 25" :key="i" class="cv-dust"
                    :style="{
                      left: (5 + Math.random() * 90) + '%',
                      top: (5 + Math.random() * 90) + '%',
                      width: (0.5 + Math.random() * 1.5) + 'px',
                      height: (0.5 + Math.random() * 1.5) + 'px',
                      animationDuration: (3 + Math.random() * 5) + 's',
                      animationDelay: (Math.random() * 4) + 's'
                    }"
                  ></div>
                </div>
                <!-- 六角防护罩 -->
                <svg class="cv-hex-shield" viewBox="0 0 200 200" fill="none">
                  <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" stroke="rgba(99,179,237,0.12)" stroke-width="0.8" fill="none" />
                  <polygon points="100,25 168,63 168,137 100,175 32,137 32,63" stroke="rgba(183,148,244,0.08)" stroke-width="0.5" fill="none" stroke-dasharray="3 5" />
                  <polygon points="100,40 158,71 158,129 100,160 42,129 42,71" stroke="rgba(118,228,247,0.06)" stroke-width="0.5" fill="none" stroke-dasharray="2 6" />
                </svg>
                <!-- 数据流轨道环 -->
                <div class="cv-data-ring r1" :class="capsuleType"></div>
                <div class="cv-data-ring r2"></div>
                <!-- 轨道光点 -->
                <div class="cv-orbit-dot" v-for="k in 5" :key="'od'+k"
                  :style="{
                    animationDuration: (4 + k * 1.2) + 's',
                    animationDirection: k % 2 === 0 ? 'reverse' : 'normal',
                    '--od-dist': (38 + k * 11) + 'px',
                    '--od-color': ['#fbbf24','#60a5fa','#a78bfa','#22d3ee','#34d399'][k-1],
                    '--od-size': (1.5 + k * 0.3) + 'px'
                  }"
                ></div>
                <!-- ★ 核心胶囊 ★ -->
                <div class="cv-capsule-wrap">
                  <!-- 外层辉光 -->
                  <div class="cv-cap-glow" :class="capsuleType"></div>
                  <!-- 胶囊主体 -->
                  <div class="cv-capsule" :class="capsuleType">
                    <!-- 全息表面纹理 -->
                    <div class="cv-cap-holo"></div>
                    <!-- 顶部高光 -->
                    <div class="cv-cap-highlight"></div>
                    <!-- 中间能量带 -->
                    <div class="cv-cap-band" :class="capsuleType">
                      <div class="cv-band-glow"></div>
                    </div>
                    <!-- 内部流光 -->
                    <div class="cv-cap-flow"></div>
                    <!-- 封印符号 -->
                    <div class="cv-cap-seal">★</div>
                  </div>
                  <!-- 底部反射 -->
                  <div class="cv-cap-reflection" :class="capsuleType"></div>
                </div>
                <!-- 浮动符文 -->
                <div class="cv-rune r-1">⬡</div>
                <div class="cv-rune r-2">◇</div>
                <div class="cv-rune r-3">✦</div>
              </div>
              <div class="meta-item">
                <span class="meta-label">类型</span>
                <span class="meta-val">{{ metaType }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">解锁</span>
                <span class="meta-val">{{ metaLock }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">部署链</span>
                <span class="meta-val">{{ metaChain }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">加密</span>
                <span class="meta-val green">✓ 端对端</span>
              </div>
              <Transition name="ss-fade">
                <div v-if="unlockDate" class="tv-horizontal">
                  <div class="tv-h-point">
                    <div class="tv-h-dot seal-dot"></div>
                    <div class="tv-h-label">封存</div>
                    <div class="tv-h-date">{{ new Date().toISOString().slice(0,10).replace(/-/g, '.') }}</div>
                  </div>
                  <div class="tv-h-track">
                    <div class="tv-h-line"></div>
                    <div class="tv-h-dur">{{ durationText }}</div>
                  </div>
                  <div class="tv-h-point">
                    <div class="tv-h-dot open-dot"></div>
                    <div class="tv-h-label">开启</div>
                    <div class="tv-h-date">{{ formattedDate }}</div>
                  </div>
                </div>
              </Transition>

              <div v-if="lockedTokens.length > 0" class="meta-item">
                <span class="meta-label">Token</span>
                <span class="meta-val gold">{{ lockedTokens.length }} 种</span>
              </div>
              <div v-if="lockedNfts.length > 0" class="meta-item">
                <span class="meta-label">NFT</span>
                <span class="meta-val purple">{{ lockedNfts.length }} 个</span>
              </div>
              <div v-if="totalLockedUsd > 0" class="meta-item">
                <span class="meta-label">资产价值</span>
                <span class="meta-val gold">${{ totalLockedUsd.toFixed(2) }}</span>
              </div>
            </div>

            <div class="gas-card">
              <div class="gas-header">
                <span class="gas-title">费用估算</span>
                <span class="gas-amount">≈ ${{ gasEstimate.total }}</span>
              </div>
              <div class="gas-line"><span>合约调用</span><span>${{ gasEstimate.contract }}</span></div>
              <div class="gas-line"><span>IPFS 存储</span><span>${{ gasEstimate.ipfs }}</span></div>
              <div v-if="lockedTokens.length > 0" class="gas-line"><span>Token 授权 ({{ lockedTokens.length }})</span><span>${{ gasEstimate.tokenApprove }}</span></div>
              <div v-if="lockedNfts.length > 0" class="gas-line"><span>NFT 授权 ({{ lockedNfts.length }})</span><span>${{ gasEstimate.nftApprove }}</span></div>
              <div class="gas-line total"><span>合计</span><span class="green">${{ gasEstimate.total }}</span></div>
            </div>

            <div class="tip-card">
              <div class="tip-title"><Icon name="sparkles" :size="12" color="var(--star-gold)" /> 关于时代印记</div>
              <div class="tip-item">封印时区块高度将作为时间戳</div>
              <div class="tip-item">自动记录当时代币价格</div>
              <div class="tip-item">开启时生成纪念 NFT</div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ════════ MY CAPSULES ════════ -->
    <Transition name="ss-fade" mode="out-in">
      <div v-if="activeTab === 'mine'" key="mine" class="ss-panel">
        <div class="mine-header">
          <div class="mine-title">我的星封</div>
          <div class="mine-stats">
            <div class="m-stat"><span class="m-num">{{ sealedCount }}</span><span class="m-label">封印中</span></div>
            <div class="m-stat"><span class="m-num">{{ openedCount }}</span><span class="m-label">已开启</span></div>
            <div class="m-stat"><span class="m-num">{{ readyCount }}</span><span class="m-label">待开启</span></div>
          </div>
        </div>

        <div class="filter-bar">
          <button
            v-for="f in filters"
            :key="f"
            class="filter-pill"
            :class="{ active: activeFilter === f }"
            @click="activeFilter = f"
          >{{ filterLabels[f] }}</button>
        </div>

        <div class="capsule-grid">
          <div
            v-for="cap in filteredCapsules"
            :key="cap.id"
            class="capsule-card"
            @click="openCapsuleFromCard(cap)"
          >
            <div class="cc-visual" :class="cap.orbClass || cap.type">
              <div class="cc-ring-1"></div>
              <div class="cc-ring-2"></div>
              <div class="cc-orb" :class="cap.orbClass || ''"></div>
            </div>
            <div class="cc-status" :class="'status-' + cap.status">
              <span class="status-dot"></span>
              {{ cap.status === 'sealed' ? '封印中' : cap.status === 'ready' ? '待开启' : '已开启' }}
            </div>
            <div class="cc-body">
              <div class="cc-type-row">
                <Icon :name="cap.type === 'self' ? 'moon' : cap.type === 'other' ? 'star' : 'globe'" :size="12" />
                <span class="cc-type-label">{{ cap.type === 'self' ? '自言' : cap.type === 'other' ? '他言' : '世言' }} · {{ cap.chain }}</span>
              </div>
              <div class="cc-title">{{ cap.title }}</div>
              <div v-if="cap.lockedTokens?.length || cap.lockedNfts?.length" class="cc-assets">
                <span v-for="tk in (cap.lockedTokens || [])" :key="tk.symbol" class="cc-asset-tag token" :style="{ borderColor: tk.color + '40' }">
                  <span class="cc-at-icon" :style="{ color: tk.color }">{{ tk.icon }}</span>
                  {{ tk.amount }} {{ tk.symbol }}
                </span>
                <span v-for="nft in (cap.lockedNfts || [])" :key="`${nft.contractAddress}:${nft.tokenId}`" class="cc-asset-tag nft">
                  ✦ {{ nft.name }}
                </span>
              </div>
              <div v-if="cap.totalLockedUsd" class="cc-value">${{ cap.totalLockedUsd.toFixed(2) }}</div>
              <div v-if="cap.status === 'ready'" class="cc-countdown ready">✨ {{ cap.countdown }}</div>
              <div v-else-if="cap.countdown" class="cc-countdown sealed">
                <Icon name="lock" :size="11" /> {{ cap.countdown }}
              </div>
              <div v-else-if="cap.openDate" class="cc-opened">✨ 已于 {{ cap.openDate }} 开启</div>
              <div class="cc-meta">
                <span class="cc-date">封印于 {{ cap.sealDate }}</span>
                <span class="cc-chain" :style="{ color: cap.chainColor }">{{ cap.chain }}</span>
              </div>
              <a
                v-if="cap.txHash && cap.chainKey"
                :href="getExplorerTxUrl(cap.chainKey, cap.txHash)"
                target="_blank"
                class="cc-tx-link"
                @click.stop
              >
                Tx: {{ cap.txHash.slice(0, 6) }}...{{ cap.txHash.slice(-4) }} ↗
              </a>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ════════ RECEIVED ════════ -->
    <Transition name="ss-fade" mode="out-in">
      <div v-if="activeTab === 'received'" key="received" class="ss-panel">
        <div class="mine-header">
          <div class="mine-title">收到的星封</div>
          <div class="recv-sub">{{ receivedCapsules.filter(c => c.status !== 'opened').length }} 封未开启</div>
        </div>

        <div class="received-grid">
          <div
            v-for="rc in receivedCapsules"
            :key="rc.id"
            class="received-card"
            :style="{ '--from-color': rc.gradFrom, '--to-color': rc.gradTo }"
          >
            <div class="rc-from">
              <div class="rc-avatar" :style="{ background: `linear-gradient(135deg, ${rc.gradFrom}, ${rc.gradTo})` }">{{ rc.avatar }}</div>
              <div>
                <div class="rc-name">{{ rc.name }}</div>
                <div class="rc-addr">{{ rc.addr }}</div>
              </div>
              <div class="rc-status" :class="'status-' + rc.status">
                <span class="status-dot"></span>
                {{ rc.status === 'sealed' ? '封印中' : rc.status === 'ready' ? '待开启' : '已开启' }}
              </div>
            </div>
            <div class="rc-title">{{ rc.title }}</div>
            <div class="rc-preview">{{ rc.preview }}</div>
            <div class="rc-footer">
              <span class="rc-date">{{ rc.sealInfo }}</span>
              <span class="rc-action">{{ rc.action }} →</span>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Seal Overlay — 黑洞漩涡仪式 -->
    <Teleport to="body">
      <Transition name="ss-overlay">
        <div v-if="showSealOverlay" class="seal-overlay">
          <!-- 背景星尘 -->
          <div class="so-stars">
            <div v-for="i in 60" :key="i" class="so-star"
              :style="{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                width: (Math.random() * 2 + 0.5) + 'px',
                height: (Math.random() * 2 + 0.5) + 'px',
                animationDuration: (2 + Math.random() * 4) + 's',
                animationDelay: (Math.random() * 3) + 's'
              }"
            ></div>
          </div>

          <!-- 黑洞主体 -->
          <div class="so-blackhole" :class="'phase-' + sealPhase">
            <!-- 外层辉光 -->
            <div class="so-outer-glow"></div>
            <!-- 吸积盘 -->
            <div class="so-accretion"></div>
            <div class="so-accretion-inner"></div>
            <!-- 光子环 -->
            <div class="so-photon"></div>
            <!-- 引力透镜扭曲环 -->
            <div class="so-lens-ring r1"></div>
            <div class="so-lens-ring r2"></div>
            <div class="so-lens-ring r3"></div>
            <!-- 轨道粒子 -->
            <div class="so-orbit-p" v-for="j in 8" :key="j"
              :style="{
                animationDuration: (4 + j * 0.8) + 's',
                animationDirection: j % 2 === 0 ? 'reverse' : 'normal',
                animationDelay: (j * 0.3) + 's',
                '--p-color': ['#fbbf24','#60a5fa','#a78bfa','#f472b6','#34d399','#22d3ee','#f59e0b','#fff'][j-1],
                '--p-size': (2 + Math.random() * 2) + 'px',
                '--p-dist': (120 + j * 12) + 'px'
              }"
            ></div>
            <!-- 被吸入的胶囊球 -->
            <div class="so-capsule-orb" :class="{ sucked: sealPhase >= 2 }"></div>
            <!-- 黑洞核心 -->
            <div class="so-void" :class="{ expanded: sealPhase >= 3 }"></div>
          </div>

          <!-- 文字层 -->
          <div class="so-text-layer">
            <Transition name="so-txt" mode="out-in">
              <div v-if="sealPhase === 1" key="p1" class="so-phase-text">
                <div class="so-title">正在连接黑洞…</div>
                <div class="so-sub">引力场已锁定 · 开始吸入胶囊</div>
              </div>
              <div v-else-if="sealPhase === 2" key="p2" class="so-phase-text">
                <div class="so-title">胶囊正在被吞噬…</div>
                <div class="so-sub">加密内容 · 上传 IPFS · 写入智能合约</div>
              </div>
              <div v-else-if="sealPhase === 3" key="p3" class="so-phase-text">
                <div class="so-title">封印完成</div>
                <div class="so-sub">你的记忆已被宇宙保管 · 铸造纪念 NFT</div>
              </div>
              <div v-else-if="sealPhase === 4" key="p4" class="so-phase-text">
                <div class="so-title done">✦ 星封成功</div>
                <div class="so-sub">等待开启的那一天…</div>
              </div>
            </Transition>
            <!-- 进度条 -->
            <div class="so-progress">
              <div class="so-progress-bar" :style="{ width: sealPhase * 25 + '%' }"></div>
            </div>
            <div class="so-progress-steps">
              <span :class="{ active: sealPhase >= 1 }">连接</span>
              <span :class="{ active: sealPhase >= 2 }">加密</span>
              <span :class="{ active: sealPhase >= 3 }">上链</span>
              <span :class="{ active: sealPhase >= 4 }">完成</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Open Capsule Overlay — 开启仪式 -->
    <Teleport to="body">
      <Transition name="ss-overlay">
        <div v-if="showOpenOverlay" class="seal-overlay open-mode">
          <div class="so-stars">
            <div v-for="i in 60" :key="'os'+i" class="so-star"
              :style="{
                left: Math.random() * 100 + '%',
                top: Math.random() * 100 + '%',
                width: (Math.random() * 2 + 0.5) + 'px',
                height: (Math.random() * 2 + 0.5) + 'px',
                animationDuration: (2 + Math.random() * 4) + 's',
                animationDelay: (Math.random() * 3) + 's'
              }"
            ></div>
          </div>

          <div class="open-anim" :class="'phase-' + openPhase">
            <div class="oa-glow"></div>
            <div class="oa-ring r1"></div>
            <div class="oa-ring r2"></div>
            <div class="oa-ring r3"></div>
            <div class="oa-capsule" :class="{ cracking: openPhase >= 2, burst: openPhase >= 3 }">
              <div class="oa-cap-body"></div>
              <div class="oa-cap-band"></div>
              <div class="oa-crack" v-if="openPhase >= 2"></div>
            </div>
            <div v-if="openPhase >= 3" class="oa-burst-particles">
              <div v-for="p in 16" :key="'obp'+p" class="oa-bp"
                :style="{
                  '--bp-angle': (p * 22.5) + 'deg',
                  '--bp-dist': (60 + Math.random() * 80) + 'px',
                  '--bp-color': ['#fbbf24','#60a5fa','#a78bfa','#f472b6','#34d399','#22d3ee','#fbbf24','#60a5fa','#a78bfa','#f472b6','#34d399','#22d3ee','#fbbf24','#60a5fa','#a78bfa','#f472b6'][p-1],
                  '--bp-size': (3 + Math.random() * 4) + 'px',
                  animationDelay: (Math.random() * 0.3) + 's'
                }"
              ></div>
            </div>
          </div>

          <div class="so-text-layer">
            <Transition name="so-txt" mode="out-in">
              <div v-if="openPhase === 1" key="op1" class="so-phase-text">
                <div class="so-title">正在唤醒黑洞…</div>
                <div class="so-sub">引力场检测中 · 定位封印胶囊</div>
              </div>
              <div v-else-if="openPhase === 2" key="op2" class="so-phase-text">
                <div class="so-title">胶囊正在被拉出…</div>
                <div class="so-sub">解密中 · 验证签名 · 恢复内容</div>
              </div>
              <div v-else-if="openPhase === 3" key="op3" class="so-phase-text">
                <div class="so-title">封印破碎！</div>
                <div class="so-sub">内容正在呈现 · 时光重现</div>
              </div>
              <div v-else-if="openPhase === 4" key="op4" class="so-phase-text">
                <div class="so-title done">✦ 欢迎回来</div>
                <div class="so-sub">来自过去的记忆，此刻属于你…</div>
              </div>
            </Transition>
            <div class="so-progress">
              <div class="so-progress-bar" :style="{ width: openPhase * 25 + '%' }"></div>
            </div>
            <div class="so-progress-steps">
              <span :class="{ active: openPhase >= 1 }">唤醒</span>
              <span :class="{ active: openPhase >= 2 }">解密</span>
              <span :class="{ active: openPhase >= 3 }">破碎</span>
              <span :class="{ active: openPhase >= 4 }">呈现</span>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- Opened Capsule Content -->
    <Teleport to="body">
      <Transition name="ss-overlay">
        <div v-if="showOpenedContent && openedCapsule" class="opened-content-overlay">
          <div class="oc-backdrop" @click="closeOpenedContent"></div>
          <div class="oc-container">
            <button class="oc-close" @click="closeOpenedContent">×</button>
            <div class="oc-header">
              <div class="oc-badge">{{ openedCapsule.type }} · {{ openedCapsule.chain }}</div>
              <div class="oc-title">{{ openedCapsule.title }}</div>
              <div class="oc-seal-info">封印于 {{ openedCapsule.sealDate }} · 已开启</div>
            </div>
            <div class="oc-body">
              <div class="oc-text" v-html="openedCapsule.body.replace(/\n/g, '<br>')"></div>
              <div v-if="openedCapsule.attachments.length" class="oc-attachments">
                <div class="oc-att-title">附件</div>
                <div class="oc-att-grid">
                  <div v-for="(att, idx) in openedCapsule.attachments" :key="idx" class="oc-att-item">
                    <img v-if="att.type === 'image'" :src="att.url" class="oc-att-img" />
                    <video v-else-if="att.type === 'video'" :src="att.url" controls class="oc-att-img" />
                  </div>
                </div>
              </div>
            </div>
            <div class="oc-footer">
              <div class="oc-nft-hint">✦ 此胶囊已铸造为纪念 NFT</div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
    <!-- Token / NFT Selectors -->
    <TokenSelector
      :visible="showTokenSelector"
      :wallet-connected="wallet.state.value.connected"
      @close="showTokenSelector = false"
      @confirm="onTokensConfirmed"
    />
    <NftSelector
      :visible="showNftSelector"
      :wallet-connected="wallet.state.value.connected"
      @close="showNftSelector = false"
      @confirm="onNftsConfirmed"
    />
  </div>
</template>

<style scoped>
/* ═══ Variables — use global design system ═══ */
.ss-page {
  --star-blue: var(--accent-blue);
  --star-cyan: var(--accent-cyan);
  --star-purple: var(--accent-purple);
  --star-gold: var(--accent-warm);
  --star-pink: var(--accent-pink);
  --star-green: var(--accent-green);
  --ss-card: var(--bg-card);
  --ss-card-hover: var(--bg-glass);
  --ss-border: var(--border);
  --ss-border-bright: var(--border-hover);
  --sealed-glow: var(--glow-blue);
  --ss-r: var(--radius);
  --ss-r-sm: var(--radius-sm);
  position: relative;
  animation: ssIn 0.4s ease;
}
@keyframes ssIn { from { opacity: 0; transform: translateY(10px); } }

/* ═══ Glass card backdrop ═══ */
.capsule-type,
.date-input,
.editor-wrap,
.lock-mode,
.unlock-option,
.chain-item,
.preview-capsule,
.checklist,
.sidebar-card,
.gas-card,
.tip-card,
.capsule-card,
.cd-unit,
.received-card,
.asset-add,
.media-add,
.filter-pill {
  backdrop-filter: var(--blur-card);
}

/* ═══ Tabs ═══ */
.ss-tabs {
  display: flex;
  gap: 4px;
  padding-top: 8px;
  border-bottom: 1px solid var(--ss-border);
  margin-bottom: 36px;
}
.ss-tab {
  padding: 10px 18px;
  border-radius: var(--ss-r-sm) var(--ss-r-sm) 0 0;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid transparent;
  border-bottom: none;
  background: transparent;
  display: flex;
  align-items: center;
  gap: 6px;
}
.ss-tab:hover { color: var(--text-secondary); }
.ss-tab.active {
  color: var(--star-blue);
  background: var(--ss-card);
  border-color: var(--ss-border);
}
.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  background: rgba(99,179,237,0.15);
  border-radius: 99px;
  font-size: 10px;
  color: var(--star-blue);
  padding: 0 5px;
}

/* ═══ Transitions ═══ */
.ss-fade-enter-active { transition: all 0.3s ease; }
.ss-fade-leave-active { transition: all 0.15s ease; }
.ss-fade-enter-from { opacity: 0; transform: translateY(8px); }
.ss-fade-leave-to { opacity: 0; }
.ss-slide-enter-active, .ss-slide-leave-active { transition: all 0.25s ease; overflow: hidden; }
.ss-slide-enter-from, .ss-slide-leave-to { max-height: 0; opacity: 0; margin-top: 0; }
.ss-slide-enter-to { max-height: 100px; opacity: 1; }

/* ═══ Create Layout ═══ */
.create-layout {
  display: grid;
  grid-template-columns: 1fr 320px;
  gap: 28px;
  align-items: start;
}

/* Steps — pill style */
.steps { display: flex; gap: 8px; margin-bottom: 32px; }
.step-pill {
  display: flex; align-items: center; gap: 8px;
  padding: 8px 18px; border-radius: 99px;
  background: var(--ss-card); border: 1.5px solid var(--ss-border);
  color: var(--text-muted); font-size: 12px; font-weight: 500;
  cursor: pointer; transition: all 0.3s; font-family: inherit;
}
.step-pill:hover { border-color: var(--ss-border-bright); color: var(--text-secondary); }
.sp-num {
  width: 22px; height: 22px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 11px; font-weight: 700;
  background: rgba(99,179,237,0.08); color: var(--text-muted);
  transition: all 0.3s;
}
.sp-text { transition: color 0.3s; }
.step-pill.active {
  border-color: var(--star-blue); background: rgba(99,179,237,0.08);
  box-shadow: 0 0 20px rgba(99,179,237,0.15);
}
.step-pill.active .sp-num {
  background: var(--star-blue); color: white;
  box-shadow: 0 0 12px rgba(99,179,237,0.5);
}
.step-pill.active .sp-text { color: var(--text-primary); }
.step-pill.done {
  border-color: rgba(104,211,145,0.3); background: rgba(104,211,145,0.05);
}
.step-pill.done .sp-num {
  background: rgba(104,211,145,0.15); color: var(--star-green);
}
.step-pill.done .sp-text { color: var(--text-secondary); }

/* Section eye */
.section-eye {
  font-family: var(--font-mono);
  font-size: 10px; letter-spacing: 2.5px;
  color: var(--text-muted); text-transform: uppercase;
  margin-bottom: 12px;
  display: flex; align-items: center; gap: 8px;
}
.section-eye::after {
  content: ''; flex: 1; height: 1px; background: var(--ss-border);
}

/* Capsule types */
.capsule-types { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 24px; }
.capsule-type {
  background: var(--ss-card);
  border: 1.5px solid var(--ss-border);
  border-radius: var(--ss-r);
  padding: 18px 16px;
  cursor: pointer; transition: all 0.25s;
  text-align: center; position: relative; overflow: hidden;
}
.capsule-type::before {
  content: ''; position: absolute; inset: 0;
  background: var(--type-color); opacity: 0; transition: opacity 0.25s;
}
.capsule-type:hover::before { opacity: 0.04; }
.capsule-type.selected { border-color: var(--type-color); box-shadow: 0 0 20px color-mix(in srgb, var(--type-color) 20%, transparent); }
.capsule-type.selected::before { opacity: 0.07; }
.type-check {
  position: absolute; top: 10px; right: 10px;
  width: 18px; height: 18px; border-radius: 50%;
  background: var(--type-color);
  display: none; align-items: center; justify-content: center;
}
.capsule-type.selected .type-check { display: flex; }
.type-icon { margin-bottom: 8px; position: relative; }
.type-name { font-size: 13px; font-weight: 600; color: var(--text-primary); margin-bottom: 4px; position: relative; }
.type-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; position: relative; }

/* Form */
.form-section { margin-bottom: 24px; }
.form-label {
  font-size: 12px; font-weight: 500; color: var(--text-secondary);
  letter-spacing: 0.5px; margin-bottom: 8px;
  display: flex; align-items: center; gap: 6px;
}
.req { color: var(--star-pink); font-size: 14px; }
.form-hint { font-size: 11px; color: var(--text-muted); margin-top: 6px; }

.ss-input {
  width: 100%;
  background: var(--ss-card);
  border: 1px solid var(--ss-border);
  border-radius: var(--ss-r-sm);
  padding: 12px 14px;
  color: var(--text-primary);
  font-family: inherit; font-size: 13px;
  outline: none; transition: border-color 0.2s;
}
.ss-input:focus { border-color: var(--ss-border-bright); }
.ss-input::placeholder { color: var(--text-muted); }
.ss-input.addr { padding-left: 32px; font-family: var(--font-mono); font-size: 12px; }

.addr-wrap { position: relative; }
.addr-prefix {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  font-family: var(--font-mono); font-size: 11px; color: var(--star-blue);
}

/* Editor */
.editor-wrap {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); overflow: hidden; transition: border-color 0.2s;
}
.editor-wrap:focus-within { border-color: var(--ss-border-bright); }
.editor-toolbar {
  display: flex; gap: 2px; padding: 8px 12px;
  border-bottom: 1px solid var(--ss-border); flex-wrap: wrap;
}
.tb-btn {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border-radius: 6px; font-size: 12px; color: var(--text-muted);
  cursor: pointer; transition: all 0.15s;
  border: none; background: transparent;
}
.tb-btn:hover { background: rgba(99,179,237,0.1); color: var(--text-primary); }
.tb-sep { width: 1px; height: 20px; background: var(--ss-border); margin: 4px; align-self: center; }
.editor-area {
  width: 100%; min-height: 200px; padding: 16px;
  background: transparent; border: none; outline: none;
  color: var(--text-primary); font-size: 15px; line-height: 1.75; resize: none;
}
.editor-area::placeholder { color: var(--text-muted); font-style: italic; }
/* Emoji picker */
.emoji-wrapper { position: relative; }
.emoji-picker {
  position: absolute; top: 36px; left: -80px; z-index: 100;
}
.emoji-backdrop {
  position: fixed; inset: 0; z-index: -1;
}
.emoji-grid {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
  padding: 10px; background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); box-shadow: 0 8px 32px rgba(0,0,0,0.4);
  width: 260px;
  backdrop-filter: var(--blur-card);
}
.emoji-btn {
  width: 32px; height: 32px; border: none; background: transparent;
  border-radius: 6px; font-size: 18px; cursor: pointer; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.emoji-btn:hover { background: rgba(99,179,237,0.15); transform: scale(1.2); }

.editor-footer {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; border-top: 1px solid var(--ss-border);
  font-family: var(--font-mono); font-size: 10px; color: var(--text-muted);
}

/* Media */
.media-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.media-add {
  aspect-ratio: 1; background: var(--ss-card);
  border: 1.5px dashed var(--ss-border); border-radius: var(--ss-r-sm);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 6px; cursor: pointer; transition: all 0.2s; color: var(--text-muted);
}
.media-add:hover { border-color: var(--ss-border-bright); color: var(--text-secondary); background: var(--ss-card-hover); }
.media-add span { font-size: 11px; font-weight: 500; }

/* Assets — Connect Hint */
.asset-connect-hint {
  display: flex; align-items: center; gap: 8px; padding: 14px 16px;
  background: rgba(99,179,237,0.04); border: 1px dashed rgba(99,179,237,0.2);
  border-radius: var(--ss-r-sm); cursor: pointer; transition: all 0.2s;
  font-size: 12px; color: var(--text-muted);
}
.asset-connect-hint:hover { border-color: rgba(99,179,237,0.4); background: rgba(99,179,237,0.06); }
.connect-link { margin-left: auto; color: var(--star-blue); font-weight: 600; }

/* Assets — Panel */
.asset-panel { display: flex; flex-direction: column; gap: 10px; }
.asset-btns { display: flex; gap: 10px; }
.asset-btn {
  flex: 1; display: flex; align-items: center; gap: 8px; padding: 12px 14px;
  background: var(--ss-card); border: 1px solid var(--ss-border); border-radius: var(--ss-r-sm);
  cursor: pointer; transition: all 0.25s; font-size: 13px; color: var(--text-primary); font-weight: 500;
}
.asset-btn:hover { border-color: var(--ss-border-bright); transform: translateY(-1px); }
.ab-icon { font-size: 15px; font-weight: 700; }
.ab-icon.gold { color: var(--star-gold); }
.ab-icon.purple { color: var(--star-purple); }
.ab-badge { font-size: 10px; padding: 1px 6px; border-radius: 8px; background: rgba(251,191,36,0.15); color: var(--star-gold); font-weight: 700; }
.ab-badge.nft { background: rgba(167,139,250,0.15); color: var(--star-purple); }
.ab-arrow { margin-left: auto; color: var(--text-muted); font-size: 16px; }

/* Locked Preview */
.locked-preview { padding: 10px 12px; border-radius: var(--ss-r-sm); background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.1); }
.locked-preview.nft { background: rgba(167,139,250,0.03); border-color: rgba(167,139,250,0.1); }
.lp-title { font-size: 10px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
.lp-token { display: flex; align-items: center; gap: 8px; padding: 5px 0; font-size: 13px; color: var(--text-primary); }
.lp-icon { width: 22px; height: 22px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; color: white; font-weight: 700; flex-shrink: 0; }
.lp-amount { font-weight: 600; font-family: var(--font-mono); }
.lp-usd { margin-left: auto; font-size: 11px; color: var(--text-muted); }
.lp-remove { color: var(--text-muted); font-size: 11px; cursor: pointer; margin-left: 6px; opacity: 0.5; }
.lp-remove:hover { opacity: 1; color: var(--star-pink); }
.lp-nft { display: flex; align-items: center; gap: 10px; padding: 5px 0; }
.lp-nft-thumb { width: 36px; height: 36px; border-radius: 8px; object-fit: cover; flex-shrink: 0; }
.lp-nft-info { flex: 1; min-width: 0; }
.lp-nft-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.lp-nft-coll { font-size: 10px; color: var(--text-muted); }
.locked-total {
  display: flex; justify-content: space-between; padding: 10px 12px;
  border-radius: var(--ss-r-sm); background: rgba(251,191,36,0.06);
  border: 1px solid rgba(251,191,36,0.15);
  font-size: 12px; color: var(--text-secondary); font-weight: 500;
}
.lt-val { color: var(--star-gold); font-weight: 700; font-family: var(--font-mono); font-size: 14px; }

/* Preview Assets (Step 3) */
.preview-assets { margin-bottom: 16px; padding: 12px; border-radius: var(--ss-r-sm); background: rgba(251,191,36,0.03); border: 1px solid rgba(251,191,36,0.1); }
.pa-token { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; color: var(--text-primary); }
.pa-icon { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; color: white; font-weight: 700; }
.pa-usd { margin-left: auto; font-size: 11px; color: var(--text-muted); }
.pa-nft { display: flex; align-items: center; gap: 8px; padding: 4px 0; font-size: 13px; color: var(--text-primary); }
.pa-nft-img { width: 24px; height: 24px; border-radius: 6px; object-fit: cover; }
.pa-nft-std { margin-left: auto; font-size: 10px; color: var(--text-muted); }
.pa-total { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(251,191,36,0.15); font-size: 12px; color: var(--text-secondary); }
.pa-total strong { color: var(--star-gold); font-family: var(--font-mono); }

/* Capsule Card — Asset Tags */
.cc-assets { display: flex; flex-wrap: wrap; gap: 4px; margin: 6px 0 4px; }
.cc-asset-tag {
  font-size: 10px; padding: 2px 7px; border-radius: 6px; display: flex; align-items: center; gap: 3px;
  background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
  color: var(--text-secondary); white-space: nowrap;
}
.cc-asset-tag.token { font-family: var(--font-mono); }
.cc-asset-tag.nft { color: var(--star-purple); border-color: rgba(167,139,250,0.2); font-size: 9px; max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
.cc-at-icon { font-size: 10px; }
.cc-value { font-size: 12px; font-weight: 700; color: var(--star-gold); font-family: var(--font-mono); margin-bottom: 2px; }

/* Sidebar meta colors */
.meta-val.gold { color: var(--star-gold); }
.meta-val.purple { color: var(--star-purple); }

/* Lock modes */
.lock-modes { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 20px; }
.lock-mode {
  background: var(--ss-card); border: 1.5px solid var(--ss-border);
  border-radius: var(--ss-r-sm); padding: 14px; cursor: pointer; transition: all 0.2s;
}
.lock-mode:hover { border-color: var(--ss-border-bright); }
.lock-mode.selected { border-color: var(--star-blue); background: rgba(99,179,237,0.07); }
.lm-head { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
.lm-name { font-size: 13px; font-weight: 600; }
.lm-desc { font-size: 11px; color: var(--text-muted); line-height: 1.4; }

/* Time Visual — Horizontal in Sidebar */
.tv-horizontal {
  display: flex; align-items: center; gap: 0;
  padding: 12px; margin: 8px 0;
  border-radius: 10px; background: rgba(99,179,237,0.03);
  border: 1px solid rgba(99,179,237,0.08);
}
.tv-h-point { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; min-width: 0; }
.tv-h-dot {
  width: 8px; height: 8px; border-radius: 50%;
  box-shadow: 0 0 6px currentColor;
}
.tv-h-dot.seal-dot { background: var(--star-blue); color: rgba(99,179,237,0.5); }
.tv-h-dot.open-dot { background: var(--star-gold); color: rgba(251,191,36,0.5); }
.tv-h-label { font-size: 9px; color: var(--text-muted); margin-top: 4px; letter-spacing: 0.5px; }
.tv-h-date { font-size: 10px; font-weight: 600; font-family: var(--font-mono); color: var(--text-secondary); margin-top: 1px; white-space: nowrap; }
.tv-h-point:first-child .tv-h-date { color: var(--star-blue); }
.tv-h-point:last-child .tv-h-date { color: var(--star-gold); }
.tv-h-track { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 0 6px; min-width: 30px; }
.tv-h-line {
  width: 100%; height: 2px; border-radius: 1px;
  background: linear-gradient(90deg, var(--star-blue), var(--star-gold));
  opacity: 0.4; margin-top: 3px;
}
.tv-h-dur {
  font-size: 10px; font-weight: 700; color: var(--text-primary); font-family: var(--font-mono);
  margin-top: 4px; white-space: nowrap;
}

/* Unlock */
.unlock-option {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r-sm); padding: 14px;
}
.unlock-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.toggle-track {
  width: 36px; height: 20px; border-radius: 10px;
  background: var(--ss-border); position: relative;
  transition: background 0.2s; flex-shrink: 0;
}
.toggle-thumb {
  position: absolute; top: 3px; left: 3px;
  width: 14px; height: 14px; border-radius: 50%;
  background: white; transition: transform 0.2s;
}
.toggle-track.on { background: var(--star-blue); }
.toggle-track.on .toggle-thumb { transform: translateX(16px); }
.toggle-title { font-size: 13px; font-weight: 500; }
.toggle-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.unlock-desc {
  font-size: 11px; color: var(--text-muted); margin-top: 10px; line-height: 1.5;
}
.unlock-desc strong { color: var(--star-gold); }

/* Chains */
.chains { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.chain-item {
  position: relative;
  background: var(--ss-card); border: 1.5px solid var(--ss-border);
  border-radius: var(--ss-r-sm); padding: 12px 8px;
  text-align: center; cursor: pointer; transition: all 0.2s;
}
.chain-item:hover { border-color: var(--ss-border-bright); }
.chain-item.selected {
  border-color: var(--chain-color);
  background: color-mix(in srgb, var(--chain-color) 8%, transparent);
  box-shadow: 0 0 14px color-mix(in srgb, var(--chain-color) 15%, transparent);
}
.chain-name { font-size: 11px; font-weight: 600; color: var(--text-secondary); margin-top: 4px; }
.chain-fee { font-family: var(--font-mono); font-size: 9px; color: var(--text-muted); margin-top: 2px; }

/* Nav btns */
.nav-btns { display: flex; gap: 12px; margin-top: 16px; }
.spacer { flex: 2; }
.btn-back {
  flex: 1; padding: 12px 20px;
  background: rgba(99,179,237,0.06); border: 1px solid rgba(99,179,237,0.15);
  border-radius: 99px; color: var(--text-secondary);
  font-size: 13px; cursor: pointer; transition: all 0.25s; font-family: inherit;
}
.btn-back:hover {
  border-color: var(--star-blue); color: var(--text-primary);
  background: rgba(99,179,237,0.1);
}
.btn-next {
  flex: 2; padding: 12px 20px;
  background: linear-gradient(135deg, var(--star-blue), rgba(99,179,237,0.8)); border: none;
  border-radius: 99px; color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.3s;
  box-shadow: 0 4px 20px rgba(99,179,237,0.3);
  font-family: inherit; position: relative; overflow: hidden;
}
.btn-next::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.15), transparent);
}
.btn-next:hover { transform: translateY(-2px); box-shadow: 0 8px 28px rgba(99,179,237,0.4); }
.step3-btns .btn-back { flex: 0 0 auto; }
.step3-btns .seal-btn.inline { flex: 1; }

/* Seal btn */
.seal-btn {
  width: 100%; padding: 14px 24px;
  background: linear-gradient(135deg, #7c3aed, #2563eb, #0891b2);
  background-size: 200% 200%; animation: sealBtnShift 3s ease infinite;
  border: none; border-radius: 99px; color: white;
  font-size: 14px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.3s; box-shadow: 0 4px 24px rgba(99,58,237,0.3);
  position: relative; overflow: hidden; font-family: inherit;
}
.seal-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.12), transparent 60%);
}
.seal-btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 36px rgba(99,58,237,0.45); }
.seal-btn.inline { width: auto; margin-top: 0; }
@keyframes sealBtnShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

/* Preview step 3 */
.preview-capsule {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: 20px; padding: 28px; margin-bottom: 20px;
  position: relative; overflow: hidden;
}
.preview-glow {
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, var(--star-blue), transparent); opacity: 0.5;
}
.preview-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 12px; border-radius: 99px;
  font-size: 11px; font-weight: 500;
  background: rgba(99,179,237,0.1); border: 1px solid rgba(99,179,237,0.2);
  margin-bottom: 16px;
}
.preview-title { font-size: 22px; font-weight: 600; margin-bottom: 10px; line-height: 1.3; }
.preview-body {
  font-size: 14px; color: var(--text-secondary); line-height: 1.7;
  display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden;
}
.preview-lock-info {
  display: flex; align-items: center; gap: 16px; margin-top: 20px;
  padding-top: 16px; border-top: 1px solid var(--ss-border);
  font-size: 12px; color: var(--text-muted);
}
.lock-cd {
  font-family: var(--font-mono); font-size: 11px; color: var(--star-gold);
  background: rgba(251,176,64,0.1); padding: 4px 10px; border-radius: 6px;
  display: flex; align-items: center; gap: 5px;
}
.ipfs-ok { margin-left: auto; font-family: var(--font-mono); font-size: 10px; color: var(--star-green); }

.checklist {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); padding: 18px; margin-bottom: 16px;
}
.check-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; line-height: 1.5;
}
.check-item:last-child { margin-bottom: 0; }
.ci-ok { color: var(--star-green); font-weight: 700; width: 16px; text-align: center; flex-shrink: 0; }
.ci-warn { color: var(--star-gold); font-weight: 700; width: 16px; text-align: center; flex-shrink: 0; }

/* ═══ Sidebar ═══ */
.create-sidebar {}
.sidebar-card {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); padding: 20px; margin-bottom: 16px;
  overflow: hidden;
}
.card-label {
  font-size: 10px; letter-spacing: 2px; color: var(--text-muted);
  font-family: var(--font-mono); margin-bottom: 14px; text-transform: uppercase;
}
.capsule-visual {
  width: 100%; aspect-ratio: 1;
  background: radial-gradient(circle at 30% 25%, rgba(99,179,237,0.15), var(--bg-deep, #070d1a));
  border-radius: var(--radius);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden; margin-bottom: 14px;
}

/* ── 深空背景 ── */
.cv-deep-space {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse 60% 40% at 30% 25%, rgba(99,179,237,0.05) 0%, transparent 70%),
    radial-gradient(ellipse 50% 50% at 70% 70%, rgba(183,148,244,0.06) 0%, transparent 70%),
    radial-gradient(ellipse 35% 35% at 50% 15%, rgba(118,228,247,0.04) 0%, transparent 60%);
  animation: cvSpaceDrift 15s ease-in-out infinite alternate;
}
@keyframes cvSpaceDrift { 0% { opacity: 0.5; } 100% { opacity: 1; transform: scale(1.03); } }

/* ── 能量场 ── */
.cv-energy-field {
  position: absolute; width: 170px; height: 170px;
  border-radius: 50%; filter: blur(18px); opacity: 0.4;
  background: conic-gradient(from 0deg,
    rgba(99,179,237,0.0) 0deg, rgba(99,179,237,0.15) 90deg,
    rgba(183,148,244,0.12) 180deg, rgba(118,228,247,0.1) 270deg,
    rgba(99,179,237,0.0) 360deg);
  animation: cvFieldSpin 12s linear infinite;
}
.cv-energy-field.other { background: conic-gradient(from 0deg,
  rgba(183,148,244,0.0) 0deg, rgba(183,148,244,0.18) 90deg,
  rgba(246,135,179,0.12) 180deg, rgba(99,179,237,0.1) 270deg,
  rgba(183,148,244,0.0) 360deg); }
.cv-energy-field.world { background: conic-gradient(from 0deg,
  rgba(251,176,64,0.0) 0deg, rgba(251,176,64,0.18) 90deg,
  rgba(251,113,94,0.12) 180deg, rgba(183,148,244,0.08) 270deg,
  rgba(251,176,64,0.0) 360deg); }
@keyframes cvFieldSpin { to { transform: rotate(360deg); } }

/* ── 星尘 ── */
.cv-stardust { position: absolute; inset: 0; pointer-events: none; }
.cv-dust {
  position: absolute; border-radius: 50%; background: white;
  animation: cvDustTwinkle ease-in-out infinite alternate;
}
@keyframes cvDustTwinkle { from { opacity: 0.05; } to { opacity: 0.65; } }

/* ── 六角防护罩 SVG ── */
.cv-hex-shield {
  position: absolute; inset: 0; width: 100%; height: 100%;
  animation: cvHexSpin 40s linear infinite;
  opacity: 0.5;
}
@keyframes cvHexSpin { to { transform: rotate(360deg); } }

/* ── 数据流环 ── */
.cv-data-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(99,179,237,0.15);
  animation: cvDataPulse 4s ease-in-out infinite;
}
.cv-data-ring.r1 {
  width: 130px; height: 130px;
  border: 1px dashed rgba(99,179,237,0.2);
  animation-duration: 3.5s;
}
.cv-data-ring.r1.other { border-color: rgba(183,148,244,0.2); }
.cv-data-ring.r1.world { border-color: rgba(251,176,64,0.2); }
.cv-data-ring.r2 {
  width: 165px; height: 165px;
  border: 1px dotted rgba(183,148,244,0.1);
  animation-delay: 1s; animation-duration: 5s;
}
@keyframes cvDataPulse {
  0%,100% { opacity: 0.2; transform: scale(1) rotate(0deg); }
  50% { opacity: 0.6; transform: scale(1.04) rotate(8deg); }
}

/* ── 轨道光点 ── */
.cv-orbit-dot {
  position: absolute;
  width: var(--od-size, 2px); height: var(--od-size, 2px);
  border-radius: 50%;
  background: var(--od-color, white);
  box-shadow: 0 0 5px var(--od-color, white);
  left: 50%; top: 50%;
  margin-left: calc(var(--od-size, 2px) / -2);
  margin-top: calc(0px - var(--od-dist, 50px));
  transform-origin: calc(var(--od-size, 2px) / 2) var(--od-dist, 50px);
  animation: cvOrbitDot linear infinite;
}
@keyframes cvOrbitDot { to { transform: rotate(360deg); } }

/* ═══ 核心胶囊 ═══ */
.cv-capsule-wrap {
  position: relative; z-index: 5;
  animation: cvCapFloat 5s ease-in-out infinite;
}
@keyframes cvCapFloat {
  0%,100% { transform: translateY(0); }
  50% { transform: translateY(-8px); }
}

/* 辉光 */
.cv-cap-glow {
  position: absolute; inset: -30px -15px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(99,179,237,0.3) 0%, transparent 70%);
  animation: cvCapGlowPulse 3s ease-in-out infinite;
  filter: blur(5px);
}
.cv-cap-glow.other { background: radial-gradient(ellipse, rgba(183,148,244,0.3) 0%, transparent 70%); }
.cv-cap-glow.world { background: radial-gradient(ellipse, rgba(251,176,64,0.3) 0%, transparent 70%); }
@keyframes cvCapGlowPulse { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.1); } }

/* 胶囊主体 — 圆角药丸形 */
.cv-capsule {
  width: 52px; height: 90px;
  border-radius: 26px;
  background: linear-gradient(180deg,
    #b0d4ff 0%, #60a5fa 15%, #2563eb 35%,
    #1e40af 50%, #1d4ed8 65%, #60a5fa 85%, #93c5fd 100%);
  box-shadow:
    0 0 25px rgba(99,179,237,0.5),
    0 0 50px rgba(99,179,237,0.2),
    0 0 80px rgba(99,179,237,0.1),
    inset 0 0 20px rgba(255,255,255,0.08);
  position: relative; overflow: hidden;
  border: 1px solid rgba(148,196,255,0.25);
}
.cv-capsule.other {
  background: linear-gradient(180deg,
    #e9ddff 0%, #a78bfa 15%, #7c3aed 35%,
    #5b21b6 50%, #7c3aed 65%, #a78bfa 85%, #ddd6fe 100%);
  box-shadow: 0 0 25px rgba(183,148,244,0.5), 0 0 50px rgba(183,148,244,0.2), 0 0 80px rgba(183,148,244,0.1), inset 0 0 20px rgba(255,255,255,0.08);
  border-color: rgba(183,148,244,0.25);
}
.cv-capsule.world {
  background: linear-gradient(180deg,
    #fef3c7 0%, #fbbf24 15%, #d97706 35%,
    #b45309 50%, #d97706 65%, #fbbf24 85%, #fef3c7 100%);
  box-shadow: 0 0 25px rgba(251,176,64,0.5), 0 0 50px rgba(251,176,64,0.2), 0 0 80px rgba(251,176,64,0.1), inset 0 0 20px rgba(255,255,255,0.1);
  border-color: rgba(251,176,64,0.25);
}

/* 全息纹理 */
.cv-cap-holo {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(
    0deg,
    transparent 0px,
    rgba(255,255,255,0.02) 1px,
    transparent 2px,
    transparent 5px
  );
  animation: cvHoloShift 4s linear infinite;
}
@keyframes cvHoloShift { to { background-position: 0 20px; } }

/* 顶部高光 */
.cv-cap-highlight {
  position: absolute; top: 6px; left: 10px; right: 14px;
  height: 22px; border-radius: 50%;
  background: radial-gradient(ellipse at 45% 40%, rgba(255,255,255,0.45) 0%, transparent 70%);
}

/* 中间能量带 — 胶囊分界线 */
.cv-cap-band {
  position: absolute; left: -2px; right: -2px;
  top: 50%; transform: translateY(-50%);
  height: 6px;
  background: linear-gradient(90deg,
    transparent, rgba(255,255,255,0.6), rgba(99,179,237,0.8), rgba(255,255,255,0.6), transparent);
  border-radius: 3px;
  overflow: hidden;
}
.cv-cap-band.other {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(183,148,244,0.9), rgba(255,255,255,0.6), transparent);
}
.cv-cap-band.world {
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(251,176,64,0.9), rgba(255,255,255,0.6), transparent);
}
.cv-band-glow {
  position: absolute; inset: -4px -20px;
  background: linear-gradient(90deg, transparent, rgba(99,179,237,0.3), transparent);
  animation: cvBandPulse 2s ease-in-out infinite;
}
@keyframes cvBandPulse { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

/* 内部流光 */
.cv-cap-flow {
  position: absolute; inset: 0;
  background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%);
  animation: cvFlowMove 3s ease-in-out infinite;
}
@keyframes cvFlowMove {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100%); }
}

/* 封印符号 */
.cv-cap-seal {
  position: absolute; bottom: 16px;
  left: 50%; transform: translateX(-50%);
  font-size: 10px; color: rgba(255,255,255,0.35);
  text-shadow: 0 0 8px rgba(99,179,237,0.3);
  letter-spacing: 1px;
}

/* 底部反射 */
.cv-cap-reflection {
  width: 36px; height: 18px;
  border-radius: 50%;
  background: radial-gradient(ellipse, rgba(99,179,237,0.2) 0%, transparent 70%);
  margin: 8px auto 0;
  filter: blur(4px);
}
.cv-cap-reflection.other { background: radial-gradient(ellipse, rgba(183,148,244,0.2) 0%, transparent 70%); }
.cv-cap-reflection.world { background: radial-gradient(ellipse, rgba(251,176,64,0.2) 0%, transparent 70%); }

/* ── 浮动符文 ── */
.cv-rune {
  position: absolute;
  font-size: 10px;
  color: rgba(99,179,237,0.2);
  animation: cvRuneFloat 6s ease-in-out infinite;
}
.cv-rune.r-1 { top: 18%; left: 14%; animation-delay: 0s; font-size: 14px; color: rgba(183,148,244,0.15); }
.cv-rune.r-2 { top: 28%; right: 16%; animation-delay: 2s; font-size: 11px; color: rgba(118,228,247,0.15); }
.cv-rune.r-3 { bottom: 20%; left: 20%; animation-delay: 4s; font-size: 9px; color: rgba(251,176,64,0.2); }
@keyframes cvRuneFloat {
  0%,100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
  50% { transform: translateY(-6px) rotate(10deg); opacity: 0.7; }
}

.meta-item {
  display: flex; justify-content: space-between; align-items: center;
  padding: 7px 0; border-bottom: 1px solid var(--ss-border); font-size: 12px;
}
.meta-item:last-child { border-bottom: none; }
.meta-label { color: var(--text-muted); }
.meta-val { font-family: var(--font-mono); font-size: 11px; color: var(--text-secondary); }
.meta-val.green { color: var(--star-green); }

.gas-card {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); padding: 14px 16px; margin-bottom: 16px;
}
.gas-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.gas-title { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-mono); }
.gas-amount { font-family: var(--font-mono); font-size: 13px; color: var(--star-green); }
.gas-line {
  display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted);
  padding: 3px 0;
}
.gas-line span:last-child { font-family: var(--font-mono); color: var(--text-secondary); }
.gas-line.total { border-top: 1px solid var(--ss-border); padding-top: 6px; margin-top: 3px; }
.gas-line.total span:first-child { color: var(--text-secondary); }
.green { color: var(--star-green) !important; }

.tip-card {
  background: var(--ss-card); border: 1px solid rgba(251,176,64,0.15);
  border-radius: var(--ss-r); padding: 14px 16px;
}
.tip-title {
  font-size: 11px; color: var(--star-gold); margin-bottom: 8px;
  display: flex; align-items: center; gap: 5px;
}
.tip-item { font-size: 11px; color: var(--text-muted); line-height: 1.7; padding-left: 12px; position: relative; }
.tip-item::before { content: '•'; position: absolute; left: 0; }

/* ═══ MY CAPSULES ═══ */
.mine-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 28px; }
.mine-title { font-size: 20px; font-weight: 600; }
.mine-stats { display: flex; gap: 20px; }
.m-stat { text-align: right; }
.m-num { font-family: var(--font-mono); font-size: 18px; font-weight: 500; color: var(--star-blue); display: block; }
.m-label { font-size: 10px; color: var(--text-muted); letter-spacing: 1px; }
.recv-sub { font-size: 12px; color: var(--text-muted); }

.filter-bar { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }
.filter-pill {
  padding: 6px 14px; border-radius: 99px;
  border: 1px solid var(--ss-border);
  font-size: 12px; color: var(--text-muted);
  cursor: pointer; transition: all 0.2s; background: transparent;
}
.filter-pill:hover { border-color: var(--ss-border-bright); color: var(--text-secondary); }
.filter-pill.active { background: rgba(99,179,237,0.1); border-color: rgba(99,179,237,0.3); color: var(--star-blue); }

.capsule-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 18px; }
.capsule-card {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: 16px; overflow: hidden; cursor: pointer;
  transition: all 0.35s; position: relative;
}
.capsule-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--star-blue), var(--star-purple), transparent);
  opacity: 0; transition: opacity 0.3s;
}
.capsule-card:hover::before { opacity: 0.7; }
.capsule-card:hover { border-color: var(--ss-border-bright); transform: translateY(-4px); box-shadow: 0 8px 40px rgba(99,179,237,0.12); }
.cc-visual {
  height: 120px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(15,31,61,0.6), rgba(10,22,40,0.8));
}
.cc-visual.other, .cc-visual.purple { background: linear-gradient(135deg, rgba(15,31,61,0.6), rgba(26,13,61,0.8)); }
.cc-visual.world { background: linear-gradient(135deg, rgba(26,15,26,0.6), rgba(15,26,45,0.8)); }
.cc-visual.gold { background: linear-gradient(135deg, rgba(15,26,45,0.6), rgba(26,26,15,0.8)); }
.cc-visual.pink { background: linear-gradient(135deg, rgba(26,15,15,0.6), rgba(15,21,37,0.8)); }
.cc-visual.green { background: linear-gradient(135deg, rgba(15,26,15,0.6), rgba(15,31,15,0.8)); opacity: 0.7; }
.cc-ring-1 {
  position: absolute; width: 80px; height: 80px; border-radius: 50%;
  border: 1px solid rgba(99,179,237,0.15);
  animation: ringPulse 3s ease-in-out infinite;
}
.cc-ring-2 {
  position: absolute; width: 105px; height: 105px; border-radius: 50%;
  border: 1px solid rgba(99,179,237,0.08);
  animation: ringPulse 3s 0.5s ease-in-out infinite;
}
@keyframes ringPulse { 0%,100% { opacity: 0.3; transform: scale(1); } 50% { opacity: 0.7; transform: scale(1.05); } }
.cc-orb {
  width: 44px; height: 44px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #93c5fd, #1d4ed8);
  box-shadow: 0 0 25px rgba(99,179,237,0.35), 0 0 60px rgba(99,179,237,0.1); z-index: 2; position: relative;
}
.cc-orb.purple { background: radial-gradient(circle at 35% 30%, #ddd6fe, #7c3aed); box-shadow: 0 0 25px rgba(183,148,244,0.35); }
.cc-orb.gold { background: radial-gradient(circle at 35% 30%, #fef3c7, #d97706); box-shadow: 0 0 25px rgba(251,176,64,0.35); }
.cc-orb.green { background: radial-gradient(circle at 35% 30%, #d1fae5, #059669); box-shadow: 0 0 25px rgba(104,211,145,0.35); width: 36px; height: 36px; opacity: 0.7; }
.cc-orb.pink { background: radial-gradient(circle at 35% 30%, #fce7f3, #db2777); box-shadow: 0 0 25px rgba(246,135,179,0.35); }

.cc-status {
  position: absolute; top: 10px; right: 10px;
  padding: 3px 9px; border-radius: 99px;
  font-size: 10px; font-weight: 500; font-family: var(--font-mono);
  display: flex; align-items: center; gap: 4px;
}
.status-sealed { background: rgba(99,179,237,0.15); color: var(--star-blue); border: 1px solid rgba(99,179,237,0.2); }
.status-ready { background: rgba(251,176,64,0.15); color: var(--star-gold); border: 1px solid rgba(251,176,64,0.2); }
.status-opened { background: rgba(104,211,145,0.15); color: var(--star-green); border: 1px solid rgba(104,211,145,0.2); }
.status-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; }
.rc-status { margin-left: auto; }

.cc-body { padding: 16px; }
.cc-type-row { display: flex; align-items: center; gap: 6px; margin-bottom: 8px; }
.cc-type-label { font-size: 10px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; font-family: var(--font-mono); }
.cc-title { font-size: 15px; font-weight: 600; margin-bottom: 6px; line-height: 1.35; }
.cc-countdown {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: var(--font-mono); font-size: 11px;
  padding: 4px 10px; border-radius: 99px; margin-top: 8px;
}
.cc-countdown.sealed {
  color: var(--star-gold); background: rgba(251,176,64,0.06);
  border: 1px solid rgba(251,176,64,0.12);
}
.cc-countdown.ready {
  color: var(--star-green); background: rgba(104,211,145,0.06);
  border: 1px solid rgba(104,211,145,0.12);
  animation: readyPulse 2s ease-in-out infinite;
}
@keyframes readyPulse { 0%,100% { box-shadow: 0 0 0 rgba(104,211,145,0); } 50% { box-shadow: 0 0 12px rgba(104,211,145,0.15); } }
.cc-opened { font-size: 11px; color: var(--star-green); margin-top: 8px; display: flex; align-items: center; gap: 4px; opacity: 0.8; }
.cc-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.cc-date { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
.cc-chain { font-family: var(--font-mono); font-size: 10px; font-weight: 600; }
.cc-tx-link {
  display: block; margin-top: 6px; font-size: 9px; font-family: var(--font-mono);
  color: var(--star-blue); opacity: 0.6; text-decoration: none;
  transition: opacity 0.2s;
}
.cc-tx-link:hover { opacity: 1; text-decoration: underline; }

/* ═══ TX Progress ═══ */
.tx-progress {
  margin: 16px 0; padding: 14px; border-radius: 12px;
  background: rgba(99,179,237,0.03); border: 1px solid rgba(99,179,237,0.08);
}
.tx-step {
  display: flex; align-items: flex-start; gap: 10px; padding: 8px 0;
  border-bottom: 1px solid rgba(255,255,255,0.03);
}
.tx-step:last-child { border-bottom: none; }
.tx-step-icon { width: 20px; height: 20px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
.tx-ok { color: #4ade80; font-weight: 700; font-size: 14px; }
.tx-err { color: #f87171; font-weight: 700; font-size: 14px; }
.tx-spin {
  width: 14px; height: 14px; border: 2px solid rgba(99,179,237,0.2);
  border-top-color: var(--star-blue); border-radius: 50%;
  animation: tx-rotate 0.8s linear infinite;
}
@keyframes tx-rotate { to { transform: rotate(360deg); } }
.tx-step-msg { font-size: 12px; color: var(--text-primary); }
.tx-hash-link {
  font-size: 10px; font-family: var(--font-mono); color: var(--star-blue);
  text-decoration: none; opacity: 0.7;
}
.tx-hash-link:hover { opacity: 1; text-decoration: underline; }
.tx-step.done .tx-step-msg { color: #4ade80; }
.tx-step.error .tx-step-msg { color: #f87171; }

.seal-error {
  padding: 10px 14px; margin: 12px 0; border-radius: 10px;
  background: rgba(248,113,113,0.08); border: 1px solid rgba(248,113,113,0.2);
  color: #f87171; font-size: 12px; display: flex; align-items: center; gap: 6px;
}
.seal-success {
  padding: 16px; margin: 12px 0; border-radius: 12px; text-align: center;
  background: rgba(74,222,128,0.04); border: 1px solid rgba(74,222,128,0.15);
}
.ss-title { font-size: 16px; font-weight: 700; color: #4ade80; }
.ss-info { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
.ss-explorer {
  display: inline-block; margin-top: 8px; font-size: 11px; font-family: var(--font-mono);
  color: var(--star-blue); text-decoration: none;
}
.ss-explorer:hover { text-decoration: underline; }
.ss-cid { font-size: 9px; color: var(--text-muted); margin-top: 6px; font-family: var(--font-mono); }

.seal-spinner {
  display: inline-block; width: 14px; height: 14px; border: 2px solid rgba(255,255,255,0.2);
  border-top-color: #fff; border-radius: 50%; animation: tx-rotate 0.8s linear infinite;
  vertical-align: middle; margin-right: 6px;
}

/* Chain type badge */
.chain-type-badge {
  position: absolute; top: 4px; right: 4px;
  font-size: 7px; font-weight: 700; letter-spacing: 0.5px;
  padding: 1px 5px; border-radius: 4px;
  background: rgba(99,179,237,0.15); color: var(--star-blue);
  text-transform: uppercase;
}

/* ═══ RECEIVED ═══ */
.received-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.received-card {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: 16px; padding: 20px; cursor: pointer;
  transition: all 0.3s; position: relative; overflow: hidden;
}
.received-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--from-color), var(--to-color)); opacity: 0.7;
}
.received-card::after {
  content: ''; position: absolute; top: 2px; left: 0; right: 0; height: 40px;
  background: linear-gradient(180deg, color-mix(in srgb, var(--from-color) 4%, transparent), transparent);
  pointer-events: none;
}
.received-card:hover {
  border-color: var(--ss-border-bright); transform: translateY(-3px);
  box-shadow: 0 8px 40px color-mix(in srgb, var(--from-color) 10%, transparent);
}
.rc-from { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
.rc-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0; border: 1.5px solid var(--ss-border);
}
.rc-name { font-size: 13px; font-weight: 600; }
.rc-addr { font-family: var(--font-mono); font-size: 10px; color: var(--star-blue); margin-top: 2px; }
.rc-title { font-size: 16px; margin-bottom: 6px; font-weight: 600; }
.rc-preview {
  font-size: 13px; color: var(--text-secondary); line-height: 1.6; margin-bottom: 14px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.rc-footer { display: flex; align-items: center; justify-content: space-between; }
.rc-date { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
.rc-action {
  font-size: 11px; color: var(--star-blue); cursor: pointer;
  display: flex; align-items: center; gap: 4px; transition: opacity 0.2s;
}
.rc-action:hover { opacity: 0.7; }

/* ═══ SEAL OVERLAY — 黑洞漩涡仪式 ═══ */
.seal-overlay {
  position: fixed; inset: 0;
  background: radial-gradient(ellipse at center, #020510 0%, #000 100%);
  z-index: 9999;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  overflow: hidden;
}

/* 背景星尘 */
.so-stars { position: absolute; inset: 0; pointer-events: none; }
.so-star {
  position: absolute; border-radius: 50%; background: white;
  animation: soTwinkle 3s ease-in-out infinite alternate;
}
@keyframes soTwinkle { from { opacity: 0.05; } to { opacity: 0.7; } }

/* 黑洞容器 */
.so-blackhole {
  width: 340px; height: 340px;
  position: relative;
  margin-bottom: 40px;
  transition: transform 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.so-blackhole.phase-3, .so-blackhole.phase-4 {
  transform: scale(1.15);
}

/* 外层辉光 */
.so-outer-glow {
  position: absolute; inset: -60px;
  border-radius: 50%;
  background: radial-gradient(circle,
    rgba(99,179,237,0.06) 0%,
    rgba(183,148,244,0.04) 30%,
    transparent 70%
  );
  animation: soGlowPulse 3s ease-in-out infinite;
}
@keyframes soGlowPulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 1; transform: scale(1.08); } }

/* 吸积盘 — 主漩涡 */
.so-accretion {
  position: absolute; inset: -10px;
  border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(251,176,64,0.0) 0deg,
    rgba(251,176,64,0.5) 30deg,
    rgba(251,113,94,0.6) 60deg,
    rgba(246,135,179,0.5) 90deg,
    rgba(251,176,64,0.3) 120deg,
    rgba(99,179,237,0.4) 150deg,
    rgba(183,148,244,0.6) 200deg,
    rgba(118,228,247,0.4) 240deg,
    rgba(99,179,237,0.3) 280deg,
    rgba(251,176,64,0.2) 320deg,
    rgba(251,176,64,0.0) 360deg
  );
  animation: soDiskSpin 6s linear infinite;
  filter: blur(10px);
  opacity: 0.8;
}
.so-accretion-inner {
  position: absolute; inset: 20px;
  border-radius: 50%;
  background: conic-gradient(
    from 180deg,
    rgba(99,179,237,0.0) 0deg,
    rgba(99,179,237,0.4) 60deg,
    rgba(183,148,244,0.5) 120deg,
    rgba(251,176,64,0.3) 180deg,
    rgba(246,135,179,0.4) 240deg,
    rgba(118,228,247,0.3) 300deg,
    rgba(99,179,237,0.0) 360deg
  );
  animation: soDiskSpin 4s linear infinite reverse;
  filter: blur(6px);
  opacity: 0.6;
}
@keyframes soDiskSpin { to { transform: rotate(360deg); } }

/* 光子环 */
.so-photon {
  position: absolute; inset: 50px;
  border-radius: 50%;
  border: 2.5px solid rgba(251,176,64,0.6);
  box-shadow:
    0 0 30px rgba(251,176,64,0.4),
    0 0 60px rgba(251,176,64,0.15),
    inset 0 0 30px rgba(251,176,64,0.15);
  animation: soPhotonSpin 3.5s linear infinite;
}
@keyframes soPhotonSpin { to { transform: rotate(-360deg); } }

/* 引力透镜环 */
.so-lens-ring {
  position: absolute; border-radius: 50%;
  border: 1px solid rgba(99,179,237,0.15);
  animation: soLensWave 4s ease-in-out infinite;
}
.so-lens-ring.r1 { inset: 35px; animation-delay: 0s; border-color: rgba(183,148,244,0.2); }
.so-lens-ring.r2 { inset: 65px; animation-delay: 0.5s; }
.so-lens-ring.r3 { inset: 80px; animation-delay: 1s; border-color: rgba(118,228,247,0.15); }
@keyframes soLensWave {
  0%,100% { transform: scale(1) rotate(0deg); opacity: 0.3; }
  50% { transform: scale(1.06) rotate(15deg); opacity: 0.8; }
}

/* 轨道粒子 */
.so-orbit-p {
  position: absolute;
  width: var(--p-size, 3px); height: var(--p-size, 3px);
  border-radius: 50%;
  background: var(--p-color, white);
  box-shadow: 0 0 6px var(--p-color, white);
  left: 50%; top: 50%;
  margin-left: calc(var(--p-size, 3px) / -2);
  margin-top: calc(0px - var(--p-dist, 130px));
  transform-origin: calc(var(--p-size, 3px) / 2) var(--p-dist, 130px);
  animation: soOrbit 5s linear infinite;
}
@keyframes soOrbit { to { transform: rotate(360deg); } }

/* 被吸入的胶囊球 */
.so-capsule-orb {
  position: absolute;
  left: 50%; top: 50%;
  width: 40px; height: 40px;
  margin: -20px 0 0 -20px;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #93c5fd, #1d4ed8);
  box-shadow: 0 0 40px rgba(99,179,237,0.6), 0 0 80px rgba(99,179,237,0.3);
  z-index: 10;
  transition: all 1.5s cubic-bezier(0.55, 0, 0.1, 1);
  animation: soCapsuleFloat 2s ease-in-out infinite;
}
.so-capsule-orb.sucked {
  width: 0; height: 0; margin: 0 0 0 0;
  opacity: 0;
  box-shadow: 0 0 100px rgba(99,179,237,0.9), 0 0 200px rgba(183,148,244,0.4);
  animation: none;
}
@keyframes soCapsuleFloat {
  0%,100% { transform: translate(0, -60px) scale(1); }
  50% { transform: translate(0, -55px) scale(1.05); }
}

/* 黑洞核心 */
.so-void {
  position: absolute; inset: 95px;
  border-radius: 50%;
  background: radial-gradient(circle, #000000 50%, #030712 80%, rgba(99,179,237,0.03) 100%);
  box-shadow:
    0 0 60px rgba(0,0,0,0.9),
    0 0 120px rgba(0,0,0,0.6),
    inset 0 0 40px rgba(99,179,237,0.04);
  z-index: 5;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.so-void.expanded {
  inset: 85px;
  box-shadow:
    0 0 80px rgba(0,0,0,0.95),
    0 0 160px rgba(0,0,0,0.7),
    inset 0 0 60px rgba(104,211,145,0.06);
}

/* 文字层 */
.so-text-layer {
  text-align: center;
  z-index: 20;
  position: relative;
}
.so-phase-text { min-height: 80px; }
.so-title {
  font-size: 24px; font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 8px;
  letter-spacing: 1px;
}
.so-title.done {
  font-size: 28px;
  background: linear-gradient(135deg, var(--star-gold), var(--star-cyan));
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text;
}
.so-sub {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted, #475569);
  letter-spacing: 0.5px;
}

/* 文字过渡 */
.so-txt-enter-active { transition: all 0.4s ease; }
.so-txt-leave-active { transition: all 0.2s ease; }
.so-txt-enter-from { opacity: 0; transform: translateY(10px); }
.so-txt-leave-to { opacity: 0; transform: translateY(-10px); }

/* 进度条 */
.so-progress {
  width: 240px; height: 3px;
  background: rgba(99,179,237,0.1);
  border-radius: 2px;
  margin: 24px auto 10px;
  overflow: hidden;
}
.so-progress-bar {
  height: 100%;
  background: linear-gradient(90deg, var(--star-blue), var(--star-purple), var(--star-cyan));
  border-radius: 2px;
  transition: width 1s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 0 10px rgba(99,179,237,0.4);
}
.so-progress-steps {
  display: flex; justify-content: space-between;
  width: 240px; margin: 0 auto;
  font-size: 10px; font-family: var(--font-mono);
  color: var(--text-muted, #475569);
  letter-spacing: 0.5px;
}
.so-progress-steps span.active { color: var(--star-blue); }

/* Overlay 过渡 */
.ss-overlay-enter-active { transition: opacity 0.5s; }
.ss-overlay-leave-active { transition: opacity 0.8s ease-out; }
.ss-overlay-enter-from, .ss-overlay-leave-to { opacity: 0; }

/* ═══ Responsive ═══ */
@media (max-width: 900px) {
  .create-layout { grid-template-columns: 1fr; }
  .create-sidebar { display: none; }
  .capsule-grid { grid-template-columns: repeat(2, 1fr); }
  .received-grid { grid-template-columns: 1fr; }
  .chains { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .capsule-types { grid-template-columns: 1fr; }
  .capsule-grid { grid-template-columns: 1fr; }
  .lock-modes { grid-template-columns: 1fr; }
}

/* ═══ Attachment Upload ═══ */
.media-item {
  position: relative; border-radius: var(--ss-r-sm); overflow: hidden;
  border: 1px solid var(--ss-border); background: var(--ss-card);
}
.media-thumb {
  width: 100%; aspect-ratio: 1; object-fit: cover; display: block;
}
.media-thumb.media-file {
  display: flex; align-items: center; justify-content: center;
  color: var(--text-muted); background: rgba(99,179,237,0.05);
}
.media-remove {
  position: absolute; top: 4px; right: 4px; width: 20px; height: 20px;
  border-radius: 50%; background: rgba(0,0,0,0.7); color: white;
  border: none; font-size: 13px; cursor: pointer; display: flex;
  align-items: center; justify-content: center; line-height: 1;
  opacity: 0; transition: opacity 0.2s;
}
.media-item:hover .media-remove { opacity: 1; }
.media-name {
  position: absolute; bottom: 0; left: 0; right: 0;
  background: linear-gradient(transparent, rgba(0,0,0,0.7));
  padding: 12px 6px 4px; font-size: 9px; color: rgba(255,255,255,0.7);
  text-align: center; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ═══ Custom Date Picker ═══ */
.date-trigger {
  display: flex; align-items: center; gap: 10px;
  padding: 14px 16px; border-radius: 12px; cursor: pointer;
  background: linear-gradient(135deg, var(--ss-card), rgba(99,179,237,0.03));
  border: 1.5px solid rgba(99,179,237,0.15);
  transition: all 0.25s; color: var(--text-primary);
}
.date-trigger:hover { border-color: var(--star-blue); box-shadow: 0 0 20px rgba(99,179,237,0.1); }
.date-display { flex: 1; font-family: var(--font-mono); font-size: 14px; letter-spacing: 1.5px; }
.date-arrow { color: var(--text-muted); font-size: 12px; }

.dp-panel { position: relative; z-index: 50; }
.dp-backdrop { position: fixed; inset: 0; z-index: -1; }
.dp-content {
  margin-top: 8px; padding: 16px;
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: 16px; box-shadow: 0 12px 48px rgba(0,0,0,0.5);
  backdrop-filter: var(--blur-card); width: 300px;
}
.dp-header {
  display: flex; align-items: center; justify-content: space-between;
  margin-bottom: 14px;
}
.dp-nav {
  width: 28px; height: 28px; border-radius: 8px; border: 1px solid var(--ss-border);
  background: transparent; color: var(--text-secondary); cursor: pointer;
  font-size: 16px; display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.dp-nav:hover { border-color: var(--star-blue); color: var(--star-blue); }
.dp-month {
  font-family: var(--font-mono); font-size: 13px; font-weight: 600;
  color: var(--text-primary); letter-spacing: 1px;
}
.dp-weekdays {
  display: grid; grid-template-columns: repeat(7, 1fr);
  text-align: center; font-size: 10px; color: var(--text-muted);
  margin-bottom: 6px; letter-spacing: 1px;
}
.dp-days {
  display: grid; grid-template-columns: repeat(7, 1fr); gap: 2px;
}
.dp-day {
  width: 100%; aspect-ratio: 1; border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; color: var(--text-secondary); cursor: pointer;
  border: none; background: transparent; transition: all 0.15s;
  font-family: var(--font-mono);
}
.dp-day:hover:not(.empty) { background: rgba(99,179,237,0.1); color: var(--text-primary); }
.dp-day.active {
  background: var(--star-blue); color: white;
  box-shadow: 0 0 12px rgba(99,179,237,0.4);
}
.dp-day.empty { cursor: default; }
.dp-time {
  display: flex; align-items: center; justify-content: center;
  gap: 8px; margin: 14px 0 12px; padding: 10px;
  background: rgba(99,179,237,0.04); border-radius: 10px;
}
.dp-time-group { display: flex; flex-direction: column; align-items: center; gap: 4px; }
.dp-t-btn {
  width: 28px; height: 18px; border: none; border-radius: 4px;
  background: rgba(99,179,237,0.1); color: var(--text-muted);
  cursor: pointer; font-size: 8px; transition: all 0.15s;
  display: flex; align-items: center; justify-content: center;
}
.dp-t-btn:hover { background: rgba(99,179,237,0.2); color: var(--star-blue); }
.dp-t-val {
  font-family: var(--font-mono); font-size: 22px; font-weight: 600;
  color: var(--star-blue); min-width: 36px; text-align: center;
  text-shadow: 0 0 15px rgba(99,179,237,0.3);
}
.dp-t-sep {
  font-family: var(--font-mono); font-size: 20px; color: var(--text-muted);
  animation: dpBlink 1s step-end infinite;
}
@keyframes dpBlink { 0%,50% { opacity: 1; } 51%,100% { opacity: 0; } }
.dp-confirm {
  width: 100%; padding: 10px; border: none; border-radius: 99px;
  background: linear-gradient(135deg, var(--star-blue), rgba(99,179,237,0.7));
  color: white; font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.25s; font-family: inherit;
}
.dp-confirm:hover { transform: translateY(-1px); box-shadow: 0 4px 16px rgba(99,179,237,0.3); }

/* ═══ Open Animation ═══ */
.open-mode { background: radial-gradient(ellipse at center, #030818 0%, #000 100%); }
.open-anim {
  width: 280px; height: 280px; position: relative; margin-bottom: 40px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
}
.open-anim.phase-3, .open-anim.phase-4 { transform: scale(0.9); }
.oa-glow {
  position: absolute; inset: -50px; border-radius: 50%;
  background: radial-gradient(circle, rgba(104,211,145,0.08) 0%, rgba(99,179,237,0.04) 40%, transparent 70%);
  animation: soGlowPulse 3s ease-in-out infinite;
}
.oa-ring {
  position: absolute; border-radius: 50%; border: 1px solid rgba(104,211,145,0.2);
  animation: oaRingExpand 3s ease-in-out infinite;
}
.oa-ring.r1 { inset: 20px; animation-delay: 0s; }
.oa-ring.r2 { inset: 40px; animation-delay: 0.5s; border-color: rgba(99,179,237,0.15); }
.oa-ring.r3 { inset: 60px; animation-delay: 1s; border-color: rgba(183,148,244,0.12); }
@keyframes oaRingExpand {
  0%,100% { transform: scale(1); opacity: 0.3; }
  50% { transform: scale(1.08); opacity: 0.7; }
}
.oa-capsule {
  position: absolute; left: 50%; top: 50%;
  width: 52px; height: 90px; margin: -45px 0 0 -26px;
  transition: all 1s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 5;
}
.oa-capsule.cracking { animation: oaCrack 1.5s ease-in-out; }
.oa-capsule.burst { animation: oaBurst 0.8s ease forwards; }
@keyframes oaCrack {
  0%,100% { transform: rotate(0deg); }
  15% { transform: rotate(-3deg); }
  30% { transform: rotate(3deg); }
  45% { transform: rotate(-5deg); }
  60% { transform: rotate(5deg); }
  75% { transform: rotate(-2deg); }
}
@keyframes oaBurst {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.8; }
  100% { transform: scale(0); opacity: 0; }
}
.oa-cap-body {
  width: 100%; height: 100%; border-radius: 26px;
  background: linear-gradient(180deg, #b0d4ff 0%, #60a5fa 15%, #2563eb 35%, #1e40af 50%, #1d4ed8 65%, #60a5fa 85%, #93c5fd 100%);
  box-shadow: 0 0 30px rgba(99,179,237,0.5), 0 0 60px rgba(99,179,237,0.2);
  border: 1px solid rgba(148,196,255,0.25);
}
.oa-cap-band {
  position: absolute; left: -2px; right: -2px; top: 50%; transform: translateY(-50%);
  height: 6px; border-radius: 3px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.6), rgba(104,211,145,0.9), rgba(255,255,255,0.6), transparent);
}
.oa-crack {
  position: absolute; left: 50%; top: 30%; width: 2px; height: 40%;
  background: linear-gradient(180deg, transparent, rgba(104,211,145,0.8), rgba(251,176,64,0.6), transparent);
  transform: translateX(-50%);
  animation: oaCrackGlow 0.5s ease-in-out infinite alternate;
  box-shadow: 0 0 10px rgba(104,211,145,0.5);
}
@keyframes oaCrackGlow { from { opacity: 0.5; } to { opacity: 1; } }

.oa-burst-particles { position: absolute; inset: 0; z-index: 10; }
.oa-bp {
  position: absolute; left: 50%; top: 50%;
  width: var(--bp-size, 4px); height: var(--bp-size, 4px);
  border-radius: 50%; background: var(--bp-color, white);
  box-shadow: 0 0 8px var(--bp-color, white);
  animation: oaBpExplode 1.2s ease-out forwards;
}
@keyframes oaBpExplode {
  0% { transform: translate(-50%, -50%) rotate(var(--bp-angle, 0deg)) translateY(0); opacity: 1; }
  100% { transform: translate(-50%, -50%) rotate(var(--bp-angle, 0deg)) translateY(calc(var(--bp-dist, 80px) * -1)); opacity: 0; }
}

/* ═══ Opened Content Overlay ═══ */
.opened-content-overlay {
  position: fixed; inset: 0; z-index: 9998;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}
.oc-backdrop {
  position: absolute; inset: 0;
  background: rgba(0,0,0,0.8);
  backdrop-filter: blur(8px);
}
.oc-container {
  position: relative; z-index: 1;
  max-width: 680px; width: 100%; max-height: 80vh;
  overflow-y: auto; border-radius: 24px;
  background: linear-gradient(145deg, var(--ss-card), rgba(99,179,237,0.03));
  border: 1px solid var(--ss-border);
  box-shadow: 0 20px 80px rgba(0,0,0,0.5), 0 0 60px rgba(99,179,237,0.08);
  animation: ocEnter 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes ocEnter {
  from { opacity: 0; transform: scale(0.9) translateY(20px); }
}
.oc-close {
  position: absolute; top: 16px; right: 16px; z-index: 2;
  width: 32px; height: 32px; border-radius: 50%;
  background: rgba(255,255,255,0.05); border: 1px solid var(--ss-border);
  color: var(--text-muted); font-size: 18px; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.oc-close:hover { background: rgba(255,255,255,0.1); color: var(--text-primary); }
.oc-header {
  padding: 32px 32px 20px; text-align: center;
  border-bottom: 1px solid var(--ss-border);
  position: relative;
}
.oc-header::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, transparent, var(--star-green), var(--star-blue), var(--star-purple), transparent);
  border-radius: 2px;
}
.oc-badge {
  display: inline-flex; align-items: center; gap: 6px;
  padding: 4px 14px; border-radius: 99px;
  font-size: 11px; font-weight: 500;
  background: rgba(104,211,145,0.1); border: 1px solid rgba(104,211,145,0.2);
  color: var(--star-green); margin-bottom: 14px;
}
.oc-title { font-size: 24px; font-weight: 600; margin-bottom: 8px; line-height: 1.3; }
.oc-seal-info { font-family: var(--font-mono); font-size: 11px; color: var(--text-muted); }
.oc-body { padding: 28px 32px; }
.oc-text {
  font-size: 16px; line-height: 2; color: var(--text-secondary);
  font-family: var(--font-serif, 'Noto Serif SC', serif);
}
.oc-attachments { margin-top: 28px; }
.oc-att-title {
  font-size: 10px; letter-spacing: 2px; color: var(--text-muted);
  text-transform: uppercase; font-family: var(--font-mono);
  margin-bottom: 12px; padding-bottom: 8px;
  border-bottom: 1px solid var(--ss-border);
}
.oc-att-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
.oc-att-item { border-radius: 12px; overflow: hidden; border: 1px solid var(--ss-border); }
.oc-att-img { width: 100%; display: block; }
.oc-footer {
  padding: 16px 32px 24px; text-align: center;
  border-top: 1px solid var(--ss-border);
}
.oc-nft-hint {
  font-size: 12px; color: var(--star-gold);
  font-family: var(--font-mono); letter-spacing: 0.5px;
}
</style>
