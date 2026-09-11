import { cutoutToPng } from './imageBackgroundCutout'
import { resolveCutoutOptions } from './imageCutoutTuning'
import { detectObjectFacing, orientImageToRight, shouldMirrorToRight } from './imageObjectOrientation'

/**
 * Obróbka covera obuwia jak ręcznie: odbicie w prawo + wycięcie PNG bez tła.
 * @param {() => Promise<File|Blob|null>} getSource
 * @param {{ threshold?: number, feather?: number, trim?: boolean, colorHint?: string|null }} [options]
 */
export async function prepareShoeCoverImage(
  getSource,
  { threshold, feather, trim = true, colorHint = null, forceLight = false } = {}
) {
  const source = await getSource()
  if (!source) {
    throw new Error('Brak pliku obrazu do obróbki.')
  }

  let working = source

  const detection = await detectObjectFacing(working)
  if (shouldMirrorToRight(detection)) {
    const oriented = await orientImageToRight(working, { force: true })
    if (oriented?.file) {
      working = oriented.file
    }
  }

  const tuned =
    threshold == null && feather == null
      ? await resolveCutoutOptions(working, { colorHint, forceLight })
      : {
          threshold: threshold ?? 26,
          feather: feather ?? 1,
          trim,
          sharpen: false,
          fillHoles: false,
          recoverBright: false,
          lightProduct: false,
        }

  const cutout = await cutoutToPng(working, {
    threshold: tuned.threshold,
    feather: tuned.feather,
    trim: tuned.trim ?? trim,
    fileName: 'cover.png',
    fillHoles: tuned.fillHoles,
    recoverBright: tuned.recoverBright,
    sharpen: tuned.sharpen,
    lightProduct: tuned.lightProduct,
  })

  return {
    file: cutout.file,
    previewUrl: cutout.previewUrl,
    hasAlpha: true,
    cutout: true,
    lightProduct: Boolean(tuned.lightProduct),
    facing: detection?.directionAfter ?? detection?.direction ?? null,
    orientation: detection,
    foregroundRatio: cutout.foregroundRatio,
  }
}
