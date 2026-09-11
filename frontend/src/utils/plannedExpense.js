import { anchorDateKey } from './timelineRecurrence'
import {
  plannedExpenseIntervalLabel,
  PLANNED_EXPENSE_RECURRENCES,
} from '../constants/plannedExpenseIntervals'
import { usageFrequencyLabel } from '../constants/usageFrequency'
import { monthlyEquivalentAmount } from './plannedExpenseProjection'

export { PLANNED_EXPENSE_INTERVALS, plannedExpenseIntervalLabel } from '../constants/plannedExpenseIntervals'

/** Wiersz tabeli Finance ↔ zdarzenie timeline. */
export function eventToExpenseRow(event) {
  const recurrence =
    event.recurrence && PLANNED_EXPENSE_RECURRENCES.includes(event.recurrence)
      ? event.recurrence
      : 'monthly'

  return {
    id: event.id,
    plan: event.label ?? '',
    name: event.location?.trim() ?? '',
    category: event.expense_category?.trim() ?? '',
    status: event.is_active !== false,
    recurrence,
    usage_frequency: event.usage_frequency ?? 'monthly',
    usage_times_per_month:
      event.usage_times_per_month != null ? String(event.usage_times_per_month) : '',
    price: event.planned_amount != null ? String(event.planned_amount) : '',
    currency: event.currency ?? 'PLN',
    event_date: anchorDateKey(event),
    monthly_equivalent: monthlyEquivalentAmount(
      event.planned_amount,
      recurrence
    ),
  }
}

export function expenseRowToPayload(row) {
  const eventDate = row.event_date?.slice?.(0, 10) ?? defaultAnchorDate(row)

  const recurrence = PLANNED_EXPENSE_RECURRENCES.includes(row.recurrence)
    ? row.recurrence
    : 'monthly'

  const customUses =
    row.usage_times_per_month !== '' && row.usage_times_per_month != null
      ? Number(row.usage_times_per_month)
      : null

  return {
    type: 'planned_expense',
    label: row.plan.trim(),
    location: row.name.trim() || null,
    expense_category: row.category.trim() || null,
    is_active: Boolean(row.status),
    event_date: eventDate,
    recurrence,
    usage_frequency: row.usage_frequency || 'monthly',
    usage_times_per_month:
      customUses != null && Number.isFinite(customUses) && customUses > 0
        ? customUses
        : null,
    planned_amount: row.price !== '' && row.price != null ? Number(row.price) : null,
    currency: row.currency || 'PLN',
    all_day: true,
    notes: null,
    link: null,
  }
}

function defaultAnchorDate(row) {
  const day = row.event_date ? Number(row.event_date.slice(8, 10)) : 1
  const today = new Date()
  const y = today.getFullYear()
  const m = String(today.getMonth() + 1).padStart(2, '0')
  const d = String(Math.min(day, 28)).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function formatExpensePayDay(row) {
  if (!row.event_date) return '—'
  return `dzień ${Number(row.event_date.slice(8, 10))}`
}

export function formatExpenseBilling(row) {
  if (!row.event_date) return '—'
  return `${plannedExpenseIntervalLabel(row.recurrence)}, ${formatExpensePayDay(row)}`
}

export function formatUsageFrequency(row) {
  return usageFrequencyLabel(row.usage_frequency)
}

export function formatExpensePrice(row) {
  if (row.price === '' || row.price == null) return '—'
  const n = Number(row.price)
  if (!Number.isFinite(n)) return row.price
  return n.toLocaleString('pl-PL', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function activeExpensesSubtotal(rows) {
  return rows
    .filter((e) => e.status)
    .reduce((sum, e) => sum + (Number(e.price) || 0), 0)
}
