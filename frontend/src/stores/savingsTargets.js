import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'
import { M2M_SAVINGS_TARGET_ID } from '../constants/finance'
import {
  DEFAULT_M2M_TARGET_COLOR,
  normalizeSavingsTargetColor,
  nextSavingsTargetColor,
} from '../constants/savingsTargetColors'
import {
  allSelectableIds,
  formatSavingsTotal,
  includedSelectionSummary,
  mockFinanceAccounts,
  sumTargetIncludedSelection,
} from '../utils/savingsAssets'
import { percentOfTarget, resolveTargetAmount } from '../utils/savingsTarget'
import { useUserAssetsStore } from './userAssets'

const LEGACY_STORAGE_KEY = 'nohooks_savings_targets_v1'

function normalizeIncludedAssetIds(raw) {
  if (raw === null || raw === undefined) return null
  if (!Array.isArray(raw)) return []
  return raw.map((id) => String(id)).filter(Boolean)
}

function normalizeProgressSnapshots(raw) {
  if (!Array.isArray(raw)) return []
  return raw
    .filter((p) => p && p.date && Number.isFinite(Number(p.value)))
    .map((p) => ({
      date: String(p.date),
      value: Math.max(0, Number(p.value)),
    }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

function normalizeTarget(raw, existingTargets = []) {
  if (!raw || typeof raw !== 'object') return null
  const included_asset_ids = normalizeIncludedAssetIds(raw.included_asset_ids)
  const progress_snapshots = normalizeProgressSnapshots(raw.progress_snapshots)

  if (raw.type === 'm2m' || raw.id === M2M_SAVINGS_TARGET_ID) {
    return {
      id: M2M_SAVINGS_TARGET_ID,
      name: String(raw.name || 'M2M Expected Savings').trim() || 'M2M Expected Savings',
      type: 'm2m',
      color: normalizeSavingsTargetColor(raw.color, DEFAULT_M2M_TARGET_COLOR),
      included_asset_ids,
      progress_snapshots,
    }
  }
  const amount = Math.max(0, Number(raw.amount) || 0)
  const name = String(raw.name || '').trim()
  if (!name) return null
  return {
    id: String(raw.id),
    name,
    type: 'fixed',
    amount,
    color: normalizeSavingsTargetColor(raw.color, nextSavingsTargetColor(existingTargets)),
    included_asset_ids,
    progress_snapshots,
  }
}

function mapApiTarget(raw, existingTargets = []) {
  return normalizeTarget(
    {
      id: raw.id,
      name: raw.name,
      type: raw.type,
      amount: raw.amount,
      color: raw.color,
      included_asset_ids: raw.included_asset_ids,
      progress_snapshots: raw.progress_snapshots,
    },
    existingTargets,
  )
}

function todayLocalDateKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function loadLegacyLocal() {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export const useSavingsTargetsStore = defineStore('savingsTargets', {
  state: () => ({
    targets: [],
    primaryTargetId: M2M_SAVINGS_TARGET_ID,
    loading: false,
    saving: false,
    recordingProgress: false,
    savingProgressHistory: false,
    error: null,
    legacyMigrated: false,
  }),

  getters: {
    primaryTarget(state) {
      return state.targets.find((t) => t.id === state.primaryTargetId) ?? state.targets[0] ?? null
    },

    primaryTargetName() {
      return this.primaryTarget?.name ?? 'Target'
    },

    primaryTargetColor() {
      return this.primaryTarget?.color ?? DEFAULT_M2M_TARGET_COLOR
    },

    portfolioAssets() {
      return useUserAssetsStore().assets
    },

    financeAccounts() {
      return mockFinanceAccounts()
    },

    currentSavingsValue() {
      const target = this.primaryTarget
      if (!target) return 0
      return sumTargetIncludedSelection(this.portfolioAssets, target, this.financeAccounts)
    },

    currentSavingsFormatted() {
      return formatSavingsTotal(this.currentSavingsValue)
    },

    includedAssetsSummary() {
      const target = this.primaryTarget
      if (!target) return ''
      return includedSelectionSummary(target, this.portfolioAssets, this.financeAccounts)
    },

    primaryProgressPoints() {
      return this.primaryTarget?.progress_snapshots ?? []
    },

    resolveAmount: () => (target, m2mPln) => resolveTargetAmount(target, m2mPln),

    primaryTargetAmount() {
      return (m2mPln) => resolveTargetAmount(this.primaryTarget, m2mPln)
    },

    percentOfPrimary() {
      return (m2mPln) => {
        const targetAmount = this.primaryTargetAmount(m2mPln)
        return percentOfTarget(this.currentSavingsValue, targetAmount)
      }
    },

    targetValue() {
      return (targetId) => {
        const target = this.targets.find((t) => t.id === targetId)
        if (!target) return 0
        return sumTargetIncludedSelection(this.portfolioAssets, target, this.financeAccounts)
      }
    },

    targetAssetsSummary() {
      return (targetId) => {
        const target = this.targets.find((t) => t.id === targetId)
        if (!target) return ''
        return includedSelectionSummary(target, this.portfolioAssets, this.financeAccounts)
      }
    },
  },

  actions: {
    applyPayload(data) {
      const targets = []
      for (const item of Array.isArray(data?.targets) ? data.targets : []) {
        const t = mapApiTarget(item, targets)
        if (t) targets.push(t)
      }
      this.targets = targets
      const primary = data?.primary_target_id
      if (primary && targets.some((t) => t.id === primary)) {
        this.primaryTargetId = primary
      } else if (targets.length) {
        this.primaryTargetId = targets.find((t) => t.id === M2M_SAVINGS_TARGET_ID)?.id ?? targets[0].id
      }
    },

    async fetchTargets() {
      this.loading = true
      this.error = null
      try {
        const data = await apiRequest('/savings-target')
        this.applyPayload(data)
        if (!this.legacyMigrated) {
          await this.migrateLegacyLocalOnce()
        }
      } catch (err) {
        this.error = err?.message ?? 'Nie udało się załadować targetów.'
        this.applyPayloadFromLegacy()
      } finally {
        this.loading = false
      }
    },

    applyPayloadFromLegacy() {
      const legacy = loadLegacyLocal()
      if (!legacy?.targets?.length) {
        this.targets = [
          normalizeTarget({ id: M2M_SAVINGS_TARGET_ID, type: 'm2m', included_asset_ids: null }),
        ].filter(Boolean)
        this.primaryTargetId = M2M_SAVINGS_TARGET_ID
        return
      }
      const targets = []
      for (const item of legacy.targets) {
        const t = normalizeTarget(item, targets)
        if (t) targets.push(t)
      }
      const globalIds = normalizeIncludedAssetIds(legacy.includedAssetIds)
      if (globalIds !== null) {
        for (const t of targets) {
          t.included_asset_ids = [...globalIds]
        }
      }
      this.targets = targets
      this.primaryTargetId = legacy.primaryTargetId || M2M_SAVINGS_TARGET_ID
    },

    async migrateLegacyLocalOnce() {
      this.legacyMigrated = true
      const legacy = loadLegacyLocal()
      if (!legacy?.targets?.length) return

      const apiIds = new Set(this.targets.map((t) => t.id))
      const onlyM2mOnApi = this.targets.length <= 1 && apiIds.has(M2M_SAVINGS_TARGET_ID)
      if (!onlyM2mOnApi) return

      for (const item of legacy.targets) {
        if (item.id === M2M_SAVINGS_TARGET_ID || item.type === 'm2m') continue
        try {
          await apiRequest('/savings-target', {
            method: 'POST',
            body: JSON.stringify({
              name: item.name,
              type: 'fixed',
              amount: item.amount ?? 0,
              color: item.color,
              included_asset_ids: item.included_asset_ids ?? legacy.includedAssetIds ?? null,
            }),
          })
        } catch {
          /* skip failed */
        }
      }

      if (legacy.primaryTargetId && legacy.primaryTargetId !== M2M_SAVINGS_TARGET_ID) {
        try {
          await apiRequest(`/savings-target/${legacy.primaryTargetId}/set-primary`, {
            method: 'POST',
          })
        } catch {
          /* ignore */
        }
      }

      const data = await apiRequest('/savings-target')
      this.applyPayload(data)
    },

    async setPrimaryTarget(id) {
      this.error = null
      try {
        await apiRequest(`/savings-target/${id}/set-primary`, { method: 'POST' })
        this.primaryTargetId = id
        this.targets = this.targets.map((t) => ({
          ...t,
          is_primary: t.id === id,
        }))
        await this.fetchTargets()
      } catch (err) {
        this.error = err?.message ?? 'Nie udało się ustawić targetu głównego.'
        throw err
      }
    },

    async recordTargetProgress(targetId, value, dateKey) {
      this.recordingProgress = true
      this.error = null
      try {
        const updated = await apiRequest(`/savings-target/${targetId}/record-progress`, {
          method: 'POST',
          body: JSON.stringify({
            date: dateKey || todayLocalDateKey(),
            value: Math.max(0, Number(value) || 0),
          }),
        })
        const i = this.targets.findIndex((t) => t.id === targetId)
        if (i !== -1) {
          const mapped = mapApiTarget(updated, this.targets)
          if (mapped) this.targets[i] = mapped
        }
        return updated
      } catch (err) {
        this.error = err?.message ?? 'Nie udało się zapisać punktu na wykresie.'
        throw err
      } finally {
        this.recordingProgress = false
      }
    },

    async recordPrimaryProgress(m2mPln) {
      const id = this.primaryTargetId
      if (!id) return
      const target = this.targets.find((t) => t.id === id)
      if (!target) return
      const value = sumTargetIncludedSelection(this.portfolioAssets, target, this.financeAccounts)
      await this.recordTargetProgress(id, value)
    },

    async setTargetProgressSnapshots(targetId, snapshots) {
      this.savingProgressHistory = true
      this.error = null
      const normalized = normalizeProgressSnapshots(snapshots)
      try {
        const updated = await apiRequest(`/savings-target/${targetId}/progress-snapshots`, {
          method: 'PUT',
          body: JSON.stringify({ snapshots: normalized }),
        })
        const i = this.targets.findIndex((t) => t.id === targetId)
        if (i !== -1) {
          const mapped = mapApiTarget(updated, this.targets)
          if (mapped) this.targets[i] = mapped
        }
        return updated
      } catch (err) {
        this.error = err?.message ?? 'Nie udało się zapisać historii postępu.'
        throw err
      } finally {
        this.savingProgressHistory = false
      }
    },

    async saveTargetIncludedAssets(targetId, includedAssetIds) {
      this.saving = true
      this.error = null
      const selectable = allSelectableIds(
        useUserAssetsStore().assets,
        mockFinanceAccounts(),
      )
      let payloadIds = includedAssetIds
      if (Array.isArray(payloadIds) && payloadIds.length === selectable.length) {
        const same =
          selectable.every((id) => payloadIds.includes(id)) &&
          payloadIds.every((id) => selectable.includes(id))
        if (same) payloadIds = null
      }

      try {
        const updated = await apiRequest(`/savings-target/${targetId}/included-assets`, {
          method: 'PUT',
          body: JSON.stringify({ included_asset_ids: payloadIds }),
        })
        const i = this.targets.findIndex((t) => t.id === targetId)
        if (i !== -1) {
          const mapped = mapApiTarget(updated, this.targets)
          if (mapped) this.targets[i] = mapped
        }
        const target = this.targets.find((t) => t.id === targetId)
        if (target) {
          const value = sumTargetIncludedSelection(
            useUserAssetsStore().assets,
            target,
            mockFinanceAccounts(),
          )
          await this.recordTargetProgress(targetId, value).catch(() => {})
        }
      } catch (err) {
        this.error = err?.message ?? 'Nie udało się zapisać wyboru aktywów.'
        throw err
      } finally {
        this.saving = false
      }
    },

    async addTarget({ name, amount, color }) {
      this.error = null
      const body = {
        name,
        type: 'fixed',
        amount,
        color: color ?? nextSavingsTargetColor(this.targets),
        included_asset_ids: null,
      }
      const created = await apiRequest('/savings-target', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      const mapped = mapApiTarget(created, this.targets)
      if (mapped) this.targets.push(mapped)
      return mapped?.id
    },

    async updateTarget(id, patch) {
      this.error = null
      const body = {}
      if (patch.name != null) body.name = patch.name
      if (patch.color != null) body.color = patch.color
      if (patch.amount != null && id !== M2M_SAVINGS_TARGET_ID) body.amount = patch.amount
      if (patch.included_asset_ids !== undefined) body.included_asset_ids = patch.included_asset_ids

      const updated = await apiRequest(`/savings-target/${id}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      })
      const i = this.targets.findIndex((t) => t.id === id)
      if (i !== -1) {
        const mapped = mapApiTarget(updated, this.targets)
        if (mapped) this.targets[i] = mapped
      }
    },

    async removeTarget(id) {
      if (id === M2M_SAVINGS_TARGET_ID && this.targets.length === 1) return
      this.error = null
      await apiRequest(`/savings-target/${id}`, { method: 'DELETE' })
      await this.fetchTargets()
    },

    async addM2mTargetIfMissing() {
      if (this.targets.some((t) => t.id === M2M_SAVINGS_TARGET_ID)) return
      await this.fetchTargets()
    },
  },
})
