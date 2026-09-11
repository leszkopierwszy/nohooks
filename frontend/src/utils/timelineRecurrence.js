import { PLANNED_EXPENSE_RECURRENCES } from '../constants/plannedExpenseIntervals'

export function anchorDateKey(event) {
  return event?.event_date?.slice?.(0, 10) ?? event?.event_date
}

export function isBirthdayEvent(event) {
  return event?.type === 'birthday'
}

export function isPlannedExpenseEvent(event) {
  return event?.type === 'planned_expense'
}

export function isPlannedExpenseYearly(event) {
  return isPlannedExpenseEvent(event) && event?.recurrence === 'yearly'
}

export function isPlannedExpenseInterval(event) {
  return (
    isPlannedExpenseEvent(event) &&
    ['monthly', 'quarterly', 'half_yearly'].includes(event?.recurrence)
  )
}

/** Urodziny lub planowany wydatek roczny (nie kwartał / pół roku). */
export function isYearlyRecurring(event) {
  return isBirthdayEvent(event) || isPlannedExpenseYearly(event)
}

export function isCalendarRecurring(event) {
  return isYearlyRecurring(event) || isPlannedExpenseInterval(event)
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

/** Dzień miesiąca z kotwicy, z uwzględnieniem lutego w latach nieprzestępnych. */
export function dayInMonth(anchorDateKey, year, month) {
  const anchorDay = Number(anchorDateKey.slice(8, 10))
  const anchorMonth = Number(anchorDateKey.slice(5, 7))
  let d = anchorDay
  if (anchorMonth === 2 && anchorDay === 29 && !isLeapYear(year)) {
    d = 28
  }
  const lastDay = new Date(year, month, 0).getDate()
  return Math.min(d, lastDay)
}

export function yearlyOccurrenceDate(anchorDateKey, year) {
  const month = Number(anchorDateKey.slice(5, 7))
  const d = dayInMonth(anchorDateKey, year, month)
  const m = String(month).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year}-${m}-${dd}`
}

/** @param {number} month 1–12 */
export function monthlyOccurrenceDate(anchorDateKey, year, month) {
  const d = dayInMonth(anchorDateKey, year, month)
  const m = String(month).padStart(2, '0')
  const dd = String(d).padStart(2, '0')
  return `${year}-${m}-${dd}`
}

/**
 * Czy w danym miesiącu kalendarza przypada płatność (wg kotwicy i interwału).
 * @param {number} viewMonth indeks 0–11
 */
export function occursInCalendarMonth(event, viewYear, viewMonth) {
  const anchor = anchorDateKey(event)
  const anchorMonth = Number(anchor.slice(5, 7))
  const month = viewMonth + 1

  if (isPlannedExpenseInterval(event)) {
    const diff = (month - anchorMonth + 12) % 12
    if (event.recurrence === 'monthly') return true
    if (event.recurrence === 'quarterly') return diff % 3 === 0
    if (event.recurrence === 'half_yearly') return diff % 6 === 0
    return false
  }

  if (isYearlyRecurring(event)) {
    return month === anchorMonth
  }

  const [y, m] = anchor.split('-').map(Number)
  return y === viewYear && m === month
}

/**
 * Data na kalendarzu w widoku miesiąca (null = brak wpisu w tym miesiącu).
 * @param {number} viewMonth indeks 0–11
 */
export function calendarDateKey(event, viewYear, viewMonth = new Date().getMonth()) {
  if (!occursInCalendarMonth(event, viewYear, viewMonth)) {
    return null
  }

  if (isYearlyRecurring(event)) {
    return yearlyOccurrenceDate(anchorDateKey(event), viewYear)
  }

  if (isPlannedExpenseInterval(event)) {
    return monthlyOccurrenceDate(anchorDateKey(event), viewYear, viewMonth + 1)
  }

  return anchorDateKey(event)
}

/**
 * Czy wydarzenie występuje w danym dniu kalendarza (dowolny miesiąc / widok dzień–tydzień).
 * @param {object} event
 * @param {string} dateKey YYYY-MM-DD
 */
export function eventOccursOnDate(event, dateKey) {
  if (!dateKey || !event) return false
  const parts = dateKey.split('-').map(Number)
  const y = parts[0]
  const viewMonth = parts[1] - 1
  if (!occursInCalendarMonth(event, y, viewMonth)) return false
  const cellKey = calendarDateKey(event, y, viewMonth)
  return cellKey === dateKey
}

function toDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** Najbliższa data płatności >= referenceDate. */
export function nextOccurrenceDate(event, referenceDate = new Date()) {
  const anchor = anchorDateKey(event)
  const refKey = toDateKey(referenceDate)
  let y = referenceDate.getFullYear()
  let m = referenceDate.getMonth() + 1

  for (let i = 0; i < 120; i++) {
    if (occursInCalendarMonth(event, y, m - 1)) {
      const key = isYearlyRecurring(event)
        ? yearlyOccurrenceDate(anchor, y)
        : monthlyOccurrenceDate(anchor, y, m)
      if (key >= refKey) return key
    }
    m++
    if (m > 12) {
      m = 1
      y++
    }
  }

  return isYearlyRecurring(event)
    ? yearlyOccurrenceDate(anchor, y)
    : monthlyOccurrenceDate(anchor, y, m)
}

export function displayDateKey(event, referenceDate = new Date()) {
  if (isCalendarRecurring(event)) {
    return nextOccurrenceDate(event, referenceDate)
  }
  return anchorDateKey(event)
}

export function yearsSinceAnchor(event, year) {
  const anchorYear = Number(anchorDateKey(event).slice(0, 4))
  return year - anchorYear
}

export function yearlyRecurrenceLabel(event, year = new Date().getFullYear()) {
  if (!isYearlyRecurring(event)) return null
  const count = yearsSinceAnchor(event, year)
  if (count < 0) return null
  if (isBirthdayEvent(event)) {
    return `${count}. urodziny`
  }
  if (count === 0) return 'pierwszy rok'
  return `${count}. rocznica`
}

export function birthdayAgeLabel(event, year = new Date().getFullYear()) {
  if (!isBirthdayEvent(event)) return null
  return yearlyRecurrenceLabel(event, year)
}

/** @deprecated */
export function isMonthlyRecurring(event) {
  return isPlannedExpenseEvent(event) && event?.recurrence === 'monthly'
}

export function nextMonthlyOccurrence(anchorDateKey, referenceDate) {
  return nextOccurrenceDate(
    { type: 'planned_expense', event_date: anchorDateKey, recurrence: 'monthly' },
    referenceDate
  )
}

export { PLANNED_EXPENSE_RECURRENCES }
