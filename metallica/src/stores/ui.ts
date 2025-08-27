import { defineStore } from 'pinia'

export interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
  duration?: number
  action?: {
    label: string
    handler: () => void
  }
  timestamp: string
}

export interface Modal {
  id: string
  component: string
  props?: Record<string, any>
  title?: string
  width?: string
  closable?: boolean
}

interface UIState {
  // Theme
  isDarkMode: boolean
  
  // Layout
  sidebarCollapsed: boolean
  fullscreen: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage: string
  
  // Notifications
  notifications: Notification[]
  
  // Modals
  modals: Modal[]
  
  // Command palette
  commandPaletteOpen: boolean
  
  // PWA
  showUpdateNotification: boolean
  installPromptEvent: any
  
  // Grid settings
  gridSettings: {
    pageSize: number
    showGroupPanel: boolean
    enableRangeSelection: boolean
    enableCharts: boolean
    theme: 'ag-theme-alpine' | 'ag-theme-alpine-dark'
  }
  
  // Diagram settings
  diagramSettings: {
    showGrid: boolean
    snapToGrid: boolean
    gridSize: number
    showMiniMap: boolean
    animationEnabled: boolean
    autoLayout: boolean
  }
  
  // Performance settings
  performanceMode: 'standard' | 'high-performance'
  enableWebWorkers: boolean
  maxRenderItems: number
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    isDarkMode: false,
    
    sidebarCollapsed: false,
    fullscreen: false,
    
    isLoading: false,
    loadingMessage: '',
    
    notifications: [],
    modals: [],
    
    commandPaletteOpen: false,
    
    showUpdateNotification: false,
    installPromptEvent: null,
    
    gridSettings: {
      pageSize: 100,
      showGroupPanel: false,
      enableRangeSelection: true,
      enableCharts: true,
      theme: 'ag-theme-alpine'
    },
    
    diagramSettings: {
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      showMiniMap: true,
      animationEnabled: true,
      autoLayout: false
    },
    
    performanceMode: 'standard',
    enableWebWorkers: true,
    maxRenderItems: 10000
  }),

  getters: {
    // Theme helpers
    currentGridTheme: (state) => {
      return state.isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
    },
    
    // Notification helpers
    unreadNotifications: (state) => {
      return state.notifications.filter(n => !n.id.startsWith('read-'))
    },
    
    // Modal helpers
    hasOpenModals: (state) => state.modals.length > 0,
    topModal: (state) => state.modals[state.modals.length - 1] || null,
    
    // Performance helpers
    shouldUseWebWorkers: (state) => {
      return state.enableWebWorkers && 'Worker' in window
    },
    
    isHighPerformanceMode: (state) => {
      return state.performanceMode === 'high-performance'
    }
  },

  actions: {
    // Theme management
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
      this.updateGridTheme()
      document.documentElement.classList.toggle('dark', this.isDarkMode)
    },

    setDarkMode(enabled: boolean) {
      this.isDarkMode = enabled
      this.updateGridTheme()
      document.documentElement.classList.toggle('dark', enabled)
    },

    updateGridTheme() {
      this.gridSettings.theme = this.isDarkMode ? 'ag-theme-alpine-dark' : 'ag-theme-alpine'
    },

    // Layout management
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    },

    toggleFullscreen() {
      this.fullscreen = !this.fullscreen
      
      if (this.fullscreen) {
        document.documentElement.requestFullscreen?.()
      } else {
        document.exitFullscreen?.()
      }
    },

    // Loading management
    setLoading(loading: boolean, message = '') {
      this.isLoading = loading
      this.loadingMessage = message
    },

    // Notification management
    addNotification(notification: Omit<Notification, 'id' | 'timestamp'>) {
      const id = crypto.randomUUID()
      const timestamp = new Date().toISOString()
      
      const newNotification: Notification = {
        ...notification,
        id,
        timestamp,
        duration: notification.duration ?? 5000
      }
      
      this.notifications.unshift(newNotification)
      
      // Auto-remove after duration
      if (newNotification.duration && newNotification.duration > 0) {
        setTimeout(() => {
          this.removeNotification(id)
        }, newNotification.duration)
      }
      
      // Limit notifications to prevent memory issues
      if (this.notifications.length > 50) {
        this.notifications = this.notifications.slice(0, 50)
      }
      
      return id
    },

    removeNotification(id: string) {
      const index = this.notifications.findIndex(n => n.id === id)
      if (index > -1) {
        this.notifications.splice(index, 1)
      }
    },

    clearNotifications() {
      this.notifications = []
    },

    markNotificationAsRead(id: string) {
      const notification = this.notifications.find(n => n.id === id)
      if (notification) {
        notification.id = `read-${notification.id}`
      }
    },

    // Modal management
    openModal(modal: Omit<Modal, 'id'>) {
      const id = crypto.randomUUID()
      const newModal: Modal = { ...modal, id }
      this.modals.push(newModal)
      return id
    },

    closeModal(id?: string) {
      if (id) {
        const index = this.modals.findIndex(m => m.id === id)
        if (index > -1) {
          this.modals.splice(index, 1)
        }
      } else {
        // Close top modal
        this.modals.pop()
      }
    },

    closeAllModals() {
      this.modals = []
    },

    // Command palette
    toggleCommandPalette() {
      this.commandPaletteOpen = !this.commandPaletteOpen
    },

    openCommandPalette() {
      this.commandPaletteOpen = true
    },

    closeCommandPalette() {
      this.commandPaletteOpen = false
    },

    // PWA management
    setUpdateNotification(show: boolean) {
      this.showUpdateNotification = show
    },

    dismissUpdateNotification() {
      this.showUpdateNotification = false
    },

    setInstallPrompt(event: any) {
      this.installPromptEvent = event
    },

    async installPWA() {
      if (this.installPromptEvent) {
        this.installPromptEvent.prompt()
        const { outcome } = await this.installPromptEvent.userChoice
        
        if (outcome === 'accepted') {
          this.addNotification({
            type: 'success',
            title: 'App Installed',
            message: 'Railway Designer has been installed successfully!'
          })
        }
        
        this.installPromptEvent = null
      }
    },

    // Settings management
    updateGridSettings(settings: Partial<typeof this.gridSettings>) {
      this.gridSettings = { ...this.gridSettings, ...settings }
    },

    updateDiagramSettings(settings: Partial<typeof this.diagramSettings>) {
      this.diagramSettings = { ...this.diagramSettings, ...settings }
    },

    setPerformanceMode(mode: 'standard' | 'high-performance') {
      this.performanceMode = mode
      
      // Adjust settings based on performance mode
      if (mode === 'high-performance') {
        this.maxRenderItems = 50000
        this.diagramSettings.animationEnabled = false
        this.enableWebWorkers = true
      } else {
        this.maxRenderItems = 10000
        this.diagramSettings.animationEnabled = true
      }
    },

    // Utility methods
    showSuccess(title: string, message: string, duration?: number) {
      return this.addNotification({
        type: 'success',
        title,
        message,
        duration
      })
    },

    showError(title: string, message: string, duration?: number) {
      return this.addNotification({
        type: 'error',
        title,
        message,
        duration: duration ?? 0 // Errors don't auto-dismiss by default
      })
    },

    showWarning(title: string, message: string, duration?: number) {
      return this.addNotification({
        type: 'warning',
        title,
        message,
        duration
      })
    },

    showInfo(title: string, message: string, duration?: number) {
      return this.addNotification({
        type: 'info',
        title,
        message,
        duration
      })
    },

    // Confirmation dialog helper
    async confirm(
      title: string, 
      message: string, 
      options?: {
        confirmText?: string
        cancelText?: string
        type?: 'danger' | 'warning' | 'info'
      }
    ): Promise<boolean> {
      return new Promise((resolve) => {
        this.openModal({
          component: 'ConfirmDialog',
          title,
          props: {
            message,
            confirmText: options?.confirmText || 'Confirm',
            cancelText: options?.cancelText || 'Cancel',
            type: options?.type || 'info',
            onConfirm: () => {
              this.closeModal()
              resolve(true)
            },
            onCancel: () => {
              this.closeModal()
              resolve(false)
            }
          },
          closable: true
        })
      })
    },

    // Performance monitoring
    measurePerformance<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
      return new Promise(async (resolve, reject) => {
        const start = performance.now()
        
        try {
          const result = await fn()
          const duration = performance.now() - start
          
          // Log slow operations in development
          if (import.meta.env.DEV && duration > 100) {
            console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
          }
          
          // Store performance metrics
          if ('performance' in window && 'measure' in window.performance) {
            performance.mark(`${name}-start`)
            performance.mark(`${name}-end`)
            performance.measure(name, `${name}-start`, `${name}-end`)
          }
          
          resolve(result)
        } catch (error) {
          reject(error)
        }
      })
    },

    // Keyboard shortcut helpers
    registerGlobalShortcut(key: string, handler: () => void) {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Simple shortcut matching - extend as needed
        if (event.key === key && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          handler()
        }
      }
      
      document.addEventListener('keydown', handleKeyDown)
      
      // Return cleanup function
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
      }
    },

    // Responsive helpers
    getDeviceType() {
      const width = window.innerWidth
      if (width < 768) return 'mobile'
      if (width < 1024) return 'tablet'
      return 'desktop'
    },

    isMobile() {
      return this.getDeviceType() === 'mobile'
    },

    isTablet() {
      return this.getDeviceType() === 'tablet'
    },

    isDesktop() {
      return this.getDeviceType() === 'desktop'
    }
  },

  persist: {
    key: 'ui-store',
    storage: localStorage,
    paths: [
      'isDarkMode',
      'sidebarCollapsed',
      'gridSettings',
      'diagramSettings',
      'performanceMode',
      'enableWebWorkers',
      'maxRenderItems'
    ]
  }
})