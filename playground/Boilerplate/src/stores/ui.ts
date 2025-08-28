import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useUIStore = defineStore('ui', () => {
  const notifications = ref<Array<{ id: number; message: string; type: 'info' | 'success' | 'error' }>>([])
  const offlineMode = ref<boolean>(localStorage.getItem('offlineMode') === '1')

  function addNotification(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = Date.now()
    notifications.value.push({ id, message, type })
    
    // Auto remove after 3 seconds
    setTimeout(() => {
      removeNotification(id)
    }, 3000)
  }

  function removeNotification(id: number) {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index !== -1) {
      notifications.value.splice(index, 1)
    }
  }

  function setOfflineMode(value: boolean) {
    offlineMode.value = value
    localStorage.setItem('offlineMode', value ? '1' : '0')
  }

  return {
    notifications,
    offlineMode,
    addNotification,
    removeNotification,
    setOfflineMode
  }
})