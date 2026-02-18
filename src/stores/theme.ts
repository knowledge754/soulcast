import { defineStore } from 'pinia'
import { ref, watch } from 'vue'

export interface ThemePreset {
  id: string
  name: Record<string, string>
  colors: [string, string, string]
  vars: Record<string, string>
}

export const themes: ThemePreset[] = [
  {
    id: 'deep-space',
    name: {
      'zh-CN': '深空', 'zh-TW': '深空', 'en-US': 'Deep Space',
      'ja-JP': 'ディープスペース', 'ko-KR': '딥 스페이스',
      'fr-FR': 'Espace', 'de-DE': 'Weltraum', 'es-ES': 'Espacio', 'ru-RU': 'Космос',
    },
    colors: ['#63b3ed', '#76e4f7', '#b794f4'],
    vars: {
      '--bg-void': '#040810',
      '--bg-deep': '#070d1a',
      '--bg-card': 'rgba(12, 21, 37, 0.55)',
      '--bg-card-solid': '#0c1525',
      '--bg-glass': 'rgba(12, 21, 37, 0.45)',
      '--bg-glass-heavy': 'rgba(4, 8, 16, 0.75)',
      '--border': 'rgba(99, 179, 237, 0.12)',
      '--border-hover': 'rgba(99, 179, 237, 0.3)',
      '--border-active': 'rgba(99, 179, 237, 0.5)',
      '--accent-blue': '#63b3ed',
      '--accent-cyan': '#76e4f7',
      '--accent-purple': '#b794f4',
      '--accent-warm': '#fbb040',
      '--accent-pink': '#f687b3',
      '--accent-green': '#68d391',
      '--text-primary': '#e2e8f0',
      '--text-secondary': '#94a3b8',
      '--text-muted': '#475569',
      '--glow-blue': '0 0 30px rgba(99, 179, 237, 0.2)',
      '--glow-purple': '0 0 30px rgba(183, 148, 244, 0.2)',
    },
  },
  {
    id: 'cyberpunk',
    name: {
      'zh-CN': '赛博朋克', 'zh-TW': '賽博龐克', 'en-US': 'Cyberpunk',
      'ja-JP': 'サイバーパンク', 'ko-KR': '사이버펑크',
      'fr-FR': 'Cyberpunk', 'de-DE': 'Cyberpunk', 'es-ES': 'Cyberpunk', 'ru-RU': 'Киберпанк',
    },
    colors: ['#00ff88', '#ff0066', '#00ccff'],
    vars: {
      '--bg-void': '#08080f',
      '--bg-deep': '#0c0c18',
      '--bg-card': 'rgba(12, 12, 28, 0.6)',
      '--bg-card-solid': '#0c0c1c',
      '--bg-glass': 'rgba(12, 12, 28, 0.45)',
      '--bg-glass-heavy': 'rgba(6, 6, 14, 0.8)',
      '--border': 'rgba(0, 255, 136, 0.12)',
      '--border-hover': 'rgba(0, 255, 136, 0.3)',
      '--border-active': 'rgba(0, 255, 136, 0.5)',
      '--accent-blue': '#00ccff',
      '--accent-cyan': '#00ff88',
      '--accent-purple': '#ff0066',
      '--accent-warm': '#ffcc00',
      '--accent-pink': '#ff0066',
      '--accent-green': '#00ff88',
      '--text-primary': '#e0ffe0',
      '--text-secondary': '#88aa99',
      '--text-muted': '#445566',
      '--glow-blue': '0 0 30px rgba(0, 204, 255, 0.25)',
      '--glow-purple': '0 0 30px rgba(255, 0, 102, 0.25)',
    },
  },
  {
    id: 'nebula',
    name: {
      'zh-CN': '星云紫', 'zh-TW': '星雲紫', 'en-US': 'Nebula',
      'ja-JP': 'ネビュラ', 'ko-KR': '성운',
      'fr-FR': 'Nébuleuse', 'de-DE': 'Nebel', 'es-ES': 'Nebulosa', 'ru-RU': 'Туманность',
    },
    colors: ['#b794f4', '#e879f9', '#818cf8'],
    vars: {
      '--bg-void': '#0a0614',
      '--bg-deep': '#0e0a1e',
      '--bg-card': 'rgba(18, 12, 35, 0.55)',
      '--bg-card-solid': '#120c23',
      '--bg-glass': 'rgba(18, 12, 35, 0.45)',
      '--bg-glass-heavy': 'rgba(8, 4, 18, 0.8)',
      '--border': 'rgba(183, 148, 244, 0.12)',
      '--border-hover': 'rgba(183, 148, 244, 0.3)',
      '--border-active': 'rgba(183, 148, 244, 0.5)',
      '--accent-blue': '#818cf8',
      '--accent-cyan': '#c084fc',
      '--accent-purple': '#e879f9',
      '--accent-warm': '#f0abfc',
      '--accent-pink': '#f687b3',
      '--accent-green': '#a78bfa',
      '--text-primary': '#ede9fe',
      '--text-secondary': '#a78bfa',
      '--text-muted': '#5b4f8a',
      '--glow-blue': '0 0 30px rgba(129, 140, 248, 0.2)',
      '--glow-purple': '0 0 30px rgba(232, 121, 249, 0.25)',
    },
  },
  {
    id: 'aurora',
    name: {
      'zh-CN': '极光', 'zh-TW': '極光', 'en-US': 'Aurora',
      'ja-JP': 'オーロラ', 'ko-KR': '오로라',
      'fr-FR': 'Aurore', 'de-DE': 'Aurora', 'es-ES': 'Aurora', 'ru-RU': 'Сияние',
    },
    colors: ['#68d391', '#4fd1c5', '#63b3ed'],
    vars: {
      '--bg-void': '#030f0a',
      '--bg-deep': '#061a12',
      '--bg-card': 'rgba(8, 28, 20, 0.55)',
      '--bg-card-solid': '#081c14',
      '--bg-glass': 'rgba(8, 28, 20, 0.45)',
      '--bg-glass-heavy': 'rgba(3, 14, 10, 0.8)',
      '--border': 'rgba(104, 211, 145, 0.12)',
      '--border-hover': 'rgba(104, 211, 145, 0.3)',
      '--border-active': 'rgba(104, 211, 145, 0.5)',
      '--accent-blue': '#4fd1c5',
      '--accent-cyan': '#68d391',
      '--accent-purple': '#63b3ed',
      '--accent-warm': '#9ae6b4',
      '--accent-pink': '#76e4f7',
      '--accent-green': '#68d391',
      '--text-primary': '#e6fffa',
      '--text-secondary': '#81e6d9',
      '--text-muted': '#38665a',
      '--glow-blue': '0 0 30px rgba(79, 209, 197, 0.2)',
      '--glow-purple': '0 0 30px rgba(104, 211, 145, 0.2)',
    },
  },
  {
    id: 'amber',
    name: {
      'zh-CN': '琥珀', 'zh-TW': '琥珀', 'en-US': 'Amber',
      'ja-JP': 'アンバー', 'ko-KR': '앰버',
      'fr-FR': 'Ambre', 'de-DE': 'Bernstein', 'es-ES': 'Ámbar', 'ru-RU': 'Янтарь',
    },
    colors: ['#fbb040', '#f6ad55', '#ed8936'],
    vars: {
      '--bg-void': '#0c0804',
      '--bg-deep': '#140e06',
      '--bg-card': 'rgba(28, 20, 10, 0.55)',
      '--bg-card-solid': '#1c140a',
      '--bg-glass': 'rgba(28, 20, 10, 0.45)',
      '--bg-glass-heavy': 'rgba(14, 10, 4, 0.8)',
      '--border': 'rgba(251, 176, 64, 0.12)',
      '--border-hover': 'rgba(251, 176, 64, 0.3)',
      '--border-active': 'rgba(251, 176, 64, 0.5)',
      '--accent-blue': '#fbb040',
      '--accent-cyan': '#f6ad55',
      '--accent-purple': '#ed8936',
      '--accent-warm': '#fbb040',
      '--accent-pink': '#fc8181',
      '--accent-green': '#f6e05e',
      '--text-primary': '#fefcbf',
      '--text-secondary': '#d69e2e',
      '--text-muted': '#6b5520',
      '--glow-blue': '0 0 30px rgba(251, 176, 64, 0.2)',
      '--glow-purple': '0 0 30px rgba(237, 137, 54, 0.2)',
    },
  },
  {
    id: 'crimson',
    name: {
      'zh-CN': '暗夜红', 'zh-TW': '暗夜紅', 'en-US': 'Crimson',
      'ja-JP': 'クリムゾン', 'ko-KR': '크림슨',
      'fr-FR': 'Cramoisi', 'de-DE': 'Karmesin', 'es-ES': 'Carmesí', 'ru-RU': 'Багровый',
    },
    colors: ['#fc8181', '#f687b3', '#c53030'],
    vars: {
      '--bg-void': '#0c0406',
      '--bg-deep': '#140810',
      '--bg-card': 'rgba(28, 12, 16, 0.55)',
      '--bg-card-solid': '#1c0c10',
      '--bg-glass': 'rgba(28, 12, 16, 0.45)',
      '--bg-glass-heavy': 'rgba(14, 6, 8, 0.8)',
      '--border': 'rgba(252, 129, 129, 0.12)',
      '--border-hover': 'rgba(252, 129, 129, 0.3)',
      '--border-active': 'rgba(252, 129, 129, 0.5)',
      '--accent-blue': '#fc8181',
      '--accent-cyan': '#feb2b2',
      '--accent-purple': '#f687b3',
      '--accent-warm': '#fbb040',
      '--accent-pink': '#fc8181',
      '--accent-green': '#f6ad55',
      '--text-primary': '#fff5f5',
      '--text-secondary': '#fc8181',
      '--text-muted': '#6b3030',
      '--glow-blue': '0 0 30px rgba(252, 129, 129, 0.2)',
      '--glow-purple': '0 0 30px rgba(246, 135, 179, 0.2)',
    },
  },
]

export const useThemeStore = defineStore('theme', () => {
  const saved = localStorage.getItem('chainlog_theme') || 'cyberpunk'
  const currentId = ref(saved)

  function applyTheme(id: string) {
    const preset = themes.find(t => t.id === id)
    if (!preset) return
    const root = document.documentElement
    for (const [key, val] of Object.entries(preset.vars)) {
      root.style.setProperty(key, val)
    }
  }

  function setTheme(id: string) {
    currentId.value = id
    localStorage.setItem('chainlog_theme', id)
    applyTheme(id)
  }

  function init() {
    applyTheme(currentId.value)
  }

  return { currentId, setTheme, init, themes }
})
