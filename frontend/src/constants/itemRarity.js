export const RARITY_OPTIONS = [
  { value: 'common', label: 'Common' },
  { value: 'uncommon', label: 'Uncommon' },
  { value: 'rare', label: 'Rare' },
  { value: 'epic', label: 'Epic' },
  { value: 'legendary', label: 'Legendary' },
]

const RARITY_VALUES = new Set(RARITY_OPTIONS.map((o) => o.value))

export function normalizeRarity(value) {
  if (!value) return 'common'
  const lower = String(value).trim().toLowerCase()
  return RARITY_VALUES.has(lower) ? lower : 'common'
}

export function displayRarityName(value) {
  const normalized = normalizeRarity(value)
  return RARITY_OPTIONS.find((o) => o.value === normalized)?.label ?? normalized
}
