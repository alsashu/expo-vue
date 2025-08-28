import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { syncService } from './services/sync'

// Main CSS first
import './assets/main.css'

// Force AG Grid CSS imports with explicit paths
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-quartz.css'

// Add a small delay to ensure CSS is loaded
setTimeout(() => {
  console.log('AG Grid CSS loaded')
}, 100)

const app = createApp(App)

app.use(createPinia())
app.use(router)

// PWA registration
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  import('virtual:pwa-register').then(({ registerSW }) => {
    const updateSW = registerSW({
      onNeedRefresh() {
        updateSW(true)
      },
    })
  }).catch(() => {
    console.log('PWA register not available')
  })
}

syncService.init()

app.mount('#app')