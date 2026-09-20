/**
 * Usuwa „white spill” / jasną obwódkę z półprzezroczystych krawędzi cutoutu.
 * Typowe przy czarnych / ciemnych produktach wyciętych z białego studia.
 */

import { toAbsoluteMediaUrl } from '../api/media'

const cleanedUrlCache = new Map()
const MAX_CACHE = 80
const CACHE_VERSION = 'fringe-v2'

function cacheSet(key, value) {
  if (cleanedUrlCache.size >= MAX_CACHE) {
    const first = cleanedUrlCache.keys().next().value
    const old = cleanedUrlCache.get(first)
    if (old?.startsWith?.('blob:')) URL.revokeObjectURL(old)
    cleanedUrlCache.delete(first)
  }
  cleanedUrlCache.set(key, value)
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
      reject(new Error('Nie udało się wczytać obrazu do czyszczenia krawędzi.'))
    }
  })
}

function luminance(r, g, b) {
  return 0.299 * r + 0.587 * g + 0.114 * b
}

/**
 * Na ciemnych produktach usuwa „szarego ducha” — izolowane jasnoszare piksele
 * cutoutu, które nie stykają się z ciemnym rdzeniem obiektu.
 *
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {{ proximity?: number }} [options]
 */
export function removeDetachedGrayMatte(data, width, height, { proximity = 3 } = {}) {
  const n = width * height
  let opaque = 0
  let darkCount = 0
  let lumSum = 0

  for (let i = 0; i < n; i++) {
    const o = i * 4
    if (data[o + 3] < 200) continue
    opaque++
    const L = luminance(data[o], data[o + 1], data[o + 2])
    lumSum += L
    if (L < 55) darkCount++
  }

  if (opaque < 80) return
  const avgLum = lumSum / opaque
  // Tylko produkty zdominowane przez ciemny kolor (np. czarna sukienka).
  if (avgLum > 95 || darkCount < opaque * 0.4) return

  const dark = new Uint8Array(n)
  const gray = new Uint8Array(n)

  for (let i = 0; i < n; i++) {
    const o = i * 4
    const a = data[o + 3]
    if (a < 40) continue
    const r = data[o]
    const g = data[o + 1]
    const b = data[o + 2]
    const L = luminance(r, g, b)
    const sat = Math.max(r, g, b) - Math.min(r, g, b)
    if (a > 180 && L < 55 && sat < 40) dark[i] = 1
    if (L > 140 && sat < 28) gray[i] = 1
  }

  const prox = Math.max(1, Math.min(6, Math.round(proximity)))
  const nearDark = new Uint8Array(n)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x
      if (!dark[idx]) continue
      for (let dy = -prox; dy <= prox; dy++) {
        for (let dx = -prox; dx <= prox; dx++) {
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          nearDark[ny * width + nx] = 1
        }
      }
    }
  }

  for (let i = 0; i < n; i++) {
    if (!gray[i] || nearDark[i]) continue
    const o = i * 4
    data[o] = 0
    data[o + 1] = 0
    data[o + 2] = 0
    data[o + 3] = 0
  }
}

/**
 * In-place: dla pikseli z częściową alphą podmienia jasny RGB na kolor
 * sąsiedniego nieprzezroczystego piksela (dekontaminacja tła).
 *
 * @param {Uint8ClampedArray} data
 * @param {number} width
 * @param {number} height
 * @param {{ radius?: number }} [options]
 */
export function decontaminateFringeColors(data, width, height, { radius = 2 } = {}) {
  removeDetachedGrayMatte(data, width, height)

  const r = Math.max(1, Math.min(4, Math.round(radius)))
  const src = new Uint8ClampedArray(data)

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = src[i + 3]
      if (a < 10 || a > 248) continue

      let rSum = 0
      let gSum = 0
      let bSum = 0
      let wSum = 0

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx === 0 && dy === 0) continue
          const nx = x + dx
          const ny = y + dy
          if (nx < 0 || ny < 0 || nx >= width || ny >= height) continue
          const ni = (ny * width + nx) * 4
          const na = src[ni + 3]
          if (na < 200) continue
          const weight = (na / 255) * (1 / (1 + Math.hypot(dx, dy)))
          rSum += src[ni] * weight
          gSum += src[ni + 1] * weight
          bSum += src[ni + 2] * weight
          wSum += weight
        }
      }

      const curLum = luminance(src[i], src[i + 1], src[i + 2])

      if (wSum < 0.05) {
        // Jasna obwódka bez sąsiada — usuń (zostawiała szary „duch” na tle kafelka).
        if (curLum > 150) {
          data[i] = 0
          data[i + 1] = 0
          data[i + 2] = 0
          data[i + 3] = 0
        }
        continue
      }

      const nr = rSum / wSum
      const ng = gSum / wSum
      const nb = bSum / wSum
      const neiLum = luminance(nr, ng, nb)

      // White/studio spill: krawędź wyraźnie jaśniejsza niż ciało obiektu.
      if (curLum > neiLum + 12) {
        data[i] = Math.round(nr)
        data[i + 1] = Math.round(ng)
        data[i + 2] = Math.round(nb)
        // Mocno zanieczyszczone półprzezroczyste piksele ścinaj mocniej.
        if (a < 200 && curLum > neiLum + 45) {
          data[i + 3] = Math.max(0, Math.round(a * 0.4))
        }
      }
    }
  }
}

/**
 * @param {ImageData} imageData
 * @param {{ radius?: number }} [options]
 * @returns {ImageData}
 */
export function cleanCutoutImageData(imageData, options = {}) {
  const out = new ImageData(imageData.width, imageData.height)
  out.data.set(imageData.data)
  decontaminateFringeColors(out.data, out.width, out.height, options)
  return out
}

/**
 * Zwraca blob: URL wycleanowanego PNG (z cache). Bez alphę — oryginał.
 *
 * @param {string} imageUrl
 * @returns {Promise<string>}
 */
export async function getCleanedCutoutUrl(imageUrl) {
  if (!imageUrl) return imageUrl

  const key = `${CACHE_VERSION}::${imageUrl}`
  if (cleanedUrlCache.has(key)) {
    return cleanedUrlCache.get(key)
  }

  const img = await loadImage(imageUrl)
  const width = img.naturalWidth
  const height = img.naturalHeight
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  const imageData = ctx.getImageData(0, 0, width, height)

  let transparent = 0
  const total = width * height
  for (let i = 0; i < total; i++) {
    if (imageData.data[i * 4 + 3] < 250) transparent++
  }

  // Brak alphę — nic do czyszczenia.
  if (transparent / total < 0.02) {
    cacheSet(key, imageUrl)
    return imageUrl
  }

  decontaminateFringeColors(imageData.data, width, height)
  ctx.putImageData(imageData, 0, 0)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać wycleanowanego PNG.'))),
      'image/png'
    )
  })

  const cleaned = URL.createObjectURL(blob)
  cacheSet(key, cleaned)
  return cleaned
}
