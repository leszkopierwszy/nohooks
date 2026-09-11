<template>
  <router-link :to="item.href" custom v-slot="{ isActive, href, navigate }">
    <a
      :href="href"
      :class="[
        sidebarClasses.navLinkBase,
        'min-h-9 py-2 pl-9 text-[12px]',
        isActive || active
          ? sidebarClasses.navLinkActive
          : sidebarClasses.navLinkInactive,
      ]"
      :aria-current="isActive || active ? 'page' : undefined"
      @click="onClick($event, navigate)"
    >
      {{ t(item.labelKey) }}
    </a>
  </router-link>
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import { sidebarClasses, isSidebarNavItemActive } from '../config/sidebar'

const { t } = useI18n()

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const route = useRoute()

const active = computed(() => isSidebarNavItemActive(props.item, route.path))

function onClick(event, navigate) {
  navigate(event)
  emit('navigate')
}
</script>
