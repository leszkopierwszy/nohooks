import { timelineEventTypeMeta } from '../constants/timelineEventTypes'

/** Kolory do szybkiego wyboru w formularzu (hex #RRGGBB). */
export const TIMELINE_EVENT_COLOR_PRESETS = [
  '#4f46e5',
  '#7c3aed',
  '#db2777',
  '#ea580c',
  '#ca8a04',
  '#16a34a',
  '#0d9488',
  '#0284c7',
  '#64748b',
]

/**
 * Zwraca poprawny #rrggbb lub null.
 * @param {unknown} value
 * @returns {string | null}
 */
export function normalizeTimelineEventColor(value) {
  if (value == null || value === '') return null
  const s = String(value).trim()
  const withHash = s.startsWith('#') ? s : `#${s}`
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null
  return withHash.toLowerCase()
}

/**
 * Atrybuty dla kropki w kalendarzu / liście: własny kolor lub klasa wg typu.
 * @param {object} event
 * @param {string} sizeClass np. size-1.5, size-2
 */
export function timelineEventDotAttrs(event, sizeClass = 'size-1.5') {
  const hex = normalizeTimelineEventColor(event?.color)
  const base = [sizeClass, 'shrink-0', 'rounded-full']
  if (hex) {
    return {
      class: [...base, 'ring-1 ring-black/10'],
      style: { backgroundColor: hex },
    }
  }
  return {
    class: [...base, timelineEventTypeMeta(event?.type).color],
    style: {},
  }
}
