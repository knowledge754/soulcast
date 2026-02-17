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
  <aside class="sidebar" :class="{ collapsed }">
    <!-- Brand + Toggle -->
    <div class="brand-bar">
      <div class="brand" @click="collapsed && app.toggleSidebar()">
        <div class="brand-logo">
          <Icon name="hexagon" :size="18" color="white" />
        </div>
        <Transition name="fade-text">
          <div v-if="!collapsed" class="brand-text">
            <div class="brand-name">ChainLog</div>
            <div class="brand-sub">WEB3 · BLOG · SOUL</div>
          </div>
        </Transition>
      </div>
      <button class="collapse-btn" @click="app.toggleSidebar()" :title="collapsed ? '展开侧边栏' : '折叠侧边栏'">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
          <template v-if="!collapsed">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M15 10l-2 2 2 2" />
          </template>
          <template v-else>
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M14 10l2 2-2 2" />
          </template>
        </svg>
      </button>
    </div>

    <!-- 个人资料卡 -->
    <div class="profile-card" @click="collapsed && app.toggleSidebar()">
      <div class="profile-row">
        <div class="profile-avatar">
          <img v-if="profile.avatarUrl" :src="profile.avatarUrl" alt="" class="avatar-img" />
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 20a6 6 0 0 0-12 0"/><circle cx="12" cy="10" r="4"/>
          </svg>
          <span class="avatar-dot"></span>
        </div>
        <div v-if="!collapsed" class="profile-info">
          <div class="profile-name">{{ profile.nickname }}</div>
          <div class="profile-addr">0x7a3F...8cB2</div>
        </div>
      </div>
      <template v-if="!collapsed">
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
      </template>
    </div>

    <!-- Navigation -->
    <nav class="nav">
      <div
        v-for="section in navSections"
        :key="section.label"
        class="nav-section"
      >
        <div v-if="!collapsed" class="nav-section-label">{{ section.label }}</div>
        <div v-else class="nav-section-divider"></div>
        <div
          v-for="item in section.items"
          :key="item.name"
          class="nav-item"
          :class="{ active: isActive(item.name) }"
          :title="collapsed ? item.label : ''"
          @click="navigateTo(item.name)"
        >
          <Icon :name="item.icon" :size="16" class="nav-icon" />
          <span v-if="!collapsed" class="nav-label">{{ item.label }}</span>
          <span v-if="item.badge && !collapsed" class="nav-badge">{{ item.badge }}</span>
          <span v-if="item.badge && collapsed" class="nav-badge-dot"></span>
        </div>
      </div>
    </nav>

    <!-- Footer -->
    <div class="sidebar-footer">
      <button class="publish-btn" @click="router.push({ name: 'home' })" :title="collapsed ? '发布新文章' : ''">
        <Icon name="edit" :size="14" />
        <span v-if="!collapsed">发布新文章</span>
      </button>
    </div>
  </aside>
</template>

<style scoped>
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
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  padding: 20px 10px;
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
  cursor: default;
}
.collapsed .brand {
  cursor: pointer;
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
  width: 26px;
  height: 26px;
  border-radius: 7px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
  background: transparent;
  border: none;
  opacity: 0.5;
}
.collapse-btn:hover {
  background: rgba(99, 179, 237, 0.1);
  color: var(--accent-blue);
  opacity: 1;
}
.collapsed .collapse-btn {
  margin: 0 auto;
  opacity: 0.6;
}
.collapsed .collapse-btn:hover {
  opacity: 1;
}

/* ── Fade transition for text ── */
.fade-text-enter-active { transition: opacity 0.2s 0.1s; }
.fade-text-leave-active { transition: opacity 0.15s; }
.fade-text-enter-from, .fade-text-leave-to { opacity: 0; }

/* ═══ 个人资料卡 ═══ */
.profile-card {
  background: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
  transition: padding 0.3s;
}
.collapsed .profile-card {
  padding: 10px 6px;
  cursor: pointer;
}

.profile-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.collapsed .profile-row {
  justify-content: center;
  margin-bottom: 0;
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
.collapsed .profile-avatar {
  width: 34px;
  height: 34px;
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
.nav-section-divider {
  height: 1px;
  background: var(--border);
  margin: 4px 6px 8px;
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
.collapsed .nav-item {
  justify-content: center;
  padding: 10px;
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
.nav-badge-dot {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-purple);
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
