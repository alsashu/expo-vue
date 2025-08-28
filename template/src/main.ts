import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import App from '@/App.vue'

// Element Plus
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// Tailwind CSS
import '@/assets/styles/main.css'

async function initApp() {
  const app = createApp(App)
  
  // Pinia setup
  const pinia = createPinia()
  app.use(pinia)
  app.use(router)
  app.use(ElementPlus)
  
  app.mount('#app')
}

// Initialize application
initApp().catch(console.error)