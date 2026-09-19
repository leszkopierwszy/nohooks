<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
    @click.self="emit('close')"
  >
    <div
      class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-xl dark:bg-zinc-900"
      role="dialog"
      aria-modal="true"
    >
      <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4 dark:border-zinc-800">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-zinc-100">
            {{ t('fashionStylist.title') }}
          </h2>
          <p class="mt-0.5 text-sm text-gray-500 dark:text-zinc-400">
            {{ t('fashionStylist.subtitle') }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-md p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-zinc-800"
          @click="emit('close')"
        >
          ✕
        </button>
      </div>

      <div class="space-y-4 px-5 py-4">
        <p
          v-if="error"
          class="rounded-md bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950/40 dark:text-red-300"
        >
          {{ error }}
        </p>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              {{ t('outfit.prim') }}
            </label>
            <select
              v-model="form.entity_id"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700"
            >
              <option
                v-for="prim in prims"
                :key="prim.id"
                :value="String(prim.id)"
              >
                {{ prim.name }}
              </option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              {{ t('outfit.occasion') }}
            </label>
            <select
              v-model="form.occasion"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700"
            >
              <option value="">{{ t('outfit.occasionNone') }}</option>
              <option
                v-for="occ in OUTFIT_OCCASIONS"
                :key="occ.value"
                :value="occ.value"
              >
                {{ t(occ.labelKey) }}
              </option>
            </select>
          </div>
          <div class="sm:col-span-2">
            <label class="block text-sm font-medium text-gray-700 dark:text-zinc-300">
              {{ t('fashionStylist.notes') }}
            </label>
            <input
              v-model="form.notes"
              type="text"
              maxlength="2000"
              :placeholder="t('fashionStylist.notesPlaceholder')"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600 sm:text-sm dark:bg-zinc-950 dark:text-zinc-100 dark:ring-zinc-700"
            />
          </div>
        </div>

        <div class="flex justify-end">
          <button
            type="button"
            :disabled="suggesting || !form.entity_id"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
            @click="runSuggest"
          >
            {{ suggesting ? t('fashionStylist.thinking') : t('fashionStylist.suggest') }}
          </button>
        </div>

        <div
          v-if="analysis"
          class="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-zinc-700 dark:bg-zinc-950/60"
        >
          <h3 class="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {{ t('fashionStylist.analysisTitle') }}
          </h3>
          <p
            v-if="analysis.possible_sets_estimate != null"
            class="text-sm font-medium text-gray-900 dark:text-zinc-100"
          >
            {{ t('fashionStylist.possibleSets', { count: analysis.possible_sets_estimate }) }}
          </p>
          <p
            v-if="analysis.possible_sets_note"
            class="text-sm text-gray-600 dark:text-zinc-400"
          >
            {{ analysis.possible_sets_note }}
          </p>
          <p
            v-if="analysis.wardrobe_overview"
            class="text-sm text-gray-600 dark:text-zinc-400"
          >
            {{ analysis.wardrobe_overview }}
          </p>
        </div>

        <div
          v-if="suggestions.length"
          class="space-y-3 border-t border-gray-100 pt-4 dark:border-zinc-800"
        >
          <h3 class="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {{ t('fashionStylist.results') }}
          </h3>
          <article
            v-for="(s, idx) in suggestions"
            :key="idx"
            class="rounded-xl border border-gray-200 p-4 dark:border-zinc-700"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p class="font-medium text-gray-900 dark:text-zinc-100">
                  {{ s.label || t('fashionStylist.untitled') }}
                </p>
                <p
                  v-if="s.rationale"
                  class="mt-1 text-sm text-gray-500 dark:text-zinc-400"
                >
                  {{ s.rationale }}
                </p>
              </div>
              <button
                type="button"
                :disabled="savingIndex === idx"
                class="shrink-0 rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                @click="saveSuggestion(s, idx)"
              >
                {{ savingIndex === idx ? t('outfit.saving') : t('fashionStylist.save') }}
              </button>
            </div>
            <ul class="mt-3 flex flex-wrap gap-2">
              <li
                v-for="item in itemsFor(s.item_ids)"
                :key="item.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 py-1 pl-1 pr-2.5 text-xs font-medium text-gray-800 dark:bg-zinc-800 dark:text-zinc-200"
              >
                <span class="size-6 overflow-hidden rounded-full bg-white ring-1 ring-gray-200 dark:bg-zinc-900 dark:ring-zinc-600">
                  <img
                    v-if="thumb(item)"
                    :src="thumb(item)"
                    alt=""
                    class="size-full object-contain"
                  />
                </span>
                {{ item.name }}
              </li>
            </ul>
          </article>
        </div>

        <div
          v-if="shopping.length"
          class="space-y-3 border-t border-gray-100 pt-4 dark:border-zinc-800"
        >
          <h3 class="text-sm font-semibold text-gray-900 dark:text-zinc-100">
            {{ t('fashionStylist.shoppingTitle') }}
          </h3>
          <p class="text-sm text-gray-500 dark:text-zinc-400">
            {{ t('fashionStylist.shoppingSubtitle') }}
          </p>
          <p
            v-if="!preferredStoresCount"
            class="text-xs text-gray-500 dark:text-zinc-400"
          >
            {{ t('fashionStylist.shoppingNoStoresHint') }}
          </p>
          <article
            v-for="(buy, idx) in shopping"
            :key="idx"
            class="rounded-xl border border-dashed border-indigo-200 bg-indigo-50/40 p-4 dark:border-indigo-900 dark:bg-indigo-950/30"
          >
            <p class="font-medium text-gray-900 dark:text-zinc-100">
              {{ buy.item_type }}
              <span
                v-if="buy.color"
                class="font-normal text-gray-500 dark:text-zinc-400"
              >· {{ buy.color }}</span>
            </p>
            <p
              v-if="buy.why"
              class="mt-1 text-sm text-gray-600 dark:text-zinc-400"
            >
              {{ buy.why }}
            </p>
            <p
              v-if="buy.stores?.length"
              class="mt-2 text-xs font-medium text-indigo-700 dark:text-indigo-300"
            >
              {{ t('fashionStylist.stores') }}: {{ buy.stores.join(', ') }}
            </p>
            <ul
              v-if="itemsFor(buy.pairs_with_item_ids).length"
              class="mt-3 flex flex-wrap gap-2"
            >
              <li
                v-for="item in itemsFor(buy.pairs_with_item_ids)"
                :key="item.id"
                class="inline-flex items-center gap-1.5 rounded-full bg-white py-1 pl-1 pr-2.5 text-xs font-medium text-gray-800 ring-1 ring-gray-200 dark:bg-zinc-900 dark:text-zinc-200 dark:ring-zinc-700"
              >
                <span class="size-6 overflow-hidden rounded-full bg-gray-50 ring-1 ring-gray-200 dark:bg-zinc-800 dark:ring-zinc-600">
                  <img
                    v-if="thumb(item)"
                    :src="thumb(item)"
                    alt=""
                    class="size-full object-contain"
                  />
                </span>
                {{ item.name }}
              </li>
            </ul>
          </article>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { resolveStorageUrl } from '../../api/media'
import { useI18n } from '../../composables/useI18n'
import { OUTFIT_OCCASIONS } from '../../constants/outfitOccasions'
import { useCollectionStore } from '../../stores/collection'
import { useFashionStylistStore } from '../../stores/fashionStylist'
import { useOutfitsStore } from '../../stores/outfits'
import { usePersonasStore } from '../../stores/personas'
import { useUserStore } from '../../stores/user'
import { toDateKey } from '../../utils/calendarGrid'

const props = defineProps({
  open: { type: Boolean, default: false },
  entityId: { type: [String, Number], default: '' },
  occasion: { type: String, default: '' },
})

const emit = defineEmits(['close', 'saved'])

const { t } = useI18n()
const fashionStore = useFashionStylistStore()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()
const collectionStore = useCollectionStore()
const userStore = useUserStore()

const form = reactive({
  entity_id: '',
  occasion: '',
  notes: '',
})
const savingIndex = ref(null)
const localError = ref('')

const prims = computed(() => personasStore.prims)
const suggesting = computed(() => fashionStore.suggesting)
const analysis = computed(() => fashionStore.analysis)
const suggestions = computed(() => fashionStore.suggestions)
const shopping = computed(() => fashionStore.shopping)
const preferredStoresCount = computed(() => (userStore.user?.fashionStores || []).length)
const error = computed(() => localError.value || fashionStore.error)

const itemsById = computed(() => {
  const map = new Map()
  for (const item of collectionStore.allItemsList ?? []) {
    map.set(Number(item.id), item)
  }
  return map
})

function itemsFor(ids) {
  return (ids ?? [])
    .map((id) => itemsById.value.get(Number(id)))
    .filter(Boolean)
}

function thumb(item) {
  const raw =
    item?.cover ??
    item?.image_url ??
    item?.images?.[0]?.url ??
    null
  return resolveStorageUrl(raw) ?? raw
}

function syncForm() {
  form.entity_id = props.entityId
    ? String(props.entityId)
    : prims.value[0]
      ? String(prims.value[0].id)
      : ''
  form.occasion = props.occasion || ''
  form.notes = ''
  localError.value = ''
  fashionStore.clearSuggestions()
}

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    syncForm()
    if (!collectionStore.allItemsList.length) {
      collectionStore.fetchAllItems().catch(() => {})
    }
  },
)

async function runSuggest() {
  localError.value = ''
  try {
    await fashionStore.suggest({
      entity_id: form.entity_id,
      occasion: form.occasion,
      notes: form.notes,
    })
  } catch {
    /* store sets error */
  }
}

async function saveSuggestion(suggestion, idx) {
  savingIndex.value = idx
  localError.value = ''
  try {
    await outfitsStore.createOutfit({
      entity_id: Number(form.entity_id),
      wear_date: toDateKey(new Date()),
      label: suggestion.label?.trim() || null,
      occasion: suggestion.occasion || form.occasion || null,
      notes: suggestion.notes || suggestion.rationale || null,
      item_ids: (suggestion.item_ids ?? []).map(Number),
      source: 'llm',
    })
    emit('saved')
    emit('close')
  } catch (err) {
    localError.value = err.message ?? String(err)
  } finally {
    savingIndex.value = null
  }
}
</script>
