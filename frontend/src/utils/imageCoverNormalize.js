/**
 * Wyrównuje wielkość i pozycję produktu w kwadracie covera (lista / katalog).
 * Dolna linia styczna obrysu (baseline) — tylko metadane do layoutu, nie renderowana.
 */

import { toAbsoluteMediaUrl } from '../api/media'

const ANALYSIS_MAX = 320
const transformCache = new Map()
const MAX_CACHE = 200
const CACHE_VERSION = 'v6'
const BBOX_PADDING = 0.14
const MIN_ROTATE_DEG = 1.25
const MAX_ROTATE_DEG = 10

function cacheGet(key) {
  return transformCache.get(key) ?? null
}

function cacheSet(key, value) {
  if (transformCache.size >= MAX_CACHE) {
    const first = transformCache.keys().next().value
    transformCache.delete(first)
  }
  transformCache.set(key, value)
}

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrl = null

    if (typeof source === 'string') {
      const src = toAbsoluteMediaUrl(source) ?? source
      if (!src.startsWith('blob:') && !src.startsWith('data:')) {
        try {
          const parsed = new URL(src, window.location.origin)
          if (parsed.origin !== window.location.origin) {
            img.crossOrigin = 'anonymous'
          }
        } catch {
          // ignore
        }
      }
      img.src = src
    } else {
      objectUrl = URL.createObjectURL(source)
      img.src = objectUrl
    }

    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      reject(new Error('Nie udało się wczytać obrazu.'))
    }
  })
}

function colorDistance(r, g, b, bg) {
  return Math.sqrt((r - bg[0]) ** 2 + (g - bg[1]) ** 2 + (b - bg[2]) ** 2)
}

function sampleEdgeBackground(data, width, height) {
  const strip = Math.max(2, Math.min(16, Math.floor(Math.min(width, height) * 0.06)))
  const step = Math.max(1, Math.floor(Math.min(width, height) / 28))
  const samples = []

  const add = (x, y) => {
    const i = (y * width + x) * 4
    if (data[i + 3] < 128) return
    samples.push([data[i], data[i + 1], data[i + 2]])
  }

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < strip; y++) add(x, y)
    for (let y = height - strip; y < height; y++) add(x, y)
  }
  for (let y = strip; y < height - strip; y += step) {
    for (let x = 0; x < strip; x++) add(x, y)
    for (let x = width - strip; x < width; x++) add(x, y)
  }

  if (!samples.length) return [255, 255, 255]

  let r = 0
  let g = 0
  let b = 0
  for (const [sr, sg, sb] of samples) {
    r += sr
    g += sg
    b += sb
  }
  const n = samples.length
  return [r / n, g / n, b / n]
}

function buildBackgroundMask(data, width, height, bg, threshold) {
  const n = width * height
  const similarToBg = new Uint8Array(n)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const idx = y * width + x
      if (data[i + 3] < 20) {
        similarToBg[idx] = 1
        continue
      }
      if (colorDistance(data[i], data[i + 1], data[i + 2], bg) <= threshold) {
        similarToBg[idx] = 1
      }
    }
  }

  const isBackground = new Uint8Array(n)
  const visited = new Uint8Array(n)
  const queue = []

  const tryAdd = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return
    const idx = y * width + x
    if (visited[idx] || !similarToBg[idx]) return
    visited[idx] = 1
    queue.push(idx)
  }

  for (let x = 0; x < width; x++) {
    tryAdd(x, 0)
    tryAdd(x, height - 1)
  }
  for (let y = 0; y < height; y++) {
    tryAdd(0, y)
    tryAdd(width - 1, y)
  }

  while (queue.length) {
    const idx = queue.pop()
    isBackground[idx] = 1
    const x = idx % width
    const y = (idx - x) / width
    tryAdd(x + 1, y)
    tryAdd(x - 1, y)
    tryAdd(x, y + 1)
    tryAdd(x, y - 1)
  }

  return isBackground
}

function foregroundFromAlpha(data, width, height) {
  const fg = new Uint8Array(width * height)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] > 128) {
        fg[y * width + x] = 1
      }
    }
  }
  return fg
}

function maskBounds(fg, width, height) {
  let count = 0
  let minX = width
  let minY = height
  let maxX = 0
  let maxY = 0

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!fg[y * width + x]) continue
      count++
      if (x < minX) minX = x
      if (y < minY) minY = y
      if (x > maxX) maxX = x
      if (y > maxY) maxY = y
    }
  }

  return { count, minX, minY, maxX, maxY }
}

function expandNormalizedBounds(minX, maxX, minY, maxY, padding) {
  const w = maxX - minX
  const h = maxY - minY
  const px = w * padding
  const py = h * padding
  return {
    minX: Math.max(0, minX - px),
    maxX: Math.min(1, maxX + px),
    minY: Math.max(0, minY - py),
    maxY: Math.min(1, maxY + py),
  }
}

function objectContainLayout(imgAspect, boxAspect = 1) {
  if (imgAspect >= boxAspect) {
    const fitH = boxAspect / imgAspect
    return { fitW: 1, fitH, offsetX: 0, offsetY: (1 - fitH) / 2 }
  }
  const fitW = imgAspect / boxAspect
  return { fitW, fitH: 1, offsetX: (1 - fitW) / 2, offsetY: 0 }
}

/**
 * Dolna linia styczna obrysu: dopasowanie do „podpórki” sylwetki (niewidoczna).
 * Współrzędne znormalizowane 0–1 względem obrazu; y = slope * x + intercept.
 */
export function detectBottomBaseline(fg, width, height, stats) {
  const { minX, maxX, minY, maxY } = stats
  const normCenterX = (minX + maxX + 1) / 2 / width
  const normMaxY = (maxY + 1) / height

  const spanX = maxX - minX + 1
  const step = Math.max(1, Math.floor(spanX / 56))
  const contour = []

  for (let x = minX; x <= maxX; x += step) {
    let bottomY = -1
    for (let y = maxY; y >= minY; y -= 1) {
      if (fg[y * width + x]) {
        bottomY = y
        break
      }
    }
    if (bottomY >= 0) {
      contour.push({ x: x / width, y: (bottomY + 1) / height })
    }
  }

  if (contour.length < 4) {
    return {
      slope: 0,
      intercept: normMaxY,
      centerX: normCenterX,
      centerY: normMaxY,
      angleDeg: 0,
      left: { x: minX / width, y: normMaxY },
      right: { x: (maxX + 1) / width, y: normMaxY },
      source: 'bbox',
    }
  }

  const yValues = contour.map((p) => p.y).sort((a, b) => a - b)
  const yCutoff = yValues[Math.min(yValues.length - 1, Math.floor(yValues.length * 0.35))]
  const lower = contour.filter((p) => p.y >= yCutoff - 0.002)

  const pts = lower.length >= 4 ? lower : contour

  let sumX = 0
  let sumY = 0
  let sumXX = 0
  let sumXY = 0
  const n = pts.length

  for (const p of pts) {
    sumX += p.x
    sumY += p.y
    sumXX += p.x * p.x
    sumXY += p.x * p.y
  }

  const denom = n * sumXX - sumX * sumX
  let slope = 0
  let intercept = sumY / n

  if (Math.abs(denom) > 1e-10) {
    slope = (n * sumXY - sumX * sumY) / denom
    intercept = (sumY - slope * sumX) / n
  }

  const leftX = pts[0].x
  const rightX = pts[pts.length - 1].x
  const leftY = slope * leftX + intercept
  const rightY = slope * rightX + intercept

  const dxPx = (rightX - leftX) * width
  const dyPx = (rightY - leftY) * height
  const angleDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI

  const centerX = normCenterX
  const centerY = Math.min(1, Math.max(0, slope * centerX + intercept))

  return {
    slope,
    intercept,
    centerX,
    centerY,
    angleDeg,
    left: { x: leftX, y: leftY },
    right: { x: rightX, y: rightY },
    source: 'tangent',
  }
}

async function analyzeForeground(imageSource, { threshold = 26 } = {}) {
  const img = await loadImage(imageSource)
  const natW = img.naturalWidth
  const natH = img.naturalHeight
  const imgAspect = natW / natH
  const scale = Math.min(1, ANALYSIS_MAX / Math.max(natW, natH))
  const width = Math.max(1, Math.round(natW * scale))
  const height = Math.max(1, Math.round(natH * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)

  let transparent = 0
  const total = width * height
  for (let i = 0; i < total; i++) {
    if (data[i * 4 + 3] < 250) transparent++
  }

  let fg
  if (transparent / total > 0.04) {
    fg = foregroundFromAlpha(data, width, height)
  } else {
    const bg = sampleEdgeBackground(data, width, height)
    const isBackground = buildBackgroundMask(data, width, height, bg, threshold)
    fg = new Uint8Array(total)
    for (let i = 0; i < total; i++) {
      fg[i] = isBackground[i] ? 0 : 1
    }
  }

  const stats = maskBounds(fg, width, height)
  const baseline = detectBottomBaseline(fg, width, height, stats)

  return { stats, width, height, imgAspect, baseline }
}

/** Tylko metadane linii stycznej (bez transformacji CSS). */
export async function getObjectBaseline(imageSource, options = {}) {
  const { baseline } = await analyzeForeground(imageSource, options)
  return baseline
}

/**
 * @returns {Promise<{ transform: string, transformOrigin: string, baseline: object } | null>}
 */
export async function computeCoverNormalizeTransform(
  imageSource,
  {
    fill = 0.66,
    threshold = 26,
    bboxPadding = BBOX_PADDING,
    align = 'bottom',
    bottomY = 0.9,
    centerY = 0.5,
    levelBaseline = false,
  } = {}
) {
  if (!imageSource) return null

  const cacheKey =
    typeof imageSource === 'string'
      ? `${CACHE_VERSION}:${imageSource}:${fill}:${align}:${levelBaseline}`
      : null
  if (cacheKey) {
    const cached = cacheGet(cacheKey)
    if (cached) return cached
  }

  const { stats, width, height, imgAspect, baseline } = await analyzeForeground(imageSource, {
    threshold,
  })

  if (!stats.count || stats.count < width * height * 0.008) {
    return null
  }

  let normMinX = stats.minX / width
  let normMaxX = (stats.maxX + 1) / width
  let normMinY = stats.minY / height
  let normMaxY = (stats.maxY + 1) / height

  const rawW = Math.max(0.08, normMaxX - normMinX)
  const rawH = Math.max(0.08, normMaxY - normMinY)
  // Tall / near-full-frame objects (dresses) need less padding so they don't shrink too much.
  const padding =
    rawH > 0.82 || rawW > 0.82 ? Math.min(bboxPadding, 0.06) : bboxPadding
  const expanded = expandNormalizedBounds(normMinX, normMaxX, normMinY, normMaxY, padding)
  normMinX = expanded.minX
  normMaxX = expanded.maxX
  normMinY = expanded.minY
  normMaxY = expanded.maxY

  const boxW = Math.max(0.08, normMaxX - normMinX)
  const boxH = Math.max(0.08, normMaxY - normMinY)
  const cx = (normMinX + normMaxX) / 2
  const cy = (normMinY + normMaxY) / 2

  const { fitW, fitH, offsetX, offsetY } = objectContainLayout(imgAspect, 1)

  const objW = boxW * fitW
  const objH = boxH * fitH
  let scale = fill / Math.max(objW, objH)
  scale = Math.min(1.35, Math.max(0.5, scale))

  // Prefer center for near-full-frame subjects even if caller asked for bottom.
  const useBottom = align === 'bottom' && boxH < 0.82
  const anchorNormX = useBottom ? baseline.centerX : cx
  const anchorNormY = useBottom ? baseline.centerY : cy
  const targetX = 0.5
  const targetY = useBottom ? bottomY : centerY

  const anchorX = offsetX + anchorNormX * fitW
  const anchorY = offsetY + anchorNormY * fitH

  const tx = ((targetX - anchorX) / fitW) * 100
  const ty = ((targetY - anchorY) / fitH) * 100

  let rotateDeg = 0
  if (useBottom && levelBaseline && Math.abs(baseline.angleDeg) >= MIN_ROTATE_DEG) {
    rotateDeg = Math.max(-MAX_ROTATE_DEG, Math.min(MAX_ROTATE_DEG, -baseline.angleDeg))
  }

  const originX = (anchorNormX * 100).toFixed(2)
  const originY = (anchorNormY * 100).toFixed(2)

  const parts = [`translate(${tx.toFixed(3)}%, ${ty.toFixed(3)}%)`]
  if (rotateDeg !== 0) {
    parts.push(`rotate(${rotateDeg.toFixed(3)}deg)`)
  }
  parts.push(`scale(${scale.toFixed(4)})`)

  const result = {
    transform: parts.join(' '),
    transformOrigin: `${originX}% ${originY}%`,
    baseline,
  }

  if (cacheKey) cacheSet(cacheKey, result)
  return result
}
