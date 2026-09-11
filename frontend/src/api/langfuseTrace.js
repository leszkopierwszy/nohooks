/** Id trace Langfuse (32 znaki hex) — wspólny dla importu i zapisu itemu. */
export function newTraceId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '')
  }
  return `${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`.slice(0, 32)
}

export function traceHeaders(traceId) {
  if (!traceId) return {}
  return { 'X-Langfuse-Trace-Id': traceId }
}
