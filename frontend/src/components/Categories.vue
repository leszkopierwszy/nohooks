<template>
    <div class="bg-white">
      <div class="sm:py-6 xl:mx-auto xl:max-w-9xl xl:px-8">
        <div class="px-4 sm:flex sm:items-center sm:justify-between sm:px-6 lg:px-8 xl:px-0">
            <h2 class="text-4xl font-bold tracking-tight text-gray-900">{{capitalizeName}}</h2>
            <RouterLink
              :to="{ name: 'collection-all' }"
              class="hidden text-sm font-semibold text-indigo-600 hover:text-indigo-500 sm:block"
            >
              Browse all items
              <span aria-hidden="true"> &rarr;</span>
            </RouterLink>
        </div>
  
        <div class="my-4 flow-root">
          <div class="-my-2">
            <div class="relative box-content h-80 overflow-x-auto py-2 xl:overflow-visible">
              <div class="absolute flex space-x-8 space-y-6 px-4 sm:px-6 lg:px-8 xl:relative xl:grid xl:grid-cols-4 xl:gap-x-8 xl:space-x-0 xl:px-0">
                <a
                    v-for="category in props.categories"
                    :key="category.name"
                    @click.prevent="goToCategory(category)"
                    :class="cardStyles">
                    <span aria-hidden="true" class="absolute inset-0">
                        <ItemImage
                            :src="category.imageSrc ?? category.cover"
                            :alt="capitalizeWord(category.name)"
                            container-class="size-full"
                            img-class="size-full"
                        />
                    </span>
                    <span aria-hidden="true" class="absolute inset-x-0 bottom-0 h-2/3 bg-linear-to-t from-gray-800 opacity-50"></span>
                    <span class="relative mt-auto text-center text-xl font-bold text-black">{{ capitalizeWord(category.name) }}</span>
                </a>
                <div
                    role="button"
                    tabindex="0"
                    :class="[cardStyles, 'cursor-pointer border-2 border-dashed border-gray-200 rounded-4xl']"
                    @click="openCreateModal"
                    @keydown.enter.prevent="openCreateModal"
                >
                    <div class="flex h-full items-center justify-center text-center">
                        <div>
                            <svg class="mx-auto size-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <RectangleGroupIcon/>
                            </svg>
                            <h3 class="mt-2 text-sm font-semibold text-gray-900">New collection</h3>
                            <p class="mt-1 text-sm text-gray-500">Get started by creating a new collection.</p>
                            <div class="mt-6">
                                <button
                                    type="button"
                                    class="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                                    @click.stop="openCreateModal"
                                >
                                    Create
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CreateCollectionModal
          :open="showCreateModal"
          @close="showCreateModal = false"
          @created="onCollectionCreated"
        />
  
        <div class="mt-6 px-4 sm:hidden">
          <RouterLink
            :to="{ name: 'collection-all' }"
            class="block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Browse all items
            <span aria-hidden="true"> &rarr;</span>
          </RouterLink>
        </div>
      </div>
    </div>
  </template>
  
<script setup>
    import { computed, ref } from 'vue'
    import { RouterLink, useRouter } from 'vue-router'
    import { RectangleGroupIcon } from '@heroicons/vue/24/outline'
    import ItemImage from './ItemImage.vue'
    import CreateCollectionModal from './CreateCollectionModal.vue'

    const router = useRouter()
    const showCreateModal = ref(false)

    const props = defineProps({
            title: String,
            categories: {
                type: Array,
                default: () => [],
                required: true,
            }
        }
    )

    const capitalizeName = computed(() => {
        if (!props.title) return ''
        return props.title.charAt(0).toUpperCase() + props.title.slice(1)
    }) 

    function capitalizeWord(text) {
        if (!text) return ''
        return text.charAt(0).toUpperCase() + text.slice(1)
    }

    function goToCategory(category) {
        router.push({
            name: 'collection-category',
            params: { name: category.name },
            query: { groupId: String(category.id) },
        })
    }

    function openCreateModal() {
        showCreateModal.value = true
    }

    function onCollectionCreated(collection) {
        goToCategory(collection)
    }

    const cardStyles = 'relative flex h-80 w-80 px-auto flex-col overflow-hidden rounded-lg p-6 hover:opacity-75 xl:w-auto'

</script>
