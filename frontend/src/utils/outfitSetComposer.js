import { fetchUrlAsFile, resolveStorageUrl } from '../api/media'
import { cutoutToPng } from './imageBackgroundCutout'
import { resolveCutoutOptions } from './imageCutoutTuning'
import { addSoftOutlineToCutout } from './imageSoftOutline'
import { splitOutfitItemsForFlatLay } from './outfitFlatLay'

function itemImageUrl(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}

function loadHtmlImage(source) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nie udało się wczytać wycinka.'))
    if (typeof source === 'string') {
      img.crossOrigin = 'anonymous'
      img.src = source
    } else {
      img.src = URL.createObjectURL(source)
    }
  })
}

/**
 * Wycina produkt ze zdjęcia i dodaje lekki jasny obrys (jak flat-lay).
 *
 * @param {object} item
 * @param {{
 *   outlineRadius?: number,
 *   outlineStrength?: number,
 *   colorHint?: string|null,
 * }} [options]
 */
export async function prepareSetItemCutout(item, options = {}) {
  const url = itemImageUrl(item)
  if (!url) {
    throw new Error(`Brak zdjęcia dla „${item?.name ?? 'item'}”.`)
  }

  const source = await fetchUrlAsFile(url, `item-${item.id}.jpg`)
  const tuned = await resolveCutoutOptions(source, {
    colorHint: options.colorHint ?? item?.color ?? null,
    forceLight: Boolean(options.forceLight),
    forceStudioGray: Boolean(options.forceStudioGray),
  })

  const cutout = await cutoutToPng(source, {
    threshold: options.forceLight
      ? Math.max(tuned.threshold, 22)
      : tuned.threshold,
    feather: options.forceLight && !tuned.studioGray ? 0 : tuned.feather,
    trim: true,
    fileName: `set-item-${item.id}.png`,
    fillHoles: tuned.fillHoles,
    recoverBright: tuned.recoverBright || Boolean(options.forceLight),
    sharpen: tuned.sharpen || Boolean(options.forceLight),
    lightProduct: tuned.lightProduct && !tuned.studioGray,
    studioGray: Boolean(tuned.studioGray || options.forceStudioGray),
  })

  const outlined = await addSoftOutlineToCutout(cutout.file, {
    radius: options.outlineRadius ?? 2,
    strength: options.outlineStrength ?? 0.7,
    color: [238, 238, 238],
    fileName: `set-item-${item.id}-outline.png`,
  })

  URL.revokeObjectURL(cutout.previewUrl)

  return {
    item,
    file: outlined.file,
    previewUrl: outlined.previewUrl,
    width: outlined.width,
    height: outlined.height,
  }
}

function drawContain(ctx, img, box) {
  const scale = Math.min(box.w / img.naturalWidth, box.h / img.naturalHeight)
  const w = img.naturalWidth * scale
  const h = img.naturalHeight * scale
  const x = box.x + (box.w - w) / 2
  const y = box.y + (box.h - h) / 2
  ctx.drawImage(img, x, y, w, h)
  return { x, y, w, h }
}

/**
 * Układa wycinki w flat-lay: lewa kolumna (góra/dół), prawa (akcesoria).
 *
 * @param {Array<{ item: object, previewUrl: string }>} pieces
 * @param {{
 *   width?: number,
 *   height?: number,
 *   background?: string,
 *   fileName?: string,
 * }} [options]
 */
export async function composeOutfitSetFlatLay(pieces, options = {}) {
  const width = options.width ?? 900
  const height = options.height ?? 1100
  const background = options.background ?? '#f5f5f5'

  const items = pieces.map((p) => p.item)
  const split = splitOutfitItemsForFlatLay(items)
  let mains = [...split.tops, ...split.onePieces, ...split.bottoms]
  let accessories = [...split.accessories]

  if (!mains.length && accessories.length) {
    mains = accessories.slice(0, Math.min(2, accessories.length))
    accessories = accessories.slice(mains.length)
  }

  const byId = new Map(pieces.map((p) => [Number(p.item.id), p]))
  const mainPieces = mains.map((i) => byId.get(Number(i.id))).filter(Boolean)
  const accPieces = accessories.map((i) => byId.get(Number(i.id))).filter(Boolean)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = background
  ctx.fillRect(0, 0, width, height)

  const padX = Math.round(width * 0.06)
  const padY = Math.round(height * 0.06)
  const gap = Math.round(width * 0.04)
  const hasAcc = accPieces.length > 0
  const leftW = hasAcc ? Math.round((width - padX * 2 - gap) * 0.58) : width - padX * 2
  const rightW = hasAcc ? width - padX * 2 - gap - leftW : 0
  const leftX = padX
  const rightX = padX + leftW + gap
  const contentH = height - padY * 2

  // Left column
  if (mainPieces.length) {
    const slotH = contentH / mainPieces.length
    for (let i = 0; i < mainPieces.length; i++) {
      const img = await loadHtmlImage(mainPieces[i].previewUrl)
      const isLast = i === mainPieces.length - 1
      const boxH =
        mainPieces.length === 1
          ? contentH * 0.85
          : isLast
            ? slotH * 1.15
            : slotH * 0.85
      const boxY = padY + i * slotH + (slotH - Math.min(boxH, slotH)) / 2
      drawContain(ctx, img, {
        x: leftX,
        y: boxY,
        w: leftW,
        h: Math.min(boxH, slotH * 0.95),
      })
    }
  }

  // Right column — evenly spaced
  if (accPieces.length) {
    const slotH = contentH / accPieces.length
    for (let i = 0; i < accPieces.length; i++) {
      const img = await loadHtmlImage(accPieces[i].previewUrl)
      const boxH = Math.min(slotH * 0.72, height * 0.14)
      const boxY = padY + i * slotH + (slotH - boxH) / 2
      drawContain(ctx, img, {
        x: rightX + rightW * 0.08,
        y: boxY,
        w: rightW * 0.84,
        h: boxH,
      })
    }
  }

  const blob = await new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Nie udało się złożyć setu.'))),
      'image/png'
    )
  })

  const fileName = options.fileName ?? 'outfit-set.png'
  const file = new File([blob], fileName, { type: 'image/png' })

  return {
    blob,
    file,
    previewUrl: URL.createObjectURL(blob),
    width,
    height,
  }
}

/**
 * Pełny pipeline: cutout + obrys dla każdego itemu → flat-lay set.
 *
 * @param {object[]} items
 * @param {{
 *   onProgress?: (done: number, total: number, item: object) => void,
 *   signal?: AbortSignal,
 * }} [options]
 */
export async function createOutfitSetPreview(items, options = {}) {
  const list = (items ?? []).filter((item) => itemImageUrl(item))
  if (!list.length) {
    throw new Error('Set musi mieć przynajmniej jedno zdjęcie itemu.')
  }

  const pieces = []
  try {
    for (let i = 0; i < list.length; i++) {
      if (options.signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError')
      }
      const item = list[i]
      options.onProgress?.(i, list.length, item)
      const piece = await prepareSetItemCutout(item)
      pieces.push(piece)
    }
    options.onProgress?.(list.length, list.length, null)

    const composed = await composeOutfitSetFlatLay(pieces, {
      fileName: `outfit-set-${Date.now()}.png`,
    })

    return {
      ...composed,
      pieces,
    }
  } catch (err) {
    for (const piece of pieces) {
      if (piece.previewUrl) URL.revokeObjectURL(piece.previewUrl)
    }
    throw err
  }
}

export function revokeOutfitSetPreview(result) {
  if (!result) return
  if (result.previewUrl) URL.revokeObjectURL(result.previewUrl)
  for (const piece of result.pieces ?? []) {
    if (piece.previewUrl) URL.revokeObjectURL(piece.previewUrl)
  }
}
