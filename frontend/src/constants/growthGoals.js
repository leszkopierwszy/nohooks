export const GROWTH_GOAL_TYPES = [
  { value: 'achievement', labelKey: 'growth.types.achievement' },
  { value: 'event', labelKey: 'growth.types.event' },
  { value: 'book', labelKey: 'growth.types.book' },
]

export const GROWTH_MOOD_LEVELS = [
  { value: 1, labelKey: 'growth.mood.1', emoji: '😞' },
  { value: 2, labelKey: 'growth.mood.2', emoji: '😕' },
  { value: 3, labelKey: 'growth.mood.3', emoji: '😐' },
  { value: 4, labelKey: 'growth.mood.4', emoji: '🙂' },
  { value: 5, labelKey: 'growth.mood.5', emoji: '😄' },
]

export const GROWTH_LOAD_LEVELS = [
  { value: 1, labelKey: 'growth.load.1', emoji: '·' },
  { value: 2, labelKey: 'growth.load.2', emoji: '··' },
  { value: 3, labelKey: 'growth.load.3', emoji: '···' },
  { value: 4, labelKey: 'growth.load.4', emoji: '····' },
  { value: 5, labelKey: 'growth.load.5', emoji: '·····' },
]

/** Dni przed datą wydarzenia — opcje przypomnień. */
export const GROWTH_REMINDER_DAY_OPTIONS = [14, 7, 3, 1, 0]

export const GROWTH_STORAGE_VERSION = 2

export function growthTypeMeta(type) {
  return GROWTH_GOAL_TYPES.find((t) => t.value === type) ?? GROWTH_GOAL_TYPES[0]
}

export function growthMoodMeta(value) {
  const n = Number(value)
  return GROWTH_MOOD_LEVELS.find((m) => m.value === n) ?? null
}

export function growthLoadMeta(value) {
  const n = Number(value)
  return GROWTH_LOAD_LEVELS.find((l) => l.value === n) ?? null
}
