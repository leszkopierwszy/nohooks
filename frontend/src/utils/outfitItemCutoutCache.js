import { prepareSetItemCutout } from './outfitSetComposer'
import { resolveStorageUrl } from '../api/media'

/** Bust cache when cutout algorithm changes. */
const CACHE_VERSION = 'v3-studio-gray'

/** @type {Map<string, Promise<{ previewUrl: string, file: File }>>} */
const inflight = new Map()

/** @type {Map<string, { previewUrl: string, file: File }>} */
const cache = new Map()

function itemCacheKey(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? ''
  const url = resolveStorageUrl(raw) ?? raw
  return `${CACHE_VERSION}::${item?.id ?? 'x'}::${url}`
}

/**
 * Cached cutout + soft outline for outfit card display.
 * Retries with studio-gray / light profiles when the first pass barely removes background.
 */
export async function getOutfitItemCutout(item) {
  const key = itemCacheKey(item)
  if (cache.has(key)) {
    return cache.get(key)
  }
  if (inflight.has(key)) {
    return inflight.get(key)
  }

  const job = (async () => {
    let piece = await prepareSetItemCutout(item, {
      outlineRadius: 2.5,
      outlineStrength: 0.78,
    })

    let ratio = await estimateOpaqueRatio(piece.previewUrl)

    // Szare studio — nie używaj lightProduct (zakłada biel ~248)
    if (ratio > 0.72) {
      URL.revokeObjectURL(piece.previewUrl)
      piece = await prepareSetItemCutout(item, {
        outlineRadius: 2.5,
        outlineStrength: 0.78,
        forceStudioGray: true,
      })
      ratio = await estimateOpaqueRatio(piece.previewUrl)
    }

    if (ratio > 0.88) {
      URL.revokeObjectURL(piece.previewUrl)
      piece = await prepareSetItemCutout(item, {
        outlineRadius: 2.5,
        outlineStrength: 0.78,
        colorHint: item?.color ?? 'white',
        forceLight: true,
      })
    }

    const entry = { previewUrl: piece.previewUrl, file: piece.file }
    cache.set(key, entry)
    return entry
  })()

  inflight.set(key, job)
  try {
    return await job
  } finally {
    inflight.delete(key)
  }
}

async function estimateOpaqueRatio(previewUrl) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.onload = () => resolve(el)
    el.onerror = reject
    el.src = previewUrl
  })
  const w = Math.min(160, img.naturalWidth)
  const h = Math.max(1, Math.round((img.naturalHeight / img.naturalWidth) * w))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)
  let opaque = 0
  const total = w * h
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] > 16) opaque += 1
  }
  return opaque / total
}

export function peekOutfitItemCutout(item) {
  return cache.get(itemCacheKey(item))?.previewUrl ?? null
}

export function clearOutfitItemCutoutCache() {
  for (const entry of cache.values()) {
    URL.revokeObjectURL(entry.previewUrl)
  }
  cache.clear()
  inflight.clear()
}
