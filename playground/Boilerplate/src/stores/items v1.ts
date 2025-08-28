import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Item } from '@/types'
import { api } from '@/services/api'
import { db } from '@/services/idb'
import { syncService } from '@/services/sync'

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
      // Load from IndexedDB first
      const cachedItems = await db.items.toArray()
      if (cachedItems.length > 0) {
        items.value = cachedItems
      }

      // Then try to refresh from server
      try {
        const response = await api.get('/items')
        items.value = response.data
        
        // Update IndexedDB
        await db.items.clear()
        await db.items.bulkAdd(response.data)
      } catch (networkError) {
        console.warn('Failed to fetch from server, using cached data')
      }
    } catch (err) {
      error.value = 'Failed to load items'
      console.error('Load error:', err)
    } finally {
      loading.value = false
    }
  }

  async function add(itemData: Omit<Item, 'id' | 'updatedAt'>) {
    const newItem: Item = {
      ...itemData,
      id: Date.now(), // Temporary ID
      updatedAt: new Date().toISOString()
    }

    // Optimistic update
    items.value.push(newItem)
    await db.items.add(newItem)

    try {
      const response = await api.post('/items', newItem)
      
      // Update with server response
      const index = items.value.findIndex(item => item.id === newItem.id)
      if (index !== -1) {
        items.value[index] = response.data
        await db.items.put(response.data)
      }
    } catch (err) {
      console.warn('Failed to sync item creation, queuing for later')
      await syncService.enqueueOperation('POST', '/items', newItem)
    }
  }

  async function update(id: number, updates: Partial<Item>) {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return

    const updatedItem = {
      ...items.value[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    // Optimistic update
    items.value[index] = updatedItem
    await db.items.put(updatedItem)

    try {
      const response = await api.patch(`/items/${id}`, updates)
      items.value[index] = response.data
      await db.items.put(response.data)
    } catch (err) {
      console.warn('Failed to sync item update, queuing for later')
      await syncService.enqueueOperation('PATCH', `/items/${id}`, updates)
    }
  }

  async function remove(id: number) {
    const index = items.value.findIndex(item => item.id === id)
    if (index === -1) return

    // Optimistic delete
    items.value.splice(index, 1)
    await db.items.delete(id)

    try {
      await api.delete(`/items/${id}`)
    } catch (err) {
      console.warn('Failed to sync item deletion, queuing for later')
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