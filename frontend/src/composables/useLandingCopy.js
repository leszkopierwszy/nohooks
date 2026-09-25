import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useLocaleStore } from '../stores/locale'
import { useSiteConfigStore } from '../stores/siteConfig'

function resolvePath(obj, path) {
  const parts = String(path).split('.')
  let node = obj
  for (const part of parts) {
    if (node == null || typeof node !== 'object') return undefined
    node = node[part]
  }
  return typeof node === 'string' ? node : undefined
}

function interpolate(text, params) {
  if (!params) return text
  let out = text
  for (const [name, value] of Object.entries(params)) {
    out = out.replaceAll(`{${name}}`, String(value))
  }
  return out
}

/**
 * Landing copy from backend config/landing.php (via GET /api/config).
 */
export function useLandingCopy() {
  const siteConfig = useSiteConfigStore()
  const localeStore = useLocaleStore()
  const { locale } = storeToRefs(localeStore)

  const appName = computed(() => siteConfig.appName || 'nohooks')
  const year = computed(() => new Date().getFullYear())

  const copy = computed(() => {
    const all = siteConfig.landing || {}
    return all[locale.value] || all.en || all.pl || {}
  })

  function lt(path, extraParams = {}) {
    const raw =
      resolvePath(copy.value, path) ??
      resolvePath(siteConfig.landing?.en, path) ??
      path
    return interpolate(raw, {
      name: appName.value,
      year: year.value,
      ...extraParams,
    })
  }

  return {
    appName,
    year,
    copy,
    lt,
  }
}
