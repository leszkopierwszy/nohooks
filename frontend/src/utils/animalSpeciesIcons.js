/** Ikona (emoji) i tło awatara wg `entities.species`. */
export const ANIMAL_SPECIES_ICON = {
  dog: { emoji: '🐕', ring: 'bg-sky-50 ring-sky-100/80', text: 'text-sky-900' },
  cat: { emoji: '🐈', ring: 'bg-violet-50 ring-violet-100/80', text: 'text-violet-900' },
  rabbit: { emoji: '🐇', ring: 'bg-rose-50 ring-rose-100/80', text: 'text-rose-900' },
  bird: { emoji: '🐦', ring: 'bg-cyan-50 ring-cyan-100/80', text: 'text-cyan-900' },
  rodent: { emoji: '🐹', ring: 'bg-amber-50 ring-amber-100/80', text: 'text-amber-900' },
  reptile: { emoji: '🦎', ring: 'bg-lime-50 ring-lime-100/80', text: 'text-lime-900' },
  fish: { emoji: '🐠', ring: 'bg-blue-50 ring-blue-100/80', text: 'text-blue-900' },
  horse: { emoji: '🐴', ring: 'bg-orange-50 ring-orange-100/80', text: 'text-orange-900' },
  other: { emoji: '🐾', ring: 'bg-stone-50 ring-stone-200/80', text: 'text-stone-700' },
}

const DEFAULT_ICON = ANIMAL_SPECIES_ICON.other

export function getAnimalSpeciesIcon(species) {
  if (!species) return DEFAULT_ICON
  return ANIMAL_SPECIES_ICON[species] ?? DEFAULT_ICON
}

export function animalSpeciesEmoji(species) {
  return getAnimalSpeciesIcon(species).emoji
}
