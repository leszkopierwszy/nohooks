<template>
  <Dialog class="relative z-50" :open="open" @close="$emit('close')">
    <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
    <div class="fixed inset-0 z-10 flex items-end justify-center p-4 sm:items-center">
      <DialogPanel
        class="flex max-h-[min(90vh,40rem)] w-full max-w-lg flex-col overflow-hidden rounded-lg bg-white shadow-xl"
      >
        <div class="border-b border-gray-200 px-6 py-4">
          <DialogTitle class="text-lg font-semibold text-gray-900">
            Co wliczać do targetu
          </DialogTitle>
          <p v-if="target" class="mt-1 text-sm text-gray-500">
            <span class="inline-flex items-center gap-2 font-medium text-gray-700">
              <span class="size-2 rounded-full" :class="theme.dot" />
              {{ target.name }}
            </span>
            — zaznacz aktywa z portfela i konta liczone do postępu tego celu.
          </p>
        </div>

        <div v-if="savingsStore.error" class="mx-6 mt-3 text-sm text-red-600">
          {{ savingsStore.error }}
        </div>

        <div class="flex-1 overflow-y-auto px-6 py-4">
          <div class="mb-4 flex flex-wrap gap-2">
            <button
              type="button"
              class="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              @click="selectAll"
            >
              Zaznacz wszystko
            </button>
            <button
              type="button"
              class="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              @click="selectNone"
            >
              Odznacz wszystko
            </button>
          </div>

          <section>
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold text-gray-900">Aktywa (portfel)</h3>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  @click="selectAllPortfolio"
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  class="text-xs font-medium text-gray-500 hover:text-gray-700"
                  @click="selectNonePortfolio"
                >
                  Żadne
                </button>
              </div>
            </div>
            <ul
              v-if="userAssets.assets.length"
              class="mt-2 divide-y divide-gray-200 rounded-lg ring-1 ring-gray-200"
            >
              <li
                v-for="asset in userAssets.assets"
                :key="asset.id"
                class="flex items-center gap-3 px-3 py-3"
              >
                <input
                  :id="`sta-${asset.id}`"
                  v-model="draftIds"
                  type="checkbox"
                  :value="asset.id"
                  class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label :for="`sta-${asset.id}`" class="min-w-0 flex-1 cursor-pointer">
                  <span class="block text-sm font-medium text-gray-900">{{ asset.name }}</span>
                  <span class="block text-xs text-gray-500">
                    {{ asset.category || 'Bez kategorii' }}
                    ·
                    <span class="tabular-nums">{{ formatAssetValue(asset) }}</span>
                  </span>
                </label>
              </li>
            </ul>
            <p v-else class="mt-2 rounded-lg bg-gray-50 px-3 py-4 text-center text-sm text-gray-500">
              Brak aktywów —
              <router-link
                :to="{ name: 'FinancePortfolio' }"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                Moje aktywa
              </router-link>
            </p>
          </section>

          <section class="mt-6">
            <div class="flex items-center justify-between gap-2">
              <h3 class="text-sm font-semibold text-gray-900">Konta</h3>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="text-xs font-medium text-indigo-600 hover:text-indigo-500"
                  @click="selectAllAccounts"
                >
                  Wszystkie
                </button>
                <button
                  type="button"
                  class="text-xs font-medium text-gray-500 hover:text-gray-700"
                  @click="selectNoneAccounts"
                >
                  Żadne
                </button>
              </div>
            </div>
            <ul class="mt-2 divide-y divide-gray-200 rounded-lg ring-1 ring-gray-200">
              <li
                v-for="account in accounts"
                :key="accountSavingsId(account.id)"
                class="flex items-center gap-3 px-3 py-3"
              >
                <input
                  :id="`stc-${account.id}`"
                  v-model="draftIds"
                  type="checkbox"
                  :value="accountSavingsId(account.id)"
                  class="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                />
                <label :for="`stc-${account.id}`" class="min-w-0 flex-1 cursor-pointer">
                  <span class="block text-sm font-medium text-gray-900">
                    {{ account.account_name || account.name }}
                  </span>
                  <span class="block text-xs text-gray-500">
                    {{ account.name }}
                    <span v-if="account.category"> · {{ account.category }}</span>
                    ·
                    <span class="tabular-nums">{{ formatAccountBalance(account) }}</span>
                  </span>
                </label>
              </li>
            </ul>
            <p class="mt-2 text-xs text-gray-500">
              Lista kont z
              <router-link
                :to="{ name: 'FinanceMockAssets' }"
                class="font-medium text-indigo-600 hover:text-indigo-500"
              >
                demo kont
              </router-link>.
            </p>
          </section>
        </div>

        <div class="border-t border-gray-200 bg-gray-50 px-6 py-4">
          <p class="mb-3 text-sm text-gray-600">
            Suma zaznaczonych:
            <span class="font-semibold tabular-nums text-gray-900">{{ draftTotalFormatted }}</span>
          </p>
          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-md bg-white px-4 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              :disabled="savingsStore.saving"
              @click="$emit('close')"
            >
              Anuluj
            </button>
            <button
              type="button"
              class="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-60"
              :disabled="savingsStore.saving || !target"
              @click="save"
            >
              {{ savingsStore.saving ? 'Zapisywanie…' : 'Zapisz' }}
            </button>
          </div>
        </div>
      </DialogPanel>
    </div>
  </Dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { Dialog, DialogPanel, DialogTitle } from '@headlessui/vue'
import { savingsTargetColorTheme } from '../../constants/savingsTargetColors'
import { useSavingsTargetsStore } from '../../stores/savingsTargets'
import { useUserAssetsStore } from '../../stores/userAssets'
import {
  accountSavingsId,
  allSelectableIds,
  formatAccountBalance,
  formatSavingsTotal,
  mockFinanceAccounts,
  resolveTargetIncludedIds,
  sumIncludedSelection,
} from '../../utils/savingsAssets'
import { formatAssetValue } from '../../utils/portfolioAsset'

const props = defineProps({
  open: { type: Boolean, required: true },
  targetId: { type: String, default: null },
})

const emit = defineEmits(['close', 'saved'])

const savingsStore = useSavingsTargetsStore()
const userAssets = useUserAssetsStore()
const accounts = mockFinanceAccounts()

const draftIds = ref([])

const target = computed(() => savingsStore.targets.find((t) => t.id === props.targetId) ?? null)

const theme = computed(() => savingsTargetColorTheme(target.value?.color))

const selectableIds = computed(() => allSelectableIds(userAssets.assets, accounts))

const draftTotalFormatted = computed(() =>
  formatSavingsTotal(sumIncludedSelection(userAssets.assets, accounts, draftIds.value)),
)

function loadDraft() {
  if (!target.value) {
    draftIds.value = []
    return
  }
  draftIds.value = resolveTargetIncludedIds(target.value, userAssets.assets, accounts)
}

watch(
  () => [props.open, props.targetId, target.value?.included_asset_ids],
  () => {
    if (props.open) loadDraft()
  },
  { immediate: true },
)

function selectAll() {
  draftIds.value = [...selectableIds.value]
}

function selectNone() {
  draftIds.value = []
}

function selectAllPortfolio() {
  const set = new Set(draftIds.value)
  for (const a of userAssets.assets) set.add(a.id)
  draftIds.value = [...set]
}

function selectNonePortfolio() {
  const portfolioIds = new Set(userAssets.assets.map((a) => a.id))
  draftIds.value = draftIds.value.filter((id) => !portfolioIds.has(id))
}

function selectAllAccounts() {
  const set = new Set(draftIds.value)
  for (const a of accounts) set.add(accountSavingsId(a.id))
  draftIds.value = [...set]
}

function selectNoneAccounts() {
  const accountIds = new Set(accounts.map((a) => accountSavingsId(a.id)))
  draftIds.value = draftIds.value.filter((id) => !accountIds.has(id))
}

async function save() {
  if (!props.targetId) return
  let ids = [...draftIds.value]
  const all = selectableIds.value
  if (ids.length === all.length && all.every((id) => ids.includes(id))) {
    ids = null
  }
  try {
    await savingsStore.saveTargetIncludedAssets(props.targetId, ids)
    emit('saved')
    emit('close')
  } catch {
    /* error in store */
  }
}
</script>
