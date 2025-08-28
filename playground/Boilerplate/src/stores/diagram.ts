import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { DiagramModel } from '@/types'
import { api } from '@/services/api'
import { db } from '@/services/idb'
import { syncService } from '@/services/sync'

export const useDiagramStore = defineStore('diagram', () => {
  const diagram = ref<DiagramModel | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function load() {
    loading.value = true
    error.value = null
    
    try {
      // Load from IndexedDB first
      const cached = await db.diagrams.get('main')
      if (cached) {
        diagram.value = cached
      }

      // Then try to refresh from server
      try {
        const response = await api.get('/diagrams/main')
        const serverDiagram = { id: 'main', ...response.data }
        diagram.value = serverDiagram
        
        // Update IndexedDB
        await db.diagrams.put(serverDiagram)
      } catch (networkError) {
        console.warn('Failed to fetch diagram from server, using cached data')
      }
    } catch (err) {
      error.value = 'Failed to load diagram'
      console.error('Load diagram error:', err)
    } finally {
      loading.value = false
    }
  }

  async function save(updates: Partial<DiagramModel>) {
    // Ensure a base diagram exists so toolbar actions can work immediately
    const base: DiagramModel = diagram.value ?? { id: 'main', nodes: [], links: [] }
    const updatedDiagram: DiagramModel = { ...base, ...updates }
    diagram.value = updatedDiagram

    // Save to IndexedDB immediately
    await db.diagrams.put(updatedDiagram)

    try {
      await api.patch('/diagrams/main', updates)
    } catch (err) {
      console.warn('Failed to sync diagram, queuing for later')
      await syncService.enqueueOperation('PATCH', '/diagrams/main', updates)
    }
  }

  return {
    diagram,
    loading,
    error,
    load,
    save
  }
})