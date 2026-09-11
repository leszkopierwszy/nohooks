<template>
  <section class="mt-6">
    <div class="flex flex-wrap items-baseline justify-between gap-2">
      <div>
        <h2 class="text-sm font-semibold text-gray-900">Kategorie wydatków</h2>
        <p class="text-xs text-gray-500">
          Kliknij kafelek, aby filtrować tabelę · suma miesięczna (aktywne)
        </p>
      </div>
      <button
        v-if="selectedCategory"
        type="button"
        class="text-xs font-medium text-gray-600 underline-offset-2 hover:text-gray-900 hover:underline"
        @click="clearFilter"
      >
        Wyczyść filtr
      </button>
    </div>

    <div
      class="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"
    >
      <button
        v-for="cat in categories"
        :key="cat.name"
        type="button"
        :class="[
          'group rounded-xl bg-white p-4 text-left ring-1 ring-inset transition-all duration-200',
          accentFor(cat.name).ring,
          selectedCategory === cat.name
            ? [accentFor(cat.name).selectedBg, accentFor(cat.name).selectedRing, 'ring-2 shadow-sm']
            : 'hover:bg-gray-50/90 hover:ring-gray-300/80',
        ]"
        :aria-pressed="selectedCategory === cat.name"
        @click="toggleCategory(cat.name)"
      >
        <div class="flex gap-3">
          <span
            :class="[
              'flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors',
              accentFor(cat.name).iconBg,
              selectedCategory === cat.name ? 'ring-1 ring-black/5' : '',
            ]"
          >
            <component
              :is="iconFor(cat.name)"
              :class="[
                'size-5',
                accentFor(cat.name).iconText,
                selectedCategory === cat.name ? 'opacity-100' : 'opacity-85 group-hover:opacity-100',
              ]"
              aria-hidden="true"
            />
          </span>

          <div class="min-w-0 flex-1">
            <h3
              :class="['truncate text-sm font-medium', accentFor(cat.name).title]"
              :title="cat.name"
            >
              {{ cat.name }}
            </h3>
            <p
              :class="[
                'mt-2 text-lg font-semibold tracking-tight tabular-nums',
                accentFor(cat.name).title,
              ]"
            >
              {{ formatPln(cat.monthlyTotal) }}
            </p>
            <p :class="['mt-0.5 text-[11px] uppercase tracking-wide', accentFor(cat.name).muted]">
              miesięcznie
            </p>
            <p :class="['mt-2 text-xs', accentFor(cat.name).muted]">
              {{ cat.count }}
              {{ cat.count === 1 ? 'pozycja' : 'pozycje' }}
              <span v-if="cat.activeCount < cat.count" class="text-gray-400">
                · {{ cat.activeCount }} aktywne
              </span>
            </p>
          </div>
        </div>
      </button>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'
import { categoryIconComponent } from '../constants/plannedExpenseCategoryIcons'
import { formatPln } from '../utils/plannedExpenseProjection'
import {
  categoryTileAccent,
  groupExpensesByCategory,
} from '../utils/plannedExpenseCategories'

const props = defineProps({
  rows: {
    type: Array,
    default: () => [],
  },
  selectedCategory: {
    type: String,
    default: null,
  },
})

const emit = defineEmits(['update:selectedCategory'])

const categories = computed(() => groupExpensesByCategory(props.rows))

function accentFor(name) {
  return categoryTileAccent(name)
}

function iconFor(name) {
  return categoryIconComponent(name)
}

function toggleCategory(name) {
  emit('update:selectedCategory', props.selectedCategory === name ? null : name)
}

function clearFilter() {
  emit('update:selectedCategory', null)
}
</script>
