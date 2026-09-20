const STORAGE_KEY = 'nohooks.clothingTypes.custom'

/**
 * Canonical clothing types — English values only.
 * Stored on items as `category`.
 */
export const DEFAULT_CLOTHING_TYPES = [
  { value: 'hoodie', label: 'Hoodie' },
  { value: 'sweatshirt', label: 'Sweatshirt' },
  { value: 't-shirt', label: 'T-shirt' },
  { value: 'shirt', label: 'Shirt' },
  { value: 'polo', label: 'Polo' },
  { value: 'top', label: 'Top' },
  { value: 'sweater', label: 'Sweater' },
  { value: 'cardigan', label: 'Cardigan' },
  { value: 'jacket', label: 'Jacket' },
  { value: 'coat', label: 'Coat' },
  { value: 'blazer', label: 'Blazer' },
  { value: 'pants', label: 'Pants' },
  { value: 'jeans', label: 'Jeans' },
  { value: 'shorts', label: 'Shorts' },
  { value: 'skirt', label: 'Skirt' },
  { value: 'leggings', label: 'Leggings' },
  { value: 'tights', label: 'Tights' },
  { value: 'dress', label: 'Dress' },
  { value: 'suit', label: 'Suit' },
  { value: 'jumpsuit', label: 'Jumpsuit' },
  { value: 'tracksuit', label: 'Tracksuit' },
  { value: 'underwear', label: 'Underwear' },
  { value: 'socks', label: 'Socks' },
  { value: 'pajamas', label: 'Pajamas' },
  { value: 'hat', label: 'Hat' },
  { value: 'scarf', label: 'Scarf' },
  { value: 'gloves', label: 'Gloves' },
]

/**
 * Legacy / non-English category values → canonical English.
 * Used only when reading old data or imports.
 */
export const CLOTHING_TYPE_ALIASES = {
  // previous PL defaults
  bluza: 'hoodie',
  koszulka: 't-shirt',
  tshirt: 't-shirt',
  spodnie: 'pants',
  jeansy: 'jeans',
  szorty: 'shorts',
  kurtka: 'jacket',
  marynarka: 'blazer',
  polowka: 'polo',
  spodnica: 'skirt',
  legginsy: 'leggings',
  leggins: 'leggings',
  rajstopy: 'tights',
  pantyhose: 'tights',
  sukienka: 'dress',
  garnitur: 'suit',
  bielizna: 'underwear',
  skarpety: 'socks',
  pizama: 'pajamas',
  dres: 'tracksuit',
  czapka: 'hat',
  szalik: 'scarf',
  rekawiczki: 'gloves',
  sweter: 'sweater',
  plaszcz: 'coat',
  koszula: 'shirt',
  kombinezon: 'jumpsuit',
  buty: 'shoes',
  trampki: 'sneakers',
  // common import stems (normalized, no diacritics)
  spodnicospodnie: 'skirt',
  spodnico: 'skirt',
}

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

function normalizeKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
}

/**
 * Resolve any stored/import category string to a canonical English type value.
 */
export function resolveCanonicalClothingType(category) {
  if (!category) return null
  const key = normalizeKey(category)
  if (!key) return null

  if (CLOTHING_TYPE_ALIASES[key]) return CLOTHING_TYPE_ALIASES[key]

  const defaults = DEFAULT_CLOTHING_TYPES.map((t) => t.value)
  if (defaults.includes(key)) return key

  // slug prefixes: dress-midi-…, skirt-pleated-…
  const byLength = [...defaults].sort((a, b) => b.length - a.length)
  for (const value of byLength) {
    if (key === value || key.startsWith(`${value}-`) || key.startsWith(`${value}_`)) {
      return value
    }
  }

  // legacy PL prefix on long import slugs
  const aliasKeys = Object.keys(CLOTHING_TYPE_ALIASES).sort(
    (a, b) => b.length - a.length,
  )
  for (const alias of aliasKeys) {
    if (key === alias || key.startsWith(`${alias}-`) || key.startsWith(`${alias}_`)) {
      return CLOTHING_TYPE_ALIASES[alias]
    }
    if (key.includes(alias) && alias.length >= 5) {
      return CLOTHING_TYPE_ALIASES[alias]
    }
  }

  return null
}

function findOption(category) {
  if (!category) return null
  const canonical = resolveCanonicalClothingType(category)
  const all = getAllClothingTypes()
  if (canonical) {
    const hit = all.find((t) => t.value === canonical)
    if (hit) return hit
  }

  const trimmed = category.trim()
  const lower = trimmed.toLowerCase()
  return (
    all.find((t) => t.value === lower) ??
    all.find((t) => t.label.toLowerCase() === lower) ??
    null
  )
}

export function loadCustomClothingTypes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed
      .filter((t) => t?.value && t?.label)
      .map((t) => {
        const canonical = resolveCanonicalClothingType(t.value) ?? slugify(t.value)
        return {
          value: canonical,
          label: t.label,
        }
      })
  } catch {
    return []
  }
}

export function saveCustomClothingTypes(types) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types))
}

export function createClothingTypeOption(label) {
  const trimmed = label.trim()
  const existing = findOption(trimmed) ?? findOption(slugify(trimmed))
  if (existing) return existing

  const value =
    resolveCanonicalClothingType(trimmed) ??
    slugify(trimmed) ??
    trimmed.toLowerCase()
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
    if (!map.has(type.value)) {
      map.set(type.value, type)
    }
  }

  for (const raw of extraValues) {
    if (!raw) continue
    const option = findOption(raw) ?? createClothingTypeOption(String(raw))
    if (!map.has(option.value)) {
      map.set(option.value, option)
    }
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'en'),
  )
}

export function displayClothingTypeName(category) {
  if (!category) return null
  const option = findOption(category)
  if (option) return option.label
  const canonical = resolveCanonicalClothingType(category)
  if (canonical) {
    const hit = DEFAULT_CLOTHING_TYPES.find((t) => t.value === canonical)
    if (hit) return hit.label
  }
  const trimmed = category.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function normalizeClothingTypeForStorage(category) {
  if (!category) return null
  const option = findOption(category)
  if (option) return option.value
  return (
    resolveCanonicalClothingType(category) ??
    slugify(category) ??
    category.trim().toLowerCase()
  )
}
