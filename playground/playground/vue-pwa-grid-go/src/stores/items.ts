import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Item, CreateItemRequest, UpdateItemRequest, GridState } from '@/types';
import { apiService } from '@/services/api';
import { storageService } from '@/services/storage';
import { syncService } from '@/services/sync';
import { useAppStore } from './app';

export const useItemsStore = defineStore('items', () => {
  // State
  const items = ref<Item[]>([]);
  const loading = ref(false);
  const selectedItems = ref<Item[]>([]);
  const filters = ref({
    category: '',
    status: '',
    priority: '',
    search: '',
  });

  // Stores
  const appStore = useAppStore();

  // Computed
  const filteredItems = computed(() => {
    let filtered = items.value;

    if (filters.value.category) {
      filtered = filtered.filter(item => item.category === filters.value.category);
    }

    if (filters.value.status) {
      filtered = filtered.filter(item => item.status === filters.value.status);
    }

    if (filters.value.search) {
      const searchTerm = filters.value.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    return filtered;
  });

  const itemsByStatus = computed(() => {
    const grouped = {
      Available: 0,
      'In Progress': 0,
      Completed: 0,
      Pending: 0,
      Planning: 0,
    };

    items.value.forEach(item => {
      grouped[item.status] = (grouped[item.status] || 0) + 1;
    });

    return grouped;
  });

  const itemsByCategory = computed(() => {
    const grouped: Record<string, number> = {};
    items.value.forEach(item => {
      grouped[item.category] = (grouped[item.category] || 0) + 1;
    });
    return grouped;
  });

  const itemsByPriority = computed(() => {
    const grouped = {
      High: 0,
      Medium: 0,
      Low: 0,
    };

    items.value.forEach(item => {
      grouped[item.priority] = (grouped[item.priority] || 0) + 1;
    });

    return grouped;
  });

  // Actions
  const loadItems = async (useCache = true) => {
    loading.value = true;
    try {
      if (appStore.isOnline) {
        // Try to load from API
        const apiItems = await apiService.getItems();
        items.value = apiItems;
        
        // Cache the items for offline use
        await storageService.saveItems(apiItems);
        
        // Save last sync timestamp
        await storageService.saveSetting('lastSync', new Date().toISOString());
      } else if (useCache) {
        // Load from IndexedDB when offline
        const cachedItems = await storageService.getItems();
        items.value = cachedItems;
      }
    } catch (error) {
      console.error('Failed to load items:', error);
      
      if (useCache) {
        // Fallback to cached data
        const cachedItems = await storageService.getItems();
        items.value = cachedItems;
      }
    } finally {
      loading.value = false;
    }
  };

  const createItem = async (itemData: CreateItemRequest) => {
    try {
      if (appStore.isOnline) {
        // Create via API
        const newItem = await apiService.createItem(itemData);
        items.value.push(newItem);
        await storageService.saveItems(items.value);
        return newItem;
      } else {
        // Store locally and add to pending sync
        const newItem = await storageService.addItem(itemData);
        
        // Add to pending sync with original ID for tracking
        await storageService.addPendingSync({
          action: 'create',
          item: itemData,
          originalId: newItem.id
        });
        
        // Add to local state immediately
        items.value.push(newItem);
        
        // Update app store pending sync count
        appStore.addToPendingSync(newItem);
        
        return newItem;
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      throw error;
    }
  };

  const updateItem = async (id: number | string, itemData: Partial<CreateItemRequest>) => {
    console.log('🔍 [ItemsStore] updateItem called:', { id, itemData, isOnline: appStore.isOnline, idType: typeof id });
    
    try {
      if (appStore.isOnline) {
        console.log('🔍 [ItemsStore] Online - updating via API');
        // Update via API
        const updatedItem = await apiService.updateItem(id, itemData);
        console.log('🔍 [ItemsStore] API update successful:', updatedItem);
        
        const index = items.value.findIndex(item => item.id === id);
        if (index !== -1) {
          items.value[index] = updatedItem;
          console.log('🔍 [ItemsStore] Local state updated');
        } else {
          console.warn('🔍 [ItemsStore] Item not found in local state for update');
        }
        
        await storageService.saveItems(items.value);
        console.log('🔍 [ItemsStore] Storage updated');
        return updatedItem;
      } else {
        console.log('🔍 [ItemsStore] Offline - updating locally');
        // Update locally and add to pending sync
        await storageService.updateItem(id, itemData);
        console.log('🔍 [ItemsStore] Local storage updated');
        
        // Add to pending sync
        await storageService.addPendingSync({
          action: 'update',
          item: { id, ...itemData }
        });
        console.log('🔍 [ItemsStore] Added to pending sync');
        
        // Update local state immediately
        const index = items.value.findIndex(item => item.id === id);
        if (index !== -1) {
          items.value[index] = { ...items.value[index], ...itemData };
          console.log('🔍 [ItemsStore] Local state updated');
        } else {
          console.warn('🔍 [ItemsStore] Item not found in local state for update');
        }
        
        return items.value[index];
      }
    } catch (error) {
      console.error('🔍 [ItemsStore] Failed to update item:', error);
      console.error('🔍 [ItemsStore] Error details:', {
        id,
        itemData,
        isOnline: appStore.isOnline,
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  };

  const deleteItem = async (id: number | string) => {
    try {
      if (appStore.isOnline) {
        // Delete via API
        await apiService.deleteItem(id);
        items.value = items.value.filter(item => item.id !== id);
        await storageService.saveItems(items.value);
      } else {
        // Delete locally and add to pending sync
        const itemToDelete = items.value.find(item => item.id === id);
        if (itemToDelete) {
          // Remove from local state immediately
          items.value = items.value.filter(item => item.id !== id);
          
          // Delete from local storage
          await storageService.deleteItem(id);
          
          // Add to pending sync
          await storageService.addPendingSync({
            action: 'delete',
            item: itemToDelete
          });
          
          // Update app store pending sync count
          appStore.removeFromPendingSync(id);
        }
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      throw error;
    }
  };

  const setSelectedItems = (selected: Item[]) => {
    selectedItems.value = selected;
  };

  const updateFilters = (newFilters: Partial<typeof filters.value>) => {
    filters.value = { ...filters.value, ...newFilters };
  };

  const clearFilters = () => {
    filters.value = {
      category: '',
      status: '',
      priority: '',
      search: '',
    };
  };

  // Sync operations
  const syncPendingOperations = async () => {
    try {
      const result = await syncService.syncPendingOperations();
      if (result.success && result.synced > 0) {
        // Reload items after successful sync
        await loadItems();
      }
      return result;
    } catch (error) {
      console.error('Failed to sync pending operations:', error);
      throw error;
    }
  };

  const getSyncStatus = async () => {
    return await syncService.getSyncStatus();
  };

  return {
    // State
    items,
    loading,
    selectedItems,
    filters,

    // Computed
    filteredItems,
    itemsByStatus,
    itemsByCategory,
    itemsByPriority,

    // Actions
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    setSelectedItems,
    updateFilters,
    clearFilters,
    
    // Sync operations
    syncPendingOperations,
    getSyncStatus,
  };
});
