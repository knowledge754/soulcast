<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed, ref } from 'vue'
import Icon from '../icons/Icon.vue'
import WalletModal from '../wallet/WalletModal.vue'
import { useWallet } from '../../composables/useWallet'
import { useAppStore } from '../../stores/app'

const route = useRoute()
const router = useRouter()
const wallet = useWallet()
const app = useAppStore()
const showDropdown = ref(false)
const showTtsMenu = ref(false)
const ttsLang = ref('zh-CN')
const ttsSpeaking = ref(false)

const ttsLanguages = [
  { code: 'zh-CN', label: '中文', flag: '🇨🇳' },
  { code: 'en-US', label: 'English', flag: '🇺🇸' },
  { code: 'ja-JP', label: '日本語', flag: '🇯🇵' },
  { code: 'ko-KR', label: '한국어', flag: '🇰🇷' },
  { code: 'fr-FR', label: 'Français', flag: '🇫🇷' },
  { code: 'de-DE', label: 'Deutsch', flag: '🇩🇪' },
  { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
  { code: 'ru-RU', label: 'Русский', flag: '🇷🇺' },
]

function toggleTts() {
  if (ttsSpeaking.value) {
    window.speechSynthesis.cancel()
    ttsSpeaking.value = false
    return
  }
  const mainEl = document.querySelector('.main-inner')
  if (!mainEl) return
  const text = mainEl.innerText || mainEl.textContent || ''
  if (!text.trim()) return
  const utterance = new SpeechSynthesisUtterance(text.slice(0, 3000))
  utterance.lang = ttsLang.value
  utterance.rate = 0.95
  utterance.onend = () => { ttsSpeaking.value = false }
  utterance.onerror = () => { ttsSpeaking.value = false }
  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  ttsSpeaking.value = true
}

function selectLang(code: string) {
  ttsLang.value = code
  showTtsMenu.value = false
  if (ttsSpeaking.value) {
    window.speechSynthesis.cancel()
    ttsSpeaking.value = false
  }
}

function closeTtsMenu() {
  showTtsMenu.value = false
}

const pageTitle = computed(() => {
  return (route.meta?.title as string) || '首页'
})

const isHome = computed(() => route.name === 'home')

function goBack() {
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push({ name: 'home' })
  }
}

function handleConnectClick() {
  if (wallet.state.value.connected) {
    showDropdown.value = !showDropdown.value
  } else {
    wallet.openModal()
  }
}

function handleDisconnect() {
  wallet.disconnectWallet()
  showDropdown.value = false
}

function closeDropdown() {
  showDropdown.value = false
}
</script>

<template>
  <div class="topbar">
    <div class="topbar-left">
      <button v-if="!isHome" class="back-btn" @click="goBack" title="返回上一页">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M19 12H5" /><path d="M12 19l-7-7 7-7" />
        </svg>
      </button>
      <div class="topbar-title">{{ pageTitle }}</div>
    </div>

    <div class="topbar-search">
      <Icon name="search" :size="14" class="search-icon" />
      <span class="search-placeholder">搜索文章、时光、知识...</span>
      <span class="search-shortcut">⌘K</span>
    </div>

    <div class="topbar-actions">
      <!-- 布局切换 -->
      <button
        class="topbar-btn layout-toggle"
        :title="app.layoutMode === 'center' ? '切换为全宽布局' : '切换为居中布局'"
        @click="app.toggleLayout()"
      >
        <svg v-if="app.layoutMode === 'center'" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <line x1="2" y1="9" x2="22" y2="9" />
        </svg>
        <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <rect x="5" y="3" width="14" height="18" rx="2" />
          <line x1="5" y1="9" x2="19" y2="9" />
        </svg>
      </button>
      <!-- 语音朗读 -->
      <div class="tts-wrapper">
        <button
          class="topbar-btn tts-btn"
          :class="{ speaking: ttsSpeaking }"
          title="语音朗读"
          @click="toggleTts()"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
            <path v-if="!ttsSpeaking" d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path v-if="!ttsSpeaking" d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            <line v-if="ttsSpeaking" x1="16" y1="9" x2="22" y2="15" />
            <line v-if="ttsSpeaking" x1="22" y1="9" x2="16" y2="15" />
          </svg>
        </button>
        <button
          class="tts-lang-btn"
          title="选择语言"
          @click="showTtsMenu = !showTtsMenu"
        >
          <span class="tts-lang-code">{{ ttsLang.split('-')[0] }}</span>
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>

        <Transition name="dropdown">
          <div v-if="showTtsMenu" class="tts-dropdown">
            <div class="tts-backdrop" @click="closeTtsMenu"></div>
            <div class="tts-panel">
              <div class="tts-panel-title">朗读语言</div>
              <button
                v-for="lang in ttsLanguages"
                :key="lang.code"
                class="tts-lang-item"
                :class="{ active: ttsLang === lang.code }"
                @click="selectLang(lang.code)"
              >
                <span class="tts-flag">{{ lang.flag }}</span>
                <span>{{ lang.label }}</span>
                <svg v-if="ttsLang === lang.code" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </div>
          </div>
        </Transition>
      </div>

      <button class="topbar-btn">
        <Icon name="bell" :size="16" />
      </button>
      <button class="topbar-btn" @click="router.push({ name: 'settings' })">
        <Icon name="settings" :size="16" />
      </button>

      <!-- 未连接：连接钱包按钮 -->
      <button
        v-if="!wallet.state.value.connected"
        class="wallet-connect-btn"
        @click="wallet.openModal()"
      >
        <span class="wallet-btn-dot"></span>
        <Icon name="wallet" :size="14" />
        连接钱包
      </button>

      <!-- 已连接：钱包胶囊 -->
      <div v-else class="wallet-capsule-wrapper">
        <button class="wallet-capsule" @click="handleConnectClick">
          <div class="capsule-chain">
            <Icon name="hexagon" :size="12" color="var(--accent-cyan)" />
          </div>
          <span class="capsule-addr">{{ wallet.state.value.shortAddress }}</span>
          <div class="capsule-avatar">
            <Icon name="wallet" :size="13" color="white" />
          </div>
        </button>

        <!-- 下拉面板 -->
        <Transition name="dropdown">
          <div v-if="showDropdown" class="wallet-dropdown">
            <div class="dropdown-backdrop" @click="closeDropdown"></div>
            <div class="dropdown-panel">
              <!-- 地址与链 -->
              <div class="dropdown-header">
                <div class="dropdown-avatar">
                  <Icon name="wallet" :size="18" color="white" />
                </div>
                <div class="dropdown-info">
                  <div class="dropdown-addr">{{ wallet.state.value.shortAddress }}</div>
                  <div class="dropdown-chain">
                    <span class="chain-dot"></span>
                    {{ wallet.state.value.chainName }}
                  </div>
                </div>
              </div>

              <!-- 余额 -->
              <div class="dropdown-balance">
                <div class="balance-label">余额</div>
                <div class="balance-value">{{ wallet.state.value.balance }}</div>
              </div>

              <!-- 操作 -->
              <div class="dropdown-actions">
                <button class="dropdown-action" @click="closeDropdown">
                  <Icon name="externalLink" :size="14" />
                  区块链浏览器查看
                </button>
                <button class="dropdown-action" @click="wallet.openModal(); closeDropdown()">
                  <Icon name="wallet" :size="14" />
                  切换钱包
                </button>
                <button class="dropdown-action danger" @click="handleDisconnect">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
                  </svg>
                  断开连接
                </button>
              </div>

              <!-- 底部 -->
              <div class="dropdown-footer">
                <Icon name="shield" :size="11" />
                已通过 {{ wallet.state.value.providerName }} 连接
              </div>
            </div>
          </div>
        </Transition>
      </div>
    </div>
  </div>

  <!-- Wallet Modal -->
  <WalletModal
    :visible="wallet.showModal.value"
    :wallets="wallet.walletList.value"
    :connecting="wallet.connecting.value"
    :error="wallet.error.value"
    :connected-address="wallet.state.value.connected ? wallet.state.value.address : undefined"
    :connected-provider="wallet.state.value.connected ? wallet.state.value.providerName : undefined"
    @close="wallet.closeModal()"
    @connect="wallet.connectWallet($event)"
    @disconnect="wallet.disconnectWallet()"
  />
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 0;
  border-bottom: 1px solid var(--border);
  margin-bottom: 36px;
  position: sticky;
  top: 0;
  background: rgba(4, 8, 16, 0.8);
  backdrop-filter: blur(20px);
  z-index: var(--z-sticky);
}

.topbar-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.back-btn {
  width: 28px;
  height: 28px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  border: none;
}
.back-btn:hover {
  color: var(--accent-blue);
}
.topbar-title {
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.5px;
  line-height: 28px;
}

.topbar-search {
  display: flex;
  align-items: center;
  gap: 10px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  padding: 8px 16px;
  flex: 1;
  max-width: 380px;
  margin: 0 24px;
  cursor: text;
  transition: all 0.2s;
}
.topbar-search:hover {
  border-color: var(--border-hover);
}

.search-icon {
  color: var(--text-muted);
}
.search-placeholder {
  color: var(--text-muted);
  font-size: 13px;
}
.search-shortcut {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  padding: 2px 6px;
  border-radius: 4px;
}

.topbar-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.topbar-btn {
  padding: 8px 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}
.topbar-btn:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}
.layout-toggle.topbar-btn {
  position: relative;
}

/* ═══ 语音朗读 ═══ */
.tts-wrapper {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: visible;
  position: relative;
}
.tts-btn.topbar-btn {
  border: none;
  border-radius: var(--radius-sm) 0 0 var(--radius-sm);
  padding: 8px 10px;
}
.tts-btn.speaking {
  color: var(--accent-blue);
  background: rgba(99, 179, 237, 0.08);
}
.tts-lang-btn {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 8px 8px 8px 6px;
  border: none;
  border-left: 1px solid var(--border);
  background: transparent;
  color: var(--text-muted);
  font-size: 10px;
  font-family: var(--font-mono);
  cursor: pointer;
  transition: all 0.15s;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
}
.tts-lang-code {
  text-transform: uppercase;
  font-weight: 500;
  letter-spacing: 0.5px;
}
.tts-lang-btn:hover {
  color: var(--text-primary);
  background: rgba(255, 255, 255, 0.03);
}

/* TTS 语言下拉 */
.tts-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
}
.tts-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
}
.tts-panel {
  position: relative;
  z-index: 1;
  width: 180px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: 12px;
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
  padding: 6px;
  overflow: hidden;
}
.tts-panel-title {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;
  padding: 6px 10px 4px;
  text-transform: uppercase;
}
.tts-lang-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  border: none;
  background: transparent;
  text-align: left;
}
.tts-lang-item:hover {
  background: rgba(99, 179, 237, 0.07);
  color: var(--text-primary);
}
.tts-lang-item.active {
  color: var(--accent-blue);
  background: rgba(99, 179, 237, 0.1);
}
.tts-lang-item svg {
  margin-left: auto;
}
.tts-flag {
  font-size: 15px;
}

/* ═══ 连接钱包按钮（未连接状态）═══ */
.wallet-connect-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 18px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  border-radius: var(--radius-full);
  color: white;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.25s;
  box-shadow: 0 2px 16px rgba(99, 179, 237, 0.3);
  position: relative;
  overflow: hidden;
}
.wallet-connect-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 20px rgba(99, 179, 237, 0.45);
}
.wallet-connect-btn:active {
  transform: translateY(0);
}
.wallet-btn-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.6);
  animation: pulse 2s ease-in-out infinite;
}

/* ═══ 钱包胶囊（已连接状态）═══ */
.wallet-capsule-wrapper {
  position: relative;
}

.wallet-capsule {
  display: flex;
  align-items: center;
  gap: 0;
  padding: 4px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  cursor: pointer;
  transition: all 0.25s;
}
.wallet-capsule:hover {
  border-color: var(--border-hover);
  box-shadow: var(--glow-blue);
}

.capsule-chain {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(118, 228, 247, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.capsule-addr {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-primary);
  padding: 0 10px;
  letter-spacing: 0.3px;
}
.capsule-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

/* ═══ 下拉面板 ═══ */
.dropdown-backdrop {
  position: fixed;
  inset: 0;
  z-index: 0;
}

.wallet-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  z-index: 200;
}

.dropdown-panel {
  width: 280px;
  background: var(--bg-deep);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.45), 0 0 30px rgba(99, 179, 237, 0.06);
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.dropdown-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-bottom: 1px solid var(--border);
}
.dropdown-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 12px rgba(99, 179, 237, 0.2);
}
.dropdown-addr {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent-blue);
  letter-spacing: 0.5px;
}
.dropdown-chain {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 3px;
  display: flex;
  align-items: center;
  gap: 5px;
}
.chain-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
}

.dropdown-balance {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.balance-label {
  font-size: 12px;
  color: var(--text-muted);
}
.balance-value {
  font-family: var(--font-mono);
  font-size: 14px;
  font-weight: 600;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.dropdown-actions {
  padding: 8px;
}
.dropdown-action {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
  text-align: left;
}
.dropdown-action:hover {
  background: rgba(99, 179, 237, 0.07);
  color: var(--text-primary);
}
.dropdown-action.danger {
  color: var(--accent-pink);
}
.dropdown-action.danger:hover {
  background: rgba(246, 135, 179, 0.08);
}

.dropdown-footer {
  padding: 10px 16px;
  border-top: 1px solid var(--border);
  font-size: 10px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Dropdown transition */
.dropdown-enter-active {
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}
.dropdown-leave-active {
  transition: all 0.15s ease;
}
.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-6px) scale(0.97);
}
</style>
