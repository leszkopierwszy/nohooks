import { ITEM_IMAGE_SURFACE_BG, isPngLikeImageUrl } from '../api/media'

const FALLBACK_BG = '#f3f4f6'
const cache = new Map()
const MAX_CACHE = 128

function cacheGet(url) {
  return cache.get(url) ?? null
}

function cacheSet(url, color) {
  if (cache.size >= MAX_CACHE) {
    const first = cache.keys().next().value
    cache.delete(first)
  }
  cache.set(url, color)
}

function sampleEdgePixels(ctx, width, height) {
  const strip = Math.max(1, Math.min(12, Math.floor(Math.min(width, height) * 0.04)))
  const step = Math.max(1, Math.floor(Math.min(width, height) / 24))
  const samples = []
  let transparent = 0
  let total = 0

  const add = (x, y) => {
    total++
    const { data } = ctx.getImageData(x, y, 1, 1)
    if (data[3] < 128) {
      transparent++
      return
    }
    samples.push([data[0], data[1], data[2]])
  }

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < strip; y++) add(x, y)
    for (let y = height - strip; y < height; y++) add(x, y)
  }

  for (let y = strip; y < height - strip; y += step) {
    for (let x = 0; x < strip; x++) add(x, y)
    for (let x = width - strip; x < width; x++) add(x, y)
  }

  return {
    samples,
    transparentRatio: total ? transparent / total : 0,
  }
}

function averageRgb(samples) {
  if (!samples.length) return null

  let r = 0
  let g = 0
  let b = 0

  for (const [sr, sg, sb] of samples) {
    r += sr
    g += sg
    b += sb
  }

  const n = samples.length

  return `rgb(${Math.round(r / n)}, ${Math.round(g / n)}, ${Math.round(b / n)})`
}

function imageHasTransparency(ctx, width, height) {
  const step = Math.max(1, Math.floor(Math.min(width, height) / 32))
  let transparent = 0
  let checked = 0

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      checked++
      const a = ctx.getImageData(x, y, 1, 1).data[3]
      if (a < 250) transparent++
    }
  }

  return checked > 0 && transparent / checked > 0.04
}

/**
 * Samples pixels along image edges and returns an average border colour for use as background.
 */
export function detectEdgeBackground(imageUrl) {
  if (!imageUrl) {
    return Promise.resolve(FALLBACK_BG)
  }

  if (isPngLikeImageUrl(imageUrl)) {
    return Promise.resolve(ITEM_IMAGE_SURFACE_BG)
  }

  const cached = cacheGet(imageUrl)
  if (cached) {
    return Promise.resolve(cached)
  }

  return new Promise((resolve) => {
    const img = new Image()

    const isLocal =
      imageUrl.startsWith('blob:') ||
      imageUrl.startsWith('data:') ||
      imageUrl.startsWith('/storage/') ||
      imageUrl.startsWith('/')

    if (!isLocal) {
      try {
        const parsed = new URL(imageUrl, window.location.origin)
        if (parsed.origin !== window.location.origin) {
          img.crossOrigin = 'anonymous'
        }
      } catch {
        // keep default (no CORS) for invalid URLs
      }
    }

    img.onload = () => {
      try {
        const width = img.naturalWidth
        const height = img.naturalHeight

        if (!width || !height) {
          resolve(FALLBACK_BG)
          return
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        ctx.drawImage(img, 0, 0)

        if (imageHasTransparency(ctx, width, height)) {
          cacheSet(imageUrl, ITEM_IMAGE_SURFACE_BG)
          resolve(ITEM_IMAGE_SURFACE_BG)
          return
        }

        const { samples, transparentRatio } = sampleEdgePixels(ctx, width, height)

        if (transparentRatio > 0.35 || !samples.length) {
          cacheSet(imageUrl, ITEM_IMAGE_SURFACE_BG)
          resolve(ITEM_IMAGE_SURFACE_BG)
          return
        }

        const avg = averageRgb(samples)
        const color = avg ?? FALLBACK_BG

        if (avg) {
          const m = avg.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
          if (m) {
            const sum = Number(m[1]) + Number(m[2]) + Number(m[3])
            if (sum < 40) {
              cacheSet(imageUrl, ITEM_IMAGE_SURFACE_BG)
              resolve(ITEM_IMAGE_SURFACE_BG)
              return
            }
          }
        }

        cacheSet(imageUrl, color)
        resolve(color)
      } catch {
        resolve(FALLBACK_BG)
      }
    }

    img.onerror = () => resolve(FALLBACK_BG)
    img.src = imageUrl
  })
}

export { FALLBACK_BG, ITEM_IMAGE_SURFACE_BG }
