<template>
  <section class="mt-6 border-t border-gray-100 pt-5">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-semibold text-gray-900">{{ t('outfit.sectionDay') }}</h3>
      <button
        v-if="selectedDate"
        type="button"
        class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        @click="$emit('create')"
      >
        + {{ t('outfit.add') }}
      </button>
    </div>

    <ul v-if="outfits.length" class="mt-3 space-y-3">
      <li
        v-for="outfit in outfits"
        :key="outfit.id"
        class="rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
      >
        <div class="flex items-start justify-between gap-2">
          <div class="min-w-0 flex-1">
            <p class="text-sm font-medium text-gray-900">
              {{ outfit.entity?.name ?? t('outfit.prim') }}
              <span v-if="outfit.label" class="font-normal text-gray-500">
                · {{ outfit.label }}
              </span>
            </p>
            <p class="mt-0.5 text-xs text-gray-500">
              {{ t('outfit.itemCount', { count: outfit.items?.length ?? 0 }) }}
            </p>
            <div v-if="outfit.items?.length" class="mt-2 flex flex-wrap gap-1.5">
              <div
                v-for="item in outfit.items.slice(0, 6)"
                :key="item.id"
                class="size-9 overflow-hidden rounded bg-gray-200 ring-1 ring-gray-200"
                :title="item.name"
              >
                <img
                  v-if="itemThumb(item)"
                  :src="itemThumb(item)"
                  :alt="item.name"
                  class="size-full object-cover"
                />
              </div>
              <span
                v-if="outfit.items.length > 6"
                class="flex size-9 items-center justify-center rounded bg-white text-[10px] font-medium text-gray-500 ring-1 ring-gray-200"
              >
                +{{ outfit.items.length - 6 }}
              </span>
            </div>
          </div>
          <div class="flex shrink-0 gap-2">
            <button
              type="button"
              class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
              @click="$emit('edit', outfit)"
            >
              {{ t('outfit.edit') }}
            </button>
            <button
              type="button"
              class="text-xs font-medium text-gray-500 hover:text-gray-800"
              @click="$emit('remove', outfit)"
            >
              {{ t('outfit.delete') }}
            </button>
          </div>
        </div>
      </li>
    </ul>
    <p v-else class="mt-3 text-sm text-gray-500">
      {{ t('outfit.emptyDay') }}
    </p>
  </section>
</template>

<script setup>
import { resolveStorageUrl } from '../../api/media'
import { useI18n } from '../../composables/useI18n'

defineProps({
  selectedDate: { type: String, default: '' },
  outfits: { type: Array, default: () => [] },
})

defineEmits(['create', 'edit', 'remove'])

const { t } = useI18n()

function itemThumb(item) {
  const raw = item?.image_url ?? item?.images?.[0]?.url ?? null
  return resolveStorageUrl(raw) ?? raw
}
</script>
