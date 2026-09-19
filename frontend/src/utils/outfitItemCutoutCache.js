import { prepareSetItemCutout } from './outfitSetComposer'
import { resolveStorageUrl } from '../api/media'
import {
  estimateCutoutOpaqueRatio,
  isCutoutOpaqueRatioOk,
} from './preparePersistedOutfitCutout'

/** Bust cache when cutout algorithm changes. */
const CACHE_VERSION = 'v5-light-first'

/** @type {Map<string, Promise<{ previewUrl: string, file: File|null, persisted?: boolean }>>} */
const inflight = new Map()

/** @type {Map<string, { previewUrl: string, file: File|null, persisted?: boolean }>} */
const cache = new Map()

export function itemPersistedCutoutUrl(item) {
  const raw =
    item?.cutout_image_url ??
    item?.images?.[0]?.cutout_url ??
    null
  return resolveStorageUrl(raw) ?? raw
}

function itemCacheKey(item) {
  const persisted = itemPersistedCutoutUrl(item) ?? ''
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? ''
  const url = resolveStorageUrl(raw) ?? raw
  return `${CACHE_VERSION}::${item?.id ?? 'x'}::${persisted || url}`
}

/**
 * Prefer a good server cutout; otherwise generate client-side (legacy / bad white cutouts).
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
    const persisted = itemPersistedCutoutUrl(item)
    if (persisted) {
      try {
        const ratio = await estimateCutoutOpaqueRatio(persisted)
        if (isCutoutOpaqueRatioOk(ratio)) {
          const entry = { previewUrl: persisted, file: null, persisted: true }
          cache.set(key, entry)
          return entry
        }
      } catch {
        // fall through to client cutout
      }
    }

    let piece = await prepareSetItemCutout(item, {
      forceRegenerate: true,
      outlineRadius: 2,
      outlineStrength: 0.55,
      colorHint: item?.color ?? null,
    })

    let ratio = await estimateCutoutOpaqueRatio(piece.previewUrl)

    if (!isCutoutOpaqueRatioOk(ratio) || ratio > 0.68) {
      URL.revokeObjectURL(piece.previewUrl)
      piece = await prepareSetItemCutout(item, {
        forceRegenerate: true,
        outlineRadius: 2,
        outlineStrength: 0.55,
        colorHint: item?.color ?? 'white',
        forceLight: true,
      })
      ratio = await estimateCutoutOpaqueRatio(piece.previewUrl)
    }

    if (!isCutoutOpaqueRatioOk(ratio) && ratio > 0.72) {
      URL.revokeObjectURL(piece.previewUrl)
      piece = await prepareSetItemCutout(item, {
        forceRegenerate: true,
        outlineRadius: 2,
        outlineStrength: 0.55,
        forceStudioGray: true,
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

export function peekOutfitItemCutout(item) {
  return cache.get(itemCacheKey(item))?.previewUrl ?? null
}

export function clearOutfitItemCutoutCache() {
  for (const entry of cache.values()) {
    if (entry.previewUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(entry.previewUrl)
    }
  }
  cache.clear()
  inflight.clear()
}
