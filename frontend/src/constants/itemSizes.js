export const CLOTHING_SIZES = ['XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL']

/** EU men's sizes aligned by index with US sizes */
export const SHOE_SIZES_EU = [
  '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48',
]

export const SHOE_SIZES_US = [
  '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16', '17',
]

const EU_TO_US = Object.fromEntries(
  SHOE_SIZES_EU.map((eu, index) => [eu, SHOE_SIZES_US[index]])
)

const US_TO_EU = Object.fromEntries(
  SHOE_SIZES_US.map((us, index) => [us, SHOE_SIZES_EU[index]])
)

export function isClothingCollection(name) {
  if (!name) return false
  const n = name.toLowerCase()
  return n === 'clothes' || n === 'clothing' || n === 'ubrania'
}

export function isShoesCollection(name) {
  if (!name) return false
  const n = name.toLowerCase()
  return n === 'shoes' || n === 'obuwie' || n === 'footwear'
}

export function shoeSizeOptions(system) {
  return system === 'us' ? [...SHOE_SIZES_US] : [...SHOE_SIZES_EU]
}

export function convertShoeSize(size, fromSystem, toSystem) {
  if (!size || fromSystem === toSystem) return size

  const normalized = String(size).trim()

  if (fromSystem === 'eu' && toSystem === 'us') {
    return EU_TO_US[normalized] ?? normalized
  }

  if (fromSystem === 'us' && toSystem === 'eu') {
    return US_TO_EU[normalized] ?? normalized
  }

  return normalized
}

export function displayShoeSize(storedSize, storedSystem, displaySystem) {
  if (!storedSize) return null
  const from = storedSystem === 'us' ? 'us' : 'eu'
  const converted = convertShoeSize(storedSize, from, displaySystem)
  const suffix = displaySystem === 'us' ? 'US' : 'EU'
  return `${converted} ${suffix}`
}
