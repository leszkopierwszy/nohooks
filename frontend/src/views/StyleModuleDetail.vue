<template>
  <div class="mx-auto max-w-3xl px-4 pb-10 sm:px-6 lg:px-8">
    <RouterLink
      :to="{ name: 'StyleStyles', query: entityId ? { entity_id: entityId } : {} }"
      class="inline-flex text-sm font-medium text-indigo-600 hover:text-indigo-500"
    >
      ← {{ t('style.journey.backToStyles') }}
    </RouterLink>

    <p
      v-if="loading"
      class="mt-8 text-sm text-gray-500"
    >
      {{ t('common.loading') }}
    </p>

    <p
      v-else-if="pageError"
      class="mt-8 rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {{ pageError }}
    </p>

    <template v-else-if="mod">
      <p
        v-if="pageHint"
        class="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800"
      >
        {{ pageHint }}
      </p>

      <article class="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-5 py-4">
          <div class="flex min-w-0 items-center gap-3">
            <div
              class="flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
              :class="accentClass"
            >
              {{ initials }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-gray-900">{{ primName }}</p>
              <p class="text-xs text-gray-500">{{ modeLabel }}</p>
            </div>
          </div>
          <span
            class="rounded-full px-2.5 py-1 text-xs font-medium"
            :class="
              mod.completed
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-50 text-amber-900 ring-1 ring-inset ring-amber-200'
            "
          >
            {{ mod.completed ? t('style.journey.done') : t('style.journey.inProgress') }}
          </span>
        </div>

        <div
          class="mx-5 mt-5 flex aspect-16/10 items-center justify-center rounded-xl"
          :class="previewBg"
        >
          <p class="text-4xl font-semibold tracking-tight text-white/90">
            +{{ mod.xp_reward }}
            <span class="text-lg font-medium">XP</span>
          </p>
        </div>

        <div class="px-5 py-5">
          <h1 class="text-xl font-semibold tracking-tight text-gray-900">
            {{ mod.title }}
          </h1>
          <p
            v-if="mod.description"
            class="mt-2 text-sm leading-relaxed text-gray-600"
          >
            {{ mod.description }}
          </p>

          <div class="mt-4 flex flex-wrap gap-2">
            <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              {{ modeLabel }}
            </span>
            <span
              v-if="mod.gender"
              class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
            >
              {{ mod.gender }}
            </span>
            <span class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
              +{{ mod.xp_reward }} XP
            </span>
          </div>

          <ul class="mt-6 space-y-3 border-t border-gray-100 pt-5 text-sm text-gray-700">
            <li class="flex items-center gap-2">
              <span class="flex size-7 items-center justify-center rounded-full bg-indigo-50 text-xs font-semibold text-indigo-700">XP</span>
              {{ t('style.journey.rewardMeta', { xp: mod.xp_reward }) }}
            </li>
            <li class="flex items-center gap-2">
              <span class="flex size-7 items-center justify-center rounded-full bg-stone-100 text-xs font-semibold text-stone-700">M</span>
              {{ modeLabel }}
            </li>
            <li
              v-if="mod.completed_at"
              class="flex items-center gap-2"
            >
              <span class="flex size-7 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700">✓</span>
              {{ t('style.journey.completedAt', { date: formatDate(mod.completed_at) }) }}
            </li>
          </ul>

          <div
            v-if="!mod.completed && mod.eval?.missing?.length"
            class="mt-6 rounded-xl border border-amber-200 bg-amber-50/70 p-4"
          >
            <p class="text-sm font-semibold text-amber-950">{{ t('style.journey.stillNeeded') }}</p>
            <ul class="mt-2 list-inside list-disc text-sm text-amber-900">
              <li
                v-for="(m, i) in mod.eval.missing"
                :key="i"
              >
                {{ missingLabel(m) }}
              </li>
            </ul>
            <RouterLink
              v-if="mod.completion_mode === 'auto'"
              :to="{ name: 'collection' }"
              class="mt-3 inline-block text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              {{ t('nav.collection') }}
              <span aria-hidden="true"> →</span>
            </RouterLink>
          </div>

          <div
            v-if="!mod.completed && mod.completion_mode === 'manual'"
            class="mt-6 space-y-3 border-t border-gray-100 pt-5"
          >
            <p class="text-sm font-semibold text-gray-900">{{ t('style.journey.checklist') }}</p>
            <label
              v-for="check in manualChecks"
              :key="check.id"
              class="flex items-start gap-2 text-sm text-gray-700"
            >
              <input
                v-model="checklist"
                type="checkbox"
                :value="check.id"
                class="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-indigo-600"
              />
              <span>{{ check.label }}</span>
            </label>
            <button
              type="button"
              class="w-full rounded-lg bg-indigo-600 px-3 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
              :disabled="saving"
              @click="submitManual"
            >
              {{ saving ? t('common.loading') : t('style.journey.submitChecks') }}
            </button>
          </div>

          <div
            v-else-if="!mod.completed && mod.completion_mode === 'auto'"
            class="mt-6"
          >
            <button
              type="button"
              class="w-full rounded-lg bg-gray-900 px-3 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
              :disabled="saving"
              @click="recheck"
            >
              {{ saving ? t('style.journey.syncing') : t('style.journey.checkWardrobe') }}
            </button>
          </div>
        </div>
      </article>
    </template>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { usePersonasStore } from '../stores/personas'
import { useStyleJourneyStore } from '../stores/styleJourney'

const { t } = useI18n()
const route = useRoute()
const personasStore = usePersonasStore()
const journeyStore = useStyleJourneyStore()

const loading = ref(true)
const saving = ref(false)
const pageError = ref('')
const pageHint = ref('')
const checklist = ref([])

const moduleId = computed(() => Number(route.params.id))
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

const mod = computed(() =>
  journeyStore.modules.find((m) => Number(m.id) === moduleId.value) ?? null,
)

const primName = computed(() => {
  const p = personasStore.prims.find((x) => String(x.id) === entityId.value)
  return p?.name ?? t('outfit.prim')
})

const initials = computed(() => {
  const name = primName.value || '?'
  return name.slice(0, 1).toUpperCase()
})

const modeLabel = computed(() =>
  mod.value?.completion_mode === 'manual'
    ? t('style.journey.modeManual')
    : t('style.journey.modeAuto'),
)

const accentClass = computed(() => {
  if (mod.value?.completed) return 'bg-emerald-600'
  if (mod.value?.completion_mode === 'manual') return 'bg-violet-600'
  return 'bg-gray-900'
})

const previewBg = computed(() => {
  if (mod.value?.completed) return 'bg-gradient-to-br from-emerald-500 to-teal-700'
  if (mod.value?.completion_mode === 'manual') return 'bg-gradient-to-br from-violet-500 to-indigo-700'
  return 'bg-gradient-to-br from-stone-700 to-stone-900'
})

const manualChecks = computed(() => mod.value?.requirements?.checks ?? [])

function missingLabel(m) {
  if (m.label) return m.label
  if (m.slot) {
    return t('style.journey.needSlot', {
      slot: m.slot,
      need: m.need ?? 1,
      have: m.have ?? 0,
    })
  }
  if (m.category) {
    return t('style.journey.needCategory', {
      category: m.category,
      need: m.need ?? 1,
      have: m.have ?? 0,
    })
  }
  return JSON.stringify(m)
}

function formatDate(iso) {
  if (!iso) return ''
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

async function load() {
  loading.value = true
  pageError.value = ''
  try {
    await personasStore.fetchPersonas().catch(() => {})
    if (!entityId.value) {
      pageError.value = t('style.journey.pickPrim')
      return
    }
    personasStore.setActivePersona(Number(entityId.value))
    await journeyStore.sync(entityId.value)
    if (!mod.value) {
      pageError.value = t('style.journey.moduleNotFound')
      return
    }
    checklist.value = [...(mod.value.checklist ?? [])]
  } catch (err) {
    pageError.value = err?.message || t('style.journey.loadError')
  } finally {
    loading.value = false
  }
}

async function submitManual() {
  saving.value = true
  pageHint.value = ''
  pageError.value = ''
  try {
    await journeyStore.completeModule(entityId.value, moduleId.value, checklist.value)
    const done = mod.value?.completed
    pageHint.value = done
      ? t('style.journey.moduleCompleted')
      : t('style.journey.checksSaved')
  } catch (err) {
    pageError.value = err?.message || t('style.journey.loadError')
  } finally {
    saving.value = false
  }
}

async function recheck() {
  saving.value = true
  pageHint.value = ''
  pageError.value = ''
  try {
    await journeyStore.completeModule(entityId.value, moduleId.value, [])
    if (mod.value?.completed) {
      pageHint.value = t('style.journey.moduleCompleted')
    } else {
      await journeyStore.sync(entityId.value)
      pageHint.value = t('style.journey.synced')
    }
  } catch (err) {
    pageError.value = err?.message || t('style.journey.loadError')
  } finally {
    saving.value = false
  }
}

watch(
  () => [route.params.id, route.query.entity_id],
  () => {
    void load()
  },
)

onMounted(() => {
  void load()
})
</script>
