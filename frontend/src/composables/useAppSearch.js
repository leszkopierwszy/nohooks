import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { APP_SEARCH_KIND } from '../constants/appSearchKinds'
import { parseAppSearchQuery } from '../utils/appSearch'
import { APP_SEARCH_COMMANDS } from '../constants/appSearchCommands'
import { filterAppSearchIndex, groupAppSearchResults, searchContextFromRoute } from '../utils/appSearch'
import { useAppSearchStore } from '../stores/appSearch'

export function useAppSearch({ loadOnMount = true } = {}) {
  const route = useRoute()
  const router = useRouter()
  const store = useAppSearchStore()

  const context = computed(() => {
    const base = searchContextFromRoute(route)
    if (route.name === 'Calendar' || route.path.startsWith('/calendar')) {
      return { ...base, calendarFilter: true }
    }
    return base
  })

  const query = computed({
    get: () => store.query,
    set: (value) => store.setQuery(value),
  })

  const results = computed(() =>
    filterAppSearchIndex(store.index, store.query, context.value),
  )

  const groupedResults = computed(() => groupAppSearchResults(results.value))

  const parsedQuery = computed(() => parseAppSearchQuery(store.query))

  const activeCommand = computed(() => parsedQuery.value.command)

  const commandSuggestions = computed(() => parsedQuery.value.suggestions)

  const hasQuery = computed(() => Boolean(store.query.trim()))

  function applyCommandPrefix(cmd) {
    store.setQuery(cmd.prefix)
  }

  async function ensureIndex() {
    await store.ensureIndex()
  }

  function selectResult(hit) {
    if (!hit) return

    switch (hit.kind) {
      case APP_SEARCH_KIND.COMMAND:
        if (hit.payload?.command) {
          store.setQuery(hit.payload.command.prefix)
        }
        if (hit.payload?.route) router.push(hit.payload.route)
        break

      case APP_SEARCH_KIND.PAGE:
        if (hit.payload?.route) router.push(hit.payload.route)
        break

      case APP_SEARCH_KIND.CALENDAR_EVENT:
        router.push({ name: 'Calendar', query: { eventId: hit.payload.id } })
        break

      case APP_SEARCH_KIND.ITEM: {
        const item = hit.payload.item
        const collection = hit.payload.collection
        const colName = collection?.name ?? item.category ?? 'all'
        router.push({
          name: 'item-overview',
          params: { name: colName, item_name: String(item.id) },
          query: collection?.id ? { groupId: collection.id } : {},
        })
        break
      }

      case APP_SEARCH_KIND.COLLECTION:
        router.push({
          name: 'collection-category',
          params: { name: hit.payload.name },
          query: { groupId: hit.payload.id },
        })
        break

      case APP_SEARCH_KIND.PERSONA:
        router.push({ name: 'PrimOverview', params: { id: hit.payload.id } })
        break

      case APP_SEARCH_KIND.SAVINGS_TARGET:
        router.push({ name: 'FinanceSavings' })
        break

      case APP_SEARCH_KIND.PORTFOLIO_ASSET:
        router.push({ name: 'FinancePortfolio' })
        break

      case APP_SEARCH_KIND.FINANCE_ACCOUNT:
        router.push({ name: 'FinanceMockAssets' })
        break

      default:
        break
    }
  }

  if (loadOnMount) {
    onMounted(() => {
      ensureIndex().catch(() => {})
    })
  }

  return {
    query,
    results,
    groupedResults,
    hasQuery,
    activeCommand,
    commandSuggestions,
    searchCommands: APP_SEARCH_COMMANDS,
    applyCommandPrefix,
    ensureIndex,
    selectResult,
    indexing: computed(() => store.indexing),
    indexReady: computed(() => store.indexReady),
  }
}
