import { createApp } from 'vue'
import { createPinia} from 'pinia'

import { initThemeEarly } from './stores/display'
initThemeEarly()

import './style.css'
import App from './App.vue'
import router from './router'
import { useDisplayStore } from './stores/display'
import { useLocaleStore } from './stores/locale'

const pinia = createPinia()
const app = createApp(App)

app.use(router)
app.use(pinia)

useLocaleStore().init()
useDisplayStore().init()

app.mount('#app')