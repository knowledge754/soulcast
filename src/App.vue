<script setup lang="ts">
import TheSidebar from './components/layout/TheSidebar.vue'
import TheTopbar from './components/layout/TheTopbar.vue'
import StarBackground from './components/layout/StarBackground.vue'
import { useAppStore } from './stores/app'

const app = useAppStore()
</script>

<template>
  <StarBackground />
  <div id="app-shell">
    <TheSidebar />
    <main class="main-area" :class="{ collapsed: app.sidebarCollapsed }">
      <div class="main-inner" :class="{ 'layout-full': app.layoutMode === 'full' }">
        <TheTopbar />
        <router-view v-slot="{ Component }">
          <transition name="page" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </div>
    </main>
  </div>
</template>

<style scoped>
#app-shell {
  position: relative;
  z-index: 1;
  min-height: 100vh;
}

.main-area {
  margin-left: var(--sidebar-width);
  min-height: 100vh;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}
.main-area.collapsed {
  margin-left: var(--sidebar-collapsed-width);
}

.main-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 48px 60px 72px;
  transition: max-width 0.3s ease, padding 0.3s ease;
}
.main-inner.layout-full {
  max-width: none;
  padding: 0 32px 60px;
}

.page-enter-active {
  animation: fadeIn 0.35s ease;
}
.page-leave-active {
  animation: fadeIn 0.2s ease reverse;
}

@media (max-width: 768px) {
  .main-area {
    margin-left: 0 !important;
  }
  .main-inner {
    padding: 0 16px 40px;
  }
}
</style>
