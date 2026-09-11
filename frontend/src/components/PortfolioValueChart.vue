<template>
  <div :class="plain ? '' : 'rounded-lg border border-gray-200 bg-white p-4 shadow-sm'">
    <h3 class="text-sm font-semibold text-gray-900">Wartość portfela w czasie</h3>
    <p class="mt-0.5 text-xs text-gray-500">Punkty z „Zapisz stan portfela” (suma PLN).</p>

    <div v-if="points.length < 2" class="mt-8 flex min-h-[180px] items-center justify-center rounded-md bg-gray-50 text-center text-sm text-gray-500">
      <span v-if="points.length === 0">Brak zapisanych punktów — dodaj aktywa i zapisz pierwszy stan.</span>
      <span v-else>Jeszcze jeden zapisany punkt (inna data), żeby narysować linię na wykresie.</span>
    </div>

    <svg
      v-else
      class="mt-4 h-[220px] w-full text-indigo-600"
      :viewBox="`0 0 ${w} ${h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="ariaLabel"
    >
      <title>{{ ariaLabel }}</title>
      <!-- grid -->
      <g class="text-gray-100" stroke="currentColor" stroke-width="1">
        <line v-for="i in 4" :key="'g' + i" :x1="padL" :x2="w - padR" :y1="gridY(i)" :y2="gridY(i)" />
      </g>
      <polyline
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        :points="linePoints"
      />
      <g v-for="(p, idx) in points" :key="p.date + idx">
        <circle :cx="xAt(idx)" :cy="yAt(p.value)" r="4" fill="white" stroke="currentColor" stroke-width="2" />
      </g>
    </svg>

    <p v-if="points.length >= 2" class="mt-2 text-center text-xs text-gray-500 tabular-nums">
      {{ formatShort(points[0].date) }} → {{ formatShort(points[points.length - 1].date) }}
    </p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  points: {
    type: Array,
    default: () => [],
    /** { date: 'YYYY-MM-DD', value: number }[] */
  },
  plain: { type: Boolean, default: false },
})

const w = 320
const h = 200
const padL = 36
const padR = 12
const padT = 16
const padB = 28

const values = computed(() => props.points.map((p) => p.value))
const minV = computed(() => {
  const m = Math.min(...values.value)
  const M = Math.max(...values.value)
  if (M === m) return Math.max(0, m * 0.95)
  return m - (M - m) * 0.08
})
const maxV = computed(() => {
  const m = Math.min(...values.value)
  const M = Math.max(...values.value)
  if (M === m) return M * 1.05 || 1
  return M + (M - m) * 0.08
})

const n = computed(() => Math.max(1, props.points.length - 1))

function xAt(i) {
  const inner = w - padL - padR
  return padL + (inner * i) / n.value
}

function yAt(v) {
  const inner = h - padT - padB
  const t = (v - minV.value) / (maxV.value - minV.value || 1)
  return padT + inner * (1 - t)
}

const linePoints = computed(() =>
  props.points.map((p, i) => `${xAt(i)},${yAt(p.value)}`).join(' '),
)

function gridY(i) {
  const inner = h - padT - padB
  return padT + (inner * i) / 4
}

const ariaLabel = computed(() => {
  if (props.points.length < 2) return 'Wykres wartości portfela'
  const first = props.points[0]
  const last = props.points[props.points.length - 1]
  return `Wykres od ${first.date} ${first.value} PLN do ${last.date} ${last.value} PLN`
})

function formatShort(dateKey) {
  if (!dateKey) return ''
  const [y, m, d] = dateKey.split('-')
  return `${d}.${m}.${y}`
}
</script>
