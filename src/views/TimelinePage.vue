<script setup lang="ts">
import Icon from '../components/icons/Icon.vue'

const timelineGroups = [
  {
    year: '2025',
    items: [
      {
        date: '02 · 14',
        title: '情人节的链上情书',
        body: '第一次把一封情书铸造成 NFT，发给了在东京的她。区块链的浪漫，就是让「我爱你」永远无法删除。',
        mood: '💖 浪漫',
        block: 'Block #21345678'
      },
      {
        date: '01 · 01',
        title: '新年的第一个链上愿望',
        body: '把今年的目标用签名记录下来，刻在链上。明年的我，一定会回来查验。',
        mood: '🎯 目标',
        block: 'Block #20987654'
      }
    ]
  },
  {
    year: '2024',
    items: [
      {
        date: '11 · 20',
        title: '发布了第 42 篇文章，感谢宇宙',
        body: '写作改变了我看世界的方式。每一个字都是我思维宇宙里的一颗星星，而你们是让它们发光的理由。',
        mood: '✨ 感恩',
        block: 'Block #21012345'
      },
      {
        date: '08 · 15',
        title: '第一笔 NFT 版税收入：0.08 ETH',
        body: '当我看到 0.08 ETH 落入钱包，眼泪差点出来。不是因为金额，而是因为——有人愿意用真实的价值，来告诉我，你的创作值得。',
        mood: '💎 里程碑',
        block: 'Block #20456789'
      },
      {
        date: '03 · 01',
        title: '用 Web3 钱包登录了自己的博客',
        body: '这一刻意义非凡。不再需要密码，不再需要邮箱，只需要一个签名——我就是我。',
        mood: '🔑 里程碑',
        block: 'Block #19234567'
      }
    ]
  }
]
</script>

<template>
  <div class="timeline-page">
    <div class="timeline">
      <div
        v-for="group in timelineGroups"
        :key="group.year"
        class="timeline-group"
      >
        <div class="timeline-year">{{ group.year }}</div>

        <div
          v-for="(item, idx) in group.items"
          :key="idx"
          class="timeline-item"
        >
          <div class="timeline-date">{{ item.date }}</div>
          <h3 class="timeline-title">{{ item.title }}</h3>
          <p class="timeline-body">{{ item.body }}</p>
          <div class="timeline-footer">
            <div class="timeline-mood">{{ item.mood }}</div>
            <div class="timeline-chain-proof">
              <Icon name="check" :size="12" color="var(--accent-green)" />
              已上链 · {{ item.block }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.timeline-page {
  animation: fadeIn 0.35s ease;
}

.timeline {
  position: relative;
  padding-left: 36px;
}
.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 1px;
  background: linear-gradient(to bottom, var(--accent-blue), var(--accent-purple), transparent);
}

.timeline-group {
  margin-bottom: 36px;
}
.timeline-year {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent-blue);
  letter-spacing: 2px;
  margin-bottom: 16px;
  position: relative;
}
.timeline-year::before {
  content: '';
  position: absolute;
  left: -32px;
  top: 50%;
  transform: translateY(-50%);
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-blue);
  box-shadow: 0 0 12px var(--accent-blue);
}

.timeline-item {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all var(--transition-base);
  position: relative;
}
.timeline-item::before {
  content: '';
  position: absolute;
  left: -28px;
  top: 24px;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--bg-card);
  border: 2px solid var(--border);
}
.timeline-item:hover {
  border-color: var(--border-hover);
  transform: translateX(4px);
}

.timeline-date {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.timeline-title {
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 8px;
  font-family: var(--font-display);
}
.timeline-body {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
}
.timeline-footer {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 10px;
}
.timeline-mood {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.04);
  padding: 3px 10px;
  border-radius: var(--radius-full);
}
.timeline-chain-proof {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-green);
}
</style>
