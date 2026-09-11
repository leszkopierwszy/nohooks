import { animalSpeciesEmoji } from '../utils/animalSpeciesIcons'

/** Gatunki zwierząt — wartość zapisywana w API (`entities.species`). */
export const ANIMAL_SPECIES = [
  { value: 'dog', labelKey: 'souls.animals.speciesTypes.dog', emoji: animalSpeciesEmoji('dog') },
  { value: 'cat', labelKey: 'souls.animals.speciesTypes.cat', emoji: animalSpeciesEmoji('cat') },
  { value: 'rabbit', labelKey: 'souls.animals.speciesTypes.rabbit', emoji: animalSpeciesEmoji('rabbit') },
  { value: 'bird', labelKey: 'souls.animals.speciesTypes.bird', emoji: animalSpeciesEmoji('bird') },
  { value: 'rodent', labelKey: 'souls.animals.speciesTypes.rodent', emoji: animalSpeciesEmoji('rodent') },
  { value: 'reptile', labelKey: 'souls.animals.speciesTypes.reptile', emoji: animalSpeciesEmoji('reptile') },
  { value: 'fish', labelKey: 'souls.animals.speciesTypes.fish', emoji: animalSpeciesEmoji('fish') },
  { value: 'horse', labelKey: 'souls.animals.speciesTypes.horse', emoji: animalSpeciesEmoji('horse') },
  { value: 'other', labelKey: 'souls.animals.speciesTypes.other', emoji: animalSpeciesEmoji('other') },
]

export const ANIMAL_SPECIES_VALUES = ANIMAL_SPECIES.map((s) => s.value)

export const ANIMAL_SEX_OPTIONS = [
  { value: 'female', labelKey: 'souls.animals.sex.female' },
  { value: 'male', labelKey: 'souls.animals.sex.male' },
]

export const PET_PURCHASE_TYPES = [
  { value: 'food', labelKey: 'souls.animals.purchaseTypes.food' },
  { value: 'vet', labelKey: 'souls.animals.purchaseTypes.vet' },
  { value: 'grooming', labelKey: 'souls.animals.purchaseTypes.grooming' },
  { value: 'supplies', labelKey: 'souls.animals.purchaseTypes.supplies' },
  { value: 'insurance', labelKey: 'souls.animals.purchaseTypes.insurance' },
  { value: 'other', labelKey: 'souls.animals.purchaseTypes.other' },
]

export const PET_EXPENSE_FREQUENCIES = [
  { value: 'weekly', labelKey: 'souls.animals.frequency.weekly' },
  { value: 'monthly', labelKey: 'souls.animals.frequency.monthly' },
  { value: 'quarterly', labelKey: 'souls.animals.frequency.quarterly' },
  { value: 'yearly', labelKey: 'souls.animals.frequency.yearly' },
  { value: 'ad_hoc', labelKey: 'souls.animals.frequency.ad_hoc' },
]
