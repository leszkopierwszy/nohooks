/**
 * Agregacja i formatowanie czasu pracy nad celami (wpisy goal_work w kalendarzu).
 */

export function formatWorkDuration(minutes) {
  const total = Math.max(0, Math.round(Number(minutes) || 0))
  if (total === 0) return '0 min'
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h > 0 && m > 0) return `${h} h ${m} min`
  if (h > 0) return `${h} h`
  return `${m} min`
}

export function isGoalWorkEvent(event) {
  return event?.type === 'goal_work'
}

/** @returns {Record<string, number>} goalId → suma minut */
export function aggregateWorkMinutesByGoal(events) {
  const map = {}
  for (const event of events ?? []) {
    if (!isGoalWorkEvent(event) || !event.growth_goal_id) continue
    const id = String(event.growth_goal_id)
    map[id] = (map[id] ?? 0) + Math.max(0, Number(event.work_minutes) || 0)
  }
  return map
}

export function workMinutesForGoal(events, goalId) {
  return aggregateWorkMinutesByGoal(events)[goalId] ?? 0
}
