<template>
  <div>
    <!-- <button
      @click="toggleLeft"
      class="mb-4 rounded-lg bg-black px-4 py-2 text-white"
    >
      Filters
    </button> -->

    <main class="mx-auto lg:max-w-9xl px-4 sm:px-6">
          <!-- X button -->
          <div class="pb-6">
            <router-link to="/collection" >
              <XMarkIcon class="size-6 hover:bg-gray-300" aria-hidden="true" />
            </router-link>                 
          </div> 
          <div class="flex items-baseline justify-between border-b border-gray-200 pb-6 mb-6">        
            <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ pageTitle }}</h1>

            <div class="flex items-center">
              <button
                v-if="resolvedGroupId && !isAllItemsView"
                type="button"
                class="mr-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                @click="showAddItemModal = true"
              >
                Add item
              </button>
              <Menu as="div" class="relative inline-block text-left">
                <button
                  type="button"
                  class="group relative inline-flex justify-center pr-3 text-sm font-medium text-gray-700 hover:text-gray-900"
                  @click="toggleLeft"
                >
                  Filtry
                  <span
                    v-if="filtersActive"
                    class="ml-1.5 inline-flex min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 py-0.5 text-xs font-semibold text-white"
                  >
                    {{ filterActiveCount }}
                  </span>
                </button>
                <MenuButton class="group inline-flex justify-center text-sm font-medium text-gray-700 hover:text-gray-900">
                  Sort
                  <ChevronDownIcon class="-mr-1 ml-1 size-5 shrink-0 text-gray-400 group-hover:text-gray-500" aria-hidden="true" />
                </MenuButton>

                <transition enter-active-class="transition ease-out duration-100" enter-from-class="transform opacity-0 scale-95" enter-to-class="transform scale-100" leave-active-class="transition ease-in duration-75" leave-from-class="transform scale-100" leave-to-class="transform opacity-0 scale-95">
                  <MenuItems class="absolute right-0 z-10 mt-2 w-40 origin-top-right rounded-md bg-white shadow-2xl ring-1 ring-black/5 focus:outline-hidden">
                    <div class="py-1">
                      <MenuItem v-for="option in sortOptions" :key="option.name" v-slot="{ active }">
                        <router-link to="/product" :class="[option.current ? 'font-medium text-gray-900' : 'text-gray-500', active ? 'bg-gray-100 outline-hidden' : '', 'block px-4 py-2 text-sm']">{{ option.name }}</router-link>
                      </MenuItem>
                    </div>
                  </MenuItems>
                </transition>
              </Menu>

              <button type="button" class="-m-2 ml-5 p-2 text-gray-400 hover:text-gray-500 sm:ml-7">
                <span class="sr-only">View grid</span>
                <Squares2X2Icon class="size-5" aria-hidden="true" />
              </button>
              <button type="button" class="-m-2 ml-4 p-2 text-gray-400 hover:text-gray-500 sm:ml-6 lg:hidden" @click="mobileFiltersOpen = true">
                <span class="sr-only">Filters</span>
                <FunnelIcon class="size-5" aria-hidden="true" />
              </button>
            </div>
          </div>
          <section>
            <!-- x -->
            <div class="pb-3">
              <div class="flex w-full items-start overflow-hidden">
                <aside
                  class="shrink-0 overflow-hidden transition-[width] duration-300 ease-in-out motion-reduce:transition-none"
                  :class="showLeftPanel ? 'w-64' : 'w-0'"
                  :aria-hidden="!showLeftPanel"
                >
                  <div class="w-64 pr-4">
                    <div class="max-h-[calc(100vh-12rem)] overflow-y-auto pr-1">
                      <h3 class="sr-only">Kategorie</h3>
                      <ul
                        role="list"
                        class="space-y-4 border-b border-gray-200 pb-6 text-sm font-medium text-gray-900"
                      >
                        <li v-for="category in subCategories" :key="category.value || 'all'">
                          <RouterLink
                            :to="category.to"
                            class="hover:text-indigo-600"
                            :class="category.active ? 'text-indigo-600' : 'text-gray-900'"
                          >
                            {{ category.name }}
                          </RouterLink>
                        </li>
                      </ul>

                      <CollectionFiltersPanel
                        class="mt-2"
                        :sections="filterSections"
                        :active-count="filterActiveCount"
                        :has-active-filters="filtersActive"
                        @toggle="onFilterToggle"
                        @clear-all="onClearFilters"
                      />
                    </div>
                  </div>
                </aside>

                <div
                  class="min-w-0 flex-1 transition-[margin] duration-300 ease-in-out motion-reduce:transition-none"
                  :class="showLeftPanel ? 'pl-4' : 'pl-0'"
                >
                  <ProductList
                    :key="`${name}-${resolvedGroupId ?? 'all'}`"
                    :group-id="resolvedGroupId"
                    :collection-name="name"
                    :all-items="isAllItemsView"
                  />
                </div>
              </div>
            </div>
            <RouterView />
          </section>

    <TransitionRoot as="template" :show="mobileFiltersOpen">
      <Dialog class="relative z-50 lg:hidden" @close="mobileFiltersOpen = false">
        <TransitionChild
          as="template"
          enter="ease-out duration-300"
          enter-from="opacity-0"
          enter-to="opacity-100"
          leave="ease-in duration-200"
          leave-from="opacity-100"
          leave-to="opacity-0"
        >
          <div class="fixed inset-0 bg-black/25" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transform transition ease-in-out duration-300"
            enter-from="translate-x-full"
            enter-to="translate-x-0"
            leave="transform transition ease-in-out duration-300"
            leave-from="translate-x-0"
            leave-to="translate-x-full"
          >
            <DialogPanel class="relative ml-auto flex h-full w-full max-w-xs flex-col overflow-y-auto bg-white px-4 py-6 shadow-xl">
              <div class="flex items-center justify-between">
                <h2 class="text-lg font-medium text-gray-900">Filtry</h2>
                <button
                  type="button"
                  class="text-gray-400 hover:text-gray-500"
                  @click="mobileFiltersOpen = false"
                >
                  <span class="sr-only">Zamknij</span>
                  <XMarkIcon class="size-6" aria-hidden="true" />
                </button>
              </div>

              <ul role="list" class="mt-6 space-y-4 border-b border-gray-200 pb-6 text-sm font-medium text-gray-900">
                <li v-for="category in subCategories" :key="category.value || 'all'">
                  <RouterLink
                    :to="category.to"
                    class="hover:text-indigo-600"
                    :class="category.active ? 'text-indigo-600' : 'text-gray-900'"
                    @click="mobileFiltersOpen = false"
                  >
                    {{ category.name }}
                  </RouterLink>
                </li>
              </ul>

              <CollectionFiltersPanel
                class="mt-4"
                id-prefix="mobile"
                :sections="filterSections"
                :active-count="filterActiveCount"
                :has-active-filters="filtersActive"
                @toggle="onFilterToggle"
                @clear-all="onClearFilters"
              />
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <AddCollectionItemModal
      :open="showAddItemModal"
      :group-id="resolvedGroupId"
      :collection-name="props.name"
      @close="showAddItemModal = false"
    />
    </main>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { getAllClothingTypes } from '../constants/itemClothingTypes'
import { isClothingCollection } from '../constants/itemSizes'
import { useCollectionStore } from '../stores/collection'
import {
  Dialog,
  DialogPanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { ChevronDownIcon, FunnelIcon, Squares2X2Icon } from '@heroicons/vue/20/solid'
import CollectionFiltersPanel from '../components/CollectionFiltersPanel.vue'
import ProductList from '../components/ProductList.vue'
import AddCollectionItemModal from '../components/AddCollectionItemModal.vue'
import {
  activeFilterCount,
  buildFilterSections,
  clearFilterQuery,
  hasActiveFilters,
  toggleFilterInQuery,
} from '../utils/itemListFilters'

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
  groupId: {
    type: String,
    default: null,
  },
})

const collectionStore = useCollectionStore()
const route = useRoute()
const router = useRouter()
const showAddItemModal = ref(false)

const resolvedGroupId = computed(() => {
  if (props.groupId) return String(props.groupId)

  if (props.name && props.name !== 'all') {
    const collection = collectionStore.collectionByName(props.name)
    if (collection) return String(collection.id)
  }

  return null
})

async function ensureData() {
  if (!collectionStore.allCollections.length) {
    await collectionStore.fetchCollections()
  }

  if (props.name === 'all' && !collectionStore.browseAllItems.length) {
    await collectionStore.fetchAllItems()
  }
}

onMounted(() => {
  ensureData().catch(() => {})
})

watch(
  () => props.name,
  () => {
    ensureData().catch(() => {})
  }
)

const mobileFiltersOpen = ref(false)
const showLeftPanel = ref(false)

function toggleLeft() {
  showLeftPanel.value = !showLeftPanel.value
}


    function capitalizeWord(text) {
        if (!text) return ''
        return text.charAt(0).toUpperCase() + text.slice(1)
    }

    const isAllItemsView = computed(() => props.name === 'all')

    const pageTitle = computed(() =>
      isAllItemsView.value ? 'All items' : capitalizeWord(props.name)
    )

    const sortOptions = [
      { name: 'Most Popular', href: '#', current: true },
      { name: 'Best Rating', href: '#', current: false },
      { name: 'Newest', href: '#', current: false },
      { name: 'Price: Low to High', href: '#', current: false },
      { name: 'Price: High to Low', href: '#', current: false },
    ]
    const subCategories = computed(() => {
      if (isAllItemsView.value) {
        const activeCollectionId = route.query.collectionId
          ? String(route.query.collectionId)
          : ''

        return [
          {
            name: 'Wszystkie kolekcje',
            value: '',
            active: !activeCollectionId,
            to: { name: 'collection-all' },
          },
          ...collectionStore.allCollections.map((collection) => ({
            name: capitalizeWord(collection.name),
            value: String(collection.id),
            active: activeCollectionId === String(collection.id),
            to: {
              name: 'collection-all',
              query: { collectionId: String(collection.id) },
            },
          })),
        ]
      }

      const baseQuery = resolvedGroupId.value
        ? { groupId: resolvedGroupId.value }
        : {}
      const activeCategory = route.query.category ? String(route.query.category) : ''

      const allLink = {
        name: 'Wszystkie',
        value: '',
        active: !activeCategory,
        to: {
          name: 'collection-category',
          params: { name: props.name },
          query: baseQuery,
        },
      }

      if (!isClothingCollection(props.name)) {
        return [allLink]
      }

      const items = resolvedGroupId.value
        ? collectionStore.itemsByGroupId(resolvedGroupId.value)
        : []
      const usedTypes = items.map((item) => item.category).filter(Boolean)

      return [
        allLink,
        ...getAllClothingTypes(usedTypes).map((type) => ({
          name: type.label,
          value: type.value,
          active: activeCategory === type.value,
          to: {
            name: 'collection-category',
            params: { name: props.name },
            query: { ...baseQuery, category: type.value },
          },
        })),
      ]
    })

const baseItems = computed(() => {
  if (isAllItemsView.value) {
    let list = [...collectionStore.browseAllItems]
    if (route.query.collectionId) {
      const collectionId = String(route.query.collectionId)
      list = list.filter((item) => String(item.category_id) === collectionId)
    }
    return list
  }
  return [...collectionStore.itemsByGroupId(resolvedGroupId.value)]
})

const filterSections = computed(() =>
  buildFilterSections(baseItems.value, route.query, props.name)
)

const filterActiveCount = computed(() => activeFilterCount(route.query))
const filtersActive = computed(() => hasActiveFilters(route.query))

function onFilterToggle(sectionId, value) {
  router.replace({
    query: toggleFilterInQuery(route.query, sectionId, value),
  })
}

function onClearFilters() {
  router.replace({ query: clearFilterQuery(route.query) })
}

</script>
