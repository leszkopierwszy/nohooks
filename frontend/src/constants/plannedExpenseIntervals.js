export const PLANNED_EXPENSE_INTERVALS = [
  { value: 'monthly', label: 'Co miesiąc' },
  { value: 'quarterly', label: 'Co kwartał' },
  { value: 'half_yearly', label: 'Co pół roku' },
  { value: 'yearly', label: 'Co rok' },
]

const LABEL_BY_VALUE = Object.fromEntries(
  PLANNED_EXPENSE_INTERVALS.map((i) => [i.value, i.label])
)

export function plannedExpenseIntervalLabel(recurrence) {
  return LABEL_BY_VALUE[recurrence] ?? recurrence ?? '—'
}

/** Kolory FlatBadge (bez zielonego — ten jest dla statusu Active). */
export const INTERVAL_BADGE_COLORS = {
  monthly: 'indigo',
  quarterly: 'purple',
  half_yearly: 'pink',
  yearly: 'yellow',
}

export function plannedExpenseIntervalBadgeColor(recurrence) {
  return INTERVAL_BADGE_COLORS[recurrence] ?? 'gray'
}

export const PLANNED_EXPENSE_RECURRENCES = PLANNED_EXPENSE_INTERVALS.map((i) => i.value)
