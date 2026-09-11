export const PURCHASE_CURRENCY_OPTIONS = [
  { value: 'PLN', label: 'PLN (zł)' },
  { value: 'EUR', label: 'EUR (€)' },
  { value: 'USD', label: 'USD ($)' },
  { value: 'GBP', label: 'GBP (£)' },
  { value: 'CHF', label: 'CHF' },
  { value: 'CZK', label: 'CZK (Kč)' },
]

const CURRENCY_VALUES = new Set(PURCHASE_CURRENCY_OPTIONS.map((o) => o.value))

export function normalizePurchaseCurrency(value) {
  if (!value) return 'PLN'
  const upper = String(value).trim().toUpperCase()
  return CURRENCY_VALUES.has(upper) ? upper : 'PLN'
}
