<template>
  <div class="relative">
    <div class="flex gap-2">
      <input
        :id="inputId"
        ref="textInput"
        :value="displayText"
        type="text"
        inputmode="numeric"
        autocomplete="off"
        maxlength="10"
        :placeholder="placeholder"
        :aria-describedby="describedBy"
        :aria-invalid="touched && !isValid ? 'true' : undefined"
        :class="inputClass"
        @input="onTextInput"
        @blur="onBlur"
        @keydown.enter.prevent="commitText"
      />
      <button
        type="button"
        class="mt-1 inline-flex shrink-0 items-center justify-center rounded-md border-0 bg-white px-2.5 text-gray-500 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 hover:text-gray-700"
        :aria-expanded="calendarOpen ? 'true' : 'false'"
        :aria-label="calendarLabel"
        @click="toggleCalendar"
      >
        <CalendarDaysIcon class="size-4" aria-hidden="true" />
      </button>
    </div>

    <div
      v-if="calendarOpen"
      class="absolute left-0 right-0 z-20 mt-1 rounded-lg bg-white p-2 shadow-lg ring-1 ring-gray-200"
      role="dialog"
      :aria-label="calendarLabel"
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <button
          type="button"
          class="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          :aria-label="prevMonthLabel"
          @click="shiftMonth(-1)"
        >
          <ChevronLeftIcon class="size-4" aria-hidden="true" />
        </button>
        <p class="text-[11px] font-semibold text-gray-900">{{ monthTitle }}</p>
        <button
          type="button"
          class="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
          :aria-label="nextMonthLabel"
          @click="shiftMonth(1)"
        >
          <ChevronRightIcon class="size-4" aria-hidden="true" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-0.5 text-center">
        <span
          v-for="label in weekdays"
          :key="label"
          class="py-0.5 text-[9px] font-medium uppercase tracking-wide text-gray-400"
        >
          {{ label }}
        </span>
        <button
          v-for="day in monthDays"
          :key="day.date"
          type="button"
          :disabled="!day.isCurrentMonth"
          :class="[
            'rounded-md py-1 text-[10px] tabular-nums transition',
            !day.isCurrentMonth
              ? 'cursor-default text-transparent'
              : day.date === modelValue
                ? 'bg-indigo-600 font-semibold text-white'
                : day.isToday
                  ? 'bg-indigo-50 font-medium text-indigo-800 hover:bg-indigo-100'
                  : 'text-gray-700 hover:bg-gray-100',
          ]"
          @click="pickDay(day)"
        >
          {{ day.isCurrentMonth ? day.day : '' }}
        </button>
      </div>

      <div class="mt-2 flex justify-between gap-2 border-t border-gray-100 pt-2">
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
          @click="pickToday"
        >
          {{ todayLabel }}
        </button>
        <button
          type="button"
          class="rounded-md px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50"
          @click="calendarOpen = false"
        >
          {{ closeLabel }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CalendarDaysIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/vue/24/outline'
import {
  buildMonthDays,
  monthLabel,
  parseDateKey,
  weekdayLabels,
} from '../utils/calendarGrid'
import {
  formatIsoToDmY,
  maskDmYInput,
  parseDmYToIso,
  toIsoDateKey,
} from '../utils/dateDmY'

const props = defineProps({
  modelValue: { type: String, default: '' },
  inputId: { type: String, default: 'date-dmy' },
  describedBy: { type: String, default: undefined },
  placeholder: { type: String, default: 'dd-mm-yyyy' },
  calendarLabel: { type: String, default: 'Calendar' },
  prevMonthLabel: { type: String, default: 'Previous month' },
  nextMonthLabel: { type: String, default: 'Next month' },
  todayLabel: { type: String, default: 'Today' },
  closeLabel: { type: String, default: 'Close' },
  inputClass: {
    type: String,
    default:
      'mt-1 block w-full rounded-md border-0 py-1.5 pl-3 text-xs tabular-nums text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600',
  },
})

const emit = defineEmits(['update:modelValue', 'validity'])

const displayText = ref('')
const touched = ref(false)
const calendarOpen = ref(false)
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const textInput = ref(null)

const weekdays = weekdayLabels()
const monthDays = computed(() => buildMonthDays(viewYear.value, viewMonth.value))
const monthTitle = computed(() => monthLabel(viewYear.value, viewMonth.value))
const isValid = computed(() => {
  if (!displayText.value.trim()) return false
  return Boolean(parseDmYToIso(displayText.value))
})

watch(
  () => props.modelValue,
  (iso) => {
    const next = iso ? formatIsoToDmY(iso) : ''
    if (next !== displayText.value && !(touched.value && displayText.value && !parseDmYToIso(displayText.value))) {
      displayText.value = next
    }
    if (iso) {
      const d = parseDateKey(iso)
      viewYear.value = d.getFullYear()
      viewMonth.value = d.getMonth()
    }
  },
  { immediate: true },
)

watch(isValid, (ok) => emit('validity', ok), { immediate: true })

function onTextInput(event) {
  touched.value = true
  displayText.value = maskDmYInput(event.target.value)
  const iso = parseDmYToIso(displayText.value)
  if (iso) {
    emit('update:modelValue', iso)
    const d = parseDateKey(iso)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  } else if (!displayText.value.trim()) {
    emit('update:modelValue', '')
  }
}

function commitText() {
  touched.value = true
  const iso = parseDmYToIso(displayText.value)
  if (iso) {
    displayText.value = formatIsoToDmY(iso)
    emit('update:modelValue', iso)
  }
}

function onBlur() {
  commitText()
}

function toggleCalendar() {
  calendarOpen.value = !calendarOpen.value
  if (!calendarOpen.value) return
  const base = props.modelValue ? parseDateKey(props.modelValue) : new Date()
  viewYear.value = base.getFullYear()
  viewMonth.value = base.getMonth()
}

function shiftMonth(delta) {
  const d = new Date(viewYear.value, viewMonth.value + delta, 1)
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function pickDay(day) {
  if (!day.isCurrentMonth) return
  displayText.value = formatIsoToDmY(day.date)
  emit('update:modelValue', day.date)
  touched.value = true
  calendarOpen.value = false
}

function pickToday() {
  const today = toIsoDateKey(new Date())
  pickDay({ date: today, isCurrentMonth: true })
  const d = new Date()
  viewYear.value = d.getFullYear()
  viewMonth.value = d.getMonth()
}

function onDocPointerDown(event) {
  if (!calendarOpen.value) return
  const host = textInput.value?.closest?.('.relative')
  if (host && !host.contains(event.target)) {
    calendarOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', onDocPointerDown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onDocPointerDown)
})

defineExpose({
  focus: () => textInput.value?.focus?.(),
  isValid: () => isValid.value,
})
</script>
