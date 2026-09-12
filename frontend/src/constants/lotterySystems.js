/**
 * Lottery draw systems — main picks and optional bonus picks.
 * Labels via i18n: finance.accounts.expense.lotterySystems.{id}
 */
export const LOTTERY_SYSTEMS = [
  {
    id: '6of49',
    mainCount: 6,
    mainMax: 49,
    bonusCount: 0,
    bonusMax: 0,
  },
  {
    id: '5of42',
    mainCount: 5,
    mainMax: 42,
    bonusCount: 0,
    bonusMax: 0,
  },
  {
    id: '5of50_1of12',
    mainCount: 5,
    mainMax: 50,
    bonusCount: 1,
    bonusMax: 12,
  },
  {
    id: '5of50_2of12',
    mainCount: 5,
    mainMax: 50,
    bonusCount: 2,
    bonusMax: 12,
  },
]

export const DEFAULT_LOTTERY_SYSTEM_ID = '6of49'

export function lotterySystemById(id) {
  return LOTTERY_SYSTEMS.find((s) => s.id === id) ?? null
}

/** Empty bet row with string slots for inputs (length matches system). */
export function createEmptyLotteryBet(system) {
  const sys = system ?? LOTTERY_SYSTEMS[0]
  return {
    id: `bet-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    main: Array.from({ length: sys.mainCount }, () => ''),
    bonus: Array.from({ length: sys.bonusCount }, () => ''),
  }
}

export function resizeLotteryBet(bet, system) {
  const nextMain = Array.from({ length: system.mainCount }, (_, i) => bet.main?.[i] ?? '')
  const nextBonus = Array.from({ length: system.bonusCount }, (_, i) => bet.bonus?.[i] ?? '')
  return { ...bet, main: nextMain, bonus: nextBonus }
}

function parseSlot(value, max) {
  const raw = String(value ?? '').trim()
  if (!raw) return null
  const n = Number(raw)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n < 1) return null
  if (max != null && n > max) return null
  return n
}

/** Convert bet input slots → validated number arrays (or null if incomplete/invalid). */
export function resolveLotteryBet(bet, system) {
  if (!bet || !system) return null

  const main = []
  const mainSeen = new Set()
  for (const slot of bet.main ?? []) {
    const n = parseSlot(slot, system.mainMax)
    if (n == null) return null
    if (mainSeen.has(n)) return null
    mainSeen.add(n)
    main.push(n)
  }
  if (main.length !== system.mainCount) return null

  const bonus = []
  const bonusSeen = new Set()
  for (const slot of bet.bonus ?? []) {
    const n = parseSlot(slot, system.bonusMax)
    if (n == null) return null
    if (bonusSeen.has(n)) return null
    bonusSeen.add(n)
    bonus.push(n)
  }
  if (bonus.length !== system.bonusCount) return null

  return {
    numbers: main.sort((a, b) => a - b),
    bonus_numbers: bonus.sort((a, b) => a - b),
  }
}

export function lotterySystemRuleLabel(system, t) {
  if (!system) return ''
  if (system.bonusCount > 0) {
    return t('finance.accounts.expense.lotterySystemRuleWithBonus', {
      main: system.mainCount,
      mainMax: system.mainMax,
      bonus: system.bonusCount,
      bonusMax: system.bonusMax,
    })
  }
  return t('finance.accounts.expense.lotterySystemRule', {
    main: system.mainCount,
    mainMax: system.mainMax,
  })
}
