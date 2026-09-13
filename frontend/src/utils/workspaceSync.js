import { apiRequest } from '../api/client'
import {
  USER_DATA_STORAGE_KEYS,
  clearActiveUserLocalWorkspace,
  readUserStorage,
  writeUserStorageLocal,
} from './userScopedStorage'

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
 * Pull DB workspace into local cache.
 * - If DB has docs → use them (source of truth).
 * - If DB empty and isLegacyOwner → import local once (pre-auth data for first user).
 * - If DB empty and not legacy owner → clear local cache (do not steal another user's data).
 *
 * @param {{ isLegacyOwner?: boolean }} [options]
 */
export async function syncWorkspaceWithApi({ isLegacyOwner = false } = {}) {
  try {
    const remote = await apiRequest('/workspace')
    const docs = remote?.documents && typeof remote.documents === 'object' ? remote.documents : {}
    const hasRemote = Object.keys(docs).length > 0

    if (hasRemote) {
      applyWorkspaceDocumentsLocally(docs)
      return docs
    }

    if (!isLegacyOwner) {
      clearActiveUserLocalWorkspace()
      return {}
    }

    const localDocs = collectLocalWorkspaceDocuments()
    if (Object.keys(localDocs).length === 0) return {}

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
    console.warn('[workspace] sync failed, using local cache', err)
    return collectLocalWorkspaceDocuments()
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

export const WORKSPACE_BACKUP_KIND = 'nohooks.workspace.backup'
export const WORKSPACE_BACKUP_VERSION = 1

/**
 * Build a downloadable workspace backup (API first, local fallback).
 * @returns {Promise<{ version: number, kind: string, exportedAt: string, documents: Record<string, unknown> }>}
 */
export async function createWorkspaceBackup() {
  let documents = {}
  try {
    const remote = await apiRequest('/workspace')
    documents =
      remote?.documents && typeof remote.documents === 'object' ? remote.documents : {}
  } catch {
    documents = collectLocalWorkspaceDocuments()
  }
  if (!documents || Object.keys(documents).length === 0) {
    documents = collectLocalWorkspaceDocuments()
  }
  return {
    version: WORKSPACE_BACKUP_VERSION,
    kind: WORKSPACE_BACKUP_KIND,
    exportedAt: new Date().toISOString(),
    documents,
  }
}

/**
 * Validate and restore a workspace backup file payload.
 * @param {unknown} backup
 * @returns {Promise<Record<string, unknown>>}
 */
export async function restoreWorkspaceBackup(backup) {
  if (!backup || typeof backup !== 'object') {
    throw new Error('invalid_backup')
  }
  const kind = backup.kind
  const documents = backup.documents
  if (kind != null && kind !== WORKSPACE_BACKUP_KIND) {
    throw new Error('invalid_backup')
  }
  if (!documents || typeof documents !== 'object') {
    throw new Error('invalid_backup')
  }

  const imported = await apiRequest('/workspace/import', {
    method: 'POST',
    body: JSON.stringify({
      documents,
      only_missing: false,
    }),
  })
  const nextDocs =
    imported?.documents && typeof imported.documents === 'object'
      ? imported.documents
      : documents
  applyWorkspaceDocumentsLocally(nextDocs)
  return nextDocs
}
