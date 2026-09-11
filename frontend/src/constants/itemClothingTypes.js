const STORAGE_KEY = 'nohooks.clothingTypes.custom'

export const DEFAULT_CLOTHING_TYPES = [
  { value: 'bluza', label: 'Bluza' },
  { value: 'koszulka', label: 'Koszulka' },
  { value: 't-shirt', label: 'T-shirt' },
  { value: 'spodnie', label: 'Spodnie' },
  { value: 'jeansy', label: 'Jeansy' },
  { value: 'szorty', label: 'Szorty' },
  { value: 'kurtka', label: 'Kurtka' },
  { value: 'marynarka', label: 'Marynarka' },
  { value: 'polowka', label: 'Półówka' },
  { value: 'spodnica', label: 'Spódnica' },
  { value: 'sukienka', label: 'Sukienka' },
  { value: 'garnitur', label: 'Garnitur' },
  { value: 'bielizna', label: 'Bielizna' },
  { value: 'skarpety', label: 'Skarpety' },
  { value: 'pizama', label: 'Piżama' },
  { value: 'dres', label: 'Dres' },
  { value: 'czapka', label: 'Czapka' },
  { value: 'szalik', label: 'Szalik' },
  { value: 'rekawiczki', label: 'Rękawiczki' },
]

function slugify(label) {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function findOption(category) {
  if (!category) return null
  const trimmed = category.trim()
  const lower = trimmed.toLowerCase()

  const all = getAllClothingTypes()
  return (
    all.find((t) => t.value === lower) ??
    all.find((t) => t.value === trimmed) ??
    all.find((t) => t.label.toLowerCase() === lower) ??
    null
  )
}

export function loadCustomClothingTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((t) => t?.value && t?.label)
  } catch {
    return []
  }
}

export function saveCustomClothingTypes(types) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types))
}

export function createClothingTypeOption(label) {
  const trimmed = label.trim()
  const value = slugify(trimmed) || trimmed.toLowerCase()
  const existing = findOption(value) ?? findOption(trimmed)
  if (existing) return existing

  return {
    value,
    label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
  }
}

export function addCustomClothingType(label) {
  const option = createClothingTypeOption(label)
  const custom = loadCustomClothingTypes()
  if (!custom.some((t) => t.value === option.value)) {
    custom.push(option)
    saveCustomClothingTypes(custom)
  }
  return option
}

export function getAllClothingTypes(extraValues = []) {
  const map = new Map()

  for (const type of DEFAULT_CLOTHING_TYPES) {
    map.set(type.value, type)
  }

  for (const type of loadCustomClothingTypes()) {
    map.set(type.value, type)
  }

  for (const raw of extraValues) {
    if (!raw) continue
    const option = findOption(raw) ?? createClothingTypeOption(String(raw))
    map.set(option.value, option)
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'pl')
  )
}

export function displayClothingTypeName(category) {
  if (!category) return null
  const option = findOption(category)
  if (option) return option.label
  const trimmed = category.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function normalizeClothingTypeForStorage(category) {
  if (!category) return null
  const option = findOption(category)
  return option?.value ?? slugify(category) ?? category.trim().toLowerCase()
}
