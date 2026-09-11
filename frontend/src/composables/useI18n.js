import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { translate } from '../i18n'
import { useLocaleStore } from '../stores/locale'

export function useI18n() {
  const localeStore = useLocaleStore()
  const { locale } = storeToRefs(localeStore)

  const t = (key, params) => translate(key, params, locale.value)

  return {
    locale,
    localeOptions: computed(() => localeStore.localeOptions),
    setLocale: (code) => localeStore.setLocale(code),
    t,
  }
}
