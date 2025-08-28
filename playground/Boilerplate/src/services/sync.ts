import { db } from './idb'
import { api } from './api'
import type { OutboxEntry } from '@/types'
import { useUIStore } from '@/stores/ui'

class SyncService {
  private isProcessing = false

  async init() {
    // Push outbox on app start
    await this.pushOutbox()

    // Listen for online events
    window.addEventListener('online', () => {
      const uiStore = useUIStore()
      if (!uiStore.offlineMode) {
        this.pushOutbox()
      }
    })
  }

  async enqueueOperation(method: string, path: string, body?: any) {
    const entry: OutboxEntry = {
      method,
      path,
      body,
      timestamp: Date.now()
    }
    await db.outbox.add(entry)
    
    // Try to push immediately if online
    const uiStore = useUIStore()
    if (navigator.onLine && !uiStore.offlineMode) {
      this.pushOutbox()
    }
  }

  async pushOutbox() {
    const uiStore = useUIStore()
    if (this.isProcessing || !navigator.onLine || uiStore.offlineMode) return

    this.isProcessing = true
    
    try {
      const entries = await db.outbox.orderBy('timestamp').toArray()
      
      for (const entry of entries) {
        try {
          await this.executeOperation(entry)
          await db.outbox.delete(entry.id!)
        } catch (error) {
          console.warn('Failed to sync operation:', entry, error)
          // Keep in outbox for next attempt
          break
        }
      }
    } catch (error) {
      console.error('Error processing outbox:', error)
    } finally {
      this.isProcessing = false
    }
  }

  private async executeOperation(entry: OutboxEntry) {
    const { method, path, body } = entry
    
    switch (method.toUpperCase()) {
      case 'POST':
        return await api.post(path, body)
      case 'PATCH':
        return await api.patch(path, body)
      case 'DELETE':
        return await api.delete(path)
      default:
        throw new Error(`Unsupported method: ${method}`)
    }
  }
}

export const syncService = new SyncService()