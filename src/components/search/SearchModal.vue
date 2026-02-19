<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from '../../stores/i18n'

const props = defineProps<{ visible: boolean }>()
const emit = defineEmits<{ (e: 'close'): void }>()

const router = useRouter()
const i18n = useI18n()
const query = ref('')
const inputRef = ref<HTMLInputElement>()
const selectedIdx = ref(0)

interface SearchItem {
  type: 'page' | 'post' | 'moment'
  title: string
  desc: string
  route?: string
  icon: string
}

const allItems: SearchItem[] = [
  { type: 'page', title: '首页', desc: '返回主页', route: 'home', icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  { type: 'page', title: '相册', desc: '浏览照片', route: 'album', icon: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z' },
  { type: 'page', title: '星封', desc: '时间胶囊', route: 'starsealed', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
  { type: 'page', title: '朋友圈', desc: '社交动态', route: 'moments', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { type: 'page', title: '知识库', desc: '知识管理', route: 'knowledge', icon: 'M4 19.5A2.5 2.5 0 0 1 6.5 17H20M4 19.5A2.5 2.5 0 0 0 6.5 22H20V2H6.5A2.5 2.5 0 0 0 4 4.5v15z' },
  { type: 'page', title: '归档', desc: '文章归档', route: 'archive', icon: 'M21 8v13H3V8M1 3h22v5H1z' },
  { type: 'page', title: '友链', desc: '友情链接', route: 'friends', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M8.5 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM20 8v6M23 11h-6' },
  { type: 'page', title: '私信', desc: '消息中心', route: 'chat', icon: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z' },
  { type: 'page', title: '设置', desc: '个人设置', route: 'settings', icon: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z' },
  { type: 'post', title: '漫游在 DeFi 的星河里', desc: '三年前我第一次连接 MetaMask...', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { type: 'post', title: '用 Solidity 写一首诗', desc: '代码和诗歌之间的距离...', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { type: 'post', title: '成都雨天，喝茶，想起了去中心化', desc: '如果记忆也可以上链...', icon: 'M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z' },
  { type: 'moment', title: 'vitalik.eth 的动态', desc: '今天在 Devcon 遇到了好多有趣的灵魂...', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
  { type: 'moment', title: 'NightCoder 的动态', desc: '凌晨 2 点，写完了第一个完整的 DApp...', icon: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z' },
]

const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return allItems
  return allItems.filter(item =>
    item.title.toLowerCase().includes(q) ||
    item.desc.toLowerCase().includes(q)
  )
})

watch(() => props.visible, (v) => {
  if (v) {
    query.value = ''
    selectedIdx.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

watch(query, () => { selectedIdx.value = 0 })

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    selectedIdx.value = Math.min(selectedIdx.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    selectedIdx.value = Math.max(selectedIdx.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = results.value[selectedIdx.value]
    if (item?.route) {
      router.push({ name: item.route })
      emit('close')
    }
  } else if (e.key === 'Escape') {
    emit('close')
  }
}

function selectItem(item: SearchItem) {
  if (item.route) {
    router.push({ name: item.route })
    emit('close')
  }
}

function typeLabel(type: string) {
  switch (type) {
    case 'page': return i18n.t('search.page')
    case 'post': return i18n.t('search.post')
    case 'moment': return i18n.t('search.moment')
    default: return type
  }
}
</script>

<template>
  <Teleport to="body">
    <Transition name="search-modal">
      <div v-if="visible" class="search-overlay" @click.self="emit('close')">
        <div class="search-modal" @keydown="handleKeydown">
          <div class="search-header">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
            <input
              ref="inputRef"
              v-model="query"
              class="search-input"
              :placeholder="i18n.t('search.placeholder')"
            />
            <kbd class="search-esc">ESC</kbd>
          </div>
          <div class="search-results">
            <div v-if="results.length === 0" class="search-empty">
              {{ i18n.t('search.empty') }}
            </div>
            <template v-else>
              <button
                v-for="(item, idx) in results"
                :key="idx"
                class="search-item"
                :class="{ selected: idx === selectedIdx }"
                @click="selectItem(item)"
                @mouseenter="selectedIdx = idx"
              >
                <div class="search-item-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
                    <path :d="item.icon" />
                  </svg>
                </div>
                <div class="search-item-text">
                  <div class="search-item-title">{{ item.title }}</div>
                  <div class="search-item-desc">{{ item.desc }}</div>
                </div>
                <span class="search-item-type">{{ typeLabel(item.type) }}</span>
              </button>
            </template>
          </div>
          <div class="search-footer">
            <span><kbd>↑↓</kbd> {{ i18n.t('search.navigate') }}</span>
            <span><kbd>↵</kbd> {{ i18n.t('search.open') }}</span>
            <span><kbd>esc</kbd> {{ i18n.t('search.close') }}</span>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(4px);
  z-index: 10000;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 12vh;
}
.search-modal {
  width: 560px;
  max-height: 70vh;
  background: var(--bg-glass-heavy);
  backdrop-filter: blur(24px);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.search-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border);
}
.search-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 15px;
  color: var(--text-primary);
  font-family: var(--font-body);
  outline: none;
}
.search-input::placeholder {
  color: var(--text-muted);
}
.search-esc {
  font-size: 10px;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-muted);
  font-family: var(--font-mono);
  border: 1px solid var(--border);
}
.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
  max-height: 400px;
}
.search-empty {
  padding: 40px 20px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.12s;
  border: none;
  background: transparent;
  text-align: left;
  color: var(--text-secondary);
}
.search-item.selected {
  background: rgba(99, 179, 237, 0.1);
  color: var(--text-primary);
}
.search-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99, 179, 237, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--accent-blue);
}
.search-item-text {
  flex: 1;
  min-width: 0;
}
.search-item-title {
  font-size: 13px;
  font-weight: 500;
  color: inherit;
}
.search-item-desc {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-item-type {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid var(--border);
  flex-shrink: 0;
}
.search-footer {
  display: flex;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-muted);
}
.search-footer kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  padding: 1px 4px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  margin-right: 3px;
}

.search-modal-enter-active { transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1); }
.search-modal-leave-active { transition: all 0.15s ease; }
.search-modal-enter-from, .search-modal-leave-to {
  opacity: 0;
}
.search-modal-enter-from .search-modal {
  transform: scale(0.96) translateY(-10px);
}
</style>
