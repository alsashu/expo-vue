import type { PiniaPluginContext } from 'pinia'
import { ref, watch } from 'vue'
import { cloneDeep, isEqual } from 'lodash-es'

interface HistoryEntry {
  timestamp: number
  state: any
  action?: string
  metadata?: Record<string, any>
}

interface UndoRedoState {
  history: HistoryEntry[]
  currentIndex: number
  maxHistorySize: number
  trackedPaths: Set<string>
  isReplaying: boolean
}

const undoRedoStates = new Map<string, UndoRedoState>()

export function undoRedoPlugin({ store }: PiniaPluginContext) {
  // TEMPORARILY DISABLED TO PREVENT INFINITE LOOPS
  // Initialize undo/redo state for this store
  const storeId = store.$id
  
  if (!undoRedoStates.has(storeId)) {
    undoRedoStates.set(storeId, {
      history: [],
      currentIndex: -1,
      maxHistorySize: 100,
      trackedPaths: new Set(),
      isReplaying: false
    })
  }

  const undoRedoState = undoRedoStates.get(storeId)!

  // Add undo/redo methods to store (stub implementations for now)
  store.undo = () => false
  store.redo = () => false
  store.clearHistory = () => {}
  store.canUndo = () => false
  store.canRedo = () => false
  store.getHistorySize = () => 0
  store.setMaxHistorySize = (size: number) => {}
  
  // Method to track specific paths for changes (disabled)
  store.$trackChanges = (paths: string | string[]) => {
    // Disabled to prevent infinite loops
    console.log('$trackChanges called but disabled:', paths)
  }

  // Auto-track all state changes by default (can be disabled)
  // COMPLETELY DISABLED to prevent infinite loops
  // if (false && store.$options?.undoRedo?.autoTrack !== false) {
  //   // Watch for any state changes
  //   store.$subscribe((mutation, state) => {
  //     if (!undoRedoState.isReplaying) {
  //       saveState(storeId, state, mutation.type)
  //     }
  //   })
  // }
}

// All other functions are disabled for now
function setupWatcher(store: any, path: string, storeId: string) {
  // Disabled
}

function getNestedValue(obj: any, path: string) {
  // Disabled
  return undefined
}

function saveState(storeId: string, state: any, action?: string) {
  // Disabled
}

function undo(storeId: string): boolean {
  // Disabled
  return false
}

function redo(storeId: string): boolean {
  // Disabled
  return false
}

function restoreState(storeId: string, state: any) {
  // Disabled
}

function canUndo(storeId: string): boolean {
  // Disabled
  return false
}

function canRedo(storeId: string): boolean {
  // Disabled
  return false
}

function clearHistory(storeId: string) {
  // Disabled
}

function getHistorySize(storeId: string): number {
  // Disabled
  return 0
}

function setMaxHistorySize(storeId: string, size: number) {
  // Disabled
}

function getStoreById(storeId: string) {
  // Disabled
  return null
}

// Global history manager for multiple stores
export const historyManager = {
  // Get combined history from all stores
  getCombinedHistory(): Array<HistoryEntry & { storeId: string }> {
    return []
  },

  // Global undo/redo that works across stores
  globalUndo(): boolean {
    return false
  },

  globalRedo(): boolean {
    return false
  },

  // Clear all history across stores
  clearAllHistory() {
    // Disabled
  },

  // Get statistics
  getStats() {
    return {
      totalStores: 0,
      totalHistoryEntries: 0,
      memoryUsage: 0
    }
  }
}

// Type augmentation for store methods
declare module 'pinia' {
  export interface PiniaCustomProperties {
    undo(): boolean
    redo(): boolean
    clearHistory(): void
    canUndo(): boolean
    canRedo(): boolean
    getHistorySize(): number
    setMaxHistorySize(size: number): void
    $trackChanges(paths: string | string[]): void
  }
}