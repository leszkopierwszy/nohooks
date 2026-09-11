/**
 * Wykrywa kierunek produktu na zdjęciu (np. but: czubek w lewo / w prawo) i odbicie lustrzane.
 */

import { toAbsoluteMediaUrl } from '../api/media'

export const FACING = {
  LEFT: 'left',
  RIGHT: 'right',
  NEUTRAL: 'neutral',
}

const ANALYSIS_MAX = 320
const MIN_FG_RATIO = 0.015

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrl = null

    if (typeof source === 'string') {
      const src = toAbsoluteMediaUrl(source) ?? source
      const local =
        src.startsWith('blob:') ||
        src.startsWith('data:')

      if (!local) {
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
  const strip = Math.max(2, Math.min(12, Math.floor(Math.min(width, height) * 0.06)))
  const step = Math.max(1, Math.floor(Math.min(width, height) / 24))
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

function buildForegroundMask(data, width, height, bg) {
  const mask = new Uint8Array(width * height)
  const threshold = 26

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 128) continue
      if (colorDistance(data[i], data[i + 1], data[i + 2], bg) > threshold) {
        mask[y * width + x] = 1
      }
    }
  }

  return mask
}

async function loadToAnalysisCanvas(source) {
  const img = await loadImage(source)
  const scale = Math.min(1, ANALYSIS_MAX / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, width, height)

  return { width, height, data: ctx.getImageData(0, 0, width, height).data }
}

/**
 * @param {string|Blob|File} imageSource
 */
export async function detectObjectFacing(imageSource) {
  const { width, height, data } = await loadToAnalysisCanvas(imageSource)
  const bg = sampleEdgeBackground(data, width, height)
  const mask = buildForegroundMask(data, width, height, bg)

  const xs = []
  const ys = []

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (!mask[y * width + x]) continue
      xs.push(x)
      ys.push(y)
    }
  }

  const total = xs.length
  const fgRatio = total / (width * height)

  if (total < width * height * MIN_FG_RATIO) {
    return {
      direction: FACING.NEUTRAL,
      confidence: 0,
      score: 0,
      shouldMirror: false,
    }
  }

  let leftExtent = width
  let rightExtent = 0
  let comX = 0
  let comY = 0

  for (let i = 0; i < total; i++) {
    comX += xs[i]
    comY += ys[i]
    if (xs[i] < leftExtent) leftExtent = xs[i]
    if (xs[i] > rightExtent) rightExtent = xs[i]
  }

  comX /= total
  comY /= total
  const span = Math.max(1, rightExtent - leftExtent)

  const stripCounts = [0, 0, 0]
  for (const x of xs) {
    const t = Math.min(2, Math.max(0, Math.floor(((x - leftExtent) / span) * 3)))
    stripCounts[t] += 1
  }

  const stripScores = stripCounts.map((c) => c / total)
  const minStrip = Math.min(...stripCounts)
  const minIdx = stripCounts.indexOf(minStrip)

  let toeScore = 0
  if (minIdx === 0 && stripCounts[0] < stripCounts[2] * 0.92) {
    toeScore = -1
  } else if (minIdx === 2 && stripCounts[2] < stripCounts[0] * 0.92) {
    toeScore = 1
  }

  const extentBias = (rightExtent - comX - (comX - leftExtent)) / span
  const geoCenter = (leftExtent + rightExtent) / 2
  const comBias = (comX - geoCenter) / span

  let leftMass = 0
  let rightMass = 0
  const mid = (leftExtent + rightExtent) / 2
  for (const x of xs) {
    if (x < mid) leftMass += 1
    else rightMass += 1
  }
  const massRatio = (rightMass - leftMass) / total

  const score = 0.35 * toeScore + 0.35 * extentBias + 0.2 * comBias + 0.1 * massRatio

  const confidence = Math.min(
    1,
    Math.abs(score) * 2.2 + (fgRatio > 0.03 ? 0.2 : 0) + (Math.abs(toeScore) > 0 ? 0.15 : 0)
  )

  let direction = FACING.NEUTRAL
  if (score > 0.05) direction = FACING.RIGHT
  else if (score < -0.05) direction = FACING.LEFT

  const shouldMirror =
    direction === FACING.LEFT ||
    score < -0.02 ||
    (massRatio < -0.05 && confidence >= 0.1)

  return {
    direction,
    confidence,
    score,
    shouldMirror,
    debug: { stripScores, toeScore, extentBias, comBias, massRatio },
  }
}

export function shouldMirrorToRight(detection) {
  if (!detection) return false
  if (detection.shouldMirror) return true
  if (detection.direction === FACING.LEFT) return true
  if (detection.score < -0.02) return true
  return false
}

/**
 * @param {string|Blob|File} imageSource
 */
export async function mirrorImageSource(
  imageSource,
  { mimeType, quality = 0.96, fileName = 'mirrored.jpg' } = {}
) {
  const img = await loadImage(imageSource)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.translate(canvas.width, 0)
  ctx.scale(-1, 1)
  ctx.drawImage(img, 0, 0)

  const inputType =
    mimeType ?? (imageSource instanceof File ? imageSource.type : null) ?? ''
  const type = inputType === 'image/png' ? 'image/png' : 'image/jpeg'

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Nie udało się odbić obrazu.'))),
      type,
      type === 'image/jpeg' ? quality : undefined
    )
  })

  const name =
    imageSource instanceof File ? imageSource.name : fileName

  const file = new File([blob], name, { type })

  return {
    blob,
    file,
    previewUrl: URL.createObjectURL(blob),
  }
}

/**
 * Wykrywa kierunek; jeśli obiekt skierowany w lewo — odbija lustrzanie w prawo.
 */
export async function orientImageToRight(imageSource, { force = false } = {}) {
  const detection = await detectObjectFacing(imageSource)
  const needsMirror = force || shouldMirrorToRight(detection)

  if (!needsMirror) {
    return {
      ...detection,
      mirrored: false,
      directionAfter: detection.direction,
      file: null,
      previewUrl: null,
    }
  }

  const mirrored = await mirrorImageSource(imageSource)
  const after = await detectObjectFacing(mirrored.previewUrl)

  return {
    ...detection,
    mirrored: true,
    directionAfter: after.direction,
    confidenceAfter: after.confidence,
    file: mirrored.file,
    previewUrl: mirrored.previewUrl,
  }
}

export function facingLabel(direction) {
  if (direction === FACING.RIGHT) return 'w prawo'
  if (direction === FACING.LEFT) return 'w lewo'
  return 'niepewne'
}
