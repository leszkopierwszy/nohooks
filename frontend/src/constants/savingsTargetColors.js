/** Kolory targetów — te same klucze co FlatBadge. */
export const SAVINGS_TARGET_COLORS = [
  { value: 'indigo', label: 'Indygo' },
  { value: 'green', label: 'Zielony' },
  { value: 'purple', label: 'Fiolet' },
  { value: 'blue', label: 'Niebieski' },
  { value: 'yellow', label: 'Żółty' },
  { value: 'pink', label: 'Różowy' },
  { value: 'red', label: 'Czerwony' },
  { value: 'gray', label: 'Szary' },
]

export const DEFAULT_M2M_TARGET_COLOR = 'indigo'
export const DEFAULT_FIXED_TARGET_COLOR = 'green'

const VALID = new Set(SAVINGS_TARGET_COLORS.map((c) => c.value))

/** Tailwind klasy dla karty, paska postępu i akcentów. */
export const SAVINGS_TARGET_COLOR_THEMES = {
  indigo: {
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/60',
    label: 'text-indigo-700',
    title: 'text-indigo-950',
    muted: 'text-indigo-800/80',
    accent: 'text-indigo-600',
    percent: 'text-indigo-950',
    track: 'bg-indigo-200',
    bar: 'bg-indigo-600',
    dot: 'bg-indigo-500',
    ring: 'ring-indigo-600',
    chartStroke: '#4f46e5',
    chartFill: '#e0e7ff',
  },
  green: {
    border: 'border-green-200',
    bg: 'bg-green-50/60',
    label: 'text-green-700',
    title: 'text-green-950',
    muted: 'text-green-800/80',
    accent: 'text-green-600',
    percent: 'text-green-950',
    track: 'bg-green-200',
    bar: 'bg-green-600',
    dot: 'bg-green-500',
    ring: 'ring-green-600',
    chartStroke: '#16a34a',
    chartFill: '#dcfce7',
  },
  purple: {
    border: 'border-purple-200',
    bg: 'bg-purple-50/60',
    label: 'text-purple-700',
    title: 'text-purple-950',
    muted: 'text-purple-800/80',
    accent: 'text-purple-600',
    percent: 'text-purple-950',
    track: 'bg-purple-200',
    bar: 'bg-purple-600',
    dot: 'bg-purple-500',
    ring: 'ring-purple-600',
    chartStroke: '#9333ea',
    chartFill: '#f3e8ff',
  },
  blue: {
    border: 'border-sky-200',
    bg: 'bg-sky-50/60',
    label: 'text-sky-700',
    title: 'text-sky-950',
    muted: 'text-sky-800/80',
    accent: 'text-sky-600',
    percent: 'text-sky-950',
    track: 'bg-sky-200',
    bar: 'bg-sky-600',
    dot: 'bg-sky-500',
    ring: 'ring-sky-600',
    chartStroke: '#0284c7',
    chartFill: '#e0f2fe',
  },
  yellow: {
    border: 'border-yellow-200',
    bg: 'bg-yellow-50/60',
    label: 'text-yellow-800',
    title: 'text-yellow-950',
    muted: 'text-yellow-900/70',
    accent: 'text-yellow-700',
    percent: 'text-yellow-950',
    track: 'bg-yellow-200',
    bar: 'bg-yellow-500',
    dot: 'bg-yellow-500',
    ring: 'ring-yellow-500',
    chartStroke: '#ca8a04',
    chartFill: '#fef9c3',
  },
  pink: {
    border: 'border-pink-200',
    bg: 'bg-pink-50/60',
    label: 'text-pink-700',
    title: 'text-pink-950',
    muted: 'text-pink-800/80',
    accent: 'text-pink-600',
    percent: 'text-pink-950',
    track: 'bg-pink-200',
    bar: 'bg-pink-600',
    dot: 'bg-pink-500',
    ring: 'ring-pink-600',
    chartStroke: '#db2777',
    chartFill: '#fce7f3',
  },
  red: {
    border: 'border-red-200',
    bg: 'bg-red-50/60',
    label: 'text-red-700',
    title: 'text-red-950',
    muted: 'text-red-800/80',
    accent: 'text-red-600',
    percent: 'text-red-950',
    track: 'bg-red-200',
    bar: 'bg-red-600',
    dot: 'bg-red-500',
    ring: 'ring-red-600',
    chartStroke: '#dc2626',
    chartFill: '#fee2e2',
  },
  gray: {
    border: 'border-gray-200',
    bg: 'bg-gray-50/80',
    label: 'text-gray-600',
    title: 'text-gray-900',
    muted: 'text-gray-600',
    accent: 'text-gray-700',
    percent: 'text-gray-900',
    track: 'bg-gray-200',
    bar: 'bg-gray-600',
    dot: 'bg-gray-500',
    ring: 'ring-gray-500',
    chartStroke: '#4b5563',
    chartFill: '#f3f4f6',
  },
}

export function normalizeSavingsTargetColor(color, fallback = DEFAULT_FIXED_TARGET_COLOR) {
  const c = String(color || '').trim()
  return VALID.has(c) ? c : fallback
}

export function savingsTargetColorTheme(color) {
  const key = normalizeSavingsTargetColor(color)
  return SAVINGS_TARGET_COLOR_THEMES[key] ?? SAVINGS_TARGET_COLOR_THEMES.indigo
}

/** Kolejny kolor dla nowego targetu (różny od ostatniego). */
export function nextSavingsTargetColor(existingTargets) {
  const palette = SAVINGS_TARGET_COLORS.map((c) => c.value).filter((v) => v !== DEFAULT_M2M_TARGET_COLOR)
  const used = new Set((existingTargets ?? []).map((t) => t.color).filter(Boolean))
  const next = palette.find((c) => !used.has(c))
  return next ?? palette[(existingTargets?.length ?? 0) % palette.length]
}
