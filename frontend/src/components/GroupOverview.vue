<template>
    <FinanceCloseLink />

    <div class="flex items-baseline justify-between border-b border-gray-200 pb-6 mb-6">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900">{{ title }}</h1>        
    </div>
    <!-- <p class="pb-6">Foo</p> -->
    <!-- <p>{{ props.foo?.value }}</p>
    <p>{{ props.bar?.value }}</p>
    <p>{{ props }}</p> -->
    
    <!-- <p class="pb-6">{{ v }}</p> -->
    <!-- <p>{{ p }}</p> -->
    <div v-if="p">
        <TableGroups />
    </div>
    <!-- {{ title }} -->
    <div v-if="title.toLowerCase() === 'planned expenses'">
        <!-- Subcriptions
        <p>M2M Target: Spotify </p>
        <p>M2M Target: Netflix </p>
        <p>M2M Target: Apple </p>
        <p>M2M Target: Phone </p>
        <p>M2M Target: Chat GPT</p>
        <p>M2M Target: Office</p>
        <p>M2M Target: Meals</p>
        <p>M2M Target: Meals</p> -->
        <TableBadge />
    </div>
</template>
<script setup>
    // const props = defineProps({
    //     foo: String,
    //     bar: String
    // })
    import { useRoute, RouterLink } from 'vue-router';
    import { computed } from 'vue';
    import FinanceCloseLink from './finance/FinanceCloseLink.vue';
    import TableGroups from './TableGroups.vue';
    import Table2 from './Table2.vue';
import TableBadge from './TableBadge.vue';
    const route = useRoute()

    const title = route.query?.n
    const v = route.query?.v

    const p = computed(() => {
        console.log(title)
        if(title.toLowerCase() === 'salary') return true
        return false
    })
</script>