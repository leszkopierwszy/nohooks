export const TIMELINE_EVENT_TYPES = [
  { value: 'event', label: 'Wydarzenie', color: 'bg-indigo-500' },
  { value: 'goal_work', label: 'Praca nad celem', color: 'bg-stone-600' },
  { value: 'growth_goal', label: 'Cel rozwoju', color: 'bg-stone-500', systemOnly: true },
  { value: 'planned_expense', label: 'Zaplanowany wydatek', color: 'bg-rose-500' },
  { value: 'reminder', label: 'Przypomnienie', color: 'bg-amber-500' },
  { value: 'birthday', label: 'Urodziny', color: 'bg-pink-500' },
]

/** Typy dostępne w ręcznym formularzu kalendarza (bez auto-sync z celów). */
export const TIMELINE_EVENT_TYPES_FORM = TIMELINE_EVENT_TYPES.filter((t) => !t.systemOnly)

export function timelineEventTypeMeta(type) {
  return TIMELINE_EVENT_TYPES.find((t) => t.value === type) ?? TIMELINE_EVENT_TYPES[0]
}
