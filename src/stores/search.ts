import { defineStore } from 'pinia'
import { ref } from 'vue'

export interface SearchItem {
  id: string
  type: 'page' | 'post' | 'moment' | 'knowledge'
  title: string
  excerpt?: string
  route: string
  icon: string
  tag?: string
}

const allItems: SearchItem[] = [
  { id: 'p-home', type: 'page', title: '首页', route: '/', icon: 'home' },
  { id: 'p-album', type: 'page', title: '相册', route: '/album', icon: 'album' },
  { id: 'p-starsealed', type: 'page', title: '星封', route: '/starsealed', icon: 'timeline' },
  { id: 'p-moments', type: 'page', title: '朋友圈', route: '/moments', icon: 'moments' },
  { id: 'p-knowledge', type: 'page', title: '知识库', route: '/knowledge', icon: 'knowledge' },
  { id: 'p-archive', type: 'page', title: '归档', route: '/archive', icon: 'archive' },
  { id: 'p-friends', type: 'page', title: '友链', route: '/friends', icon: 'friends' },
  { id: 'p-chat', type: 'page', title: '私信', route: '/chat', icon: 'chat' },
  { id: 'p-settings', type: 'page', title: '设置', route: '/settings', icon: 'settings' },
  {
    id: 'post-1', type: 'post', tag: 'DeFi',
    title: '漫游在 DeFi 的星河里：一个普通人的链上冒险',
    excerpt: '三年前我第一次连接 MetaMask，那种感觉就像是第一次打开夜空...',
    route: '/', icon: 'edit',
  },
  {
    id: 'post-2', type: 'post', tag: '技术',
    title: '用 Solidity 写一首诗：智能合约的文学性',
    excerpt: '代码和诗歌之间的距离，比大多数人想象的要近得多...',
    route: '/', icon: 'edit',
  },
  {
    id: 'post-3', type: 'post', tag: '生活',
    title: '成都雨天，喝茶，想起了去中心化的意义',
    excerpt: '窗外的雨把整条街道打成了水墨画...',
    route: '/', icon: 'edit',
  },
  {
    id: 'moment-1', type: 'moment',
    title: 'vitalik.eth: 今天在 Devcon 遇到了好多有趣的灵魂',
    route: '/moments', icon: 'moments',
  },
  {
    id: 'moment-2', type: 'moment',
    title: 'NightCoder: 凌晨 2 点，写完了第一个完整的 DApp',
    route: '/moments', icon: 'moments',
  },
  {
    id: 'kb-1', type: 'knowledge',
    title: 'Web3 入门指南',
    excerpt: '从零开始了解区块链、钱包和 DApp',
    route: '/knowledge', icon: 'knowledge',
  },
  {
    id: 'kb-2', type: 'knowledge',
    title: 'Solidity 智能合约开发',
    excerpt: '学习编写、部署和测试智能合约',
    route: '/knowledge', icon: 'knowledge',
  },
]

export const useSearchStore = defineStore('search', () => {
  const visible = ref(false)

  function open() { visible.value = true }
  function close() { visible.value = false }
  function toggle() { visible.value = !visible.value }

  function search(query: string): SearchItem[] {
    const q = query.trim().toLowerCase()
    if (!q) return allItems.slice(0, 8)
    return allItems.filter(item => {
      return item.title.toLowerCase().includes(q)
        || (item.excerpt && item.excerpt.toLowerCase().includes(q))
        || (item.tag && item.tag.toLowerCase().includes(q))
        || item.type.includes(q)
    })
  }

  return { visible, open, close, toggle, search }
})
