<template>
  <div>
    <div class="flex justify-end">
      <button
        type="button"
        class="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
        @click="openCreate"
      >
        {{ t('growth.addGoal') }}
      </button>
    </div>

    <GrowthGoalRemindersBanner
      :due-today="dueToday"
      :notification-permission="notificationPermission"
      :reminder-message="reminderMessage"
      @dismiss="dismiss"
      @edit="openEdit"
      @enable-notifications="requestNotificationPermission"
    />

    <section class="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.active') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-gray-900">{{ stats.active }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.monitored') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-gray-900">{{ stats.monitored }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.overdue') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-red-700">{{ stats.overdue }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.completed') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-gray-700">{{ stats.completed }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.books') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-gray-800">{{ stats.byType.book }}</p>
      </div>
      <div class="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <p class="text-xs font-medium uppercase tracking-wide text-gray-500">
          {{ t('growth.stats.avgMood') }}
        </p>
        <p class="mt-1 text-2xl font-bold tabular-nums text-gray-800">
          {{ stats.avgMood != null ? stats.avgMood : '—' }}
        </p>
      </div>
    </section>

    <div class="mt-8 flex flex-wrap gap-2 border-b border-stone-200 pb-3">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        :class="[
          'rounded-full px-3 py-1.5 text-sm font-medium transition',
          activeTab === tab.id
            ? 'bg-gray-900 text-white'
            : 'bg-stone-100 text-gray-700 hover:bg-stone-200',
        ]"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span v-if="tab.count != null" class="ml-1 tabular-nums opacity-80">({{ tab.count }})</span>
      </button>
    </div>

    <div v-if="activeTab !== 'completed'" class="mt-4 flex flex-wrap gap-2">
      <button
        v-for="filter in typeFilters"
        :key="filter.value"
        type="button"
        :class="[
          'rounded-lg px-3 py-1 text-xs font-medium ring-1 ring-inset transition',
          typeFilter === filter.value
            ? 'bg-white text-gray-900 ring-stone-400'
            : 'bg-stone-50 text-gray-600 ring-stone-200 hover:bg-stone-100',
        ]"
        @click="typeFilter = filter.value"
      >
        {{ filter.label }}
      </button>
    </div>

    <div
      v-if="displayedGoals.length"
      class="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
    >
      <GrowthGoalCard
        v-for="goal in displayedGoals"
        :key="goal.id"
        :goal="goal"
        :completed="activeTab === 'completed'"
        :work-minutes="workByGoalId[goal.id] ?? 0"
        @complete="openComplete"
        @edit="openEdit"
        @delete="confirmDelete"
        @reopen="reopen"
        @log-work="logWorkInCalendar"
      />
    </div>
    <p v-else class="mt-10 rounded-xl border border-dashed border-stone-200 py-16 text-center text-sm text-gray-500">
      {{ emptyMessage }}
    </p>

    <p v-if="saveError" class="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
      {{ saveError }}
    </p>

    <GrowthGoalFormModal
      :open="formOpen"
      :goal="activeGoal"
      :is-new="creatingNew"
      :saving="savingGoal"
      @close="closeForm"
      @save="onSaveForm"
    />
    <GrowthCompleteModal
      :open="completeOpen"
      :goal="activeGoal"
      @close="closeComplete"
      @save="onSaveComplete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import GrowthCompleteModal from '../../components/growth/GrowthCompleteModal.vue'
import GrowthGoalCard from '../../components/growth/GrowthGoalCard.vue'
import GrowthGoalFormModal from '../../components/growth/GrowthGoalFormModal.vue'
import GrowthGoalRemindersBanner from '../../components/growth/GrowthGoalRemindersBanner.vue'
import { useGrowthGoalReminders } from '../../composables/useGrowthGoalReminders'
import { useGrowthGoalWorkEvents } from '../../composables/useGrowthGoalWorkEvents'
import { toDateKey } from '../../utils/calendarGrid'
import { GROWTH_GOAL_TYPES } from '../../constants/growthGoals'
import { useI18n } from '../../composables/useI18n'
import { useGrowthGoalsStore } from '../../stores/growthGoals'

const { t } = useI18n()
const router = useRouter()
const store = useGrowthGoalsStore()
const { workByGoalId, load: loadGoalWork } = useGrowthGoalWorkEvents()

const {
  dueToday,
  notificationPermission,
  requestNotificationPermission,
  dismiss,
  reminderMessage,
} = useGrowthGoalReminders()

const activeTab = ref('active')
const typeFilter = ref('all')
const formOpen = ref(false)
const completeOpen = ref(false)
const creatingNew = ref(false)
const activeGoal = ref(null)
const savingGoal = ref(false)
const saveError = ref(null)

onMounted(async () => {
  store.reload()
  await store.syncMissingCalendarEvents().catch(() => {})
  await loadGoalWork().catch(() => {})
})

const stats = computed(() => store.stats)

const tabs = computed(() => [
  { id: 'active', label: t('growth.tabs.active'), count: store.activeGoals.length },
  { id: 'completed', label: t('growth.tabs.completed'), count: store.completedGoals.length },
])

const typeFilters = computed(() => [
  { value: 'all', label: t('growth.filters.all') },
  ...GROWTH_GOAL_TYPES.map((opt) => ({ value: opt.value, label: t(opt.labelKey) })),
])

const sourceList = computed(() =>
  activeTab.value === 'completed' ? store.completedGoals : store.activeGoals,
)

const displayedGoals = computed(() => {
  if (typeFilter.value === 'all') return sourceList.value
  return sourceList.value.filter((g) => g.type === typeFilter.value)
})

const emptyMessage = computed(() => {
  if (activeTab.value === 'completed') return t('growth.empty.completed')
  if (typeFilter.value !== 'all') return t('growth.empty.filtered')
  return t('growth.empty.active')
})

function openCreate() {
  activeGoal.value = null
  creatingNew.value = true
  formOpen.value = true
}

function openEdit(goal) {
  activeGoal.value = goal
  creatingNew.value = false
  formOpen.value = true
}

function openComplete(goal) {
  activeGoal.value = goal
  completeOpen.value = true
}

function closeForm() {
  formOpen.value = false
  creatingNew.value = false
  activeGoal.value = null
}

function closeComplete() {
  completeOpen.value = false
  activeGoal.value = null
}

async function onSaveForm(payload) {
  savingGoal.value = true
  saveError.value = null
  try {
    if (creatingNew.value) await store.createGoal(payload)
    else if (activeGoal.value) await store.updateGoal(activeGoal.value.id, payload)
    closeForm()
  } catch (err) {
    saveError.value = err?.message ?? t('growth.form.calendarSyncError')
  } finally {
    savingGoal.value = false
  }
}

async function onSaveComplete(payload) {
  if (!activeGoal.value) return
  savingGoal.value = true
  saveError.value = null
  try {
    await store.completeGoal(activeGoal.value.id, payload)
    activeTab.value = 'completed'
    closeComplete()
  } catch (err) {
    saveError.value = err?.message ?? t('growth.form.calendarSyncError')
  } finally {
    savingGoal.value = false
  }
}

async function reopen(goal) {
  try {
    await store.reopenGoal(goal.id)
    activeTab.value = 'active'
  } catch (err) {
    saveError.value = err?.message ?? t('growth.form.calendarSyncError')
  }
}

async function confirmDelete(goal) {
  if (!window.confirm(t('growth.deleteConfirm', { title: goal.title }))) return
  try {
    await store.deleteGoal(goal.id)
  } catch (err) {
    saveError.value = err?.message ?? t('growth.form.calendarSyncError')
  }
}

function logWorkInCalendar(goal) {
  router.push({
    path: '/calendar',
    query: { goalId: goal.id, date: toDateKey(new Date()) },
  })
}
</script>
