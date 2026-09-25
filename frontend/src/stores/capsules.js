import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

export const CAPSULE_PRESETS = [
  'work',
  'travel',
  'summer',
  'winter',
  'smart_casual',
  'evening',
  'custom',
]

export const useCapsulesStore = defineStore('capsules', {
  state: () => ({
    capsules: [],
    analysis: null,
    loading: false,
    analyzing: false,
    error: '',
  }),

  actions: {
    async fetchCapsules({ entity_id } = {}) {
      this.loading = true
      this.error = ''
      try {
        const params = new URLSearchParams()
        if (entity_id != null && entity_id !== '') {
          params.set('entity_id', String(entity_id))
        }
        const q = params.toString()
        const rows = await apiRequest(`/capsule${q ? `?${q}` : ''}`)
        this.capsules = Array.isArray(rows) ? rows : []
        return this.capsules
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async analyze(payload) {
      this.analyzing = true
      this.error = ''
      try {
        const data = await apiRequest('/capsule/analyze', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.analysis = data
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.analyzing = false
      }
    },

    async saveCapsule(payload) {
      this.error = ''
      const data = await apiRequest('/capsule', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.capsules = [data, ...this.capsules.filter((c) => Number(c.id) !== Number(data.id))]
      return data
    },

    async deleteCapsule(id) {
      await apiRequest(`/capsule/${id}`, { method: 'DELETE' })
      this.capsules = this.capsules.filter((c) => Number(c.id) !== Number(id))
    },

    clearAnalysis() {
      this.analysis = null
      this.error = ''
    },
  },
})
