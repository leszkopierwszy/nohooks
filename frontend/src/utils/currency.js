import { apiRequest } from '../api/client'
import { normalizePurchaseCurrency } from '../constants/itemCurrencies'

let cachedRates = null
let ratesPromise = null

export async function fetchExchangeRates() {
  if (cachedRates) return cachedRates

  if (!ratesPromise) {
    ratesPromise = apiRequest('/exchange-rates')
      .then((data) => {
        cachedRates = data.rates ?? { PLN: 1 }
        return cachedRates
      })
      .catch(() => {
        cachedRates = {
          PLN: 1,
          EUR: 4.3,
          USD: 3.95,
          GBP: 5.05,
          CHF: 4.9,
          CZK: 0.17,
        }
        return cachedRates
      })
      .finally(() => {
        ratesPromise = null
      })
  }

  return ratesPromise
}

export function convertToPln(amount, currency, rates) {
  const value = Number(amount)
  if (!Number.isFinite(value) || value < 0) return null

  const code = normalizePurchaseCurrency(currency)
  if (code === 'PLN') return Math.round(value * 100) / 100

  const rate = rates?.[code]
  if (!rate) return null

  return Math.round(value * rate * 100) / 100
}

export function formatMoney(amount, currency = 'PLN', locale = 'pl-PL') {
  if (amount == null || amount === '') return null

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: normalizePurchaseCurrency(currency),
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))
}

export function formatPln(amount, locale = 'pl-PL') {
  return formatMoney(amount, 'PLN', locale)
}
