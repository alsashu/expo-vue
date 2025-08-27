import { ref, computed } from 'vue'
import { useRailwayStore } from '@stores/railway'
import { useUIStore } from '@stores/ui'
import { storage } from '@utils/storage'

export function useOfflineSync() {
  const railwayStore = useRailwayStore()
  const uiStore = useUIStore()
  
  const isOnline = ref(navigator.onLine)
  const syncStatus = ref<'synced' | 'syncing' | 'error'>('synced')
  const lastSyncTime = ref<Date | null>(null)
  const pendingSyncItems = ref<string[]>([])

  // Listen for online/offline events
  const handleOnline = () => {
    isOnline.value = true
    syncPendingChanges()
  }

  const handleOffline = () => {
    isOnline.value = false
    syncStatus.value = 'synced' // Reset status when offline
  }

  // Sync pending changes when coming back online
  const syncPendingChanges = async () => {
    if (!isOnline.value || syncStatus.value === 'syncing') return

    try {
      syncStatus.value = 'syncing'
      
      // Get pending sync queue from storage
      const pendingItems = await storage.getSyncQueue()
      
      if (pendingItems.length === 0) {
        syncStatus.value = 'synced'
        return
      }

      // Process each pending item
      for (const item of pendingItems) {
        try {
          // This would make actual API calls to sync data
          // For now, we'll just simulate the sync
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // Remove from sync queue after successful sync
          await storage.removeSyncQueueEntry(item.id)
        } catch (error) {
          console.error('Failed to sync item:', item.id, error)
          // Increment retry count
          await storage.updateSyncQueueEntry(item.id, {
            retries: item.retries + 1
          })
        }
      }

      syncStatus.value = 'synced'
      lastSyncTime.value = new Date()
      
      uiStore.showSuccess('Sync Complete', 'All changes have been synchronized')
    } catch (error) {
      console.error('Sync failed:', error)
      syncStatus.value = 'error'
      uiStore.showError('Sync Failed', 'Failed to synchronize changes')
    }
  }

  // Add item to sync queue
  const addToSyncQueue = async (item: {
    type: 'create' | 'update' | 'delete'
    entity: 'network' | 'node' | 'connection'
    entityId: string
    data: any
  }) => {
    try {
      const syncId = await storage.addToSyncQueue(item)
      pendingSyncItems.value.push(syncId)
      
      // Try to sync immediately if online
      if (isOnline.value) {
        syncPendingChanges()
      }
    } catch (error) {
      console.error('Failed to add to sync queue:', error)
    }
  }

  // Manual sync trigger
  const forcSync = async () => {
    if (isOnline.value) {
      await syncPendingChanges()
    } else {
      uiStore.showWarning('Offline', 'Cannot sync while offline')
    }
  }

  // Initialize event listeners
  const init = () => {
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    // Initial sync if online
    if (isOnline.value) {
      syncPendingChanges()
    }
  }

  // Cleanup
  const cleanup = () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }

  // Computed properties
  const canSync = computed(() => isOnline.value && syncStatus.value !== 'syncing')
  const hasPendingChanges = computed(() => pendingSyncItems.value.length > 0)

  return {
    isOnline,
    syncStatus,
    lastSyncTime,
    pendingSyncItems,
    canSync,
    hasPendingChanges,
    addToSyncQueue,
    forcSync,
    init,
    cleanup
  }
}