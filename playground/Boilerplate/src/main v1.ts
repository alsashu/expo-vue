import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { syncService } from './services/sync'
import './assets/main.css'
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

// Register service worker (only in production)
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  // Use dynamic import to handle PWA register
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        // Auto-refresh for this demo
        updateSW(true)
      },
    })
  }).catch(() => {
    console.log('PWA register not available')
  })
}

// Initialize sync service
syncService.init()

app.mount('#app')