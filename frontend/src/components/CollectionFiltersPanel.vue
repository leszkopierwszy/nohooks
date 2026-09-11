<template>
  <form class="space-y-2" @submit.prevent>
    <div
      v-if="hasActiveFilters"
      class="mb-4 flex items-center justify-between gap-2"
    >
      <p class="text-xs text-gray-500">
        Aktywne filtry: {{ activeCount }}
      </p>
      <button
        type="button"
        class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
        @click="$emit('clear-all')"
      >
        Wyczyść
      </button>
    </div>

    <p v-if="!sections.length" class="text-sm text-gray-500">
      Brak danych do filtrowania w tej kolekcji.
    </p>

    <Disclosure
      v-for="section in sections"
      :key="section.id"
      as="div"
      class="border-b border-gray-200 py-4"
      :default-open="true"
      v-slot="{ open }"
    >
      <h3 class="-my-3 flow-root">
        <DisclosureButton
          class="flex w-full items-center justify-between bg-white py-3 text-sm text-gray-400 hover:text-gray-500"
        >
          <span class="font-medium text-gray-900">{{ section.name }}</span>
          <span class="ml-6 flex items-center gap-2">
            <span
              v-if="sectionCheckedCount(section)"
              class="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700"
            >
              {{ sectionCheckedCount(section) }}
            </span>
            <PlusIcon v-if="!open" class="size-5" aria-hidden="true" />
            <MinusIcon v-else class="size-5" aria-hidden="true" />
          </span>
        </DisclosureButton>
      </h3>
      <DisclosurePanel class="pt-4">
        <div class="max-h-48 space-y-3 overflow-y-auto pr-1">
          <div
            v-for="(option, optionIdx) in section.options"
            :key="option.value"
            class="flex gap-3"
          >
            <div class="flex h-5 shrink-0 items-center">
              <div class="group grid size-4 grid-cols-1">
                <input
                  :id="`${idPrefix}-filter-${section.id}-${optionIdx}`"
                  type="checkbox"
                  :checked="option.checked"
                  class="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  @change="$emit('toggle', section.id, option.value)"
                />
                <svg
                  class="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white"
                  viewBox="0 0 14 14"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    class="opacity-0 group-has-[:checked]:opacity-100"
                    d="M3 8L6 11L11 3.5"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </div>
            </div>
            <label
              :for="`${idPrefix}-filter-${section.id}-${optionIdx}`"
              class="cursor-pointer text-sm text-gray-600"
            >
              {{ option.label }}
            </label>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  </form>
</template>

<script setup>
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/vue'
import { MinusIcon, PlusIcon } from '@heroicons/vue/20/solid'

defineProps({
  sections: {
    type: Array,
    default: () => [],
  },
  activeCount: {
    type: Number,
    default: 0,
  },
  hasActiveFilters: {
    type: Boolean,
    default: false,
  },
  idPrefix: {
    type: String,
    default: 'collection',
  },
})

defineEmits(['toggle', 'clear-all'])

function sectionCheckedCount(section) {
  return section.options?.filter((o) => o.checked).length ?? 0
}
</script>
