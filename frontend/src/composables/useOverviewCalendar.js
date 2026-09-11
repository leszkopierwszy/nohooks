import { computed, ref, watch } from 'vue'
import { useTimelineStore } from '../stores/timeline'
import {
  addDaysToDateKey,
  buildMonthDays,
  monthLabel,
  monthRangeKeys,
  parseDateKey,
  toDateKey,
} from '../utils/calendarGrid'
import { calendarDateKey, displayDateKey, eventOccursOnDate } from '../utils/timelineRecurrence'

export function useOverviewCalendar() {
  const timelineStore = useTimelineStore()

  const viewYear = ref(new Date().getFullYear())
  const viewMonth = ref(new Date().getMonth())
  const selectedDate = ref(toDateKey(new Date()))

  const calendarDays = computed(() => buildMonthDays(viewYear.value, viewMonth.value))
  const calendarTitle = computed(() => monthLabel(viewYear.value, viewMonth.value))

  const eventsByDate = computed(() => {
    const map = {}
    for (const event of timelineStore.events) {
      const key = calendarDateKey(event, viewYear.value, viewMonth.value)
      if (!key) continue
      if (!map[key]) map[key] = []
      map[key].push(event)
    }
    return map
  })

  function eventSortKey(event) {
    const date = displayDateKey(event)
    const time = event.all_day ? '00:00:00' : (event.start_time ?? '23:59:59')
    return `${date}T${time}`
  }

  function eventsOnDay(dateKey) {
    const raw = eventsByDate.value[dateKey] ?? timelineStore.events.filter((e) =>
      eventOccursOnDate(e, dateKey),
    )
    return [...raw].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
  }

  const selectedDayEvents = computed(() => eventsOnDay(selectedDate.value))

  function selectDay(day) {
    selectedDate.value = day.date
    if (!day.isCurrentMonth) {
      const parsed = parseDateKey(day.date)
      viewYear.value = parsed.getFullYear()
      viewMonth.value = parsed.getMonth()
    }
  }

  function prevMonth() {
    if (viewMonth.value === 0) {
      viewMonth.value = 11
      viewYear.value -= 1
    } else {
      viewMonth.value -= 1
    }
  }

  function nextMonth() {
    if (viewMonth.value === 11) {
      viewMonth.value = 0
      viewYear.value += 1
    } else {
      viewMonth.value += 1
    }
  }

  async function loadEvents() {
    const today = toDateKey(new Date())
    const horizon = addDaysToDateKey(today, 90)
    const { from, to } = monthRangeKeys(viewYear.value, viewMonth.value)
    const fetchFrom = from < today ? from : today
    const fetchTo = to > horizon ? to : horizon
    await timelineStore.fetchEvents({ from: fetchFrom, to: fetchTo })
  }

  watch([viewYear, viewMonth], () => {
    loadEvents().catch(() => {})
  })

  return {
    timelineStore,
    viewYear,
    viewMonth,
    selectedDate,
    calendarDays,
    calendarTitle,
    selectedDayEvents,
    eventsOnDay,
    selectDay,
    prevMonth,
    nextMonth,
    loadEvents,
  }
}
