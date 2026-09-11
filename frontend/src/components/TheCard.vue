<template>
    <div :class="cardClass">
        <div class="px-4 py-5 sm:p-6">
            <!-- Content goes here -->
            <slot></slot>
        </div>
    </div>
</template>
<script setup>
    import { computed } from 'vue';
    
    const props = defineProps({
        class: {
            type: Array,
            default: () => [],
        }
    })
    const defaultClass = 'overflow-hidden rounded-lg'

    const cardClass = computed(() => {
        return [defaultClass, props.class]
    })
</script>