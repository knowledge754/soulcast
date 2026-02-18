<script setup lang="ts">
import Icon from '../components/icons/Icon.vue'

const knowledgeCards = [
  {
    id: 1,
    icon: 'hexagon',
    title: 'Web3 技术栈',
    desc: 'Solidity、EVM、IPFS、Layer2、跨链桥，构建去中心化世界的技术地图',
    notes: 24,
    updated: '2天前',
    tag: '技术',
    accentColor: 'var(--accent-blue)',
    accentBg: 'rgba(99,179,237,0.1)'
  },
  {
    id: 2,
    icon: 'knowledge',
    title: 'DeFi 协议研究',
    desc: 'Uniswap、Aave、Curve 等主流协议的深度分析与使用心得',
    notes: 18,
    updated: '5天前',
    tag: 'DeFi',
    accentColor: 'var(--accent-purple)',
    accentBg: 'rgba(183,148,244,0.1)'
  },
  {
    id: 3,
    icon: 'sparkles',
    title: '创作者经济',
    desc: 'NFT、Mirror、Lens Protocol，探索内容创作者在 Web3 的可能性',
    notes: 12,
    updated: '1周前',
    tag: '创作',
    accentColor: 'var(--accent-warm)',
    accentBg: 'rgba(251,176,64,0.1)'
  },
  {
    id: 4,
    icon: 'heart',
    title: '生活感悟',
    desc: '在 Web3 世界里找到的人生哲学，去中心化的生活方式',
    notes: 31,
    updated: '昨天',
    tag: '生活',
    accentColor: 'var(--accent-pink)',
    accentBg: 'rgba(246,135,179,0.1)'
  },
  {
    id: 5,
    icon: 'home',
    title: '读书笔记',
    desc: '《密码朋克》《主权个人》《互联网的未来》等关键书目的思考',
    notes: 9,
    updated: '2周前',
    tag: '阅读',
    accentColor: 'var(--accent-cyan)',
    accentBg: 'rgba(118,228,247,0.1)'
  },
  {
    id: 6,
    icon: 'timeline',
    title: '每日复盘',
    desc: '链上日记，每天一条，由钱包签名存证，永不篡改的人生记录',
    notes: 365,
    updated: '今天',
    tag: '日记',
    accentColor: 'var(--accent-green)',
    accentBg: 'rgba(104,211,145,0.1)'
  }
]
</script>

<template>
  <div class="knowledge-page">
    <div class="kb-grid">
      <div
        v-for="card in knowledgeCards"
        :key="card.id"
        class="kb-card"
        :style="{ '--accent-color': card.accentColor, '--accent-bg': card.accentBg }"
      >
        <div class="kb-icon" :style="{ background: card.accentBg }">
          <Icon :name="card.icon" :size="22" :color="card.accentColor" />
        </div>
        <div class="kb-title">{{ card.title }}</div>
        <div class="kb-desc">{{ card.desc }}</div>
        <div class="kb-meta">
          <span>{{ card.notes }} 篇笔记</span>
          <span>最近更新 {{ card.updated }}</span>
          <div class="kb-tag" :style="{ background: card.accentBg, color: card.accentColor }">
            {{ card.tag }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.knowledge-page {
  animation: fadeIn 0.35s ease;
}

.kb-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.kb-card {
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.kb-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: var(--accent-color);
  transform: scaleX(0);
  transition: transform 0.3s;
}
.kb-card:hover::after {
  transform: scaleX(1);
}
.kb-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-3px);
}

.kb-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 14px;
}
.kb-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 6px;
}
.kb-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.5;
  margin-bottom: 14px;
}
.kb-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
}
.kb-tag {
  display: inline-block;
  font-size: 10px;
  padding: 2px 7px;
  border-radius: 4px;
  margin-left: auto;
}

@media (max-width: 1100px) {
  .kb-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 768px) {
  .kb-grid { grid-template-columns: 1fr; }
}
</style>
