/**
 * Parametry wycinania tła — osobny profil dla jasnego / białego obuwia (ostrzejszy obrys).
 */

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

  if (!samples.length) return { bg: [255, 255, 255], avgLum: 255, avgSat: 0 }

  let r = 0
  let g = 0
  let b = 0
  let lum = 0
  let sat = 0
  for (const [sr, sg, sb] of samples) {
    r += sr
    g += sg
    b += sb
    const l = 0.299 * sr + 0.587 * sg + 0.114 * sb
    lum += l
    const mx = Math.max(sr, sg, sb)
    const mn = Math.min(sr, sg, sb)
    sat += mx - mn
  }
  const n = samples.length
  return {
    bg: [r / n, g / n, b / n],
    avgLum: lum / n,
    avgSat: sat / n,
  }
}

function isLightColorName(name) {
  if (!name) return false
  const n = String(name).toLowerCase()
  return /\b(bia[łl]|white|cream|ivory|off[\s-]?white|ecru|snow|pearl)\b/.test(n)
}

/**
 * @param {ImageData} imageData
 * @param {{ colorHint?: string|null, forceLight?: boolean }} [hints]
 */
export function analyzeCutoutProfile(imageData, hints = {}) {
  const { data, width, height } = imageData
  const { bg, avgLum, avgSat } = sampleEdgeBackground(data, width, height)

  let brightFg = 0
  let totalFgish = 0
  let edgeVar = 0
  let edgeN = 0
  const cx0 = Math.floor(width * 0.15)
  const cx1 = Math.ceil(width * 0.85)
  const cy0 = Math.floor(height * 0.12)
  const cy1 = Math.ceil(height * 0.88)

  for (let y = cy0; y < cy1; y++) {
    for (let x = cx0; x < cx1; x++) {
      const i = (y * width + x) * 4
      if (data[i + 3] < 128) continue
      const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
      const mx = Math.max(data[i], data[i + 1], data[i + 2])
      const mn = Math.min(data[i], data[i + 1], data[i + 2])
      const sat = mx - mn
      if (lum > 175 && sat < 55) {
        brightFg += 1
      }
      if (lum > 120) {
        totalFgish += 1
      }
    }
  }

  // Wariancja luminancji na obrzeżu — miękkie szare studio
  const strip = Math.max(2, Math.min(12, Math.floor(Math.min(width, height) * 0.05)))
  for (let x = 0; x < width; x += 4) {
    for (const y of [0, height - 1]) {
      for (let dy = 0; dy < strip; dy++) {
        const yy = y === 0 ? dy : height - 1 - dy
        const i = (yy * width + x) * 4
        if (data[i + 3] < 128) continue
        const lum = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        edgeVar += (lum - avgLum) ** 2
        edgeN += 1
      }
    }
  }
  const edgeStd = edgeN ? Math.sqrt(edgeVar / edgeN) : 0

  const centerArea = (cx1 - cx0) * (cy1 - cy0)
  const brightRatio = brightFg / Math.max(1, centerArea)

  const studioGray =
    Boolean(hints.forceStudioGray) ||
    (avgLum >= 145 &&
      avgLum <= 238 &&
      avgSat < 32 &&
      edgeStd < 28 &&
      !isLightColorName(hints.colorHint))

  const lightProduct =
    !studioGray &&
    (Boolean(hints.forceLight) ||
      isLightColorName(hints.colorHint) ||
      (avgLum > 200 && avgSat < 40 && brightRatio > 0.05) ||
      (brightRatio > 0.15 && avgLum > 185) ||
      (avgLum > 230 && avgSat < 28))

  if (studioGray) {
    return {
      lightProduct: false,
      studioGray: true,
      mode: 'studio-gray',
      threshold: Math.min(52, Math.max(34, Math.round(28 + edgeStd * 0.9))),
      feather: 1,
      sharpen: false,
      fillHoles: true,
      // recoverBright ciągnie z powrotem szare tło — nie używaj na studio
      recoverBright: false,
    }
  }

  if (lightProduct) {
    return {
      lightProduct: true,
      studioGray: false,
      mode: 'light',
      threshold: 26,
      feather: 0,
      sharpen: true,
      fillHoles: false,
      recoverBright: false,
    }
  }

  return {
    lightProduct: false,
    studioGray: false,
    threshold: 26,
    feather: 1,
    sharpen: false,
    fillHoles: false,
    recoverBright: false,
  }
}

/**
 * @param {string|Blob|File} imageSource
 * @param {{ colorHint?: string|null, forceLight?: boolean, forceStudioGray?: boolean }} [hints]
 */
export async function resolveCutoutOptions(imageSource, hints = {}) {
  const img = await new Promise((resolve, reject) => {
    const image = new Image()
    const url =
      typeof imageSource === 'string'
        ? imageSource
        : URL.createObjectURL(imageSource)
    image.onload = () => {
      if (typeof imageSource !== 'string') URL.revokeObjectURL(url)
      resolve(image)
    }
    image.onerror = () => reject(new Error('Nie udało się wczytać obrazu.'))
    image.src = url
  })

  const scale = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight))
  const w = Math.max(1, Math.round(img.naturalWidth * scale))
  const h = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, w, h)
  const imageData = ctx.getImageData(0, 0, w, h)
  const profile = analyzeCutoutProfile(imageData, hints)

  return {
    ...profile,
    trim: true,
    fileName: 'cover.png',
  }
}
