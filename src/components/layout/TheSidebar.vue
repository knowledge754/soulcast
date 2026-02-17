<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import Icon from '../icons/Icon.vue'
import { useProfileStore } from '../../stores/profile'
import { useAppStore } from '../../stores/app'

const route = useRoute()
const router = useRouter()
const profile = useProfileStore()
const app = useAppStore()

interface NavItem {
  name: string
  label: string
  icon: string
  badge?: number
}

const navSections = computed(() => [
  {
    label: '探索',
    items: [
      { name: 'home', label: '首页', icon: 'home' },
      { name: 'album', label: '相册', icon: 'album' },
      { name: 'timeline', label: '时光', icon: 'timeline' },
      { name: 'moments', label: '朋友圈', icon: 'moments', badge: 3 },
    ] as NavItem[]
  },
  {
    label: '知识',
    items: [
      { name: 'knowledge', label: '知识库', icon: 'knowledge' },
      { name: 'archive', label: '归档', icon: 'archive' },
    ] as NavItem[]
  },
  {
    label: '社交',
    items: [
      { name: 'friends', label: '友链', icon: 'friends' },
      { name: 'chat', label: '私信', icon: 'chat', badge: 2 },
    ] as NavItem[]
  }
])

const collapsed = computed(() => app.sidebarCollapsed)

function navigateTo(name: string) {
  router.push({ name })
}

function isActive(name: string) {
  return route.name === name
}
</script>

<template>
  <!-- 折叠时的浮动展开按钮 -->
  <Transition name="fab">
    <button
      v-if="collapsed"
      class="sidebar-fab"
      @click="app.toggleSidebar()"
      title="展开侧边栏"
    >
      <Icon name="hexagon" :size="16" color="var(--accent-cyan)" />
    </button>
  </Transition>

  <aside class="sidebar" :class="{ collapsed }">
    <!-- Brand + Toggle -->
    <div class="brand-bar">
      <div class="brand">
        <div class="brand-logo">
          <Icon name="hexagon" :size="18" color="white" />
        </div>
        <div class="brand-text">
          <div class="brand-name">ChainLog</div>
          <div class="brand-sub">WEB3 · BLOG · SOUL</div>
        </div>
      </div>
      <button class="collapse-btn" @click="app.toggleSidebar()" title="折叠侧边栏">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>
    </div>

    <!-- 个人资料卡 -->
    <div class="profile-card">
      <div class="profile-row">
        <div class="profile-avatar">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" class="avatar-img" />
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/>
          </svg>
          <span class="avatar-dot"></span>
        </div>
        <div class="profile-info">
          <div class="profile-name">{{ profile.nickname }}</div>
          <div class="profile-addr">0x7a3F...8cB2</div>
        </div>
      </div>
      <div v-if="profile.quote" class="profile-quote">"{{ profile.quote }}"</div>
      <div v-if="profile.tags.length" class="profile-tags">
        <span v-for="t in profile.tags" :key="t.id" class="profile-tag">{{ t.label }}</span>
      </div>
      <div class="profile-stats">
        <div class="pstat"><span class="pstat-n">42</span> 文章</div>
        <div class="pstat-sep"></div>
        <div class="pstat"><span class="pstat-n">18</span> NFT</div>
        <div class="pstat-sep"></div>
        <div class="pstat"><span class="pstat-n">1.2K</span> 读者</div>
      </div>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <div
        v-for="section in navSections"
        :key="section.label"
        class="nav-section"
      >
        <div class="nav-section-label">{{ section.label }}</div>
        <div
          v-for="item in section.items"
          :key="item.name"
          class="nav-item"
          :class="{ active: isActive(item.name) }"
          @click="navigateTo(item.name)"
        >
          <Icon :name="item.icon" :size="16" class="nav-icon" />
          <span class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge" class="nav-badge">{{ item.badge }}</span>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button class="publish-btn" @click="router.push({ name: 'home' })">
        <Icon name="edit" :size="14" />
        发布新文章
      </button>
    </div>
  </aside>
</template>

<style scoped>
/* ── 浮动展开按钮（侧边栏隐藏时显示） ── */
.sidebar-fab {
  position: fixed;
  top: 20px;
  left: 16px;
  z-index: calc(var(--z-sidebar) + 1);
  width: 40px;
  height: 40px;
  border-radius: 12px;
  background: var(--bg-card);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}
.sidebar-fab:hover {
  border-color: var(--accent-blue);
  box-shadow: 0 4px 20px rgba(99, 179, 237, 0.3);
  transform: scale(1.05);
}

/* fab transition */
.fab-enter-active { transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1); }
.fab-leave-active { transition: all 0.15s ease; }
.fab-enter-from, .fab-leave-to { opacity: 0; transform: scale(0.8); }

/* ── Sidebar ── */
.sidebar {
  width: var(--sidebar-width);
  flex-shrink: 0;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px 14px;
  border-right: 1px solid var(--border);
  background: var(--bg-glass-heavy);
  backdrop-filter: blur(20px);
  z-index: var(--z-sidebar);
  overflow-y: auto;
  overflow-x: hidden;
  transform: translateX(0);
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.collapsed {
  transform: translateX(-100%);
}

/* ── Brand Bar ── */
.brand-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  min-height: 36px;
}
.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.brand-logo {
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: 0 0 20px rgba(99, 179, 237, 0.3);
}
.brand-text {
  overflow: hidden;
  white-space: nowrap;
}
.brand-name {
  font-size: 17px;
  font-weight: 700;
  letter-spacing: -0.5px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
.brand-sub {
  font-size: 9px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  letter-spacing: 1px;
  margin-top: 1px;
}
.collapse-btn {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  background: transparent;
  border: none;
}
.collapse-btn:hover {
  background: rgba(99, 179, 237, 0.1);
  color: var(--accent-blue);
}

/* ═══ 个人资料卡 ═══ */
.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  transition: padding 0.3s;
}
.profile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}

.profile-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
  box-shadow: 0 0 12px rgba(99, 179, 237, 0.2);
  overflow: hidden;
}
.avatar-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 50%;
}
.avatar-dot {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--accent-green);
  border: 2px solid var(--bg-card);
  box-shadow: 0 0 6px var(--accent-green);
}

.profile-info {
  min-width: 0;
  overflow: hidden;
}
.profile-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.profile-addr {
  font-family: var(--font-mono);
  font-size: 10px;
  color: var(--accent-blue);
  opacity: 0.8;
}

.profile-quote {
  font-size: 11px;
  color: var(--text-muted);
  line-height: 1.5;
  font-style: italic;
  font-family: var(--font-display);
  margin-bottom: 8px;
}

.profile-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
  margin-bottom: 10px;
}
.profile-tag {
  font-size: 9px;
  padding: 2px 6px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  color: var(--text-muted);
  font-family: var(--font-mono);
}

.profile-stats {
  border-top: 1px solid var(--border);
  padding-top: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0;
}
.pstat {
  flex: 1;
  text-align: center;
  font-size: 10px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  white-space: nowrap;
}
.pstat-n {
  font-weight: 700;
  font-size: 13px;
  color: var(--text-primary);
  margin-right: 2px;
}
.pstat-sep {
  width: 1px;
  height: 16px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Nav ── */
.nav {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}
.nav-section {
  margin-bottom: 20px;
}
.nav-section-label {
  font-size: 10px;
  letter-spacing: 2px;
  color: var(--text-muted);
  font-family: var(--font-mono);
  padding: 0 8px;
  margin-bottom: 6px;
  text-transform: uppercase;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 9px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
  color: var(--text-secondary);
  position: relative;
  margin-bottom: 1px;
  white-space: nowrap;
  overflow: hidden;
}
.nav-item:hover {
  background: rgba(99, 179, 237, 0.07);
  color: var(--text-primary);
}
.nav-item.active {
  background: rgba(99, 179, 237, 0.12);
  color: var(--accent-blue);
}
.nav-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 60%;
  background: var(--accent-blue);
  border-radius: 0 3px 3px 0;
}
.nav-icon {
  width: 18px;
  flex-shrink: 0;
  text-align: center;
}
.nav-label {
  overflow: hidden;
  text-overflow: ellipsis;
}
.nav-badge {
  margin-left: auto;
  background: var(--accent-purple);
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}
/* ── Footer ── */
.sidebar-footer {
  border-top: 1px solid var(--border);
  padding-top: 14px;
  flex-shrink: 0;
}
.publish-btn {
  width: 100%;
  padding: 10px;
  background: linear-gradient(135deg, var(--accent-blue), var(--accent-purple));
  border: none;
  border-radius: var(--radius-sm);
  color: white;
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font-body);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all var(--transition-base);
  box-shadow: 0 4px 20px rgba(99, 179, 237, 0.25);
  white-space: nowrap;
  overflow: hidden;
}
.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 25px rgba(99, 179, 237, 0.4);
}
</style>
