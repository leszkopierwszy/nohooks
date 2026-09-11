<template>
  <div class="bg-white">
    <div class="mx-auto max-w-7xl overflow-hidden sm:px-6 lg:px-8">
      <h2 class="sr-only">Products</h2>

      <p v-if="collectionStore.loading && !products.length" class="py-12 text-center text-sm text-gray-500">
        Ładowanie…
      </p>

      <p v-else-if="!products.length" class="py-12 text-center text-sm text-gray-500">
        {{ emptyMessage }}
      </p>

      <div
        v-else
        class="-mx-px grid grid-cols-2 border-l-0 border-gray-200 sm:mx-0 md:grid-cols-3 lg:grid-cols-4"
      >
        <div
          v-for="product in products"
          :key="product.id"
          class="group relative flex flex-col overflow-hidden cursor-pointer border-b border-gray-200 p-4 first:border-l-0 last:border-r-0 sm:p-6"
          @click.prevent="goToProduct(product.id)"
        >
          <ItemImage
            :src="product.images?.[0] ?? product.cover ?? product.imageSrc"
            :alt="product.name"
            container-class="relative z-0 aspect-square w-full shrink-0 rounded-lg group-hover:opacity-75"
            normalize-scale
          />
          <div class="relative z-10 pt-10 pb-4 text-center">
            <h3 class="text-sm font-medium text-gray-900">
              {{ product.name }}
            </h3>
            <p class="mt-4 text-base font-medium text-gray-900">{{ displayRarityName(product.rarity) }}</p>
            <p v-if="product.brand" class="mt-1 text-sm font-medium text-gray-700">
              {{ displayBrandName(product.brand) }}
            </p>
            <p v-if="productMetaLine(product)" class="mt-1 text-sm text-gray-500">
              {{ productMetaLine(product) }}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { displayBrandName } from '../constants/itemBrands'
import { displayClothingTypeName } from '../constants/itemClothingTypes'
import { isClothingCollection } from '../constants/itemSizes'
import { displayRarityName } from '../constants/itemRarity'
import { displaySeasonName } from '../constants/itemSeasons'
import { useCollectionStore } from '../stores/collection'
import { applyItemFilters, hasActiveFilters } from '../utils/itemListFilters'
import ItemImage from './ItemImage.vue'

const router = useRouter()
const route = useRoute()
const collectionStore = useCollectionStore()

const props = defineProps({
  groupId: {
    type: String,
    default: null,
  },
  collectionName: {
    type: String,
    default: null,
  },
  allItems: {
    type: Boolean,
    default: false,
  },
})

const resolvedGroupId = computed(() => {
  if (props.groupId) return String(props.groupId)

  if (props.collectionName && props.collectionName !== 'all') {
    const collection = collectionStore.collectionByName(props.collectionName)
    if (collection) return String(collection.id)
  }

  return null
})

const products = computed(() => {
  let list

  if (props.allItems) {
    list = [...collectionStore.browseAllItems]

    if (route.query.collectionId) {
      const collectionId = String(route.query.collectionId)
      list = list.filter(
        (product) => String(product.category_id) === collectionId
      )
    }
  } else {
    list = [...collectionStore.itemsByGroupId(resolvedGroupId.value)]
  }

  list = applyItemFilters(list, route.query)

  return list
})

const emptyMessage = computed(() => {
  if (hasActiveFilters(route.query)) {
    return 'Brak itemów pasujących do filtrów.'
  }
  return props.allItems ? 'Brak itemów.' : 'No items in this collection.'
})

function capitalizeWord(text) {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}

function productCategoryLabel(product) {
  const parts = []

  if (props.allItems && product?.collection_group) {
    parts.push(capitalizeWord(product.collection_group))
  }

  if (product?.category) {
    const collectionName =
      product.collection_group ?? props.collectionName ?? route.params.name

    if (isClothingCollection(collectionName)) {
      parts.push(displayClothingTypeName(product.category))
    } else if (!props.allItems) {
      parts.push(product.category)
    }
  }

  return parts.length ? parts.join(' · ') : null
}

function productMetaLine(product) {
  const parts = []
  const category = productCategoryLabel(product)
  if (category) parts.push(category)
  if (product?.season) {
    parts.push(displaySeasonName(product.season))
  }
  return parts.length ? parts.join(' · ') : null
}

function goToProduct(itemId) {
  const product =
    products.value.find((p) => p.id === Number(itemId)) ??
    collectionStore.itemById(itemId)

  const groupId = product?.category_id
    ? String(product.category_id)
    : resolvedGroupId.value

  const collection = groupId ? collectionStore.collectionByGroupId(groupId) : null

  const collectionName =
    collection?.name ?? product?.collection_group ?? props.collectionName ?? 'collection'

  router.push({
    name: 'item-overview',
    params: {
      name: collectionName,
      item_name: String(itemId),
    },
    query: {
      ...(groupId ? { groupId } : {}),
      ...(props.allItems ? { fromAll: '1' } : {}),
    },
  })
}
</script>
