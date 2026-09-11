<template>
  <router-link :to="item.href" custom v-slot="{ isActive, href, navigate }">
    <a
      :href="href"
      :class="[sidebarNavLinkClass(isActive || active), attrs.class]"
      :aria-current="isActive || active ? 'page' : undefined"
      @click="onClick($event, navigate)"
    >
      <component
        :is="item.icon"
        :class="sidebarNavIconClass(isActive || active)"
        aria-hidden="true"
      />
      {{ t(item.labelKey) }}
    </a>
  </router-link>
</template>

<script setup>
import { computed, useAttrs } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from '../composables/useI18n'
import {
  sidebarNavIconClass,
  sidebarNavLinkClass,
  isSidebarNavItemActive,
} from '../config/sidebar'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['navigate'])
const route = useRoute()
const attrs = useAttrs()
const { t } = useI18n()

const active = computed(() => isSidebarNavItemActive(props.item, route.path))

function onClick(event, navigate) {
  navigate(event)
  emit('navigate')
}
</script>
