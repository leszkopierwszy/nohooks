import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'
import { imageUrlWithCacheBust, resolveStorageUrl } from '../api/media'

function mapApiItem(item) {
  const imageUrls = (item.images ?? [])
    .map((img) => imageUrlWithCacheBust(img.url, img.updated_at))
    .filter(Boolean)
  const cover = imageUrls[0] ?? resolveStorageUrl(item.image_url)

  return {
    id: item.id,
    name: item.name,
    brand: item.brand ?? null,
    href: item.source_url || '#',
    cover: cover ?? null,
    imageSrc: cover ?? null,
    images: imageUrls,
    category: item.category,
    category_id: item.category_id ?? null,
    collection_group: item.collection_group?.name ?? null,
    description: item.description ?? null,
    color: item.color ?? null,
    season: item.season ?? null,
    size: item.size ?? null,
    size_system: item.size_system ?? null,
    body_zone: item.body_zone ?? null,
    wear_layer: item.wear_layer ?? null,
    garment_attributes: item.garment_attributes ?? null,
    notes: item.notes ?? null,
    rarity: item.rarity ?? 'common',
    like_rating: item.like_rating ?? null,
    fits_all_personas: Boolean(item.fits_all_personas ?? true),
    fits_persona_ids: item.fits_persona_ids ?? null,
    default_persona_id: item.default_persona_id ?? null,
    default_persona: item.default_persona ?? null,
    source_url: item.source_url,
    image_url: cover,
    gift: Boolean(item.gift),
    purchase_price: item.gift ? null : item.purchase_price,
    purchase_currency: item.gift ? null : (item.purchase_currency ?? 'PLN'),
    purchase_price_pln: item.gift ? null : item.purchase_price_pln,
    current_value: item.current_value,
    fromApi: true,
  }
}

function mapApiCategory(category) {
  const items = (category.items ?? []).map(mapApiItem)
  const cover = items[0]?.cover ?? items[0]?.imageSrc ?? null

  return {
    id: category.id,
    name: category.name,
    href: '#',
    cover,
    imageSrc: cover,
    items,
    fromApi: true,
  }
}

export const useCollectionStore = defineStore('collection', {
  state: () => ({
    collections: [],
    allItemsList: [],
    selectedCollectionId: null,
    loading: false,
    error: null,
  }),

  getters: {
    allCollections(state) {
      return state.collections
    },

    selectedCollection(state) {
      return this.allCollections.find(
        (c) => c.id === state.selectedCollectionId
      )
    },

    totalItems() {
      return this.allCollections.reduce(
        (acc, collection) => acc + collection.items.length,
        0
      )
    },

    /** Pełna lista z GET /item — tylko widok „All items”. */
    browseAllItems(state) {
      return state.allItemsList
    },

    itemsByGroupId() {
      return (groupId) => {
        if (!groupId) return []

        const collection = this.allCollections.find(
          (c) => String(c.id) === String(groupId)
        )

        return collection?.items ?? []
      }
    },

    collectionByGroupId() {
      return (groupId) => {
        if (!groupId) return null

        return (
          this.allCollections.find((c) => String(c.id) === String(groupId)) ??
          null
        )
      }
    },

    collectionByName() {
      return (name) => {
        if (!name) return null

        return (
          this.allCollections.find((c) => c.name === name) ?? null
        )
      }
    },

    itemByGroupId() {
      return (groupId, itemId) => {
        const collection = this.allCollections.find(
          (c) => String(c.id) === String(groupId)
        )
        return collection?.items.find((i) => i.id === Number(itemId)) ?? null
      }
    },

    itemById() {
      return (itemId) => {
        const id = Number(itemId)

        const fromAll = this.allItemsList.find((i) => i.id === id)
        if (fromAll) return fromAll

        for (const collection of this.allCollections) {
          const item = collection.items.find((i) => i.id === id)
          if (item) return item
        }

        return null
      }
    },
  },

  actions: {
    selectCollection(id) {
      this.selectedCollectionId = id
    },

    invalidateAllItemsList() {
      this.allItemsList = []
    },

    /** Po odbiciu covera — od razu odśwież URL w pamięci (bez czekania na fetch). */
    patchItemCover(itemId, image) {
      const id = Number(itemId)
      if (!image?.url) return

      const cover = imageUrlWithCacheBust(image.url, image.updated_at)

      const patchList = (items) => {
        const item = items.find((i) => i.id === id)
        if (!item) return
        const urls = [...(item.images ?? [])]
        if (urls.length) urls[0] = cover
        else urls.push(cover)
        item.images = urls
        item.cover = cover
        item.imageSrc = cover
        item.image_url = cover
      }

      patchList(this.allItemsList)

      for (const collection of this.collections) {
        patchList(collection.items)
        const first = collection.items.find((i) => i.id === id)
        if (first && collection.items[0]?.id === id) {
          collection.cover = cover
          collection.imageSrc = cover
        }
      }
    },

    async createCollection(name) {
      this.error = null

      const created = await apiRequest('/category', {
        method: 'POST',
        body: JSON.stringify({ name }),
      })

      const mapped = mapApiCategory({ ...created, items: [] })
      this.collections = [...this.collections, mapped].sort((a, b) =>
        a.name.localeCompare(b.name, 'pl')
      )

      return mapped
    },

    async fetchAllItems() {
      const items = await apiRequest('/item')
      this.allItemsList = items.map(mapApiItem)
      return this.allItemsList
    },

    async fetchCollections() {
      this.loading = true
      this.error = null

      try {
        const categories = await apiRequest('/category')
        this.collections = categories.map(mapApiCategory)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    removeItem(itemId, categoryId = null) {
      const id = Number(itemId)
      this.allItemsList = this.allItemsList.filter((item) => item.id !== id)

      const collections = categoryId
        ? this.collections.filter((c) => String(c.id) === String(categoryId))
        : this.collections

      for (const collection of collections) {
        const nextItems = collection.items.filter((item) => item.id !== id)
        if (nextItems.length === collection.items.length) continue

        collection.items = nextItems
        const cover = nextItems[0]?.cover ?? nextItems[0]?.imageSrc ?? null
        collection.cover = cover
        collection.imageSrc = cover
      }
    },

    async addItem(collectionId, item) {
      const payload = {
        name: item.name,
        category_id: collectionId,
        fits_all_personas: item.fits_all_personas ?? true,
        fits_persona_ids: item.fits_all_personas ? null : item.fits_persona_ids ?? null,
        default_persona_id: item.default_persona_id ?? null,
      }

      if (item.category) payload.category = item.category
      if (item.rarity) payload.rarity = item.rarity
      if (item.like_rating != null) payload.like_rating = item.like_rating
      if (item.brand) payload.brand = item.brand
      if (item.gift) {
        payload.gift = true
      } else if (item.purchase_price != null) {
        payload.purchase_price = item.purchase_price
        payload.purchase_currency = item.purchase_currency ?? 'PLN'
      }
      if (item.current_value != null) payload.current_value = item.current_value
      if (item.notes) payload.notes = item.notes
      if (item.source_url) payload.source_url = item.source_url
      if (item.description) payload.description = item.description
      if (item.color) payload.color = item.color
      if (item.size) payload.size = item.size
      if (item.size_system) payload.size_system = item.size_system

      const created = await apiRequest('/item', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      const mapped = mapApiItem(created)

      let collection = this.collections.find(
        (c) => String(c.id) === String(collectionId)
      )

      if (!collection) {
        await this.fetchCollections()
        collection = this.collections.find(
          (c) => String(c.id) === String(collectionId)
        )
      }

      if (collection) {
        collection.items.push(mapped)
      }

      this.invalidateAllItemsList()

      return mapped
    },
  },
})
