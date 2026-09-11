import { timelineEventTypeMeta } from '../constants/timelineEventTypes'
import { plannedExpenseIntervalLabel } from '../constants/plannedExpenseIntervals'
import { formatEventDate, formatTimeRange } from './calendarGrid'
import { formatMoney } from './currency'
import { eventNotes } from './timelineEvent'
import { formatWorkDuration } from './growthGoalWork'
import {
  anchorDateKey,
  displayDateKey,
  isPlannedExpenseEvent,
  isYearlyRecurring,
  yearlyRecurrenceLabel,
} from './timelineRecurrence'

export function eventMatchesTimelineSearch(event, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return true

  const typeLabel = timelineEventTypeMeta(event.type).label
  const haystack = [
    event.label,
    event.location,
    eventNotes(event),
    event.link,
    typeLabel,
    formatEventDate(displayDateKey(event)),
    displayDateKey(event),
    anchorDateKey(event),
    isPlannedExpenseEvent(event) ? plannedExpenseIntervalLabel(event.recurrence) : '',
    isYearlyRecurring(event) ? yearlyRecurrenceLabel(event) : '',
    formatEventDate(anchorDateKey(event)),
    formatTimeRange(event),
    event.type === 'planned_expense' && event.planned_amount != null
      ? formatMoney(event.planned_amount, event.currency ?? 'PLN')
      : '',
    event.type === 'goal_work' && event.work_minutes != null
      ? formatWorkDuration(event.work_minutes)
      : '',
    event.growth_goal_id ?? '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  return haystack.includes(q)
}
