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

export function outfitOccasionMeta(value) {
  return OUTFIT_OCCASIONS.find((o) => o.value === value) ?? null
}
