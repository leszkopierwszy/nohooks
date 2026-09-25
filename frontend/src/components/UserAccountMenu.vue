<template>
  <Menu as="div" class="relative w-full">
    <MenuButton
      type="button"
      :class="[
        compact
          ? 'relative flex rounded-full focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900'
          : sidebar
            ? sidebarClasses.accountButton
            : 'flex w-full items-center gap-x-4 px-6 py-6 pb-6 text-sm/6 font-semibold text-gray-900 hover:bg-gray-50',
      ]"
    >
      <img
        :class="sidebar ? sidebarClasses.accountAvatar : 'size-8 rounded-full bg-gray-100 outline -outline-offset-1 outline-black/5'"
        :src="avatarSrc"
        alt=""
      />
      <template v-if="!compact">
        <span class="sr-only">{{ t('userMenu.accountMenu') }}</span>
        <span
          :class="[
            'flex min-w-0 flex-1 items-center justify-between',
            sidebar ? 'gap-x-3' : 'gap-2',
          ]"
          aria-hidden="true"
        >
          <span class="truncate">{{ displayName }}</span>
          <ChevronUpIcon :class="sidebar ? sidebarClasses.accountChevron : 'size-4 shrink-0 text-gray-400'" aria-hidden="true" />
        </span>
      </template>
      <template v-else>
        <span class="sr-only">{{ t('userMenu.accountMenu') }} — {{ displayName }}</span>
      </template>
    </MenuButton>

    <transition
      enter-active-class="transition ease-out duration-100"
      enter-from-class="transform opacity-0 scale-95"
      enter-to-class="transform scale-100"
      leave-active-class="transition ease-in duration-75"
      leave-from-class="transform scale-100"
      leave-to-class="transform opacity-0 scale-95"
    >
      <MenuItems
        :class="[
          'absolute z-50 w-56 rounded-lg bg-white py-1 shadow-lg ring-1 ring-black/5 focus:outline-hidden',
          menuPositionClass,
        ]"
      >
        <div class="border-b border-gray-100 px-3 py-2.5">
          <p class="truncate text-sm font-semibold text-gray-900">{{ displayName }}</p>
          <p v-if="email" class="truncate text-xs text-gray-500">{{ email }}</p>
        </div>

        <div class="px-3 py-2">
          <p class="text-xs font-medium text-gray-400">{{ t('userMenu.displaySection') }}</p>
        </div>

        <MenuItem v-slot="{ active }">
          <RouterLink
            to="/account"
            :class="[
              active ? 'bg-gray-50' : '',
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700',
            ]"
          >
            <Cog6ToothIcon class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
            {{ t('userMenu.accountSettings') }}
          </RouterLink>
        </MenuItem>

        <MenuItem v-slot="{ active }">
          <button
            type="button"
            :class="[
              active ? 'bg-gray-50' : '',
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700',
            ]"
            @click="displayStore.openSettings()"
          >
            <AdjustmentsHorizontalIcon class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
            {{ t('userMenu.displaySettings') }}
          </button>
        </MenuItem>

        <div class="my-1 border-t border-gray-100" />

        <MenuItem v-slot="{ active }">
          <button
            type="button"
            :class="[
              active ? 'bg-gray-50' : '',
              'flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-gray-700',
            ]"
            @click="onLogout"
          >
            <ArrowRightOnRectangleIcon class="size-5 shrink-0 text-gray-400" aria-hidden="true" />
            {{ t('userMenu.logout') }}
          </button>
        </MenuItem>
      </MenuItems>
    </transition>

  </Menu>
</template>

<script setup>
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/vue'
import {
  AdjustmentsHorizontalIcon,
  ArrowRightOnRectangleIcon,
  ChevronUpIcon,
  Cog6ToothIcon,
} from '@heroicons/vue/24/outline'
import { useI18n } from '../composables/useI18n'
import { resolveStorageUrl } from '../api/media'
import { useAuthStore } from '../stores/auth'
import { useDisplayStore } from '../stores/display'
import { useUserStore } from '../stores/user'
import { sidebarClasses } from '../config/sidebar'
import { userAvatarDataUrl } from '../utils/userAvatar'

const { t } = useI18n()
const router = useRouter()

const props = defineProps({
  compact: {
    type: Boolean,
    default: false,
  },
  sidebar: {
    type: Boolean,
    default: false,
  },
  /** 'up' — nad przyciskiem (sidebar); 'down' — pod awatarem (mobile header) */
  placement: {
    type: String,
    default: 'up',
  },
})

const displayStore = useDisplayStore()
const authStore = useAuthStore()
const userStore = useUserStore()

const displayName = computed(
  () => userStore.user?.displayName ?? userStore.user?.username ?? t('userMenu.displayNameFallback')
)
const email = computed(() => userStore.user?.email ?? '')
const avatarSrc = computed(() => {
  const raw = userStore.user?.avatar?.trim()
  if (raw) return resolveStorageUrl(raw) ?? raw
  if (!userStore.user) {
    return userAvatarDataUrl({ displayName: t('userMenu.displayNameFallback') })
  }
  return userAvatarDataUrl(userStore.user)
})

const menuPositionClass = computed(() =>
  props.placement === 'down'
    ? 'right-0 top-full mt-2 origin-top-right'
    : 'left-0 bottom-full mb-2 origin-bottom-left'
)

async function onLogout() {
  await authStore.logout()
  await router.push({ name: 'Login' })
}
</script>
