import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  const walletConnected = ref(false)
  const walletAddress = ref('')
  const walletFullAddress = ref('')
  const walletProvider = ref('')
  const ensName = ref('')
  const balance = ref('')
  const sidebarCollapsed = ref(false)
  const layoutMode = ref<'center' | 'full'>('center')
  const showWalletModal = ref(false)

  const stats = ref({
    posts: 42,
    nfts: 18,
    readers: '1.2K',
    earnings: '0.8 ETH'
  })

  function setWalletState(connected: boolean, addr: string, short: string, provider: string, bal: string) {
    walletConnected.value = connected
    walletFullAddress.value = addr
    walletAddress.value = short
    walletProvider.value = provider
    balance.value = bal
  }

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
    walletProvider,
    ensName,
    balance,
    sidebarCollapsed,
    layoutMode,
    showWalletModal,
    stats,
    setWalletState,
    toggleWallet,
    toggleSidebar,
    toggleLayout
  }
})
