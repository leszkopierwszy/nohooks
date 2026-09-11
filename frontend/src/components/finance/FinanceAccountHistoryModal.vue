<template>
  <FinanceAccountModalShell
    :open="open"
    :title="t('finance.accounts.history.title')"
    :subtitle="account?.name ?? ''"
    @close="$emit('close')"
  >
    <ul v-if="entries.length" class="divide-y divide-gray-100">
      <li
        v-for="entry in entries"
        :key="entry.id"
        class="py-3 first:pt-0 last:pb-0"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-medium text-gray-900">{{ historyEntryTitle(entry) }}</p>
            <p
              v-if="historyEntryAmountLine(entry)"
              :class="[
                'mt-0.5 text-xs font-semibold tabular-nums',
                entry.kind === 'credit'
                  ? 'text-emerald-700'
                  : entry.kind === 'debit'
                    ? 'text-rose-700'
                    : 'text-gray-700',
              ]"
            >
              {{ historyEntryAmountLine(entry) }}
            </p>
            <p
              v-for="(line, i) in historyEntryMetaLines(entry)"
              :key="i"
              class="mt-0.5 text-[10px] text-gray-600"
            >
              {{ line }}
            </p>
            <p v-if="entry.note" class="mt-1 text-[10px] text-gray-500">{{ entry.note }}</p>
            <p v-if="historyEntryBalanceLine(entry)" class="mt-1 text-[9px] text-gray-400">
              {{ historyEntryBalanceLine(entry) }}
            </p>
          </div>
          <time class="shrink-0 text-[9px] text-gray-400">{{ formatWhen(entry.created_at) }}</time>
        </div>
      </li>
    </ul>
    <p v-else class="py-8 text-center text-xs text-gray-500">
      {{ t('finance.accounts.history.empty') }}
    </p>

    <template #footer>
      <button
        type="button"
        class="w-full rounded-md bg-gray-100 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-200"
        @click="$emit('close')"
      >
        {{ t('finance.accounts.history.close') }}
      </button>
    </template>
  </FinanceAccountModalShell>
</template>

<script setup>
import { computed } from 'vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { useI18n } from '../../composables/useI18n'
import { useFinanceAccountActions } from '../../composables/useFinanceAccountActions'
import {
  historyEntryAmountLine,
  historyEntryBalanceLine,
  historyEntryMetaLines,
  historyEntryTitle,
} from '../../utils/financeAccountHistory'

const props = defineProps({
  open: { type: Boolean, default: false },
  account: { type: Object, default: null },
})

defineEmits(['close'])

const { t } = useI18n()
const { getHistory } = useFinanceAccountActions()

const entries = computed(() => {
  if (!props.account) return []
  return getHistory(props.account)
})

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('pl-PL', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso
  }
}
</script>
