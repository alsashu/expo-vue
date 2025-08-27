/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// PWA virtual module types
declare module 'virtual:pwa-register' {
  export interface RegisterSWOptions {
    immediate?: boolean
    onNeedRefresh?: () => void
    onOfflineReady?: () => void
    onRegistered?: (registration: ServiceWorkerRegistration | undefined) => void
    onRegisterError?: (error: any) => void
  }

  export function registerSW(options?: RegisterSWOptions): (reloadPage?: boolean) => Promise<void>
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_URL?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_APP_NAME?: string
  readonly VITE_ENABLE_ANALYTICS?: string
  readonly VITE_ENABLE_WEB_WORKERS?: string
  readonly VITE_DEV_TOOLS?: string
  readonly VITE_LOG_LEVEL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Global types for Vue components
declare global {
  interface Window {
    ElMessageBox?: any
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any
    __RAILWAY_DEBUG__?: any
  }
}