import { createApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import router from '@/router'
import App from '@/App.vue'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'

// AG Grid
import 'ag-grid-community/styles/ag-grid.css'
import 'ag-grid-community/styles/ag-theme-alpine.css'
import { LicenseManager } from 'ag-grid-enterprise'

// Tailwind CSS
import '@/assets/styles/main.css'

// PWA
import { registerSW } from 'virtual:pwa-register'

// GoJS License (replace with your actual license)
import * as go from 'gojs'
// go.licenseKey = "YOUR_GOJS_LICENSE_KEY"

// AG Grid License (replace with your actual license)
// LicenseManager.setLicenseKey('YOUR_AG_GRID_LICENSE_KEY')

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error)
  // Send to error reporting service
})

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason)
  // Send to error reporting service
})

// PWA update handling
const updateSW = registerSW({
  onNeedRefresh() {
    console.log('New content available, please refresh.')
    // Show update notification to user
  },
  onOfflineReady() {
    console.log('App ready to work offline.')
    // Show offline ready notification
  },
})

async function initApp() {
  const app = createApp(App)
  
  // Pinia setup with plugins
  const pinia = createPinia()
  // Temporarily disabled to prevent circular reference issues
  // pinia.use(piniaPluginPersistedstate)
  
  // Import and setup custom plugins
  const { undoRedoPlugin } = await import('@/stores/plugins/undo-redo')
  pinia.use(undoRedoPlugin)
  
  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)
  
  // Global properties
  app.config.globalProperties.$updateSW = updateSW
  
  // Performance monitoring
  if (import.meta.env.DEV) {
    try {
      const { setupDevtools } = await import('@/utils/devtools')
      setupDevtools(app)
    } catch (error) {
      console.log('DevTools not available')
    }
  }
  
  app.mount('#app')
}

// Initialize application
initApp().catch(console.error)