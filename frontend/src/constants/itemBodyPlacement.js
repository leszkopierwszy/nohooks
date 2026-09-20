/**
 * Hierarchia ubrań względem ciała — flat-lay outfitów.
 *
 * Canonical clothing types are English (`skirt`, `tights`, …).
 * Legacy PL category values are mapped via aliases, then placement is looked up.
 *
 * body_zone: head | torso | legs | feet | full
 * wear_layer: outer → mid → base → accent
 */

import { resolveCanonicalClothingType } from './itemClothingTypes.js'

export const BODY_ZONES = [
  { value: 'head', labelKey: 'item.bodyZones.head', order: 10 },
  { value: 'torso', labelKey: 'item.bodyZones.torso', order: 20 },
  { value: 'full', labelKey: 'item.bodyZones.full', order: 25 },
  { value: 'legs', labelKey: 'item.bodyZones.legs', order: 30 },
  { value: 'feet', labelKey: 'item.bodyZones.feet', order: 40 },
]

export const WEAR_LAYERS = [
  { value: 'outer', labelKey: 'item.wearLayers.outer', order: 10 },
  { value: 'mid', labelKey: 'item.wearLayers.mid', order: 20 },
  { value: 'base', labelKey: 'item.wearLayers.base', order: 30 },
  { value: 'accent', labelKey: 'item.wearLayers.accent', order: 40 },
]

const ZONE_ORDER = Object.fromEntries(BODY_ZONES.map((z) => [z.value, z.order]))
const LAYER_ORDER = Object.fromEntries(WEAR_LAYERS.map((l) => [l.value, l.order]))

export function normalizePlacementKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ł/g, 'l')
}

/** English canonical type → [body_zone, wear_layer] */
const TYPE_PLACEMENT = {
  hat: ['head', 'outer'],
  scarf: ['head', 'mid'],
  gloves: ['head', 'accent'],
  glasses: ['head', 'accent'],
  earrings: ['head', 'accent'],
  jewelry: ['head', 'accent'],
  necklace: ['head', 'accent'],
  jacket: ['torso', 'outer'],
  coat: ['torso', 'outer'],
  blazer: ['torso', 'outer'],
  hoodie: ['torso', 'mid'],
  sweatshirt: ['torso', 'mid'],
  sweater: ['torso', 'mid'],
  cardigan: ['torso', 'mid'],
  't-shirt': ['torso', 'base'],
  tshirt: ['torso', 'base'],
  polo: ['torso', 'base'],
  shirt: ['torso', 'base'],
  top: ['torso', 'base'],
  underwear: ['torso', 'base'],
  pants: ['legs', 'mid'],
  jeans: ['legs', 'mid'],
  shorts: ['legs', 'mid'],
  skirt: ['legs', 'mid'],
  leggings: ['legs', 'base'],
  tights: ['legs', 'base'],
  socks: ['feet', 'base'],
  shoes: ['feet', 'outer'],
  sneakers: ['feet', 'outer'],
  boots: ['feet', 'outer'],
  dress: ['full', 'mid'],
  suit: ['full', 'outer'],
  tracksuit: ['full', 'mid'],
  pajamas: ['full', 'base'],
  jumpsuit: ['full', 'mid'],
}

/**
 * English (and a few universal) stems in product titles / slugs.
 * Prefer selecting an English clothing type in the form; this is fallback only.
 */
const TEXT_RULES = [
  { re: /pantyhose|hosiery|(^|[^a-z])tights([^a-z]|$)/, type: 'tights' },
  { re: /leggings?/, type: 'leggings' },
  { re: /skort|skirt/, type: 'skirt' },
  { re: /(^|[^a-z])dress(es)?([^a-z]|$)/, type: 'dress' },
  { re: /jumpsuit|romper/, type: 'jumpsuit' },
  { re: /jeans/, type: 'jeans' },
  { re: /trousers|pants|shorts/, type: 'pants' },
  { re: /t-?shirts?|tee\b/, type: 't-shirt' },
  { re: /hoodie|sweatshirt/, type: 'hoodie' },
  { re: /sweater|cardigan|jumper/, type: 'sweater' },
  { re: /blazer/, type: 'blazer' },
  { re: /\bcoats?\b|\bjackets?\b/, type: 'jacket' },
  { re: /\bboots?\b|sneakers?|loafers?|heels?|sandals?/, type: 'shoes' },
  { re: /\bsocks?\b/, type: 'socks' },
  { re: /pajamas?|pyjamas?/, type: 'pajamas' },
  { re: /\bhats?\b|\bcaps?\b/, type: 'hat' },
  { re: /\bscar(?:f|ves)\b/, type: 'scarf' },
  { re: /\bgloves?\b/, type: 'gloves' },
]

/** Product-title language hints → English type (UI stays English-only). */
const NAME_TYPE_HINTS = [
  { re: /rajstop/, type: 'tights' },
  { re: /leggins/, type: 'leggings' },
  { re: /spodnicospod|spodnic/, type: 'skirt' },
  { re: /sukienk/, type: 'dress' },
  { re: /kombinezon/, type: 'jumpsuit' },
  { re: /spodnie|szorty/, type: 'pants' },
  { re: /koszulk/, type: 't-shirt' },
  { re: /bluza/, type: 'hoodie' },
  { re: /sweter/, type: 'sweater' },
  { re: /kurtka|plaszcz|marynarka/, type: 'jacket' },
  { re: /botki|trampki|\bbuty\b/, type: 'shoes' },
  { re: /skarpety/, type: 'socks' },
  { re: /czapka/, type: 'hat' },
  { re: /szalik/, type: 'scarf' },
  { re: /rekawiczki/, type: 'gloves' },
  { re: /pizama/, type: 'pajamas' },
  { re: /dres/, type: 'tracksuit' },
  { re: /bielizna/, type: 'underwear' },
]

function placement(zone, layer) {
  return { body_zone: zone, wear_layer: layer }
}

function placementForType(type) {
  if (!type || !TYPE_PLACEMENT[type]) return null
  const [zone, layer] = TYPE_PLACEMENT[type]
  return placement(zone, layer)
}

function matchTextToType(text) {
  const n = normalizePlacementKey(text)
  if (!n) return null
  for (const rule of TEXT_RULES) {
    if (rule.re.test(n)) return rule.type
  }
  for (const rule of NAME_TYPE_HINTS) {
    if (rule.re.test(n)) return rule.type
  }
  return null
}

export function inferBodyPlacement(category, collectionName = '', itemName = '') {
  const fromCategory = resolveCanonicalClothingType(category)
  if (fromCategory) {
    const hit = placementForType(fromCategory)
    if (hit) return hit
  }

  const fromNameType = matchTextToType(itemName)
  if (fromNameType) {
    const hit = placementForType(fromNameType)
    if (hit) return hit
  }

  const fromSlugType = matchTextToType(category)
  if (fromSlugType) {
    const hit = placementForType(fromSlugType)
    if (hit) return hit
  }

  const group = normalizePlacementKey(collectionName)
  if (group === 'shoes' || group === 'obuwie' || group === 'footwear') {
    return placement('feet', 'outer')
  }
  if (/accessor|bag|jewelry|jewellery/.test(group)) {
    return placement('head', 'accent')
  }

  return { body_zone: null, wear_layer: null }
}

export function resolveItemBodyZone(item) {
  const group = item?.collection_group?.name ?? item?.collectionGroup?.name ?? ''
  const inferred = inferBodyPlacement(item?.category, group, item?.name)
  if (inferred.body_zone) return inferred.body_zone
  return item?.body_zone ?? null
}

export function resolveItemWearLayer(item) {
  const group = item?.collection_group?.name ?? item?.collectionGroup?.name ?? ''
  const inferred = inferBodyPlacement(item?.category, group, item?.name)
  if (inferred.wear_layer) return inferred.wear_layer
  return item?.wear_layer ?? null
}

export function isLegsBaseLayer(item) {
  return (
    resolveItemBodyZone(item) === 'legs' &&
    resolveItemWearLayer(item) === 'base'
  )
}

export function compareItemsByBodyHierarchy(a, b) {
  const za = ZONE_ORDER[resolveItemBodyZone(a)] ?? 99
  const zb = ZONE_ORDER[resolveItemBodyZone(b)] ?? 99
  if (za !== zb) return za - zb
  const la = LAYER_ORDER[resolveItemWearLayer(a)] ?? 99
  const lb = LAYER_ORDER[resolveItemWearLayer(b)] ?? 99
  if (la !== lb) return la - lb
  return Number(a?.id ?? 0) - Number(b?.id ?? 0)
}

export function splitOutfitItemsForFlatLay(items = []) {
  const sorted = [...items].sort(compareItemsByBodyHierarchy)

  const mains = []
  const side = []

  for (const item of sorted) {
    const zone = resolveItemBodyZone(item)
    const layer = resolveItemWearLayer(item)

    if (isLegsBaseLayer(item)) {
      side.push(item)
      continue
    }
    if (zone === 'head' && layer === 'accent') {
      side.push(item)
      continue
    }
    if (zone === 'feet') {
      side.push(item)
      continue
    }
    if (layer === 'accent' && zone !== 'torso') {
      side.push(item)
      continue
    }
    if (!zone && layer === 'accent') {
      side.push(item)
      continue
    }

    mains.push(item)
  }

  if (!mains.length && side.length) {
    const take = Math.min(2, side.length)
    return {
      mains: side.slice(0, take),
      side: side.slice(take),
      byZone: groupByZone(sorted),
    }
  }

  return {
    mains,
    side,
    byZone: groupByZone(sorted),
    tops: mains.filter((i) =>
      ['torso', 'head', 'full'].includes(resolveItemBodyZone(i)),
    ),
    bottoms: mains.filter((i) => resolveItemBodyZone(i) === 'legs'),
    onePieces: mains.filter((i) => resolveItemBodyZone(i) === 'full'),
    accessories: side,
  }
}

function groupByZone(items) {
  const map = { head: [], torso: [], full: [], legs: [], feet: [], other: [] }
  for (const item of items) {
    const zone = resolveItemBodyZone(item) ?? 'other'
    if (!map[zone]) map[zone] = []
    map[zone].push(item)
  }
  for (const key of Object.keys(map)) {
    map[key].sort(compareItemsByBodyHierarchy)
  }
  return map
}
