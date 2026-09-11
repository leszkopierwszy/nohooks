import { defineStore } from 'pinia'
import { addDaysToDateKey, toDateKey } from '../utils/calendarGrid'
import {
  buildCalendarEventEntry,
  buildCollectionEntry,
  buildFinanceAccountEntry,
  buildItemEntry,
  buildPersonaEntry,
  buildPortfolioAssetEntry,
  buildSavingsTargetEntry,
  buildStaticPageEntries,
  collectItemsForSearch,
  findCollectionForItem,
} from '../utils/appSearch'
import { mockFinanceAccounts } from '../utils/savingsAssets'
import { useFinanceAccountsStore } from './financeAccounts'
import { usePetExpenseAccountsStore } from './petExpenseAccounts'
import { useCollectionStore } from './collection'
import { usePersonasStore } from './personas'
import { useSavingsTargetsStore } from './savingsTargets'
import { useTimelineStore } from './timeline'
import { useUserAssetsStore } from './userAssets'

const SEARCH_BACK_DAYS = 365
const SEARCH_FORWARD_DAYS = 90

export const useAppSearchStore = defineStore('appSearch', {
  state: () => ({
    query: '',
    index: [],
    indexReady: false,
    indexing: false,
  }),

  actions: {
    async ensureIndex({ force = false } = {}) {
      if (this.indexing) return
      if (this.indexReady && !force) return

      this.indexing = true

      const timelineStore = useTimelineStore()
      const collectionStore = useCollectionStore()
      const personasStore = usePersonasStore()
      const savingsStore = useSavingsTargetsStore()
      const userAssets = useUserAssetsStore()

      const today = toDateKey(new Date())

      try {
        await Promise.all([
          timelineStore
            .fetchEvents({
              from: addDaysToDateKey(today, -SEARCH_BACK_DAYS),
              to: addDaysToDateKey(today, SEARCH_FORWARD_DAYS),
            })
            .catch(() => {}),
          collectionStore.fetchCollections().catch(() => {}),
          collectionStore.fetchAllItems().catch(() => {}),
          personasStore.fetchPersonas().catch(() => {}),
          savingsStore.fetchTargets().catch(() => {}),
          timelineStore.fetchPlannedExpenses().catch(() => {}),
        ])

        const entries = [...buildStaticPageEntries()]

        for (const event of timelineStore.events) {
          entries.push(buildCalendarEventEntry(event))
        }

        const collections = collectionStore.collections
        for (const collection of collections) {
          entries.push(buildCollectionEntry(collection))
        }

        const items = collectItemsForSearch(collections, collectionStore.allItemsList)
        for (const item of items) {
          entries.push(buildItemEntry(item, findCollectionForItem(item, collections)))
        }

        for (const persona of personasStore.prims) {
          entries.push(buildPersonaEntry(persona))
        }

        for (const target of savingsStore.targets) {
          entries.push(buildSavingsTargetEntry(target))
        }

        for (const asset of userAssets.assets) {
          entries.push(buildPortfolioAssetEntry(asset))
        }

        useFinanceAccountsStore().reload()
        usePetExpenseAccountsStore().reload()
        for (const account of mockFinanceAccounts()) {
          entries.push(buildFinanceAccountEntry(account))
        }

        this.index = entries
        this.indexReady = true
      } finally {
        this.indexing = false
      }
    },

    setQuery(value) {
      this.query = value ?? ''
    },

    clearQuery() {
      this.query = ''
    },
  },
})
