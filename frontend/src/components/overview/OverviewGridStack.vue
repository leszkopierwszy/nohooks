<template>
  <div
    class="overview-css-grid grid grid-cols-1 lg:grid-cols-12"
    :style="[cssGridVars, cssGridStyle]"
    :aria-label="gridLabel"
  >
    <div
      v-for="item in displayOrder"
      :key="item.id"
      :data-overview-tile="item.id"
      class="overview-tile-cell min-h-0 min-w-0"
      :class="[tileMinClass(item.id), tileCellClass(item.id)]"
      :style="tileStyle(item)"
    >
      <slot :name="item.id" />
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  GRID_CELL_HEIGHT,
  GRID_MARGIN,
  GRID_ITEM_PADDING,
} from '../../constants/overviewGrid'

const props = defineProps({
  layout: { type: Array, required: true },
  gridLabel: { type: String, required: true },
})

const isLg = ref(false)
let mediaQuery
let onMediaChange

const displayOrder = computed(() =>
  [...props.layout].sort((a, b) => a.y - b.y || a.x - b.x),
)

const cssRowCount = computed(() => {
  const items = props.layout.map((item) => item.y + item.h)
  return Math.max(1, ...items)
})

const cssGridVars = computed(() => ({
  '--overview-grid-gap': `${GRID_MARGIN}px`,
  '--overview-tile-padding': `${GRID_ITEM_PADDING}px`,
}))

const cssGridStyle = computed(() => {
  if (!isLg.value) return { gap: `${GRID_MARGIN}px` }
  return {
    gap: `${GRID_MARGIN}px`,
    gridTemplateRows: `repeat(${cssRowCount.value}, minmax(${GRID_CELL_HEIGHT}px, auto))`,
  }
})

const MOBILE_ORDER = { weather: 1, day: 2, savings: 3 }

function tileStyle(item) {
  const { x, y, w, h } = item

  if (!isLg.value) {
    return { order: MOBILE_ORDER[item.id] ?? 0 }
  }

  return {
    gridColumn: `${x + 1} / span ${w}`,
    gridRow: `${y + 1} / span ${h}`,
  }
}

function tileMinClass(id) {
  const map = {
    day: 'lg:min-h-[16rem]',
    weather: 'lg:min-h-[6.5rem]',
  }
  return map[id] ?? ''
}

function tileCellClass(id) {
  if (id === 'savings') return 'overview-tile-cell--savings'
  return ''
}

onMounted(() => {
  mediaQuery = window.matchMedia('(min-width: 1024px)')
  onMediaChange = () => {
    isLg.value = mediaQuery.matches
  }
  onMediaChange()
  mediaQuery.addEventListener('change', onMediaChange)
})

onBeforeUnmount(() => {
  mediaQuery?.removeEventListener('change', onMediaChange)
})
</script>

<style scoped>
.overview-css-grid {
  width: 100%;
}

.overview-tile-cell {
  box-sizing: border-box;
  padding: var(--overview-tile-padding);
  height: 100%;
}

@media (min-width: 1024px) {
  .overview-tile-cell--savings {
    height: auto;
    align-self: start;
  }
}
</style>
