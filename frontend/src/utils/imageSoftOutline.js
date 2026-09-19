/**
 * Lekki obrys wokół wyciętego obiektu (PNG z alphą) — look flat-lay / product shot.
 */

function loadImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    let objectUrl = null
    img.onload = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      resolve(img)
    }
    img.onerror = () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
      reject(new Error('Nie udało się wczytać obrazu do obrysu.'))
    }
    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous'
      img.src = source
    } else {
      objectUrl = URL.createObjectURL(source)
      img.src = objectUrl
    }
  })
}

function alphaAt(data, width, height, x, y) {
  if (x < 0 || y < 0 || x >= width || y >= height) return 0
  return data[(y * width + x) * 4 + 3]
}

/**
 * Dilatuje maskę alpha i rysuje miękki jasny kontur „pod” obiektem.
 *
 * @param {ImageData} imageData
 * @param {{
 *   radius?: number,
 *   color?: [number, number, number],
 *   strength?: number,
 * }} [options]
 * @returns {ImageData}
 */
export function applySoftOutlineToImageData(
  imageData,
  {
    radius = 2,
    color = [236, 236, 236],
    strength = 0.72,
  } = {}
) {
  const { width, height, data } = imageData
  const r = Math.max(1, Math.min(6, Math.round(radius)))
  const out = new ImageData(width, height)
  out.data.set(data)

  const [cr, cg, cb] = color
  const str = Math.max(0.15, Math.min(1, strength))

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4
      const a = data[i + 3]
      if (a > 200) continue

      let best = 0
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx === 0 && dy === 0) continue
          const dist = Math.hypot(dx, dy)
          if (dist > r + 0.01) continue
          const na = alphaAt(data, width, height, x + dx, y + dy)
          if (na < 40) continue
          const edge = (1 - dist / (r + 0.25)) * (na / 255)
          if (edge > best) best = edge
        }
      }

      if (best <= 0.02) continue

      const outlineA = Math.min(255, Math.round(best * str * 255))
      if (outlineA <= a) continue

      // Blend outline under residual alpha
      const oa = outlineA / 255
      const ia = a / 255
      const outA = oa + ia * (1 - oa)
      if (outA <= 0) continue

      out.data[i] = Math.round((cr * oa + data[i] * ia * (1 - oa)) / outA)
      out.data[i + 1] = Math.round((cg * oa + data[i + 1] * ia * (1 - oa)) / outA)
      out.data[i + 2] = Math.round((cb * oa + data[i + 2] * ia * (1 - oa)) / outA)
      out.data[i + 3] = Math.round(outA * 255)
    }
  }

  return out
}

/**
 * @param {string|Blob|File} cutoutSource — PNG z przezroczystym tłem
 * @param {{
 *   radius?: number,
 *   color?: [number, number, number],
 *   strength?: number,
 *   fileName?: string,
 * }} [options]
 */
export async function addSoftOutlineToCutout(cutoutSource, options = {}) {
  const img = await loadImage(cutoutSource)
  const canvas = document.createElement('canvas')
  canvas.width = img.naturalWidth
  canvas.height = img.naturalHeight
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  let imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  imageData = applySoftOutlineToImageData(imageData, options)
  ctx.putImageData(imageData, 0, 0)

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Nie udało się zapisać PNG z obrysem.'))),
      'image/png'
    )
  })

  const fileName = options.fileName ?? 'cutout-outline.png'
  const file = new File([blob], fileName, { type: 'image/png' })
  return {
    blob,
    file,
    previewUrl: URL.createObjectURL(blob),
    width: canvas.width,
    height: canvas.height,
  }
}
