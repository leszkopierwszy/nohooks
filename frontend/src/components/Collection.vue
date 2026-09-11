<template>
  <div>
    <!-- <p>{{ collectionStore.collections }}</p> -->
    <div v-if="route.name === 'collection'">
      <Categories title="Collection" :categories="categories"/>
    </div>    
  </div>

  <router-view />

</template>

<script setup>
  import { computed, onMounted } from 'vue'
  import { useRoute } from 'vue-router';
  import { useCollectionStore } from '../stores/collection'
  import Categories from './Categories.vue';

  const route = useRoute()
  const collectionStore = useCollectionStore()

  onMounted(() => {
    collectionStore.fetchCollections().catch(() => {})
  })

  function getCollectionsOverview(collections) {
    return collections.map(collection => ({
      id: collection.id,
      name: collection.name,
      href: collection.href,
      imageSrc: collection.cover ?? collection.imageSrc,
      itemsCount: collection.items.length
    }))
  }

  const categories = computed(() =>
    getCollectionsOverview(collectionStore.allCollections)
  )

  const cat = [
      {
        name: 'clothes',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-01.jpg',
      },
      {
        name: 'shoes',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-02.jpg',
      },
      {
        name: 'accessories',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-04.jpg',
      },
      {
        name: 'electronics',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-05.jpg',
      },
      {
        name: 'packing',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-03.jpg',
      },
      {
        name: 'objects',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-03.jpg',
      },
      {
        name: 'hiking',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-01.jpg',
      },
      {
        name: 'productivity',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-02.jpg',
      },
      {
        name: 'add',
        href: '#',
        imageSrc: 'https://tailwindcss.com/plus-assets/img/ecommerce-images/home-page-01-category-02.jpg',
      }

    ]
</script>