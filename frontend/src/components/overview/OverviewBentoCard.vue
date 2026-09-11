<template>
  <section
    :class="[
      'flex min-h-0 flex-col overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm ring-1 ring-gray-900/5',
      dense ? 'p-4' : 'p-5 sm:p-6',
    ]"
  >
    <header v-if="title || $slots.header || $slots.actions" class="mb-4 flex shrink-0 items-start justify-between gap-3">
      <div class="min-w-0">
        <h2 v-if="title" class="text-sm font-semibold tracking-tight text-gray-900">{{ title }}</h2>
        <p v-if="subtitle" class="mt-0.5 text-xs text-gray-500">{{ subtitle }}</p>
        <slot name="header" />
      </div>
      <slot name="actions" />
    </header>
    <div class="min-h-0 flex-1">
      <slot />
    </div>
  </section>
</template>

<script setup>
defineProps({
  title: { type: String, default: '' },
  subtitle: { type: String, default: '' },
  dense: { type: Boolean, default: false },
})
</script>
