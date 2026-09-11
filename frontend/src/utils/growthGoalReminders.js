/** @param {string} dateKey YYYY-MM-DD */
export function addDaysToDateKey(dateKey, days) {
  const d = new Date(`${dateKey}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function todayDateKey() {
  return new Date().toISOString().slice(0, 10)
}

export function daysUntilEvent(eventDate, fromDateKey = todayDateKey()) {
  if (!eventDate) return null
  const from = new Date(`${fromDateKey}T12:00:00`)
  const to = new Date(`${eventDate.slice(0, 10)}T12:00:00`)
  return Math.round((to - from) / (24 * 60 * 60 * 1000))
}

export function reminderDismissKey(goalId, offsetDays, onDateKey = todayDateKey()) {
  return `${goalId}:${offsetDays}:${onDateKey}`
}

/**
 * Przypomnienia na dziś dla aktywnego celu.
 * @returns {{ offsetDays: number, eventDate: string, daysLeft: number }[]}
 */
export function dueRemindersForGoal(goal, onDateKey = todayDateKey()) {
  if (!goal?.reminders_enabled || goal.status !== 'active') return []
  const eventDate = goal.event_date?.slice?.(0, 10)
  if (!eventDate) return []

  const offsets = Array.isArray(goal.reminder_days_before)
    ? goal.reminder_days_before.map(Number).filter((n) => Number.isFinite(n))
    : []

  const dismissed = goal.reminder_dismissed ?? {}
  const due = []

  for (const offset of offsets) {
    const remindOn = addDaysToDateKey(eventDate, -offset)
    if (remindOn !== onDateKey) continue
    const key = reminderDismissKey(goal.id, offset, onDateKey)
    if (dismissed[key]) continue
    due.push({
      offsetDays: offset,
      eventDate,
      daysLeft: daysUntilEvent(eventDate, onDateKey),
    })
  }

  return due.sort((a, b) => a.offsetDays - b.offsetDays)
}

export function isEventOverdue(goal, onDateKey = todayDateKey()) {
  if (!goal?.event_date || goal.status !== 'active') return false
  const left = daysUntilEvent(goal.event_date, onDateKey)
  return left != null && left < 0
}

export function isEventSoon(goal, withinDays = 7, onDateKey = todayDateKey()) {
  if (!goal?.event_date || goal.status !== 'active') return false
  const left = daysUntilEvent(goal.event_date, onDateKey)
  return left != null && left >= 0 && left <= withinDays
}
