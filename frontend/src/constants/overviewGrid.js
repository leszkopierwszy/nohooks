export const OVERVIEW_TILE_IDS = ['day', 'savings', 'weather']

export const GRID_COLUMNS = 12
export const GRID_CELL_HEIGHT = 88
export const GRID_MARGIN = 20
export const GRID_ITEM_PADDING = GRID_MARGIN / 2

export const TILE_LAYOUT_VERSION = 7

export const DEFAULT_TILE_LAYOUT = [
  { id: 'weather', x: 0, y: 0, w: 4, h: 1, minW: 3, minH: 1 },
  { id: 'day', x: 0, y: 1, w: 4, h: 3, minW: 3, minH: 2 },
  { id: 'savings', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
]

const LAYOUT_STORAGE_KEY = 'nohooks.overview.tileLayout'
const LEGACY_ASSIGNMENTS_KEY = 'nohooks.overview.gridAssignments'

/** Domyślny układ kolumnowy (reset). */
export function applyDefaultColumnLayout(layout) {
  const map = Object.fromEntries(layout.map((item) => [item.id, { ...item }]))
  const weather = map.weather ?? { ...DEFAULT_TILE_LAYOUT[0] }
  const day = map.day ?? { ...DEFAULT_TILE_LAYOUT[1] }
  const savings = map.savings ?? { ...DEFAULT_TILE_LAYOUT[2] }

  weather.x = 0
  weather.y = 0
  weather.w = Math.min(weather.w ?? 4, GRID_COLUMNS)

  day.x = 0
  day.y = weather.y + weather.h
  day.w = weather.w

  savings.x = weather.w
  savings.y = 0
  savings.w = weather.w
  savings.h = 2

  return normalizeTileLayout(
    OVERVIEW_TILE_IDS.map((id) => {
      const base = DEFAULT_TILE_LAYOUT.find((t) => t.id === id)
      const item = map[id]
      return {
        id,
        x: item.x,
        y: item.y,
        w: item.w,
        h: Math.max(item.h, base?.minH ?? 1),
        minW: base?.minW ?? 2,
        minH: base?.minH ?? 1,
      }
    }),
  )
}

/** Walidacja granic — zachowuje pozycje użytkownika z edycji. */
export function normalizeTileLayout(layout) {
  return layout.map((item) => {
    const base = DEFAULT_TILE_LAYOUT.find((t) => t.id === item.id) || item
    const minW = item.minW ?? base.minW ?? 2
    const minH = item.minH ?? base.minH ?? 1
    const x = Math.max(0, Math.min(item.x ?? 0, GRID_COLUMNS - 1))
    const w = Math.max(minW, Math.min(item.w ?? minW, GRID_COLUMNS - x))
    const y = Math.max(0, item.y ?? 0)
    const h = Math.max(minH, item.h ?? minH)
    return { ...item, x, y, w, h, minW, minH }
  })
}

export function isValidTileLayout(layout) {
  if (!Array.isArray(layout) || layout.length !== OVERVIEW_TILE_IDS.length) return false
  const ids = new Set(layout.map((item) => item.id))
  if (!OVERVIEW_TILE_IDS.every((id) => ids.has(id))) return false
  return layout.every(
    (item) =>
      typeof item.x === 'number' &&
      typeof item.y === 'number' &&
      typeof item.w === 'number' &&
      typeof item.h === 'number' &&
      item.w >= 1 &&
      item.h >= 1 &&
      item.x + item.w <= GRID_COLUMNS,
  )
}

export function readStoredTileLayout() {
  try {
    const raw = localStorage.getItem(LAYOUT_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    const items = parsed?.version === TILE_LAYOUT_VERSION ? parsed.items : null
    if (items && isValidTileLayout(items)) {
      return normalizeTileLayout(items)
    }
    return null
  } catch {
    return null
  }
}

export function writeStoredTileLayout(layout) {
  try {
    localStorage.setItem(
      LAYOUT_STORAGE_KEY,
      JSON.stringify({
        version: TILE_LAYOUT_VERSION,
        items: normalizeTileLayout(layout),
      }),
    )
  } catch {
    // ignore
  }
}

export function resetStoredTileLayout() {
  try {
    localStorage.removeItem(LAYOUT_STORAGE_KEY)
    localStorage.removeItem(LEGACY_ASSIGNMENTS_KEY)
    localStorage.removeItem('nohooks.overview.tileOrder')
  } catch {
    // ignore
  }
}
