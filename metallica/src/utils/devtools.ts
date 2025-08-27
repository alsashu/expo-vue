import type { App } from 'vue'

export function setupDevtools(app: App) {
  if (import.meta.env.DEV) {
    // Vue DevTools setup
    if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__) {
      window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = app
    }

    // Performance monitoring in development
    const observer = new PerformanceObserver((list) => {
      list.getEntries().forEach((entry) => {
        if (entry.duration > 100) {
          console.warn(`Slow operation detected: ${entry.name} took ${entry.duration.toFixed(2)}ms`)
        }
      })
    })
    
    observer.observe({ entryTypes: ['measure'] })

    // Add global debugging helpers
    window.__RAILWAY_DEBUG__ = {
      app,
      stores: {},
      performance: {
        mark: (name: string) => performance.mark(name),
        measure: (name: string, startMark: string, endMark?: string) => {
          return performance.measure(name, startMark, endMark)
        }
      }
    }

    console.log('🚂 Railway Designer DevTools initialized')
  }
}

// Global type declarations for development
declare global {
  interface Window {
    __VUE_DEVTOOLS_GLOBAL_HOOK__?: any
    __RAILWAY_DEBUG__?: {
      app: App
      stores: any
      performance: {
        mark: (name: string) => void
        measure: (name: string, startMark: string, endMark?: string) => PerformanceMeasure
      }
    }
  }
}