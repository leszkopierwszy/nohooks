import { defineStore } from 'pinia'
import { apiRequest, apiFormRequest } from '../api/client'
import { useCollectionStore } from './collection'
import { usePersonasStore } from './personas'

function appendPayloadToFormData(formData, payload) {
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return

    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0')
      return
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, String(item))
      })
      return
    }

    formData.append(key, String(value))
  })
}

function appendImageFile(formData, field, index, file) {
  if (!(file instanceof Blob) || file.size === 0) return
  const name =
    file instanceof File && file.name
      ? file.name
      : `image-${index + 1}.png`
  formData.append(`${field}[${index}]`, file, name)
}

function buildItemFormData(
  payload,
  {
    newImages = [],
    newImageUrls = [],
    newCutoutImages = [],
    newUrlCutoutImages = [],
    existingCutoutImages = {},
    removeImageIds = [],
    imageOrderSlots = [],
    traceId = null,
  } = {}
) {
  const formData = new FormData()
  appendPayloadToFormData(formData, payload)

  if (traceId) {
    formData.append('trace_id', traceId)
  }

  newImages.forEach((file, index) => {
    if (!(file instanceof Blob) || file.size === 0) return
    const name =
      file instanceof File && file.name
        ? file.name
        : `image-${index + 1}.jpg`
    formData.append(`new_images[${index}]`, file, name)
    const cutout = newCutoutImages[index]
    if (cutout instanceof Blob && cutout.size > 0) {
      appendImageFile(formData, 'new_cutout_images', index, cutout)
    }
  })

  if (newImageUrls.length) {
    formData.append('new_image_urls', JSON.stringify(newImageUrls))
  }

  newUrlCutoutImages.forEach((file, index) => {
    if (file instanceof Blob && file.size > 0) {
      appendImageFile(formData, 'new_url_cutout_images', index, file)
    }
  })

  Object.entries(existingCutoutImages ?? {}).forEach(([id, file]) => {
    if (file instanceof Blob && file.size > 0) {
      appendImageFile(formData, 'existing_cutout_images', id, file)
    }
  })

  if (removeImageIds.length) {
    formData.append('remove_image_ids', JSON.stringify(removeImageIds))
  }

  if (imageOrderSlots.length) {
    formData.append('image_order_slots', JSON.stringify(imageOrderSlots))
  }

  return formData
}

export function hasImageChanges(fileOptions = {}) {
  return (
    (fileOptions.newImages?.length ?? 0) > 0 ||
    (fileOptions.newImageUrls?.length ?? 0) > 0 ||
    (fileOptions.newCutoutImages?.some((f) => f instanceof Blob && f.size > 0) ?? false) ||
    (fileOptions.newUrlCutoutImages?.some((f) => f instanceof Blob && f.size > 0) ?? false) ||
    Object.keys(fileOptions.existingCutoutImages ?? {}).length > 0 ||
    (fileOptions.removeImageIds?.length ?? 0) > 0 ||
    fileOptions.imageOrderChanged === true ||
    (fileOptions.imageOrderSlots?.length ?? 0) > 0
  )
}

export const useItemsStore = defineStore('items', {
  state: () => ({
    items: [],
    entities: [],
    loading: false,
    error: null,
  }),

  actions: {
    async fetchItems() {
      this.loading = true
      this.error = null
      try {
        this.items = await apiRequest('/item')
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchEntities() {
      const personasStore = usePersonasStore()
      await personasStore.fetchPersonas()
      this.entities = personasStore.prims
    },

    async fetchItem(id) {
      return apiRequest(`/item/${id}`)
    },

    async saveItem(path, method, payload, fileOptions = {}) {
      const traceId = fileOptions.traceId ?? null

      if (hasImageChanges(fileOptions)) {
        const formData = buildItemFormData(payload, fileOptions)

        if (method === 'PUT') {
          formData.append('_method', 'PUT')
          return apiFormRequest(path, formData, {
            method: 'POST',
            headers: traceId ? { 'X-Langfuse-Trace-Id': traceId } : {},
          })
        }

        return apiFormRequest(path, formData, {
          method,
          headers: traceId ? { 'X-Langfuse-Trace-Id': traceId } : {},
        })
      }

      return apiRequest(path, {
        method,
        headers: traceId ? { 'X-Langfuse-Trace-Id': traceId } : {},
        body: JSON.stringify({ ...payload, ...(traceId ? { trace_id: traceId } : {}) }),
      })
    },

    async duplicateItem(id) {
      this.error = null
      const item = await apiRequest(`/item/${id}/duplicate`, { method: 'POST' })
      this.items.unshift(item)

      const collectionStore = useCollectionStore()
      collectionStore.invalidateAllItemsList()
      collectionStore.fetchCollections().catch(() => {})

      return item
    },

    async createItem(payload, fileOptions = {}) {
      this.error = null
      const item = await this.saveItem('/item', 'POST', payload, fileOptions)
      this.items.unshift(item)

      const collectionStore = useCollectionStore()
      collectionStore.invalidateAllItemsList()
      collectionStore.fetchCollections().catch(() => {})

      return item
    },

    async updateItem(id, payload, fileOptions = {}) {
      this.error = null
      const item = await this.saveItem(`/item/${id}`, 'PUT', payload, fileOptions)

      const index = this.items.findIndex((i) => i.id === id)
      if (index !== -1) {
        this.items[index] = item
      }

      const collectionStore = useCollectionStore()
      const cover = item?.images?.[0]
      if (cover) {
        collectionStore.patchItemCover(id, cover)
      }
      collectionStore.invalidateAllItemsList()
      collectionStore.fetchCollections().catch(() => {})

      return item
    },

    async detectItemImageFacing(itemId, imageId) {
      return apiRequest(`/item/${itemId}/images/${imageId}/facing`)
    },

    async orientItemImageRight(itemId, imageId, { force = false } = {}) {
      const result = await apiRequest(`/item/${itemId}/images/${imageId}/orient-right`, {
        method: 'POST',
        body: JSON.stringify({ force }),
      })

      const collectionStore = useCollectionStore()
      if (result?.image) {
        collectionStore.patchItemCover(itemId, result.image)
      }
      collectionStore.invalidateAllItemsList()
      collectionStore.fetchCollections().catch(() => {})

      const index = this.items.findIndex((i) => i.id === itemId)
      if (index !== -1 && result?.image) {
        const item = this.items[index]
        const images = (item.images ?? []).map((img) =>
          img.id === imageId ? { ...img, ...result.image } : img
        )
        this.items[index] = { ...item, images }
      }

      return result
    },

    async deleteItem(id, categoryId = null) {
      this.error = null
      await apiRequest(`/item/${id}`, { method: 'DELETE' })
      this.items = this.items.filter((i) => i.id !== id)

      const collectionStore = useCollectionStore()
      collectionStore.removeItem(id, categoryId)
      collectionStore.invalidateAllItemsList()
      collectionStore.fetchCollections().catch(() => {})
    },
  },
})
