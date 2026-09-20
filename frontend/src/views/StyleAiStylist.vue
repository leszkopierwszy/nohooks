<template>
  <div class="mx-auto max-w-3xl px-4 pb-8 sm:px-6 lg:px-8">
    <header class="pb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ t('fashionStylist.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ t('fashionStylist.subtitle') }}
      </p>
    </header>

    <p
      v-if="!configured"
      class="rounded-md bg-amber-50 p-4 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
    >
      {{ t('fashionStylist.notConfigured') }}
    </p>

    <FashionStylistModal
      v-else
      embedded
      open
      :entity-id="defaultEntityId"
      @saved="onSaved"
    />
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import FashionStylistModal from '../components/outfit/FashionStylistModal.vue'
import { useI18n } from '../composables/useI18n'
import { useFashionStylistStore } from '../stores/fashionStylist'
import { usePersonasStore } from '../stores/personas'

const { t } = useI18n()
const router = useRouter()
const fashionStylistStore = useFashionStylistStore()
const personasStore = usePersonasStore()

const configured = computed(() => fashionStylistStore.configured)
const defaultEntityId = computed(
  () => personasStore.activePrim?.id ?? personasStore.prims[0]?.id ?? ''
)

function onSaved() {
  router.push({ name: 'Style' })
}

onMounted(async () => {
  await Promise.all([
    personasStore.fetchPersonas().catch(() => {}),
    fashionStylistStore.fetchStatus().catch(() => {}),
  ])
})
</script>
