export const SEASON_OPTIONS = [
  { value: 'wiosna', label: 'Wiosna' },
  { value: 'lato', label: 'Lato' },
  { value: 'jesien', label: 'Jesień' },
  { value: 'zima', label: 'Zima' },
  { value: 'caloroczny', label: 'Całoroczny' },
]

function findOption(season) {
  if (!season) return null
  const lower = String(season).trim().toLowerCase()
  return (
    SEASON_OPTIONS.find((s) => s.value === lower) ??
    SEASON_OPTIONS.find((s) => s.label.toLowerCase() === lower) ??
    null
  )
}

export function getAllSeasons(extraValues = []) {
  const map = new Map(SEASON_OPTIONS.map((s) => [s.value, s]))

  for (const raw of extraValues) {
    if (!raw) continue
    const option = findOption(raw) ?? {
      value: String(raw).trim().toLowerCase(),
      label: String(raw).trim().charAt(0).toUpperCase() + String(raw).trim().slice(1),
    }
    map.set(option.value, option)
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, 'pl')
  )
}

export function displaySeasonName(season) {
  if (!season) return null
  return findOption(season)?.label ?? season
}

export function normalizeSeasonForStorage(season) {
  if (!season) return null
  return findOption(season)?.value ?? String(season).trim().toLowerCase()
}
