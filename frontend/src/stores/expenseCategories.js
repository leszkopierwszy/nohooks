import { defineStore } from 'pinia'
import { apiRequest } from '../api/client'
import { translate } from '../i18n'

/** Fallback builtins when API is unreachable (labels via i18n). */
export const BUILTIN_EXPENSE_CATEGORY_SLUGS = [
  'groceries',
  'transport',
  'dining',
  'housing',
  'health',
  'entertainment',
  'shopping',
  'subscriptions',
  'pets',
  'loterie',
  'other',
]

/** Category slug that unlocks lottery number entry on manual expenses. */
export const LOTTERY_EXPENSE_CATEGORY_SLUG = 'loterie'

function mapCategory(row) {
  if (!row) return null
  const slug = String(row.slug ?? '').trim()
  if (!slug) return null
  const builtin = Boolean(row.is_builtin)
  const i18nKey = `finance.accounts.expense.categories.${slug}`
  const translated = translate(i18nKey)
  const label =
    builtin && translated !== i18nKey
      ? translated
      : String(row.name ?? slug).trim() || slug

  return {
    id: row.id ?? null,
    value: slug,
    label,
    name: String(row.name ?? label),
    builtin,
  }
}

export const useExpenseCategoriesStore = defineStore('expenseCategories', {
  state: () => ({
    categories: [],
    loading: false,
    saving: false,
    error: null,
    loaded: false,
  }),

  getters: {
    options: (state) => state.categories.map(mapCategory).filter(Boolean),

    bySlug: (state) => (slug) => {
      if (!slug) return null
      const found = state.categories.find((c) => c.slug === slug)
      return mapCategory(found)
    },
  },

  actions: {
    ensureFallbackBuiltins() {
      if (this.categories.length) return
      this.categories = BUILTIN_EXPENSE_CATEGORY_SLUGS.map((slug) => ({
        id: null,
        slug,
        name: slug,
        is_builtin: true,
      }))
    },

    async fetchCategories({ force = false } = {}) {
      if (this.loading) return this.categories
      if (this.loaded && !force) return this.categories

      this.loading = true
      this.error = null
      try {
        const rows = await apiRequest('/expense-category')
        this.categories = Array.isArray(rows) ? rows : []
        this.loaded = true
        if (!this.categories.length) this.ensureFallbackBuiltins()
        return this.categories
      } catch (err) {
        this.error = err.message
        this.ensureFallbackBuiltins()
        throw err
      } finally {
        this.loading = false
      }
    },

    async createCategory(name) {
      const trimmed = String(name ?? '').trim()
      if (!trimmed) return null

      this.saving = true
      this.error = null
      try {
        const row = await apiRequest('/expense-category', {
          method: 'POST',
          body: JSON.stringify({ name: trimmed }),
        })
        const existingIdx = this.categories.findIndex((c) => c.slug === row.slug)
        if (existingIdx !== -1) {
          this.categories[existingIdx] = row
        } else {
          this.categories = [...this.categories, row]
        }
        this.loaded = true
        return mapCategory(row)
      } catch (err) {
        this.error = err.message
        throw err
      } finally {
        this.saving = false
      }
    },
  },
})

/** Resolve a stored category slug/value to a display label. */
export function expenseCategoryDisplayLabel(category) {
  if (!category) return ''
  const slug = String(category).trim()
  const i18nKey = `finance.accounts.expense.categories.${slug}`
  const translated = translate(i18nKey)
  if (translated !== i18nKey) return translated

  try {
    const store = useExpenseCategoriesStore()
    const found = store.bySlug(slug)
    if (found?.label) return found.label
  } catch {
    // Pinia may be unavailable outside app context.
  }

  return slug
}
