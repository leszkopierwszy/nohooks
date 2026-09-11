import { APP_SEARCH_COMMANDS } from '../constants/appSearchCommands'
import { APP_SEARCH_KIND, APP_SEARCH_KIND_ORDER } from '../constants/appSearchKinds'
import { translate as t } from '../i18n'
import { timelineEventTypeMeta } from '../constants/timelineEventTypes'
import { plannedExpenseIntervalLabel } from '../constants/plannedExpenseIntervals'
import { formatEventDate, formatTimeRange } from './calendarGrid'
import { formatMoney } from './currency'
import { eventNotes } from './timelineEvent'
import { eventMatchesTimelineSearch } from './timelineEventSearch'
import {
  anchorDateKey,
  displayDateKey,
  isYearlyRecurring,
  yearlyRecurrenceLabel,
} from './timelineRecurrence'

function normalizeHaystack(parts) {
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export function textMatchesQuery(haystack, query) {
  const q = String(query ?? '').trim().toLowerCase()
  if (!q) return false
  return String(haystack).toLowerCase().includes(q)
}

function entry(id, kind, title, subtitle, haystack, payload, extra = {}) {
  return {
    id,
    kind,
    kindLabel: t(`search.kinds.${kind}`) || kind,
    title,
    subtitle: subtitle ?? '',
    haystack: normalizeHaystack([title, subtitle, haystack]),
    payload,
    priority: extra.priority ?? 0,
    trailing: extra.trailing ?? null,
    sortKey: extra.sortKey ?? title.toLowerCase(),
  }
}

export function buildStaticPageEntries() {
  return [
    entry('page:home', APP_SEARCH_KIND.PAGE, t('nav.overview'), t('nav.overview'), 'home overview', {
      route: { name: 'Home' },
    }),
    entry('page:collection', APP_SEARCH_KIND.PAGE, t('nav.collection'), t('nav.collection'), 'collection', {
      route: { name: 'collection' },
    }),
    entry('page:souls-prims', APP_SEARCH_KIND.PAGE, t('nav.prims'), t('nav.souls'), 'souls prims', {
      route: { name: 'SoulsPrims' },
    }),
    entry('page:souls-animals', APP_SEARCH_KIND.PAGE, t('souls.animals.title'), t('nav.souls'), 'souls animals', {
      route: { name: 'SoulsAnimals' },
    }),
    entry('page:finance', APP_SEARCH_KIND.PAGE, t('nav.finance'), t('nav.finance'), 'finance', {
      route: { name: 'Finance' },
    }),
    entry('page:finance-portfolio', APP_SEARCH_KIND.PAGE, t('nav.finance'), t('nav.finance'), 'portfolio', {
      route: { name: 'FinancePortfolio' },
    }),
    entry('page:finance-savings', APP_SEARCH_KIND.PAGE, t('nav.finance'), t('nav.finance'), 'savings', {
      route: { name: 'FinanceSavings' },
    }),
    entry('page:finance-mock', APP_SEARCH_KIND.PAGE, t('nav.finance'), t('nav.finance'), 'finance mock', {
      route: { name: 'FinanceMockAssets' },
    }),
    entry('page:growth', APP_SEARCH_KIND.PAGE, t('nav.growth'), t('nav.growth'), 'growth', {
      route: { name: 'GrowthGoals' },
    }),
    entry('page:calendar', APP_SEARCH_KIND.PAGE, t('nav.calendar'), t('nav.calendar'), 'calendar timeline', {
      route: { name: 'Calendar' },
    }),
    entry('page:items', APP_SEARCH_KIND.PAGE, t('nav.items'), t('nav.items'), 'items', {
      route: { name: 'Items' },
    }),
    entry('page:account', APP_SEARCH_KIND.PAGE, t('account.title'), t('account.section'), 'account settings', {
      route: { name: 'AccountSettings' },
    }),
    entry('page:backend', APP_SEARCH_KIND.PAGE, t('account.nav.backend'), t('account.nav.backend'), 'backend model assistant langfuse', {
      route: { name: 'AccountBackend' },
    }),
  ]
}

export function buildCalendarEventEntry(event) {
  const typeLabel = timelineEventTypeMeta(event.type).label
  const subtitle = [
    formatEventDate(displayDateKey(event)),
    isYearlyRecurring(event) && yearlyRecurrenceLabel(event) ? yearlyRecurrenceLabel(event) : '',
    formatTimeRange(event),
    typeLabel,
    event.location,
    eventNotes(event),
  ]
    .filter(Boolean)
    .join(' · ')

  const trailing =
    event.type === 'planned_expense' && event.planned_amount != null
      ? formatMoney(event.planned_amount, event.currency ?? 'PLN')
      : null

  return entry(
    `calendar_event:${event.id}`,
    APP_SEARCH_KIND.CALENDAR_EVENT,
    event.label,
    subtitle,
    [
      event.label,
      event.location,
      eventNotes(event),
      event.link,
      typeLabel,
      displayDateKey(event),
      anchorDateKey(event),
      plannedExpenseIntervalLabel(event.recurrence),
    ].join(' '),
    event,
    {
      trailing,
      sortKey: `${displayDateKey(event)}T${event.start_time ?? '00:00:00'}`,
    },
  )
}

export function buildItemEntry(item, collection) {
  const colName = collection?.name ?? item.category ?? ''
  return entry(
    `item:${item.id}`,
    APP_SEARCH_KIND.ITEM,
    item.name,
    [colName, item.brand, item.color, item.description].filter(Boolean).join(' · '),
    [item.name, item.brand, item.color, item.description, item.notes, colName, item.collection_group].join(' '),
    { item, collection },
  )
}

export function buildCollectionEntry(collection) {
  const count = collection.items?.length ?? 0
  return entry(
    `collection:${collection.id}`,
    APP_SEARCH_KIND.COLLECTION,
    collection.name,
    count === 1 ? '1 item' : `${count} itemów`,
    [collection.name, collection.description].join(' '),
    collection,
  )
}

export function buildPersonaEntry(persona) {
  return entry(
    `persona:${persona.id}`,
    APP_SEARCH_KIND.PERSONA,
    persona.name,
    persona.role ?? persona.description ?? '',
    [persona.name, persona.role, persona.description, persona.notes].join(' '),
    persona,
  )
}

export function buildSavingsTargetEntry(target) {
  return entry(
    `savings_target:${target.id}`,
    APP_SEARCH_KIND.SAVINGS_TARGET,
    target.name,
    target.type === 'm2m' ? 'Target M2M' : `Kwota: ${target.amount ?? 0} PLN`,
    [target.name, target.type, target.amount].join(' '),
    target,
  )
}

export function buildPortfolioAssetEntry(asset) {
  return entry(
    `portfolio_asset:${asset.id}`,
    APP_SEARCH_KIND.PORTFOLIO_ASSET,
    asset.name,
    [asset.category, asset.tracking_mode === 'unit_price' ? 'cena jednostkowa' : 'wartość ręczna'].filter(Boolean).join(' · '),
    [asset.name, asset.category, asset.price_url].join(' '),
    asset,
  )
}

export function buildFinanceAccountEntry(account) {
  return entry(
    `finance_account:${account.id}`,
    APP_SEARCH_KIND.FINANCE_ACCOUNT,
    account.account_name || account.name,
    [account.name, account.category, account.balance].filter(Boolean).join(' · '),
    [account.name, account.account_name, account.account_number, account.category, account.balance].join(' '),
    account,
    { trailing: account.balance || null },
  )
}

export function collectItemsForSearch(collections, allItemsList) {
  const byId = new Map()
  for (const item of allItemsList ?? []) {
    if (item?.id != null) byId.set(item.id, item)
  }
  for (const collection of collections ?? []) {
    for (const item of collection.items ?? []) {
      if (item?.id != null && !byId.has(item.id)) byId.set(item.id, item)
    }
  }
  return [...byId.values()]
}

export function findCollectionForItem(item, collections) {
  if (item?.category_id != null) {
    const byId = collections.find((c) => String(c.id) === String(item.category_id))
    if (byId) return byId
  }
  if (item?.category) {
    const byName = collections.find((c) => c.name === item.category)
    if (byName) return byName
  }
  for (const collection of collections) {
    if (collection.items?.some((i) => i.id === item.id)) return collection
  }
  return null
}

const COMMANDS_BY_PREFIX_LENGTH = [...APP_SEARCH_COMMANDS].sort(
  (a, b) => b.prefix.length - a.prefix.length,
)

export function parseAppSearchQuery(query) {
  const trimmed = String(query ?? '').trim()
  const lower = trimmed.toLowerCase()

  for (const cmd of COMMANDS_BY_PREFIX_LENGTH) {
    if (lower.startsWith(cmd.prefix)) {
      return {
        command: cmd,
        restQuery: trimmed.slice(cmd.prefix.length).trim(),
        suggestions: [],
      }
    }
  }

  const suggestions =
    trimmed && !trimmed.includes(' ')
      ? APP_SEARCH_COMMANDS.filter((cmd) => {
          const token = lower.replace(/:$/, '')
          return (
            cmd.prefix.startsWith(lower) ||
            cmd.id.startsWith(token) ||
            cmd.label.toLowerCase().startsWith(lower)
          )
        })
      : []

  return { command: null, restQuery: trimmed, suggestions }
}

export function buildCommandGoEntry(cmd, { hintPrefix = true } = {}) {
  return {
    id: `command:${cmd.id}`,
    kind: APP_SEARCH_KIND.COMMAND,
    kindLabel: t('search.kinds.command'),
    title: cmd.label,
    subtitle: hintPrefix ? `${cmd.description} · ${cmd.prefix}` : cmd.description,
    haystack: normalizeHaystack([cmd.prefix, cmd.label, cmd.description, cmd.id]),
    payload: { route: cmd.route, command: cmd },
    trailing: cmd.prefix,
    sortKey: `0_${cmd.prefix}`,
    _rank: -2,
  }
}

export function buildCommandPaletteEntries(commands = APP_SEARCH_COMMANDS) {
  return commands.map((cmd) => buildCommandGoEntry(cmd))
}

function entryMatchesCommand(row, command) {
  if (!command?.kinds?.length) return false

  if (row.kind === APP_SEARCH_KIND.CALENDAR_EVENT) {
    if (!command.kinds.includes(APP_SEARCH_KIND.CALENDAR_EVENT)) return false
    if (command.eventTypes?.length) {
      return command.eventTypes.includes(row.payload?.type)
    }
    return true
  }

  if (row.kind === APP_SEARCH_KIND.PAGE) {
    if (!command.kinds.includes(APP_SEARCH_KIND.PAGE)) return false
    if (command.pageRoutes?.length) {
      const name = row.payload?.route?.name
      return command.pageRoutes.includes(name)
    }
    return command.id === 'nav'
  }

  return command.kinds.includes(row.kind)
}

export function searchContextFromRoute(route) {
  const name = route.name
  const path = route.path

  if (name === 'Calendar' || path.startsWith('/calendar')) {
    return { priorityKinds: [APP_SEARCH_KIND.CALENDAR_EVENT, APP_SEARCH_KIND.PAGE] }
  }
  if (path.startsWith('/finance') || name?.startsWith('Finance')) {
    return {
      priorityKinds: [
        APP_SEARCH_KIND.SAVINGS_TARGET,
        APP_SEARCH_KIND.PORTFOLIO_ASSET,
        APP_SEARCH_KIND.FINANCE_ACCOUNT,
        APP_SEARCH_KIND.CALENDAR_EVENT,
        APP_SEARCH_KIND.PAGE,
      ],
    }
  }
  if (name === 'Items' || path === '/items') {
    return { priorityKinds: [APP_SEARCH_KIND.ITEM, APP_SEARCH_KIND.PAGE] }
  }
  if (path.startsWith('/souls') || path.startsWith('/personas') || name?.startsWith('persona') || name?.startsWith('Prim')) {
    return { priorityKinds: [APP_SEARCH_KIND.PERSONA, APP_SEARCH_KIND.PAGE] }
  }
  if (path.startsWith('/collection') || name?.startsWith('collection')) {
    return { priorityKinds: [APP_SEARCH_KIND.ITEM, APP_SEARCH_KIND.COLLECTION, APP_SEARCH_KIND.PAGE] }
  }
  return { priorityKinds: [APP_SEARCH_KIND.PAGE] }
}

function kindPriority(kind, context) {
  const list = context?.priorityKinds ?? []
  const idx = list.indexOf(kind)
  return idx === -1 ? 100 + APP_SEARCH_KIND_ORDER.indexOf(kind) : idx
}

export function filterAppSearchIndex(entries, query, context) {
  const parsed = parseAppSearchQuery(query)
  const { command, restQuery, suggestions } = parsed

  if (!command && !restQuery) {
    return []
  }

  const calendarOnly = context?.calendarFilter === true
  let pool = entries

  if (command) {
    pool = entries.filter((row) => entryMatchesCommand(row, command))
  }

  const navEntry = command ? buildCommandGoEntry(command, { hintPrefix: false }) : null

  const filtered = pool.filter((row) => {
    if (!restQuery) return true
    if (calendarOnly && row.kind === APP_SEARCH_KIND.CALENDAR_EVENT) {
      return eventMatchesTimelineSearch(row.payload, restQuery)
    }
    return textMatchesQuery(row.haystack, restQuery)
  })

  const combined = navEntry ? [navEntry, ...filtered] : filtered

  return combined
    .map((row) => ({
      ...row,
      _rank: row._rank ?? kindPriority(row.kind, context),
    }))
    .sort((a, b) => {
      if (a._rank !== b._rank) return a._rank - b._rank
      if (a.kind === APP_SEARCH_KIND.CALENDAR_EVENT && b.kind === APP_SEARCH_KIND.CALENDAR_EVENT) {
        return String(a.sortKey).localeCompare(String(b.sortKey))
      }
      return a.title.localeCompare(b.title, 'pl')
    })
    .slice(0, 80)
}

/** Tekst używany do filtrowania kalendarza (np. po `cal:netflix`). */
export function calendarFilterQueryFromSearch(query) {
  const { command, restQuery } = parseAppSearchQuery(query)
  if (command && !command.kinds?.includes(APP_SEARCH_KIND.CALENDAR_EVENT)) {
    return { active: false, text: '', command }
  }
  if (command?.eventTypes?.length) {
    return { active: true, text: restQuery, command, eventTypes: command.eventTypes }
  }
  if (command) {
    return { active: true, text: restQuery, command, eventTypes: null }
  }
  return { active: Boolean(restQuery), text: restQuery, command: null, eventTypes: null }
}

export function groupAppSearchResults(results) {
  const groups = new Map()
  for (const row of results) {
    if (!groups.has(row.kind)) {
      groups.set(row.kind, { kind: row.kind, label: row.kindLabel, items: [] })
    }
    groups.get(row.kind).items.push(row)
  }
  return APP_SEARCH_KIND_ORDER.map((kind) => groups.get(kind)).filter(Boolean)
}
