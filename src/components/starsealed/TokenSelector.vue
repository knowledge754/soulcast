<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '../icons/Icon.vue'

export interface LockedToken {
  symbol: string
  name: string
  amount: string
  icon: string
  color: string
  decimals: number
  address: string
  balance: string
  usdPrice: number
}

const props = defineProps<{
  visible: boolean
  walletConnected: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [tokens: LockedToken[]]
}>()

const SUPPORTED_TOKENS: Omit<LockedToken, 'amount'>[] = [
  { symbol: 'BNB', name: 'BNB', icon: '◆', color: '#F0B90B', decimals: 18, address: 'native', balance: '2.4518', usdPrice: 312.5 },
  { symbol: 'USDT', name: 'Tether USD', icon: '₮', color: '#26A17B', decimals: 18, address: '0x55d398326f99059fF775485246999027B3197955', balance: '1,250.00', usdPrice: 1.0 },
  { symbol: 'USDC', name: 'USD Coin', icon: '$', color: '#2775CA', decimals: 18, address: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d', balance: '800.00', usdPrice: 1.0 },
  { symbol: 'BUSD', name: 'Binance USD', icon: 'B', color: '#F0B90B', decimals: 18, address: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', balance: '500.00', usdPrice: 1.0 },
  { symbol: 'CAKE', name: 'PancakeSwap', icon: '🥞', color: '#D1884F', decimals: 18, address: '0x0E09FaBB73Bd3Ade0a17ECC321fD13a19e81cE82', balance: '45.67', usdPrice: 2.35 },
  { symbol: 'ETH', name: 'Ethereum (BSC)', icon: 'Ξ', color: '#627EEA', decimals: 18, address: '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', balance: '0.5200', usdPrice: 2680.0 },
]

const selectedTokens = ref<Map<string, string>>(new Map())
const activeToken = ref<string>('')

function toggleToken(symbol: string) {
  if (activeToken.value === symbol) {
    activeToken.value = ''
  } else {
    activeToken.value = symbol
    if (!selectedTokens.value.has(symbol)) {
      selectedTokens.value.set(symbol, '')
    }
  }
}

function setAmount(symbol: string, amount: string) {
  selectedTokens.value.set(symbol, amount)
}

function setMax(symbol: string) {
  const tk = SUPPORTED_TOKENS.find(t => t.symbol === symbol)
  if (tk) selectedTokens.value.set(symbol, tk.balance.replace(/,/g, ''))
}

function removeToken(symbol: string) {
  selectedTokens.value.delete(symbol)
  if (activeToken.value === symbol) activeToken.value = ''
}

const validTokens = computed(() => {
  const result: LockedToken[] = []
  for (const [symbol, amount] of selectedTokens.value) {
    const num = parseFloat(amount)
    if (num > 0) {
      const tk = SUPPORTED_TOKENS.find(t => t.symbol === symbol)!
      result.push({ ...tk, amount })
    }
  }
  return result
})

const totalUsdValue = computed(() => {
  return validTokens.value.reduce((sum, t) => sum + parseFloat(t.amount) * t.usdPrice, 0)
})

function handleConfirm() {
  emit('confirm', validTokens.value)
}

function handleOverlay(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('tk-overlay')) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="tk-modal">
      <div v-if="visible" class="tk-overlay" @click="handleOverlay">
        <div class="tk-container">
          <div class="tk-header">
            <div class="tk-title-row">
              <Icon name="hexagon" :size="18" color="var(--star-gold)" />
              <div>
                <h3 class="tk-title">锁入 Token</h3>
                <p class="tk-sub">选择代币和数量，到期后自动转给收件方</p>
              </div>
            </div>
            <button class="tk-close" @click="emit('close')">✕</button>
          </div>

          <div v-if="!walletConnected" class="tk-no-wallet">
            <Icon name="wallet" :size="28" color="var(--text-muted)" />
            <div class="nw-text">请先连接钱包</div>
            <div class="nw-sub">连接钱包后将显示你的代币余额</div>
          </div>

          <div v-else class="tk-body">
            <div class="tk-list">
              <div
                v-for="tk in SUPPORTED_TOKENS"
                :key="tk.symbol"
                class="tk-item"
                :class="{ active: selectedTokens.has(tk.symbol), expanded: activeToken === tk.symbol }"
                @click="toggleToken(tk.symbol)"
              >
                <div class="tk-row">
                  <div class="tk-icon" :style="{ background: tk.color }">{{ tk.icon }}</div>
                  <div class="tk-info">
                    <div class="tk-symbol">{{ tk.symbol }}</div>
                    <div class="tk-name">{{ tk.name }}</div>
                  </div>
                  <div class="tk-balance">
                    <div class="tk-bal-num">{{ tk.balance }}</div>
                    <div class="tk-bal-usd">≈ ${{ (parseFloat(tk.balance.replace(/,/g, '')) * tk.usdPrice).toFixed(2) }}</div>
                  </div>
                  <div class="tk-check">
                    <span v-if="selectedTokens.has(tk.symbol) && parseFloat(selectedTokens.get(tk.symbol) || '0') > 0" class="check-on">✓</span>
                    <span v-else class="check-off">+</span>
                  </div>
                </div>
                <Transition name="tk-expand">
                  <div v-if="activeToken === tk.symbol" class="tk-amount-row" @click.stop>
                    <div class="tk-input-wrap">
                      <input
                        type="number"
                        class="tk-input"
                        :placeholder="`输入 ${tk.symbol} 数量`"
                        :value="selectedTokens.get(tk.symbol) || ''"
                        @input="setAmount(tk.symbol, ($event.target as HTMLInputElement).value)"
                        @click.stop
                      />
                      <button class="tk-max" @click.stop="setMax(tk.symbol)">MAX</button>
                    </div>
                    <div class="tk-amount-info">
                      <span>可用: {{ tk.balance }} {{ tk.symbol }}</span>
                      <span v-if="selectedTokens.get(tk.symbol)" class="tk-usd-val">
                        ≈ ${{ (parseFloat(selectedTokens.get(tk.symbol) || '0') * tk.usdPrice).toFixed(2) }}
                      </span>
                    </div>
                    <button v-if="selectedTokens.has(tk.symbol)" class="tk-remove" @click.stop="removeToken(tk.symbol)">移除</button>
                  </div>
                </Transition>
              </div>
            </div>

            <div v-if="validTokens.length > 0" class="tk-summary">
              <div class="tk-sum-title">已选资产</div>
              <div v-for="t in validTokens" :key="t.symbol" class="tk-sum-item">
                <span class="tk-sum-icon" :style="{ color: t.color }">{{ t.icon }}</span>
                <span>{{ t.amount }} {{ t.symbol }}</span>
                <span class="tk-sum-usd">≈ ${{ (parseFloat(t.amount) * t.usdPrice).toFixed(2) }}</span>
              </div>
              <div class="tk-sum-total">
                <span>总价值</span>
                <span class="tk-total-num">${{ totalUsdValue.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="tk-footer">
            <button class="tk-btn-cancel" @click="emit('close')">取消</button>
            <button class="tk-btn-confirm" :disabled="validTokens.length === 0" @click="handleConfirm">
              确认锁入 {{ validTokens.length > 0 ? `(${validTokens.length} 种)` : '' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.tk-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.tk-container { width: 100%; max-width: 520px; max-height: 85vh; background: var(--bg-glass-heavy); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }

.tk-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
.tk-title-row { display: flex; gap: 12px; align-items: center; }
.tk-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; }
.tk-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.tk-close { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; cursor: pointer; }
.tk-close:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }

.tk-no-wallet { padding: 48px 24px; text-align: center; }
.nw-text { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-top: 12px; }
.nw-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.tk-body { flex: 1; overflow-y: auto; padding: 16px; }
.tk-list { display: flex; flex-direction: column; gap: 6px; }

.tk-item { border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all 0.25s; overflow: hidden; }
.tk-item:hover { border-color: rgba(99,179,237,0.3); }
.tk-item.active { border-color: rgba(251,191,36,0.5); background: rgba(251,191,36,0.04); }
.tk-item.expanded { border-color: rgba(251,191,36,0.6); }

.tk-row { display: flex; align-items: center; gap: 12px; padding: 12px 14px; }
.tk-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; font-weight: 700; color: white; flex-shrink: 0; }
.tk-info { flex: 1; min-width: 0; }
.tk-symbol { font-size: 14px; font-weight: 700; color: var(--text-primary); }
.tk-name { font-size: 11px; color: var(--text-muted); }
.tk-balance { text-align: right; }
.tk-bal-num { font-size: 13px; font-weight: 600; color: var(--text-primary); font-family: var(--font-mono); }
.tk-bal-usd { font-size: 10px; color: var(--text-muted); }
.tk-check { width: 24px; height: 24px; border-radius: 6px; display: flex; align-items: center; justify-content: center; font-size: 12px; flex-shrink: 0; }
.check-on { color: var(--star-gold, #fbbf24); font-weight: 700; }
.check-off { color: var(--text-muted); }

.tk-amount-row { padding: 0 14px 14px; border-top: 1px solid rgba(255,255,255,0.04); }
.tk-input-wrap { display: flex; gap: 8px; margin-top: 10px; }
.tk-input { flex: 1; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 10px; padding: 10px 14px; color: var(--text-primary); font-size: 15px; font-family: var(--font-mono); font-weight: 600; outline: none; }
.tk-input:focus { border-color: rgba(251,191,36,0.5); }
.tk-input::placeholder { color: var(--text-muted); font-weight: 400; font-size: 13px; }
.tk-max { padding: 8px 14px; border-radius: 10px; background: rgba(251,191,36,0.12); color: var(--star-gold, #fbbf24); font-size: 12px; font-weight: 700; letter-spacing: 0.5px; cursor: pointer; border: 1px solid rgba(251,191,36,0.2); }
.tk-max:hover { background: rgba(251,191,36,0.2); }
.tk-amount-info { display: flex; justify-content: space-between; margin-top: 6px; font-size: 11px; color: var(--text-muted); }
.tk-usd-val { color: var(--star-gold, #fbbf24); font-weight: 600; }
.tk-remove { margin-top: 8px; font-size: 11px; color: var(--accent-pink); cursor: pointer; }

.tk-summary { margin-top: 16px; padding: 14px; border-radius: 12px; background: rgba(251,191,36,0.04); border: 1px solid rgba(251,191,36,0.15); }
.tk-sum-title { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
.tk-sum-item { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-primary); padding: 4px 0; }
.tk-sum-icon { font-size: 14px; }
.tk-sum-usd { margin-left: auto; font-size: 11px; color: var(--text-muted); }
.tk-sum-total { display: flex; justify-content: space-between; margin-top: 10px; padding-top: 10px; border-top: 1px solid rgba(251,191,36,0.15); font-size: 13px; font-weight: 600; color: var(--text-primary); }
.tk-total-num { color: var(--star-gold, #fbbf24); font-family: var(--font-mono); }

.tk-footer { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border); }
.tk-btn-cancel { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer; }
.tk-btn-cancel:hover { background: rgba(255,255,255,0.04); }
.tk-btn-confirm { flex: 2; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #fbbf24, #f59e0b); color: #000; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
.tk-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.tk-btn-confirm:not(:disabled):hover { filter: brightness(1.1); }

/* Input spinner hide */
.tk-input::-webkit-outer-spin-button,
.tk-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
.tk-input[type=number] { -moz-appearance: textfield; }

/* Transitions */
.tk-modal-enter-active, .tk-modal-leave-active { transition: all 0.3s; }
.tk-modal-enter-from, .tk-modal-leave-to { opacity: 0; }
.tk-modal-enter-from .tk-container, .tk-modal-leave-to .tk-container { transform: scale(0.95) translateY(20px); }
.tk-expand-enter-active, .tk-expand-leave-active { transition: all 0.25s; max-height: 200px; }
.tk-expand-enter-from, .tk-expand-leave-to { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }
</style>
