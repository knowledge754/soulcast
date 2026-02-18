import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ProfileTag {
  id: string
  label: string
}

export const useProfileStore = defineStore('profile', () => {
  const nickname = ref('链上漫游者')
  const avatarUrl = ref('')
  const bio = ref('Web3 创作者，在代码与文字之间寻找去中心化的意义。')
  const quote = ref('代码是诗，区块链是永恒的纸。')
  const tags = ref<ProfileTag[]>([
    { id: '1', label: 'Web3' },
    { id: '2', label: '创作者' },
    { id: '3', label: 'DeFi' },
  ])
  const heroVideoUrl = ref('')
  const socialLinks = ref({
    twitter: '',
    github: '',
    telegram: '',
    wechat: '',
    qq: '',
    email: '',
    mirror: '',
    ens: '',
  })

  // 从 localStorage 恢复
  function loadFromStorage() {
    try {
      const saved = localStorage.getItem('chainlog_profile')
      if (saved) {
        const data = JSON.parse(saved)
        if (data.nickname) nickname.value = data.nickname
        if (data.avatarUrl) avatarUrl.value = data.avatarUrl
        if (data.bio) bio.value = data.bio
        if (data.quote) quote.value = data.quote
        if (data.tags) tags.value = data.tags
        if (data.heroVideoUrl) heroVideoUrl.value = data.heroVideoUrl
        if (data.socialLinks) socialLinks.value = { ...socialLinks.value, ...data.socialLinks }
      }
    } catch { /* ignore */ }
  }

  function saveToStorage() {
    localStorage.setItem('chainlog_profile', JSON.stringify({
      nickname: nickname.value,
      avatarUrl: avatarUrl.value,
      bio: bio.value,
      quote: quote.value,
      heroVideoUrl: heroVideoUrl.value,
      tags: tags.value,
      socialLinks: socialLinks.value,
    }))
  }

  // 自动持久化
  watch([nickname, avatarUrl, bio, quote, heroVideoUrl, tags, socialLinks], saveToStorage, { deep: true })

  function addTag(label: string) {
    if (tags.value.length >= 6) return
    if (tags.value.some(t => t.label === label)) return
    tags.value.push({ id: Date.now().toString(), label })
  }

  function removeTag(id: string) {
    tags.value = tags.value.filter(t => t.id !== id)
  }

  function setAvatar(url: string) {
    avatarUrl.value = url
  }

  // 初始化
  loadFromStorage()

  return {
    nickname,
    avatarUrl,
    bio,
    quote,
    heroVideoUrl,
    tags,
    socialLinks,
    addTag,
    removeTag,
    setAvatar,
    saveToStorage,
  }
})
