/// <reference types="vite/client" />
/// <reference types="vue/ref-macros-global" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Vite environment variables
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_WS_URL: string
  readonly VITE_APP_VERSION: string
  readonly VITE_ENABLE_ANALYTICS: string
  readonly VITE_ENABLE_COLLABORATION: string
  readonly VITE_GOJS_LICENSE_KEY: string
  readonly VITE_AG_GRID_LICENSE_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// PWA types
declare const __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: boolean

// Web Workers
declare module '*.worker.ts' {
  const WorkerFactory: new () => Worker
  export default WorkerFactory
}

// Global augmentation for stores
declare global {
  interface Window {
    __PINIA_STORES__?: Record<string, any>
  }
}