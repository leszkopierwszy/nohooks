<template>
  <div class="mt-5 border-t border-black/5 pt-5">
    <div class="flex flex-wrap items-end justify-between gap-2">
      <div>
        <h3 class="text-sm font-semibold text-gray-900">Osiąganie celu</h3>
        <p class="mt-0.5 text-xs text-gray-500">
          Postęp w czasie — miesiące na osi X. Uzupełnij historię lub zapisz punkt na dziś.
        </p>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          :aria-expanded="chartVisible"
          @click="toggleChartVisible"
        >
          <ChevronUpIcon v-if="chartVisible" class="size-3.5 text-gray-500" aria-hidden="true" />
          <ChevronDownIcon v-else class="size-3.5 text-gray-500" aria-hidden="true" />
          {{ chartVisible ? 'Ukryj wykres' : 'Pokaż wykres' }}
        </button>
        <button
          v-if="targetId"
          type="button"
          class="inline-flex items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          :aria-expanded="historyVisible"
          @click="toggleHistoryVisible"
        >
          <ChevronUpIcon v-if="historyVisible" class="size-3.5 text-gray-500" aria-hidden="true" />
          <ChevronDownIcon v-else class="size-3.5 text-gray-500" aria-hidden="true" />
          {{ historyVisible ? 'Ukryj historię' : 'Pokaż historię' }}
        </button>
        <button
          v-if="showRecordButton"
          type="button"
          class="rounded-md bg-white px-2.5 py-1.5 text-xs font-semibold shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          :disabled="recording"
          @click="$emit('record')"
        >
          {{ recording ? 'Zapisywanie…' : 'Zapisz punkt (dziś)' }}
        </button>
      </div>
    </div>

    <p
      v-if="!chartVisible && !historyVisible && chartPoints.length"
      class="mt-3 text-xs text-gray-500"
    >
      {{ chartPoints.length }}
      {{
        chartPoints.length === 1
          ? 'punkt'
          : chartPoints.length >= 2 && chartPoints.length <= 4
            ? 'punkty'
            : 'punktów'
      }}
      na wykresie
      · teraz {{ formatCompactPln(currentValue) }}
    </p>

    <div v-show="chartVisible">
    <div
      v-if="!chartPoints.length"
      class="mt-4 flex min-h-[200px] items-center justify-center rounded-lg bg-white/60 text-center text-sm text-gray-500"
    >
      Brak danych do wykresu — dodaj miesiące historyczne lub zapisz pierwszy punkt.
    </div>

    <svg
      v-else
      class="mt-4 h-[260px] w-full min-w-0"
      :viewBox="`0 0 ${w} ${h}`"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      :aria-label="ariaLabel"
    >
      <title>{{ ariaLabel }}</title>

      <g stroke="#e5e7eb" stroke-width="1">
        <line
          v-for="i in 4"
          :key="'g' + i"
          :x1="padL"
          :x2="w - padR"
          :y1="gridY(i)"
          :y2="gridY(i)"
        />
      </g>

      <text
        v-for="(tick, i) in yTicks"
        :key="'y' + i"
        :x="padL - 6"
        :y="tick.y + 3"
        text-anchor="end"
        class="fill-gray-400 text-[9px] tabular-nums"
      >
        {{ tick.label }}
      </text>

      <line
        v-if="goalAmount > 0"
        :x1="padL"
        :x2="w - padR"
        :y1="yAt(goalAmount)"
        :y2="yAt(goalAmount)"
        stroke="#9ca3af"
        stroke-width="1.5"
        stroke-dasharray="5 4"
      />
      <text
        v-if="goalAmount > 0"
        :x="w - padR"
        :y="yAt(goalAmount) - 6"
        text-anchor="end"
        class="fill-gray-400 text-[10px]"
      >
        Cel {{ formatCompactPln(goalAmount) }}
      </text>

      <path v-if="areaPath" :d="areaPath" :fill="fillColor" fill-opacity="0.55" />
      <polyline
        v-if="linePoints"
        fill="none"
        :stroke="strokeColor"
        stroke-width="2.5"
        stroke-linecap="round"
        stroke-linejoin="round"
        :points="linePoints"
      />

      <g v-for="p in chartPoints" :key="p.date">
        <circle
          :cx="xAt(p.date)"
          :cy="yAt(p.value)"
          r="4"
          fill="white"
          :stroke="strokeColor"
          stroke-width="2"
        />
      </g>

      <g v-for="tick in monthTicks" :key="tick.date">
        <line
          :x1="tick.x"
          :x2="tick.x"
          :y1="h - padB"
          :y2="h - padB + 4"
          stroke="#d1d5db"
          stroke-width="1"
        />
        <text
          :x="tick.x"
          :y="h - 8"
          text-anchor="middle"
          class="fill-gray-500 text-[10px]"
        >
          {{ tick.label }}
        </text>
      </g>
    </svg>

    <div
      v-if="chartPoints.length"
      class="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500"
    >
      <span class="tabular-nums">
        {{ monthLabel(chartPoints[0].date) }}
        <template v-if="chartPoints.length > 1">
          → {{ monthLabel(chartPoints[chartPoints.length - 1].date) }}
        </template>
      </span>
      <span class="tabular-nums font-medium text-gray-700">
        Teraz: {{ formatCompactPln(currentValue) }}
        <template v-if="goalAmount > 0">
          / {{ formatCompactPln(goalAmount) }}
        </template>
      </span>
    </div>
    </div>

    <SavingsProgressHistory
      v-if="targetId"
      v-show="historyVisible"
      :target-id="targetId"
      :snapshots="points"
      :saving="savingHistory"
      @save="$emit('save-history', $event)"
    />
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/vue/24/outline'
import SavingsProgressHistory from './SavingsProgressHistory.vue'
import {
  computeTimeDomain,
  formatCompactPln,
  monthLabel,
  monthTicksForDomain,
  normalizeChartPoints,
  xFromDate,
} from '../../utils/savingsProgressChart'

const props = defineProps({
  targetId: { type: String, default: null },
  points: { type: Array, default: () => [] },
  goalAmount: { type: Number, default: 0 },
  currentValue: { type: Number, default: 0 },
  strokeColor: { type: String, default: '#db2777' },
  fillColor: { type: String, default: '#fce7f3' },
  recording: { type: Boolean, default: false },
  savingHistory: { type: Boolean, default: false },
  showRecordButton: { type: Boolean, default: true },
})

defineEmits(['record', 'save-history'])

const chartVisible = ref(false)
const historyVisible = ref(false)

function toggleChartVisible() {
  chartVisible.value = !chartVisible.value
}

function toggleHistoryVisible() {
  historyVisible.value = !historyVisible.value
}

const w = 720
const h = 260
const padL = 48
const padR = 16
const padT = 28
const padB = 36

const chartPoints = computed(() => normalizeChartPoints(props.points))

const xDomain = computed(() => computeTimeDomain(chartPoints.value, { padMonths: 1 }))

const monthTicks = computed(() => {
  if (!xDomain.value) return []
  return monthTicksForDomain(xDomain.value, w, padL, padR).filter(
    (t) => t.x >= padL - 2 && t.x <= w - padR + 2,
  )
})

const yMax = computed(() => {
  const vals = chartPoints.value.map((p) => p.value)
  const goal = Math.max(0, props.goalAmount)
  const dataMax = vals.length ? Math.max(...vals) : 0
  return Math.max(goal, dataMax, 1) * 1.08
})

const yTicks = computed(() => {
  const steps = 4
  const ticks = []
  for (let i = 0; i <= steps; i++) {
    const v = (yMax.value * i) / steps
    ticks.push({
      y: yAt(v),
      label: formatCompactPln(v).replace(' PLN', ''),
    })
  }
  return ticks
})

function xAt(dateKey) {
  return xFromDate(dateKey, xDomain.value, w, padL, padR)
}

function yAt(v) {
  const inner = h - padT - padB
  const t = Math.max(0, Math.min(1, v / yMax.value))
  return padT + inner * (1 - t)
}

const linePoints = computed(() =>
  chartPoints.value.map((p) => `${xAt(p.date)},${yAt(p.value)}`).join(' '),
)

const areaPath = computed(() => {
  const pts = chartPoints.value
  if (pts.length < 2 || !xDomain.value) return ''
  const baseY = h - padB
  let d = `M ${xAt(pts[0].date)} ${baseY} L ${xAt(pts[0].date)} ${yAt(pts[0].value)}`
  for (let i = 1; i < pts.length; i++) {
    d += ` L ${xAt(pts[i].date)} ${yAt(pts[i].value)}`
  }
  d += ` L ${xAt(pts[pts.length - 1].date)} ${baseY} Z`
  return d
})

function gridY(i) {
  const inner = h - padT - padB
  return padT + (inner * i) / 4
}

const ariaLabel = computed(() => {
  const goal = props.goalAmount
  const cur = props.currentValue
  return `Wykres postępu: ${formatCompactPln(cur)} z ${formatCompactPln(goal)}`
})
</script>
