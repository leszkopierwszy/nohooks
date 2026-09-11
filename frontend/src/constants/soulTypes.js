/** Typ encji w API — Prims to `persona`, zwierzęta to `animal`. */
export const SOUL_TYPE_PRIM = 'persona'
export const SOUL_TYPE_ANIMAL = 'animal'

export function isAnimalSoul(entity) {
  return entity?.type === SOUL_TYPE_ANIMAL
}

export function isPrimSoul(entity) {
  return !isAnimalSoul(entity)
}
