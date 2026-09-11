import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'
import { isAnimalSoul, isPrimSoul, SOUL_TYPE_ANIMAL, SOUL_TYPE_PRIM } from '../constants/soulTypes'

const STORAGE_KEY = 'nohooks.activePersonaId'

const AVATAR_BY_NAME = {
  'Bartosz Szczypiorski': '/src/pics/me4.png',
  'Nathalie Rose LeBlanc': '/src/pics/me.jpg',
}

export const usePersonasStore = defineStore('personas', {
  state: () => ({
    personas: [],
    activePersonaId: readStoredActiveId(),
    loading: false,
    error: null,
  }),

  getters: {
    prims: (state) => state.personas.filter(isPrimSoul),
    animals: (state) => state.personas.filter(isAnimalSoul),

    activePersona(state) {
      if (!state.activePersonaId) return null
      return (
        state.personas.find((p) => p.id === state.activePersonaId) ??
        state.personas.find((p) => String(p.id) === String(state.activePersonaId)) ??
        null
      )
    },

    activePrim(state) {
      const active = state.personas.find(
        (p) =>
          p.id === state.activePersonaId ||
          String(p.id) === String(state.activePersonaId),
      )
      return active && isPrimSoul(active) ? active : null
    },
  },

  actions: {
    async fetchPersonas() {
      this.loading = true
      this.error = null

      try {
        const entities = await apiRequest('/entity')
        this.personas = entities.map((entity) => ({
          ...entity,
          imageUrl: entity.avatar_url ?? AVATAR_BY_NAME[entity.name] ?? null,
        }))

        const prims = this.prims
        if (prims.length && !this.activePersonaId) {
          this.setActivePersona(prims[0].id)
        } else if (
          this.activePersonaId &&
          !this.personas.some((p) => p.id === this.activePersonaId)
        ) {
          this.setActivePersona(prims[0]?.id ?? null)
        } else if (this.activePersonaId) {
          const active = this.personas.find((p) => p.id === this.activePersonaId)
          if (active && isAnimalSoul(active) && prims.length) {
            this.setActivePersona(prims[0].id)
          }
        }
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    setActivePersona(id) {
      this.activePersonaId = id ? Number(id) : null
      if (this.activePersonaId) {
        localStorage.setItem(STORAGE_KEY, String(this.activePersonaId))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    },

    async fetchPersona(id) {
      return apiRequest(`/entity/${id}`)
    },

    async createSoul({ name, type = SOUL_TYPE_PRIM, description = '', gender = null }) {
      const body = {
        name: String(name).trim(),
        type,
        description: description?.trim() || undefined,
        gender: gender || undefined,
      }
      const entity = await apiRequest('/entity', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      await this.fetchPersonas()
      return entity
    },

    async createAnimal({
      name,
      description = '',
      species,
      birthDate = null,
      sex = null,
      biometrics = null,
      expenseFrequency = 'monthly',
    }) {
      const body = {
        name: String(name).trim(),
        type: SOUL_TYPE_ANIMAL,
        species,
        description: description?.trim() || undefined,
        birth_date: birthDate || undefined,
        sex: sex || undefined,
      }

      const entity = await apiRequest('/entity', {
        method: 'POST',
        body: JSON.stringify(body),
      })

      if (biometrics && Object.keys(biometrics).length) {
        await apiRequest(`/entity/${entity.id}/body-snapshots`, {
          method: 'POST',
          body: JSON.stringify(biometrics),
        })
      }

      const { usePetExpenseAccountsStore } = await import('./petExpenseAccounts')
      const expenseAccount = usePetExpenseAccountsStore().createForAnimal(entity, {
        species,
        defaultFrequency: expenseFrequency,
      })

      await this.fetchPersonas()
      return { entity, expenseAccount }
    },

    async updateAnimal(id, {
      name,
      description = '',
      species,
      birthDate = null,
      sex = null,
      biometrics = null,
      snapshotId = null,
      expenseFrequency = 'monthly',
    }) {
      const body = {
        name: String(name).trim(),
        species,
        description: description?.trim() || null,
        birth_date: birthDate || null,
        sex: sex || null,
      }

      const entity = await apiRequest(`/entity/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })

      if (biometrics && Object.keys(biometrics).length) {
        if (snapshotId) {
          await apiRequest(`/entity/${id}/body-snapshots/${snapshotId}`, {
            method: 'PUT',
            body: JSON.stringify(biometrics),
          })
        } else {
          await apiRequest(`/entity/${id}/body-snapshots`, {
            method: 'POST',
            body: JSON.stringify(biometrics),
          })
        }
      }

      const { usePetExpenseAccountsStore } = await import('./petExpenseAccounts')
      usePetExpenseAccountsStore().syncForAnimal(entity, {
        species,
        defaultFrequency: expenseFrequency,
      })

      await this.fetchPersonas()
      return entity
    },

    async deleteAnimal(id) {
      await apiRequest(`/entity/${id}`, { method: 'DELETE' })
      const { usePetExpenseAccountsStore } = await import('./petExpenseAccounts')
      usePetExpenseAccountsStore().removeForEntity(id)
      await this.fetchPersonas()
    },
  },
})

function readStoredActiveId() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  } catch {
    return null
  }
}
