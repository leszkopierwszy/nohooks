import { apiRequest } from '../api/client'
import { growthTypeMeta } from '../constants/growthGoals'
import { translate as t } from '../i18n'

const GOAL_CALENDAR_COLOR = '#57534e'

function endTimeOneHourAfter(startTime) {
  const [h, m] = String(startTime || '09:00')
    .slice(0, 5)
    .split(':')
    .map(Number)
  const endH = (h + 1) % 24
  return `${String(endH).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function growthGoalCalendarLabel(goal) {
  const prefix =
    goal.status === 'completed' ? '✓ ' : ''
  const typeLabel = t(growthTypeMeta(goal.type).labelKey)
  return `${prefix}[${typeLabel}] ${goal.title}`
}

function calendarDateForGoal(goal) {
  if (goal?.event_date) return String(goal.event_date).slice(0, 10)
  if (goal?.created_at) return String(goal.created_at).slice(0, 10)
  return null
}

export function buildGrowthGoalCalendarPayload(goal) {
  const eventDate = calendarDateForGoal(goal)
  if (!eventDate) return null

  const remindersOn =
    Boolean(goal.reminders_enabled) &&
    goal.status === 'active' &&
    Boolean(goal.event_date)
  const startTime = remindersOn ? (goal.reminder_time || '09:00').slice(0, 5) : null

  return {
    type: 'growth_goal',
    label: growthGoalCalendarLabel(goal),
    event_date: eventDate,
    growth_goal_id: goal.id,
    all_day: !remindersOn,
    start_time: startTime,
    end_time: startTime ? endTimeOneHourAfter(startTime) : null,
    notes: goal.description?.trim() || null,
    color: GOAL_CALENDAR_COLOR,
    recurrence: null,
  }
}

async function deleteCalendarEvent(eventId) {
  if (!eventId) return
  try {
    await apiRequest(`/timeline-event/${eventId}`, { method: 'DELETE' })
  } catch {
    /* wpis mógł zostać usunięty ręcznie */
  }
}

/**
 * Tworzy lub aktualizuje wpis kalendarza dla celu (data wydarzenia).
 * @returns {{ calendar_event_id: number | null }}
 */
export async function syncGrowthGoalCalendarEvent(goal, previous = null) {
  const payload = buildGrowthGoalCalendarPayload(goal)
  const eventId = goal.calendar_event_id ?? previous?.calendar_event_id ?? null

  if (!payload) {
    if (eventId) await deleteCalendarEvent(eventId)
    return { calendar_event_id: null }
  }

  if (eventId) {
    try {
      const updated = await apiRequest(`/timeline-event/${eventId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      return { calendar_event_id: Number(updated.id) }
    } catch {
      return syncGrowthGoalCalendarEvent({ ...goal, calendar_event_id: null }, previous)
    }
  }

  const created = await apiRequest('/timeline-event', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return { calendar_event_id: Number(created.id) }
}

export async function removeGrowthGoalCalendarEvent(goal) {
  if (!goal?.calendar_event_id) return
  await deleteCalendarEvent(goal.calendar_event_id)
}
