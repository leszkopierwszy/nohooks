<template>
  <div class="mx-auto max-w-7xl px-4 pb-8 sm:px-6 lg:px-8">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
          {{ t('nav.collection') }}
        </h1>
        <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          {{ t('collectionPage.subtitle') }}
        </p>
      </div>
      <RouterLink
        :to="{ name: 'collection-all' }"
        class="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
      >
        {{ t('collectionPage.browseAll') }}
        <span aria-hidden="true"> →</span>
      </RouterLink>
    </div>

    <p
      v-if="collectionStore.error"
      class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700"
    >
      {{ collectionStore.error }}
    </p>

    <div class="mt-8">
      <div class="flex items-center justify-between gap-3">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-zinc-50">
          {{ t('collectionPage.groupsTitle') }}
        </h2>
        <button
          type="button"
          class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
          @click="openCreateModal"
        >
          + {{ t('collectionPage.newGroup') }}
        </button>
      </div>

      <p
        v-if="collectionStore.loading && !groups.length"
        class="mt-4 text-sm text-gray-500"
      >
        {{ t('common.loading') }}
      </p>

      <div
        v-else
        class="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <button
          v-for="group in groups"
          :key="group.id"
          type="button"
          class="rounded-xl border border-gray-200 bg-white p-4 text-left transition hover:border-gray-300 hover:bg-gray-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-zinc-600 dark:hover:bg-zinc-800"
          @click="goToGroup(group)"
        >
          <component
            :is="groupIcon(group.name)"
            class="size-6 text-gray-700 dark:text-zinc-300"
            aria-hidden="true"
          />
          <p class="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">
            {{ displayName(group.name) }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {{ t('outfit.itemCount', { count: group.itemsCount }) }}
          </p>
        </button>

        <button
          type="button"
          class="rounded-xl border border-dashed border-gray-300 bg-white p-4 text-left transition hover:border-gray-400 hover:bg-gray-50 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:border-zinc-500 dark:hover:bg-zinc-800"
          @click="openCreateModal"
        >
          <PlusIcon
            class="size-6 text-gray-400"
            aria-hidden="true"
          />
          <p class="mt-3 text-sm font-semibold text-gray-900 dark:text-zinc-50">
            {{ t('collectionPage.newGroup') }}
          </p>
          <p class="mt-1 text-xs text-gray-500 dark:text-zinc-400">
            {{ t('collectionPage.newGroupHint') }}
          </p>
        </button>
      </div>
    </div>

    <CreateCollectionModal
      :open="showCreateModal"
      @close="showCreateModal = false"
      @created="onCollectionCreated"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  BookOpenIcon,
  CubeIcon,
  DevicePhoneMobileIcon,
  GiftIcon,
  PlusIcon,
  ShoppingBagIcon,
  SparklesIcon,
  SwatchIcon,
  TagIcon,
} from '@heroicons/vue/24/outline'
import CreateCollectionModal from './CreateCollectionModal.vue'
import { useI18n } from '../composables/useI18n'
import { useCollectionStore } from '../stores/collection'

const { t } = useI18n()
const router = useRouter()
const collectionStore = useCollectionStore()
const showCreateModal = ref(false)

const groups = computed(() =>
  collectionStore.allCollections.map((collection) => ({
    id: collection.id,
    name: collection.name,
    itemsCount: collection.items?.length ?? 0,
  }))
)

function displayName(name) {
  if (!name) return ''
  return name.charAt(0).toUpperCase() + name.slice(1)
}

function groupIcon(name) {
  const n = String(name || '').toLowerCase()
  if (/shoe|buty|sneaker|boot|footwear/.test(n)) return ShoppingBagIcon
  if (/cloth|ubrania|apparel|wardrobe|szafa|dress|wear/.test(n)) return SwatchIcon
  if (/accessor|akcesor|bag|torb|bi[zż]uter|jewel|watch|zegar|scarf|hat|belt|pasek/.test(n)) {
    return TagIcon
  }
  if (/electron|gadget|tech|phone|laptop|tablet|audio|gaming/.test(n)) {
    return DevicePhoneMobileIcon
  }
  if (/book|ksi[aą][zż]|media/.test(n)) return BookOpenIcon
  if (/gift|prezent/.test(n)) return GiftIcon
  if (/object|rzecz|misc|other|inne/.test(n)) return CubeIcon
  return SparklesIcon
}

function goToGroup(group) {
  router.push({
    name: 'collection-category',
    params: { name: group.name },
    query: { groupId: String(group.id) },
  })
}

function openCreateModal() {
  showCreateModal.value = true
}

function onCollectionCreated(collection) {
  showCreateModal.value = false
  if (collection?.name) goToGroup(collection)
}

onMounted(() => {
  collectionStore.fetchCollections().catch(() => {})
})
</script>
