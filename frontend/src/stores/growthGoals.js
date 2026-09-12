import { defineStore } from 'pinia'
import {
  GROWTH_REMINDER_DAY_OPTIONS,
  GROWTH_STORAGE_VERSION,
} from '../constants/growthGoals'
import {
  daysUntilEvent,
  dueRemindersForGoal,
  isEventOverdue,
  reminderDismissKey,
  todayDateKey,
} from '../utils/growthGoalReminders'
import {
  removeGrowthGoalCalendarEvent,
  syncGrowthGoalCalendarEvent,
} from '../utils/growthGoalCalendarSync'
import { readUserStorage, writeUserStorage } from '../utils/userScopedStorage'

const STORAGE_KEY = 'nohooks.growthGoals.v1'

function readAll() {
  try {
    const raw = readUserStorage(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed?.items)) return []
    return parsed.items
  } catch {
    return []
  }
}

function writeAll(items) {
  writeUserStorage(
    STORAGE_KEY,
    JSON.stringify({ version: GROWTH_STORAGE_VERSION, items }),
  )
}

function newId() {
  return `g_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function normalizeReminderDays(raw) {
  if (!Array.isArray(raw)) return [...GROWTH_REMINDER_DAY_OPTIONS]
  const valid = raw.map(Number).filter((n) => GROWTH_REMINDER_DAY_OPTIONS.includes(n))
  return valid.length ? [...new Set(valid)].sort((a, b) => b - a) : [1, 0]
}

function normalizeDismissed(raw) {
  if (!raw || typeof raw !== 'object') return {}
  const out = {}
  for (const [k, v] of Object.entries(raw)) {
    if (v) out[String(k)] = true
  }
  return out
}

function normalizeGoal(raw) {
  if (!raw || typeof raw !== 'object') return null
  const title = String(raw.title ?? '').trim()
  if (!title) return null
  const type = ['achievement', 'event', 'book'].includes(raw.type) ? raw.type : 'achievement'
  const status = raw.status === 'completed' ? 'completed' : 'active'
  const mood = raw.mood != null ? Number(raw.mood) : null
  const load = raw.load_level != null ? Number(raw.load_level) : null
  const eventDate = raw.event_date ? String(raw.event_date).slice(0, 10) : ''

  return {
    id: String(raw.id || newId()),
    type,
    title,
    description: String(raw.description ?? '').trim(),
    status,
    event_date: eventDate || null,
    load_level: load != null && load >= 1 && load <= 5 ? load : null,
    reminders_enabled: Boolean(raw.reminders_enabled) && Boolean(eventDate),
    reminder_days_before: normalizeReminderDays(raw.reminder_days_before),
    reminder_time: String(raw.reminder_time ?? '09:00').slice(0, 5) || '09:00',
    reminder_dismissed: normalizeDismissed(raw.reminder_dismissed),
    calendar_event_id:
      raw.calendar_event_id != null && raw.calendar_event_id !== ''
        ? Number(raw.calendar_event_id)
        : null,
    mood: mood != null && mood >= 1 && mood <= 5 ? mood : null,
    completion_note: String(raw.completion_note ?? '').trim(),
    created_at: raw.created_at ?? new Date().toISOString(),
    completed_at: raw.completed_at ?? null,
    updated_at: raw.updated_at ?? new Date().toISOString(),
  }
}

function sortActiveGoals(goals) {
  return [...goals].sort((a, b) => {
    const da = a.event_date ? daysUntilEvent(a.event_date) : null
    const db = b.event_date ? daysUntilEvent(b.event_date) : null
    if (da != null && db != null && da !== db) return da - db
    if (da != null && db == null) return -1
    if (da == null && db != null) return 1
    return new Date(b.created_at) - new Date(a.created_at)
  })
}

export const useGrowthGoalsStore = defineStore('growthGoals', {
  state: () => ({
    goals: readAll().map(normalizeGoal).filter(Boolean),
  }),

  getters: {
    activeGoals: (state) => sortActiveGoals(state.goals.filter((g) => g.status === 'active')),

    completedGoals: (state) =>
      state.goals
        .filter((g) => g.status === 'completed')
        .sort((a, b) => new Date(b.completed_at || 0) - new Date(a.completed_at || 0)),

    monitoredGoals: (state) =>
      state.goals.filter(
        (g) => g.status === 'active' && g.reminders_enabled && g.event_date,
      ),

    activeByType: (state) => (type) =>
      state.goals.filter((g) => g.status === 'active' && g.type === type),

    completedByType: (state) => (type) =>
      state.goals.filter((g) => g.status === 'completed' && g.type === type),

    dueRemindersToday: (state) => {
      const today = todayDateKey()
      const items = []
      for (const goal of state.goals) {
        if (goal.status !== 'active') continue
        for (const slot of dueRemindersForGoal(goal, today)) {
          items.push({ goal, ...slot })
        }
      }
      return items
    },

    stats: (state) => {
      const completed = state.goals.filter((g) => g.status === 'completed')
      const moods = completed.map((g) => g.mood).filter((m) => m != null)
      const avgMood =
        moods.length > 0
          ? Math.round((moods.reduce((s, m) => s + m, 0) / moods.length) * 10) / 10
          : null
      const active = state.goals.filter((g) => g.status === 'active')
      return {
        total: state.goals.length,
        active: active.length,
        completed: completed.length,
        monitored: active.filter((g) => g.reminders_enabled && g.event_date).length,
        overdue: active.filter((g) => isEventOverdue(g)).length,
        byType: {
          achievement: completed.filter((g) => g.type === 'achievement').length,
          event: completed.filter((g) => g.type === 'event').length,
          book: completed.filter((g) => g.type === 'book').length,
        },
        avgMood,
      }
    },
  },

  actions: {
    reload() {
      this.goals = readAll().map(normalizeGoal).filter(Boolean)
    },

    persist() {
      writeAll(this.goals)
    },

    async createGoal(payload) {
      const eventDate = payload.event_date ? String(payload.event_date).slice(0, 10) : null
      const remindersEnabled =
        Boolean(payload.reminders_enabled) && Boolean(eventDate)

      let goal = normalizeGoal({
        ...payload,
        event_date: eventDate,
        reminders_enabled: remindersEnabled,
        id: newId(),
        status: 'active',
        reminder_dismissed: {},
        calendar_event_id: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      if (!goal) return null

      const patch = await syncGrowthGoalCalendarEvent(goal)
      goal = { ...goal, calendar_event_id: patch.calendar_event_id }

      this.goals = [goal, ...this.goals]
      this.persist()
      return goal
    },

    async updateGoal(id, payload) {
      const idx = this.goals.findIndex((g) => g.id === id)
      if (idx === -1) return null
      const prev = this.goals[idx]
      if (prev.status === 'completed') return prev

      const eventDate =
        payload.event_date !== undefined
          ? payload.event_date
            ? String(payload.event_date).slice(0, 10)
            : null
          : prev.event_date

      const remindersEnabled =
        payload.reminders_enabled !== undefined
          ? Boolean(payload.reminders_enabled) && Boolean(eventDate)
          : prev.reminders_enabled && Boolean(eventDate)

      let next = normalizeGoal({
        ...prev,
        ...payload,
        event_date: eventDate,
        reminders_enabled: remindersEnabled,
        id: prev.id,
        status: 'active',
        reminder_dismissed: prev.reminder_dismissed,
        calendar_event_id: prev.calendar_event_id,
        updated_at: new Date().toISOString(),
      })
      if (!next) return null

      const patch = await syncGrowthGoalCalendarEvent(next, prev)
      next = { ...next, calendar_event_id: patch.calendar_event_id }

      this.goals = [...this.goals.slice(0, idx), next, ...this.goals.slice(idx + 1)]
      this.persist()
      return next
    },

    dismissReminder(id, offsetDays, onDateKey = todayDateKey()) {
      const idx = this.goals.findIndex((g) => g.id === id)
      if (idx === -1) return
      const prev = this.goals[idx]
      const key = reminderDismissKey(id, offsetDays, onDateKey)
      const next = {
        ...prev,
        reminder_dismissed: { ...prev.reminder_dismissed, [key]: true },
        updated_at: new Date().toISOString(),
      }
      this.goals = [...this.goals.slice(0, idx), next, ...this.goals.slice(idx + 1)]
      this.persist()
    },

    async completeGoal(id, { mood, completion_note }) {
      const idx = this.goals.findIndex((g) => g.id === id)
      if (idx === -1) return null
      const prev = this.goals[idx]
      const moodNum = Number(mood)
      let next = {
        ...prev,
        status: 'completed',
        mood: moodNum >= 1 && moodNum <= 5 ? moodNum : null,
        completion_note: String(completion_note ?? '').trim(),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      const patch = await syncGrowthGoalCalendarEvent(next, prev)
      next = { ...next, calendar_event_id: patch.calendar_event_id }
      this.goals = [...this.goals.slice(0, idx), next, ...this.goals.slice(idx + 1)]
      this.persist()
      return next
    },

    async reopenGoal(id) {
      const idx = this.goals.findIndex((g) => g.id === id)
      if (idx === -1) return null
      const prev = this.goals[idx]
      let next = {
        ...prev,
        status: 'active',
        mood: null,
        completion_note: '',
        completed_at: null,
        updated_at: new Date().toISOString(),
      }
      const patch = await syncGrowthGoalCalendarEvent(next, prev)
      next = { ...next, calendar_event_id: patch.calendar_event_id }
      this.goals = [...this.goals.slice(0, idx), next, ...this.goals.slice(idx + 1)]
      this.persist()
      return next
    },

    async deleteGoal(id) {
      const goal = this.goals.find((g) => g.id === id)
      if (goal) await removeGrowthGoalCalendarEvent(goal)
      this.goals = this.goals.filter((g) => g.id !== id)
      this.persist()
    },

    /** Uzupełnia wpisy kalendarza dla starszych celów z datą, bez calendar_event_id. */
    async syncMissingCalendarEvents() {
      let changed = false
      const nextGoals = [...this.goals]
      for (let i = 0; i < nextGoals.length; i++) {
        const goal = nextGoals[i]
        if (goal.calendar_event_id) continue
        const patch = await syncGrowthGoalCalendarEvent(goal)
        if (patch.calendar_event_id) {
          nextGoals[i] = { ...goal, calendar_event_id: patch.calendar_event_id }
          changed = true
        }
      }
      if (changed) {
        this.goals = nextGoals
        this.persist()
      }
    },
  },
})
