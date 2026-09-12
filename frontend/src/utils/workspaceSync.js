import { apiRequest } from '../api/client'
import { USER_DATA_STORAGE_KEYS, readUserStorage, userStorageKey, writeUserStorageLocal } from './userScopedStorage'

/**
 * Decode localStorage raw value into API payload.
 * @param {string} raw
 */
function rawToPayload(raw) {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

/**
 * Encode API payload into localStorage raw string (same format stores expect).
 * @param {unknown} payload
 */
function payloadToRaw(payload) {
  if (typeof payload === 'string') return payload
  return JSON.stringify(payload)
}

/**
 * Collect current user's scoped local documents for import.
 * @returns {Record<string, unknown>}
 */
export function collectLocalWorkspaceDocuments() {
  const documents = {}
  for (const key of USER_DATA_STORAGE_KEYS) {
    const raw = readUserStorage(key)
    if (raw == null) continue
    documents[key] = rawToPayload(raw)
  }
  return documents
}

/**
 * Apply API documents into scoped localStorage.
 * @param {Record<string, unknown>|object} documents
 */
export function applyWorkspaceDocumentsLocally(documents) {
  if (!documents || typeof documents !== 'object') return
  for (const [key, payload] of Object.entries(documents)) {
    if (!USER_DATA_STORAGE_KEYS.includes(key)) continue
    if (payload === null || payload === undefined) continue
    writeUserStorageLocal(key, payloadToRaw(payload))
  }
}

/**
 * Pull DB workspace into local cache; if DB empty, push local (only_missing).
 */
export async function syncWorkspaceWithApi({ claimLegacy = false } = {}) {
  try {
    const remote = await apiRequest('/workspace')
    const docs = remote?.documents && typeof remote.documents === 'object' ? remote.documents : {}
    const hasRemote = Object.keys(docs).length > 0

    if (hasRemote) {
      applyWorkspaceDocumentsLocally(docs)
      return docs
    }

    const localDocs = collectLocalWorkspaceDocuments()
    if (Object.keys(localDocs).length === 0) return {}

    // First login for this user: upload browser data into DB (does not overwrite existing).
    const imported = await apiRequest('/workspace/import', {
      method: 'POST',
      body: JSON.stringify({
        documents: localDocs,
        only_missing: true,
      }),
    })
    if (imported?.documents) {
      applyWorkspaceDocumentsLocally(imported.documents)
      return imported.documents
    }
    return localDocs
  } catch (err) {
    // Offline / API down — keep local cache.
    console.warn('[workspace] sync failed, using local cache', err)
    return collectLocalWorkspaceDocuments()
  } finally {
    void claimLegacy
  }
}

/**
 * Persist one document to API (fire-and-forget queue).
 * @param {string} documentKey
 * @param {string} rawValue
 */
let upsertChain = Promise.resolve()

export function queueWorkspaceUpsert(documentKey, rawValue) {
  if (!USER_DATA_STORAGE_KEYS.includes(documentKey)) return
  const payload = rawToPayload(rawValue)
  upsertChain = upsertChain
    .then(() =>
      apiRequest('/workspace', {
        method: 'PUT',
        body: JSON.stringify({
          document_key: documentKey,
          payload,
        }),
      }),
    )
    .catch((err) => {
      console.warn('[workspace] upsert failed', documentKey, err)
    })
}
