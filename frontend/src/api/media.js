import { apiRequest, API_BASE } from './client'

function browserOrigin() {
  if (typeof window !== 'undefined') return window.location.origin
  return 'http://localhost:5173'
}

/** Origin API (do parsowania pełnych URL-i storage). */
export function apiOrigin() {
  if (API_BASE.startsWith('http')) {
    return API_BASE.replace(/\/api\/?$/, '')
  }
  return browserOrigin()
}

function base64ToUint8Array(base64) {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

/** URL podglądu / importu — Nike: PNG zamiast f_auto (AVIF). */
export function rasterFriendlyImageUrl(url) {
  if (!url || typeof url !== 'string') return url
  if (!url.includes('static.nike.com')) return url
  return url.replace(/\/f_auto\b/g, '/f_png').replace(/,f_auto\b/g, ',f_png')
}

/** Pobiera obraz ze strony lub bezpośredniego URL (serwer: og:image, bez CORS). */
export async function importImageFromUrl(pageUrl) {
  const fetchUrl = rasterFriendlyImageUrl(pageUrl)
  const data = await apiRequest('/media/import-url', {
    method: 'POST',
    body: JSON.stringify({ url: fetchUrl }),
  })

  const bytes = base64ToUint8Array(data.data_base64)
  const mime = data.mime || 'image/jpeg'
  const blob = new Blob([bytes], { type: mime })
  const name = data.filename || 'imported.jpg'

  return new File([blob], name, { type: mime })
}

export function isExternalHttpUrl(url) {
  return typeof url === 'string' && /^https?:\/\//i.test(url)
}

/** Tło pod miniaturami — jak `bg-white` na liście produktów. */
export const ITEM_IMAGE_SURFACE_BG = '#ffffff'

export function isPngLikeImageUrl(url) {
  if (!url || typeof url !== 'string') return false
  return /\.png(\?|#|$)/i.test(url.split('?')[0])
}

/** Pobiera obraz z URL (storage / blob) jako File — z cache-bust. */
export async function fetchUrlAsFile(url, filename = 'image.jpg') {
  if (!url) throw new Error('Brak adresu obrazu.')

  const raw = resolveStorageUrl(url) ?? url
  if (raw.startsWith('blob:') || raw.startsWith('data:')) {
    const response = await fetch(raw)
    const blob = await response.blob()
    const ext = blob.type === 'image/png' ? 'png' : 'jpg'
    return new File([blob], filename.replace(/\.[^.]+$/, '') + '.' + ext, {
      type: blob.type || 'image/jpeg',
    })
  }

  const fetchUrl = toAbsoluteMediaUrl(raw)
  const sep = fetchUrl.includes('?') ? '&' : '?'
  const response = await fetch(`${fetchUrl}${sep}v=${Date.now()}`)
  if (!response.ok) {
    throw new Error('Nie udało się pobrać obrazu.')
  }
  const blob = await response.blob()
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  return new File([blob], filename.replace(/\.[^.]+$/, '') + '.' + ext, {
    type: blob.type || 'image/jpeg',
  })
}

function toRelativeStoragePath(url) {
  if (!url) return null

  if (url.startsWith('/storage/')) {
    return url
  }

  const origin = apiOrigin()

  try {
    const parsed = new URL(url, origin)
    if (parsed.pathname.startsWith('/storage/')) {
      return `${parsed.pathname}${parsed.search}`
    }
  } catch {
    // ignore invalid URLs
  }

  if (url.startsWith('http://localhost/storage/') || url.startsWith('https://localhost/storage/')) {
    return url.replace(/^https?:\/\/localhost(:\d+)?/, '')
  }

  if (url.startsWith(`${origin}/storage/`)) {
    return url.slice(origin.length)
  }

  return null
}

/**
 * URL do fetch / canvas — lokalne /storage przez proxy Vite (bez CORS).
 * Zewnętrzne http(s) bez zmian (lepiej użyć importImageFromUrl).
 */
export function toAbsoluteMediaUrl(url) {
  if (!url) return null
  if (url.startsWith('blob:') || url.startsWith('data:')) return url

  const relative = toRelativeStoragePath(url)
  if (relative) return relative

  if (url.startsWith('/')) return url

  return url
}

export function resolveStorageUrl(url) {
  if (!url) return null

  if (url.startsWith('blob:') || url.startsWith('data:')) {
    return url
  }

  const relative = toRelativeStoragePath(url)
  if (relative) {
    return relative
  }

  return url
}

export function imageUrlWithCacheBust(url, updatedAt = null) {
  const base = resolveStorageUrl(url)
  if (!base) return null
  if (base.startsWith('blob:') || base.startsWith('data:')) return base
  if (isExternalHttpUrl(base)) return base

  const version = updatedAt ? new Date(updatedAt).getTime() : Date.now()
  const sep = base.includes('?') ? '&' : '?'
  return `${base}${sep}v=${version}`
}

export function resolveItemImageUrl(image) {
  if (!image) return null
  const raw = image.url ?? image.external_url
  return imageUrlWithCacheBust(raw, image.updated_at)
}

/** URL-e galerii z API (obiekty) lub ze store kolekcji (stringi). */
export function itemGalleryUrls(item) {
  if (!item) return []

  if (item.images?.length) {
    const first = item.images[0]
    if (typeof first === 'string') {
      return item.images.map((src) => imageUrlWithCacheBust(src)).filter(Boolean)
    }
    return item.images
      .map((img) => imageUrlWithCacheBust(img.url ?? img.external_url, img.updated_at))
      .filter(Boolean)
  }

  const legacy = imageUrlWithCacheBust(item.image_url ?? item.cover)
  return legacy ? [legacy] : []
}

/** Whole image visible inside its box (background set separately via edge detection). */
export const itemImageContainClass = 'object-contain object-center'

export function mapItemImageUrls(item) {
  if (item?.images?.length) {
    return item.images.map(resolveItemImageUrl).filter(Boolean)
  }

  const legacy = resolveStorageUrl(item?.image_url)
  return legacy ? [legacy] : []
}
