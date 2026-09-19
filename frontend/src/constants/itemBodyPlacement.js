/**
 * Hierarchia ubrań względem ciała — flat-lay outfitów.
 *
 * body_zone: head (góra) | torso (środek) | legs (nogi) | feet (stopy) | full (całość)
 * wear_layer: outer → mid → base → accent
 */

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

/** @type {Record<string, [string, string]>} */
const CATEGORY_MAP = {
  czapka: ['head', 'outer'],
  szalik: ['head', 'mid'],
  rekawiczki: ['head', 'accent'],
  okulary: ['head', 'accent'],
  kolczyki: ['head', 'accent'],
  bizuteria: ['head', 'accent'],
  naszyjnik: ['head', 'accent'],
  kurtka: ['torso', 'outer'],
  marynarka: ['torso', 'outer'],
  plaszcz: ['torso', 'outer'],
  bluza: ['torso', 'mid'],
  sweter: ['torso', 'mid'],
  cardigan: ['torso', 'mid'],
  koszulka: ['torso', 'base'],
  't-shirt': ['torso', 'base'],
  polowka: ['torso', 'base'],
  koszula: ['torso', 'base'],
  top: ['torso', 'base'],
  bielizna: ['torso', 'base'],
  spodnie: ['legs', 'mid'],
  jeansy: ['legs', 'mid'],
  szorty: ['legs', 'mid'],
  spodnica: ['legs', 'mid'],
  legginsy: ['legs', 'base'],
  rajstopy: ['legs', 'base'],
  skarpety: ['feet', 'base'],
  buty: ['feet', 'outer'],
  sneakers: ['feet', 'outer'],
  trampki: ['feet', 'outer'],
  sukienka: ['full', 'mid'],
  garnitur: ['full', 'outer'],
  dres: ['full', 'mid'],
  pizama: ['full', 'base'],
  kombinezon: ['full', 'mid'],
}

export function inferBodyPlacement(category, collectionName = '') {
  const cat = String(category ?? '')
    .trim()
    .toLowerCase()
  if (cat && CATEGORY_MAP[cat]) {
    return { body_zone: CATEGORY_MAP[cat][0], wear_layer: CATEGORY_MAP[cat][1] }
  }

  const group = String(collectionName ?? '')
    .trim()
    .toLowerCase()
  if (group === 'shoes' || group === 'obuwie' || group === 'footwear') {
    return { body_zone: 'feet', wear_layer: 'outer' }
  }
  if (/akcesor|accessor|bag|torb|bi[zż]uter/.test(group)) {
    return { body_zone: 'head', wear_layer: 'accent' }
  }

  return { body_zone: null, wear_layer: null }
}

export function resolveItemBodyZone(item) {
  if (item?.body_zone) return item.body_zone
  const group = item?.collection_group?.name ?? item?.collectionGroup?.name ?? ''
  return inferBodyPlacement(item?.category, group).body_zone
}

export function resolveItemWearLayer(item) {
  if (item?.wear_layer) return item.wear_layer
  const group = item?.collection_group?.name ?? item?.collectionGroup?.name ?? ''
  return inferBodyPlacement(item?.category, group).wear_layer
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

/**
 * Podział pod flat-lay: lewa kolumna (główne warstwy), prawa (akcenty / stopy).
 */
export function splitOutfitItemsForFlatLay(items = []) {
  const sorted = [...items].sort(compareItemsByBodyHierarchy)

  const mains = []
  const side = []

  for (const item of sorted) {
    const zone = resolveItemBodyZone(item)
    const layer = resolveItemWearLayer(item)

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
    // torby / nieokreślone akcenty
    if (!zone && layer === 'accent') {
      side.push(item)
      continue
    }

    mains.push(item)
  }

  // Fallback: jeśli wszystko poszło na side, przenieś 1–2 pierwsze do mains
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
    // legacy keys used by older callers
    tops: mains.filter((i) => ['torso', 'head', 'full'].includes(resolveItemBodyZone(i))),
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
