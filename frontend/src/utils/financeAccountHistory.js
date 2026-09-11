import { formatBalancePln } from './financeAccountBalance'
import { translate } from '../i18n'

const FIELD_LABELS = {
  name: 'finance.accounts.fields.name',
  account_number: 'finance.accounts.fields.accountNumber',
  account_name: 'finance.accounts.fields.accountName',
  category: 'finance.accounts.fields.category',
  default_frequency: 'finance.accounts.fields.frequency',
}

export function historyEntryTitle(entry) {
  if (!entry) return ''
  if (entry.kind === 'credit') return translate('finance.accounts.history.credit')
  if (entry.kind === 'debit') return translate('finance.accounts.history.debit')
  if (entry.kind === 'meta') return translate('finance.accounts.history.meta')
  return entry.kind
}

export function historyEntryAmountLine(entry) {
  if (entry.kind === 'credit' || entry.kind === 'debit') {
    const sign = entry.kind === 'credit' ? '+' : '−'
    return `${sign}${formatBalancePln(entry.amount)}`
  }
  return null
}

export function historyEntryMetaLines(entry) {
  const changes = entry.meta?.changes
  if (!Array.isArray(changes)) return []
  return changes.map((c) => {
    const labelKey = FIELD_LABELS[c.field]
    const label = labelKey ? translate(labelKey) : c.field
    return translate('finance.accounts.history.metaLine', {
      field: label,
      from: c.from || '—',
      to: c.to || '—',
    })
  })
}

export function historyEntryBalanceLine(entry) {
  if (entry.kind === 'meta') return null
  return translate('finance.accounts.history.balanceLine', {
    before: formatBalancePln(entry.balance_before),
    after: formatBalancePln(entry.balance_after),
  })
}
