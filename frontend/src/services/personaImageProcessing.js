/**
 * =============================================================================
 * Klient frontend — Persona Image Processing (awatar 3D + virtual try-on)
 * =============================================================================
 *
 * INSTALACJA (frontend):
 *   - Brak dodatkowych bibliotek (używamy fetch przez ../api/client.js).
 *   - Nie instaluj axios — projekt korzysta z natywnego fetch.
 *
 * Backend wysyła zadania do ComfyUI w kontenerze Docker (lokalnie, bez Replicate).
 * Uruchom: docker compose up comfyui
 *
 * Przykład użycia w komponencie Vue:
 *   import { generatePersonaAvatar, virtualTryOnGarment } from '@/services/personaImageProcessing'
 *
 *   const result = await generatePersonaAvatar(entityId, photoFile)
 *   const fitting = await virtualTryOnGarment(entityId, garmentUrl, { itemId: 42 })
 * =============================================================================
 */

import { apiRequest, apiFormRequest } from '../api/client'

/**
 * Sprawdza, czy backend ma skonfigurowany provider AI.
 * @returns {Promise<{ provider: string, configured: boolean }>}
 */
export async function getPersonaVisionStatus() {
  return apiRequest('/persona-vision/status')
}

/**
 * (1)+(2) Generuje awatar „lalka 3D” ze zdjęcia użytkownika.
 *
 * @param {number|string} entityId - ID persony (Entity)
 * @param {File|string} source - Plik ze zdjęciem LUB publiczny URL
 * @param {{ prompt?: string }} [options]
 * @returns {Promise<{ output_url: string, avatar_doll_url?: string, prediction_id?: string }>}
 */
export async function generatePersonaAvatar(entityId, source, options = {}) {
  if (source instanceof File) {
    const formData = new FormData()
    formData.append('photo', source)
    if (options.prompt) {
      formData.append('prompt', options.prompt)
    }

    return apiFormRequest(`/entity/${entityId}/avatar/generate`, formData)
  }

  if (typeof source === 'string' && source.startsWith('http')) {
    return apiRequest(`/entity/${entityId}/avatar/generate`, {
      method: 'POST',
      body: JSON.stringify({
        photo_url: source,
        prompt: options.prompt ?? undefined,
      }),
    })
  }

  throw new Error('Źródło musi być plikiem File lub URL https://')
}

/**
 * (3) Virtual try-on — nakłada ubranie na zapisany awatar (niezależnie, wielokrotnie).
 *
 * @param {number|string} entityId
 * @param {string} garmentImageUrl - URL zdjęcia ubrania (np. z itemu)
 * @param {{ itemId?: number, avatarImageUrl?: string }} [options]
 * @returns {Promise<{ output_url: string, prediction_id?: string }>}
 */
export async function virtualTryOnGarment(entityId, garmentImageUrl, options = {}) {
  return apiRequest(`/entity/${entityId}/try-on`, {
    method: 'POST',
    body: JSON.stringify({
      garment_image_url: garmentImageUrl,
      item_id: options.itemId ?? undefined,
      avatar_image_url: options.avatarImageUrl ?? undefined,
    }),
  })
}

/**
 * Historia przymiarek dla persony.
 * @param {number|string} entityId
 */
export async function fetchTryOnHistory(entityId) {
  return apiRequest(`/entity/${entityId}/try-ons`)
}
