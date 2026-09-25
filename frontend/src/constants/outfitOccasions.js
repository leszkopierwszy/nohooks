/** Occasion categories for Style outfit tiles. */
export const OUTFIT_OCCASIONS = [
  { value: 'school', labelKey: 'outfit.occasions.school', icon: 'academic' },
  { value: 'work', labelKey: 'outfit.occasions.work', icon: 'briefcase' },
  { value: 'home', labelKey: 'outfit.occasions.home', icon: 'home' },
  { value: 'outing', labelKey: 'outfit.occasions.outing', icon: 'map' },
  { value: 'sport', labelKey: 'outfit.occasions.sport', icon: 'bolt' },
  { value: 'formal', labelKey: 'outfit.occasions.formal', icon: 'star' },
  { value: 'casual', labelKey: 'outfit.occasions.casual', icon: 'sun' },
  { value: 'travel', labelKey: 'outfit.occasions.travel', icon: 'globe' },
]

export const OUTFIT_OCCASION_VALUES = OUTFIT_OCCASIONS.map((o) => o.value)

/** Free-text / AI aliases → canonical outfit.occasion values. */
const OCCASION_ALIASES = {
  school: 'school',
  szkoła: 'school',
  szkola: 'school',
  work: 'work',
  office: 'work',
  biuro: 'work',
  praca: 'work',
  home: 'home',
  dom: 'home',
  outing: 'outing',
  'going out': 'outing',
  wyjscie: 'outing',
  wyjście: 'outing',
  sport: 'sport',
  gym: 'sport',
  formal: 'formal',
  elegant: 'formal',
  gala: 'formal',
  wedding: 'formal',
  wesele: 'formal',
  casual: 'casual',
  everyday: 'casual',
  codzienny: 'casual',
  travel: 'travel',
  podroz: 'travel',
  podróż: 'travel',
}

export function outfitOccasionMeta(value) {
  return OUTFIT_OCCASIONS.find((o) => o.value === value) ?? null
}

/**
 * Map AI / free-text occasion to a stored enum value, or null if unknown.
 */
export function normalizeOutfitOccasion(value) {
  if (value == null) return null
  const raw = String(value).trim()
  if (!raw) return null

  const lower = raw.toLowerCase()
  if (OUTFIT_OCCASION_VALUES.includes(lower)) return lower

  const compact = lower
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
  if (OCCASION_ALIASES[compact]) return OCCASION_ALIASES[compact]
  if (OCCASION_ALIASES[lower]) return OCCASION_ALIASES[lower]

  // Phrase contains a known token, e.g. "casual day out"
  for (const value of OUTFIT_OCCASION_VALUES) {
    if (compact.includes(value) || lower.includes(value)) return value
  }
  for (const [alias, canonical] of Object.entries(OCCASION_ALIASES)) {
    if (alias.length >= 4 && (compact.includes(alias) || lower.includes(alias))) {
      return canonical
    }
  }

  return null
}
