<script setup lang="ts">
const archiveData = [
  {
    year: '2025',
    items: [
      { date: '02·14', title: '情人节的链上情书', tag: '生活', hash: '0xf3a2...' },
      { date: '01·20', title: '2025：在链上重新开始', tag: '随笔', hash: '0xa4b1...' },
      { date: '01·01', title: '新年愿望清单（上链版）', tag: '生活', hash: '0xc8d3...' },
    ]
  },
  {
    year: '2024',
    items: [
      { date: '12·25', title: '写给 Web3 世界的圣诞贺词', tag: '随笔', hash: '0x1e5f...' },
      { date: '11·20', title: '漫游在 DeFi 的星河里', tag: 'DeFi', hash: '0x7b2a...' },
      { date: '10·08', title: '用 Solidity 写一首诗', tag: '技术', hash: '0x9c4d...' },
      { date: '09·15', title: '以太坊合并一周年回顾', tag: '技术', hash: '0x2f8e...' },
      { date: '08·05', title: '第一笔 NFT 版税收入', tag: '里程碑', hash: '0x5a1c...' },
      { date: '06·21', title: '成都雨天想起了去中心化', tag: '生活', hash: '0x6b3d...' },
      { date: '03·01', title: '用 Web3 钱包登录博客', tag: '里程碑', hash: '0x8d2f...' },
    ]
  }
]
</script>

<template>
  <div class="archive-page">
    <div
      v-for="block in archiveData"
      :key="block.year"
      class="archive-year-block"
    >
      <div class="archive-year-title">{{ block.year }}</div>
      <ul class="archive-list">
        <li
          v-for="(item, idx) in block.items"
          :key="idx"
          class="archive-item"
        >
          <span class="archive-date">{{ item.date }}</span>
          <span class="archive-item-title">{{ item.title }}</span>
          <span class="archive-item-tag">{{ item.tag }}</span>
          <span class="archive-item-hash">{{ item.hash }}</span>
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.archive-page {
  animation: fadeIn 0.35s ease;
}

.archive-year-block {
  margin-bottom: 36px;
}
.archive-year-title {
  font-family: var(--font-mono);
  font-size: 28px;
  font-weight: 700;
  color: transparent;
  -webkit-text-stroke: 1px rgba(99, 179, 237, 0.3);
  margin-bottom: 20px;
  letter-spacing: -1px;
}

.archive-list {
  list-style: none;
}
.archive-item {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  cursor: pointer;
  transition: all 0.2s;
}
.archive-item:hover {
  padding-left: 8px;
}
.archive-item:hover .archive-item-title {
  color: var(--accent-blue);
}

.archive-date {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--text-muted);
  flex-shrink: 0;
  width: 60px;
}
.archive-item-title {
  font-size: 14px;
  color: var(--text-secondary);
  transition: color 0.2s;
  font-family: var(--font-display);
}
.archive-item-tag {
  margin-left: auto;
  font-size: 10px;
  padding: 2px 8px;
  border-radius: 4px;
  background: rgba(99, 179, 237, 0.1);
  color: var(--accent-blue);
  font-family: var(--font-mono);
  flex-shrink: 0;
}
.archive-item-hash {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-green);
  flex-shrink: 0;
}
</style>
