/** Presety częstotliwości korzystania → szacowane użycia w miesiącu. */
export const USAGE_FREQUENCIES = [
  { value: 'daily', label: 'Codziennie', timesPerMonth: 30 },
  { value: 'workdays', label: 'Dni robocze', timesPerMonth: 22 },
  { value: 'few_per_week', label: 'Kilka razy w tygodniu', timesPerMonth: 12 },
  { value: 'weekly', label: 'Raz w tygodniu', timesPerMonth: 4.33 },
  { value: 'few_per_month', label: 'Kilka razy w miesiącu', timesPerMonth: 3 },
  { value: 'monthly', label: 'Raz w miesiącu', timesPerMonth: 1 },
  { value: 'rarely', label: 'Rzadko', timesPerMonth: 0.5 },
]

const BY_VALUE = Object.fromEntries(USAGE_FREQUENCIES.map((f) => [f.value, f]))

export function usageFrequencyLabel(value) {
  return BY_VALUE[value]?.label ?? value ?? '—'
}

export function usageTimesPerMonthFromPreset(value) {
  const preset = BY_VALUE[value]
  return preset ? preset.timesPerMonth : null
}

export function resolveUsageTimesPerMonth(frequency, customTimes) {
  if (customTimes != null && customTimes !== '' && Number(customTimes) > 0) {
    return Number(customTimes)
  }
  return usageTimesPerMonthFromPreset(frequency) ?? 1
}
