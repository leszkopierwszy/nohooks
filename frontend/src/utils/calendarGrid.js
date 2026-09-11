const WEEKDAY_LABELS = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

const MONTH_NAMES = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
]

function pad(n) {
  return String(n).padStart(2, '0')
}

export function toDateKey(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function parseDateKey(key) {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

export function addDaysToDateKey(dateKey, days) {
  const date = parseDateKey(dateKey)
  date.setDate(date.getDate() + days)
  return toDateKey(date)
}

export function daysFromToday(dateKey) {
  const today = parseDateKey(toDateKey(new Date()))
  const target = parseDateKey(dateKey)
  return Math.round((target - today) / (1000 * 60 * 60 * 24))
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month]} ${year}`
}

export function weekdayLabels() {
  return WEEKDAY_LABELS
}

/** @param {number} year @param {number} month 0-based */
export function buildMonthDays(year, month) {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() + 6) % 7
  const gridStart = new Date(year, month, 1 - startOffset)

  const todayKey = toDateKey(new Date())
  const days = []

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    const dateKey = toDateKey(date)

    days.push({
      date: dateKey,
      day: date.getDate(),
      isCurrentMonth: date.getMonth() === month,
      isToday: dateKey === todayKey,
    })
  }

  return days
}

export function monthRangeKeys(year, month) {
  const days = buildMonthDays(year, month)
  return { from: days[0].date, to: days[days.length - 1].date }
}

/** Poniedziałek tygodnia zawierającego anchorDateKey (Pn–Nd). */
export function weekMondayDateKey(anchorDateKey) {
  const d = parseDateKey(anchorDateKey)
  const dow = (d.getDay() + 6) % 7
  d.setDate(d.getDate() - dow)
  return toDateKey(d)
}

/** Siedem dni od podanego poniedziałku (weekMondayKey). */
export function buildWeekDays(weekMondayKey) {
  const mon = parseDateKey(weekMondayKey)
  const todayKey = toDateKey(new Date())
  const days = []
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(mon)
    date.setDate(mon.getDate() + i)
    const dateKey = toDateKey(date)
    days.push({
      date: dateKey,
      day: date.getDate(),
      month: date.getMonth(),
      weekdayShort: WEEKDAY_LABELS[i],
      isToday: dateKey === todayKey,
    })
  }
  return days
}

export function weekRangeKeys(weekMondayKey) {
  return { from: weekMondayKey, to: addDaysToDateKey(weekMondayKey, 6) }
}

export function formatEventDate(dateKey, locale = 'pl-PL') {
  return new Intl.DateTimeFormat(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(dateKey))
}

export function formatTimeRange(event) {
  if (event.all_day) return 'Cały dzień'
  if (!event.start_time && !event.end_time) return ''

  const fmt = (t) => (t ? t.slice(0, 5) : '')
  const start = fmt(event.start_time)
  const end = fmt(event.end_time)

  if (start && end) return `${start} – ${end}`
  if (start) return start
  return end
}
