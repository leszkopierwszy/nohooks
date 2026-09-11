import { APP_SEARCH_KIND } from './appSearchKinds'

/** Prefiksy w pasku wyszukiwania — nawigacja i filtrowanie wyników. */
export const APP_SEARCH_COMMANDS = [
  {
    id: 'cal',
    prefix: 'cal:',
    label: 'Calendar',
    description: 'Wydarzenia i kalendarz',
    route: { name: 'Calendar' },
    kinds: [APP_SEARCH_KIND.CALENDAR_EVENT],
    eventTypes: null,
    pageRoutes: ['Calendar'],
  },
  {
    id: 'exp',
    prefix: 'exp:',
    label: 'Expenses',
    description: 'Zaplanowane wydatki',
    route: { name: 'Finance' },
    kinds: [APP_SEARCH_KIND.CALENDAR_EVENT],
    eventTypes: ['planned_expense'],
    pageRoutes: ['Finance'],
  },
  {
    id: 'fin',
    prefix: 'fin:',
    label: 'Finance',
    description: 'Targety, portfel, konta, finanse',
    route: { name: 'Finance' },
    kinds: [
      APP_SEARCH_KIND.SAVINGS_TARGET,
      APP_SEARCH_KIND.PORTFOLIO_ASSET,
      APP_SEARCH_KIND.FINANCE_ACCOUNT,
      APP_SEARCH_KIND.CALENDAR_EVENT,
    ],
    eventTypes: ['planned_expense'],
    pageRoutes: ['Finance', 'FinancePortfolio', 'FinanceSavings', 'FinanceMockAssets'],
  },
  {
    id: 'item',
    prefix: 'item:',
    label: 'Items',
    description: 'Przedmioty w kolekcjach',
    route: { name: 'Items' },
    kinds: [APP_SEARCH_KIND.ITEM],
    pageRoutes: ['Items', 'collection', 'collection-all', 'collection-category', 'item-overview'],
  },
  {
    id: 'col',
    prefix: 'col:',
    label: 'Collection',
    description: 'Kategorie kolekcji',
    route: { name: 'collection' },
    kinds: [APP_SEARCH_KIND.COLLECTION, APP_SEARCH_KIND.ITEM],
    pageRoutes: ['collection', 'collection-all', 'collection-category'],
  },
  {
    id: 'per',
    prefix: 'per:',
    label: 'Prims',
    description: 'Souls — Prims',
    route: { name: 'SoulsPrims' },
    kinds: [APP_SEARCH_KIND.PERSONA],
    pageRoutes: ['SoulsPrims', 'PrimOverview'],
  },
  {
    id: 'nav',
    prefix: 'nav:',
    label: 'Nawigacja',
    description: 'Strony aplikacji',
    route: { name: 'Home' },
    kinds: [APP_SEARCH_KIND.PAGE],
    pageRoutes: null,
  },
]

export const APP_SEARCH_COMMAND_HINT =
  'cal: · exp: · fin: · item: · col: · per: · nav:'
