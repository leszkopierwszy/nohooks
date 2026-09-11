import { defineStore } from 'pinia'
import {
  DEFAULT_LOCALE,
  LOCALE_OPTIONS,
  setLocale as applyI18nLocale,
  translate,
} from '../i18n'

const STORAGE_KEY = 'nohooks.locale'

export { LOCALE_OPTIONS }

export const useLocaleStore = defineStore('locale', {
  state: () => ({
    locale: DEFAULT_LOCALE,
  }),

  getters: {
    localeOptions: () =>
      LOCALE_OPTIONS.map((opt) => ({
        value: opt.value,
        label: translate(opt.labelKey, undefined, opt.value),
      })),
  },

  actions: {
    init() {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        if (stored && LOCALE_OPTIONS.some((o) => o.value === stored)) {
          this.locale = stored
        }
      } catch {
        this.locale = DEFAULT_LOCALE
      }
      applyI18nLocale(this.locale)
    },

    setLocale(locale) {
      if (!LOCALE_OPTIONS.some((o) => o.value === locale)) return
      this.locale = locale
      applyI18nLocale(locale)
      try {
        localStorage.setItem(STORAGE_KEY, locale)
      } catch {
        // ignore
      }
      try {
        import('./appSearch').then(({ useAppSearchStore }) => {
          useAppSearchStore().indexReady = false
        })
      } catch {
        // ignore
      }
    },
  },
})
