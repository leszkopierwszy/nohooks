<template>
  <div class="mx-auto max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
    <header class="pb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ t('style.journey.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ t('style.journey.subtitle') }}
      </p>
    </header>

    <p
      v-if="!entityId"
      class="mt-2 text-sm text-gray-500"
    >
      {{ t('style.journey.pickPrim') }}
    </p>

    <p
      v-if="pageError || journeyStore.error"
      class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700"
    >
      {{ pageError || journeyStore.error }}
    </p>

    <template v-if="entityId">
      <p
        v-if="(journeyStore.loading || journeyStore.syncing) && !journeyStore.journey"
        class="mt-6 text-sm text-gray-500"
      >
        {{ t('common.loading') }}
      </p>

      <!-- Summary tiles -->
      <section
        v-if="journeyStore.journey || prims.length"
        class="mt-6 grid grid-cols-4 gap-2 sm:gap-3 lg:gap-4"
      >
        <!-- Prim + XP -->
        <div class="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div class="relative aspect-square bg-gradient-to-br from-stone-800 via-stone-900 to-black sm:aspect-4/3">
            <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.12),transparent_55%)]" />

            <div class="absolute left-3 top-3 z-10 flex min-w-0 items-center gap-2.5 rounded-xl bg-black/40 px-2.5 py-2 backdrop-blur-sm ring-1 ring-white/10">
              <div class="flex size-8 shrink-0 items-center justify-center rounded-full bg-white text-xs font-bold text-gray-900">
                {{ primInitial }}
              </div>
              <div class="min-w-0">
                <label class="sr-only">{{ t('outfit.prim') }}</label>
                <select
                  v-model="entityId"
                  class="max-w-20 truncate border-0 bg-transparent p-0 text-xs font-semibold text-white focus:ring-0 sm:max-w-28 sm:text-sm"
                >
                  <option
                    v-for="prim in prims"
                    :key="prim.id"
                    :value="String(prim.id)"
                    class="text-gray-900"
                  >
                    {{ prim.name }}
                  </option>
                </select>
                <p class="text-[11px] leading-none text-white/60">{{ t('outfit.prim') }}</p>
              </div>
            </div>

            <div class="absolute inset-0 flex flex-col items-center justify-center text-center">
              <p class="text-[11px] font-medium uppercase tracking-[0.2em] text-white/60">
                {{ t('style.journey.xp') }}
              </p>
              <p class="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl lg:text-5xl">
                {{ journeyStore.journey ? journeyStore.xp : '—' }}
              </p>
              <p class="mt-1 text-[11px] text-white/70 sm:text-sm">
                {{ t('style.journey.level') }}
                {{ journeyStore.journey ? journeyStore.level : '—' }}
                <span class="mx-1.5 text-white/30">·</span>
                {{ journeyStore.rank ? `#${journeyStore.rank}` : '—' }}
              </p>
            </div>
          </div>
        </div>

        <!-- Basic journeys passed -->
        <div class="relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
          <div class="relative flex aspect-square flex-col justify-between bg-gradient-to-br from-emerald-700 via-teal-800 to-stone-900 p-4 sm:aspect-4/3">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-white/60">
                {{ t('style.journey.journeysPassedLabel') }}
              </p>
              <p class="mt-2 text-sm font-medium text-white/85">
                {{ t('style.journey.journeysPassedTitle') }}
              </p>
            </div>
            <div>
              <p class="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl lg:text-5xl">
                <template v-if="journeyStore.journey">
                  {{ journeyStore.progress.completed }}
                  <span class="text-lg font-medium text-white/50 sm:text-2xl">/{{ journeyStore.progress.total }}</span>
                </template>
                <template v-else>—</template>
              </p>
              <p class="mt-1 text-[11px] text-white/70 sm:text-sm">
                {{
                  journeyStore.journey
                    ? t('style.journey.journeysPassedMeta', { percent: journeyStore.progress.percent })
                    : '—'
                }}
              </p>
            </div>
          </div>
        </div>

        <!-- Achievements tile -->
        <RouterLink
          :to="{ name: 'StyleAchievements', query: { entity_id: entityId } }"
          class="group relative overflow-hidden rounded-2xl border border-gray-200 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
        >
          <div class="relative flex aspect-square flex-col justify-between bg-gradient-to-br from-amber-500 via-orange-600 to-rose-700 p-4 sm:aspect-4/3">
            <div>
              <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
                {{ t('style.journey.achievements') }}
              </p>
              <p class="mt-2 text-sm font-medium text-white/90">
                {{ t('style.journey.achievementsTileTitle') }}
              </p>
            </div>
            <div>
              <p class="text-2xl font-semibold tabular-nums tracking-tight text-white sm:text-4xl lg:text-5xl">
                <template v-if="journeyStore.journey">
                  {{ unlockedAchievements }}
                  <span class="text-lg font-medium text-white/50 sm:text-2xl">/{{ totalAchievements }}</span>
                </template>
                <template v-else>—</template>
              </p>
              <p class="mt-1 text-[11px] text-white/75 sm:text-sm">
                {{ t('style.journey.achievementsTileHint') }}
              </p>
            </div>
          </div>
        </RouterLink>

        <!-- Placeholder tile -->
        <div class="relative overflow-hidden rounded-2xl border border-dashed border-gray-300 bg-gray-50">
          <div class="flex aspect-square flex-col items-center justify-center p-4 text-center sm:aspect-4/3">
            <p class="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
              {{ t('style.journey.tileSoonLabel') }}
            </p>
            <p class="mt-2 text-sm font-medium text-gray-500">
              {{ t('style.journey.tileSoonTitle') }}
            </p>
            <p class="mt-1 max-w-[14rem] text-xs leading-relaxed text-gray-400">
              {{ t('style.journey.tileSoonHint') }}
            </p>
          </div>
        </div>
      </section>

      <!-- Modules -->
      <section class="mt-8">
        <h2 class="text-sm font-semibold text-gray-900">{{ t('style.journey.modules') }}</h2>
        <p class="mt-1 text-sm text-gray-500">{{ t('style.journey.modulesHint') }}</p>

        <div
          v-if="journeyStore.modules.length"
          class="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <RouterLink
            v-for="mod in journeyStore.modules"
            :key="mod.id"
            :to="moduleLink(mod)"
            class="group flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-gray-300 hover:shadow-md"
          >
            <div class="flex items-center justify-between gap-3 px-4 pt-4">
              <div class="flex min-w-0 items-center gap-2.5">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                  :class="tileAccent(mod)"
                >
                  {{ primInitial }}
                </div>
                <div class="min-w-0">
                  <p class="truncate text-sm font-semibold text-gray-900">{{ activePrimName }}</p>
                  <p class="text-xs text-gray-500">{{ modeLabel(mod) }}</p>
                </div>
              </div>
              <span
                class="shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium"
                :class="
                  mod.completed
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-gray-100 text-gray-600'
                "
              >
                {{ mod.completed ? t('style.journey.done') : t('style.journey.inProgress') }}
              </span>
            </div>

            <div
              class="mx-4 mt-3 flex aspect-16/10 items-center justify-center rounded-xl"
              :class="tilePreview(mod)"
            >
              <p class="text-3xl font-semibold tracking-tight text-white/95">
                +{{ mod.xp_reward }}
                <span class="text-sm font-medium opacity-90">XP</span>
              </p>
            </div>

            <div class="flex flex-1 flex-col px-4 pb-4 pt-3">
              <h3 class="text-base font-semibold tracking-tight text-gray-900 group-hover:text-gray-950">
                {{ mod.title }}
              </h3>
              <p
                v-if="mod.description"
                class="mt-1 line-clamp-2 text-sm leading-relaxed text-gray-500"
              >
                {{ mod.description }}
              </p>

              <div class="mt-3 flex flex-wrap gap-1.5">
                <span class="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600">
                  {{ modeLabel(mod) }}
                </span>
                <span
                  v-if="mod.gender"
                  class="rounded-full border border-gray-200 bg-white px-2 py-0.5 text-[11px] font-medium text-gray-600"
                >
                  {{ mod.gender }}
                </span>
                <span
                  v-if="!mod.completed && mod.eval?.missing?.length"
                  class="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-800"
                >
                  {{ t('style.journey.missingCount', { count: mod.eval.missing.length }) }}
                </span>
              </div>

              <ul class="mt-4 space-y-2 border-t border-gray-100 pt-3 text-xs text-gray-600">
                <li class="flex items-center gap-2">
                  <span class="flex size-5 items-center justify-center rounded-full bg-indigo-50 text-[10px] font-bold text-indigo-700">XP</span>
                  +{{ mod.xp_reward }} XP
                </li>
                <li
                  v-if="!mod.completed && mod.eval?.missing?.length"
                  class="flex items-center gap-2 text-amber-800"
                >
                  <span class="flex size-5 items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold">!</span>
                  {{ missingLabel(mod.eval.missing[0]) }}
                </li>
                <li
                  v-else-if="mod.completed"
                  class="flex items-center gap-2 text-emerald-700"
                >
                  <span class="flex size-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold">✓</span>
                  {{ t('style.journey.done') }}
                </li>
              </ul>
            </div>
          </RouterLink>
        </div>

        <p
          v-else-if="!journeyStore.loading"
          class="mt-4 text-sm text-gray-500"
        >
          {{ t('style.journey.noModules') }}
        </p>
      </section>
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

const entityId = ref('')
const pageError = ref('')

const prims = computed(() => personasStore.prims)

const activePrimName = computed(() => {
  const p = prims.value.find((x) => String(x.id) === entityId.value)
  return p?.name ?? t('outfit.prim')
})

const primInitial = computed(() => (activePrimName.value || '?').slice(0, 1).toUpperCase())

const unlockedAchievements = computed(
  () => journeyStore.achievements.filter((a) => a.unlocked).length,
)
const totalAchievements = computed(() => journeyStore.achievements.length)

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

function modeLabel(mod) {
  return mod.completion_mode === 'manual'
    ? t('style.journey.modeManual')
    : t('style.journey.modeAuto')
}

function tileAccent(mod) {
  if (mod.completed) return 'bg-emerald-600'
  if (mod.completion_mode === 'manual') return 'bg-violet-600'
  return 'bg-gray-900'
}

function tilePreview(mod) {
  if (mod.completed) return 'bg-gradient-to-br from-emerald-500 to-teal-700'
  if (mod.completion_mode === 'manual') return 'bg-gradient-to-br from-violet-500 to-indigo-700'
  return 'bg-gradient-to-br from-stone-700 to-stone-900'
}

function moduleLink(mod) {
  return {
    name: 'StyleModuleDetail',
    params: { id: String(mod.id) },
    query: { entity_id: entityId.value },
  }
}

async function loadJourney() {
  if (!entityId.value) return
  pageError.value = ''
  try {
    await journeyStore.sync(entityId.value)
  } catch (err) {
    pageError.value = err?.message || t('style.journey.loadError')
  }
}

watch(entityId, (id) => {
  if (id) {
    personasStore.setActivePersona(Number(id))
    void loadJourney()
  }
})

onMounted(async () => {
  await personasStore.fetchPersonas().catch(() => {})
  entityId.value = String(
    route.query.entity_id ||
      personasStore.activePrim?.id ||
      personasStore.activePersonaId ||
      personasStore.prims[0]?.id ||
      '',
  )
})
</script>
