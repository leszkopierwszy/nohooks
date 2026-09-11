const STORAGE_KEY = 'nohooks.brands.custom'

export const DEFAULT_BRANDS = [
  { value: 'nike', label: 'Nike' },
  { value: 'adidas', label: 'Adidas' },
  { value: 'puma', label: 'Puma' },
  { value: 'new-balance', label: 'New Balance' },
  { value: 'reebok', label: 'Reebok' },
  { value: 'asics', label: 'Asics' },
  { value: 'converse', label: 'Converse' },
  { value: 'vans', label: 'Vans' },
  { value: 'salomon', label: 'Salomon' },
  { value: 'the-north-face', label: 'The North Face' },
  { value: 'patagonia', label: 'Patagonia' },
  { value: 'carhartt', label: 'Carhartt' },
  { value: 'levis', label: "Levi's" },
  { value: 'zara', label: 'Zara' },
  { value: 'hm', label: 'H&M' },
  { value: 'uniqlo', label: 'Uniqlo' },
  { value: 'mango', label: 'Mango' },
  { value: 'reserved', label: 'Reserved' },
  { value: 'cropp', label: 'Cropp' },
  { value: 'house', label: 'House' },
  { value: 'sinsay', label: 'Sinsay' },
  { value: 'lacoste', label: 'Lacoste' },
  { value: 'tommy-hilfiger', label: 'Tommy Hilfiger' },
  { value: 'calvin-klein', label: 'Calvin Klein' },
  { value: 'ralph-lauren', label: 'Ralph Lauren' },
  { value: 'stone-island', label: 'Stone Island' },
  { value: 'cp-company', label: 'C.P. Company' },
  { value: 'stussy', label: 'Stüssy' },
  { value: 'supreme', label: 'Supreme' },
  { value: 'apple', label: 'Apple' },
  { value: 'samsung', label: 'Samsung' },
  { value: 'sony', label: 'Sony' },
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

function findOption(brand) {
  if (!brand) return null
  const trimmed = brand.trim()
  const lower = trimmed.toLowerCase()

  const all = getAllBrands()
  return (
    all.find((b) => b.value === lower) ??
    all.find((b) => b.value === trimmed) ??
    all.find((b) => b.label.toLowerCase() === lower) ??
    null
  )
}

export function loadCustomBrands() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((b) => b?.value && b?.label)
  } catch {
    return []
  }
}

function saveCustomBrands(brands) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(brands))
}

export function createBrandOption(label) {
  const trimmed = label.trim()
  const value = slugify(trimmed) || trimmed.toLowerCase()
  const existing = findOption(value) ?? findOption(trimmed)
  if (existing) return existing

  return {
    value,
    label: trimmed.charAt(0).toUpperCase() + trimmed.slice(1),
  }
}

export function addCustomBrand(label) {
  const option = createBrandOption(label)
  const custom = loadCustomBrands()
  if (!custom.some((b) => b.value === option.value)) {
    custom.push(option)
    saveCustomBrands(custom)
  }
  return option
}

export function getAllBrands(extraValues = []) {
  const map = new Map()

  for (const brand of DEFAULT_BRANDS) {
    map.set(brand.value, brand)
  }

  for (const brand of loadCustomBrands()) {
    map.set(brand.value, brand)
  }

  for (const raw of extraValues) {
    if (!raw) continue
    const option = findOption(raw) ?? createBrandOption(String(raw))
    map.set(option.value, option)
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'pl')
  )
}

export function displayBrandName(brand) {
  if (!brand) return null
  const option = findOption(brand)
  if (option) return option.label
  const trimmed = brand.trim()
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export function normalizeBrandForStorage(brand) {
  if (!brand) return null
  const option = findOption(brand)
  return option?.value ?? slugify(brand) ?? brand.trim().toLowerCase()
}
