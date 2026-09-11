/** Czy item jest widoczny na widoku danej persony (nie mylić z domyślną podpowiedzią w kolekcji). */
export function itemFitsPersona(item, personaId) {
  if (!personaId || !item) return true

  const id = Number(personaId)

  if (item.fits_all_personas) return true

  const ids = (item.fits_persona_ids ?? []).map(Number)
  return ids.includes(id)
}

export function isDefaultPersonaFit(item, personaId) {
  if (!personaId || !item) return false
  return Number(item.default_persona_id) === Number(personaId)
}

export function normalizeFitsPersonaIds(ids) {
  if (!Array.isArray(ids)) return []
  return [...new Set(ids.map((id) => Number(id)).filter(Number.isFinite))]
}

export function personaFitLabel(item, personas = []) {
  if (!item) return null

  const defaultName =
    item.default_persona?.name ??
    personas.find((p) => Number(p.id) === Number(item.default_persona_id))?.name ??
    null

  if (item.fits_all_personas) {
    return defaultName
      ? `Pasuje do wszystkich · domyślnie ${defaultName}`
      : 'Pasuje do wszystkich person'
  }

  if (defaultName) {
    return `Domyślnie: ${defaultName}`
  }

  return null
}
