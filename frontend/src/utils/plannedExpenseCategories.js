import { monthlyEquivalentAmount } from './plannedExpenseProjection'

export const UNCATEGORIZED_LABEL = 'Bez kategorii'

/** Stonowane akcenty — tło ikony i stan wyboru. */
const TILE_ACCENTS = [
  {
    iconBg: 'bg-stone-100',
    iconText: 'text-stone-600',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-stone-300',
    selectedBg: 'bg-stone-50',
  },
  {
    iconBg: 'bg-zinc-100',
    iconText: 'text-zinc-600',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-zinc-300',
    selectedBg: 'bg-zinc-50',
  },
  {
    iconBg: 'bg-slate-100',
    iconText: 'text-slate-600',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-slate-300',
    selectedBg: 'bg-slate-50',
  },
  {
    iconBg: 'bg-neutral-100',
    iconText: 'text-neutral-600',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-neutral-300',
    selectedBg: 'bg-neutral-50',
  },
  {
    iconBg: 'bg-gray-100',
    iconText: 'text-gray-600',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-gray-300',
    selectedBg: 'bg-gray-50',
  },
  {
    iconBg: 'bg-rose-50',
    iconText: 'text-rose-600/90',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-rose-200',
    selectedBg: 'bg-rose-50/70',
  },
  {
    iconBg: 'bg-amber-50',
    iconText: 'text-amber-700/90',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-amber-200',
    selectedBg: 'bg-amber-50/70',
  },
  {
    iconBg: 'bg-sky-50',
    iconText: 'text-sky-600/90',
    ring: 'ring-gray-200/90',
    selectedRing: 'ring-sky-200',
    selectedBg: 'bg-sky-50/70',
  },
]

const TILE_TEXT = {
  title: 'text-gray-900',
  muted: 'text-gray-500',
}

export function categoryKey(row) {
  const trimmed = row.category?.trim()
  return trimmed || UNCATEGORIZED_LABEL
}

export function rowMatchesCategory(row, categoryName) {
  return categoryKey(row) === categoryName
}

export function groupExpensesByCategory(rows) {
  const map = new Map()

  for (const row of rows) {
    const name = categoryKey(row)
    if (!map.has(name)) {
      map.set(name, {
        name,
        count: 0,
        activeCount: 0,
        monthlyTotal: 0,
      })
    }
    const group = map.get(name)
    group.count += 1
    if (row.status) {
      group.activeCount += 1
      group.monthlyTotal += monthlyEquivalentAmount(row.price, row.recurrence)
    }
  }

  return [...map.values()].sort((a, b) => {
    if (b.monthlyTotal !== a.monthlyTotal) return b.monthlyTotal - a.monthlyTotal
    return a.name.localeCompare(b.name, 'pl')
  })
}

export function categoryTileAccent(name) {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % TILE_ACCENTS.length
  }
  return { ...TILE_ACCENTS[hash], ...TILE_TEXT }
}
