import { defineStore } from 'pinia'
import { fetchSiteConfig } from '../api/config'

const FALLBACK_NAME = 'nohooks'

export const useSiteConfigStore = defineStore('siteConfig', {
  state: () => ({
    appName: FALLBACK_NAME,
    emailVerificationRequired: false,
    loaded: false,
    loading: false,
    error: '',
  }),

  actions: {
    async load() {
      if (this.loaded || this.loading) return
      this.loading = true
      this.error = ''
      try {
        const data = await fetchSiteConfig()
        if (data?.appName && String(data.appName).trim()) {
          this.appName = String(data.appName).trim()
        }
        this.emailVerificationRequired = Boolean(data?.emailVerificationRequired)
        this.loaded = true
        if (typeof document !== 'undefined' && this.appName) {
          document.title = this.appName
        }
      } catch (err) {
        this.error = err?.message || 'Failed to load site config'
        this.loaded = true
      } finally {
        this.loading = false
      }
    },
  },
})
