<template>
  <div>
    <FinanceCloseLink />
    <div
      class="mb-6 flex flex-col gap-4 border-b border-gray-200 pb-6 sm:flex-row sm:items-end sm:justify-between"
    >
      <div>
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">Savings</h1>
        <p class="mt-2 text-sm text-gray-700">
          Kliknij target, aby wybrać aktywa wliczane do postępu. Target główny decyduje o kafelku Savings (current).
        </p>
      </div>
      <div class="text-right">
        <p class="text-sm font-medium text-gray-500">Savings (current)</p>
        <p class="text-3xl/10 font-medium tracking-tight tabular-nums text-gray-900">
          {{ savingsStore.currentSavingsFormatted }}
        </p>
        <p class="mt-1 text-xs text-gray-500">{{ savingsStore.includedAssetsSummary }}</p>
      </div>
    </div>

    <p v-if="savingsStore.error" class="mb-4 text-sm text-red-600">{{ savingsStore.error }}</p>
    <p v-if="savingsStore.loading" class="mb-4 text-sm text-gray-500">Ładowanie targetów…</p>

    <section
      v-if="primaryTarget"
      :class="['rounded-lg border p-4 sm:p-5', primaryTheme.border, primaryTheme.bg]"
    >
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-start gap-3">
          <span
            class="mt-1 size-3 shrink-0 rounded-full ring-2 ring-white"
            :class="primaryTheme.dot"
            aria-hidden="true"
          />
          <div>
            <p :class="['text-xs font-semibold uppercase tracking-wide', primaryTheme.label]">Target główny</p>
            <p :class="['mt-1 text-lg font-semibold', primaryTheme.title]">{{ primaryTarget.name }}</p>
            <p :class="['mt-0.5 text-sm', primaryTheme.muted]">
              Cel:
              <span class="font-medium tabular-nums">{{ primaryTargetAmountFormatted }}</span>
              <span v-if="primaryTarget.type === 'm2m'" :class="primaryTheme.accent"> (auto M2M)</span>
            </p>
          </div>
        </div>
        <div class="text-left sm:text-right">
          <p :class="['text-3xl font-bold tabular-nums', primaryTheme.percent]">{{ primaryPercent }}%</p>
          <p :class="['text-xs', primaryTheme.label]">postępu względem celu</p>
        </div>
      </div>
      <div :class="['mt-4 h-2 overflow-hidden rounded-full', primaryTheme.track]">
        <div
          :class="['h-full rounded-full transition-all', primaryTheme.bar]"
          :style="{ width: `${progressBarWidth}%` }"
        />
      </div>

      <SavingsTargetAchievementChart
        v-if="primaryTarget"
        :target-id="primaryTarget.id"
        :points="savingsStore.primaryProgressPoints"
        :goal-amount="primaryTargetAmount"
        :current-value="primaryCurrentValue"
        :stroke-color="primaryTheme.chartStroke"
        :fill-color="primaryTheme.chartFill"
        :recording="savingsStore.recordingProgress"
        :saving-history="savingsStore.savingProgressHistory"
        @record="recordPrimaryProgress"
        @save-history="savePrimaryHistory"
      />
    </section>

    <div class="mt-8 sm:flex sm:items-center sm:justify-between">
      <div class="sm:flex-auto">
        <h2 class="text-base font-semibold text-gray-900">Targety</h2>
        <p class="mt-2 text-sm text-gray-700">
          Kliknij nazwę targetu, aby wybrać aktywa. „Główny” = kafelek Savings (current) na Finance.
        </p>
      </div>
      <div class="mt-4 flex shrink-0 gap-2 sm:mt-0">
        <button
          v-if="!hasM2mTarget"
          type="button"
          class="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-700 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          @click="savingsStore.addM2mTargetIfMissing()"
        >
          Dodaj target M2M
        </button>
        <button
          type="button"
          class="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
          @click="openCreate"
        >
          Dodaj target
        </button>
      </div>
    </div>

    <div class="mt-6 flow-root">
      <div class="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div class="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
          <div class="overflow-hidden shadow-sm outline-1 outline-black/5 sm:rounded-lg">
            <table class="relative min-w-full divide-y divide-gray-300">
              <thead class="bg-gray-50">
                <tr>
                  <th scope="col" class="py-3.5 pr-3 pl-4 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                    Główny
                  </th>
                  <th scope="col" class="w-10 px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                    <span class="sr-only">Kolor</span>
                  </th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nazwa</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Typ</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Kwota celu</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Aktywa</th>
                  <th scope="col" class="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Postęp</th>
                  <th scope="col" class="py-3.5 pr-4 pl-3 sm:pr-6">
                    <span class="sr-only">Akcje</span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr
                  v-for="target in savingsStore.targets"
                  :key="target.id"
                  class="cursor-pointer hover:bg-gray-50"
                  @click="openAssets(target.id)"
                >
                  <td class="py-4 pr-3 pl-4 sm:pl-6" @click.stop>
                    <input
                      type="radio"
                      name="primary-target"
                      :class="['border-gray-300 focus:ring-2 focus:ring-offset-0', themeFor(target).ring, themeFor(target).accent]"
                      :checked="target.id === savingsStore.primaryTargetId"
                      :aria-label="`Target główny: ${target.name}`"
                      @change="onSetPrimary(target.id)"
                    />
                  </td>
                  <td class="px-3 py-4">
                    <span
                      class="inline-block size-4 rounded-full ring-1 ring-black/10"
                      :class="themeFor(target).dot"
                      :title="targetColorLabel(target.color)"
                    />
                  </td>
                  <td class="px-3 py-4 text-sm font-medium text-gray-900">
                    <button
                      type="button"
                      class="inline-flex items-center gap-2 text-left hover:text-indigo-600"
                      @click.stop="openAssets(target.id)"
                    >
                      <span class="size-2 shrink-0 rounded-full" :class="themeFor(target).dot" />
                      {{ target.name }}
                    </button>
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                    <FlatBadge
                      :color="badgeColorFor(target)"
                      :label="target.type === 'm2m' ? 'Auto M2M' : 'Stała kwota'"
                    />
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm tabular-nums text-gray-900" @click.stop>
                    {{ formatRowAmount(target) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm text-gray-600" @click.stop>
                    {{ savingsStore.targetAssetsSummary(target.id) }}
                  </td>
                  <td class="whitespace-nowrap px-3 py-4 text-sm tabular-nums text-gray-700">
                    {{ rowPercent(target) }}%
                  </td>
                  <td class="whitespace-nowrap py-4 pr-4 pl-3 text-right text-sm sm:pr-6" @click.stop>
                    <button
                      type="button"
                      class="text-indigo-600 hover:text-indigo-900"
                      @click="openAssets(target.id)"
                    >
                      Aktywa
                    </button>
                    <button
                      type="button"
                      class="ml-3 text-indigo-600 hover:text-indigo-900"
                      @click="openEdit(target.id)"
                    >
                      Edytuj
                    </button>
                    <button
                      v-if="target.id !== M2M_SAVINGS_TARGET_ID || savingsStore.targets.length > 1"
                      type="button"
                      class="ml-3 text-gray-500 hover:text-gray-800"
                      @click="requestRemove(target)"
                    >
                      Usuń
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <p
              v-if="!savingsStore.targets.length"
              class="px-4 py-8 text-center text-sm text-gray-500"
            >
              Brak targetów — dodaj pierwszy cel.
            </p>
          </div>
        </div>
      </div>
    </div>

    <SavingsTargetAssetsModal
      :open="assetsModalOpen"
      :target-id="assetsTargetId"
      @close="assetsModalOpen = false"
      @saved="assetsTargetId = null"
    />

    <SavingsTargetModal
      :open="modalOpen"
      :target-id="editingId"
      @close="modalOpen = false"
      @saved="onTargetSaved"
    />

    <ConfirmDialog
      :open="deleteModalOpen"
      title="Usunąć target?"
      :message="deleteMessage"
      confirm-label="Usuń"
      variant="danger"
      @close="deleteModalOpen = false"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import FinanceCloseLink from '../components/finance/FinanceCloseLink.vue'
import FlatBadge from '../components/FlatBadge.vue'
import ConfirmDialog from '../components/ConfirmDialog.vue'
import SavingsTargetAchievementChart from '../components/savings/SavingsTargetAchievementChart.vue'
import SavingsTargetAssetsModal from '../components/savings/SavingsTargetAssetsModal.vue'
import SavingsTargetModal from '../components/savings/SavingsTargetModal.vue'
import { M2M_SAVINGS_TARGET_ID } from '../constants/finance'
import {
  SAVINGS_TARGET_COLORS,
  savingsTargetColorTheme,
} from '../constants/savingsTargetColors'
import { useNetSalary } from '../composables/useNetSalary'
import { useSavingsTargetsStore } from '../stores/savingsTargets'
import { useTimelineStore } from '../stores/timeline'
import { useUserAssetsStore } from '../stores/userAssets'
import {
  flatBadgeColorForTarget,
  formatTargetAmount,
  percentOfTarget,
  resolveTargetAmount,
} from '../utils/savingsTarget'
import { sumTargetIncludedSelection } from '../utils/savingsAssets'

const savingsStore = useSavingsTargetsStore()
const timelineStore = useTimelineStore()
const userAssets = useUserAssetsStore()
const { netSalaryPln } = useNetSalary()

const modalOpen = ref(false)
const editingId = ref(null)
const assetsModalOpen = ref(false)
const assetsTargetId = ref(null)
const deleteModalOpen = ref(false)
const deleteTarget = ref(null)

onMounted(async () => {
  timelineStore.fetchPlannedExpenses().catch(() => {})
  try {
    await savingsStore.fetchTargets()
    await savingsStore.recordPrimaryProgress(m2mPln.value).catch(() => {})
  } catch {
    /* store error */
  }
})

const m2mPln = computed(() =>
  Math.max(0, netSalaryPln.value - timelineStore.activePlannedExpensesSubtotal),
)

const primaryTarget = computed(() => savingsStore.primaryTarget)

const primaryTheme = computed(() => savingsTargetColorTheme(savingsStore.primaryTargetColor))

const primaryTargetAmount = computed(() =>
  savingsStore.primaryTargetAmount(m2mPln.value),
)

const primaryTargetAmountFormatted = computed(() =>
  formatTargetAmount(primaryTargetAmount.value),
)

const primaryCurrentValue = computed(() => savingsStore.currentSavingsValue)

const primaryPercent = computed(() => savingsStore.percentOfPrimary(m2mPln.value) ?? 0)

const progressBarWidth = computed(() => Math.min(100, Math.max(0, primaryPercent.value)))

const hasM2mTarget = computed(() =>
  savingsStore.targets.some((t) => t.id === M2M_SAVINGS_TARGET_ID),
)

const deleteMessage = computed(() => {
  if (!deleteTarget.value) return ''
  return `Czy na pewno chcesz usunąć target „${deleteTarget.value.name}”?`
})

function themeFor(target) {
  return savingsTargetColorTheme(target?.color)
}

function badgeColorFor(target) {
  return flatBadgeColorForTarget(target?.color)
}

function targetColorLabel(color) {
  return SAVINGS_TARGET_COLORS.find((c) => c.value === color)?.label ?? color
}

function formatRowAmount(target) {
  return formatTargetAmount(resolveTargetAmount(target, m2mPln.value))
}

function rowPercent(target) {
  const amount = resolveTargetAmount(target, m2mPln.value)
  const current = sumTargetIncludedSelection(userAssets.assets, target)
  return percentOfTarget(current, amount) ?? 0
}

async function recordPrimaryProgress() {
  try {
    await savingsStore.recordPrimaryProgress(m2mPln.value)
  } catch {
    /* store error */
  }
}

async function savePrimaryHistory(snapshots) {
  const id = primaryTarget.value?.id
  if (!id) return
  try {
    await savingsStore.setTargetProgressSnapshots(id, snapshots)
  } catch {
    /* store error */
  }
}

async function onSetPrimary(id) {
  try {
    await savingsStore.setPrimaryTarget(id)
  } catch {
    /* store error */
  }
}

function openAssets(id) {
  assetsTargetId.value = id
  assetsModalOpen.value = true
}

function onTargetSaved() {
  editingId.value = null
  savingsStore.fetchTargets().catch(() => {})
}

function openCreate() {
  editingId.value = null
  modalOpen.value = true
}

function openEdit(id) {
  editingId.value = id
  modalOpen.value = true
}

function requestRemove(target) {
  deleteTarget.value = target
  deleteModalOpen.value = true
}

async function confirmDelete() {
  if (deleteTarget.value?.id) {
    try {
      await savingsStore.removeTarget(deleteTarget.value.id)
    } catch {
      /* store error */
    }
  }
  deleteModalOpen.value = false
  deleteTarget.value = null
}
</script>
