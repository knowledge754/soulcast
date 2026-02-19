<script setup lang="ts">
import Icon from '../icons/Icon.vue'
import type { WalletProvider } from '../../composables/useWallet'
import { walletIcons } from '../../assets/wallet-icons'

defineProps<{
  visible: boolean
  wallets: WalletProvider[]
  connecting: boolean
  connectingId: string
  error: string
  connectedAddress?: string
  connectedProvider?: string
}>()

const emit = defineEmits<{
  close: []
  connect: [walletId: string]
  disconnect: []
}>()

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}

function getWalletIcon(w: WalletProvider): string {
  return w.eip6963Icon || walletIcons[w.id] || walletIcons.metamask
}
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="modal-overlay" @click="handleOverlayClick">
        <div class="modal-container">
          <!-- Header -->
          <div class="modal-header">
            <div class="modal-title-row">
              <div class="modal-icon">
                <Icon name="wallet" :size="20" color="var(--accent-blue)" />
              </div>
              <div>
                <h2 class="modal-title">连接钱包</h2>
                <p class="modal-subtitle">选择你的 Web3 钱包来登录 ChainLog</p>
              </div>
            </div>
            <button class="modal-close" @click="emit('close')">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <!-- Connected State -->
          <div v-if="connectedAddress" class="connected-banner">
            <div class="connected-info">
              <div class="connected-dot"></div>
              <span class="connected-label">已连接 {{ connectedProvider }}</span>
            </div>
            <div class="connected-addr">{{ connectedAddress }}</div>
            <button class="disconnect-btn" @click="emit('disconnect')">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
              </svg>
              断开连接
            </button>
          </div>

          <!-- Error -->
          <div v-if="error" class="modal-error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
              <circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- Wallet List — 统一列表，全部可连接 -->
          <div class="wallet-section">
            <div class="wallet-section-label">选择钱包</div>
            <div class="wallet-grid">
              <button
                v-for="w in wallets"
                :key="w.id"
                class="wallet-card"
                :class="{ active: connectingId === w.id, dimmed: connecting && connectingId !== w.id }"
                :disabled="connecting"
                @click="emit('connect', w.id)"
              >
                <div class="wallet-logo">
                  <img :src="getWalletIcon(w)" :alt="w.name" class="wallet-logo-img" />
                </div>
                <div class="wallet-info">
                  <div class="wallet-name">{{ w.name }}</div>
                  <div class="wallet-desc">{{ w.description }}</div>
                </div>
                <div class="wallet-arrow">
                  <Icon v-if="connectingId !== w.id" name="arrowRight" :size="14" />
                  <div v-else class="wallet-spinner"></div>
                </div>
              </button>
            </div>
          </div>

          <!-- Footer -->
          <div class="modal-footer">
            <Icon name="shield" :size="13" color="var(--text-muted)" />
            <span>仅通过签名验证身份，不会发送任何交易</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
/* ── Overlay ── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

/* ── Container ── */
.modal-container {
  width: 100%;
  max-width: 480px;
  max-height: 85vh;
  overflow-y: auto;
  background: var(--bg-glass-heavy);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: 20px;
  box-shadow: 0 25px 60px rgba(0, 0, 0, 0.5), 0 0 40px rgba(99, 179, 237, 0.08);
}

/* ── Header ── */
.modal-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: 24px 24px 0;
}
.modal-title-row {
  display: flex;
  align-items: center;
  gap: 14px;
}
.modal-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: rgba(99, 179, 237, 0.1);
  border: 1px solid rgba(99, 179, 237, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 2px;
}
.modal-subtitle {
  font-size: 12px;
  color: var(--text-muted);
}
.modal-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
  margin-top: 4px;
}
.modal-close:hover {
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
}

/* ── Connected Banner ── */
.connected-banner {
  margin: 16px 24px 0;
  background: rgba(104, 211, 145, 0.06);
  border: 1px solid rgba(104, 211, 145, 0.15);
  border-radius: 12px;
  padding: 14px 16px;
}
.connected-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.connected-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 8px var(--accent-green);
  animation: pulse 2s ease-in-out infinite;
}
.connected-label {
  font-size: 12px;
  color: var(--accent-green);
  font-family: var(--font-mono);
}
.connected-addr {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent-blue);
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  word-break: break-all;
}
.disconnect-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  border: 1px solid rgba(246, 135, 179, 0.3);
  background: rgba(246, 135, 179, 0.08);
  color: var(--accent-pink);
  font-size: 12px;
  font-family: var(--font-body);
  cursor: pointer;
  transition: all 0.2s;
}
.disconnect-btn:hover {
  background: rgba(246, 135, 179, 0.15);
  border-color: rgba(246, 135, 179, 0.5);
}

/* ── Error ── */
.modal-error {
  margin: 12px 24px 0;
  padding: 10px 14px;
  background: rgba(246, 135, 179, 0.08);
  border: 1px solid rgba(246, 135, 179, 0.2);
  border-radius: 10px;
  color: var(--accent-pink);
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* ── Wallet Section ── */
.wallet-section {
  padding: 16px 24px 0;
}
.wallet-section-label {
  font-size: 10px;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 6px;
}

/* ── Wallet Grid ── */
.wallet-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Wallet Card ── */
.wallet-card {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  cursor: pointer;
  transition: all 0.25s;
  position: relative;
  text-align: left;
}
.wallet-card:hover {
  border-color: rgba(99, 179, 237, 0.4);
  background: rgba(99, 179, 237, 0.04);
  transform: translateX(4px);
  box-shadow: var(--glow-blue);
}
.wallet-card.active {
  border-color: rgba(99, 179, 237, 0.5);
  background: rgba(99, 179, 237, 0.06);
  box-shadow: var(--glow-blue);
}
.wallet-card.dimmed {
  pointer-events: none;
  opacity: 0.4;
}

.wallet-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}
.wallet-logo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 12px;
}
.wallet-info {
  flex: 1;
  min-width: 0;
}
.wallet-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}
.wallet-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}
.wallet-arrow {
  color: var(--text-muted);
  transition: all 0.2s;
  flex-shrink: 0;
}
.wallet-card:hover .wallet-arrow {
  color: var(--accent-blue);
  transform: translateX(2px);
}

/* ── Spinner ── */
.wallet-spinner {
  width: 18px;
  height: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wallet-spinner::after {
  content: '';
  width: 16px;
  height: 16px;
  border: 2px solid var(--border);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Footer ── */
.modal-footer {
  padding: 16px 24px 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  border-top: 1px solid var(--border);
  margin-top: 16px;
}

/* ── Transition ── */
.modal-enter-active {
  transition: all 0.3s ease;
}
.modal-leave-active {
  transition: all 0.2s ease;
}
.modal-enter-from {
  opacity: 0;
}
.modal-leave-to {
  opacity: 0;
}
.modal-enter-from .modal-container {
  transform: scale(0.95) translateY(10px);
  opacity: 0;
}
.modal-enter-active .modal-container {
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}
.modal-leave-active .modal-container {
  transition: all 0.2s ease;
}
.modal-leave-to .modal-container {
  transform: scale(0.97);
  opacity: 0;
}
</style>
