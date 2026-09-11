/** Adresy usług backendowych (docker-compose: model-assistant :8190, Langfuse :3100). */

function stripTrailingSlash(url) {
  return String(url || '').replace(/\/$/, '')
}

/** Bezpośredni URL UI Backend Settings (port 8190) — działa w iframe i nowych kartach. */
export function modelAssistantDirectBase() {
  const fromEnv = import.meta.env.VITE_MODEL_ASSISTANT_DIRECT_URL
  if (fromEnv) return stripTrailingSlash(fromEnv)

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:8190`
  }
  return 'http://127.0.0.1:8190'
}

export function modelAssistantDirectUrl(hash = '') {
  const base = modelAssistantDirectBase()
  if (!hash) return `${base}/`
  const fragment = hash.startsWith('#') ? hash : `#${hash}`
  return `${base}/${fragment}`
}

export const LANGFUSE_UI_URL =
  import.meta.env.VITE_LANGFUSE_URL || 'http://localhost:3100'

export const BACKEND_API_URL =
  import.meta.env.VITE_BACKEND_URL ||
  import.meta.env.VITE_DEV_API_PROXY ||
  'http://localhost:8000'

export const MODEL_ASSISTANT_HOME = modelAssistantDirectUrl()
export const MODEL_ASSISTANT_CATALOG = modelAssistantDirectUrl('bundles')
export const MODEL_ASSISTANT_ADD_MODEL = modelAssistantDirectUrl('add-model')
export const MODEL_ASSISTANT_LANGFUSE_SECTION = modelAssistantDirectUrl('langfuse')
