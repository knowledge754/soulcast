import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomePage.vue'),
      meta: { title: '首页' }
    },
    {
      path: '/album',
      name: 'album',
      component: () => import('../views/AlbumPage.vue'),
      meta: { title: '相册' }
    },
    {
      path: '/starsealed',
      name: 'starsealed',
      component: () => import('../views/StarSealedPage.vue'),
      meta: { title: '星封' }
    },
    {
      path: '/moments',
      name: 'moments',
      component: () => import('../views/MomentsPage.vue'),
      meta: { title: '朋友圈' }
    },
    {
      path: '/knowledge',
      name: 'knowledge',
      component: () => import('../views/KnowledgePage.vue'),
      meta: { title: '知识库' }
    },
    {
      path: '/archive',
      name: 'archive',
      component: () => import('../views/ArchivePage.vue'),
      meta: { title: '归档' }
    },
    {
      path: '/friends',
      name: 'friends',
      component: () => import('../views/FriendsPage.vue'),
      meta: { title: '友链' }
    },
    {
      path: '/chat',
      name: 'chat',
      component: () => import('../views/ChatPage.vue'),
      meta: { title: '私信' }
    },
    {
      path: '/settings',
      name: 'settings',
      component: () => import('../views/SettingsPage.vue'),
      meta: { title: '设置' }
    }
  ]
})

export default router
