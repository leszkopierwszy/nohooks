/** Motyw — domyślnie Protocol (Tailwind UI): białe tło, emerald, czarne CTA. */

export const STORAGE_KEY = 'nohooks-model-assistant-appearance'

export const PRESETS = {
  protocol: {
    id: 'protocol',
    label: 'Protocol',
    description: 'Szablon dokumentacji Tailwind',
    pageBg: '#ffffff',
    sidebarBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    text: '#18181b',
    muted: '#71717a',
    link: '#10b981',
    accent: '#10b981',
    heroFrom: 'rgba(16, 185, 129, 0.18)',
    heroTo: 'rgba(6, 182, 212, 0.08)',
    inputBg: '#ffffff',
    inputBorder: '#d4d4d8',
    tagBg: '#f4f4f5',
    tagText: '#52525b',
    tagCustomBg: '#d1fae5',
    tagCustomText: '#047857',
    btnPrimary: '#18181b',
    btnPrimaryHover: '#27272a',
    navActiveBg: '#f4f4f5',
    navActiveBorder: '#10b981',
  },
  gray: {
    id: 'gray',
    label: 'Szary',
    pageBg: '#fafafa',
    sidebarBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#e5e7eb',
    text: '#18181b',
    muted: '#71717a',
    link: '#10b981',
    accent: '#10b981',
    heroFrom: 'rgba(16, 185, 129, 0.12)',
    heroTo: 'rgba(6, 182, 212, 0.05)',
    inputBg: '#ffffff',
    inputBorder: '#d4d4d8',
    tagBg: '#f4f4f5',
    tagText: '#52525b',
    tagCustomBg: '#d1fae5',
    tagCustomText: '#047857',
    btnPrimary: '#18181b',
    btnPrimaryHover: '#27272a',
    navActiveBg: '#f4f4f5',
    navActiveBorder: '#10b981',
  },
  mint: {
    id: 'mint',
    label: 'Miętowy',
    pageBg: '#ecfdf5',
    sidebarBg: '#ffffff',
    cardBg: '#ffffff',
    cardBorder: '#a7f3d0',
    text: '#18181b',
    muted: '#52525b',
    link: '#059669',
    accent: '#059669',
    heroFrom: 'rgba(5, 150, 105, 0.25)',
    heroTo: 'rgba(16, 185, 129, 0.1)',
    inputBg: '#ffffff',
    inputBorder: '#a7f3d0',
    tagBg: '#d1fae5',
    tagText: '#047857',
    tagCustomBg: '#a7f3d0',
    tagCustomText: '#065f46',
    btnPrimary: '#18181b',
    btnPrimaryHover: '#27272a',
    navActiveBg: '#d1fae5',
    navActiveBorder: '#059669',
  },
  dark: {
    id: 'dark',
    label: 'Ciemny',
    pageBg: '#09090b',
    sidebarBg: '#18181b',
    cardBg: '#18181b',
    cardBorder: '#3f3f46',
    text: '#fafafa',
    muted: '#a1a1aa',
    link: '#34d399',
    accent: '#34d399',
    heroFrom: 'rgba(52, 211, 153, 0.15)',
    heroTo: 'rgba(6, 182, 212, 0.08)',
    inputBg: '#27272a',
    inputBorder: '#3f3f46',
    tagBg: '#27272a',
    tagText: '#a1a1aa',
    tagCustomBg: '#064e3b',
    tagCustomText: '#6ee7b7',
    btnPrimary: '#fafafa',
    btnPrimaryHover: '#e4e4e7',
    navActiveBg: '#27272a',
    navActiveBorder: '#34d399',
  },
}

export function luminance(hex) {
  const h = hex.replace('#', '')
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function themeFromCustomColor(hex) {
  const light = luminance(hex) > 0.55
  const base = light ? PRESETS.protocol : PRESETS.dark
  return {
    ...base,
    id: 'custom',
    label: 'Własny',
    pageBg: hex,
    sidebarBg: light ? '#ffffff' : '#18181b',
    cardBg: light ? '#ffffff' : '#18181b',
  }
}

export function loadAppearance() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { preset: 'protocol', customColor: '#ffffff' }
    const parsed = JSON.parse(raw)
    if (parsed.preset === 'app' || parsed.preset === 'indigo') {
      parsed.preset = 'protocol'
    }
    return parsed
  } catch {
    return { preset: 'protocol', customColor: '#ffffff' }
  }
}

export function saveAppearance(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function resolveTheme(state) {
  if (state.preset === 'custom') {
    return themeFromCustomColor(state.customColor || '#ffffff')
  }
  return PRESETS[state.preset] || PRESETS.protocol
}

export function applyTheme(theme) {
  const root = document.documentElement
  const vars = [
    'pageBg', 'sidebarBg', 'cardBg', 'cardBorder', 'text', 'muted', 'link', 'accent',
    'heroFrom', 'heroTo', 'inputBg', 'inputBorder', 'tagBg', 'tagText',
    'tagCustomBg', 'tagCustomText', 'btnPrimary', 'btnPrimaryHover',
    'navActiveBg', 'navActiveBorder',
  ]
  vars.forEach((key) => {
    const cssKey = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`)
    if (theme[key] != null) root.style.setProperty(`--${cssKey}`, theme[key])
  })
  document.body.style.backgroundColor = theme.pageBg
  document.body.style.color = theme.text
  const sidebar = document.getElementById('sidebar')
  if (sidebar) sidebar.style.backgroundColor = theme.sidebarBg
}
