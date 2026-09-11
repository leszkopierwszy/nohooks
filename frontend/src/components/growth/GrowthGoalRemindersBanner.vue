<template>
  <section
    v-if="dueToday.length"
    class="mt-6 rounded-xl border border-stone-300/80 bg-stone-50/90 p-4 ring-1 ring-inset ring-stone-200"
  >
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 class="text-sm font-semibold text-gray-900">{{ t('growth.reminders.bannerTitle') }}</h2>
        <p class="mt-0.5 text-xs text-gray-500">{{ t('growth.reminders.bannerHint') }}</p>
      </div>
      <button
        v-if="notificationPermission !== 'granted'"
        type="button"
        class="shrink-0 rounded-lg bg-gray-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-gray-800"
        @click="$emit('enable-notifications')"
      >
        {{ t('growth.reminders.enableNotifications') }}
      </button>
    </div>

    <ul class="mt-3 space-y-2">
      <li
        v-for="entry in dueToday"
        :key="`${entry.goal.id}-${entry.offsetDays}`"
        class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-white px-3 py-2.5 shadow-sm ring-1 ring-inset ring-stone-200/80"
      >
        <div class="min-w-0">
          <p class="text-sm font-medium text-gray-900">{{ entry.goal.title }}</p>
          <p class="mt-0.5 text-xs text-gray-500">{{ reminderMessage(entry.goal, entry) }}</p>
        </div>
        <div class="flex shrink-0 gap-2">
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs font-medium text-stone-700 ring-1 ring-stone-200 hover:bg-stone-50"
            @click="$emit('edit', entry.goal)"
          >
            {{ t('growth.card.edit') }}
          </button>
          <button
            type="button"
            class="rounded-md px-2 py-1 text-xs font-medium text-stone-500 hover:bg-stone-100"
            @click="$emit('dismiss', entry)"
          >
            {{ t('growth.reminders.dismiss') }}
          </button>
        </div>
      </li>
    </ul>
  </section>
</template>

<script setup>
import { useI18n } from '../../composables/useI18n'

defineProps({
  dueToday: { type: Array, default: () => [] },
  notificationPermission: { type: String, default: 'denied' },
  reminderMessage: { type: Function, required: true },
})

defineEmits(['dismiss', 'edit', 'enable-notifications'])

const { t } = useI18n()
</script>
