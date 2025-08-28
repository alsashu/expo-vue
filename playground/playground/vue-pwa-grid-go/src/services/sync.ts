import { apiService } from './api';
import { storageService } from './storage';
import type { Item, CreateItemRequest } from '@/types';

interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
}

class SyncService {
  private isSyncing = false;

  async syncPendingOperations(): Promise<SyncResult> {
    if (this.isSyncing) {
      return { success: false, synced: 0, failed: 0, errors: ['Sync already in progress'] };
    }

    this.isSyncing = true;
    const result: SyncResult = {
      success: true,
      synced: 0,
      failed: 0,
      errors: []
    };

    try {
      // Check if we're online
      const isOnline = await this.checkOnlineStatus();
      if (!isOnline) {
        throw new Error('Not online');
      }

      // Get all pending operations
      const pendingOps = await storageService.getPendingSync();
      
      if (pendingOps.length === 0) {
        return { success: true, synced: 0, failed: 0, errors: [] };
      }

      console.log(`Syncing ${pendingOps.length} pending operations...`);

      // Sort operations by timestamp to maintain order
      pendingOps.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

              // Process each operation
        for (const operation of pendingOps) {
          try {
            console.log(`🔍 [SyncService] Processing operation:`, {
              id: operation.id,
              action: operation.action,
              itemId: operation.item?.id,
              timestamp: operation.timestamp
            });
            
            await this.processSyncOperation(operation);
            await storageService.removePendingSync(operation.id);
            result.synced++;
            console.log(`🔍 [SyncService] Operation ${operation.id} synced successfully`);
          } catch (error) {
            console.error(`🔍 [SyncService] Failed to sync operation ${operation.id}:`, error);
            result.failed++;
            result.errors.push(`Operation ${operation.action} failed: ${error}`);
            
            // If it's a 404 error, the item might not exist on server
            if ((error as any).response?.status === 404) {
              console.log(`🔍 [SyncService] 404 error for operation ${operation.id}, removing from pending sync`);
              await storageService.removePendingSync(operation.id);
              result.synced++; // Count as "handled" even though it failed
            }
          }
        }

      // Reload items from server after sync
      if (result.synced > 0) {
        await this.refreshItemsFromServer();
      }

    } catch (error) {
      console.error('Sync failed:', error);
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async processSyncOperation(operation: any): Promise<void> {
    switch (operation.action) {
      case 'create':
        await this.syncCreateOperation(operation);
        break;
      case 'update':
        await this.syncUpdateOperation(operation);
        break;
      case 'delete':
        await this.syncDeleteOperation(operation);
        break;
      default:
        throw new Error(`Unknown operation type: ${operation.action}`);
    }
  }

  private async syncCreateOperation(operation: any): Promise<void> {
    try {
      const newItem = await apiService.createItem(operation.item);
      console.log('Created item on server:', newItem);
      
      // Update local storage with the real server ID
      if (operation.originalId) {
        await storageService.deleteItem(operation.originalId);
        await storageService.addItem(newItem);
      }
    } catch (error) {
      console.error('Failed to sync create operation:', error);
      throw error;
    }
  }

  private async syncUpdateOperation(operation: any): Promise<void> {
    try {
      console.log('🔍 [SyncService] Attempting to update item:', operation.item.id);
      
      // Check if this is a temporary ID (very large number)
      if (operation.item.id > 1000000000000) {
        console.log('🔍 [SyncService] Item has temporary ID, treating as create operation');
        // This was created offline, treat as create
        const newItem = await apiService.createItem(operation.item);
        console.log('🔍 [SyncService] Created item on server:', newItem);
        
        // Update local storage with the real server ID
        await storageService.deleteItem(operation.item.id);
        await storageService.addItem(newItem);
      } else {
        // This is a real server ID, update normally
        const updatedItem = await apiService.updateItem(operation.item.id, operation.item);
        console.log('🔍 [SyncService] Updated item on server:', updatedItem);
        
        // Update local storage
        await storageService.updateItem(operation.item.id, updatedItem);
      }
    } catch (error) {
      console.error('🔍 [SyncService] Failed to sync update operation:', error);
      throw error;
    }
  }

  private async syncDeleteOperation(operation: any): Promise<void> {
    try {
      await apiService.deleteItem(operation.item.id);
      console.log('Deleted item on server:', operation.item.id);
      
      // Item should already be deleted from local storage
    } catch (error) {
      console.error('Failed to sync delete operation:', error);
      throw error;
    }
  }

  private async checkOnlineStatus(): Promise<boolean> {
    try {
      return await apiService.healthCheck();
    } catch {
      return false;
    }
  }

  private async refreshItemsFromServer(): Promise<void> {
    try {
      const serverItems = await apiService.getItems();
      await storageService.saveItems(serverItems);
      console.log('Refreshed items from server');
    } catch (error) {
      console.error('Failed to refresh items from server:', error);
    }
  }

  // Manual sync trigger
  async manualSync(): Promise<SyncResult> {
    return this.syncPendingOperations();
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pendingCount: number;
    isSyncing: boolean;
    lastSync?: string;
  }> {
    const pendingOps = await storageService.getPendingSync();
    const lastSync = await storageService.getSetting('lastSync');
    
    return {
      pendingCount: pendingOps.length,
      isSyncing: this.isSyncing,
      lastSync
    };
  }
}

export const syncService = new SyncService();
export default syncService;
