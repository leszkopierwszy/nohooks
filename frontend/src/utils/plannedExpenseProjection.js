import { resolveUsageTimesPerMonth } from '../constants/usageFrequency'

const DAYS_PER_MONTH = 30

/** Kwota z jednej płatności → równowartość miesięczna. */
export function monthlyEquivalentAmount(price, recurrence) {
  const amount = Number(price)
  if (!Number.isFinite(amount) || amount <= 0) return 0

  switch (recurrence) {
    case 'monthly':
      return amount
    case 'quarterly':
      return amount / 3
    case 'half_yearly':
      return amount / 6
    case 'yearly':
      return amount / 12
    default:
      return amount
  }
}

export function usageTimesForRow(row) {
  return resolveUsageTimesPerMonth(row.usage_frequency, row.usage_times_per_month)
}

/** Koszt jednego użycia (zł). */
export function costPerUse(row) {
  const monthly = monthlyEquivalentAmount(row.price, row.recurrence)
  const uses = usageTimesForRow(row)
  if (!monthly || !uses) return null
  return monthly / uses
}

/** Koszt „dzienny” — miesięczny / 30. */
export function costPerDay(row) {
  const monthly = monthlyEquivalentAmount(row.price, row.recurrence)
  if (!monthly) return null
  return monthly / DAYS_PER_MONTH
}

export function formatPln(value, digits = 2) {
  if (value == null || !Number.isFinite(value)) return '—'
  return (
    value.toLocaleString('pl-PL', {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }) + ' zł'
  )
}

export function projectionTotals(rows, { period = 'month' } = {}) {
  const monthly = rows.reduce(
    (sum, row) => sum + monthlyEquivalentAmount(row.price, row.recurrence),
    0
  )
  if (period === 'year') {
    return { monthly, period: monthly * 12, label: 'rocznie' }
  }
  return { monthly, period: monthly, label: 'miesięcznie' }
}
