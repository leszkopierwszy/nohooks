/** Stored value → display label + swatch hex */
export const COLOR_OPTIONS = [
  { value: 'czarny', label: 'Czarny', hex: '#171717' },
  { value: 'bialy', label: 'Biały', hex: '#ffffff' },
  { value: 'szary', label: 'Szary', hex: '#9ca3af' },
  { value: 'granatowy', label: 'Granatowy', hex: '#1e3a5f' },
  { value: 'navy', label: 'Navy', hex: '#1e3a5f' },
  { value: 'niebieski', label: 'Niebieski', hex: '#2563eb' },
  { value: 'czerwony', label: 'Czerwony', hex: '#dc2626' },
  { value: 'bordowy', label: 'Bordowy', hex: '#7f1d1d' },
  { value: 'zielony', label: 'Zielony', hex: '#16a34a' },
  { value: 'oliwkowy', label: 'Oliwkowy', hex: '#65a30d' },
  { value: 'zolty', label: 'Żółty', hex: '#eab308' },
  { value: 'pomaranczowy', label: 'Pomarańczowy', hex: '#ea580c' },
  { value: 'bezowy', label: 'Beżowy', hex: '#d6c4a8' },
  { value: 'brazowy', label: 'Brązowy', hex: '#78350f' },
  { value: 'rozowy', label: 'Różowy', hex: '#ec4899' },
  { value: 'fioletowy', label: 'Fioletowy', hex: '#7c3aed' },
]

const HEX_TO_OPTION = Object.fromEntries(
  COLOR_OPTIONS.map((c) => [c.hex.toLowerCase(), c])
)

function normalizeHex(hex) {
  const h = hex.trim().toLowerCase()
  if (/^#[0-9a-f]{3}$/.test(h)) {
    return `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}`
  }
  return h
}

function findOption(color) {
  if (!color) return null
  const trimmed = color.trim()
  const lower = trimmed.toLowerCase()

  const byValue = COLOR_OPTIONS.find((c) => c.value === lower)
  if (byValue) return byValue

  const byLabel = COLOR_OPTIONS.find((c) => c.label.toLowerCase() === lower)
  if (byLabel) return byLabel

  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return HEX_TO_OPTION[normalizeHex(trimmed)] ?? null
  }

  return null
}

/** Always a human-readable name — never raw hex in the UI */
export function displayColorName(color) {
  if (!color) return null

  const option = findOption(color)
  if (option) return option.label

  const trimmed = color.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return 'Niestandardowy'
  }

  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function colorSwatchStyle(color) {
  if (!color) return null

  const option = findOption(color)
  if (option?.hex) {
    return { backgroundColor: option.hex }
  }

  const trimmed = color.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    return { backgroundColor: normalizeHex(trimmed) }
  }

  return null
}

/** Whether swatch needs a visible border (e.g. white on white UI) */
export function colorSwatchNeedsBorder(color) {
  const option = findOption(color)
  const hex = option?.hex ?? ( /^#/.test(color?.trim() ?? '') ? normalizeHex(color.trim()) : null )
  if (!hex) return true
  return hex === '#ffffff' || hex === '#fff'
}

export function normalizeColorForStorage(color) {
  if (!color) return null
  const option = findOption(color)
  if (option) return option.value
  const trimmed = color.trim()
  if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(trimmed)) {
    const mapped = HEX_TO_OPTION[normalizeHex(trimmed)]
    return mapped?.value ?? null
  }
  return trimmed.toLowerCase()
}

/** List of normalized colors for an item (colors[] with fallback to color). */
export function itemColorsList(item) {
  const fromArray = Array.isArray(item?.colors)
    ? item.colors.map((c) => normalizeColorForStorage(c)).filter(Boolean)
    : []

  if (fromArray.length) {
    return [...new Set(fromArray)]
  }

  const single = normalizeColorForStorage(item?.color)
  return single ? [single] : []
}

/** Primary / displayed color for an item. */
export function itemPrimaryColor(item) {
  return itemColorsList(item)[0] ?? null
}

export function normalizeColorsForStorage(colors) {
  if (!Array.isArray(colors)) {
    const single = normalizeColorForStorage(colors)
    return single ? [single] : []
  }

  const normalized = []
  for (const raw of colors) {
    const value = normalizeColorForStorage(raw)
    if (!value || normalized.includes(value)) continue
    normalized.push(value)
  }
  return normalized
}
