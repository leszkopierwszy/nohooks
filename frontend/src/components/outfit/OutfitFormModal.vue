<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel
        class="max-h-[min(90vh,44rem)] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
      >
        <DialogTitle class="text-lg font-semibold text-gray-900">
          {{ editingId ? t('outfit.formEdit') : t('outfit.formCreate') }}
        </DialogTitle>

        <form class="mt-6 space-y-4" @submit.prevent="$emit('submit')">
          <div>
            <label for="outfit-prim" class="block text-sm font-medium text-gray-700">
              {{ t('outfit.prim') }}
            </label>
            <select
              id="outfit-prim"
              v-model="form.entity_id"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            >
              <option value="" disabled>{{ t('outfit.primPlaceholder') }}</option>
              <option v-for="prim in prims" :key="prim.id" :value="String(prim.id)">
                {{ prim.name }}
              </option>
            </select>
          </div>

          <div>
            <label for="outfit-date" class="block text-sm font-medium text-gray-700">
              {{ t('outfit.wearDate') }}
            </label>
            <input
              id="outfit-date"
              v-model="form.wear_date"
              type="date"
              required
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <label for="outfit-occasion" class="block text-sm font-medium text-gray-700">
              {{ t('outfit.occasion') }}
            </label>
            <select
              id="outfit-occasion"
              v-model="form.occasion"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
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

          <div>
            <label for="outfit-label" class="block text-sm font-medium text-gray-700">
              {{ t('outfit.label') }}
            </label>
            <input
              id="outfit-label"
              v-model="form.label"
              type="text"
              maxlength="255"
              :placeholder="t('outfit.labelPlaceholder')"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <div>
            <div class="flex items-baseline justify-between gap-2">
              <label class="block text-sm font-medium text-gray-700">
                {{ t('outfit.items') }}
              </label>
              <span class="text-xs text-gray-500">
                {{ t('outfit.itemsSelected', { count: form.item_ids.length }) }}
              </span>
            </div>
            <p class="mt-1 text-xs text-gray-500">{{ t('outfit.itemsHint') }}</p>

            <div
              v-if="itemGroups.length"
              class="mt-3 max-h-64 space-y-4 overflow-y-auto rounded-md border border-gray-200 p-3"
            >
              <div v-for="group in itemGroups" :key="group.name">
                <p class="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {{ group.name }}
                </p>
                <ul class="mt-2 space-y-1.5">
                  <li v-for="item in group.items" :key="item.id">
                    <label
                      class="flex cursor-pointer items-center gap-3 rounded-md px-2 py-1.5 hover:bg-gray-50"
                    >
                      <input
                        v-model="form.item_ids"
                        type="checkbox"
                        :value="item.id"
                        class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                      />
                      <span
                        class="size-8 shrink-0 overflow-hidden rounded bg-gray-100 ring-1 ring-gray-200"
                      >
                        <img
                          v-if="item.cover || item.image_url"
                          :src="item.cover || item.image_url"
                          :alt="item.name"
                          class="size-full object-cover"
                        />
                      </span>
                      <span class="min-w-0 flex-1 truncate text-sm text-gray-900">
                        {{ item.name }}
                      </span>
                    </label>
                  </li>
                </ul>
              </div>
            </div>
            <p v-else class="mt-3 text-sm text-gray-500">{{ t('outfit.itemsEmpty') }}</p>
          </div>

          <div>
            <label for="outfit-notes" class="block text-sm font-medium text-gray-700">
              {{ t('outfit.notes') }}
            </label>
            <textarea
              id="outfit-notes"
              v-model="form.notes"
              rows="3"
              maxlength="5000"
              :placeholder="t('outfit.notesPlaceholder')"
              class="mt-1 block w-full rounded-md border-0 py-2 pl-3 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm"
            />
          </div>

          <p v-if="formError" class="text-sm text-red-600">{{ formError }}</p>

          <div class="flex justify-end gap-3 pt-2">
            <button
              type="button"
              class="rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              @click="$emit('close')"
            >
              {{ t('outfit.cancel') }}
            </button>
            <button
              type="submit"
              :disabled="saving || !form.entity_id || !form.wear_date"
              class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {{ saving ? t('outfit.saving') : t('outfit.save') }}
            </button>
          </div>
        </form>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { useI18n } from '../../composables/useI18n'
import { itemFitsPersona } from '../../constants/itemPersonaFit'
import { OUTFIT_OCCASIONS } from '../../constants/outfitOccasions'

const props = defineProps({
  open: { type: Boolean, required: true },
  editingId: { type: [Number, String], default: null },
  saving: { type: Boolean, default: false },
  formError: { type: String, default: '' },
  form: { type: Object, required: true },
  prims: { type: Array, default: () => [] },
  items: { type: Array, default: () => [] },
})

defineEmits(['close', 'submit'])

const { t } = useI18n()

const fittingItems = computed(() => {
  const entityId = props.form.entity_id
  if (!entityId) return props.items
  return props.items.filter((item) => itemFitsPersona(item, entityId))
})

const itemGroups = computed(() => {
  const map = new Map()
  for (const item of fittingItems.value) {
    const name =
      item.collection_group?.name ??
      item.collection_group ??
      item.category ??
      '—'
    if (!map.has(name)) map.set(name, [])
    map.get(name).push(item)
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([name, items]) => ({ name, items }))
})
</script>
