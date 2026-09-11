export function resolveTargetAmount(target, m2mPln) {
  if (!target) return 0
  if (target.type === 'm2m') return Math.max(0, Number(m2mPln) || 0)
  return Math.max(0, Number(target.amount) || 0)
}

export function formatTargetAmount(amount) {
  return (
    amount.toLocaleString('pl-PL', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' PLN'
  )
}

export function percentOfTarget(current, targetAmount) {
  if (targetAmount <= 0) return null
  return Math.round((current / targetAmount) * 100)
}

export function flatBadgeColorForTarget(targetColor) {
  const c = targetColor === 'blue' ? 'indigo' : targetColor
  const allowed = ['gray', 'red', 'yellow', 'green', 'indigo', 'purple', 'pink']
  return allowed.includes(c) ? c : 'gray'
}

export function formatPercentLabel(pct, targetName) {
  if (pct == null) return 'Brak targetu'
  const name = targetName ? ` · ${targetName}` : ''
  return `${pct}% targetu${name}`
}
