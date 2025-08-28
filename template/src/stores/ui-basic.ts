import { defineStore } from 'pinia'

// Basic UI store to resolve immediate import errors
export const useUIStore = defineStore('ui', {
  state: () => ({
    isDarkMode: false,
    isLoading: false,
    sidebarCollapsed: false
  }),
  
  actions: {
    toggleDarkMode() {
      this.isDarkMode = !this.isDarkMode
    },
    
    setLoading(loading: boolean) {
      this.isLoading = loading
    },
    
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    }
  }
})