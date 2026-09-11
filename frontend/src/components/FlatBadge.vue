<template>
    <span
        :class="[
            'inline-flex items-center gap-x-1.5 rounded-md px-2 py-1 text-xs font-medium',
            theme.color_bg,
            theme.color_text,
        ]"
    >
        <svg :class="['size-1.5', theme.color_svg]" viewBox="0 0 6 6" aria-hidden="true">
            <circle cx="3" cy="3" r="3" />
        </svg>
        <slot>{{ label }}</slot>
    </span>
</template>

<script setup>
    import { computed } from 'vue'

    const props = defineProps({
        color: {
            type: String,
            default: 'gray',
            validator: (value) =>
                ['gray', 'red', 'yellow', 'green', 'indigo', 'purple', 'pink'].includes(value),
        },
        label: {
            type: String,
            default: '',
        },
    })

    const colorClasses = {
        gray: { color_bg: 'bg-gray-100', color_text: 'text-gray-700', color_svg: 'fill-gray-500' },
        red: { color_bg: 'bg-red-100', color_text: 'text-red-700', color_svg: 'fill-red-500' },
        yellow: { color_bg: 'bg-yellow-100', color_text: 'text-yellow-800', color_svg: 'fill-yellow-500' },
        green: { color_bg: 'bg-green-100', color_text: 'text-green-700', color_svg: 'fill-green-500' },
        indigo: { color_bg: 'bg-indigo-100', color_text: 'text-indigo-700', color_svg: 'fill-indigo-500' },
        purple: { color_bg: 'bg-purple-100', color_text: 'text-purple-700', color_svg: 'fill-purple-500' },
        pink: { color_bg: 'bg-pink-100', color_text: 'text-pink-700', color_svg: 'fill-pink-500' },
    }

    const theme = computed(() => colorClasses[props.color] ?? colorClasses.gray)
</script>
