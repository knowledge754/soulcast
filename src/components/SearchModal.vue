<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import Icon from './icons/Icon.vue'
import { useSearchStore } from '../stores/search'
import { useI18n } from '../stores/i18n'

const router = useRouter()
const searchStore = useSearchStore()
const i18n = useI18n()
const query = ref('')
const activeIndex = ref(0)
const inputRef = ref<HTMLInputElement>()

const results = computed(() => searchStore.search(query.value))

watch(() => searchStore.visible, (v) => {
  if (v) {
    query.value = ''
    activeIndex.value = 0
    nextTick(() => inputRef.value?.focus())
  }
})

watch(query, () => { activeIndex.value = 0 })

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'ArrowDown') {
    e.preventDefault()
    activeIndex.value = Math.min(activeIndex.value + 1, results.value.length - 1)
  } else if (e.key === 'ArrowUp') {
    e.preventDefault()
    activeIndex.value = Math.max(activeIndex.value - 1, 0)
  } else if (e.key === 'Enter') {
    e.preventDefault()
    const item = results.value[activeIndex.value]
    if (item) selectItem(item)
  } else if (e.key === 'Escape') {
    searchStore.close()
  }
}

function selectItem(item: { route: string }) {
  router.push(item.route)
  searchStore.close()
}

function getTypeLabel(type: string) {
  const map: Record<string, string> = {
    page: i18n.t('search.page'),
    post: i18n.t('search.post'),
    moment: i18n.t('search.moment'),
    knowledge: i18n.t('search.knowledge'),
  }
  return map[type] || type
}

function highlightMatch(text: string) {
  const q = query.value.trim()
  if (!q) return text
  const idx = text.toLowerCase().indexOf(q.toLowerCase())
  if (idx === -1) return text
  return text.slice(0, idx) + '<mark>' + text.slice(idx, idx + q.length) + '</mark>' + text.slice(idx + q.length)
}

function onGlobalKey(e: KeyboardEvent) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
    e.preventDefault()
    searchStore.toggle()
  }
}

onMounted(() => document.addEventListener('keydown', onGlobalKey))
onUnmounted(() => document.removeEventListener('keydown', onGlobalKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="search-fade">
      <div v-if="searchStore.visible" class="search-overlay" @click.self="searchStore.close()">
        <div class="search-modal" @keydown="handleKeydown">
          <div class="search-header">
            <Icon name="search" :size="16" class="search-hdr-icon" />
            <input
              ref="inputRef"
              v-model="query"
              class="search-input"
              :placeholder="i18n.t('topbar.search')"
              autocomplete="off"
              spellcheck="false"
            />
            <kbd class="search-esc">ESC</kbd>
          </div>
          <div class="search-body">
            <div v-if="results.length === 0" class="search-empty">
              {{ i18n.t('search.empty') }}
            </div>
            <div
              v-for="(item, idx) in results"
              :key="item.id"
              class="search-item"
              :class="{ active: idx === activeIndex }"
              @mouseenter="activeIndex = idx"
              @click="selectItem(item)"
            >
              <div class="search-item-icon">
                <Icon :name="item.icon" :size="15" />
              </div>
              <div class="search-item-body">
                <div class="search-item-title" v-html="highlightMatch(item.title)"></div>
                <div v-if="item.excerpt" class="search-item-excerpt" v-html="highlightMatch(item.excerpt)"></div>
              </div>
              <span class="search-item-type">{{ getTypeLabel(item.type) }}</span>
            </div>
          </div>
          <div class="search-footer">
            <span class="sf-hint"><kbd>↑</kbd><kbd>↓</kbd> {{ i18n.t('search.navigate') }}</span>
            <span class="sf-hint"><kbd>↵</kbd> {{ i18n.t('search.open') }}</span>
            <span class="sf-hint"><kbd>esc</kbd> {{ i18n.t('search.close') }}</span>
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
  z-index: 10000;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(6px);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}
.search-modal {
  width: 560px;
  max-height: 480px;
  background: var(--bg-card-solid);
  border: 1px solid var(--border);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0,0,0,0.5);
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
.search-hdr-icon {
  color: var(--text-muted);
  flex-shrink: 0;
}
.search-input {
  flex: 1;
  font-size: 15px;
  color: var(--text-primary);
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-body);
}
.search-input::placeholder {
  color: var(--text-muted);
}
.search-esc {
  font-size: 10px;
  font-family: var(--font-mono);
  color: var(--text-muted);
  background: rgba(255,255,255,0.06);
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid var(--border);
}
.search-body {
  flex: 1;
  overflow-y: auto;
  padding: 6px;
}
.search-empty {
  padding: 32px;
  text-align: center;
  color: var(--text-muted);
  font-size: 13px;
}
.search-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.12s;
}
.search-item.active {
  background: rgba(99,179,237,0.1);
}
.search-item-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background: rgba(99,179,237,0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--accent-blue);
  flex-shrink: 0;
}
.search-item-body {
  flex: 1;
  min-width: 0;
}
.search-item-title {
  font-size: 13px;
  color: var(--text-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.search-item-title :deep(mark) {
  background: rgba(99,179,237,0.25);
  color: var(--accent-cyan);
  border-radius: 2px;
  padding: 0 1px;
}
.search-item-excerpt {
  font-size: 11px;
  color: var(--text-muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-top: 2px;
}
.search-item-excerpt :deep(mark) {
  background: rgba(99,179,237,0.2);
  color: var(--accent-blue);
  border-radius: 2px;
}
.search-item-type {
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 2px 7px;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
.search-footer {
  display: flex;
  gap: 16px;
  padding: 10px 18px;
  border-top: 1px solid var(--border);
}
.sf-hint {
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 4px;
}
.sf-hint kbd {
  font-family: var(--font-mono);
  font-size: 10px;
  background: rgba(255,255,255,0.06);
  padding: 1px 5px;
  border-radius: 3px;
  border: 1px solid var(--border);
}
.search-fade-enter-active { transition: all 0.2s ease; }
.search-fade-leave-active { transition: all 0.15s ease; }
.search-fade-enter-from, .search-fade-leave-to {
  opacity: 0;
}
.search-fade-enter-from .search-modal {
  transform: scale(0.96) translateY(-8px);
}
</style>
