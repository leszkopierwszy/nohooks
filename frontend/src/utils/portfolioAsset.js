import { formatMoney } from './currency'

export function computeAssetValue(asset) {
  if (asset.tracking_mode === 'unit_price') {
    const q = Math.max(0, Number(asset.quantity) || 0)
    const p = Math.max(0, Number(asset.unit_price) || 0)
    return q * p
  }
  return Math.max(0, Number(asset.value) || 0)
}

export function formatAssetValue(asset) {
  const v = computeAssetValue(asset)
  return formatMoney(v, asset.currency ?? 'PLN')
}

export function formatAssetUnitPrice(asset) {
  if (asset.tracking_mode !== 'unit_price') return '—'
  const p = Number(asset.unit_price)
  if (!Number.isFinite(p)) return '—'
  return formatMoney(p, asset.currency ?? 'PLN')
}

export function formatAssetUpdatedAt(asset) {
  if (!asset.updated_at) return '—'
  try {
    return new Intl.DateTimeFormat('pl-PL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(asset.updated_at))
  } catch {
    return '—'
  }
}

export function formatAssetLink(url) {
  const u = String(url || '').trim()
  if (!u) return ''
  try {
    const parsed = new URL(u)
    return parsed.hostname.replace(/^www\./, '')
  } catch {
    return u.length > 32 ? `${u.slice(0, 32)}…` : u
  }
}
