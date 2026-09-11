<template>
  <div class="mx-auto mb-8 max-w-sm">
    <button
      type="button"
      class="flex w-full items-center gap-2.5 rounded-xl border border-gray-200/80 bg-white px-3 py-2 text-left shadow-sm ring-1 ring-gray-900/5 transition hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2"
      :aria-label="`${t('search.openLabel')} (${searchShortcutLabel})`"
      @click="openModal"
    >
      <MagnifyingGlassIcon class="size-4 shrink-0 text-gray-400" aria-hidden="true" />
      <span class="min-w-0 flex-1 truncate text-xs text-gray-500">
        {{ query ? query : t('search.trigger') }}
      </span>
      <kbd
        class="hidden shrink-0 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-px font-sans text-[10px] font-medium leading-tight text-gray-500 sm:inline"
      >
        {{ searchShortcutLabel }}
      </kbd>
    </button>
  </div>

  <TransitionRoot as="template" :show="modalOpen">
    <Dialog class="relative z-50" @close="closeModal">
      <TransitionChild
        as="template"
        enter="ease-out duration-200"
        enter-from="opacity-0"
        enter-to="opacity-100"
        leave="ease-in duration-150"
        leave-from="opacity-100"
        leave-to="opacity-0"
      >
        <div class="fixed inset-0 bg-gray-500/75" aria-hidden="true" />
      </TransitionChild>

      <div class="fixed inset-0 z-10 overflow-y-auto p-4 sm:p-6">
        <div class="flex min-h-full items-center justify-center py-8">
          <TransitionChild
            as="template"
            enter="ease-out duration-200"
            enter-from="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enter-to="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-150"
            leave-from="opacity-100 translate-y-0 sm:scale-100"
            leave-to="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <DialogPanel
              class="flex max-h-[min(40rem,85vh)] w-full max-w-2xl transform flex-col gap-5 overflow-hidden rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-gray-900/5 sm:p-8"
            >
              <div>
                <label :for="searchId" class="sr-only">{{ t('search.trigger') }}</label>
                <div class="relative">
                  <div
                    class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5"
                    aria-hidden="true"
                  >
                    <MagnifyingGlassIcon class="size-5 text-gray-400" />
                  </div>
                  <input
                    :id="searchId"
                    ref="searchInputRef"
                    v-model="query"
                    type="search"
                    :placeholder="t('search.inputPlaceholder')"
                    class="block w-full rounded-xl border-0 bg-gray-50 py-3 pl-10 pr-10 font-mono text-sm text-gray-900 ring-1 ring-inset ring-gray-200 placeholder:font-sans placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm/6"
                    @keydown.esc.stop
                    @keydown.enter.prevent="onSubmitSearch"
                  />
                  <button
                    v-if="query"
                    type="button"
                    class="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
                    :aria-label="t('search.clear')"
                    @click="clearQuery"
                  >
                    <XMarkIcon class="size-5" aria-hidden="true" />
                  </button>
                </div>
                <div
                  v-if="activeCommand"
                  class="mt-2 flex items-center gap-2 text-xs text-gray-600"
                >
                  <span
                    class="rounded-md bg-gray-900/[0.06] px-1.5 py-0.5 font-mono text-[11px] font-medium text-gray-800"
                  >
                    {{ activeCommand.prefix }}
                  </span>
                  <span>{{ activeCommand.description }}</span>
                </div>
                <p v-if="contextHint" class="mt-2 text-xs text-gray-500">{{ contextHint }}</p>
              </div>

              <nav
                v-if="!groupedResults.length"
                class="shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50/50"
                :aria-label="t('search.commands')"
              >
                <p class="border-b border-gray-100 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                  {{ t('search.commands') }}
                </p>
                <ul class="divide-y divide-gray-100">
                  <li v-for="cmd in searchCommands" :key="cmd.id">
                    <button
                      type="button"
                      class="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                      @click="applyCommandFromList(cmd)"
                    >
                      <span class="w-11 shrink-0 pt-0.5 font-mono text-xs font-semibold text-gray-900">
                        {{ cmd.prefix }}
                      </span>
                      <span class="min-w-0 flex-1">
                        <span class="block text-sm font-medium text-gray-900">{{ cmd.label }}</span>
                        <span class="mt-0.5 block text-xs leading-snug text-gray-500">
                          {{ cmd.description }}
                        </span>
                      </span>
                    </button>
                  </li>
                </ul>
              </nav>

              <div
                v-if="groupedResults.length"
                class="min-h-[12rem] flex-1 overflow-y-auto rounded-xl border border-gray-100 bg-gray-50/50 sm:min-h-[16rem]"
                role="listbox"
              >
                <section
                  v-for="group in groupedResults"
                  :key="group.kind"
                  class="border-b border-gray-100 last:border-b-0"
                >
                  <p class="sticky top-0 z-[1] bg-gray-50/95 px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400 backdrop-blur-sm">
                    {{ group.label }}
                  </p>
                  <ul class="divide-y divide-gray-100 px-1 pb-1">
                    <li v-for="hit in group.items" :key="hit.id">
                      <button
                        type="button"
                        class="flex w-full gap-3 rounded-lg px-3 py-3 text-left hover:bg-white focus:bg-white focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-600"
                        role="option"
                        @click="selectHit(hit)"
                      >
                        <span
                          v-if="hit.kind === APP_SEARCH_KIND.CALENDAR_EVENT"
                          v-bind="timelineEventDotAttrs(hit.payload, 'size-2')"
                        />
                        <span
                          v-else-if="hit.kind === APP_SEARCH_KIND.COMMAND"
                          class="mt-1 flex shrink-0 rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px] font-medium text-gray-700"
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <span
                          v-else
                          class="mt-1.5 size-2 shrink-0 rounded-full bg-gray-300"
                          aria-hidden="true"
                        />
                        <span class="min-w-0 flex-1">
                          <span class="block truncate text-sm font-medium text-gray-900">
                            {{ hit.title }}
                          </span>
                          <span v-if="hit.subtitle" class="mt-0.5 block truncate text-xs text-gray-500">
                            {{ hit.subtitle }}
                          </span>
                        </span>
                        <span
                          v-if="hit.trailing"
                          class="shrink-0 text-xs font-medium text-gray-600 tabular-nums"
                        >
                          {{ hit.trailing }}
                        </span>
                      </button>
                    </li>
                  </ul>
                </section>
              </div>

              <p
                v-else-if="hasQuery"
                class="flex min-h-[8rem] flex-1 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-6 py-8 text-center text-sm text-amber-700"
              >
                {{ t('search.noResults', { query: query.trim() }) }}
              </p>

              <div
                v-if="hasQuery && results.length"
                class="border-t border-gray-100 pt-3 text-xs text-gray-500"
              >
                {{ results.length }} {{ resultsCountLabel }}
              </div>
            </DialogPanel>
          </TransitionChild>
        </div>
      </div>
    </Dialog>
  </TransitionRoot>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  Dialog,
  DialogPanel,
  TransitionChild,
  TransitionRoot,
} from '@headlessui/vue'
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/vue/24/outline'
import { APP_SEARCH_KIND } from '../constants/appSearchKinds'
import { useAppSearch } from '../composables/useAppSearch'
import { timelineEventDotAttrs } from '../utils/timelineEventColor'
import { detectMacPlatform, searchShortcutLabel as formatSearchShortcut } from '../utils/platformShortcut'
import { useI18n } from '../composables/useI18n'

const props = defineProps({
  idPrefix: {
    type: String,
    default: 'app',
  },
})

const { t } = useI18n()

const route = useRoute()
const {
  query,
  results,
  groupedResults,
  hasQuery,
  activeCommand,
  searchCommands,
  applyCommandPrefix,
  selectResult,
  ensureIndex,
} = useAppSearch({ loadOnMount: false })

const modalOpen = ref(false)
const searchInputRef = ref(null)
const isMac = ref(false)

const searchId = computed(() => `${props.idPrefix}-search-modal`)
const searchShortcutLabel = computed(() => formatSearchShortcut(isMac.value))

function onSubmitSearch() {
  const first = results.value[0]
  if (first) selectHit(first)
}

const resultsCountLabel = computed(() => {
  const n = results.value.length
  if (n === 1) return t('search.results.one')
  if (n < 5) return t('search.results.few')
  return t('search.results.many')
})

const contextHint = computed(() => {
  if (activeCommand.value) {
    return t('search.context.filterActive', { label: activeCommand.value.label })
  }
  if (route.name === 'Calendar' || route.path.startsWith('/calendar')) {
    return t('search.context.calendar')
  }
  if (route.path.startsWith('/finance')) {
    return t('search.context.finance')
  }
  if (route.path.startsWith('/collection') || route.name === 'Items') {
    return t('search.context.collection')
  }
  if (route.path.startsWith('/souls') || route.path.startsWith('/personas')) {
    return t('search.context.personas')
  }
  return null
})

function openModal() {
  ensureIndex().catch(() => {})
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
}

function clearQuery() {
  query.value = ''
  searchInputRef.value?.focus()
}

function selectHit(hit) {
  selectResult(hit)
  closeModal()
}

function applyCommandFromList(cmd) {
  applyCommandPrefix(cmd)
  searchInputRef.value?.focus()
}

function onSearchHotkey(event) {
  const key = event.key?.toLowerCase()
  if (key !== 'k') return
  if (!(event.metaKey || event.ctrlKey)) return

  event.preventDefault()
  if (modalOpen.value) {
    closeModal()
  } else {
    openModal()
  }
}

watch(modalOpen, async (open) => {
  if (open) {
    await nextTick()
    searchInputRef.value?.focus()
  }
})

onMounted(() => {
  isMac.value = detectMacPlatform()
  window.addEventListener('keydown', onSearchHotkey)
  ensureIndex().catch(() => {})
})

onUnmounted(() => {
  window.removeEventListener('keydown', onSearchHotkey)
})

defineExpose({ open: openModal, close: closeModal, clear: clearQuery })
</script>
