import { cutoutToPng } from './imageBackgroundCutout'
import { resolveCutoutOptions } from './imageCutoutTuning'
import { addSoftOutlineToCutout } from './imageSoftOutline'

/** Soft edge for cutouts on a white flat-lay canvas. */
const OUTLINE_COLOR = [210, 210, 214]

export async function estimateCutoutOpaqueRatio(previewUrl) {
  const img = await new Promise((resolve, reject) => {
    const el = new Image()
    el.crossOrigin = 'anonymous'
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

/** Persisted / generated cutout is usable when enough background was removed. */
export function isCutoutOpaqueRatioOk(ratio) {
  return ratio >= 0.04 && ratio <= 0.78
}

function looksLikeLightProduct(options = {}) {
  const hint = String(options.colorHint ?? '')
  const name = String(options.itemName ?? '')
  return /\b(bia[łl]|white|cream|ivory|ecru|pearl|off[\s-]?white)\b/i.test(
    `${hint} ${name}`
  )
}

async function cutoutWithOutline(source, options = {}) {
  const tuned = await resolveCutoutOptions(source, {
    colorHint: options.colorHint ?? null,
    forceLight: Boolean(options.forceLight),
    forceStudioGray: Boolean(options.forceStudioGray),
  })

  const forceLight = Boolean(options.forceLight || tuned.lightProduct)
  const forceStudio = Boolean(options.forceStudioGray || tuned.studioGray)

  const cutout = await cutoutToPng(source, {
    threshold: forceLight
      ? Math.max(tuned.threshold, 22)
      : tuned.threshold,
    feather: forceLight && !forceStudio ? 0 : tuned.feather,
    trim: true,
    fileName: options.fileName ?? 'outfit-cutout.png',
    fillHoles: tuned.fillHoles && !forceLight,
    recoverBright: tuned.recoverBright || forceLight,
    sharpen: tuned.sharpen || forceLight,
    lightProduct: forceLight && !forceStudio,
    studioGray: forceStudio && !forceLight,
  })

  const outlined = await addSoftOutlineToCutout(cutout.file, {
    radius: options.outlineRadius ?? 2,
    strength: options.outlineStrength ?? 0.55,
    color: OUTLINE_COLOR,
    fileName: options.outlineFileName ?? 'outfit-cutout-outline.png',
  })

  URL.revokeObjectURL(cutout.previewUrl)

  return outlined
}

/**
 * Cutout + soft outline for persistence (flat-lay / Style).
 * Prefers light-product profile before studio-gray when background removal fails.
 *
 * @param {Blob|File} source
 * @param {{
 *   colorHint?: string|null,
 *   itemName?: string,
 *   alreadyCutout?: boolean,
 * }} [options]
 */
export async function preparePersistedOutfitCutout(source, options = {}) {
  if (!source) {
    throw new Error('Brak źródła do wycięcia.')
  }

  if (options.alreadyCutout) {
    return addSoftOutlineToCutout(source, {
      radius: 2,
      strength: 0.55,
      color: OUTLINE_COLOR,
      fileName: 'outfit-cutout-outline.png',
    })
  }

  const base = {
    colorHint: options.colorHint ?? null,
    outlineRadius: 2,
    outlineStrength: 0.55,
  }

  const preferLight = looksLikeLightProduct(options)

  let piece = await cutoutWithOutline(source, {
    ...base,
    forceLight: preferLight,
  })
  let ratio = await estimateCutoutOpaqueRatio(piece.previewUrl)

  // White / near-white products first — studio-gray eats white garments.
  if (!isCutoutOpaqueRatioOk(ratio) || ratio > 0.68) {
    URL.revokeObjectURL(piece.previewUrl)
    piece = await cutoutWithOutline(source, {
      ...base,
      colorHint: options.colorHint ?? 'white',
      forceLight: true,
    })
    ratio = await estimateCutoutOpaqueRatio(piece.previewUrl)
  }

  if (!isCutoutOpaqueRatioOk(ratio) && ratio > 0.72) {
    URL.revokeObjectURL(piece.previewUrl)
    piece = await cutoutWithOutline(source, {
      ...base,
      forceStudioGray: true,
    })
    ratio = await estimateCutoutOpaqueRatio(piece.previewUrl)
  }

  if (!isCutoutOpaqueRatioOk(ratio)) {
    URL.revokeObjectURL(piece.previewUrl)
    throw new Error(
      'Wycinanie nie usunęło tła (np. biały produkt na białym). Spróbuj innego zdjęcia.'
    )
  }

  return piece
}
