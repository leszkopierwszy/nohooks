import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'

export const useStyleJourneyStore = defineStore('styleJourney', {
  state: () => ({
    loading: false,
    syncing: false,
    error: '',
    journey: null,
    scoreboard: null,
    scoreboardMe: null,
  }),

  getters: {
    modules: (state) => state.journey?.modules ?? [],
    achievements: (state) => state.journey?.achievements ?? [],
    xp: (state) => state.journey?.xp ?? 0,
    level: (state) => state.journey?.level ?? 1,
    rank: (state) => state.journey?.rank ?? null,
    progress: (state) =>
      state.journey?.progress ?? { completed: 0, total: 0, percent: 0 },
  },

  actions: {
    async fetchJourney(entityId) {
      this.loading = true
      this.error = ''
      try {
        const data = await apiRequest(
          `/style-journey?entity_id=${Number(entityId)}`,
        )
        this.journey = data
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async sync(entityId) {
      this.syncing = true
      this.error = ''
      try {
        const data = await apiRequest('/style-journey/sync', {
          method: 'POST',
          body: JSON.stringify({ entity_id: Number(entityId) }),
        })
        this.journey = data.journey ?? data
        return data
      } catch (err) {
        this.error = err.message ?? String(err)
        throw err
      } finally {
        this.syncing = false
      }
    },

    async completeModule(entityId, moduleId, checkIds = []) {
      this.error = ''
      const data = await apiRequest(
        `/style-journey/modules/${Number(moduleId)}/complete`,
        {
          method: 'POST',
          body: JSON.stringify({
            entity_id: Number(entityId),
            check_ids: checkIds,
          }),
        },
      )
      // complete returns full journey (or journey + module_eval)
      if (data.modules) {
        this.journey = {
          entity_id: data.entity_id,
          xp: data.xp,
          level: data.level,
          xp_per_level: data.xp_per_level,
          rank: data.rank,
          progress: data.progress,
          modules: data.modules,
          achievements: data.achievements,
        }
      }
      return data
    },

    async fetchScoreboard(limit = 10) {
      const data = await apiRequest(
        `/style-journey/scoreboard?limit=${Number(limit)}`,
      )
      this.scoreboard = data.entries ?? []
      this.scoreboardMe = data.me ?? null
      return data
    },
  },
})
