<script setup lang="ts">
import Icon from '../components/icons/Icon.vue'

const feedItems = [
  {
    id: 1,
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)',
    name: 'vitalik.eth',
    addr: '0x3F2A...4B1E',
    time: '3小时前',
    content: '今天在 Devcon 遇到了好多有趣的灵魂，区块链不只是技术，它是一种看世界的方式。每一次握手，都是两个链上地址的碰撞 🌏',
    images: [
      { bg: 'rgba(99,179,237,0.1), rgba(183,148,244,0.1)', emoji: '🎤' },
      { bg: 'rgba(183,148,244,0.1), rgba(246,135,179,0.1)', emoji: '👥' },
      { bg: 'rgba(251,176,64,0.1), rgba(104,211,145,0.1)', emoji: '🌃' }
    ],
    likes: 512,
    comments: 89,
    block: '#21445521'
  },
  {
    id: 2,
    avatar: 'linear-gradient(135deg, #68d391, #4fd1c5)',
    name: 'NightCoder',
    addr: '0xBc1D...7f3A',
    time: '昨天',
    content: '凌晨 2 点，写完了第一个完整的 DApp，把世界交给你们了。代码上链那一刻，比任何奖励都让我感动。晚安 🌙',
    images: [],
    likes: 234,
    comments: 41,
    block: '#21412200'
  },
  {
    id: 3,
    avatar: 'linear-gradient(135deg, #76e4f7, #b794f4)',
    name: 'SoulWriter',
    addr: '0xD42F...3a9C',
    time: '2天前',
    content: '在日落前发布了我的第 10 篇文章，感谢每一个读过我字的灵魂。写作让我觉得——链上的我，比现实的我更真实 ✨',
    images: [],
    likes: 176,
    comments: 28,
    block: '#21345678'
  }
]
</script>

<template>
  <div class="moments-page">
    <!-- Compose Box -->
    <div class="compose-box">
      <div class="compose-head">
        <div class="compose-avatar">
          <Icon name="wallet" :size="16" color="white" />
        </div>
        <textarea
          class="compose-area"
          placeholder="分享你的这一刻... 将由你的钱包签名并永久上链"
        ></textarea>
      </div>
      <div class="compose-actions">
        <button class="compose-tool">
          <Icon name="image" :size="13" /> 图片
        </button>
        <button class="compose-tool">
          <Icon name="mapPin" :size="13" /> 位置
        </button>
        <button class="compose-tool">
          <Icon name="music" :size="13" /> 音乐
        </button>
        <button class="compose-tool">
          <Icon name="hexagon" :size="13" /> 铸造 NFT
        </button>
        <div class="compose-chain-note">
          <Icon name="hexagon" :size="10" />
          将由 0x7a3F...8cB2 签名
        </div>
        <button class="compose-submit">发布</button>
      </div>
    </div>

    <!-- Feed Items -->
    <div
      v-for="item in feedItems"
      :key="item.id"
      class="moment-feed-item"
    >
      <div class="mf-head">
        <div class="mf-avatar" :style="{ background: item.avatar }">
          <Icon name="wallet" :size="16" color="white" />
        </div>
        <div>
          <div class="mf-name">{{ item.name }}</div>
          <div class="mf-addr">{{ item.addr }}</div>
        </div>
        <div class="mf-time">{{ item.time }}</div>
      </div>

      <div class="mf-content">{{ item.content }}</div>

      <div v-if="item.images.length" class="mf-images">
        <div
          v-for="(img, idx) in item.images"
          :key="idx"
          class="mf-img"
          :style="{ background: `linear-gradient(135deg, ${img.bg})` }"
        >
          {{ img.emoji }}
        </div>
      </div>

      <div class="mf-footer">
        <div class="mf-action">
          <Icon name="heart" :size="14" /> {{ item.likes }}
        </div>
        <div class="mf-action">
          <Icon name="comment" :size="14" /> {{ item.comments }}
        </div>
        <div class="mf-action">
          <Icon name="share" :size="14" /> 转发
        </div>
        <div class="mf-chain-proof">
          <Icon name="check" :size="11" color="var(--accent-green)" />
          Block {{ item.block }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.moments-page {
  animation: fadeIn 0.35s ease;
}

/* ── Compose Box ── */
.compose-box {
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 24px;
  transition: border-color 0.2s;
}
.compose-box:focus-within {
  border-color: var(--border-hover);
}
.compose-head {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  margin-bottom: 12px;
}
.compose-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.compose-area {
  flex: 1;
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 12px;
  font-size: 14px;
  color: var(--text-primary);
  font-family: var(--font-body);
  resize: none;
  height: 80px;
  outline: none;
  transition: border-color 0.2s;
}
.compose-area:focus {
  border-color: var(--border-hover);
}
.compose-area::placeholder {
  color: var(--text-muted);
}

.compose-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
  flex-wrap: wrap;
}
.compose-tool {
  padding: 6px 10px;
  background: transparent;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text-secondary);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 5px;
}
.compose-tool:hover {
  border-color: var(--border-hover);
  color: var(--text-primary);
}
.compose-chain-note {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--text-muted);
  display: flex;
  align-items: center;
  gap: 5px;
  margin-left: auto;
}
.compose-submit {
  padding: 7px 20px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
}
.compose-submit:hover {
  opacity: 0.85;
  transform: translateY(-1px);
}

/* ── Feed Items ── */
.moment-feed-item {
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 14px;
  transition: all 0.2s;
}
.moment-feed-item:hover {
  border-color: var(--border-hover);
}

.mf-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}
.mf-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.mf-name {
  font-size: 14px;
  font-weight: 600;
}
.mf-addr {
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent-blue);
  margin-top: 2px;
}
.mf-time {
  margin-left: auto;
  font-size: 11px;
  color: var(--text-muted);
}
.mf-content {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 12px;
}
.mf-images {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 6px;
  margin-bottom: 12px;
}
.mf-img {
  aspect-ratio: 1;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  border: 1px solid var(--border);
}
.mf-footer {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}
.mf-action {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  color: var(--text-muted);
  cursor: pointer;
  transition: color 0.2s;
}
.mf-action:hover {
  color: var(--accent-blue);
}
.mf-chain-proof {
  margin-left: auto;
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-green);
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
