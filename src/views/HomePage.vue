<script setup lang="ts">
import { useRouter } from 'vue-router'
import { computed } from 'vue'
import Icon from '../components/icons/Icon.vue'
import { useAppStore } from '../stores/app'
import { useI18n } from '../stores/i18n'

const router = useRouter()
const app = useAppStore()
const i18n = useI18n()

const heroTitle = computed(() => i18n.t('home.title'))
const heroSub = computed(() => i18n.t('home.sub'))

const posts = [
  {
    id: 1,
    tag: 'DeFi',
    tagColor: 'blue',
    title: '漫游在 DeFi 的星河里：一个普通人的链上冒险',
    excerpt: '三年前我第一次连接 MetaMask，那种感觉就像是第一次打开夜空，你意识到原来每一颗星星都是一个机会...',
    likes: 128,
    comments: 34,
    shares: 12,
    addr: '0x7a3F',
    hasNft: true
  },
  {
    id: 2,
    tag: '技术',
    tagColor: 'purple',
    title: '用 Solidity 写一首诗：智能合约的文学性',
    excerpt: '我一直觉得代码和诗歌之间的距离，比大多数人想象的要近得多。约束是两者共同的母亲...',
    likes: 96,
    comments: 21,
    shares: 8,
    addr: '0x7a3F',
    hasNft: true
  },
  {
    id: 3,
    tag: '生活',
    tagColor: 'warm',
    title: '成都雨天，喝茶，想起了去中心化的意义',
    excerpt: '窗外的雨把整条街道打成了水墨画。我在想，如果记忆也可以上链，我最想存储哪一刻...',
    likes: 211,
    comments: 58,
    shares: 23,
    addr: '0x7a3F',
    hasNft: false
  }
]

const moments = [
  {
    id: 1,
    avatar: 'linear-gradient(135deg, #f6ad55, #ed64a6)',
    name: 'vitalik.eth',
    addr: '0x3F2A...4B1E',
    text: '今天在 Devcon 遇到了好多有趣的灵魂，区块链不只是技术，它是一种看世界的方式 🌏',
    likes: 512,
    comments: 89
  },
  {
    id: 2,
    avatar: 'linear-gradient(135deg, #68d391, #4fd1c5)',
    name: 'NightCoder',
    addr: '0xBc1D...7f3A',
    text: '凌晨 2 点，写完了第一个完整的 DApp，把世界交给你们了，晚安 🌙',
    likes: 234,
    comments: 41
  },
  {
    id: 3,
    avatar: 'linear-gradient(135deg, #76e4f7, #b794f4)',
    name: 'SoulWriter',
    addr: '0xD42F...3a9C',
    text: '在日落前发布了我的第 10 篇文章，感谢每一个读过我字的灵魂 ✨',
    likes: 176,
    comments: 28
  }
]
</script>

<template>
  <div class="home-page">
    <!-- Hero Section -->
    <div class="hero">
      <div class="hero-glow-1"></div>
      <div class="hero-glow-2"></div>
      <div class="hero-content">
        <div class="hero-chain-badge">
          <Icon name="hexagon" :size="12" />
          {{ i18n.t('home.badge') }}
        </div>
        <h1 class="hero-title" v-html="heroTitle.replace(/\n/g, '<br>')"></h1>
        <p class="hero-sub" v-html="heroSub.replace(/\n/g, '<br>')"></p>
        <div class="hero-stats">
          <div class="stat-item">
            <div class="stat-num">{{ app.stats.posts }}</div>
            <div class="stat-label">{{ i18n.t('home.stat.posts') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ app.stats.nfts }}</div>
            <div class="stat-label">{{ i18n.t('home.stat.nfts') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ app.stats.readers }}</div>
            <div class="stat-label">{{ i18n.t('home.stat.readers') }}</div>
          </div>
          <div class="stat-item">
            <div class="stat-num">{{ app.stats.earnings }}</div>
            <div class="stat-label">{{ i18n.t('home.stat.earnings') }}</div>
          </div>
        </div>
      </div>
      <div class="hero-nft">
        <div class="nft-icon">
          <Icon name="hexagon" :size="52" color="var(--accent-cyan)" :stroke-width="1" />
        </div>
        <div class="nft-label">SOUL · NFT</div>
        <div class="nft-id">#0042</div>
      </div>
    </div>

    <!-- NFT Mint Strip -->
    <div class="nft-mint-strip">
      <div class="nft-strip-icon">
        <Icon name="sparkles" :size="24" color="var(--accent-cyan)" />
      </div>
      <div class="nft-strip-text">
        <div class="nft-strip-title">{{ i18n.t('home.nft.title') }}</div>
        <div class="nft-strip-sub">「漫游在 DeFi 的星河里」· 已获得 128 次收藏 · 铸造后版权永久归你</div>
      </div>
      <button class="nft-strip-btn">
        <Icon name="hexagon" :size="14" />
        {{ i18n.t('home.nft.btn') }}
      </button>
    </div>

    <!-- Recent Posts -->
    <div class="section-header">
      <div class="section-title">
        <span class="section-dot"></span>
        {{ i18n.t('home.posts') }}
      </div>
      <div class="view-all" @click="router.push({ name: 'archive' })">
        {{ i18n.t('home.viewAll') }}
        <Icon name="arrowRight" :size="12" />
      </div>
    </div>
    <div class="post-grid">
      <div
        v-for="post in posts"
        :key="post.id"
        class="post-card"
      >
        <div v-if="post.hasNft" class="post-nft-badge">
          <Icon name="hexagon" :size="11" color="white" />
        </div>
        <span class="post-tag" :class="post.tagColor">{{ post.tag }}</span>
        <h3 class="post-title">{{ post.title }}</h3>
        <p class="post-excerpt">{{ post.excerpt }}</p>
        <div class="post-footer">
          <div class="post-footer-stat">
            <Icon name="heart" :size="12" /> {{ post.likes }}
          </div>
          <div class="post-footer-stat">
            <Icon name="comment" :size="12" /> {{ post.comments }}
          </div>
          <div class="post-footer-stat">
            <Icon name="share" :size="12" /> {{ post.shares }}
          </div>
          <div class="post-footer-addr">{{ post.addr }}</div>
        </div>
      </div>
    </div>

    <!-- Moments Preview -->
    <div class="section-header">
      <div class="section-title">
        <span class="section-dot pink"></span>
        {{ i18n.t('home.moments') }}
      </div>
      <div class="view-all" @click="router.push({ name: 'moments' })">
        {{ i18n.t('home.enterMoments') }}
        <Icon name="arrowRight" :size="12" />
      </div>
    </div>
    <div class="moments-strip">
      <div
        v-for="m in moments"
        :key="m.id"
        class="moment-card"
      >
        <div class="moment-head">
          <div class="moment-avatar" :style="{ background: m.avatar }">
            <Icon name="wallet" :size="14" color="white" />
          </div>
          <div>
            <div class="moment-name">{{ m.name }}</div>
            <div class="moment-addr">{{ m.addr }}</div>
          </div>
        </div>
        <div class="moment-text">{{ m.text }}</div>
        <div class="moment-meta">
          <span><Icon name="heart" :size="11" /> {{ m.likes }}</span>
          <span><Icon name="comment" :size="11" /> {{ m.comments }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-page {
  animation: fadeIn 0.35s ease;
}

/* ── Hero ── */
.hero {
  position: relative;
  border-radius: var(--radius-lg);
  background: var(--bg-card);
  border: 1px solid var(--border);
  padding: 40px;
  margin-bottom: 28px;
  overflow: hidden;
  display: flex;
  align-items: center;
  gap: 24px;
}
.hero-glow-1 {
  position: absolute;
  top: -60%;
  right: -10%;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, rgba(99, 179, 237, 0.08) 0%, transparent 60%);
  pointer-events: none;
}
.hero-glow-2 {
  position: absolute;
  bottom: -40%;
  left: 30%;
  width: 250px;
  height: 250px;
  background: radial-gradient(circle, rgba(183, 148, 244, 0.07) 0%, transparent 60%);
  pointer-events: none;
}
.hero-content {
  position: relative;
  z-index: 1;
  flex: 1;
  min-width: 0;
}
.hero-chain-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: rgba(99, 179, 237, 0.1);
  border: 1px solid rgba(99, 179, 237, 0.2);
  border-radius: var(--radius-full);
  padding: 4px 12px;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--accent-cyan);
  margin-bottom: 16px;
}
.hero-title {
  font-family: var(--font-display);
  font-size: 32px;
  font-weight: 700;
  line-height: 1.3;
  letter-spacing: -1px;
  margin-bottom: 12px;
  background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent-cyan) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.hero-sub {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  margin-bottom: 22px;
}
.hero-stats {
  display: flex;
  gap: 28px;
  flex-wrap: wrap;
}
.stat-item {
  text-align: left;
}
.stat-num {
  font-size: 20px;
  font-weight: 700;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.stat-label {
  font-size: 11px;
  color: var(--text-muted);
  margin-top: 2px;
}

.hero-nft {
  flex-shrink: 0;
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.12), rgba(183, 148, 244, 0.12));
  border: 1px solid rgba(99, 179, 237, 0.2);
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  position: relative;
  z-index: 1;
}
.nft-icon {
  line-height: 1;
}
.nft-label {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-blue);
  letter-spacing: 1px;
}
.nft-id {
  font-size: 11px;
  color: var(--text-muted);
}

/* ── NFT Mint Strip ── */
.nft-mint-strip {
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.08), rgba(183, 148, 244, 0.08));
  border: 1px solid rgba(99, 179, 237, 0.15);
  border-radius: var(--radius);
  padding: 12px 18px;
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}
.nft-strip-icon {
  font-size: 24px;
}
.nft-strip-text {
  flex: 1;
}
.nft-strip-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--accent-cyan);
  margin-bottom: 3px;
}
.nft-strip-sub {
  font-size: 12px;
  color: var(--text-muted);
}
.nft-strip-btn {
  padding: 7px 16px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-body);
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 6px;
}
.nft-strip-btn:hover {
  opacity: 0.85;
}

/* ── Section Header ── */
.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
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
  background: var(--accent-blue);
}
.section-dot.pink {
  background: var(--accent-pink);
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

/* ── Post Grid ── */
.post-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  margin-bottom: 28px;
}
.post-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s;
  position: relative;
  overflow: hidden;
}
.post-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(99, 179, 237, 0.03), transparent);
  opacity: 0;
  transition: opacity 0.3s;
}
.post-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-3px);
  box-shadow: var(--glow-blue);
}
.post-card:hover::before {
  opacity: 1;
}
.post-nft-badge {
  position: absolute;
  top: 14px;
  right: 14px;
  width: 22px;
  height: 22px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.post-tag {
  display: inline-block;
  font-size: 10px;
  padding: 3px 8px;
  border-radius: var(--radius-full);
  font-family: var(--font-mono);
  margin-bottom: 10px;
  letter-spacing: 0.5px;
  position: relative;
}
.post-tag.blue {
  background: rgba(99, 179, 237, 0.12);
  color: var(--accent-blue);
}
.post-tag.purple {
  background: rgba(183, 148, 244, 0.12);
  color: var(--accent-purple);
}
.post-tag.warm {
  background: rgba(251, 176, 64, 0.12);
  color: var(--accent-warm);
}
.post-tag.pink {
  background: rgba(246, 135, 179, 0.12);
  color: var(--accent-pink);
}
.post-title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.5;
  margin-bottom: 10px;
  font-family: var(--font-display);
  position: relative;
}
.post-excerpt {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.6;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 16px;
  position: relative;
}
.post-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 11px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  border-top: 1px solid var(--border);
  padding-top: 12px;
  position: relative;
}
.post-footer-stat {
  display: flex;
  align-items: center;
  gap: 4px;
}
.post-footer-addr {
  margin-left: auto;
  font-size: 10px;
  color: var(--accent-blue);
  opacity: 0.7;
}

/* ── Moments Strip ── */
.moments-strip {
  display: flex;
  gap: 12px;
  margin-bottom: 28px;
  overflow: hidden;
}
.moment-card {
  flex: 1;
  min-width: 0;
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 18px;
  cursor: pointer;
  transition: all var(--transition-base);
}
.moment-card:hover {
  border-color: var(--border-hover);
  transform: translateY(-2px);
}
.moment-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}
.moment-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.moment-name {
  font-size: 13px;
  font-weight: 500;
}
.moment-addr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-blue);
}
.moment-text {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}
.moment-meta {
  margin-top: 8px;
  font-size: 11px;
  color: var(--text-muted);
  display: flex;
  gap: 10px;
}
.moment-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 1200px) {
  .post-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 960px) {
  .hero-nft {
    display: none;
  }
  .hero {
    padding: 32px;
  }
  .hero-title {
    font-size: 28px;
  }
}

@media (max-width: 768px) {
  .post-grid {
    grid-template-columns: 1fr;
  }
  .moments-strip {
    flex-direction: column;
  }
  .hero {
    padding: 24px;
  }
  .hero-title {
    font-size: 24px;
  }
  .hero-stats {
    gap: 16px;
  }
  .nft-mint-strip {
    flex-wrap: wrap;
  }
}
</style>
