import en from '../locales/en.json'
import pl from '../locales/pl.json'

export const LOCALE_OPTIONS = [
  { value: 'en', labelKey: 'meta.locale.en' },
  { value: 'pl', labelKey: 'meta.locale.pl' },
]

export const DEFAULT_LOCALE = 'en'
export const FALLBACK_LOCALE = 'en'

const catalogs = {
  en: {
    ...en,
    meta: { locale: { en: 'English', pl: 'Polish' } },
  },
  pl: {
    ...pl,
    meta: { locale: { en: 'English', pl: 'Polski' } },
  },
}

let activeLocale = DEFAULT_LOCALE

function resolve(messages, key) {
  const parts = String(key).split('.')
  let node = messages
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

/**
 * @param {string} key — dot path, e.g. nav.overview
 * @param {Record<string, string|number>} [params]
 */
export function translate(key, params, locale = activeLocale) {
  let text =
    resolve(catalogs[locale], key) ??
    resolve(catalogs[FALLBACK_LOCALE], key) ??
    key

  if (params) {
    for (const [name, value] of Object.entries(params)) {
      text = text.replaceAll(`{${name}}`, String(value))
    }
  }
  return text
}

export function t(key, params) {
  return translate(key, params)
}

export function getLocale() {
  return activeLocale
}

export function setLocale(locale) {
  if (!catalogs[locale]) return false
  activeLocale = locale
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  return true
}

export function getCatalog(locale = activeLocale) {
  return catalogs[locale] ?? catalogs[FALLBACK_LOCALE]
}
