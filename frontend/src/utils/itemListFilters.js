import { getAllBrands, normalizeBrandForStorage } from '../constants/itemBrands'
import { getAllClothingTypes, normalizeClothingTypeForStorage } from '../constants/itemClothingTypes'
import { COLOR_OPTIONS, itemColorsList, normalizeColorForStorage } from '../constants/itemColors'
import { LIKE_RATING_LEVELS, normalizeLikeRating } from '../constants/itemLikeRating'
import { getAllSeasons, normalizeSeasonForStorage } from '../constants/itemSeasons'
import { displayShoeSize, isShoesCollection } from '../constants/itemSizes'

export const FILTER_QUERY_KEYS = [
  'color',
  'brand',
  'size',
  'season',
  'likeRating',
  'category',
]

/** Wartości z query (?color=czarny,bialy lub tablica). */
export function parseQueryList(query, key) {
  const raw = query?.[key]
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw.flatMap((v) => String(v).split(',')).map((v) => v.trim()).filter(Boolean)
  }
  return String(raw)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
}

export function parseFiltersFromQuery(query) {
  return {
    color: parseQueryList(query, 'color'),
    brand: parseQueryList(query, 'brand'),
    size: parseQueryList(query, 'size'),
    season: parseQueryList(query, 'season'),
    likeRating: parseQueryList(query, 'likeRating').map((v) => normalizeLikeRating(v)).filter(Boolean),
    category: parseQueryList(query, 'category'),
  }
}

export function activeFilterCount(query) {
  return FILTER_QUERY_KEYS.reduce((n, key) => n + parseQueryList(query, key).length, 0)
}

export function hasActiveFilters(query) {
  return activeFilterCount(query) > 0
}

function sizeFilterKey(item) {
  if (!item?.size) return null
  const sys = item.size_system === 'us' ? 'us' : 'eu'
  return `${String(item.size).trim()}|${sys}`
}

function displaySizeLabel(key, collectionName) {
  if (!key) return null
  const [size, sys] = key.split('|')
  if (isShoesCollection(collectionName)) {
    return displayShoeSize(size, sys, sys) ?? `${size} ${sys.toUpperCase()}`
  }
  return size
}

function itemColorKeys(item) {
  return itemColorsList(item)
}

function itemBrandKey(item) {
  return normalizeBrandForStorage(item?.brand)
}

function itemSeasonKey(item) {
  return normalizeSeasonForStorage(item?.season)
}

function itemCategoryKey(item) {
  return normalizeClothingTypeForStorage(item?.category)
}

export function itemMatchesFilters(item, filters) {
  if (filters.color.length) {
    const keys = itemColorKeys(item)
    if (!keys.some((key) => filters.color.includes(key))) return false
  }

  if (filters.brand.length) {
    const key = itemBrandKey(item)
    if (!key || !filters.brand.includes(key)) return false
  }

  if (filters.size.length) {
    const key = sizeFilterKey(item)
    if (!key || !filters.size.includes(key)) return false
  }

  if (filters.season.length) {
    const key = itemSeasonKey(item)
    if (!key || !filters.season.includes(key)) return false
  }

  if (filters.likeRating.length) {
    const rating = normalizeLikeRating(item?.like_rating)
    if (!rating || !filters.likeRating.includes(rating)) return false
  }

  if (filters.category.length) {
    const key = itemCategoryKey(item)
    if (!key || !filters.category.includes(key)) return false
  }

  return true
}

export function applyItemFilters(items, query) {
  const filters = parseFiltersFromQuery(query)
  if (!hasActiveFilters(query)) return items
  return items.filter((item) => itemMatchesFilters(item, filters))
}

function getAllColors(usedValues = []) {
  const map = new Map(COLOR_OPTIONS.map((c) => [c.value, c]))
  for (const raw of usedValues) {
    if (!raw) continue
    const value = normalizeColorForStorage(raw)
    if (!value) continue
    if (!map.has(value)) {
      map.set(value, {
        value,
        label: raw.trim().charAt(0).toUpperCase() + raw.trim().slice(1),
      })
    }
  }
  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, 'pl'))
}

/**
 * Sekcje filtrów z opcjami występującymi w bieżącej liście (+ zaznaczenie z query).
 */
export function buildFilterSections(items, query, collectionName) {
  const selected = parseFiltersFromQuery(query)

  const usedColors = []
  const usedBrands = []
  const usedSizes = new Map()
  const usedSeasons = []
  const usedCategories = []
  const usedRatings = new Set()

  for (const item of items) {
    for (const color of itemColorsList(item)) {
      usedColors.push(color)
    }
    if (item.brand) usedBrands.push(item.brand)
    const sk = sizeFilterKey(item)
    if (sk) usedSizes.set(sk, displaySizeLabel(sk, collectionName))
    if (item.season) usedSeasons.push(item.season)
    if (item.category) usedCategories.push(item.category)
    const r = normalizeLikeRating(item.like_rating)
    if (r) usedRatings.add(r)
  }

  const sections = []

  const colorOptions = getAllColors(usedColors).filter((c) =>
    items.some((i) => itemColorKeys(i).includes(c.value))
  )
  if (colorOptions.length) {
    sections.push({
      id: 'color',
      name: 'Kolor',
      options: colorOptions.map((o) => ({
        value: o.value,
        label: o.label,
        checked: selected.color.includes(o.value),
      })),
    })
  }

  const brandOptions = getAllBrands(usedBrands).filter((b) =>
    items.some((i) => itemBrandKey(i) === b.value)
  )
  if (brandOptions.length) {
    sections.push({
      id: 'brand',
      name: 'Marka',
      options: brandOptions.map((o) => ({
        value: o.value,
        label: o.label,
        checked: selected.brand.includes(o.value),
      })),
    })
  }

  if (usedSizes.size) {
    sections.push({
      id: 'size',
      name: 'Rozmiar',
      options: [...usedSizes.entries()]
        .sort(([a], [b]) => a.localeCompare(b, undefined, { numeric: true }))
        .map(([value, label]) => ({
          value,
          label,
          checked: selected.size.includes(value),
        })),
    })
  }

  const seasonOptions = getAllSeasons(usedSeasons).filter((s) =>
    items.some((i) => itemSeasonKey(i) === s.value)
  )
  if (seasonOptions.length) {
    sections.push({
      id: 'season',
      name: 'Sezon',
      options: seasonOptions.map((o) => ({
        value: o.value,
        label: o.label,
        checked: selected.season.includes(o.value),
      })),
    })
  }

  if (usedRatings.size) {
    sections.push({
      id: 'likeRating',
      name: 'Satysfakcja',
      options: LIKE_RATING_LEVELS.filter((l) => usedRatings.has(l.value)).map((o) => ({
        value: String(o.value),
        label: `${o.emoji} ${o.label}`,
        checked: selected.likeRating.includes(Number(o.value)),
      })),
    })
  }

  const categoryOptions = getAllClothingTypes(usedCategories).filter((t) =>
    items.some((i) => itemCategoryKey(i) === t.value)
  )
  if (categoryOptions.length) {
    sections.push({
      id: 'category',
      name: 'Kategoria',
      options: categoryOptions.map((o) => ({
        value: o.value,
        label: o.label,
        checked: selected.category.includes(o.value),
      })),
    })
  }

  return sections
}

export function toggleFilterInQuery(query, key, value) {
  const current = new Set(parseQueryList(query, key))
  const strVal = key === 'likeRating' ? String(normalizeLikeRating(value) ?? value) : String(value)

  if (current.has(strVal)) {
    current.delete(strVal)
  } else {
    current.add(strVal)
  }

  const next = { ...query }
  if (current.size) {
    next[key] = [...current].join(',')
  } else {
    delete next[key]
  }
  return next
}

export function clearFilterQuery(query) {
  const next = { ...query }
  for (const key of FILTER_QUERY_KEYS) {
    delete next[key]
  }
  return next
}
