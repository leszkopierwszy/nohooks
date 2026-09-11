import { computed, onMounted, onUnmounted, ref } from 'vue'
import { translate as t } from '../i18n'
import { dueRemindersForGoal, todayDateKey } from '../utils/growthGoalReminders'
import { useGrowthGoalsStore } from '../stores/growthGoals'

const CHECK_INTERVAL_MS = 60_000

export function useGrowthGoalReminders() {
  const store = useGrowthGoalsStore()
  const notificationPermission = ref(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied',
  )

  const dueToday = computed(() => {
    const today = todayDateKey()
    const items = []
    for (const goal of store.activeGoals) {
      for (const slot of dueRemindersForGoal(goal, today)) {
        items.push({ goal, ...slot })
      }
    }
    return items
  })

  let intervalId = null
  const notifiedThisSession = new Set()

  function reminderMessage(goal, slot) {
    const title = goal.title
    if (slot.offsetDays === 0) {
      return t('growth.reminders.today', { title })
    }
    if (slot.offsetDays === 1) {
      return t('growth.reminders.tomorrow', { title })
    }
    return t('growth.reminders.daysBefore', {
      title,
      days: slot.offsetDays,
      date: formatShortDate(slot.eventDate),
    })
  }

  function formatShortDate(dateKey) {
    try {
      return new Date(dateKey + 'T12:00:00').toLocaleDateString('pl-PL', {
        day: 'numeric',
        month: 'short',
      })
    } catch {
      return dateKey
    }
  }

  function tryBrowserNotification(entry) {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return

    const sessionKey = `${entry.goal.id}:${entry.offsetDays}:${todayDateKey()}`
    if (notifiedThisSession.has(sessionKey)) return
    notifiedThisSession.add(sessionKey)

    try {
      new Notification(t('growth.reminders.notificationTitle'), {
        body: reminderMessage(entry.goal, entry),
        tag: sessionKey,
      })
    } catch {
      /* ignore */
    }
  }

  function flushNotifications() {
    for (const entry of dueToday.value) {
      tryBrowserNotification(entry)
    }
  }

  async function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return 'denied'
    const result = await Notification.requestPermission()
    notificationPermission.value = result
    if (result === 'granted') flushNotifications()
    return result
  }

  function dismiss(entry) {
    store.dismissReminder(entry.goal.id, entry.offsetDays)
  }

  function checkNow() {
    flushNotifications()
  }

  onMounted(() => {
    checkNow()
    intervalId = setInterval(checkNow, CHECK_INTERVAL_MS)
  })

  onUnmounted(() => {
    if (intervalId) clearInterval(intervalId)
  })

  return {
    dueToday,
    notificationPermission,
    requestNotificationPermission,
    dismiss,
    checkNow,
    reminderMessage,
  }
}
