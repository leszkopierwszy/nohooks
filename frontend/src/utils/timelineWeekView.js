import { formatTimeRange, parseDateKey } from './calendarGrid'
import { plannedExpenseIntervalLabel } from '../constants/plannedExpenseIntervals'
import { timelineEventTypeMeta } from '../constants/timelineEventTypes'
import {
  isPlannedExpenseEvent,
  isYearlyRecurring,
  yearlyRecurrenceLabel,
} from './timelineRecurrence'

export function shortMonthDayLabel(dateKey) {
  if (!dateKey) return ''
  return new Intl.DateTimeFormat('pl-PL', {
    day: 'numeric',
    month: 'short',
  }).format(parseDateKey(dateKey))
}

export function weekEventScheduleLine(event) {
  const t = formatTimeRange(event)
  if (t) return t
  if (isYearlyRecurring(event) && yearlyRecurrenceLabel(event)) {
    return yearlyRecurrenceLabel(event)
  }
  if (isPlannedExpenseEvent(event)) {
    return plannedExpenseIntervalLabel(event.recurrence)
  }
  return timelineEventTypeMeta(event.type).label
}
