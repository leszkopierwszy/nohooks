const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif'])

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Nie udało się odczytać obrazu.'))
    img.crossOrigin = 'anonymous'
    img.src = url
  })
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Konwersja obrazu nie powiodła się.'))),
      type,
      quality
    )
  })
}

/**
 * Zapewnia plik akceptowany przez Laravel (`image` / mimes) przed wysłaniem FormData.
 */
export async function normalizeUploadImageFile(
  file,
  { preferPng = false, maxEdge = 4096 } = {}
) {
  if (!(file instanceof Blob) || file.size === 0) {
    throw new Error('Pusty lub nieprawidłowy plik obrazu.')
  }

  const type = (file.type || '').toLowerCase().split(';')[0].trim()
  const baseName =
    file instanceof File ? file.name.replace(/\.[^.]+$/, '') || 'upload' : 'upload'

  if (ALLOWED_TYPES.has(type) && !preferPng) {
    if (file instanceof File) return file
    const ext = type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : type === 'image/gif' ? 'gif' : 'jpg'
    return new File([file], `${baseName}.${ext}`, { type })
  }

  if (type === 'image/png' && preferPng && file instanceof File) {
    return file
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImageElement(objectUrl)
    let { naturalWidth: w, naturalHeight: h } = img
    if (!w || !h) throw new Error('Obraz ma zerowy rozmiar.')

    const scale = Math.min(1, maxEdge / Math.max(w, h))
    w = Math.max(1, Math.round(w * scale))
    h = Math.max(1, Math.round(h * scale))

    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas niedostępny.')
    ctx.drawImage(img, 0, 0, w, h)

    const outType = preferPng ? 'image/png' : 'image/jpeg'
    const outExt = preferPng ? 'png' : 'jpg'
    const blob = await canvasToBlob(canvas, outType, preferPng ? undefined : 0.92)
    return new File([blob], `${baseName}.${outExt}`, { type: outType })
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
