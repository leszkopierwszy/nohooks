import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

export const useAdminStyleStore = defineStore('adminStyle', {
  state: () => ({
    modules: [],
    achievements: [],
    loading: false,
    error: '',
  }),

  actions: {
    async fetchModules() {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest('/admin/style-modules')
        this.modules = data?.data ?? data ?? []
        return this.modules
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async saveModule(payload, id = null) {
      if (id) {
        const row = await apiRequest(`/admin/style-modules/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        await this.fetchModules()
        return row
      }
      const row = await apiRequest('/admin/style-modules', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await this.fetchModules()
      return row
    },

    async deleteModule(id) {
      await apiRequest(`/admin/style-modules/${id}`, { method: 'DELETE' })
      this.modules = this.modules.filter((m) => Number(m.id) !== Number(id))
    },

    async fetchAchievements() {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest('/admin/style-achievements')
        this.achievements = data?.data ?? data ?? []
        return this.achievements
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async saveAchievement(payload, id = null) {
      if (id) {
        const row = await apiRequest(`/admin/style-achievements/${id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        await this.fetchAchievements()
        return row
      }
      const row = await apiRequest('/admin/style-achievements', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      await this.fetchAchievements()
      return row
    },

    async deleteAchievement(id) {
      await apiRequest(`/admin/style-achievements/${id}`, { method: 'DELETE' })
      this.achievements = this.achievements.filter(
        (a) => Number(a.id) !== Number(id),
      )
    },
  },
})
