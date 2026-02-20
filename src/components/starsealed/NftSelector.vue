<script setup lang="ts">
import { ref, computed } from 'vue'
import Icon from '../icons/Icon.vue'

export interface LockedNft {
  contractAddress: string
  tokenId: string
  name: string
  collection: string
  image: string
  standard: 'BEP-721' | 'BEP-1155'
}

defineProps<{
  visible: boolean
  walletConnected: boolean
}>()

const emit = defineEmits<{
  close: []
  confirm: [nfts: LockedNft[]]
}>()

const MOCK_NFTS: LockedNft[] = [
  { contractAddress: '0xBCf4783e35a4Ad5273cC07A8ECfA0f6BDe2661a2', tokenId: '1042', name: 'Bored Ape #1042', collection: 'BAYC', image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=200&h=200&fit=crop', standard: 'BEP-721' },
  { contractAddress: '0xA1f0d924cBa81e8F1966E46CaF6753b4067513b4', tokenId: '7721', name: 'CryptoPunk #7721', collection: 'Punks', image: 'https://images.unsplash.com/photo-1635322966219-b75ed372eb01?w=200&h=200&fit=crop', standard: 'BEP-721' },
  { contractAddress: '0xC3d57A8E62C1247f2098b91E5c7a0b9dFea015e6', tokenId: '256', name: 'Doodle #256', collection: 'Doodles', image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop', standard: 'BEP-721' },
  { contractAddress: '0xD4e0c159F5EaA843b7f3C91dD4b8C0a72B5E37f8', tokenId: '88', name: 'Azuki #88', collection: 'Azuki', image: 'https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=200&h=200&fit=crop', standard: 'BEP-721' },
  { contractAddress: '0xE5f18d3CAb75a1F4c8e0A29Fe71f6372D80E09a0', tokenId: '512', name: 'CloneX #512', collection: 'CloneX', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=200&h=200&fit=crop', standard: 'BEP-721' },
  { contractAddress: '0xF6a1b2c9E8d7043fAB56e3d91C8572FE4A9e01b2', tokenId: '333', name: 'Moonbird #333', collection: 'Moonbirds', image: 'https://images.unsplash.com/photo-1642104704074-907c0698cbd9?w=200&h=200&fit=crop', standard: 'BEP-721' },
]

const selected = ref<Set<string>>(new Set())
const searchQuery = ref('')
const nftAddressInput = ref('')

function toggleNft(key: string) {
  if (selected.value.has(key)) selected.value.delete(key)
  else selected.value.add(key)
}

function nftKey(nft: LockedNft) {
  return `${nft.contractAddress}:${nft.tokenId}`
}

const filteredNfts = computed(() => {
  if (!searchQuery.value) return MOCK_NFTS
  const q = searchQuery.value.toLowerCase()
  return MOCK_NFTS.filter(n => n.name.toLowerCase().includes(q) || n.collection.toLowerCase().includes(q))
})

const selectedNfts = computed(() => MOCK_NFTS.filter(n => selected.value.has(nftKey(n))))

function handleConfirm() {
  emit('confirm', selectedNfts.value)
}

function handleOverlay(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('nft-overlay')) emit('close')
}
</script>

<template>
  <Teleport to="body">
    <Transition name="nft-modal">
      <div v-if="visible" class="nft-overlay" @click="handleOverlay">
        <div class="nft-container">
          <div class="nft-header">
            <div class="nft-title-row">
              <Icon name="sparkles" :size="18" color="#a78bfa" />
              <div>
                <h3 class="nft-title">锁入 NFT</h3>
                <p class="nft-sub">选择 NFT，到期后自动转移所有权给收件方</p>
              </div>
            </div>
            <button class="nft-close" @click="emit('close')">✕</button>
          </div>

          <div v-if="!walletConnected" class="nft-no-wallet">
            <Icon name="wallet" :size="28" color="var(--text-muted)" />
            <div class="nw-text">请先连接钱包</div>
            <div class="nw-sub">连接钱包后将显示你拥有的 NFT</div>
          </div>

          <div v-else class="nft-body">
            <div class="nft-search">
              <Icon name="search" :size="14" color="var(--text-muted)" />
              <input v-model="searchQuery" placeholder="搜索 NFT 名称或合集…" class="nft-search-input" />
            </div>

            <div class="nft-manual">
              <input v-model="nftAddressInput" placeholder="或输入 NFT 合约地址 + Token ID" class="nft-addr-input" />
            </div>

            <div class="nft-grid">
              <div
                v-for="nft in filteredNfts"
                :key="nftKey(nft)"
                class="nft-card"
                :class="{ selected: selected.has(nftKey(nft)) }"
                @click="toggleNft(nftKey(nft))"
              >
                <div class="nft-img-wrap">
                  <img :src="nft.image" :alt="nft.name" class="nft-img" />
                  <div v-if="selected.has(nftKey(nft))" class="nft-selected-badge">✓</div>
                </div>
                <div class="nft-card-info">
                  <div class="nft-card-name">{{ nft.name }}</div>
                  <div class="nft-card-coll">{{ nft.collection }} · {{ nft.standard }}</div>
                </div>
              </div>
            </div>

            <div v-if="selectedNfts.length > 0" class="nft-summary">
              <div class="nft-sum-title">已选 {{ selectedNfts.length }} 个 NFT</div>
              <div class="nft-sum-list">
                <div v-for="nft in selectedNfts" :key="nftKey(nft)" class="nft-sum-item">
                  <img :src="nft.image" class="nft-sum-thumb" />
                  <span>{{ nft.name }}</span>
                  <button class="nft-sum-remove" @click.stop="toggleNft(nftKey(nft))">✕</button>
                </div>
              </div>
            </div>
          </div>

          <div class="nft-footer">
            <button class="nft-btn-cancel" @click="emit('close')">取消</button>
            <button class="nft-btn-confirm" :disabled="selectedNfts.length === 0" @click="handleConfirm">
              确认锁入 {{ selectedNfts.length > 0 ? `(${selectedNfts.length} 个)` : '' }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.nft-overlay { position: fixed; inset: 0; z-index: 9000; background: rgba(0,0,0,0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; }
.nft-container { width: 100%; max-width: 560px; max-height: 85vh; background: var(--bg-glass-heavy); backdrop-filter: blur(24px); border: 1px solid var(--border); border-radius: 20px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 25px 60px rgba(0,0,0,0.5); }

.nft-header { display: flex; align-items: flex-start; justify-content: space-between; padding: 20px 24px 16px; border-bottom: 1px solid var(--border); }
.nft-title-row { display: flex; gap: 12px; align-items: center; }
.nft-title { font-size: 16px; font-weight: 700; color: var(--text-primary); margin: 0; }
.nft-sub { font-size: 11px; color: var(--text-muted); margin-top: 2px; }
.nft-close { width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-size: 14px; cursor: pointer; }
.nft-close:hover { background: rgba(255,255,255,0.06); color: var(--text-primary); }

.nft-no-wallet { padding: 48px 24px; text-align: center; }
.nw-text { font-size: 15px; font-weight: 600; color: var(--text-primary); margin-top: 12px; }
.nw-sub { font-size: 12px; color: var(--text-muted); margin-top: 4px; }

.nft-body { flex: 1; overflow-y: auto; padding: 16px; }

.nft-search { display: flex; align-items: center; gap: 8px; background: rgba(0,0,0,0.3); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; margin-bottom: 10px; }
.nft-search-input { flex: 1; background: transparent; border: none; color: var(--text-primary); font-size: 13px; outline: none; }
.nft-search-input::placeholder { color: var(--text-muted); }

.nft-manual { margin-bottom: 14px; }
.nft-addr-input { width: 100%; background: rgba(0,0,0,0.2); border: 1px dashed var(--border); border-radius: 10px; padding: 8px 12px; color: var(--text-primary); font-size: 12px; font-family: var(--font-mono); outline: none; }
.nft-addr-input::placeholder { color: var(--text-muted); }
.nft-addr-input:focus { border-color: rgba(167,139,250,0.4); border-style: solid; }

.nft-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.nft-card { border-radius: 12px; border: 1px solid var(--border); background: var(--bg-card); cursor: pointer; transition: all 0.25s; overflow: hidden; }
.nft-card:hover { border-color: rgba(167,139,250,0.4); transform: translateY(-2px); }
.nft-card.selected { border-color: rgba(167,139,250,0.7); box-shadow: 0 0 20px rgba(167,139,250,0.15); }

.nft-img-wrap { position: relative; aspect-ratio: 1; overflow: hidden; }
.nft-img { width: 100%; height: 100%; object-fit: cover; }
.nft-selected-badge { position: absolute; top: 6px; right: 6px; width: 22px; height: 22px; border-radius: 50%; background: #a78bfa; color: white; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; }

.nft-card-info { padding: 8px 10px; }
.nft-card-name { font-size: 12px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.nft-card-coll { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

.nft-summary { margin-top: 14px; padding: 12px; border-radius: 12px; background: rgba(167,139,250,0.04); border: 1px solid rgba(167,139,250,0.15); }
.nft-sum-title { font-size: 11px; color: var(--text-muted); letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px; }
.nft-sum-list { display: flex; flex-direction: column; gap: 6px; }
.nft-sum-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text-primary); }
.nft-sum-thumb { width: 28px; height: 28px; border-radius: 6px; object-fit: cover; }
.nft-sum-remove { margin-left: auto; color: var(--accent-pink); font-size: 11px; cursor: pointer; }

.nft-footer { display: flex; gap: 10px; padding: 16px 24px; border-top: 1px solid var(--border); }
.nft-btn-cancel { flex: 1; padding: 10px; border-radius: 10px; border: 1px solid var(--border); background: transparent; color: var(--text-secondary); font-size: 13px; cursor: pointer; }
.nft-btn-cancel:hover { background: rgba(255,255,255,0.04); }
.nft-btn-confirm { flex: 2; padding: 10px; border-radius: 10px; background: linear-gradient(135deg, #a78bfa, #7c3aed); color: white; font-size: 13px; font-weight: 700; cursor: pointer; border: none; }
.nft-btn-confirm:disabled { opacity: 0.4; cursor: not-allowed; }
.nft-btn-confirm:not(:disabled):hover { filter: brightness(1.1); }

.nft-modal-enter-active, .nft-modal-leave-active { transition: all 0.3s; }
.nft-modal-enter-from, .nft-modal-leave-to { opacity: 0; }
.nft-modal-enter-from .nft-container, .nft-modal-leave-to .nft-container { transform: scale(0.95) translateY(20px); }
</style>
