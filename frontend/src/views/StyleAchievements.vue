<template>
  <div class="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <RouterLink
      :to="{ name: 'StyleStyles', query: entityId ? { entity_id: entityId } : {} }"
      class="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      ← {{ t('style.journey.backToStyles') }}
    </RouterLink>

    <header class="mt-4 pb-2">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900">
        {{ t('style.journey.achievementsTitle') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500">
        {{ t('style.journey.achievementsSubtitle') }}
      </p>
    </header>

    <p
      v-if="loading"
      class="mt-6 text-sm text-gray-500"
    >
      {{ t('common.loading') }}
    </p>
    <p
      v-else-if="pageError"
      class="mt-6 rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {{ pageError }}
    </p>

    <template v-else>
      <p class="mt-4 text-sm text-gray-600">
        {{
          t('style.journey.achievementsCount', {
            unlocked: unlockedCount,
            total: achievements.length,
          })
        }}
      </p>

      <div
        v-if="achievements.length"
        class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
      >
        <article
          v-for="ach in achievements"
          :key="ach.id"
          class="flex flex-col overflow-hidden rounded-2xl border shadow-sm"
          :class="
            ach.unlocked
              ? 'border-amber-200 bg-white'
              : 'border-gray-200 bg-gray-50 opacity-80'
          "
        >
          <div
            class="flex aspect-square items-center justify-center"
            :class="
              ach.unlocked
                ? 'bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600'
                : 'bg-gradient-to-br from-gray-300 to-gray-500'
            "
          >
            <span class="text-4xl font-semibold text-white/95">
              {{ badgeGlyph(ach) }}
            </span>
          </div>
          <div class="flex flex-1 flex-col p-3">
            <div class="flex items-start justify-between gap-2">
              <h2 class="text-sm font-semibold text-gray-900">{{ ach.title }}</h2>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium"
                :class="
                  ach.unlocked
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-gray-200 text-gray-600'
                "
              >
                {{ ach.unlocked ? t('style.journey.unlocked') : t('style.journey.locked') }}
              </span>
            </div>
            <p
              v-if="ach.description"
              class="mt-1 line-clamp-3 text-xs leading-relaxed text-gray-500"
            >
              {{ ach.description }}
            </p>
            <p
              v-if="ach.xp_bonus"
              class="mt-auto pt-2 text-xs font-medium text-gray-600"
            >
              +{{ ach.xp_bonus }} XP
            </p>
            <p
              v-if="ach.unlocked && ach.unlocked_at"
              class="mt-1 text-[11px] text-gray-400"
            >
              {{ formatDate(ach.unlocked_at) }}
            </p>
          </div>
        </article>
      </div>

      <p
        v-else
        class="mt-8 text-sm text-gray-500"
      >
        {{ t('style.journey.achievementsEmpty') }}
      </p>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { usePersonasStore } from '../stores/personas'
import { useStyleJourneyStore } from '../stores/styleJourney'

const { t } = useI18n()
const route = useRoute()
const personasStore = usePersonasStore()
const journeyStore = useStyleJourneyStore()

const loading = ref(true)
const pageError = ref('')

const entityId = computed(() => {
  const q = route.query.entity_id
  if (q) return String(q)
  return String(
    personasStore.activePrim?.id ??
      personasStore.activePersonaId ??
      personasStore.prims[0]?.id ??
      '',
  )
})

const achievements = computed(() => journeyStore.achievements)
const unlockedCount = computed(
  () => achievements.value.filter((a) => a.unlocked).length,
)

function badgeGlyph(ach) {
  const icon = String(ach.icon || '').toLowerCase()
  if (icon.includes('trophy')) return '🏆'
  if (icon.includes('spark')) return '✦'
  if (ach.unlocked) return '★'
  return '☆'
}

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return iso
  }
}

onMounted(async () => {
  loading.value = true
  pageError.value = ''
  try {
    await personasStore.fetchPersonas().catch(() => {})
    if (!entityId.value) {
      pageError.value = t('style.journey.pickPrim')
      return
    }
    personasStore.setActivePersona(Number(entityId.value))
    if (!journeyStore.journey || Number(journeyStore.journey.entity_id) !== Number(entityId.value)) {
      await journeyStore.sync(entityId.value)
    }
  } catch (err) {
    pageError.value = err?.message || t('style.journey.loadError')
  } finally {
    loading.value = false
  }
})
</script>
