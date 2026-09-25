import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUserStore } from '../stores/user'

/** Per-user net salary (PLN). New accounts default to 0. */
export function useNetSalary() {
  const userStore = useUserStore()
  const { user } = storeToRefs(userStore)

  const netSalaryPln = computed(() => {
    const raw = user.value?.netSalaryPln
    const n = Number(raw)
    return Number.isFinite(n) && n > 0 ? n : 0
  })

  const netSalaryFormatted = computed(
    () =>
      netSalaryPln.value.toLocaleString('pl-PL', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }) + ' PLN',
  )

  return { netSalaryPln, netSalaryFormatted }
}
