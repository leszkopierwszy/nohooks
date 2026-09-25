/**
 * Outfit slot labels for pairing formulas (mirror of backend GarmentAttributes::outfitSlot).
 * @typedef {'one_piece'|'top'|'bottom'|'footwear'|'outerwear'|'other'} OutfitSlot
 */

import { resolveCanonicalClothingType } from './itemClothingTypes.js'
import { resolveItemBodyZone } from './itemBodyPlacement.js'

const ONE_PIECE = new Set(['dress', 'jumpsuit', 'suit', 'tracksuit', 'pajamas'])
const TOPS = new Set([
  'shirt',
  'blouse',
  'top',
  't-shirt',
  'tshirt',
  'polo',
  'sweater',
  'cardigan',
  'hoodie',
  'sweatshirt',
])
const BOTTOMS = new Set(['skirt', 'pants', 'jeans', 'shorts', 'leggings', 'tights'])
const FOOTWEAR = new Set(['shoes', 'sneakers', 'boots'])
const OUTERWEAR = new Set(['jacket', 'coat', 'blazer'])

/**
 * @param {object} item
 * @returns {OutfitSlot}
 */
export function resolveOutfitSlot(item) {
  if (!item) return 'other'

  const type =
    resolveCanonicalClothingType(item.category) ??
    resolveCanonicalClothingType(item.name)

  if (type) {
    if (ONE_PIECE.has(type)) return 'one_piece'
    if (FOOTWEAR.has(type)) return 'footwear'
    if (BOTTOMS.has(type)) return 'bottom'
    if (OUTERWEAR.has(type)) return 'outerwear'
    if (TOPS.has(type)) return 'top'
  }

  const blob = `${item.category ?? ''} ${item.name ?? ''} ${item.collection_group?.name ?? ''}`.toLowerCase()
  if (/dress|jumpsuit|romper|sukienk|kombinezon|\bsuit\b/.test(blob)) return 'one_piece'
  if (/shoe|sneaker|boot|heel|loafer|sandal|buty|obuwie|footwear/.test(blob)) return 'footwear'
  if (/skirt|pant|jean|short|trouser|leggings|tights|spodnic|spodnie/.test(blob)) return 'bottom'
  if (/jacket|coat|blazer|kurtka|plaszcz|marynarka/.test(blob)) return 'outerwear'
  if (/shirt|blouse|top|tee|polo|sweater|hoodie|koszulk|bluzk|sweter/.test(blob)) return 'top'

  const zone = resolveItemBodyZone(item)
  if (zone === 'full') return 'one_piece'
  if (zone === 'feet') return 'footwear'
  if (zone === 'legs') return 'bottom'
  if (zone === 'torso') return 'top'
  return 'other'
}

/**
 * Count items per outfit slot.
 * @param {object[]} items
 * @returns {Record<OutfitSlot, number>}
 */
export function countSlots(items) {
  const counts = {
    one_piece: 0,
    top: 0,
    bottom: 0,
    footwear: 0,
    outerwear: 0,
    other: 0,
  }
  for (const item of items ?? []) {
    const slot = resolveOutfitSlot(item)
    counts[slot] = (counts[slot] ?? 0) + 1
  }
  return counts
}

/**
 * Classify a complete outfit combo by its dominant formula.
 * @param {object[]} items
 * @returns {'one_piece'|'classic'|null}
 */
export function classifyOutfitFormula(items) {
  const slots = new Set((items ?? []).map(resolveOutfitSlot))
  if (slots.has('one_piece') && slots.has('footwear')) return 'one_piece'
  if (slots.has('top') && slots.has('bottom') && slots.has('footwear')) return 'classic'
  return null
}

/**
 * Missing slots that block any complete outfit.
 * @param {Record<string, number>} slotCounts
 * @returns {string[]}
 */
export function missingPairingSlots(slotCounts) {
  const missing = []
  const hasOnePiecePath = (slotCounts.one_piece ?? 0) > 0 && (slotCounts.footwear ?? 0) > 0
  const hasClassicPath =
    (slotCounts.top ?? 0) > 0 &&
    (slotCounts.bottom ?? 0) > 0 &&
    (slotCounts.footwear ?? 0) > 0

  if (hasOnePiecePath || hasClassicPath) return missing

  if ((slotCounts.footwear ?? 0) === 0) missing.push('footwear')
  if ((slotCounts.one_piece ?? 0) === 0) {
    if ((slotCounts.top ?? 0) === 0) missing.push('top')
    if ((slotCounts.bottom ?? 0) === 0) missing.push('bottom')
  }
  return missing
}
