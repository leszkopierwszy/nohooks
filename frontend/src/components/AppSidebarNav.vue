<template>
  <div :class="sidebarClasses.navRoot">
    <div :class="sidebarClasses.brandRow">
      <span :class="sidebarClasses.brandText">{{ brandLabel }}</span>
    </div>

    <nav :class="sidebarClasses.navSection" aria-label="Główne">
      <ul role="list" :class="sidebarClasses.navList">
        <li v-for="item in sidebarNavigation" :key="item.labelKey">
          <div class="flex items-stretch gap-0.5">
            <SidebarNavLink
              :item="item"
              class="min-w-0 flex-1"
              @navigate="emit('navigate')"
            />
            <button
              v-if="item.subItems?.length"
              type="button"
              class="flex shrink-0 items-center justify-center rounded-lg px-2 text-gray-400 transition hover:bg-gray-900/[0.04] hover:text-gray-700"
              :aria-expanded="isGroupOpen(item)"
              :aria-label="toggleLabel(item)"
              @click.stop="toggleGroup(item)"
            >
              <ChevronDownIcon
                class="size-4 transition-transform duration-200"
                :class="isGroupOpen(item) ? 'rotate-180' : ''"
                aria-hidden="true"
              />
            </button>
          </div>

          <div
            v-if="item.subItems?.length && isGroupOpen(item)"
            :class="sidebarClasses.navSubList"
          >
            <SidebarSubNavLink
              v-for="sub in item.subItems"
              :key="sub.labelKey"
              :item="sub"
              @navigate="emit('navigate')"
            />
          </div>
        </li>
      </ul>

      <div :class="sidebarClasses.navAccountSection">
        <p :class="sidebarClasses.navGroupLabel">{{ t('account.section') }}</p>
        <ul role="list" :class="sidebarClasses.navAccountList">
          <li v-for="item in sidebarAccountNavigation" :key="item.labelKey">
            <SidebarNavLink :item="item" @navigate="emit('navigate')" />
          </li>
        </ul>
      </div>

      <ul role="list" :class="[sidebarClasses.navFooter, 'list-none']">
        <li>
          <UserAccountMenu sidebar />
        </li>
      </ul>
    </nav>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
import { useRoute } from 'vue-router'
import { ChevronDownIcon } from '@heroicons/vue/24/outline'
import SidebarNavLink from './SidebarNavLink.vue'
import SidebarSubNavLink from './SidebarSubNavLink.vue'
import UserAccountMenu from './UserAccountMenu.vue'
import { useI18n } from '../composables/useI18n'
import { useUserStore } from '../stores/user'
import {
  sidebarBrandText,
  sidebarClasses,
  sidebarNavigation,
  sidebarAccountNavigationForUser,
  isNavGroupActive,
} from '../config/sidebar'
import { useSiteConfigStore } from '../stores/siteConfig'

const { t } = useI18n()
const emit = defineEmits(['navigate'])
const route = useRoute()
const userStore = useUserStore()
const siteConfig = useSiteConfigStore()

const brandLabel = computed(() => siteConfig.appName || sidebarBrandText)

const sidebarAccountNavigation = computed(() =>
  sidebarAccountNavigationForUser({ isAdmin: userStore.isAdmin }),
)

/** labelKey → true (wymuszone otwarte) | false (wymuszone zamknięte) */
const groupOverrides = ref({})

function isGroupOpen(item) {
  const override = groupOverrides.value[item.labelKey]
  if (override === false) return false
  if (override === true) return true
  return isNavGroupActive(item, route.path)
}

function toggleGroup(item) {
  groupOverrides.value = {
    ...groupOverrides.value,
    [item.labelKey]: !isGroupOpen(item),
  }
}

function toggleLabel(item) {
  return isGroupOpen(item)
    ? t('sidebar.collapseGroup', { name: t(item.labelKey) })
    : t('sidebar.expandGroup', { name: t(item.labelKey) })
}

function syncExpandedFromRoute(path) {
  const next = { ...groupOverrides.value }
  for (const item of sidebarNavigation) {
    if (!item.subItems?.length) continue
    if (!isNavGroupActive(item, path)) {
      delete next[item.labelKey]
    }
  }
  groupOverrides.value = next
}

watch(() => route.path, syncExpandedFromRoute, { immediate: true })
</script>
