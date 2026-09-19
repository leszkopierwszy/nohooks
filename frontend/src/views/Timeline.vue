<template>
  <div class="mx-auto max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
    <TimelinePageHeader
      :model-value="calendarView"
      @update:model-value="setCalendarView"
      @add="openCreate()"
    />

    <p v-if="timelineStore.error" class="mt-6 rounded-md bg-red-50 p-4 text-sm text-red-700">
      {{ timelineStore.error }}
    </p>

    <div class="mt-8 grid grid-cols-1 gap-10 lg:grid-cols-5">
      <section :class="calendarView === 'day' ? 'lg:col-span-5' : 'lg:col-span-3'">
        <TimelineCalendarShell
          :title="calendarTitle"
          :prev-label="calendarNavPrevLabel"
          :next-label="calendarNavNextLabel"
          @prev="calendarNavigatePrev"
          @next="calendarNavigateNext"
        >
          <TimelineMonthGrid
            v-if="calendarView === 'month'"
            :calendar-days="calendarDays"
            :selected-date="selectedDate"
            :search-active="searchActive"
            :events-for-day="eventsOnDay"
            :outfits-for-day="outfitsOnDay"
            @select-day="selectDay"
            @create="openCreate"
          />
          <TimelineWeekGrid
            v-else-if="calendarView === 'week'"
            :week-days="weekDays"
            :selected-date="selectedDate"
            :search-active="searchActive"
            :highlighted-event-id="detailEvent?.id ?? null"
            :events-for-day="eventsOnDay"
            @select-day="selectWeekDay"
            @select-event="showEventDetail"
            @create="openCreate"
          />
          <TimelineDayAgenda
            v-else
            :selected-date="selectedDate"
            :events="selectedDayEvents"
            :outfits="selectedDayOutfits"
            :search-active="searchActive"
            :highlighted-event-id="detailEvent?.id ?? null"
            @select-event="showEventDetail"
            @edit="openEdit"
            @remove="requestRemoveEvent"
            @create="openCreate"
            @create-outfit="openCreateOutfit"
            @edit-outfit="openEditOutfit"
            @remove-outfit="requestRemoveOutfit"
          />
        </TimelineCalendarShell>

        <p v-if="timelineStore.loading" class="mt-4 text-sm text-gray-500">Ładowanie kalendarza…</p>
      </section>

      <aside v-if="calendarView !== 'day'" class="lg:col-span-2">
        <TimelineSelectedDayAside
          :selected-date="selectedDate"
          :events="selectedDayEvents"
          :outfits="selectedDayOutfits"
          :search-active="searchActive"
          :highlighted-event-id="detailEvent?.id ?? null"
          @select-event="showEventDetail"
          @edit="openEdit"
          @remove="requestRemoveEvent"
          @create="openCreate"
          @create-outfit="openCreateOutfit"
          @edit-outfit="openEditOutfit"
          @remove-outfit="requestRemoveOutfit"
        />
      </aside>
    </div>

    <TimelineUpcomingTable
      :events="importantUpcomingEvents"
      :horizon-days="upcomingHorizonDays"
      :search-active="searchActive"
      :loading="timelineStore.loading"
      @row-click="showEventDetail"
      @edit="openEdit"
      @remove="requestRemoveEvent"
    />

    <TimelineEventDetailModal
      :open="detailModalOpen"
      :event="detailEvent"
      @close="closeEventDetail"
      @after-leave="clearDetailEvent"
      @edit="onDetailEdit"
      @delete="onDetailDelete"
    />

    <ConfirmDialog
      :open="deleteModalOpen"
      title="Usunąć wpis?"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      :loading="deleting"
      @close="closeDeleteModal"
      @confirm="confirmDeleteEvent"
    />

    <TimelineEventFormDialog
      :open="formOpen"
      :editing-id="editingId"
      :saving="saving"
      :form-error="formError ?? ''"
      :form="form"
      :form-date-label="formDateLabel"
      :form-yearly-preview="formYearlyPreview"
      :active-goals="activeGrowthGoals"
      @close="closeForm"
      @submit="submitForm"
      @delete="onFormDelete"
      @goal-change="onFormGoalChange"
    />

    <ConfirmDialog
      :open="outfitDeleteModalOpen"
      :title="t('outfit.delete')"
      :message="outfitDeleteMessage"
      confirm-label="Usuń"
      variant="danger"
      :loading="outfitDeleting"
      @close="closeOutfitDeleteModal"
      @confirm="confirmDeleteOutfit"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import { useAppSearchStore } from '../stores/appSearch'
import TimelineEventDetailModal from '../components/TimelineEventDetailModal.vue'
import TimelineCalendarShell from '../components/timeline/TimelineCalendarShell.vue'
import TimelineDayAgenda from '../components/timeline/TimelineDayAgenda.vue'
import TimelineEventFormDialog from '../components/timeline/TimelineEventFormDialog.vue'
import TimelineMonthGrid from '../components/timeline/TimelineMonthGrid.vue'
import TimelinePageHeader from '../components/timeline/TimelinePageHeader.vue'
import TimelineSelectedDayAside from '../components/timeline/TimelineSelectedDayAside.vue'
import TimelineUpcomingTable from '../components/timeline/TimelineUpcomingTable.vue'
import TimelineWeekGrid from '../components/timeline/TimelineWeekGrid.vue'
import { useTimelineStore } from '../stores/timeline'
import { useOutfitsStore } from '../stores/outfits'
import { usePersonasStore } from '../stores/personas'
import { useGrowthGoalsStore } from '../stores/growthGoals'
import { useI18n } from '../composables/useI18n'
import { formatWorkDuration } from '../utils/growthGoalWork'
import { timelineEventTypeMeta } from '../constants/timelineEventTypes'
import {
  addDaysToDateKey,
  buildMonthDays,
  buildWeekDays,
  formatEventDate,
  formatTimeRange,
  monthLabel,
  monthRangeKeys,
  parseDateKey,
  toDateKey,
  weekMondayDateKey,
  weekRangeKeys,
} from '../utils/calendarGrid'
import { eventNotes } from '../utils/timelineEvent'
import { normalizeTimelineEventColor } from '../utils/timelineEventColor'
import { APP_SEARCH_KIND } from '../constants/appSearchKinds'
import { calendarFilterQueryFromSearch } from '../utils/appSearch'
import { eventMatchesTimelineSearch } from '../utils/timelineEventSearch'
import {
  anchorDateKey,
  calendarDateKey,
  displayDateKey,
  eventOccursOnDate,
  isBirthdayEvent,
  isPlannedExpenseEvent,
  isYearlyRecurring,
  yearlyOccurrenceDate,
  yearlyRecurrenceLabel,
  yearsSinceAnchor,
} from '../utils/timelineRecurrence'

const timelineStore = useTimelineStore()
const outfitsStore = useOutfitsStore()
const personasStore = usePersonasStore()
const growthGoalsStore = useGrowthGoalsStore()
const appSearch = useAppSearchStore()
const { t } = useI18n()

const activeGrowthGoals = computed(() => growthGoalsStore.activeGoals)
const prims = computed(() => personasStore.prims)
const route = useRoute()
const router = useRouter()

const upcomingHorizonDays = 90

const calendarView = ref('month')
const viewYear = ref(new Date().getFullYear())
const viewMonth = ref(new Date().getMonth())
const selectedDate = ref(toDateKey(new Date()))
const weekMondayKey = ref(weekMondayDateKey(selectedDate.value))

const detailModalOpen = ref(false)
const detailEvent = ref(null)

const formOpen = ref(false)
const editingId = ref(null)
const saving = ref(false)
const formError = ref(null)

const deleteModalOpen = ref(false)
const deleteTarget = ref(null)
const deleting = ref(false)

const outfitDeleteModalOpen = ref(false)
const outfitDeleteTarget = ref(null)
const outfitDeleting = ref(false)

const deleteMessage = computed(() => {
  const event = deleteTarget.value
  if (!event) return ''
  const typeLabel = timelineEventTypeMeta(event.type).label
  return `Czy na pewno chcesz usunąć „${event.label}” (${typeLabel})? Tej operacji nie można cofnąć.`
})

const outfitDeleteMessage = computed(() => {
  const outfit = outfitDeleteTarget.value
  if (!outfit) return ''
  return t('outfit.deleteConfirm', {
    prim: outfit.entity?.name ?? t('outfit.prim'),
    date: formatEventDate(outfit.wear_date?.slice?.(0, 10) ?? outfit.wear_date),
  })
})

const emptyForm = () => ({
  type: 'event',
  label: '',
  event_date: toDateKey(new Date()),
  recurrence_yearly: false,
  expense_interval: 'monthly',
  expense_category: '',
  is_active: true,
  all_day: false,
  start_time: '09:00',
  end_time: '10:00',
  planned_amount: '',
  currency: 'PLN',
  location: '',
  link: '',
  notes: '',
  color: '',
  growth_goal_id: '',
  work_minutes: 60,
})

const form = reactive(emptyForm())

const calendarDays = computed(() => buildMonthDays(viewYear.value, viewMonth.value))
const weekDays = computed(() => buildWeekDays(weekMondayKey.value))

const calendarTitle = computed(() => {
  if (calendarView.value === 'month') {
    return monthLabel(viewYear.value, viewMonth.value)
  }
  if (calendarView.value === 'week') {
    const { from, to } = weekRangeKeys(weekMondayKey.value)
    return `${formatEventDate(from)} – ${formatEventDate(to)}`
  }
  return formatEventDate(selectedDate.value)
})

const calendarNavPrevLabel = computed(() => {
  if (calendarView.value === 'month') return 'Poprzedni miesiąc'
  if (calendarView.value === 'week') return 'Poprzedni tydzień'
  return 'Poprzedni dzień'
})

const calendarNavNextLabel = computed(() => {
  if (calendarView.value === 'month') return 'Następny miesiąc'
  if (calendarView.value === 'week') return 'Następny tydzień'
  return 'Następny dzień'
})

const calendarSearchFilter = computed(() => calendarFilterQueryFromSearch(appSearch.query))

const searchActive = computed(() => {
  const f = calendarSearchFilter.value
  if (!f.active) return false
  if (f.command && !f.command.kinds?.includes(APP_SEARCH_KIND.CALENDAR_EVENT)) {
    return false
  }
  return true
})

const currentYear = new Date().getFullYear()

const formShowsYearly = computed(
  () => form.type === 'birthday' || form.recurrence_yearly
)

const formDateLabel = computed(() => {
  if (form.type === 'birthday') return 'Data urodzin'
  if (form.type === 'planned_expense') return 'Data pierwszej płatności (kotwica)'
  if (form.type === 'goal_work') return 'Data sesji'
  if (form.recurrence_yearly) return 'Data (powtarza się co roku)'
  return 'Data'
})

const formYearlyPreview = computed(() => {
  if (!formShowsYearly.value || !form.event_date) return null
  const occurrence = yearlyOccurrenceDate(form.event_date, currentYear)
  const stub = { type: form.type, event_date: form.event_date, recurrence: form.recurrence_yearly ? 'yearly' : null }
  const count = yearsSinceAnchor(stub, currentYear)
  let label = null
  if (count >= 0) {
    label =
      form.type === 'birthday'
        ? `${count}. urodziny`
        : count === 0
          ? 'pierwszy rok'
          : `${count}. rocznica`
  }
  return { year: currentYear, occurrence, label }
})

function eventSortKey(event) {
  const date = displayDateKey(event)
  const time = event.all_day ? '00:00:00' : (event.start_time ?? '23:59:59')
  return `${date}T${time}`
}

function matchesSearch(event) {
  const f = calendarSearchFilter.value
  if (f.command?.eventTypes?.length && !f.command.eventTypes.includes(event.type)) {
    return false
  }
  if (f.command && !f.command.kinds?.includes(APP_SEARCH_KIND.CALENDAR_EVENT)) {
    return true
  }
  if (!f.active) return true
  return eventMatchesTimelineSearch(event, f.text)
}

const filteredEvents = computed(() => timelineStore.events.filter(matchesSearch))

const filteredEventsByDate = computed(() => {
  const map = {}
  for (const event of filteredEvents.value) {
    const key = calendarDateKey(event, viewYear.value, viewMonth.value)
    if (!key) continue
    if (!map[key]) map[key] = []
    map[key].push(event)
  }
  return map
})

function eventsOnDay(dateKey) {
  const raw =
    calendarView.value === 'month'
      ? (filteredEventsByDate.value[dateKey] ?? [])
      : filteredEvents.value.filter((e) => eventOccursOnDate(e, dateKey))
  return [...raw].sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
}

const selectedDayEvents = computed(() => {
  if (!selectedDate.value) return []
  return eventsOnDay(selectedDate.value)
})

function outfitsOnDay(dateKey) {
  return outfitsStore.outfitsForDay(dateKey)
}

const selectedDayOutfits = computed(() => {
  if (!selectedDate.value) return []
  return outfitsOnDay(selectedDate.value)
})

const importantUpcomingEvents = computed(() => {
  const today = toDateKey(new Date())
  const horizon = addDaysToDateKey(today, upcomingHorizonDays)

  return filteredEvents.value
    .filter((event) => {
      const key = displayDateKey(event)
      return key >= today && key <= horizon
    })
    .sort((a, b) => eventSortKey(a).localeCompare(eventSortKey(b)))
})

function goToEventDay(event) {
  const key = displayDateKey(event)
  selectedDate.value = key
  const parsed = parseDateKey(key)
  viewYear.value = parsed.getFullYear()
  viewMonth.value = parsed.getMonth()
  if (calendarView.value === 'week') {
    weekMondayKey.value = weekMondayDateKey(key)
  }
}

function resolveEvent(event) {
  if (!event?.id) return event
  return timelineStore.events.find((e) => Number(e.id) === Number(event.id)) ?? event
}

function showEventDetail(event) {
  const resolved = resolveEvent(event)
  goToEventDay(resolved)
  detailEvent.value = resolved
  detailModalOpen.value = true
}

function closeEventDetail() {
  detailModalOpen.value = false
}

function clearDetailEvent() {
  detailEvent.value = null
}

function onDetailEdit(event) {
  const resolved = resolveEvent(event)
  closeEventDetail()
  openEdit(resolved)
}

function onDetailDelete(event) {
  requestRemoveEvent(resolveEvent(event))
}

function onFormDelete() {
  if (!editingId.value) return
  const event = timelineStore.events.find((e) => Number(e.id) === Number(editingId.value))
  if (!event) return
  closeForm()
  requestRemoveEvent(event)
}

function selectDay(day) {
  selectedDate.value = day.date
  if (calendarView.value === 'week') {
    weekMondayKey.value = weekMondayDateKey(day.date)
  }
  if (!day.isCurrentMonth) {
    const parsed = new Date(day.date)
    viewYear.value = parsed.getFullYear()
    viewMonth.value = parsed.getMonth()
  }
}

function selectWeekDay(d) {
  selectedDate.value = d.date
  weekMondayKey.value = weekMondayDateKey(d.date)
}

function setCalendarView(view) {
  if (calendarView.value === view) return
  calendarView.value = view
  if (view === 'week') {
    weekMondayKey.value = weekMondayDateKey(selectedDate.value)
  } else if (view === 'month') {
    const d = parseDateKey(selectedDate.value)
    viewYear.value = d.getFullYear()
    viewMonth.value = d.getMonth()
  }
}

function calendarNavigatePrev() {
  if (calendarView.value === 'month') {
    prevMonth()
  } else if (calendarView.value === 'week') {
    weekMondayKey.value = addDaysToDateKey(weekMondayKey.value, -7)
  } else {
    selectedDate.value = addDaysToDateKey(selectedDate.value, -1)
  }
}

function calendarNavigateNext() {
  if (calendarView.value === 'month') {
    nextMonth()
  } else if (calendarView.value === 'week') {
    weekMondayKey.value = addDaysToDateKey(weekMondayKey.value, 7)
  } else {
    selectedDate.value = addDaysToDateKey(selectedDate.value, 1)
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

function resetForm(dateKey = selectedDate.value ?? toDateKey(new Date())) {
  Object.assign(form, emptyForm())
  form.event_date = dateKey
}

function applyGoalPrefill(goalId) {
  if (!goalId) return
  const goal = growthGoalsStore.goals.find((g) => g.id === goalId && g.status === 'active')
  if (!goal) return
  form.type = 'goal_work'
  form.growth_goal_id = goal.id
  syncGoalWorkLabel(goal.id)
}

function syncGoalWorkLabel(goalId) {
  const goal = growthGoalsStore.goals.find((g) => g.id === goalId)
  if (!goal) return
  if (!form.label.trim()) {
    form.label = goal.title
  }
}

function onFormGoalChange(goalId) {
  syncGoalWorkLabel(goalId)
}

function openCreate(dateKey, options = {}) {
  editingId.value = null
  formError.value = null
  resetForm(dateKey ?? selectedDate.value ?? toDateKey(new Date()))
  if (options.type === 'goal_work') {
    form.type = 'goal_work'
    form.all_day = false
    form.work_minutes = 60
    form.start_time = '09:00'
    form.end_time = '10:00'
  }
  if (options.goalId) {
    applyGoalPrefill(options.goalId)
  }
  formOpen.value = true
}

function openEdit(event) {
  const resolved = resolveEvent(event)
  editingId.value = resolved.id
  formError.value = null
  form.type = resolved.type
  form.label = resolved.label
  form.event_date = resolved.event_date?.slice?.(0, 10) ?? resolved.event_date
  form.recurrence_yearly = isYearlyRecurring(resolved) && !isBirthdayEvent(resolved)
  form.expense_interval = resolved.recurrence || 'monthly'
  form.expense_category = resolved.expense_category ?? ''
  form.is_active = resolved.is_active !== false
  form.all_day = Boolean(resolved.all_day)
  form.start_time = resolved.start_time?.slice?.(0, 5) ?? ''
  form.end_time = resolved.end_time?.slice?.(0, 5) ?? ''
  form.planned_amount =
    resolved.planned_amount != null && resolved.planned_amount !== ''
      ? String(resolved.planned_amount)
      : ''
  form.currency = resolved.currency ?? 'PLN'
  form.location = resolved.location ?? ''
  form.link = resolved.link ?? ''
  form.notes = eventNotes(resolved)
  form.color = normalizeTimelineEventColor(resolved.color) ?? ''
  form.growth_goal_id = resolved.growth_goal_id ?? ''
  form.work_minutes = resolved.work_minutes != null ? Number(resolved.work_minutes) : 60
  formOpen.value = true
}

function closeForm() {
  formOpen.value = false
  editingId.value = null
  formError.value = null
}

function buildPayload() {
  let recurrence = null
  if (form.type === 'birthday' || form.recurrence_yearly) {
    recurrence = 'yearly'
  } else if (form.type === 'planned_expense') {
    recurrence = form.expense_interval || 'monthly'
  }

  const payload = {
    type: form.type,
    label: form.label.trim(),
    event_date: form.event_date,
    recurrence,
    all_day: form.type === 'planned_expense' ? true : form.all_day,
    location: form.location.trim() || null,
    link: form.link.trim() || null,
    notes: form.notes.trim() || null,
    currency: form.currency,
    color: normalizeTimelineEventColor(form.color) ?? null,
  }

  if (form.type === 'planned_expense') {
    payload.expense_category = form.expense_category.trim() || null
    payload.is_active = form.is_active
    payload.start_time = null
    payload.end_time = null
  } else if (!form.all_day) {
    payload.start_time = form.start_time || null
    payload.end_time = form.end_time || null
  } else {
    payload.start_time = null
    payload.end_time = null
  }

  if (form.type === 'planned_expense' && form.planned_amount !== '') {
    payload.planned_amount = Number(form.planned_amount)
  } else {
    payload.planned_amount = null
  }

  if (form.type === 'goal_work') {
    const goal = growthGoalsStore.goals.find((g) => g.id === form.growth_goal_id)
    const sessionLabel = form.label.trim()
    payload.growth_goal_id = form.growth_goal_id || null
    payload.work_minutes = Math.max(1, Math.round(Number(form.work_minutes) || 0))
    payload.label =
      sessionLabel ||
      (goal ? `${goal.title} (${formatWorkDuration(payload.work_minutes)})` : 'Praca nad celem')
    payload.all_day = false
    if (!form.start_time) payload.start_time = null
    if (!form.end_time) payload.end_time = null
  } else {
    payload.growth_goal_id = null
    payload.work_minutes = null
  }

  return payload
}

async function submitForm() {
  if (form.type === 'goal_work') {
    if (!form.growth_goal_id) {
      formError.value = 'Wybierz cel rozwoju.'
      return
    }
    if (!form.work_minutes || form.work_minutes < 1) {
      formError.value = 'Podaj czas pracy (co najmniej 1 minuta).'
      return
    }
  }

  if (!form.all_day && form.start_time && form.end_time && form.end_time < form.start_time) {
    formError.value = 'Godzina zakończenia musi być po godzinie rozpoczęcia.'
    return
  }

  saving.value = true
  formError.value = null
  timelineStore.error = null

  try {
    const payload = buildPayload()
    if (editingId.value) {
      const updated = await timelineStore.updateEvent(editingId.value, payload)
      if (detailModalOpen.value && detailEvent.value?.id === updated.id) {
        detailEvent.value = updated
      }
    } else {
      await timelineStore.createEvent(payload)
    }
    closeForm()
  } catch (err) {
    formError.value = err.message
  } finally {
    saving.value = false
  }
}

function requestRemoveEvent(event) {
  deleteTarget.value = resolveEvent(event)
  deleteModalOpen.value = true
}

function closeDeleteModal() {
  deleteModalOpen.value = false
  deleteTarget.value = null
}

async function confirmDeleteEvent() {
  const event = deleteTarget.value
  if (!event || deleting.value) return
  deleting.value = true
  try {
    await timelineStore.deleteEvent(event.id)
    if (detailEvent.value?.id === event.id) {
      closeEventDetail()
    }
    if (editingId.value != null && Number(editingId.value) === Number(event.id)) {
      closeForm()
    }
    closeDeleteModal()
  } catch {
    // error in store
  } finally {
    deleting.value = false
  }
}

function openCreateOutfit() {
  const query = {}
  if (selectedDate.value) query.date = selectedDate.value
  const activePrim = personasStore.activePrim
  if (activePrim?.id) {
    query.entity_id = String(activePrim.id)
  } else if (prims.value[0]) {
    query.entity_id = String(prims.value[0].id)
  }
  router.push({ name: 'StyleOutfitCreate', query })
}

function openEditOutfit(outfit) {
  router.push({
    name: 'StyleOutfitEdit',
    params: { id: String(outfit.id) },
  })
}

function requestRemoveOutfit(outfit) {
  outfitDeleteTarget.value = outfit
  outfitDeleteModalOpen.value = true
}

function closeOutfitDeleteModal() {
  outfitDeleteModalOpen.value = false
  outfitDeleteTarget.value = null
}

async function confirmDeleteOutfit() {
  const outfit = outfitDeleteTarget.value
  if (!outfit || outfitDeleting.value) return
  outfitDeleting.value = true
  try {
    await outfitsStore.deleteOutfit(outfit.id)
    closeOutfitDeleteModal()
  } catch (err) {
    console.error(err)
  } finally {
    outfitDeleting.value = false
  }
}

async function loadEvents() {
  const today = toDateKey(new Date())
  const horizon = addDaysToDateKey(today, upcomingHorizonDays)
  let from
  let to
  if (calendarView.value === 'month') {
    const r = monthRangeKeys(viewYear.value, viewMonth.value)
    from = r.from
    to = r.to
  } else if (calendarView.value === 'week') {
    from = weekMondayKey.value
    to = addDaysToDateKey(from, 6)
  } else {
    from = selectedDate.value
    to = selectedDate.value
  }
  const fetchFrom = from < today ? from : today
  const fetchTo = to > horizon ? to : horizon
  await Promise.all([
    timelineStore.fetchEvents({ from: fetchFrom, to: fetchTo }),
    outfitsStore.fetchOutfits({ from: fetchFrom, to: fetchTo }),
  ])
}

watch(() => form.type, (type) => {
  if (type === 'birthday') {
    form.recurrence_yearly = false
    form.expense_interval = 'monthly'
    form.all_day = true
    form.start_time = ''
    form.end_time = ''
  } else if (type === 'planned_expense') {
    form.recurrence_yearly = false
    form.expense_interval = form.expense_interval || 'monthly'
    form.all_day = true
    form.is_active = true
    form.start_time = ''
    form.end_time = ''
  } else if (type === 'goal_work') {
    form.recurrence_yearly = false
    form.all_day = false
    if (!form.work_minutes) form.work_minutes = 60
    if (!form.start_time) form.start_time = '09:00'
    if (!form.end_time) form.end_time = '10:00'
    if (form.growth_goal_id) syncGoalWorkLabel(form.growth_goal_id)
  }
})

watch([viewYear, viewMonth, calendarView, weekMondayKey], () => {
  loadEvents().catch(() => {})
})

watch(selectedDate, () => {
  if (calendarView.value === 'day') {
    loadEvents().catch(() => {})
  }
})

function applyDateFromRouteQuery() {
  const raw = route.query.date
  if (!raw) return
  const dateKey = Array.isArray(raw) ? raw[0] : raw
  if (!dateKey || !/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) return

  selectedDate.value = dateKey
  const parsed = parseDateKey(dateKey)
  viewYear.value = parsed.getFullYear()
  viewMonth.value = parsed.getMonth()
  weekMondayKey.value = weekMondayDateKey(dateKey)
}

async function openEventFromRouteQuery() {
  const raw = route.query.eventId
  if (!raw) return
  const id = Array.isArray(raw) ? raw[0] : raw
  if (!id) return

  await loadEvents()
  const event = timelineStore.events.find((e) => String(e.id) === String(id))
  if (!event) return

  showEventDetail(event)
  const nextQuery = { ...route.query }
  delete nextQuery.eventId
  router.replace({ query: nextQuery })
}

function applyGoalFromRouteQuery() {
  const raw = route.query.goalId
  if (!raw) return false
  const goalId = Array.isArray(raw) ? raw[0] : raw
  if (!goalId) return false
  openCreate(selectedDate.value, { type: 'goal_work', goalId })
  const nextQuery = { ...route.query }
  delete nextQuery.goalId
  router.replace({ query: nextQuery })
  return true
}

async function syncRouteQueryToCalendar() {
  applyDateFromRouteQuery()
  if (applyGoalFromRouteQuery()) return
  await openEventFromRouteQuery()
}

watch(
  () => [route.query.eventId, route.query.date, route.query.goalId],
  () => {
    syncRouteQueryToCalendar().catch(() => {})
  },
)

onMounted(() => {
  growthGoalsStore.reload()
  personasStore.fetchPersonas().catch(() => {})
  applyDateFromRouteQuery()
  loadEvents()
    .then(() => {
      if (!applyGoalFromRouteQuery()) {
        return openEventFromRouteQuery()
      }
    })
    .catch(() => {})
})
</script>
