<script setup lang="ts">
import { ref } from 'vue'
import Icon from '../components/icons/Icon.vue'

const activeFilter = ref('全部')
const filters = ['全部', '旅行', '代码', '生活', '艺术', '✦ NFT 已铸造']

const photos = [
  { id: 1, emoji: '🌃', height: 200, title: '深夜的成都', date: '2024.11.20', meta: 'IPFS 已存储', hasNft: true, gradient: 'rgba(99,179,237,0.1), rgba(183,148,244,0.1)' },
  { id: 2, emoji: '🌸', height: 140, title: '春日碎语', date: '2024.03.14', meta: '区块链存证', hasNft: false, gradient: 'rgba(246,135,179,0.1), rgba(251,176,64,0.1)' },
  { id: 3, emoji: '🌊', height: 260, title: '链上的波浪', date: '2024.08.05', meta: '已售出 0.1 ETH', hasNft: true, gradient: 'rgba(104,211,145,0.1), rgba(118,228,247,0.1)' },
  { id: 4, emoji: '🌅', height: 180, title: '日出之前', date: '2024.06.21', meta: 'IPFS 已存储', hasNft: false, gradient: 'rgba(251,176,64,0.1), rgba(246,135,179,0.1)' },
  { id: 5, emoji: '🏙', height: 160, title: '霓虹城市', date: '2024.12.01', meta: '链上记录', hasNft: false, gradient: 'rgba(183,148,244,0.1), rgba(99,179,237,0.1)' },
  { id: 6, emoji: '🌌', height: 220, title: '星空永恒', date: '2024.09.18', meta: '限量版 NFT', hasNft: true, gradient: 'rgba(118,228,247,0.1), rgba(104,211,145,0.1)' },
]

function setFilter(f: string) {
  activeFilter.value = f
}
</script>

<template>
  <div class="album-page">
    <!-- Filters -->
    <div class="album-filters">
      <button
        v-for="f in filters"
        :key="f"
        class="filter-pill"
        :class="{ active: activeFilter === f }"
        @click="setFilter(f)"
      >
        {{ f }}
      </button>
    </div>

    <!-- Masonry -->
    <div class="photo-masonry">
      <div
        v-for="photo in photos"
        :key="photo.id"
        class="photo-item"
      >
        <div
          class="photo-img-box"
          :style="{ height: photo.height + 'px', background: `linear-gradient(135deg, ${photo.gradient})` }"
        >
          <span class="photo-emoji">{{ photo.emoji }}</span>
        </div>
        <div v-if="photo.hasNft" class="photo-nft-overlay">
          <Icon name="hexagon" :size="10" /> NFT
        </div>
        <div class="photo-overlay">
          <div class="photo-overlay-title">{{ photo.title }}</div>
          <div class="photo-overlay-meta">{{ photo.date }} · {{ photo.meta }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-page {
  animation: fadeIn 0.35s ease;
}

.album-filters {
  display: flex;
  gap: 8px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}
.filter-pill {
  padding: 6px 14px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
}
.filter-pill:hover,
.filter-pill.active {
  background: rgba(99, 179, 237, 0.1);
  border-color: rgba(99, 179, 237, 0.3);
  color: var(--accent-blue);
}

.photo-masonry {
  columns: 3;
  column-gap: 14px;
}

.photo-item {
  break-inside: avoid;
  margin-bottom: 14px;
  border-radius: var(--radius);
  overflow: hidden;
  position: relative;
  cursor: pointer;
  border: 1px solid var(--border);
  transition: all 0.3s;
}
.photo-item:hover {
  border-color: var(--border-hover);
  transform: scale(1.01);
}

.photo-img-box {
  width: 100%;
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  display: flex;
  align-items: center;
  justify-content: center;
}
.photo-emoji {
  font-size: 64px;
}

.photo-nft-overlay {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(99, 179, 237, 0.9);
  border-radius: 6px;
  padding: 3px 8px;
  font-size: 10px;
  font-family: var(--font-mono);
  color: white;
  display: flex;
  align-items: center;
  gap: 4px;
}

.photo-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(4, 8, 16, 0.9), transparent);
  padding: 20px 14px 14px;
  opacity: 0;
  transition: opacity 0.3s;
}
.photo-item:hover .photo-overlay {
  opacity: 1;
}
.photo-overlay-title {
  font-size: 13px;
  font-weight: 500;
}
.photo-overlay-meta {
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  margin-top: 4px;
}

@media (max-width: 1100px) {
  .photo-masonry { columns: 2; }
}
@media (max-width: 768px) {
  .photo-masonry { columns: 1; }
}
</style>
