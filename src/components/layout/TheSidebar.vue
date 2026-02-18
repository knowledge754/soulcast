<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { computed } from 'vue'
import Icon from '../icons/Icon.vue'
import { useProfileStore } from '../../stores/profile'
import { useAppStore } from '../../stores/app'
import { useI18n } from '../../stores/i18n'

const route = useRoute()
const router = useRouter()
const profile = useProfileStore()
const app = useAppStore()
const i18n = useI18n()

interface NavItem {
  name: string
  label: string
  icon: string
  badge?: number
}

const navSections = computed(() => [
  {
    label: i18n.t('nav.explore'),
    items: [
      { name: 'home', label: i18n.t('nav.home'), icon: 'home' },
      { name: 'album', label: i18n.t('nav.album'), icon: 'album' },
      { name: 'starsealed', label: i18n.t('nav.starsealed'), icon: 'timeline' },
      { name: 'moments', label: i18n.t('nav.moments'), icon: 'moments', badge: 3 },
    ] as NavItem[]
  },
  {
    label: i18n.t('nav.knowledge'),
    items: [
      { name: 'knowledge', label: i18n.t('nav.knowledgeBase'), icon: 'knowledge' },
      { name: 'archive', label: i18n.t('nav.archive'), icon: 'archive' },
    ] as NavItem[]
  },
  {
    label: i18n.t('nav.social'),
    items: [
      { name: 'friends', label: i18n.t('nav.friends'), icon: 'friends' },
      { name: 'chat', label: i18n.t('nav.chat'), icon: 'chat', badge: 2 },
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
    <!-- ====== 展开态 ====== -->
    <template v-if="!collapsed">
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
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <path d="M15 10l-2 2 2 2" />
          </svg>
        </button>
      </div>

      <div class="profile-card">
        <div class="profile-status">
          <span class="status-dot"></span>
          {{ i18n.t('sidebar.connected') }} MetaMask
        </div>
        <div class="profile-addr">{{ app.walletAddress }}</div>
        <div class="profile-pass">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          </svg>
          ChainLog Pass ✓
        </div>
      </div>

      <nav class="nav">
        <div v-for="section in navSections" :key="section.label" class="nav-section">
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

      <div class="sidebar-footer">
        <button class="publish-btn" @click="router.push({ name: 'home' })">
          <Icon name="edit" :size="14" />
          {{ i18n.t('nav.publish') }}
        </button>
      </div>
    </template>

    <!-- ====== 折叠态 ====== -->
    <template v-else>
      <!-- Logo 点击展开 -->
      <div class="c-logo" @click="app.toggleSidebar()" title="展开侧边栏">
        <Icon name="hexagon" :size="20" color="var(--accent-cyan)" />
      </div>

      <div class="c-sep"></div>

      <!-- 导航图标 -->
      <nav class="c-nav">
        <template v-for="section in navSections" :key="section.label">
          <button
            v-for="item in section.items"
            :key="item.name"
            class="c-nav-btn"
            :class="{ active: isActive(item.name) }"
            :title="item.label"
            @click="navigateTo(item.name)"
          >
            <Icon :name="item.icon" :size="18" />
            <span v-if="item.badge" class="c-badge"></span>
          </button>
        </template>
      </nav>

      <div class="c-bottom">
        <button class="c-nav-btn" :title="i18n.t('nav.publish')" @click="router.push({ name: 'home' })">
          <Icon name="edit" :size="18" />
        </button>
      </div>
    </template>
  </aside>
</template>

<style scoped>
/* ═══════════════════════════════════
   Sidebar — 展开态
   ═══════════════════════════════════ */
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
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1),
              padding 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.sidebar.collapsed {
  width: var(--sidebar-collapsed-width);
  padding: 16px 0;
  align-items: center;
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
  opacity: 0.4;
}
.collapse-btn:hover {
  background: rgba(99, 179, 237, 0.1);
  color: var(--accent-blue);
  opacity: 1;
}

/* ═══ 个人资料卡 ═══ */
.profile-card {
  background: var(--bg-card);
  backdrop-filter: var(--blur-card);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 16px;
}
.profile-status {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 8px;
}
.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--accent-green);
  box-shadow: 0 0 6px var(--accent-green);
  flex-shrink: 0;
}
.profile-addr {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--accent-blue);
  margin-bottom: 10px;
  letter-spacing: 0.3px;
}
.profile-pass {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  color: var(--text-muted);
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

/* ── Nav (展开态) ── */
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
.nav-badge {
  margin-left: auto;
  background: var(--accent-purple);
  color: white;
  font-size: 10px;
  padding: 1px 6px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
}

/* ── Footer (展开态) ── */
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
}
.publish-btn:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 25px rgba(99, 179, 237, 0.4);
}

/* ═══════════════════════════════════
   Sidebar — 折叠态（精致图标栏）
   ═══════════════════════════════════ */

/* Logo */
.c-logo {
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: rgba(99, 179, 237, 0.06);
  border: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}
.c-logo:hover {
  background: rgba(99, 179, 237, 0.12);
  border-color: var(--border-hover);
  box-shadow: 0 0 16px rgba(99, 179, 237, 0.15);
}

.c-sep {
  width: 28px;
  height: 1px;
  background: var(--border);
  margin: 14px 0;
  flex-shrink: 0;
}

/* 折叠态导航 */
.c-nav {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  overflow-y: auto;
}
.c-nav-btn {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.2s;
  border: none;
  background: transparent;
  position: relative;
  flex-shrink: 0;
}
.c-nav-btn:hover {
  background: rgba(99, 179, 237, 0.08);
  color: var(--text-primary);
}
.c-nav-btn.active {
  background: rgba(99, 179, 237, 0.12);
  color: var(--accent-blue);
}
.c-nav-btn.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--accent-blue);
  border-radius: 0 3px 3px 0;
}
.c-badge {
  position: absolute;
  top: 7px;
  right: 7px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--accent-purple);
  box-shadow: 0 0 6px var(--accent-purple);
}

/* 折叠态底部 */
.c-bottom {
  border-top: 1px solid var(--border);
  padding-top: 12px;
  flex-shrink: 0;
}
</style>
