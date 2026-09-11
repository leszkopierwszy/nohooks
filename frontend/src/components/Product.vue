<template>
    <div class="bg-white">
      <div class="pt-6">
        <nav aria-label="Breadcrumb">
          <ol role="list" class="mx-auto flex max-w-2xl items-center space-x-2 px-4 sm:px-6 lg:max-w-7xl lg:px-8">
            <li v-for="breadcrumb in breadcrumbs" :key="breadcrumb.id">
              <div class="flex items-center">
                <RouterLink :to="breadcrumb.to" class="mr-2 text-sm font-medium text-gray-900">{{ breadcrumb.name }}</RouterLink>
                <svg width="16" height="20" viewBox="0 0 16 20" fill="currentColor" aria-hidden="true" class="h-5 w-4 text-gray-300">
                  <path d="M5.697 4.34L8.98 16.532h1.327L7.025 4.341H5.697z" />
                </svg>
              </div>
            </li>
            <li v-if="item" class="text-sm">
              <span aria-current="page" class="font-medium text-gray-500">{{ item.name }}</span>
            </li>
          </ol>
        </nav>
  
        <div class="mx-auto mt-6 max-w-2xl sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-8 lg:px-8">
          <ItemImage
            v-for="(image, index) in galleryImages"
            :key="index"
            :src="image.src"
            :alt="image.alt"
            :container-class="galleryImageClasses[index]"
            img-class="size-full"
            normalize-scale
          />
        </div>
  
        <div class="mx-auto max-w-2xl px-4 pt-10 pb-16 sm:px-6 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:grid-rows-[auto_auto_1fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-24">
          <div class="lg:col-span-2 lg:border-r lg:border-gray-200 lg:pr-8">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 class="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">{{ item?.name }}</h1>
                <p v-if="item?.gift" class="mt-2 text-sm font-medium text-indigo-600">Prezent</p>
              </div>
              <div v-if="canEdit" class="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 disabled:opacity-50"
                  :disabled="duplicating"
                  @click="onDuplicate"
                >
                  {{ duplicating ? 'Powielanie…' : 'Powiel' }}
                </button>
                <button
                  type="button"
                  class="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50"
                  @click="showEditModal = true"
                >
                  Edytuj
                </button>
              </div>
            </div>
          </div>
  
          <div class="mt-4 lg:row-span-3 lg:mt-0">
            <h2 class="sr-only">Informacje o produkcie</h2>
            <p v-if="displayPrice" class="text-3xl tracking-tight text-gray-900">{{ displayPrice }}</p>
            <p v-else-if="item?.gift" class="text-sm text-gray-500">Brak ceny zakupu (prezent)</p>

            <div v-if="purchasePriceText" class="mt-4">
              <h3 class="text-sm font-medium text-gray-900">Cena zakupu</h3>
              <p class="mt-1 text-sm text-gray-700">{{ purchasePriceText }}</p>
            </div>

            <div v-if="item?.rarity" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Rzadkość</h3>
              <p class="mt-2 text-lg font-medium text-gray-900">{{ rarityLabel }}</p>
            </div>

            <div v-if="item?.like_rating" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Jak bardzo lubimy</h3>
              <LikeRatingPicker
                :model-value="item.like_rating"
                readonly
                size="lg"
                class="mt-3"
              />
            </div>

            <div v-if="personaFitText" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Dopasowanie do person</h3>
              <p class="mt-2 text-sm text-gray-700">{{ personaFitText }}</p>
            </div>

            <div v-if="item?.brand" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Marka</h3>
              <p class="mt-2 text-lg font-medium text-gray-900">{{ brandLabel }}</p>
            </div>

            <div v-if="item?.season" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Sezon</h3>
              <p class="mt-2 text-lg font-medium text-gray-900">{{ seasonLabel }}</p>
            </div>

            <div v-if="item?.color" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Kolor</h3>
              <div class="mt-3 flex items-center gap-3">
                <span
                  class="size-8 shrink-0 rounded-full outline -outline-offset-1 outline-black/10"
                  :class="[
                    colorSwatch ? '' : 'bg-gray-200',
                    colorSwatchNeedsBorder(item.color) ? 'border border-gray-300' : 'border border-gray-200',
                  ]"
                  :style="colorSwatch ?? undefined"
                />
                <span class="text-sm text-gray-700">{{ colorLabel }}</span>
              </div>
            </div>

            <div v-if="showClothingSize" class="mt-8">
              <h3 class="text-sm font-medium text-gray-900">Rozmiar</h3>
              <p class="mt-2 text-lg font-semibold uppercase tracking-wide text-gray-900">{{ item.size }}</p>
            </div>

            <div v-if="showShoeSize" class="mt-8">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium text-gray-900">Rozmiar obuwia</h3>
                <div class="flex rounded-md border border-gray-300 p-0.5 text-xs font-medium">
                  <button
                    type="button"
                    :class="shoeDisplaySystem === 'eu' ? 'bg-indigo-600 text-white' : 'text-gray-600'"
                    class="rounded px-2.5 py-1"
                    @click="shoeDisplaySystem = 'eu'"
                  >
                    EU
                  </button>
                  <button
                    type="button"
                    :class="shoeDisplaySystem === 'us' ? 'bg-indigo-600 text-white' : 'text-gray-600'"
                    class="rounded px-2.5 py-1"
                    @click="shoeDisplaySystem = 'us'"
                  >
                    US
                  </button>
                </div>
              </div>
              <p class="mt-2 text-lg font-semibold text-gray-900">{{ displayedShoeSize }}</p>
              <p v-if="storedShoeSizeLabel" class="mt-1 text-xs text-gray-500">
                Zapisany w bazie: {{ storedShoeSizeLabel }}
              </p>
            </div>

            <a
              v-if="item?.source_url"
              :href="item.source_url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-8 inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
            >
              Oryginalna strona produktu →
            </a>
          </div>
  
          <div class="py-10 lg:col-span-2 lg:col-start-1 lg:border-r lg:border-gray-200 lg:pt-6 lg:pr-8 lg:pb-16">
            <div v-if="item?.description">
              <h3 class="text-sm font-medium text-gray-900">Opis</h3>
              <p class="mt-4 whitespace-pre-line text-base text-gray-700">{{ item.description }}</p>
            </div>

            <div v-if="item?.notes" class="mt-10">
              <h3 class="text-sm font-medium text-gray-900">Notatki</h3>
              <p class="mt-4 whitespace-pre-line text-sm text-gray-600">{{ item.notes }}</p>
            </div>

            <p v-if="!item?.description && !item?.notes" class="text-sm text-gray-500">
              Brak opisu dla tego przedmiotu.
            </p>
          </div>
        </div>
      </div>
    </div>

    <EditItemModal
      :open="showEditModal"
      :item-id="item?.id"
      :item-name="item?.name ?? ''"
      :group-id="groupId"
      @close="showEditModal = false"
      @saved="onItemSaved"
      @deleted="onItemDeleted"
      @duplicated="onItemDuplicated"
    />
  </template>
  
  <script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { RouterLink, useRoute, useRouter } from 'vue-router'
  import { useCollectionStore } from '../stores/collection'
  import { useItemsStore } from '../stores/items'
  import { itemGalleryUrls } from '../api/media'
  import { colorSwatchNeedsBorder, colorSwatchStyle, displayColorName } from '../constants/itemColors'
  import { displayBrandName } from '../constants/itemBrands'
  import { displaySeasonName } from '../constants/itemSeasons'
  import { displayRarityName } from '../constants/itemRarity'
  import { formatMoney, formatPln } from '../utils/currency'
  import { usePersonasStore } from '../stores/personas'
  import { displayClothingTypeName } from '../constants/itemClothingTypes'
  import {
    displayShoeSize,
    isClothingCollection,
    isShoesCollection,
  } from '../constants/itemSizes'
  import ItemImage from './ItemImage.vue'
  import LikeRatingPicker from './LikeRatingPicker.vue'
  import EditItemModal from './EditItemModal.vue'

  const props = defineProps({
    name: {
      type: String,
      required: true,
    },
    item_name: {
      type: String,
      required: true,
    },
    groupId: {
      type: String,
      default: null,
    },
  })

  const router = useRouter()
  const route = useRoute()
  const collectionStore = useCollectionStore()
  const itemsStore = useItemsStore()
  const personasStore = usePersonasStore()
  const shoeDisplaySystem = ref('eu')
  const showEditModal = ref(false)
  const duplicating = ref(false)

  onMounted(() => {
    collectionStore.fetchCollections().catch(() => {})
  })

  function onItemSaved() {
    collectionStore.fetchCollections().catch(() => {})
  }

  async function onDuplicate() {
    if (!item.value?.id) return

    duplicating.value = true
    try {
      const copy = await itemsStore.duplicateItem(item.value.id)
      await onItemDuplicated(copy)
    } catch (err) {
      itemsStore.error = err?.message ?? 'Nie udało się powielić przedmiotu.'
      console.error(err)
    } finally {
      duplicating.value = false
    }
  }

  async function onItemDuplicated(copy) {
    showEditModal.value = false
    await collectionStore.fetchCollections().catch(() => {})
    router.push({
      name: 'item-overview',
      params: {
        name: props.name,
        item_name: String(copy.id),
      },
      query: props.groupId ? { groupId: props.groupId } : {},
    })
  }

  function onItemDeleted() {
    showEditModal.value = false
    router.push({
      name: 'collection-category',
      params: { name: props.name },
      query: props.groupId ? { groupId: props.groupId } : {},
    })
  }

  const collection = computed(() => {
    if (!props.groupId) return null
    return collectionStore.collectionByGroupId(props.groupId)
  })

  const item = computed(() => {
    if (!props.item_name) return null
    if (props.groupId) {
      return collectionStore.itemByGroupId(props.groupId, props.item_name)
    }
    return collectionStore.itemById(props.item_name)
  })

  const canEdit = computed(() => Boolean(item.value?.fromApi && item.value?.id))

  const collectionGroupName = computed(
    () => item.value?.collection_group ?? collection.value?.name ?? null
  )

  const showClothingSize = computed(
    () => isClothingCollection(collectionGroupName.value) && Boolean(item.value?.size)
  )

  const showShoeSize = computed(
    () => isShoesCollection(collectionGroupName.value) && Boolean(item.value?.size)
  )

  watch(
    item,
    (value) => {
      if (value?.size_system === 'us' || value?.size_system === 'eu') {
        shoeDisplaySystem.value = value.size_system
      } else {
        shoeDisplaySystem.value = 'eu'
      }
    },
    { immediate: true }
  )

  const displayedShoeSize = computed(() => {
    if (!item.value?.size) return null
    return displayShoeSize(
      item.value.size,
      item.value.size_system === 'us' ? 'us' : 'eu',
      shoeDisplaySystem.value
    )
  })

  const storedShoeSizeLabel = computed(() => {
    if (!item.value?.size || !showShoeSize.value) return null
    const sys = item.value.size_system === 'us' ? 'US' : 'EU'
    if (shoeDisplaySystem.value === (item.value.size_system === 'us' ? 'us' : 'eu')) {
      return null
    }
    return `${item.value.size} ${sys}`
  })

  function resolvePersonaName(personaId) {
    if (!personaId) return null
    return (
      item.value?.default_persona?.name ??
      personasStore.prims.find((p) => Number(p.id) === Number(personaId))?.name ??
      null
    )
  }

  const personaFitText = computed(() => {
    const it = item.value
    if (!it) return null

    if (it.fits_all_personas) {
      const name = resolvePersonaName(it.default_persona_id)
      return name
        ? `Pasuje do wszystkich person · domyślnie ${name}`
        : 'Pasuje do wszystkich person'
    }

    const defaultName = resolvePersonaName(it.default_persona_id)
    return defaultName ? `Domyślnie pasuje do: ${defaultName}` : null
  })

  const brandLabel = computed(() => displayBrandName(item.value?.brand))
  const seasonLabel = computed(() => displaySeasonName(item.value?.season))
  const rarityLabel = computed(() => displayRarityName(item.value?.rarity))
  const colorLabel = computed(() => displayColorName(item.value?.color))
  const colorSwatch = computed(() => colorSwatchStyle(item.value?.color))

  const displayPrice = computed(() => {
    if (!item.value) return null
    const value = item.value.current_value ?? item.value.purchase_price_pln ?? item.value.purchase_price
    if (value == null) return null
    return formatPln(value)
  })

  const purchasePriceText = computed(() => {
    if (!item.value || item.value.gift || item.value.purchase_price == null) return null

    const currency = item.value.purchase_currency ?? 'PLN'
    const original = formatMoney(item.value.purchase_price, currency)

    if (currency === 'PLN') {
      return original
    }

    const pln = item.value.purchase_price_pln
    if (pln != null) {
      return `${original} (≈ ${formatPln(pln)})`
    }

    return original
  })

  const galleryImageClasses = [
    'row-span-2 aspect-3/4 size-full rounded-lg max-lg:hidden',
    'col-start-2 aspect-3/2 size-full rounded-lg max-lg:hidden',
    'col-start-2 row-start-2 aspect-3/2 size-full rounded-lg max-lg:hidden',
    'row-span-2 aspect-4/5 size-full rounded-lg sm:rounded-lg lg:aspect-3/4',
  ]

  const fallbackGallery = [
    {
      src: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/product-page-02-featured-product-shot.jpg',
      alt: 'Product',
    },
  ]

  const galleryImages = computed(() => {
    const alt = item.value?.name ?? 'Item'
    const urls = itemGalleryUrls(item.value)

    if (!urls.length) {
      return fallbackGallery
    }

    return urls.map((src, index) => ({
      src,
      alt: index === 0 ? alt : `${alt} ${index + 1}`,
    }))
  })

  function capitalizeWord(text) {
    if (!text) return ''
    return text.charAt(0).toUpperCase() + text.slice(1)
  }

  const breadcrumbs = computed(() => {
    const crumbs = [
      {
        id: 'collection',
        name: 'Collection',
        to: { name: 'collection' },
      },
    ]

    if (route.query.fromAll === '1') {
      crumbs.push({
        id: 'all-items',
        name: 'All items',
        to: { name: 'collection-all' },
      })
    }

    if (collection.value) {
      crumbs.push({
        id: 'group',
        name: capitalizeWord(collection.value.name),
        to: {
          name: 'collection-category',
          params: { name: props.name },
          query: { groupId: props.groupId },
        },
      })
    }

    if (item.value?.category) {
      crumbs.push({
        id: 'category',
        name: isClothingCollection(collectionGroupName.value)
          ? displayClothingTypeName(item.value.category)
          : capitalizeWord(item.value.category),
        to: {
          name: 'collection-category',
          params: { name: props.name },
          query: { groupId: props.groupId, category: item.value.category },
        },
      })
    }

    return crumbs
  })
  </script>
