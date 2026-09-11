export const API_BASE = normalizeApiBase(import.meta.env.VITE_API_URL)

/** @param {string | undefined | null} base */
export function normalizeApiBase(base) {
  const raw = (base ?? '/api').trim()
  if (!raw) return '/api'
  const withoutTrailing = raw.replace(/\/+$/, '')
  if (withoutTrailing.endsWith('/api/api')) {
    return withoutTrailing.replace(/\/api\/api$/, '/api')
  }
  return withoutTrailing || '/api'
}

/** @param {string} path */
export function buildApiUrl(path) {
  const segment = path.startsWith('/') ? path : `/${path}`
  const base = API_BASE
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return `${base}${segment}`
  }
  return `${base.startsWith('/') ? base : `/${base}`}${segment}`
}

async function parseJsonResponse(response) {
  const text = await response.text()
  if (!text) return null

  const trimmed = text.trimStart()
  const looksLikeHtml =
    trimmed.startsWith('<!') ||
    trimmed.startsWith('<html') ||
    (trimmed.startsWith('<') && !trimmed.startsWith('<?'))

  if (looksLikeHtml) {
    throw new Error(apiHtmlResponseHint(response.status))
  }

  try {
    return JSON.parse(text)
  } catch (err) {
    if (looksLikeHtml || trimmed.startsWith('<')) {
      throw new Error(apiHtmlResponseHint(response.status))
    }
    throw new Error(
      err instanceof Error && err.message.includes('Unexpected token')
        ? apiHtmlResponseHint(response.status)
        : err instanceof Error
          ? err.message
          : 'Nie można odczytać odpowiedzi API.'
    )
  }
}

function apiHtmlResponseHint(status) {
  const statusHint = status ? ` (HTTP ${status})` : ''
  if (API_BASE.startsWith('/')) {
    return `Serwer zwrócił stronę HTML zamiast JSON${statusHint}. Użyj aplikacji przez Vite (http://localhost:5173) i upewnij się, że backend działa: docker compose up -d backend product-parser.`
  }
  return `Serwer zwrócił stronę HTML zamiast JSON${statusHint}. Sprawdź VITE_API_URL (obecnie: ${API_BASE}) — poprawna wartość to /api (dev) lub http://localhost:8000/api.`
}

export async function apiRequest(path, options = {}) {
  const {
    timeoutMs,
    headers: extraHeaders = {},
    method,
    body,
    ...rest
  } = options
  const controller = timeoutMs ? new AbortController() : null
  const timeoutId =
    controller && timeoutMs
      ? setTimeout(() => controller.abort(), timeoutMs)
      : null

  let response
  try {
    response = await fetch(buildApiUrl(path), {
      method: method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...extraHeaders,
      },
      body,
      signal: controller?.signal,
      ...rest,
    })
  } catch (err) {
    if (timeoutId) clearTimeout(timeoutId)
    const hint =
      API_BASE.startsWith('/')
        ? ' Sprawdź, czy backend działa (docker compose up backend).'
        : ' Sprawdź adres API (VITE_API_URL) i czy backend jest uruchomiony.'
    const aborted = err?.name === 'AbortError'
    throw new Error(
      aborted
        ? 'Przekroczono czas oczekiwania na odpowiedź API. Import produktu może trwać do ~2 min — spróbuj ponownie.'
        : err?.message === 'Failed to fetch'
          ? `Brak połączenia z API.${hint}`
          : err?.message ?? 'Błąd sieci przy połączeniu z API.'
    )
  }

  if (timeoutId) clearTimeout(timeoutId)

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await parseJsonResponse(response.clone())
      if (body?.message) message = body.message
      else if (body?.errors) {
        message = Object.values(body.errors).flat().join(' ')
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTML')) {
        throw err
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) return null

  return parseJsonResponse(response)
}

export async function apiFormRequest(path, formData, options = {}) {
  const { method, headers: extraHeaders = {}, ...rest } = options
  let response
  try {
    response = await fetch(buildApiUrl(path), {
      method: method ?? 'POST',
      headers: {
        Accept: 'application/json',
        ...extraHeaders,
      },
      body: formData,
      ...rest,
    })
  } catch (err) {
    throw new Error(
      err?.message === 'Failed to fetch'
        ? 'Brak połączenia z API przy wysyłaniu formularza.'
        : err?.message ?? 'Błąd sieci.'
    )
  }

  if (!response.ok) {
    let message = `Request failed (${response.status})`
    try {
      const body = await parseJsonResponse(response.clone())
      if (body?.message) message = body.message
      else if (body?.errors) {
        message = Object.values(body.errors).flat().join(' ')
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('HTML')) {
        throw err
      }
    }
    throw new Error(message)
  }

  if (response.status === 204) return null

  return parseJsonResponse(response)
}
