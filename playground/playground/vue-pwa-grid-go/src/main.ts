import './assets/main.css'

// Import Bootstrap CSS
import 'bootstrap/dist/css/bootstrap.min.css'
import 'bootstrap-icons/font/bootstrap-icons.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { initializeBootstrap } from './utils/bootstrap'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Mount app first
app.mount('#app')

// Initialize stores after app is mounted
const { useAppStore } = await import('./stores/app')
const appStore = useAppStore()
appStore.initializeApp()

// Initialize Bootstrap JavaScript after app is mounted
import('bootstrap/dist/js/bootstrap.bundle.min.js' as any).then(() => {
  // Initialize Bootstrap components after the bundle is loaded
  setTimeout(() => {
    initializeBootstrap()
  }, 100)
})
