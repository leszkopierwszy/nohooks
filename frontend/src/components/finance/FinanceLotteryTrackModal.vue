<template>
  <FinanceAccountModalShell
    :open="open"
    :title="t('finance.accounts.lotteryTrack.title')"
    :subtitle="t('finance.accounts.lotteryTrack.subtitle', { n: tickets.length })"
    @close="$emit('close')"
  >
    <ul v-if="tickets.length" class="divide-y divide-gray-100">
      <li v-for="ticket in tickets" :key="ticket.id" class="py-3 first:pt-0 last:pb-0">
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="text-xs font-semibold text-gray-900">
              {{ systemLabel(ticket.system) }}
            </p>
            <ul class="mt-1 space-y-0.5">
              <li
                v-for="(bet, index) in ticketBets(ticket)"
                :key="`${ticket.id}-${index}`"
                class="text-xs tabular-nums text-amber-900"
              >
                <span class="text-[10px] font-medium text-gray-500">
                  {{ t('finance.accounts.expense.lotteryBetLabel', { n: index + 1 }) }}:
                </span>
                {{ formatNumbers(bet.numbers) }}
                <span v-if="bet.bonus_numbers?.length" class="text-indigo-700">
                  + {{ formatNumbers(bet.bonus_numbers) }}
                </span>
              </li>
            </ul>
            <p v-if="ticket.jackpot" class="mt-1 text-[10px] text-gray-600">
              {{ t('finance.accounts.lotteryTrack.jackpot', { value: ticket.jackpot }) }}
            </p>
            <p v-if="ticket.draw_date" class="mt-0.5 text-[10px] text-gray-500">
              {{ t('finance.accounts.lotteryTrack.drawDate', { date: formatDate(ticket.draw_date) }) }}
            </p>
            <a
              v-if="ticket.draw_url"
              :href="ticket.draw_url"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-1 inline-block text-[10px] font-medium text-indigo-600 hover:text-indigo-500"
            >
              {{ t('finance.accounts.lotteryTrack.openDraw') }} →
            </a>
          </div>
          <button
            type="button"
            class="shrink-0 rounded-md px-2 py-1 text-[10px] font-semibold text-rose-700 hover:bg-rose-50"
            @click="lotteryStore.removeTicket(ticket.id)"
          >
            {{ t('finance.accounts.lotteryTrack.remove') }}
          </button>
        </div>
      </li>
    </ul>
    <p v-else class="py-8 text-center text-xs text-gray-500">
      {{ t('finance.accounts.lotteryTrack.empty') }}
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
import { computed, onMounted } from 'vue'
import FinanceAccountModalShell from './FinanceAccountModalShell.vue'
import { lotterySystemById } from '../../constants/lotterySystems'
import { useI18n } from '../../composables/useI18n'
import { useLotteryTicketsStore } from '../../stores/lotteryTickets'
import { formatIsoToDmY } from '../../utils/dateDmY'

defineProps({
  open: { type: Boolean, default: false },
})

defineEmits(['close'])

const { t } = useI18n()
const lotteryStore = useLotteryTicketsStore()

const tickets = computed(() => lotteryStore.trackedTickets)

onMounted(() => lotteryStore.reload())

function systemLabel(id) {
  const key = `finance.accounts.expense.lotterySystems.${id}`
  const label = t(key)
  if (label !== key) return label
  return lotterySystemById(id)?.id ?? id ?? '—'
}

function formatNumbers(nums) {
  return (nums ?? []).join(', ')
}

function ticketBets(ticket) {
  if (Array.isArray(ticket.bets) && ticket.bets.length) return ticket.bets
  if (ticket.numbers?.length) {
    return [{ numbers: ticket.numbers, bonus_numbers: ticket.bonus_numbers ?? [] }]
  }
  return []
}

function formatDate(iso) {
  return formatIsoToDmY(iso) || iso
}
</script>
