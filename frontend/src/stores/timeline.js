import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'
import { calendarDateKey } from '../utils/timelineRecurrence'

export const useTimelineStore = defineStore('timeline', {
  state: () => ({
    events: [],
    plannedExpenses: [],
    loading: false,
    plannedLoading: false,
    error: null,
  }),

  getters: {
    eventsByDate: (state) => {
      const map = {}
      for (const event of state.events) {
        const key = event.event_date?.slice?.(0, 10) ?? event.event_date
        if (!map[key]) map[key] = []
        map[key].push(event)
      }
      return map
    },

    activePlannedExpensesSubtotal: (state) =>
      state.plannedExpenses
        .filter((e) => e.is_active !== false)
        .reduce((sum, e) => sum + (Number(e.planned_amount) || 0), 0),
  },

  actions: {
    mergeEvent(event) {
      const index = this.events.findIndex((e) => e.id === event.id)
      if (index !== -1) {
        this.events[index] = event
      } else {
        this.events.push(event)
      }
      this.events.sort(compareEvents)

      if (event.type === 'planned_expense') {
        const pIndex = this.plannedExpenses.findIndex((e) => e.id === event.id)
        if (pIndex !== -1) {
          this.plannedExpenses[pIndex] = event
        } else {
          this.plannedExpenses.push(event)
        }
        this.plannedExpenses.sort(compareEvents)
      }
    },

    removeEventFromState(id) {
      const targetId = Number(id)
      this.events = this.events.filter((e) => Number(e.id) !== targetId)
      this.plannedExpenses = this.plannedExpenses.filter((e) => Number(e.id) !== targetId)
    },

    async fetchEvents({ from, to, type } = {}) {
      this.loading = true
      this.error = null

      const params = new URLSearchParams()
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (type) params.set('type', type)
      const query = params.toString()

      try {
        this.events = await apiRequest(`/timeline-event${query ? `?${query}` : ''}`)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.loading = false
      }
    },

    async fetchPlannedExpenses() {
      this.plannedLoading = true
      this.error = null

      try {
        const params = new URLSearchParams({ type: 'planned_expense' })
        this.plannedExpenses = await apiRequest(`/timeline-event?${params}`)
        this.plannedExpenses.sort(compareEvents)

        for (const event of this.plannedExpenses) {
          if (!this.events.some((e) => e.id === event.id)) {
            this.events.push(event)
          }
        }
        this.events.sort(compareEvents)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.plannedLoading = false
      }
    },

    async createEvent(payload) {
      this.error = null
      const event = await apiRequest('/timeline-event', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
      this.mergeEvent(event)
      return event
    },

    async updateEvent(id, payload) {
      this.error = null
      const event = await apiRequest(`/timeline-event/${id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      })
      this.mergeEvent(event)
      return event
    },

    async deleteEvent(id) {
      this.error = null
      await apiRequest(`/timeline-event/${id}`, { method: 'DELETE' })
      this.removeEventFromState(id)
    },
  },
})

function compareEvents(a, b) {
  const dateCmp = String(a.event_date).localeCompare(String(b.event_date))
  if (dateCmp !== 0) return dateCmp
  const startA = a.start_time ?? ''
  const startB = b.start_time ?? ''
  return startA.localeCompare(startB)
}

/** Pomocniczo dla mapowania po dniu w widoku miesiąca. */
export function eventsForCalendarDay(events, dateKey, viewYear, viewMonth) {
  return events.filter((event) => calendarDateKey(event, viewYear, viewMonth) === dateKey)
}
