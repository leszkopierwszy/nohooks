/** Display / parse dates as dd-mm-yyyy while storing ISO yyyy-mm-dd keys. */

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toIsoDateKey(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatIsoToDmY(isoKey) {
  if (!isoKey) return ''
  const m = String(isoKey).match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

/**
 * @param {string} text — expected dd-mm-yyyy (also accepts d-m-yyyy / dd/mm/yyyy)
 * @returns {string|null} ISO yyyy-mm-dd or null if invalid
 */
export function parseDmYToIso(text) {
  const raw = String(text ?? '').trim()
  if (!raw) return null

  const normalized = raw.replace(/[./]/g, '-')
  const m = normalized.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
  if (!m) return null

  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return null
  if (month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > 2100) return null

  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null
  }

  return `${year}-${pad(month)}-${pad(day)}`
}

/** Build ISO timestamp for a calendar day, keeping local wall-clock time. */
export function isoTimestampFromDateKey(isoKey, base = new Date()) {
  const m = String(isoKey ?? '').match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return base.toISOString()
  const year = Number(m[1])
  const month = Number(m[2])
  const day = Number(m[3])
  const dt = new Date(
    year,
    month - 1,
    day,
    base.getHours(),
    base.getMinutes(),
    base.getSeconds(),
    base.getMilliseconds(),
  )
  return dt.toISOString()
}

/** Light input mask helper: insert dashes while typing digits. */
export function maskDmYInput(value) {
  const digits = String(value ?? '').replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}-${digits.slice(2)}`
  return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`
}
