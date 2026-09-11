<template>
  <div class="min-h-full bg-white dark:bg-zinc-950">
    <!-- Mobile sidebar -->
    <TransitionRoot as="template" :show="sidebarOpen">
      <Dialog class="relative z-50 lg:hidden" @close="sidebarOpen = false">
        <TransitionChild
          as="template"
          enter="transition-opacity ease-linear duration-300"
          enter-from="opacity-0"
          enter-to=""
          leave="transition-opacity ease-linear duration-300"
          leave-from=""
          leave-to="opacity-0"
        >
          <div :class="sidebarClasses.mobileOverlay" />
        </TransitionChild>

        <div class="fixed inset-0 flex">
          <TransitionChild
            as="template"
            enter="transition ease-in-out duration-300 transform"
            enter-from="-translate-x-full"
            enter-to="translate-x-0"
            leave="transition ease-in-out duration-300 transform"
            leave-from="translate-x-0"
            leave-to="-translate-x-full"
          >
            <DialogPanel
              :class="['relative mr-14 flex w-full flex-1', sidebarLayout.mobilePanelMax]"
            >
              <TransitionChild
                as="template"
                enter="ease-in-out duration-300"
                enter-from="opacity-0"
                enter-to=""
                leave="ease-in-out duration-300"
                leave-from=""
                leave-to="opacity-0"
              >
                <div class="absolute top-0 left-full flex w-14 justify-center pt-5">
                  <button
                    type="button"
                    :class="sidebarClasses.mobileCloseBtn"
                    @click="sidebarOpen = false"
                  >
                    <span class="sr-only">Zamknij menu</span>
                    <XMarkIcon class="size-5" aria-hidden="true" />
                  </button>
                </div>
              </TransitionChild>

              <aside :class="sidebarClasses.mobilePanel">
                <AppSidebarNav @navigate="sidebarOpen = false" />
              </aside>
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </TransitionRoot>

    <!-- Desktop sidebar -->
    <aside :class="sidebarClasses.desktopShell">
      <AppSidebarNav />
    </aside>

    <!-- Mobile top bar -->
    <header :class="sidebarClasses.mobileHeader">
      <button
        type="button"
        :class="sidebarClasses.mobileMenuBtn"
        @click="sidebarOpen = true"
      >
        <span class="sr-only">Otwórz menu</span>
        <Bars3Icon class="size-5" aria-hidden="true" />
      </button>
      <p :class="sidebarClasses.mobileTitle">{{ currentPageTitle }}</p>
      <UserAccountMenu compact placement="down" />
    </header>

    <div
      :class="[sidebarLayout.mainOffset, sidebarLayout.mainPy, isInventory ? 'flex bg-white dark:bg-zinc-950' : '']"
    >
      <main
        :class="[
          'app-content-pane flex-1 min-w-0',
          sidebarLayout.mainInnerPad,
          isPortfolioRoute ? 'xl:pr-96' : '',
        ]"
      >
        <div class="xl:px-2">
          <div class="px-4 sm:px-6 lg:px-8">
            <AppPageSearch />
            <router-view />
          </div>
        </div>
      </main>
    </div>

    <aside
      v-if="isInventory && isPortfolioRoute"
      class="app-content-pane fixed inset-y-0 right-0 z-30 hidden w-96 overflow-y-auto border-l border-gray-200/80 bg-white px-4 pt-12 pb-6 dark:bg-zinc-950 sm:px-6 lg:px-8 xl:block"
    >
      <PortfolioValueChart :points="userAssets.chartPoints" plain />
    </aside>

    <DisplaySettingsDialog
      :open="displayStore.settingsOpen"
      @close="displayStore.closeSettings()"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Dialog, DialogPanel, TransitionChild, TransitionRoot } from '@headlessui/vue'
import { Bars3Icon, XMarkIcon } from '@heroicons/vue/24/outline'
import AppPageSearch from '../components/AppPageSearch.vue'
import AppSidebarNav from '../components/AppSidebarNav.vue'
import UserAccountMenu from '../components/UserAccountMenu.vue'
import DisplaySettingsDialog from '../components/DisplaySettingsDialog.vue'
import PortfolioValueChart from '../components/PortfolioValueChart.vue'
import { useDisplayStore } from '../stores/display'
import { useUserAssetsStore } from '../stores/userAssets'
import { useI18n } from '../composables/useI18n'
import { sidebarClasses, sidebarLayout, sidebarPageTitle } from '../config/sidebar'

const displayStore = useDisplayStore()
const route = useRoute()
const userAssets = useUserAssetsStore()
const { locale } = useI18n()
const sidebarOpen = ref(false)

const isInventory = computed(() => route.matched.some((r) => r.meta?.layout === 'inventory'))
const isPortfolioRoute = computed(() => route.name === 'FinancePortfolio')
const currentPageTitle = computed(() => {
  void locale.value
  return sidebarPageTitle(route.path)
})
</script>
