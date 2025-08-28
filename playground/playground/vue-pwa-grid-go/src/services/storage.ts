import type { Item, CreateItemRequest } from '@/types';

interface PendingSyncOperation {
  id: string;
  action: 'create' | 'update' | 'delete';
  item: any;
  timestamp: string;
  originalId?: number | string; // For tracking items that were created offline
}

class StorageService {
  private dbName = 'vue-pwa-grid-go';
  private dbVersion = 2; // Increment version for schema changes
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        if (!db.objectStoreNames.contains('items')) {
          const itemsStore = db.createObjectStore('items', { keyPath: 'id', autoIncrement: true });
          itemsStore.createIndex('name', 'name', { unique: false });
          itemsStore.createIndex('category', 'category', { unique: false });
          itemsStore.createIndex('status', 'status', { unique: false });
        }

        if (!db.objectStoreNames.contains('pendingSync')) {
          const pendingStore = db.createObjectStore('pendingSync', { keyPath: 'id', autoIncrement: true });
          pendingStore.createIndex('action', 'action', { unique: false });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
        }

        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
      };
    });
  }

  // Items storage
  async saveItems(items: Item[]): Promise<void> {
    if (!this.db) await this.init();
    const transaction = this.db!.transaction(['items'], 'readwrite');
    const store = transaction.objectStore('items');

    // Clear existing items
    await new Promise<void>((resolve, reject) => {
      const clearRequest = store.clear();
      clearRequest.onsuccess = () => resolve();
      clearRequest.onerror = () => reject(clearRequest.error);
    });

    // Add new items
    for (const item of items) {
      await new Promise<void>((resolve, reject) => {
        // Create a clean copy of the item to avoid cloning issues
        const cleanItem = {
          id: item.id,
          name: item.name,
          category: item.category,
          status: item.status,
          priority: item.priority,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          description: item.description,
          tags: [...item.tags],
          position: { x: item.position.x, y: item.position.y }
        };
        
        const addRequest = store.add(cleanItem);
        addRequest.onsuccess = () => resolve();
        addRequest.onerror = () => reject(addRequest.error);
      });
    }
  }

  async getItems(): Promise<Item[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readonly');
      const store = transaction.objectStore('items');
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async addItem(item: CreateItemRequest): Promise<Item> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      const newItem = {
        id: Date.now(), // Temporary ID for offline storage
        name: item.name,
        category: item.category,
        status: item.status,
        priority: item.priority,
        description: item.description,
        tags: [...item.tags],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        position: { x: 0, y: 0 },
      };

      const request = store.add(newItem);
      request.onsuccess = () => resolve(newItem);
      request.onerror = () => reject(request.error);
    });
  }

  async updateItem(id: number | string, item: Partial<CreateItemRequest>): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const existingItem = getRequest.result;
        if (existingItem) {
          const updatedItem = {
            ...existingItem,
            ...item,
            updatedAt: new Date().toISOString(),
          };
          
          const putRequest = store.put(updatedItem);
          putRequest.onsuccess = () => resolve();
          putRequest.onerror = () => reject(putRequest.error);
        } else {
          reject(new Error('Item not found'));
        }
      };
      getRequest.onerror = () => reject(getRequest.error);
    });
  }

  async deleteItem(id: number | string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['items'], 'readwrite');
      const store = transaction.objectStore('items');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Pending sync storage - Improved version
  async addPendingSync(operation: Omit<PendingSyncOperation, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      
      const syncOperation: PendingSyncOperation = {
        ...operation,
        id: crypto.randomUUID(), // Generate unique ID
        timestamp: new Date().toISOString(),
      };

      const request = store.add(syncOperation);
      request.onsuccess = () => resolve(syncOperation.id);
      request.onerror = () => reject(request.error);
    });
  }

  async getPendingSync(): Promise<PendingSyncOperation[]> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSync'], 'readonly');
      const store = transaction.objectStore('pendingSync');
      
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async removePendingSync(id: string): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      
      const request = store.delete(id);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clearPendingSync(): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['pendingSync'], 'readwrite');
      const store = transaction.objectStore('pendingSync');
      
      const request = store.clear();
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Settings storage
  async saveSetting(key: string, value: any): Promise<void> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readwrite');
      const store = transaction.objectStore('settings');
      
      const request = store.put({ key, value });
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async getSetting(key: string): Promise<any> {
    if (!this.db) await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['settings'], 'readonly');
      const store = transaction.objectStore('settings');
      
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result?.value);
      request.onerror = () => reject(request.error);
    });
  }
}

export const storageService = new StorageService();
export default storageService;
