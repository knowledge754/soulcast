<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useI18n } from '../stores/i18n'
import Icon from '../components/icons/Icon.vue'

const i18n = useI18n()

/* ═══ Tab ═══ */
const activeTab = ref<'create' | 'mine' | 'blackhole' | 'received'>('create')
function showTab(name: typeof activeTab.value) {
  activeTab.value = name
}

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

/* ═══ Create: Lock settings ═══ */
const lockMode = ref<'time' | 'event' | 'multisig' | 'random'>('time')
const lockModes = [
  { key: 'time' as const, icon: 'clock', name: '时间锁', desc: '到达指定时间后自动可开启' },
  { key: 'event' as const, icon: 'zap', name: '事件锁', desc: '链上特定事件触发解锁' },
  { key: 'multisig' as const, icon: 'lock', name: '多签锁', desc: '需要多人共同确认才能开启' },
  { key: 'random' as const, icon: 'dice', name: '随机锁', desc: '设置时间范围，随机某天开启' },
]
const unlockDate = ref('')
const activePreset = ref(3)
const allowEarlyUnlock = ref(false)

function setPreset(years: number) {
  activePreset.value = years
  if (years > 0) {
    const d = new Date()
    d.setFullYear(d.getFullYear() + years)
    unlockDate.value = d.toISOString().slice(0, 16)
  }
}

/* ═══ Create: Chain ═══ */
const selectedChain = ref('solana')
const chains = [
  { key: 'solana', name: 'Solana', fee: '~$0.001', color: '#9945ff', symbol: 'SOL' },
  { key: 'sui', name: 'Sui', fee: '~$0.002', color: '#4da2ff', symbol: 'SUI' },
  { key: 'avalanche', name: 'Avalanche', fee: '~$0.01', color: '#e84142', symbol: 'AVAX' },
  { key: 'base', name: 'Base', fee: '~$0.005', color: '#0052ff', symbol: 'BASE' },
]

/* ═══ Create: Sidebar meta ═══ */
const metaType = computed(() => {
  const m: Record<string, string> = { self: '自言', other: '他言', world: '世言' }
  return m[capsuleType.value]
})
const metaLock = computed(() => {
  const m: Record<string, string> = { time: '时间锁', event: '事件锁', multisig: '多签锁', random: '随机锁' }
  return m[lockMode.value]
})
const metaChain = computed(() => chains.find(c => c.key === selectedChain.value)?.name || 'Solana')

/* ═══ Seal action ═══ */
const showSealOverlay = ref(false)
const sealPhase = ref(0)
function sealCapsule() {
  showSealOverlay.value = true
  sealPhase.value = 1
  setTimeout(() => { sealPhase.value = 2 }, 1200)
  setTimeout(() => { sealPhase.value = 3 }, 3000)
  setTimeout(() => { sealPhase.value = 4 }, 4500)
  setTimeout(() => { showSealOverlay.value = false; sealPhase.value = 0; activeTab.value = 'mine' }, 6000)
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
  openDate?: string; orbClass?: string
}

const myCapsules = ref<Capsule[]>([
  { id: 1, type: 'self', title: '写给 2026 年的自己', chain: 'SOL', chainColor: '#9945ff', sealDate: '2023.02.18', status: 'ready', countdown: '今天可以开启！', orbClass: 'purple' },
  { id: 2, type: 'other', title: '妈妈，等我三十岁', chain: 'SUI', chainColor: '#4da2ff', sealDate: '2025.01.01', status: 'sealed', countdown: '剩余 3年 241天' },
  { id: 3, type: 'world', title: '我对 Web3 未来的预言', chain: 'BASE', chainColor: '#0052ff', sealDate: '2024.11.20', status: 'sealed', countdown: '剩余 8年 102天' },
  { id: 4, type: 'self', title: '2020 年的那个冬天', chain: 'SOL', chainColor: '#9945ff', sealDate: '2020.01.01', status: 'opened', openDate: '2025.01.01', orbClass: 'green' },
  { id: 5, type: 'other', title: '给她的第一封链上情书', chain: 'AVAX', chainColor: '#e84142', sealDate: '2025.02.14', status: 'sealed', countdown: '剩余 1年 18天', orbClass: 'pink' },
  { id: 6, type: 'self', title: '人生第一个百万目标', chain: 'BASE', chainColor: '#0052ff', sealDate: '2025.08.15', status: 'sealed', countdown: '剩余 4年 88天', orbClass: 'gold' },
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

/* ═══ Blackhole ═══ */
const blackholeCapsule = ref({
  title: '「写给 2026 年的自己」',
  type: '自言',
  chain: 'Solana',
  sealBlock: 'Block #18234567',
  sealDate: '2023.02.18',
  solPrice: '$22.4',
  ethPrice: '$1,580',
  ipfsCid: 'Qm7x3a…f2a9'
})
const countdownVals = ref({ days: '00', hours: '00', mins: '00', secs: '00' })

let countdownTimer: ReturnType<typeof setInterval> | null = null
onMounted(() => {
  setPreset(3)
  countdownTimer = setInterval(() => {
    const now = new Date()
    countdownVals.value.secs = String(59 - now.getSeconds()).padStart(2, '0')
    countdownVals.value.mins = String(59 - now.getMinutes()).padStart(2, '0')
  }, 1000)
})
onUnmounted(() => { if (countdownTimer) clearInterval(countdownTimer) })

function openCapsuleFromCard(capsule: Capsule) {
  if (capsule.status === 'ready') {
    blackholeCapsule.value.title = `「${capsule.title}」`
    activeTab.value = 'blackhole'
  }
}

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
      <button class="ss-tab" :class="{ active: activeTab === 'blackhole' }" @click="showTab('blackhole')">
        <Icon name="hexagon" :size="13" /> 黑洞
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
              <div class="step-item" :class="{ active: createStep === 1, done: createStep > 1 }" @click="goStep(1)">
                <div class="step-num">{{ createStep > 1 ? '✓' : '1' }}</div>
                <div class="step-label">内容</div>
              </div>
              <div class="step-line" :class="{ done: createStep > 1 }"></div>
              <div class="step-item" :class="{ active: createStep === 2, done: createStep > 2 }" @click="goStep(2)">
                <div class="step-num">{{ createStep > 2 ? '✓' : '2' }}</div>
                <div class="step-label">封印设置</div>
              </div>
              <div class="step-line" :class="{ done: createStep > 2 }"></div>
              <div class="step-item" :class="{ active: createStep === 3 }" @click="goStep(3)">
                <div class="step-num">3</div>
                <div class="step-label">确认投入</div>
              </div>
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
                      <button class="tb-btn"><b>B</b></button>
                      <button class="tb-btn"><i>I</i></button>
                      <button class="tb-btn">H</button>
                      <div class="tb-sep"></div>
                      <button class="tb-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>
                      </button>
                      <button class="tb-btn">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
                      </button>
                      <div class="tb-sep"></div>
                      <button class="tb-btn"><Icon name="link" :size="12" /></button>
                      <button class="tb-btn"><Icon name="image" :size="12" /></button>
                    </div>
                    <textarea
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
                  <div class="media-grid">
                    <div class="media-add">
                      <Icon name="plus" :size="20" />
                      <span>添加</span>
                    </div>
                  </div>
                  <div class="form-hint">所有附件将上传至 IPFS，哈希值永久存储在链上</div>
                </div>

                <div class="form-section">
                  <div class="section-eye">锁入链上资产（可选）</div>
                  <div class="asset-row">
                    <div class="asset-add">
                      <div class="asset-label">锁入 Token</div>
                      <div class="asset-val gold">+ ETH / USDC</div>
                    </div>
                    <div class="asset-add">
                      <div class="asset-label">锁入 NFT</div>
                      <div class="asset-val purple">+ 选择 NFT</div>
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
                  <input v-model="unlockDate" type="datetime-local" class="ss-input date-pick" />
                  <div class="presets">
                    <button v-for="y in [1, 3, 5, 10, 18]" :key="y" class="preset-btn" :class="{ active: activePreset === y }" @click="setPreset(y)">
                      {{ y === 18 ? '18年后（成年）' : y + '年后' }}
                    </button>
                  </div>
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
                        提前解锁需支付 <strong>0.01 ETH 惩罚金</strong>（锁入胶囊合约，到期后归收件方所有）。惩罚金越高，越能让自己坚持等待。
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
                    <span class="lock-cd"><Icon name="lock" :size="11" /> {{ activePreset }}年后开启</span>
                    <span><Icon name="hexagon" :size="12" /> {{ metaChain }}</span>
                    <span class="ipfs-ok">IPFS ✓</span>
                  </div>
                </div>

                <div class="checklist">
                  <div class="section-eye">封印检查清单</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 内容已加密，仅你的钱包可解密</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 附件已上传 IPFS，CID: Qm7x3…f2a</div>
                  <div class="check-item"><span class="ci-ok">✓</span> {{ metaLock }}设定为 {{ activePreset }} 年后</div>
                  <div class="check-item"><span class="ci-ok">✓</span> 部署链：{{ metaChain }}</div>
                  <div v-if="allowEarlyUnlock" class="check-item"><span class="ci-warn">!</span> 提前解锁已开启，惩罚金 0.01</div>
                </div>

                <div class="nav-btns">
                  <button class="btn-back" @click="goStep(2)">← 返回</button>
                </div>
                <button class="seal-btn" @click="sealCapsule">
                  <Icon name="hexagon" :size="18" />
                  投入黑洞，完成封印
                </button>
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
            </div>

            <div class="gas-card">
              <div class="gas-header">
                <span class="gas-title">费用估算</span>
                <span class="gas-amount">≈ $0.003</span>
              </div>
              <div class="gas-line"><span>合约部署</span><span>$0.001</span></div>
              <div class="gas-line"><span>IPFS 存储</span><span>$0.001</span></div>
              <div class="gas-line"><span>链上存证</span><span>$0.001</span></div>
              <div class="gas-line total"><span>合计</span><span class="green">$0.003</span></div>
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
              <div v-if="cap.status === 'ready'" class="cc-countdown ready">✨ {{ cap.countdown }}</div>
              <div v-else-if="cap.countdown" class="cc-countdown sealed">
                <Icon name="lock" :size="11" /> {{ cap.countdown }}
              </div>
              <div v-else-if="cap.openDate" class="cc-opened">✨ 已于 {{ cap.openDate }} 开启</div>
              <div class="cc-meta">
                <span class="cc-date">封印于 {{ cap.sealDate }}</span>
                <span class="cc-chain" :style="{ color: cap.chainColor }">{{ cap.chain }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>

    <!-- ════════ BLACKHOLE ════════ -->
    <Transition name="ss-fade" mode="out-in">
      <div v-if="activeTab === 'blackhole'" key="blackhole" class="ss-panel">
        <div class="open-scene">
          <div class="blackhole-container">
            <div class="bh-glow"></div>
            <div class="accretion"></div>
            <div class="photon-ring"></div>
            <div class="bh-inner-ring"></div>
            <div class="orbit-p p1"></div>
            <div class="orbit-p p2"></div>
            <div class="orbit-p p3"></div>
            <div class="bh-void">
              <div class="bh-text">点击<br>开启</div>
            </div>
          </div>

          <div class="open-info">
            <div class="open-title">{{ blackholeCapsule.title }}</div>
            <div class="open-meta-row">
              <span class="open-chip"><Icon name="moon" :size="11" /> {{ blackholeCapsule.type }}</span>
              <span class="open-chip"><Icon name="hexagon" :size="11" /> {{ blackholeCapsule.chain }}</span>
              <span class="open-chip ok"><Icon name="check" :size="11" /> 可开启</span>
            </div>

            <div class="countdown-box">
              <div class="cd-unit"><div class="cd-num">{{ countdownVals.days }}</div><div class="cd-label">DAYS</div></div>
              <div class="cd-unit"><div class="cd-num">{{ countdownVals.hours }}</div><div class="cd-label">HOURS</div></div>
              <div class="cd-unit"><div class="cd-num">{{ countdownVals.mins }}</div><div class="cd-label">MINS</div></div>
              <div class="cd-unit"><div class="cd-num">{{ countdownVals.secs }}</div><div class="cd-label">SECS</div></div>
            </div>

            <div class="open-actions">
              <button class="btn-share"><Icon name="link" :size="13" /> 分享开启仪式</button>
              <button class="seal-btn sm" @click="sealCapsule">
                <Icon name="hexagon" :size="15" /> 开启胶囊
              </button>
            </div>

            <div class="open-chain-info">
              封印于 {{ blackholeCapsule.sealBlock }} · {{ blackholeCapsule.sealDate }}<br>
              当时 SOL 价格: {{ blackholeCapsule.solPrice }} · ETH: {{ blackholeCapsule.ethPrice }}<br>
              IPFS CID: {{ blackholeCapsule.ipfsCid }}
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
              <span class="rc-action" @click="rc.status === 'ready' && showTab('blackhole')">{{ rc.action }} →</span>
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
.preset-btn,
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

/* Steps */
.steps { display: flex; align-items: center; margin-bottom: 32px; }
.step-item {
  display: flex; align-items: center; gap: 8px; cursor: pointer;
}
.step-num {
  width: 28px; height: 28px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 600;
  border: 1.5px solid var(--ss-border);
  color: var(--text-muted);
  transition: all 0.3s;
}
.step-item.active .step-num {
  background: var(--star-blue); border-color: var(--star-blue); color: white;
  box-shadow: 0 0 16px rgba(99,179,237,0.4);
}
.step-item.done .step-num {
  background: rgba(104,211,145,0.15); border-color: var(--star-green); color: var(--star-green);
}
.step-label { font-size: 12px; color: var(--text-muted); transition: color 0.3s; }
.step-item.active .step-label { color: var(--text-primary); }
.step-item.done .step-label { color: var(--text-secondary); }
.step-line {
  flex: 1; height: 1px; background: var(--ss-border); margin: 0 12px;
}
.step-line.done { background: rgba(104,211,145,0.3); }

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
.ss-input.date-pick { font-family: var(--font-mono); font-size: 12px; cursor: pointer; color-scheme: dark; }

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

/* Assets */
.asset-row { display: flex; gap: 10px; flex-wrap: wrap; }
.asset-add {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r-sm); padding: 10px 14px;
  flex: 1; min-width: 140px; cursor: pointer; transition: all 0.2s;
}
.asset-add:hover { border-color: var(--ss-border-bright); }
.asset-label { font-size: 11px; color: var(--text-muted); margin-bottom: 4px; }
.asset-val { font-family: var(--font-mono); font-size: 13px; }
.asset-val.gold { color: var(--star-gold); }
.asset-val.purple { color: var(--star-purple); }

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

/* Presets */
.presets { display: flex; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
.preset-btn {
  padding: 5px 12px; background: transparent;
  border: 1px solid var(--ss-border); border-radius: 99px;
  font-size: 11px; color: var(--text-secondary);
  cursor: pointer; transition: all 0.2s; font-family: var(--font-mono);
}
.preset-btn:hover, .preset-btn.active {
  background: rgba(99,179,237,0.1); border-color: rgba(99,179,237,0.4); color: var(--star-blue);
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
.nav-btns { display: flex; gap: 10px; margin-top: 16px; }
.spacer { flex: 2; }
.btn-back {
  flex: 1; padding: 11px;
  background: transparent; border: 1px solid var(--ss-border);
  border-radius: var(--ss-r-sm); color: var(--text-secondary);
  font-size: 13px; cursor: pointer; transition: all 0.2s;
}
.btn-back:hover { border-color: var(--ss-border-bright); color: var(--text-primary); }
.btn-next {
  flex: 2; padding: 11px;
  background: var(--star-blue); border: none;
  border-radius: var(--ss-r-sm); color: white;
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.25s;
  box-shadow: 0 4px 16px rgba(99,179,237,0.25);
}
.btn-next:hover { background: var(--accent-blue); transform: translateY(-1px); box-shadow: 0 6px 20px rgba(99,179,237,0.35); }

/* Seal btn */
.seal-btn {
  width: 100%; padding: 16px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none; border-radius: var(--ss-r); color: white;
  font-size: 15px; font-weight: 600; cursor: pointer;
  display: flex; align-items: center; justify-content: center; gap: 10px;
  transition: all 0.3s; box-shadow: 0 8px 32px rgba(29,78,216,0.3);
  margin-top: 16px; position: relative; overflow: hidden;
}
.seal-btn::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.1), transparent);
}
.seal-btn:hover { transform: translateY(-2px); box-shadow: 0 12px 40px rgba(29,78,216,0.45); }
.seal-btn.sm { max-width: 200px; padding: 12px 24px; font-size: 14px; }

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
  border-radius: var(--ss-r); overflow: hidden; cursor: pointer;
  transition: all 0.3s; position: relative;
}
.capsule-card:hover { border-color: var(--ss-border-bright); transform: translateY(-4px); box-shadow: 0 0 40px rgba(99,179,237,0.15); }
.cc-visual {
  height: 130px; position: relative; overflow: hidden;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, #0f1f3d, #0a1628);
}
.cc-visual.other, .cc-visual.purple { background: linear-gradient(135deg, #0f1f3d, #1a0d3d); }
.cc-visual.world { background: linear-gradient(135deg, #1a0f1a, #0f1a2d); }
.cc-visual.gold { background: linear-gradient(135deg, #0f1a2d, #1a1a0f); }
.cc-visual.pink { background: linear-gradient(135deg, #1a0f0f, #0f1525); }
.cc-visual.green { background: linear-gradient(135deg, #0f1a0f, #0f1f0f); opacity: 0.7; }
.cc-ring-1 { position: absolute; width: 80px; height: 80px; border-radius: 50%; border: 1px solid rgba(99,179,237,0.2); animation: ringPulse 3s ease-in-out infinite; }
.cc-ring-2 { position: absolute; width: 105px; height: 105px; border-radius: 50%; border: 1px solid rgba(99,179,237,0.12); animation: ringPulse 3s 0.5s ease-in-out infinite; }
.cc-orb {
  width: 50px; height: 50px; border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #93c5fd, #1d4ed8);
  box-shadow: 0 0 30px rgba(99,179,237,0.3); z-index: 2; position: relative;
}
.cc-orb.purple { background: radial-gradient(circle at 35% 30%, #ddd6fe, #7c3aed); box-shadow: 0 0 30px rgba(183,148,244,0.3); }
.cc-orb.gold { background: radial-gradient(circle at 35% 30%, #fef3c7, #d97706); box-shadow: 0 0 30px rgba(251,176,64,0.3); }
.cc-orb.green { background: radial-gradient(circle at 35% 30%, #d1fae5, #059669); box-shadow: 0 0 30px rgba(104,211,145,0.3); width: 40px; height: 40px; opacity: 0.6; }
.cc-orb.pink { background: radial-gradient(circle at 35% 30%, #fce7f3, #db2777); box-shadow: 0 0 30px rgba(246,135,179,0.3); }

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
  display: inline-flex; align-items: center; gap: 4px;
  font-family: var(--font-mono); font-size: 11px;
  padding: 3px 8px; border-radius: 4px; margin-top: 6px;
}
.cc-countdown.sealed { color: var(--star-gold); background: rgba(251,176,64,0.08); }
.cc-countdown.ready { color: var(--star-green); background: rgba(104,211,145,0.08); }
.cc-opened { font-size: 11px; color: var(--star-green); margin-top: 6px; display: flex; align-items: center; gap: 4px; }
.cc-meta { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; }
.cc-date { font-family: var(--font-mono); font-size: 10px; color: var(--text-muted); }
.cc-chain { font-family: var(--font-mono); font-size: 10px; font-weight: 600; }

/* ═══ BLACKHOLE ═══ */
.open-scene { display: flex; flex-direction: column; align-items: center; padding: 20px 0 40px; }
.blackhole-container {
  width: 300px; height: 300px; position: relative; margin-bottom: 40px; cursor: pointer;
}
.bh-glow {
  position: absolute; inset: -20px; border-radius: 50%;
  background: radial-gradient(circle, rgba(99,179,237,0.08) 0%, transparent 70%);
  animation: glowPulse 3s ease-in-out infinite;
}
@keyframes glowPulse { 0%,100% { opacity: 0.5; } 50% { opacity: 1; } }
.accretion {
  position: absolute; inset: 0; border-radius: 50%;
  background: conic-gradient(
    from 0deg,
    rgba(251,176,64,0.0) 0deg, rgba(251,176,64,0.4) 45deg,
    rgba(251,113,94,0.5) 90deg, rgba(251,176,64,0.2) 135deg,
    rgba(99,179,237,0.3) 180deg, rgba(183,148,244,0.4) 225deg,
    rgba(99,179,237,0.2) 270deg, rgba(251,176,64,0.1) 315deg,
    rgba(251,176,64,0.0) 360deg
  );
  animation: diskSpin 8s linear infinite; filter: blur(8px); opacity: 0.7;
}
@keyframes diskSpin { to { transform: rotate(360deg); } }
.photon-ring {
  position: absolute; inset: 40px; border-radius: 50%;
  border: 2px solid rgba(251,176,64,0.5);
  box-shadow: 0 0 20px rgba(251,176,64,0.3), inset 0 0 20px rgba(251,176,64,0.1);
  animation: photonSpin 4s linear infinite;
}
@keyframes photonSpin { to { transform: rotate(-360deg); } }
.bh-inner-ring {
  position: absolute; inset: 55px; border-radius: 50%;
  border: 1px solid rgba(99,179,237,0.3);
  animation: ringPulse 2.5s ease-in-out infinite;
}
.orbit-p {
  position: absolute; width: 3px; height: 3px; border-radius: 50%;
  background: var(--star-gold);
  animation: orbit 7s linear infinite;
  transform-origin: 150px 150px;
}
.orbit-p.p1 { left: 147px; top: 20px; }
.orbit-p.p2 { left: 147px; top: 50px; width: 2px; height: 2px; background: #93c5fd; animation-duration: 5s; animation-direction: reverse; }
.orbit-p.p3 { left: 148px; top: 8px; width: 2.5px; height: 2.5px; background: var(--star-purple); animation-duration: 9s; }
@keyframes orbit { to { transform: rotate(360deg); } }
.bh-void {
  position: absolute; inset: 70px; border-radius: 50%;
  background: radial-gradient(circle, #000 60%, var(--bg-void) 100%);
  box-shadow: 0 0 40px rgba(0,0,0,0.8), inset 0 0 30px rgba(99,179,237,0.05);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.3s;
}
.bh-text { font-size: 13px; color: rgba(99,179,237,0.5); text-align: center; line-height: 1.6; letter-spacing: 0.5px; }

.open-info { text-align: center; max-width: 480px; }
.open-title { font-size: 26px; font-weight: 600; margin-bottom: 10px; line-height: 1.3; }
.open-meta-row {
  display: flex; align-items: center; justify-content: center; gap: 10px;
  margin-bottom: 24px; flex-wrap: wrap;
}
.open-chip {
  display: inline-flex; align-items: center; gap: 5px;
  background: var(--ss-card); border: 1px solid var(--ss-border);
  padding: 4px 10px; border-radius: 6px; font-size: 11px; color: var(--text-secondary);
}
.open-chip.ok { color: var(--star-green); }
.countdown-box { display: flex; gap: 12px; justify-content: center; margin-bottom: 28px; }
.cd-unit {
  text-align: center; background: var(--ss-card); border: 1px solid rgba(104,211,145,0.3);
  border-radius: var(--ss-r-sm); padding: 12px 16px; min-width: 64px;
}
.cd-num { font-family: var(--font-mono); font-size: 28px; font-weight: 500; color: var(--star-green); line-height: 1; }
.cd-label { font-size: 10px; color: var(--text-muted); margin-top: 4px; letter-spacing: 1px; }

.open-actions { display: flex; gap: 12px; justify-content: center; align-items: center; }
.btn-share {
  padding: 12px 24px; background: rgba(99,179,237,0.1);
  border: 1px solid rgba(99,179,237,0.2); border-radius: var(--ss-r-sm);
  color: var(--star-blue); font-size: 13px; cursor: pointer; transition: all 0.2s;
  display: flex; align-items: center; gap: 6px;
}
.btn-share:hover { background: rgba(99,179,237,0.15); }
.open-chain-info {
  margin-top: 20px; font-family: var(--font-mono); font-size: 10px;
  color: var(--text-muted); text-align: center; line-height: 1.8;
}

/* ═══ RECEIVED ═══ */
.received-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 18px; }
.received-card {
  background: var(--ss-card); border: 1px solid var(--ss-border);
  border-radius: var(--ss-r); padding: 20px; cursor: pointer;
  transition: all 0.25s; position: relative; overflow: hidden;
}
.received-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 2px;
  background: linear-gradient(90deg, var(--from-color), var(--to-color)); opacity: 0.6;
}
.received-card:hover { border-color: var(--ss-border-bright); transform: translateY(-3px); box-shadow: 0 0 40px rgba(99,179,237,0.15); }
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
</style>
