import { defineStore } from 'pinia'
import { cloneLegacySalaryEmployers } from '../constants/legacySalaryEmployers'
import { readUserStorage, writeUserStorage } from '../utils/userScopedStorage'
import { useUserStore } from './user'

export const SALARY_JOBS_STORAGE_KEY = 'nohooks.salaryJobs.v1'

function newId(prefix) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeRole(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    id: String(raw.id || newId('role')),
    title: String(raw.title ?? '').trim(),
    role: String(raw.role ?? '').trim(),
    years: String(raw.years ?? '').trim(),
    ms_gross: String(raw.ms_gross ?? raw.msGross ?? '').trim(),
  }
}

function normalizeEmployer(raw) {
  if (!raw || typeof raw !== 'object') return null
  const name = String(raw.name ?? '').trim()
  if (!name) return null
  const roles = Array.isArray(raw.roles)
    ? raw.roles.map(normalizeRole).filter(Boolean)
    : Array.isArray(raw.people)
      ? raw.people.map(normalizeRole).filter(Boolean)
      : []
  return {
    id: String(raw.id || newId('emp')),
    name,
    roles,
  }
}

function readAll() {
  try {
    const raw = readUserStorage(SALARY_JOBS_STORAGE_KEY)
    if (raw == null) return null
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.map(normalizeEmployer).filter(Boolean)
  } catch {
    return []
  }
}

function writeAll(employers) {
  writeUserStorage(SALARY_JOBS_STORAGE_KEY, JSON.stringify(employers))
}

export const useSalaryJobsStore = defineStore('salaryJobs', {
  state: () => ({
    employers: readAll() ?? [],
    hydrated: false,
  }),

  getters: {
    isEmpty: (state) => state.employers.length === 0,
  },

  actions: {
    reload() {
      const stored = readAll()
      if (stored == null) {
        this.employers = []
        this.seedLegacyOwnerIfEmpty()
        return
      }
      this.employers = stored
      this.hydrated = true
    },

    /** First user keeps the old hardcoded career history; everyone else starts empty. */
    seedLegacyOwnerIfEmpty() {
      if (this.employers.length) {
        this.hydrated = true
        return
      }
      const user = useUserStore().user
      if (user?.isLegacyOwner) {
        this.employers = cloneLegacySalaryEmployers()
        writeAll(this.employers)
      } else {
        this.employers = []
        writeAll(this.employers)
      }
      this.hydrated = true
    },

    persist() {
      writeAll(this.employers)
    },

    addEmployer({ name }) {
      const employer = normalizeEmployer({
        id: newId('emp'),
        name,
        roles: [],
      })
      if (!employer) return null
      this.employers = [...this.employers, employer]
      this.persist()
      return employer
    },

    updateEmployer(id, { name }) {
      const idx = this.employers.findIndex((e) => e.id === id)
      if (idx === -1) return null
      const next = { ...this.employers[idx], name: String(name ?? '').trim() || this.employers[idx].name }
      this.employers = [...this.employers.slice(0, idx), next, ...this.employers.slice(idx + 1)]
      this.persist()
      return next
    },

    removeEmployer(id) {
      this.employers = this.employers.filter((e) => e.id !== id)
      this.persist()
    },

    addRole(employerId, payload) {
      const idx = this.employers.findIndex((e) => e.id === employerId)
      if (idx === -1) return null
      const role = normalizeRole({ id: newId('role'), ...payload })
      const employer = {
        ...this.employers[idx],
        roles: [...this.employers[idx].roles, role],
      }
      this.employers = [...this.employers.slice(0, idx), employer, ...this.employers.slice(idx + 1)]
      this.persist()
      return role
    },

    updateRole(employerId, roleId, payload) {
      const idx = this.employers.findIndex((e) => e.id === employerId)
      if (idx === -1) return null
      const roles = this.employers[idx].roles.map((r) =>
        r.id === roleId ? normalizeRole({ ...r, ...payload, id: r.id }) : r,
      )
      const employer = { ...this.employers[idx], roles }
      this.employers = [...this.employers.slice(0, idx), employer, ...this.employers.slice(idx + 1)]
      this.persist()
      return roles.find((r) => r.id === roleId) ?? null
    },

    removeRole(employerId, roleId) {
      const idx = this.employers.findIndex((e) => e.id === employerId)
      if (idx === -1) return
      const employer = {
        ...this.employers[idx],
        roles: this.employers[idx].roles.filter((r) => r.id !== roleId),
      }
      this.employers = [...this.employers.slice(0, idx), employer, ...this.employers.slice(idx + 1)]
      this.persist()
    },
  },
})
