/** Active authenticated user id for scoping localStorage. */
let activeUserId = null

/** @returns {string|null} */
export function getActiveStorageUserId() {
  return activeUserId
}

/**
 * @param {string|number|null|undefined} userId
 * @param {{ claimLegacy?: boolean }} [options]
 */
export function setActiveStorageUserId(userId, options = {}) {
  const next = userId == null || userId === '' ? null : String(userId)
  activeUserId = next
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
 * Copy unscoped legacy keys into this user's bucket once (first login after auth).
 * New registrations should not claim legacy — they get a fresh workspace.
 * @param {string} userId
 */
function claimLegacyKeysForUser(userId) {
  const marker = 'nohooks.userData.legacyClaimedBy'
  try {
    if (localStorage.getItem(marker)) return
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
 * @param {string} baseKey
 * @param {string} value
 */
export function writeUserStorage(baseKey, value) {
  try {
    localStorage.setItem(userStorageKey(baseKey), value)
  } catch {
    /* ignore quota */
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
 */
export function removeUserStorage(baseKey) {
  try {
    localStorage.removeItem(userStorageKey(baseKey))
  } catch {
    /* ignore */
  }
}
