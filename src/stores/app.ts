import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const walletConnected = ref(true)
  const walletAddress = ref('0x7a3F...8cB2')
  const walletFullAddress = ref('0x7a3Fc5B90d269A823ed1E40fCe9E8cB2')
  const ensName = ref('')
  const balance = ref('2.48 ETH')
  const sidebarCollapsed = ref(false)
  const layoutMode = ref<'center' | 'full'>('center')

  const stats = ref({
    posts: 42,
    nfts: 18,
    readers: '1.2K',
    earnings: '0.8 ETH'
  })

  function toggleWallet() {
    walletConnected.value = !walletConnected.value
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function toggleLayout() {
    layoutMode.value = layoutMode.value === 'center' ? 'full' : 'center'
  }

  return {
    walletConnected,
    walletAddress,
    walletFullAddress,
    ensName,
    balance,
    sidebarCollapsed,
    layoutMode,
    stats,
    toggleWallet,
    toggleSidebar,
    toggleLayout
  }
})
