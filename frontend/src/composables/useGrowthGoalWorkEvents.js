import { computed, ref } from 'vue'
import { apiRequest } from '../api/client'
import { aggregateWorkMinutesByGoal } from '../utils/growthGoalWork'

export function useGrowthGoalWorkEvents() {
  const events = ref([])
  const loading = ref(false)
  const error = ref(null)

  const workByGoalId = computed(() => aggregateWorkMinutesByGoal(events.value))

  function workMinutesFor(goalId) {
    return workByGoalId.value[goalId] ?? 0
  }

  async function load() {
    loading.value = true
    error.value = null
    try {
      events.value = await apiRequest('/timeline-event?type=goal_work')
    } catch (err) {
      error.value = err.message
      events.value = []
    } finally {
      loading.value = false
    }
  }

  return {
    events,
    loading,
    error,
    workByGoalId,
    workMinutesFor,
    load,
  }
}
