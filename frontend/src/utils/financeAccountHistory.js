import { formatBalancePln } from './financeAccountBalance'
import { translate } from '../i18n'

const FIELD_LABELS = {
  name: 'finance.accounts.fields.name',
  account_number: 'finance.accounts.fields.accountNumber',
  account_name: 'finance.accounts.fields.accountName',
  category: 'finance.accounts.fields.category',
  default_frequency: 'finance.accounts.fields.frequency',
}

function expenseCategoryLabel(category) {
  if (!category) return ''
  const key = `finance.accounts.expense.categories.${category}`
  const label = translate(key)
  return label === key ? category : label
}

function purchaseTypeLabel(value) {
  if (!value) return ''
  const key = `souls.animals.purchaseTypes.${value}`
  const label = translate(key)
  return label === key ? value : label
}

export function historyEntryTitle(entry) {
  if (!entry) return ''
  if (entry.kind === 'credit') return translate('finance.accounts.history.credit')
  if (entry.kind === 'debit') return translate('finance.accounts.history.debit')
  if (entry.kind === 'expense') return translate('finance.accounts.history.expense')
  if (entry.kind === 'meta') return translate('finance.accounts.history.meta')
  return entry.kind
}

export function historyEntryAmountLine(entry) {
  if (entry.kind === 'credit' || entry.kind === 'debit' || entry.kind === 'expense') {
    const sign = entry.kind === 'credit' ? '+' : '−'
    return `${sign}${formatBalancePln(entry.amount)}`
  }
  return null
}

export function historyEntryMetaLines(entry) {
  const lines = []

  if (entry.kind === 'expense' || entry.meta?.expense) {
    const cat = expenseCategoryLabel(entry.meta?.category)
    if (cat) {
      lines.push(
        translate('finance.accounts.history.expenseCategory', { category: cat }),
      )
    }
    const purchase = purchaseTypeLabel(entry.meta?.purchase_type)
    if (purchase) {
      lines.push(
        translate('finance.accounts.history.expensePurchaseType', { type: purchase }),
      )
    }
  }

  const changes = entry.meta?.changes
  if (Array.isArray(changes)) {
    for (const c of changes) {
      const labelKey = FIELD_LABELS[c.field]
      const label = labelKey ? translate(labelKey) : c.field
      lines.push(
        translate('finance.accounts.history.metaLine', {
          field: label,
          from: c.from || '—',
          to: c.to || '—',
        }),
      )
    }
  }

  return lines
}

export function historyEntryBalanceLine(entry) {
  if (entry.kind === 'meta') return null
  return translate('finance.accounts.history.balanceLine', {
    before: formatBalancePln(entry.balance_before),
    after: formatBalancePln(entry.balance_after),
  })
}
