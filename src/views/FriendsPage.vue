<script setup lang="ts">
import Icon from '../components/icons/Icon.vue'

const friends = [
  {
    id: 1,
    name: 'Vitalik',
    addr: '0x3F2A...4B1E',
    bio: '以太坊联合创始人，热爱写作与思考，区块链世界的诗人',
    ens: 'vitalik.eth',
    online: true,
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)'
  },
  {
    id: 2,
    name: 'NightCoder',
    addr: '0xBc1D...7f3A',
    bio: '全栈开发者，DeFi 协议贡献者，用代码构建未来',
    ens: 'nightcoder.eth',
    online: false,
    avatar: 'linear-gradient(135deg, #68d391, #4fd1c5)'
  },
  {
    id: 3,
    name: 'SoulWriter',
    addr: '0xD42F...3a9C',
    bio: '链上内容创作者，NFT 艺术家，探索 Web3 叙事的可能',
    ens: 'soulwriter.eth',
    online: true,
    avatar: 'linear-gradient(135deg, #76e4f7, #b794f4)'
  },
  {
    id: 4,
    name: 'CryptoMuse',
    addr: '0x9A8E...2c7F',
    bio: '音乐人，把音乐版权上链，用 Web3 重塑音乐经济',
    ens: 'cryptomuse.eth',
    online: false,
    avatar: 'linear-gradient(135deg, #fbb040, #f6ad55)'
  }
]
</script>

<template>
  <div class="friends-page">
    <!-- Header -->
    <div class="section-header">
      <div class="section-title">
        <span class="section-dot cyan"></span>
        Web3 友人
      </div>
      <div class="view-all">
        <Icon name="plus" :size="12" /> 申请添加友链
      </div>
    </div>

    <!-- Friends Grid -->
    <div class="friends-grid">
      <div
        v-for="friend in friends"
        :key="friend.id"
        class="friend-card"
      >
        <div class="friend-avatar" :style="{ background: friend.avatar }">
          <Icon name="wallet" :size="20" color="white" />
          <div v-if="friend.online" class="friend-online"></div>
        </div>
        <div class="friend-name">{{ friend.name }}</div>
        <div class="friend-addr">{{ friend.addr }}</div>
        <div class="friend-bio">{{ friend.bio }}</div>
        <div class="friend-ens">
          <Icon name="sparkles" :size="10" /> {{ friend.ens }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.friends-page {
  animation: fadeIn 0.35s ease;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.section-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 8px;
}
.section-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}
.section-dot.cyan {
  background: var(--accent-cyan);
}
.view-all {
  font-size: 12px;
  color: var(--accent-blue);
  cursor: pointer;
  font-family: var(--font-mono);
  letter-spacing: 0.5px;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  gap: 4px;
}
.view-all:hover {
  opacity: 0.7;
}

.friends-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.friend-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 24px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}
.friend-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-4px);
  box-shadow: var(--glow-blue);
}

.friend-avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  margin: 0 auto 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid rgba(99, 179, 237, 0.2);
  position: relative;
}
.friend-online {
  position: absolute;
  bottom: 2px;
  right: 2px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2px solid var(--bg-card);
  box-shadow: 0 0 6px var(--accent-green);
}

.friend-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
}
.friend-addr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-blue);
  margin-bottom: 8px;
}
.friend-bio {
  font-size: 12px;
  color: var(--text-muted);
  line-height: 1.5;
  margin-bottom: 12px;
}
.friend-ens {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(99, 179, 237, 0.1);
  border: 1px solid rgba(99, 179, 237, 0.2);
  border-radius: var(--radius-full);
  padding: 3px 10px;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-cyan);
}

@media (max-width: 1100px) {
  .friends-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .friends-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>
