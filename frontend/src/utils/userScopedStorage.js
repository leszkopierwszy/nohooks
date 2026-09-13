/** Active authenticated user id for scoping localStorage cache. */
let activeUserId = null
let apiSyncEnabled = false

/** @returns {string|null} */
export function getActiveStorageUserId() {
  return activeUserId
}

/**
 * @param {boolean} enabled
 */
export function setWorkspaceApiSyncEnabled(enabled) {
  apiSyncEnabled = Boolean(enabled)
}

/**
 * @param {string|number|null|undefined} userId
 * @param {{ claimLegacy?: boolean }} [options]
 */
export function setActiveStorageUserId(userId, options = {}) {
  const next = userId == null || userId === '' ? null : String(userId)
  activeUserId = next
  if (!next) {
    apiSyncEnabled = false
  }
  if (next && options.claimLegacy) {
    claimLegacyKeysForUser(next)
  }
}

/** Base keys that hold per-user app data (not display/locale prefs). */
export const USER_DATA_STORAGE_KEYS = [
  'nohooks.financeAccounts.v1',
  'nohooks.petExpenseAccounts',
  'nohooks.lotteryTickets.v1',
  'nohooks_user_assets_v2',
  'nohooks_user_assets_v1',
  'nohooks.growthGoals.v1',
  'nohooks.growthWellbeing.v1',
  'nohooks.growthSleep.v1',
  'nohooks.growthHealth.v1',
  'nohooks.activePersonaId',
  'nohooks_savings_targets_v1',
  'nohooks.salaryJobs.v1',
]

/**
 * @param {string} baseKey
 * @returns {string}
 */
export function userStorageKey(baseKey) {
  if (!activeUserId) return `${baseKey}::__anon`
  return `${baseKey}::u${activeUserId}`
}

/**
 * Copy unscoped legacy keys into this user's bucket once.
 * Only the legacy owner account should call this (pre-auth shared browser data).
 * @param {string} userId
 */
function claimLegacyKeysForUser(userId) {
  const marker = 'nohooks.userData.legacyClaimedBy'
  try {
    const claimedBy = localStorage.getItem(marker)
    // If a non-owner previously claimed by bug, allow the real owner to reclaim.
    if (claimedBy && claimedBy !== String(userId)) {
      // Leave their scoped keys alone; just don't block the true owner forever.
    }
    if (claimedBy === String(userId)) return

    for (const baseKey of USER_DATA_STORAGE_KEYS) {
      const scoped = `${baseKey}::u${userId}`
      if (localStorage.getItem(scoped) != null) continue
      const legacy = localStorage.getItem(baseKey)
      if (legacy == null) continue
      localStorage.setItem(scoped, legacy)
    }
    localStorage.setItem(marker, userId)
  } catch {
    /* ignore */
  }
}

/**
 * Wipe this user's scoped local cache (used when remote workspace is empty
 * so another tenant's leftover browser data is not re-imported).
 */
export function clearActiveUserLocalWorkspace() {
  if (!activeUserId) return
  try {
    for (const baseKey of USER_DATA_STORAGE_KEYS) {
      localStorage.removeItem(`${baseKey}::u${activeUserId}`)
    }
  } catch {
    /* ignore */
  }
}

/**
 * @param {string} baseKey
 * @returns {string|null}
 */
export function readUserStorage(baseKey) {
  try {
    return localStorage.getItem(userStorageKey(baseKey))
  } catch {
    return null
  }
}

/**
 * Write local cache only (no API). Used when applying remote documents.
 * @param {string} baseKey
 * @param {string} value
 */
export function writeUserStorageLocal(baseKey, value) {
  try {
    localStorage.setItem(userStorageKey(baseKey), value)
  } catch {
    /* ignore quota */
  }
}

/**
 * @param {string} baseKey
 * @param {string} value
 */
export function writeUserStorage(baseKey, value) {
  writeUserStorageLocal(baseKey, value)
  if (apiSyncEnabled && activeUserId) {
    import('./workspaceSync')
      .then(({ queueWorkspaceUpsert }) => queueWorkspaceUpsert(baseKey, value))
      .catch(() => {})
  }
}

/**
 * @param {string} baseKey
 * @param {unknown} fallback
 * @returns {unknown}
 */
export function readUserJson(baseKey, fallback = null) {
  try {
    const raw = readUserStorage(baseKey)
    if (raw == null) return fallback
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

/**
 * @param {string} baseKey
 * @param {unknown} value
 */
export function writeUserJson(baseKey, value) {
  writeUserStorage(baseKey, JSON.stringify(value))
}

/**
 * @param {string} baseKey
 */
export function removeUserStorage(baseKey) {
  try {
    localStorage.removeItem(userStorageKey(baseKey))
  } catch {
    /* ignore */
  }
}
