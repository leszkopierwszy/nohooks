import { isClothingCollection, isShoesCollection } from '../constants/itemSizes'

const TOP_RE =
  /\b(bluza|koszulka|t-?shirt|kurtka|marynarka|polowka|polo|blazer|jacket|coat|hoodie|sweater|sweter|top|shirt|blouse|cardigan|vest|kamizelka)\b/i

const BOTTOM_RE =
  /\b(spodnie|jeansy?|szorty|spodnica|skirt|shorts|trousers|pants|chino|leggins)/i

const ONE_PIECE_RE =
  /\b(sukienka|dress|garnitur|suit|romper|jumpsuit|kombinezon|dres)\b/i

const SHOE_RE =
  /\b(buty|obuwie|shoes?|footwear|loafers?|sneakers?|boots?|trampki|sanda(?:ly|ły)|heels?)\b/i

function haystack(item) {
  return [
    item?.category,
    item?.collection_group?.name,
    item?.collectionGroup?.name,
    item?.name,
  ]
    .filter(Boolean)
    .join(' ')
}

function collectionName(item) {
  return item?.collection_group?.name ?? item?.collectionGroup?.name ?? ''
}

/**
 * @param {object[]} items
 * @returns {{ tops: object[], bottoms: object[], onePieces: object[], accessories: object[] }}
 */
export function splitOutfitItemsForFlatLay(items = []) {
  const tops = []
  const bottoms = []
  const onePieces = []
  const accessories = []
  const clothingUnknown = []

  for (const item of items) {
    const text = haystack(item)
    const group = collectionName(item)

    if (isShoesCollection(group) || SHOE_RE.test(text)) {
      accessories.push(item)
      continue
    }
    if (ONE_PIECE_RE.test(text)) {
      onePieces.push(item)
      continue
    }
    if (TOP_RE.test(text)) {
      tops.push(item)
      continue
    }
    if (BOTTOM_RE.test(text)) {
      bottoms.push(item)
      continue
    }
    if (isClothingCollection(group)) {
      clothingUnknown.push(item)
      continue
    }
    accessories.push(item)
  }

  // Unknown clothing: first → top, rest alternate bottom/top
  clothingUnknown.forEach((item, index) => {
    if (index % 2 === 0) tops.push(item)
    else bottoms.push(item)
  })

  return { tops, bottoms, onePieces, accessories }
}
