/** @param {{ notes?: string | null, description?: string | null }} event */
export function eventNotes(event) {
  const notes = event?.notes?.trim()
  if (notes) return notes
  const legacy = event?.description?.trim()
  return legacy || ''
}

/** @param {string | null | undefined} link */
export function formatEventLink(link) {
  const raw = link?.trim()
  if (!raw) return null
  if (/^https?:\/\//i.test(raw)) return raw
  return `https://${raw}`
}
