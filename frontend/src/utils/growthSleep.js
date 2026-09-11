/** Minuty snu z godzin HH:MM (budzenie następnego dnia, jeśli wake <= bed). */
export function computeSleepDurationMinutes(bedTime, wakeTime) {
  if (!bedTime || !wakeTime) return null
  const parse = (t) => {
    const [h, m] = String(t).split(':').map(Number)
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null
    return h * 60 + m
  }
  const bed = parse(bedTime)
  const wake = parse(wakeTime)
  if (bed == null || wake == null) return null
  let end = wake
  if (end <= bed) end += 24 * 60
  return end - bed
}

export function formatSleepDuration(minutes, locale = 'pl-PL') {
  if (minutes == null || minutes < 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (locale.startsWith('pl')) {
    if (h && m) return `${h} h ${m} min`
    if (h) return `${h} h`
    return `${m} min`
  }
  if (h && m) return `${h}h ${m}m`
  if (h) return `${h}h`
  return `${m}m`
}
