/** Parse balance from number or strings like "24 080.50 PLN". */
export function parseBalancePln(value) {
  if (value == null || value === '') return 0
  if (typeof value === 'number' && Number.isFinite(value)) return value
  const n = parseFloat(String(value).replace(/PLN/gi, '').replace(/\s/g, '').replace(',', '.').trim())
  return Number.isFinite(n) ? n : 0
}

export function formatBalancePln(amount) {
  const v = Number.isFinite(amount) ? amount : 0
  return (
    v.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' PLN'
  )
}

export function newHistoryId() {
  return `h_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}
