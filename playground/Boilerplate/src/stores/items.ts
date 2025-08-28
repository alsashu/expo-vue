import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item } from '@/types'
import { api } from '@/services/api'
import { db } from '@/services/idb'
import { syncService } from '@/services/sync'
import { useUIStore } from '@/stores/ui'

export const useItemsStore = defineStore('items', () => {
  const items = ref<Item[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const totalItems = computed(() => items.value.length)
  const lowStockCount = computed(() => items.value.filter(item => item.status === 'low').length)
  const totalValue = computed(() => 
    items.value.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
  )

  async function load() {
    loading.value = true
    error.value = null
    
    try {
      console.log('Loading items...')
      
      // Load from IndexedDB first
      const cachedItems = await db.items.toArray()
      console.log('Cached items:', cachedItems.length)
      if (cachedItems.length > 0) {
        items.value = cachedItems
      }

      // Then try to refresh from server
      try {
        console.log('Fetching from API...')
        const response = await api.get('/items')
        console.log('API response:', response.data)
        items.value = response.data
        
        // Update IndexedDB
        await db.items.clear()
        await db.items.bulkAdd(response.data)
        console.log('Items saved to IndexedDB')
      } catch (networkError) {
        console.warn('Failed to fetch from server, using cached data:', networkError)
        error.value = 'Using offline data - server unavailable'
      }
    } catch (err) {
      error.value = 'Failed to load items'
      console.error('Load error:', err)
    } finally {
      loading.value = false
    }
  }

  async function add(itemData: Omit<Item, 'id' | 'updatedAt'>) {
    const uiStore = useUIStore()
    const newItem: Item = {
      ...itemData,
      id: Date.now(), // Temporary ID
      updatedAt: new Date().toISOString()
    }

    console.log('Adding item:', newItem)

    // Optimistic update
    items.value.push(newItem)
    
    try {
      await db.items.add(newItem)
      console.log('Item saved to IndexedDB')
    } catch (idbError) {
      console.warn('Failed to save to IndexedDB:', idbError)
    }

    // If offline mode is enabled or browser is offline, queue and return
    if (uiStore.offlineMode || !navigator.onLine) {
      console.log('📴 Offline mode: queue POST /items for later sync')
      await syncService.enqueueOperation('POST', '/items', newItem)
      return
    }

    // Online mode: attempt server sync now
    try {
      const response = await api.post('/items', newItem)
      console.log('Item saved to server:', response.data)
      
      // Update with server response
      const index = items.value.findIndex(item => item.id === newItem.id)
      if (index !== -1) {
        items.value[index] = response.data
        await db.items.put(response.data)
      }
    } catch (err) {
      console.warn('Failed to sync item creation, queuing for later:', err)
      await syncService.enqueueOperation('POST', '/items', newItem)
    }
  }

  async function update(id: number, updates: Partial<Item>) {
    const uiStore = useUIStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) {
      console.warn('Item not found for update:', id)
      return
    }

    const updatedItem = {
      ...items.value[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    console.log('Updating item:', id, updates)

    // Optimistic update
    items.value[index] = updatedItem
    await db.items.put(updatedItem)

    // If offline, queue and return
    if (uiStore.offlineMode || !navigator.onLine) {
      console.log('📴 Offline mode: queue PATCH /items/', id, 'for later sync')
      await syncService.enqueueOperation('PATCH', `/items/${id}`, updates)
      return
    }

    try {
      const response = await api.patch(`/items/${id}`, updates)
      items.value[index] = response.data
      await db.items.put(response.data)
      console.log('Item updated on server')
    } catch (err) {
      console.warn('Failed to sync item update, queuing for later:', err)
      await syncService.enqueueOperation('PATCH', `/items/${id}`, updates)
    }
  }

  async function remove(id: number) {
    const uiStore = useUIStore()
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) {
      console.warn('Item not found for deletion:', id)
      return
    }

    console.log('Removing item:', id)

    // Optimistic delete
    items.value.splice(index, 1)
    await db.items.delete(id)

    // If offline, queue and return
    if (uiStore.offlineMode || !navigator.onLine) {
      console.log('📴 Offline mode: queue DELETE /items/', id, 'for later sync')
      await syncService.enqueueOperation('DELETE', `/items/${id}`)
      return
    }

    try {
      await api.delete(`/items/${id}`)
      console.log('Item deleted from server')
    } catch (err) {
      console.warn('Failed to sync item deletion, queuing for later:', err)
      await syncService.enqueueOperation('DELETE', `/items/${id}`)
    }
  }

  return {
    items,
    loading,
    error,
    totalItems,
    lowStockCount,
    totalValue,
    load,
    add,
    update,
    remove
  }
})