<template>
  <div class="pb-3">
    <router-link
      to="/finance"
      class="inline-flex rounded-md p-1.5 text-gray-700 hover:bg-gray-200/80 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600"
    >
      <span class="sr-only">Zamknij i wróć do Finance</span>
      <XMarkIcon class="size-6 shrink-0" aria-hidden="true" />
    </router-link>
  </div>
</template>

<script setup>
import { XMarkIcon } from '@heroicons/vue/24/outline'
</script>
