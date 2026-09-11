/**
 * Wykrywa obrys produktu (tło z krawędzi + flood-fill) i eksportuje PNG z przezroczystością.
 */

import { toAbsoluteMediaUrl } from '../api/media'

const ANALYSIS_MAX = 1200

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

function pixelRgb(data, idx) {
  const i = idx * 4
  return [data[i], data[i + 1], data[i + 2]]
}

function computeLuminanceSaturation(data, width, height) {
  const n = width * height
  const lum = new Float32Array(n)
  const sat = new Float32Array(n)

  for (let idx = 0; idx < n; idx++) {
    const [r, g, b] = pixelRgb(data, idx)
    lum[idx] = 0.299 * r + 0.587 * g + 0.114 * b
    sat[idx] = Math.max(r, g, b) - Math.min(r, g, b)
  }

  return { lum, sat }
}

/** Gradient luminancji (Sobel uproszczony) — krawędź buta vs płaskie tło. */
function computeGradientMagnitude(lum, width, height) {
  const n = width * height
  const grad = new Float32Array(n)

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x
      const gx =
        -lum[idx - width - 1] -
        2 * lum[idx - 1] -
        lum[idx + width - 1] +
        lum[idx - width + 1] +
        2 * lum[idx + 1] +
        lum[idx + width + 1]
      const gy =
        -lum[idx - width - 1] -
        2 * lum[idx - width] -
        lum[idx - width + 1] +
        lum[idx + width - 1] +
        2 * lum[idx + width] +
        lum[idx + width + 1]
      grad[idx] = Math.sqrt(gx * gx + gy * gy)
    }
  }

  return grad
}

function floodFromMask(seedMask, width, height) {
  const n = width * height
  const reached = new Uint8Array(n)
  const queue = []

  for (let idx = 0; idx < n; idx++) {
    if (!seedMask[idx]) continue
    reached[idx] = 1
    queue.push(idx)
  }

  while (queue.length) {
    const idx = queue.pop()
    const x = idx % width
    const y = (idx - x) / width
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const nidx = ny * width + nx
      if (reached[nidx] || !seedMask[nidx]) continue
      reached[nidx] = 1
      queue.push(nidx)
    }
  }

  return reached
}

/**
 * Białe obuwie na jasnym tle: wąski flood tła od krawędzi + rozszerzanie FG od środka,
 * logo i krawędzi gradientowych (nie polegamy na niskim progu RGB).
 */
function inProductCenterZone(x, y, width, height) {
  const nx = (x / width - 0.5) / 0.44
  const ny = (y / height - 0.5) / 0.4
  return nx * nx + ny * ny < 1
}

function buildForegroundMaskLight(data, width, height, bg) {
  const n = width * height
  const { lum, sat } = computeLuminanceSaturation(data, width, height)
  const grad = computeGradientMagnitude(lum, width, height)

  const strictBgSeed = new Uint8Array(n)
  for (let idx = 0; idx < n; idx++) {
    const i = idx * 4
    if (data[i + 3] < 20) {
      strictBgSeed[idx] = 1
      continue
    }
    const x = idx % width
    const y = (idx - x) / width
    const [r, g, b] = pixelRgb(data, idx)
    const dist = colorDistance(r, g, b, bg)
    const inCenter = inProductCenterZone(x, y, width, height)
    const distLimit = inCenter ? 2.5 : 5
    const lumMin = inCenter ? 250 : 248
    if (
      dist <= distLimit &&
      lum[idx] >= lumMin &&
      sat[idx] <= 8 &&
      grad[idx] <= (inCenter ? 3 : 5)
    ) {
      strictBgSeed[idx] = 1
    }
  }

  const isBackground = floodFromMask(strictBgSeed, width, height)

  const fg = new Uint8Array(n)
  const queue = []

  const trySeed = (idx) => {
    if (fg[idx] || isBackground[idx]) return
    const i = idx * 4
    if (data[i + 3] < 20) return
    fg[idx] = 1
    queue.push(idx)
  }

  for (let idx = 0; idx < n; idx++) {
    const i = idx * 4
    if (data[i + 3] < 20) continue
    if (sat[idx] > 16) trySeed(idx)
    else if (lum[idx] < 232) trySeed(idx)
    else if (grad[idx] >= 12) trySeed(idx)
  }

  const x0 = Math.floor(width * 0.18)
  const x1 = Math.ceil(width * 0.82)
  const y0 = Math.floor(height * 0.1)
  const y1 = Math.ceil(height * 0.9)
  const stepX = Math.max(4, Math.floor((x1 - x0) / 10))
  const stepY = Math.max(4, Math.floor((y1 - y0) / 10))

  for (let y = y0; y <= y1; y += stepY) {
    for (let x = x0; x <= x1; x += stepX) {
      const idx = y * width + x
      if (isBackground[idx]) continue
      if (lum[idx] < 253.5 || grad[idx] > 4) trySeed(idx)
    }
  }

  trySeed(Math.floor(height * 0.5) * width + Math.floor(width * 0.5))

  const canExpand = (idx) => {
    if (fg[idx]) return false
    const i = idx * 4
    if (data[i + 3] < 20) return false
    if (isBackground[idx] && lum[idx] > 249 && sat[idx] < 6 && grad[idx] < 4) {
      return false
    }
    if (lum[idx] > 254.5) return false
    const [r, g, b] = pixelRgb(data, idx)
    const dist = colorDistance(r, g, b, bg)
    if (isBackground[idx] && dist < 3.5 && grad[idx] < 3) return false
    return true
  }

  while (queue.length) {
    const idx = queue.pop()
    const x = idx % width
    const y = (idx - x) / width
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      const nidx = ny * width + nx
      if (!canExpand(nidx)) continue
      fg[nidx] = 1
      queue.push(nidx)
    }
  }

  for (let idx = 0; idx < n; idx++) {
    if (fg[idx] || isBackground[idx]) continue
    const i = idx * 4
    if (data[i + 3] < 20) continue

    let fgNeighbors = 0
    const x = idx % width
    const y = (idx - x) / width
    const check = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of check) {
      if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
      if (fg[ny * width + nx]) fgNeighbors++
    }

    if (fgNeighbors >= 2 && (lum[idx] < 252 || grad[idx] > 6 || sat[idx] > 6)) {
      fg[idx] = 1
    }
  }

  return closeForegroundMask(fg, width, height, 3)
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

/** Maska tła (1 = tło) — flood-fill od krawędzi. */
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

/** Zamknięcie małych dziur w masce pierwszego planu (białe buty po flood-fill). */
function closeForegroundMask(fg, width, height, radius = 2) {
  if (radius <= 0) return fg

  let dilated = fg
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(dilated)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        if (dilated[idx]) continue
        if (
          dilated[idx - 1] ||
          dilated[idx + 1] ||
          dilated[idx - width] ||
          dilated[idx + width]
        ) {
          next[idx] = 1
        }
      }
    }
    dilated = next
  }

  let closed = dilated
  for (let pass = 0; pass < radius; pass++) {
    const next = new Uint8Array(closed)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        if (!closed[idx]) continue
        if (
          !closed[idx - 1] ||
          !closed[idx + 1] ||
          !closed[idx - width] ||
          !closed[idx + width]
        ) {
          next[idx] = 0
        }
      }
    }
    closed = next
  }

  return closed
}

/** Dopisz jasne piksele wewnątrz obiektu (wypełnienia w białym obuwiu). */
function recoverBrightForeground(data, width, height, fg, bg, threshold) {
  const n = width * height
  const stats = maskStats(fg, width, height)
  if (!stats.count) return fg

  const pad = Math.max(4, Math.round(Math.min(width, height) * 0.02))
  const x0 = Math.max(0, stats.minX - pad)
  const y0 = Math.max(0, stats.minY - pad)
  const x1 = Math.min(width - 1, stats.maxX + pad)
  const y1 = Math.min(height - 1, stats.maxY + pad)

  const out = new Uint8Array(fg)
  const queue = []

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const idx = y * width + x
      if (out[idx]) queue.push(idx)
    }
  }

  const visited = new Uint8Array(n)
  const maxDist = threshold + 28

  while (queue.length) {
    const idx = queue.pop()
    if (visited[idx]) continue
    visited[idx] = 1

    const x = idx % width
    const y = (idx - x) / width
    const i = idx * 4
    const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    const mx = Math.max(data[i], data[i + 1], data[i + 2])
    const mn = Math.min(data[i], data[i + 1], data[i + 2])
    const sat = mx - mn

    if (lum > 252 && sat < 8) continue
    if (colorDistance(data[i], data[i + 1], data[i + 2], bg) > maxDist) continue

    out[idx] = 1

    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
    ]
    for (const [nx, ny] of neighbors) {
      if (nx < x0 || ny < y0 || nx > x1 || ny > y1) continue
      const nidx = ny * width + nx
      if (!visited[nidx]) queue.push(nidx)
    }
  }

  return out
}

function hardenAlphaEdges(data, width, height) {
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      data[i + 3] = data[i + 3] > 127 ? 255 : 0
    }
  }
}

function maskStats(fg, width, height) {
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

/**
 * @param {string|Blob|File} imageSource
 */
export async function detectObjectMask(imageSource, { threshold = 26 } = {}) {
  const img = await loadImage(imageSource)
  const scale = Math.min(1, ANALYSIS_MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)
  const { data } = ctx.getImageData(0, 0, width, height)

  const bg = sampleEdgeBackground(data, width, height)
  const isBackground = buildBackgroundMask(data, width, height, bg, threshold)
  const fg = new Uint8Array(width * height)
  for (let i = 0; i < fg.length; i++) {
    fg[i] = isBackground[i] ? 0 : 1
  }

  const stats = maskStats(fg, width, height)

  return {
    width,
    height,
    threshold,
    foregroundRatio: stats.count / (width * height),
    hasSubject: stats.count >= width * height * 0.01,
    bounds: stats.count ? stats : null,
  }
}

function featherAlpha(data, width, height, fg, radius) {
  if (radius <= 0) return

  const alpha = new Float32Array(width * height)
  for (let i = 0; i < fg.length; i++) {
    alpha[i] = fg[i] ? 255 : 0
  }

  for (let pass = 0; pass < radius; pass++) {
    const next = new Float32Array(alpha)
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        if (alpha[idx] <= 0) continue
        let sum = alpha[idx]
        let n = 1
        sum += alpha[idx - 1] + alpha[idx + 1] + alpha[idx - width] + alpha[idx + width]
        n += 4
        next[idx] = sum / n
      }
    }
    alpha.set(next)
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      data[idx * 4 + 3] = Math.round(alpha[idx])
    }
  }
}

function trimImageData(imageData, bounds, width, height) {
  const pad = Math.max(2, Math.round(Math.min(width, height) * 0.01))
  const outX = Math.max(0, bounds.minX - pad)
  const outY = Math.max(0, bounds.minY - pad)
  const outW = Math.min(width - outX, bounds.maxX - bounds.minX + 1 + pad * 2)
  const outH = Math.min(height - outY, bounds.maxY - bounds.minY + 1 + pad * 2)
  const trimmed = new ImageData(outW, outH)

  for (let y = 0; y < outH; y++) {
    for (let x = 0; x < outW; x++) {
      const si = ((outY + y) * width + (outX + x)) * 4
      const di = (y * outW + x) * 4
      trimmed.data[di] = imageData.data[si]
      trimmed.data[di + 1] = imageData.data[si + 1]
      trimmed.data[di + 2] = imageData.data[si + 2]
      trimmed.data[di + 3] = imageData.data[si + 3]
    }
  }

  return trimmed
}

/**
 * Wycina obiekt do PNG (tło przezroczyste).
 * @param {string|Blob|File} imageSource
 */
export async function cutoutToPng(
  imageSource,
  {
    threshold = 26,
    feather = 1,
    trim = false,
    fileName = 'cutout.png',
    fillHoles = false,
    recoverBright = false,
    sharpen = false,
    lightProduct = false,
  } = {}
) {
  const img = await loadImage(imageSource)
  const width = img.naturalWidth
  const height = img.naturalHeight

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  let imageData = ctx.getImageData(0, 0, width, height)
  const { data } = imageData

  const bg = sampleEdgeBackground(data, width, height)

  let fg
  if (lightProduct) {
    fg = buildForegroundMaskLight(data, width, height, bg)
  } else {
    const isBackground = buildBackgroundMask(data, width, height, bg, threshold)
    fg = new Uint8Array(width * height)
    for (let i = 0; i < fg.length; i++) {
      fg[i] = isBackground[i] ? 0 : 1
    }

    if (fillHoles) {
      fg = closeForegroundMask(fg, width, height, 2)
    }
    if (recoverBright) {
      fg = recoverBrightForeground(data, width, height, fg, bg, threshold)
    }
    if (fillHoles) {
      fg = closeForegroundMask(fg, width, height, 1)
    }
  }

  const stats = maskStats(fg, width, height)
  if (stats.count < width * height * 0.01) {
    throw new Error('Nie wykryto obiektu — obniż próg lub użyj zdjęcia na jednolitym tle.')
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      const i = idx * 4
      if (!fg[idx]) {
        data[i] = 0
        data[i + 1] = 0
        data[i + 2] = 0
        data[i + 3] = 0
      }
    }
  }

  if (feather > 0) {
    featherAlpha(data, width, height, fg, Math.min(3, feather))
  } else if (sharpen) {
    hardenAlphaEdges(data, width, height)
  }

  if (trim) {
    imageData = trimImageData(imageData, stats, width, height)
  }

  const outCanvas = document.createElement('canvas')
  outCanvas.width = imageData.width
  outCanvas.height = imageData.height
  outCanvas.getContext('2d').putImageData(imageData, 0, 0)

  const blob = await new Promise((resolve, reject) => {
    outCanvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać PNG.'))),
      'image/png'
    )
  })

  const baseName =
    imageSource instanceof File
      ? imageSource.name.replace(/\.[^.]+$/, '')
      : fileName.replace(/\.png$/i, '')
  const file = new File([blob], `${baseName}.png`, { type: 'image/png' })

  return {
    blob,
    file,
    previewUrl: URL.createObjectURL(blob),
    foregroundRatio: stats.count / (width * height),
    bounds: stats,
  }
}
