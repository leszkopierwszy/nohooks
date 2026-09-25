import { isClothingCollection, isShoesCollection } from './itemSizes'

const NON_FASHION_RE =
  /electron|gadget|tech|audio|gaming|book|ksi[aą][zż]|media|software|laptop|phone|tablet|kamera|camera/

const ACCESSORY_RE =
  /accessor|akcesor|bag|torb|bi[zż]uter|jewel|watch|zegar|scarf|hat|belt|pasek/

/**
 * Collections shown when building an outfit (clothes / shoes / accessories).
 * Excludes electronics, books, and other non-wardrobe groups.
 */
export function isFashionCollection(name) {
  if (!name) return false
  const n = String(name).trim().toLowerCase()
  if (!n) return false
  if (NON_FASHION_RE.test(n)) return false
  if (isClothingCollection(n) || isShoesCollection(n)) return true
  if (ACCESSORY_RE.test(n)) return true
  // Generic wardrobe-ish names
  if (/^clothes?$|^clothing$|^ubrania$|^wardrobe$|^szafa$/.test(n)) return true
  return false
}

export function fashionCollections(collections = []) {
  return (collections ?? []).filter((c) => isFashionCollection(c?.name))
}

export function itemCollectionName(item) {
  return (
    item?.collection_group?.name ??
    item?.collectionGroup?.name ??
    item?.collection_group ??
    null
  )
}

export function itemBelongsToFashion(item) {
  return isFashionCollection(itemCollectionName(item))
}
