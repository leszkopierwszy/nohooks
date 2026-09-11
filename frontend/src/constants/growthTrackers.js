import { GROWTH_MOOD_LEVELS } from './growthGoals'

export const WELLBEING_STORAGE_VERSION = 1
export const HEALTH_STORAGE_VERSION = 1
export const SLEEP_STORAGE_VERSION = 1

export const GROWTH_SLEEP_QUALITY_LEVELS = [
  { value: 1, labelKey: 'growth.sleep.quality.1', emoji: '😫' },
  { value: 2, labelKey: 'growth.sleep.quality.2', emoji: '😴' },
  { value: 3, labelKey: 'growth.sleep.quality.3', emoji: '😐' },
  { value: 4, labelKey: 'growth.sleep.quality.4', emoji: '🙂' },
  { value: 5, labelKey: 'growth.sleep.quality.5', emoji: '✨' },
]

export const GROWTH_SLEEP_FACTORS = [
  { value: 'caffeine', labelKey: 'growth.sleep.factors.caffeine' },
  { value: 'screen', labelKey: 'growth.sleep.factors.screen' },
  { value: 'stress', labelKey: 'growth.sleep.factors.stress' },
  { value: 'alcohol', labelKey: 'growth.sleep.factors.alcohol' },
  { value: 'exercise', labelKey: 'growth.sleep.factors.exercise' },
  { value: 'late_meal', labelKey: 'growth.sleep.factors.late_meal' },
  { value: 'noise', labelKey: 'growth.sleep.factors.noise' },
  { value: 'travel', labelKey: 'growth.sleep.factors.travel' },
  { value: 'nap', labelKey: 'growth.sleep.factors.nap' },
]

export const GROWTH_EMOTIONS = [
  { value: 'joy', labelKey: 'growth.wellbeing.emotions.joy' },
  { value: 'calm', labelKey: 'growth.wellbeing.emotions.calm' },
  { value: 'gratitude', labelKey: 'growth.wellbeing.emotions.gratitude' },
  { value: 'excitement', labelKey: 'growth.wellbeing.emotions.excitement' },
  { value: 'sadness', labelKey: 'growth.wellbeing.emotions.sadness' },
  { value: 'anxiety', labelKey: 'growth.wellbeing.emotions.anxiety' },
  { value: 'anger', labelKey: 'growth.wellbeing.emotions.anger' },
  { value: 'frustration', labelKey: 'growth.wellbeing.emotions.frustration' },
  { value: 'tiredness', labelKey: 'growth.wellbeing.emotions.tiredness' },
  { value: 'overwhelm', labelKey: 'growth.wellbeing.emotions.overwhelm' },
]

export const GROWTH_BODY_AREAS = [
  { value: 'head', labelKey: 'growth.wellbeing.body.head' },
  { value: 'neck', labelKey: 'growth.wellbeing.body.neck' },
  { value: 'chest', labelKey: 'growth.wellbeing.body.chest' },
  { value: 'stomach', labelKey: 'growth.wellbeing.body.stomach' },
  { value: 'back', labelKey: 'growth.wellbeing.body.back' },
  { value: 'arms', labelKey: 'growth.wellbeing.body.arms' },
  { value: 'legs', labelKey: 'growth.wellbeing.body.legs' },
  { value: 'whole', labelKey: 'growth.wellbeing.body.whole' },
]

export const GROWTH_HEALTH_STATUSES = [
  {
    value: 'healthy',
    labelKey: 'growth.health.status.healthy',
    class: 'bg-stone-100 text-stone-700 ring-1 ring-inset ring-stone-200',
  },
  {
    value: 'sick',
    labelKey: 'growth.health.status.sick',
    class: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-200',
  },
  {
    value: 'injury',
    labelKey: 'growth.health.status.injury',
    class: 'bg-stone-200/80 text-stone-800 ring-1 ring-inset ring-stone-300',
  },
]

export { GROWTH_MOOD_LEVELS }

export function healthStatusMeta(status) {
  return GROWTH_HEALTH_STATUSES.find((s) => s.value === status) ?? GROWTH_HEALTH_STATUSES[0]
}

export function sleepQualityMeta(value) {
  const n = Number(value)
  return GROWTH_SLEEP_QUALITY_LEVELS.find((q) => q.value === n) ?? null
}
