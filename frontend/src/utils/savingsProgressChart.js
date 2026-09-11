const MONTHS_PL = [
  'sty',
  'lut',
  'mar',
  'kwi',
  'maj',
  'cze',
  'lip',
  'sie',
  'wrz',
  'paź',
  'lis',
  'gru',
]

export function parseDateKey(dateKey) {
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return null
  const [y, m, d] = dateKey.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function dateKeyFromDate(dt) {
  const y = dt.getFullYear()
  const m = String(dt.getMonth() + 1).padStart(2, '0')
  const day = String(dt.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function monthKeyFromDateKey(dateKey) {
  const dt = parseDateKey(dateKey)
  if (!dt) return ''
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}

/** Z pola type=month (YYYY-MM) → pierwszy dzień miesiąca. */
export function dateKeyFromMonthInput(monthValue) {
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return null
  return `${monthValue}-01`
}

export function monthLabel(dateKey, { shortYear = true } = {}) {
  const dt = parseDateKey(dateKey)
  if (!dt) return ''
  const mon = MONTHS_PL[dt.getMonth()]
  const y = dt.getFullYear()
  if (!shortYear) return `${mon} ${y}`
  return `${mon} '${String(y).slice(-2)}`
}

export function normalizeChartPoints(raw) {
  if (!Array.isArray(raw)) return []
  const byDate = new Map()
  for (const row of raw) {
    if (!row?.date) continue
    const v = Number(row.value)
    if (!Number.isFinite(v)) continue
    byDate.set(String(row.date), { date: String(row.date), value: Math.max(0, v) })
  }
  return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date))
}

export function computeTimeDomain(points, { padMonths = 1 } = {}) {
  if (!points.length) return null
  const times = points.map((p) => parseDateKey(p.date)?.getTime()).filter(Number.isFinite)
  if (!times.length) return null
  let min = Math.min(...times)
  let max = Math.max(...times)
  if (min === max) {
    const d = new Date(min)
    d.setMonth(d.getMonth() - padMonths)
    min = d.getTime()
    d.setTime(max)
    d.setMonth(d.getMonth() + padMonths)
    max = d.getTime()
  } else {
    const dMin = new Date(min)
    dMin.setMonth(dMin.getMonth() - padMonths)
    min = dMin.getTime()
    const dMax = new Date(max)
    dMax.setMonth(dMax.getMonth() + padMonths)
    max = dMax.getTime()
  }
  return { min, max }
}

export function xFromDate(dateKey, domain, chartWidth, padL, padR) {
  const t = parseDateKey(dateKey)?.getTime()
  if (t == null || !domain) return padL
  const inner = chartWidth - padL - padR
  const ratio = (t - domain.min) / (domain.max - domain.min || 1)
  return padL + inner * Math.max(0, Math.min(1, ratio))
}

export function monthTicksForDomain(domain, chartWidth, padL, padR) {
  if (!domain) return []
  const ticks = []
  const start = new Date(domain.min)
  const cursor = new Date(start.getFullYear(), start.getMonth(), 1)
  let lastYear = null
  while (cursor.getTime() <= domain.max) {
    const key = dateKeyFromDate(cursor)
    const year = cursor.getFullYear()
    const showYear = year !== lastYear
    ticks.push({
      date: key,
      x: xFromDate(key, domain, chartWidth, padL, padR),
      label: showYear ? monthLabel(key) : MONTHS_PL[cursor.getMonth()],
    })
    lastYear = year
    cursor.setMonth(cursor.getMonth() + 1)
  }
  return ticks
}

export function formatCompactPln(value) {
  return (
    Number(value).toLocaleString('pl-PL', {
      maximumFractionDigits: 0,
    }) + ' PLN'
  )
}
