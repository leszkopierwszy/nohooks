import { defineStore } from 'pinia'

const STORAGE_KEY = 'nohooks.display.zoom'
const THEME_STORAGE_KEY = 'nohooks.display.theme'

export const THEME_OPTIONS = [
  { value: 'light', labelKey: 'display.theme.light' },
  { value: 'dark', labelKey: 'display.theme.dark' },
  { value: 'system', labelKey: 'display.theme.system' },
]

/** Zastosuj motyw przed mountem Vue (bez FOUC). */
export function initThemeEarly() {
  if (typeof document === 'undefined') return
  let theme = 'system'
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY)
    if (THEME_OPTIONS.some((o) => o.value === raw)) theme = raw
  } catch {
    // ignore
  }
  applyThemeToDocument(theme)
}

function resolveTheme(theme) {
  if (theme === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  }
  return theme
}

function applyThemeToDocument(theme) {
  const resolved = resolveTheme(theme)
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.dataset.theme = theme
  root.dataset.themeResolved = resolved
  root.style.colorScheme = resolved
}

let systemThemeListenerAttached = false

function ensureSystemThemeListener(onChange) {
  if (systemThemeListenerAttached || typeof window === 'undefined') return
  systemThemeListenerAttached = true
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', onChange)
}

/** Przy ustawieniu UI „100%” treść ma skalę ~80% względem poprzedniego domyślnego rozmiaru. */
export const CONTENT_ZOOM_BASE = 0.8

export const ZOOM_OPTIONS = [
  { value: 100, label: '100%' },
  { value: 80, label: '80%' },
  { value: 75, label: '75%' },
]

export function contentZoomFactor(zoomPercent) {
  return (zoomPercent / 100) * CONTENT_ZOOM_BASE
}

export const useDisplayStore = defineStore('display', {
  state: () => ({
    zoomPercent: 100,
    theme: 'system',
    settingsOpen: false,
  }),

  getters: {
    zoomLabel: (state) => `${state.zoomPercent}%`,
    contentZoom: (state) => contentZoomFactor(state.zoomPercent),
  },

  actions: {
    init() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        let parsed = raw != null ? Number(raw) : 100
        // Wcześniejsze „80%” na całym dokumencie ≈ nowe „100%” tylko w kolumnie treści.
        if (parsed === 80) parsed = 100
        if (ZOOM_OPTIONS.some((o) => o.value === parsed)) {
          this.zoomPercent = parsed
        }
      } catch {
        this.zoomPercent = 100
      }
      this.initTheme()
      this.applyZoom()
    },

    initTheme() {
      try {
        const raw = localStorage.getItem(THEME_STORAGE_KEY)
        if (THEME_OPTIONS.some((o) => o.value === raw)) {
          this.theme = raw
        }
      } catch {
        this.theme = 'system'
      }
      this.applyTheme()
      ensureSystemThemeListener(() => {
        if (this.theme === 'system') this.applyTheme()
      })
    },

    setTheme(theme) {
      if (!THEME_OPTIONS.some((o) => o.value === theme)) return
      this.theme = theme
      try {
        localStorage.setItem(THEME_STORAGE_KEY, theme)
      } catch {
        // ignore
      }
      this.applyTheme()
    },

    applyTheme() {
      applyThemeToDocument(this.theme)
    },

    setZoom(percent) {
      if (!ZOOM_OPTIONS.some((o) => o.value === percent)) return
      this.zoomPercent = percent
      try {
        localStorage.setItem(STORAGE_KEY, String(percent))
      } catch {
        // ignore
      }
      this.applyZoom()
    },

    openSettings() {
      this.settingsOpen = true
    },

    closeSettings() {
      this.settingsOpen = false
    },

    applyZoom() {
      const root = document.documentElement
      root.style.fontSize = ''
      root.style.setProperty('--app-content-zoom', String(this.contentZoom))
      root.dataset.appZoom = String(this.zoomPercent)
    },
  },
})
