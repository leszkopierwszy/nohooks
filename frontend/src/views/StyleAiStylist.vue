<template>
  <div class="mx-auto max-w-5xl px-4 pb-10 sm:px-6 lg:px-8">
    <header class="pb-6">
      <h1 class="text-2xl font-semibold tracking-tight text-gray-900 dark:text-zinc-50">
        {{ t('fashionStylist.title') }}
      </h1>
      <p class="mt-1 text-sm text-gray-500 dark:text-zinc-400">
        {{ t('fashionStylist.pageSubtitle') }}
      </p>
    </header>

    <!-- Mode selector -->
    <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <button
        v-for="mode in modes"
        :key="mode.id"
        type="button"
        class="rounded-2xl border p-4 text-left transition"
        :class="
          activeMode === mode.id
            ? 'border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
        "
        @click="activeMode = mode.id"
      >
        <p class="text-sm font-semibold text-gray-900">{{ mode.title }}</p>
        <p class="mt-1 text-xs text-gray-500">{{ mode.hint }}</p>
      </button>
    </div>

    <!-- Shared persona -->
    <div class="mt-6 grid gap-3 sm:grid-cols-2">
      <div>
        <label class="block text-sm font-medium text-gray-700">{{ t('outfit.prim') }}</label>
        <select
          v-model="entityId"
          class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
        >
          <option v-for="prim in prims" :key="prim.id" :value="String(prim.id)">
            {{ prim.name }}
          </option>
        </select>
      </div>
    </div>

    <p v-if="pageError" class="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">{{ pageError }}</p>
    <p v-if="pageHint" class="mt-4 rounded-md bg-emerald-50 p-3 text-sm text-emerald-800">{{ pageHint }}</p>

    <!-- BUILD OUTFIT -->
    <section v-if="activeMode === 'outfit'" class="mt-8 space-y-6">
      <div class="flex gap-2">
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="outfitSubmode === 'manual' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
          @click="outfitSubmode = 'manual'"
        >
          {{ t('fashionStylist.manual') }}
        </button>
        <button
          type="button"
          class="rounded-lg px-3 py-1.5 text-sm font-medium"
          :class="outfitSubmode === 'ai' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700'"
          @click="outfitSubmode = 'ai'"
        >
          {{ t('fashionStylist.aiMode') }}
        </button>
      </div>

      <template v-if="outfitSubmode === 'manual'">
        <div class="grid gap-3 sm:grid-cols-2">
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ t('outfit.name') }}</label>
            <input
              v-model="manualForm.label"
              type="text"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700">{{ t('outfit.occasion') }}</label>
            <select
              v-model="manualForm.occasion"
              class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
            >
              <option value="">{{ t('outfit.occasionNone') }}</option>
              <option v-for="occ in OUTFIT_OCCASIONS" :key="occ.value" :value="occ.value">
                {{ t(occ.labelKey) }}
              </option>
            </select>
          </div>
        </div>

        <OutfitItemPicker v-model="manualForm.item_ids" :entity-id="entityId" />

        <div class="flex flex-wrap items-center gap-3">
          <p class="text-sm" :class="manualComplete ? 'text-emerald-700' : 'text-amber-700'">
            {{
              manualComplete
                ? t('fashionStylist.outfitComplete')
                : t('fashionStylist.outfitIncomplete')
            }}
          </p>
          <button
            type="button"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            :disabled="saving || !manualForm.item_ids.length || !entityId"
            @click="saveManualLook"
          >
            {{ saving ? t('outfit.saving') : t('fashionStylist.saveLook') }}
          </button>
        </div>
      </template>

      <template v-else>
        <p
          v-if="!stylistConfigured"
          class="rounded-md bg-amber-50 p-4 text-sm text-amber-800"
        >
          {{ t('fashionStylist.notConfigured') }}
        </p>
        <template v-else>
          <div class="grid gap-3 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ t('outfit.occasion') }}</label>
              <select
                v-model="aiForm.occasion"
                class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
              >
                <option value="">{{ t('outfit.occasionNone') }}</option>
                <option v-for="occ in OUTFIT_OCCASIONS" :key="occ.value" :value="occ.value">
                  {{ t(occ.labelKey) }}
                </option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700">{{ t('fashionStylist.notes') }}</label>
              <input
                v-model="aiForm.notes"
                type="text"
                :placeholder="t('fashionStylist.notesPlaceholder')"
                class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
              />
            </div>
          </div>

          <div>
            <p class="text-sm font-medium text-gray-700">{{ t('fashionStylist.anchorItem') }}</p>
            <p class="mt-0.5 text-xs text-gray-500">{{ t('fashionStylist.anchorItemHint') }}</p>
            <OutfitItemPicker
              v-model="aiForm.anchor_ids"
              class="mt-3"
              :entity-id="entityId"
              single-select
              :show-selected-strip="true"
              compact
            />
          </div>

          <button
            type="button"
            class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
            :disabled="suggesting || !entityId"
            @click="runAiSuggest"
          >
            {{ suggesting ? t('fashionStylist.thinking') : t('fashionStylist.createOutfit') }}
          </button>

          <div v-if="suggestions.length" class="space-y-4">
            <h3 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.results') }}</h3>
            <article
              v-for="(s, idx) in suggestions"
              :key="idx"
              class="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div class="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p class="font-semibold text-gray-900">{{ s.label || t('fashionStylist.untitled') }}</p>
                  <p v-if="s.rationale" class="mt-1 text-sm text-gray-600">{{ s.rationale }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <button
                    type="button"
                    class="text-sm font-medium text-indigo-600 hover:text-indigo-500"
                    :disabled="saving"
                    @click="saveAiLook(s)"
                  >
                    {{ t('fashionStylist.saveLook') }}
                  </button>
                  <button
                    type="button"
                    class="text-sm font-medium text-gray-600 hover:text-gray-900"
                    @click="editSuggestionManually(s)"
                  >
                    {{ t('fashionStylist.editManually') }}
                  </button>
                </div>
              </div>
              <OutfitFlatLay
                v-if="itemsForSuggestion(s).length"
                class="mt-3"
                :items="itemsForSuggestion(s)"
              />
            </article>
            <button
              type="button"
              class="text-sm font-medium text-indigo-600"
              :disabled="suggesting"
              @click="runAiSuggest"
            >
              {{ t('fashionStylist.regenerate') }}
            </button>
          </div>
        </template>
      </template>
    </section>

    <!-- BASE WARDROBE -->
    <section v-else-if="activeMode === 'base'" class="mt-8 space-y-6">
      <div class="flex flex-wrap items-end gap-3">
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('outfit.occasion') }}</label>
          <select
            v-model="baseForm.occasion"
            class="mt-1 block rounded-md border-0 py-2 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          >
            <option value="">{{ t('outfit.occasionNone') }}</option>
            <option v-for="occ in OUTFIT_OCCASIONS" :key="occ.value" :value="occ.value">
              {{ t(occ.labelKey) }}
            </option>
          </select>
        </div>
        <button
          type="button"
          class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
          :disabled="analyzingBase || !entityId"
          @click="runBaseAnalysis"
        >
          {{ analyzingBase ? t('fashionStylist.analyzing') : t('fashionStylist.analyzeWardrobe') }}
        </button>
      </div>

      <div
        v-if="baseWardrobe"
        class="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
      >
        <h3 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.yourWardrobe') }}</h3>
        <p class="mt-2 text-2xl font-semibold text-gray-900">
          {{ t('fashionStylist.itemCount', { count: baseWardrobe.item_count }) }}
        </p>
        <p class="mt-1 text-lg text-gray-700">
          {{ t('fashionStylist.completeOutfits', { count: baseWardrobe.outfit_count }) }}
          <span v-if="baseWardrobe.truncated" class="text-sm font-normal text-gray-500">
            ({{ t('fashionStylist.truncatedNote') }})
          </span>
        </p>

        <div
          v-if="baseWardrobe.by_occasion && Object.keys(baseWardrobe.by_occasion).length"
          class="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4"
        >
          <div
            v-for="(count, key) in baseWardrobe.by_occasion"
            :key="key"
            class="rounded-lg bg-gray-50 px-3 py-2"
          >
            <p class="text-xs text-gray-500">{{ occasionLabel(key) }}</p>
            <p class="text-sm font-semibold text-gray-900">
              {{ t('fashionStylist.completeOutfits', { count }) }}
            </p>
          </div>
        </div>
      </div>

      <div v-if="baseWardrobe?.outfits?.length" class="space-y-3">
        <h3 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.browseOutfits') }}</h3>
        <article
          v-for="(combo, idx) in baseWardrobe.outfits.slice(0, showAllBase ? undefined : 8)"
          :key="idx"
          class="rounded-xl border border-gray-200 bg-white p-3"
        >
          <OutfitFlatLay :items="itemsByIds(combo.item_ids)" />
          <button
            type="button"
            class="mt-2 text-sm font-medium text-indigo-600"
            @click="loadComboAsManual(combo.item_ids)"
          >
            {{ t('fashionStylist.editManually') }}
          </button>
        </article>
        <button
          v-if="!showAllBase && baseWardrobe.outfits.length > 8"
          type="button"
          class="text-sm font-medium text-indigo-600"
          @click="showAllBase = true"
        >
          {{ t('fashionStylist.showAllOutfits') }}
        </button>
        <button
          type="button"
          class="ml-4 text-sm font-medium text-gray-600"
          @click="activeMode = 'outfit'; outfitSubmode = 'manual'"
        >
          {{ t('fashionStylist.createAnother') }}
        </button>
      </div>
    </section>

    <!-- BUILD CAPSULE -->
    <section v-else class="mt-8 space-y-6">
      <div>
        <h3 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.capsulePresets') }}</h3>
        <div class="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            v-for="preset in CAPSULE_PRESETS"
            :key="preset"
            type="button"
            class="rounded-xl border px-3 py-3 text-left text-sm font-medium transition"
            :class="
              capsuleForm.preset === preset
                ? 'border-indigo-500 bg-indigo-50 text-indigo-800'
                : 'border-gray-200 bg-white text-gray-800 hover:bg-gray-50'
            "
            @click="selectPreset(preset)"
          >
            {{ t(`fashionStylist.presets.${preset}`) }}
          </button>
        </div>
      </div>

      <div v-if="capsuleForm.preset === 'custom'" class="grid gap-3 sm:grid-cols-2">
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('fashionStylist.capsuleName') }}</label>
          <input
            v-model="capsuleForm.name"
            type="text"
            class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('fashionStylist.targetOutfits') }}</label>
          <input
            v-model.number="capsuleForm.target_outfit_count"
            type="number"
            min="1"
            max="60"
            class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('fashionStylist.season') }}</label>
          <input
            v-model="capsuleForm.season"
            type="text"
            class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">{{ t('fashionStylist.style') }}</label>
          <input
            v-model="capsuleForm.style"
            type="text"
            class="mt-1 block w-full rounded-md border-0 py-2.5 pl-3 text-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      <button
        type="button"
        class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
        :disabled="analyzingCapsule || !entityId"
        @click="runCapsuleAnalyze"
      >
        {{ analyzingCapsule ? t('fashionStylist.analyzing') : t('fashionStylist.analyzeCapsule') }}
      </button>

      <div v-if="capsuleAnalysis" class="space-y-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div class="flex flex-wrap items-baseline justify-between gap-2">
          <h3 class="text-lg font-semibold text-gray-900">
            {{ capsuleTitle }}
          </h3>
          <span
            class="rounded-full px-2.5 py-0.5 text-xs font-semibold"
            :class="
              capsuleAnalysis.status === 'complete'
                ? 'bg-emerald-50 text-emerald-800'
                : 'bg-amber-50 text-amber-800'
            "
          >
            {{
              capsuleAnalysis.status === 'complete'
                ? t('fashionStylist.capsuleComplete')
                : t('fashionStylist.capsuleAlmost')
            }}
          </span>
        </div>

        <p class="text-sm text-gray-700">
          {{
            t('fashionStylist.roleCoverage', {
              covered: capsuleAnalysis.role_coverage?.covered ?? 0,
              required: capsuleAnalysis.role_coverage?.required ?? 0,
            })
          }}
        </p>
        <p class="text-sm text-gray-700">
          {{ t('fashionStylist.currentPotential', { count: capsuleAnalysis.outfit_count }) }}
        </p>

        <div v-if="capsuleAnalysis.items_by_slot" class="flex flex-wrap gap-2">
          <span
            v-for="(count, slot) in capsuleAnalysis.items_by_slot"
            :key="slot"
            class="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
          >
            {{ count }} {{ slot }}
          </span>
        </div>

        <OutfitFlatLay
          v-if="capsuleItems.length"
          :items="capsuleItems"
        />

        <div v-if="capsuleAnalysis.missing_roles?.length" class="space-y-3 border-t border-gray-100 pt-4">
          <h4 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.missingRoles') }}</h4>
          <article
            v-for="gap in capsuleAnalysis.missing_roles"
            :key="gap.role"
            class="rounded-xl border border-dashed border-amber-200 bg-amber-50/50 p-3"
          >
            <p class="font-medium text-gray-900">{{ gap.label }}</p>
            <p class="mt-1 text-sm text-gray-600">{{ gap.reason }}</p>
            <p class="mt-2 text-sm font-semibold text-amber-900">
              {{ t('fashionStylist.unlockOutfits', { count: gap.unlocks_outfits_estimate }) }}
            </p>
          </article>
        </div>

        <div v-if="capsuleAnalysis.outfits?.length" class="space-y-2 border-t border-gray-100 pt-4">
          <h4 class="text-sm font-semibold text-gray-900">{{ t('fashionStylist.exampleOutfits') }}</h4>
          <article
            v-for="(combo, idx) in capsuleAnalysis.outfits.slice(0, 4)"
            :key="idx"
            class="rounded-lg border border-gray-100 p-2"
          >
            <OutfitFlatLay :items="itemsByIds(combo.item_ids)" />
          </article>
        </div>

        <button
          type="button"
          class="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
          :disabled="saving"
          @click="saveCapsuleFromAnalysis"
        >
          {{ t('fashionStylist.saveCapsule') }}
        </button>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import OutfitFlatLay from '../components/outfit/OutfitFlatLay.vue'
import OutfitItemPicker from '../components/outfit/OutfitItemPicker.vue'
import { useI18n } from '../composables/useI18n'
import { OUTFIT_OCCASIONS, outfitOccasionMeta } from '../constants/outfitOccasions'
import { useCapsulesStore, CAPSULE_PRESETS } from '../stores/capsules'
import { useCollectionStore } from '../stores/collection'
import { useFashionStylistStore } from '../stores/fashionStylist'
import { useOutfitsStore } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'

const { t } = useI18n()
const route = useRoute()
const personasStore = usePersonasStore()
const collectionStore = useCollectionStore()
const outfitsStore = useOutfitsStore()
const fashionStore = useFashionStylistStore()
const capsulesStore = useCapsulesStore()

const activeMode = ref('outfit')
const outfitSubmode = ref('manual')
const entityId = ref('')
const saving = ref(false)
const pageError = ref('')
const pageHint = ref('')
const showAllBase = ref(false)

const manualForm = reactive({
  label: '',
  occasion: '',
  item_ids: [],
})

const aiForm = reactive({
  occasion: '',
  notes: '',
  anchor_ids: [],
})

const baseForm = reactive({
  occasion: '',
})

const capsuleForm = reactive({
  preset: 'work',
  name: '',
  season: '',
  style: '',
  target_outfit_count: 7,
  item_limit: 12,
  occasion: 'work',
})

const modes = computed(() => [
  {
    id: 'outfit',
    title: t('fashionStylist.modeOutfit'),
    hint: t('fashionStylist.modeOutfitHint'),
  },
  {
    id: 'base',
    title: t('fashionStylist.modeBase'),
    hint: t('fashionStylist.modeBaseHint'),
  },
  {
    id: 'capsule',
    title: t('fashionStylist.modeCapsule'),
    hint: t('fashionStylist.modeCapsuleHint'),
  },
])

const prims = computed(() => personasStore.prims)
const stylistConfigured = computed(() => fashionStore.configured)
const suggesting = computed(() => fashionStore.suggesting)
const suggestions = computed(() => fashionStore.suggestions)
const analyzingBase = computed(() => fashionStore.analyzingBase)
const baseWardrobe = computed(() => fashionStore.baseWardrobe)
const analyzingCapsule = computed(() => capsulesStore.analyzing)
const capsuleAnalysis = computed(() => capsulesStore.analysis)

const itemsById = computed(() => {
  const map = new Map()
  for (const item of collectionStore.allItemsList ?? []) {
    map.set(Number(item.id), item)
  }
  return map
})

function itemsByIds(ids) {
  return (ids ?? []).map((id) => itemsById.value.get(Number(id))).filter(Boolean)
}

function itemsForSuggestion(s) {
  const ids =
    s.item_ids?.length
      ? s.item_ids
      : [
          ...(s.primary_item_ids ?? []),
          ...(s.supporting_item_ids ?? []),
          ...(s.accessory_item_ids ?? []),
        ]
  return itemsByIds(ids)
}

/** Client-side slot completeness mirror (top+bottom+footwear or one_piece+footwear). */
const manualComplete = computed(() => {
  const items = itemsByIds(manualForm.item_ids)
  if (!items.length) return false
  const slots = new Set()
  for (const item of items) {
    const cat = String(item.category || item.name || '').toLowerCase()
    if (/dress|jumpsuit|suit/.test(cat)) slots.add('one_piece')
    else if (/shoe|sneaker|boot|heel|loafer|sandal/.test(cat)) slots.add('footwear')
    else if (/skirt|pant|jean|short|trouser/.test(cat)) slots.add('bottom')
    else if (/shirt|blouse|top|tee|polo|sweater|hoodie/.test(cat)) slots.add('top')
  }
  if (slots.has('one_piece') && slots.has('footwear')) return true
  return slots.has('top') && slots.has('bottom') && slots.has('footwear')
})

const capsuleItems = computed(() => itemsByIds(capsuleAnalysis.value?.item_ids ?? []))

const capsuleTitle = computed(() => {
  if (capsuleForm.preset === 'custom' && capsuleForm.name.trim()) return capsuleForm.name.trim()
  return t(`fashionStylist.presets.${capsuleForm.preset}`)
})

function occasionLabel(key) {
  return t(outfitOccasionMeta(key)?.labelKey ?? 'outfit.occasion')
}

function selectPreset(preset) {
  capsuleForm.preset = preset
  if (preset !== 'custom') {
    capsuleForm.occasion = ['work', 'travel', 'evening', 'smart_casual'].includes(preset)
      ? preset === 'smart_casual'
        ? 'casual'
        : preset === 'evening'
          ? 'formal'
          : preset
      : ''
  }
  capsulesStore.clearAnalysis()
}

async function saveManualLook() {
  pageError.value = ''
  pageHint.value = ''
  saving.value = true
  try {
    await outfitsStore.createOutfit({
      entity_id: Number(entityId.value),
      wear_date: null,
      label: manualForm.label.trim() || null,
      occasion: manualForm.occasion || null,
      notes: null,
      item_ids: manualForm.item_ids.map(Number),
      source: 'manual',
    })
    pageHint.value = t('fashionStylist.lookSaved')
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  } finally {
    saving.value = false
  }
}

async function runAiSuggest() {
  pageError.value = ''
  try {
    await fashionStore.suggest({
      entity_id: entityId.value,
      occasion: aiForm.occasion,
      notes: aiForm.notes,
      anchor_item_id: aiForm.anchor_ids[0] || null,
    })
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  }
}

async function saveAiLook(suggestion) {
  pageError.value = ''
  pageHint.value = ''
  saving.value = true
  try {
    const ids = itemsForSuggestion(suggestion).map((i) => Number(i.id))
    if (!ids.length) {
      pageError.value = t('fashionStylist.saveNoItems')
      return
    }
    await outfitsStore.createOutfit({
      entity_id: Number(entityId.value),
      wear_date: null,
      label: suggestion.label?.trim() || null,
      occasion: suggestion.occasion || aiForm.occasion || null,
      notes: suggestion.rationale || suggestion.notes || null,
      item_ids: ids,
      source: 'llm',
    })
    pageHint.value = t('fashionStylist.lookSaved')
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  } finally {
    saving.value = false
  }
}

function editSuggestionManually(suggestion) {
  manualForm.item_ids = itemsForSuggestion(suggestion).map((i) => Number(i.id))
  manualForm.label = suggestion.label || ''
  manualForm.occasion = suggestion.occasion || aiForm.occasion || ''
  outfitSubmode.value = 'manual'
  activeMode.value = 'outfit'
}

function loadComboAsManual(ids) {
  manualForm.item_ids = (ids ?? []).map(Number)
  outfitSubmode.value = 'manual'
  activeMode.value = 'outfit'
}

async function runBaseAnalysis() {
  pageError.value = ''
  showAllBase.value = false
  try {
    await fashionStore.fetchBaseWardrobe({
      entity_id: entityId.value,
      occasion: baseForm.occasion || null,
    })
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  }
}

async function runCapsuleAnalyze() {
  pageError.value = ''
  try {
    await capsulesStore.analyze({
      entity_id: Number(entityId.value),
      preset: capsuleForm.preset,
      name: capsuleForm.name || null,
      occasion: capsuleForm.occasion || null,
      season: capsuleForm.season || null,
      style: capsuleForm.style || null,
      target_outfit_count: capsuleForm.target_outfit_count || null,
      item_limit: capsuleForm.item_limit || null,
    })
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  }
}

async function saveCapsuleFromAnalysis() {
  if (!capsuleAnalysis.value) return
  pageError.value = ''
  pageHint.value = ''
  saving.value = true
  try {
    await capsulesStore.saveCapsule({
      entity_id: Number(entityId.value),
      name: capsuleTitle.value,
      preset: capsuleForm.preset,
      occasion: capsuleForm.occasion || null,
      season: capsuleForm.season || null,
      style: capsuleForm.style || null,
      target_outfit_count: capsuleForm.target_outfit_count || null,
      item_limit: capsuleForm.item_limit || null,
      item_ids: capsuleAnalysis.value.item_ids,
    })
    pageHint.value = t('fashionStylist.capsuleSaved')
  } catch (err) {
    pageError.value = err?.message || t('fashionStylist.saveError')
  } finally {
    saving.value = false
  }
}

watch(
  () => personasStore.prims,
  (list) => {
    if (!entityId.value && list?.[0]) {
      entityId.value = String(personasStore.activePrim?.id ?? list[0].id)
    }
  },
  { immediate: true }
)

onMounted(async () => {
  await Promise.all([
    personasStore.fetchPersonas().catch(() => {}),
    collectionStore.fetchCollections().catch(() => {}),
    collectionStore.fetchAllItems().catch(() => {}),
    fashionStore.fetchStatus().catch(() => {}),
  ])
  if (!entityId.value) {
    entityId.value = String(
      personasStore.activePrim?.id ?? personasStore.prims[0]?.id ?? ''
    )
  }

  const q = route.query
  if (q.entity_id) {
    entityId.value = String(q.entity_id)
  }
  if (q.mode === 'outfit' || q.mode === 'base' || q.mode === 'capsule') {
    activeMode.value = String(q.mode)
  }
  if (q.mode === 'outfit' || q.items) {
    outfitSubmode.value = 'manual'
  }
  if (q.items) {
    const ids = String(q.items)
      .split(',')
      .map((v) => Number(v.trim()))
      .filter(Number.isFinite)
    if (ids.length) {
      manualForm.item_ids = ids
    }
  }
})
</script>
