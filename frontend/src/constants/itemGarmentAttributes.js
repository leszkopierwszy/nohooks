/** Category-specific garment attribute schemas (mirrors backend GarmentAttributes). */

export const HOSIERY_TYPES = ['tights']

export const HOSIERY_OPACITY_OPTIONS = [
  { value: 'ultra_sheer', labelKey: 'item.hosiery.opacity.ultra_sheer' },
  { value: 'sheer', labelKey: 'item.hosiery.opacity.sheer' },
  { value: 'semi_opaque', labelKey: 'item.hosiery.opacity.semi_opaque' },
  { value: 'opaque', labelKey: 'item.hosiery.opacity.opaque' },
]

export const HOSIERY_FINISH_OPTIONS = [
  { value: 'matte', labelKey: 'item.hosiery.finish.matte' },
  { value: 'satin', labelKey: 'item.hosiery.finish.satin' },
  { value: 'glossy', labelKey: 'item.hosiery.finish.glossy' },
]

export function isHosieryType(category) {
  const key = String(category ?? '')
    .trim()
    .toLowerCase()
  return HOSIERY_TYPES.includes(key)
}

/**
 * Build typed hosiery attrs for API; returns null when empty / wrong type.
 */
export function normalizeGarmentAttributesForStorage(category, attrs) {
  if (!isHosieryType(category) || !attrs || typeof attrs !== 'object') {
    return null
  }

  const out = {}

  if (attrs.denier !== '' && attrs.denier != null) {
    const n = Number(attrs.denier)
    if (Number.isFinite(n) && n >= 0 && n <= 200) {
      out.denier = Math.round(n)
    }
  }

  const opacity = String(attrs.opacity ?? '').trim()
  if (HOSIERY_OPACITY_OPTIONS.some((o) => o.value === opacity)) {
    out.opacity = opacity
  }

  const finish = String(attrs.finish ?? '').trim()
  if (HOSIERY_FINISH_OPTIONS.some((o) => o.value === finish)) {
    out.finish = finish
  }

  for (const key of ['pattern', 'toe', 'waist']) {
    const v = String(attrs[key] ?? '').trim()
    if (v) out[key] = v.slice(0, 64)
  }

  return Object.keys(out).length ? out : null
}

export function emptyHosieryFormAttrs() {
  return {
    denier: '',
    opacity: '',
    finish: '',
    pattern: '',
    toe: '',
    waist: '',
  }
}

export function hosieryFormFromAttributes(attrs) {
  const base = emptyHosieryFormAttrs()
  if (!attrs || typeof attrs !== 'object') return base
  return {
    denier: attrs.denier != null ? String(attrs.denier) : '',
    opacity: attrs.opacity ?? '',
    finish: attrs.finish ?? '',
    pattern: attrs.pattern ?? '',
    toe: attrs.toe ?? '',
    waist: attrs.waist ?? '',
  }
}
