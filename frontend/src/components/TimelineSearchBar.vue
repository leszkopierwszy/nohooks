<template>
  <AppSearchBar v-bind="$attrs" />
</template>

<script setup>
import AppSearchBar from './AppSearchBar.vue'

defineOptions({ inheritAttrs: false })
</script>
