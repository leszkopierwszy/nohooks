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
export const ZOOM_MIN = 80
export const ZOOM_MAX = 120
export const ZOOM_STEP = 10
export const ZOOM_DEFAULT = 100

export function clampZoomPercent(value) {
  const n = Number(value)
  if (!Number.isFinite(n)) return ZOOM_DEFAULT
  const clamped = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, n))
  const stepped = Math.round((clamped - ZOOM_MIN) / ZOOM_STEP) * ZOOM_STEP + ZOOM_MIN
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, stepped))
}

export function contentZoomFactor(zoomPercent) {
  return (zoomPercent / 100) * CONTENT_ZOOM_BASE
}

export const useDisplayStore = defineStore('display', {
  state: () => ({
    zoomPercent: ZOOM_DEFAULT,
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
        const parsed = raw != null ? Number(raw) : ZOOM_DEFAULT
        // Stare „75%” clampujemy do nowego minimum 80%.
        this.zoomPercent = clampZoomPercent(parsed)
      } catch {
        this.zoomPercent = ZOOM_DEFAULT
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
      const next = clampZoomPercent(percent)
      this.zoomPercent = next
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
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
