import { openDB, deleteDB, IDBPDatabase } from 'idb'
import type { RailwayNetwork, RailwayNode, Connection } from '@/types/railway'

const DB_NAME = 'railway-designer-db'
const DB_VERSION = 1

// Object store names
const STORES = {
  NETWORKS: 'networks',
  NODES: 'nodes',
  CONNECTIONS: 'connections',
  CACHE: 'cache',
  SYNC_QUEUE: 'sync_queue',
  METADATA: 'metadata'
} as const

interface CacheEntry {
  key: string
  data: any
  timestamp: number
  expiresAt?: number
  tags?: string[]
}

interface SyncQueueEntry {
  id: string
  type: 'create' | 'update' | 'delete'
  entity: 'network' | 'node' | 'connection'
  entityId: string
  data: any
  timestamp: number
  retries: number
}

interface StorageMetadata {
  key: string
  value: any
  timestamp: number
}

class StorageService {
  private db: IDBPDatabase | null = null
  private initPromise: Promise<void> | null = null

  async init(): Promise<void> {
    if (this.initPromise) return this.initPromise
    
    this.initPromise = this._init()
    return this.initPromise
  }

  private async _init(): Promise<void> {
    try {
      this.db = await openDB(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Networks store
          if (!db.objectStoreNames.contains(STORES.NETWORKS)) {
            const networksStore = db.createObjectStore(STORES.NETWORKS, { keyPath: 'id' })
            networksStore.createIndex('name', 'name')
            networksStore.createIndex('updatedAt', 'updatedAt')
            networksStore.createIndex('offline', 'metadata.offline')
          }

          // Nodes store
          if (!db.objectStoreNames.contains(STORES.NODES)) {
            const nodesStore = db.createObjectStore(STORES.NODES, { keyPath: 'id' })
            nodesStore.createIndex('networkId', 'networkId')
            nodesStore.createIndex('type', 'type')
            nodesStore.createIndex('name', 'properties.name')
            nodesStore.createIndex('operational', 'properties.operational')
          }

          // Connections store
          if (!db.objectStoreNames.contains(STORES.CONNECTIONS)) {
            const connectionsStore = db.createObjectStore(STORES.CONNECTIONS, { keyPath: 'id' })
            connectionsStore.createIndex('networkId', 'networkId')
            connectionsStore.createIndex('fromNodeId', 'fromNodeId')
            connectionsStore.createIndex('toNodeId', 'toNodeId')
            connectionsStore.createIndex('type', 'type')
          }

          // Cache store
          if (!db.objectStoreNames.contains(STORES.CACHE)) {
            const cacheStore = db.createObjectStore(STORES.CACHE, { keyPath: 'key' })
            cacheStore.createIndex('timestamp', 'timestamp')
            cacheStore.createIndex('expiresAt', 'expiresAt')
            cacheStore.createIndex('tags', 'tags', { multiEntry: true })
          }

          // Sync queue store
          if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
            const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' })
            syncStore.createIndex('timestamp', 'timestamp')
            syncStore.createIndex('type', 'type')
            syncStore.createIndex('entity', 'entity')
          }

          // Metadata store
          if (!db.objectStoreNames.contains(STORES.METADATA)) {
            db.createObjectStore(STORES.METADATA, { keyPath: 'key' })
          }
        }
      })
    } catch (error) {
      console.error('Failed to initialize IndexedDB:', error)
      throw error
    }
  }

  private async ensureDB(): Promise<IDBPDatabase> {
    if (!this.db) {
      await this.init()
    }
    return this.db!
  }

  // Network operations
  async saveNetwork(network: RailwayNetwork): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction([STORES.NETWORKS, STORES.NODES, STORES.CONNECTIONS], 'readwrite')
    
    try {
      // Save network
      await tx.objectStore(STORES.NETWORKS).put(network)
      
      // Save nodes with networkId reference
      const nodes = Object.values(network.nodes).map(node => ({
        ...node,
        networkId: network.id
      }))
      
      for (const node of nodes) {
        await tx.objectStore(STORES.NODES).put(node)
      }
      
      // Save connections with networkId reference
      const connections = Object.values(network.connections).map(connection => ({
        ...connection,
        networkId: network.id
      }))
      
      for (const connection of connections) {
        await tx.objectStore(STORES.CONNECTIONS).put(connection)
      }
      
      await tx.done
    } catch (error) {
      tx.abort()
      throw error
    }
  }

  async getNetwork(id: string): Promise<RailwayNetwork | null> {
    const db = await this.ensureDB()
    const network = await db.get(STORES.NETWORKS, id)
    
    if (!network) return null
    
    // Load related nodes and connections
    const [nodes, connections] = await Promise.all([
      this.getNetworkNodes(id),
      this.getNetworkConnections(id)
    ])
    
    return {
      ...network,
      nodes: nodes.reduce((acc, node) => {
        const { networkId, ...nodeData } = node as any
        acc[node.id] = nodeData
        return acc
      }, {} as Record<string, RailwayNode>),
      connections: connections.reduce((acc, connection) => {
        const { networkId, ...connectionData } = connection as any
        acc[connection.id] = connectionData
        return acc
      }, {} as Record<string, Connection>)
    }
  }

  async getAllNetworks(): Promise<RailwayNetwork[]> {
    const db = await this.ensureDB()
    const networks = await db.getAll(STORES.NETWORKS)
    
    // Load full network data for each
    return Promise.all(networks.map(network => this.getNetwork(network.id)))
      .then(results => results.filter(Boolean) as RailwayNetwork[])
  }

  async deleteNetwork(id: string): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction([STORES.NETWORKS, STORES.NODES, STORES.CONNECTIONS], 'readwrite')
    
    try {
      // Delete network
      await tx.objectStore(STORES.NETWORKS).delete(id)
      
      // Delete related nodes
      const nodeIndex = tx.objectStore(STORES.NODES).index('networkId')
      for await (const cursor of nodeIndex.iterate(id)) {
        await cursor.delete()
      }
      
      // Delete related connections
      const connectionIndex = tx.objectStore(STORES.CONNECTIONS).index('networkId')
      for await (const cursor of connectionIndex.iterate(id)) {
        await cursor.delete()
      }
      
      await tx.done
    } catch (error) {
      tx.abort()
      throw error
    }
  }

  private async getNetworkNodes(networkId: string): Promise<RailwayNode[]> {
    const db = await this.ensureDB()
    return db.getAllFromIndex(STORES.NODES, 'networkId', networkId)
  }

  private async getNetworkConnections(networkId: string): Promise<Connection[]> {
    const db = await this.ensureDB()
    return db.getAllFromIndex(STORES.CONNECTIONS, 'networkId', networkId)
  }

  // Cache operations
  async setCache(key: string, data: any, options?: {
    ttl?: number // Time to live in milliseconds
    tags?: string[]
  }): Promise<void> {
    const db = await this.ensureDB()
    const timestamp = Date.now()
    
    const entry: CacheEntry = {
      key,
      data,
      timestamp,
      expiresAt: options?.ttl ? timestamp + options.ttl : undefined,
      tags: options?.tags
    }
    
    await db.put(STORES.CACHE, entry)
  }

  async getCache(key: string): Promise<any> {
    const db = await this.ensureDB()
    const entry = await db.get(STORES.CACHE, key)
    
    if (!entry) return null
    
    // Check expiration
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      await db.delete(STORES.CACHE, key)
      return null
    }
    
    return entry.data
  }

  async deleteCache(key: string): Promise<void> {
    const db = await this.ensureDB()
    await db.delete(STORES.CACHE, key)
  }

  async clearCacheByTags(tags: string[]): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    
    for (const tag of tags) {
      const index = tx.store.index('tags')
      for await (const cursor of index.iterate(tag)) {
        await cursor.delete()
      }
    }
    
    await tx.done
  }

  async clearExpiredCache(): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(STORES.CACHE, 'readwrite')
    const now = Date.now()
    
    for await (const cursor of tx.store) {
      const entry = cursor.value as CacheEntry
      if (entry.expiresAt && now > entry.expiresAt) {
        await cursor.delete()
      }
    }
    
    await tx.done
  }

  // Sync queue operations
  async addToSyncQueue(entry: Omit<SyncQueueEntry, 'id' | 'timestamp' | 'retries'>): Promise<string> {
    const db = await this.ensureDB()
    const id = crypto.randomUUID()
    
    const queueEntry: SyncQueueEntry = {
      ...entry,
      id,
      timestamp: Date.now(),
      retries: 0
    }
    
    await db.put(STORES.SYNC_QUEUE, queueEntry)
    return id
  }

  async getSyncQueue(): Promise<SyncQueueEntry[]> {
    const db = await this.ensureDB()
    return db.getAll(STORES.SYNC_QUEUE)
  }

  async removeSyncQueueEntry(id: string): Promise<void> {
    const db = await this.ensureDB()
    await db.delete(STORES.SYNC_QUEUE, id)
  }

  async updateSyncQueueEntry(id: string, updates: Partial<SyncQueueEntry>): Promise<void> {
    const db = await this.ensureDB()
    const entry = await db.get(STORES.SYNC_QUEUE, id)
    
    if (entry) {
      const updatedEntry = { ...entry, ...updates }
      await db.put(STORES.SYNC_QUEUE, updatedEntry)
    }
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.ensureDB()
    await db.clear(STORES.SYNC_QUEUE)
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.ensureDB()
    const metadata: StorageMetadata = {
      key,
      value,
      timestamp: Date.now()
    }
    
    await db.put(STORES.METADATA, metadata)
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.ensureDB()
    const metadata = await db.get(STORES.METADATA, key)
    return metadata?.value || null
  }

  async deleteMetadata(key: string): Promise<void> {
    const db = await this.ensureDB()
    await db.delete(STORES.METADATA, key)
  }

  // Search operations
  async searchNetworks(query: string): Promise<RailwayNetwork[]> {
    const db = await this.ensureDB()
    const networks = await db.getAll(STORES.NETWORKS)
    
    const queryLower = query.toLowerCase()
    return networks.filter(network => 
      network.name.toLowerCase().includes(queryLower) ||
      network.description.toLowerCase().includes(queryLower) ||
      network.metadata.region.toLowerCase().includes(queryLower) ||
      network.metadata.operator.toLowerCase().includes(queryLower)
    )
  }

  async searchNodes(networkId: string, query: string): Promise<RailwayNode[]> {
    const db = await this.ensureDB()
    const nodes = await db.getAllFromIndex(STORES.NODES, 'networkId', networkId)
    
    const queryLower = query.toLowerCase()
    return nodes.filter(node => 
      node.properties.name.toLowerCase().includes(queryLower) ||
      node.type.toLowerCase().includes(queryLower) ||
      node.metadata.tags.some((tag: string) => tag.toLowerCase().includes(queryLower))
    ).map(({ networkId, ...node }) => node as RailwayNode)
  }

  // Statistics and analytics
  async getStorageStats(): Promise<{
    networks: number
    nodes: number
    connections: number
    cacheEntries: number
    syncQueueSize: number
    estimatedSize: number // bytes
  }> {
    const db = await this.ensureDB()
    
    const [networks, nodes, connections, cache, syncQueue] = await Promise.all([
      db.count(STORES.NETWORKS),
      db.count(STORES.NODES),
      db.count(STORES.CONNECTIONS),
      db.count(STORES.CACHE),
      db.count(STORES.SYNC_QUEUE)
    ])
    
    // Rough estimation of storage usage
    const allData = await Promise.all([
      db.getAll(STORES.NETWORKS),
      db.getAll(STORES.NODES),
      db.getAll(STORES.CONNECTIONS),
      db.getAll(STORES.CACHE)
    ])
    
    const estimatedSize = allData.reduce((size, data) => {
      return size + JSON.stringify(data).length * 2 // rough UTF-16 estimation
    }, 0)
    
    return {
      networks,
      nodes,
      connections,
      cacheEntries: cache,
      syncQueueSize: syncQueue,
      estimatedSize
    }
  }

  // Bulk operations for performance
  async bulkSaveNodes(nodes: Array<RailwayNode & { networkId: string }>): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(STORES.NODES, 'readwrite')
    
    for (const node of nodes) {
      tx.store.put(node)
    }
    
    await tx.done
  }

  async bulkSaveConnections(connections: Array<Connection & { networkId: string }>): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(STORES.CONNECTIONS, 'readwrite')
    
    for (const connection of connections) {
      tx.store.put(connection)
    }
    
    await tx.done
  }

  async bulkDelete(store: keyof typeof STORES, keys: string[]): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(STORES[store], 'readwrite')
    
    for (const key of keys) {
      tx.store.delete(key)
    }
    
    await tx.done
  }

  // Import/Export operations
  async exportAllData(): Promise<{
    networks: RailwayNetwork[]
    metadata: StorageMetadata[]
    version: number
    exportedAt: string
  }> {
    const networks = await this.getAllNetworks()
    const db = await this.ensureDB()
    const metadata = await db.getAll(STORES.METADATA)
    
    return {
      networks,
      metadata,
      version: DB_VERSION,
      exportedAt: new Date().toISOString()
    }
  }

  async importAllData(data: {
    networks: RailwayNetwork[]
    metadata?: StorageMetadata[]
    version?: number
  }): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction([STORES.NETWORKS, STORES.NODES, STORES.CONNECTIONS, STORES.METADATA], 'readwrite')
    
    try {
      // Import networks
      for (const network of data.networks) {
        await this.saveNetwork(network)
      }
      
      // Import metadata
      if (data.metadata) {
        for (const meta of data.metadata) {
          await tx.objectStore(STORES.METADATA).put(meta)
        }
      }
      
      await tx.done
    } catch (error) {
      tx.abort()
      throw error
    }
  }

  // Cleanup operations
  async cleanup(): Promise<void> {
    await Promise.all([
      this.clearExpiredCache(),
      this._cleanupOrphanedRecords()
    ])
  }

  private async _cleanupOrphanedRecords(): Promise<void> {
    const db = await this.ensureDB()
    const networks = await db.getAll(STORES.NETWORKS)
    const networkIds = new Set(networks.map(n => n.id))
    
    // Clean up orphaned nodes
    const nodesTx = db.transaction(STORES.NODES, 'readwrite')
    for await (const cursor of nodesTx.store) {
      const node = cursor.value as any
      if (!networkIds.has(node.networkId)) {
        await cursor.delete()
      }
    }
    await nodesTx.done
    
    // Clean up orphaned connections
    const connectionsTx = db.transaction(STORES.CONNECTIONS, 'readwrite')
    for await (const cursor of connectionsTx.store) {
      const connection = cursor.value as any
      if (!networkIds.has(connection.networkId)) {
        await cursor.delete()
      }
    }
    await connectionsTx.done
  }

  async clearAllData(): Promise<void> {
    const db = await this.ensureDB()
    const tx = db.transaction(
      [STORES.NETWORKS, STORES.NODES, STORES.CONNECTIONS, STORES.CACHE, STORES.SYNC_QUEUE], 
      'readwrite'
    )
    
    await Promise.all([
      tx.objectStore(STORES.NETWORKS).clear(),
      tx.objectStore(STORES.NODES).clear(),
      tx.objectStore(STORES.CONNECTIONS).clear(),
      tx.objectStore(STORES.CACHE).clear(),
      tx.objectStore(STORES.SYNC_QUEUE).clear()
    ])
    
    await tx.done
  }

  // Database management
  async close(): Promise<void> {
    if (this.db) {
      this.db.close()
      this.db = null
      this.initPromise = null
    }
  }

  async deleteDatabase(): Promise<void> {
    await this.close()
    await deleteDB(DB_NAME)
  }

  // Health check
  async isHealthy(): Promise<boolean> {
    try {
      const db = await this.ensureDB()
      // Try to perform a simple read operation
      await db.count(STORES.NETWORKS)
      return true
    } catch {
      return false
    }
  }

  // Migration utilities (for future versions)
  async migrate(fromVersion: number, toVersion: number): Promise<void> {
    console.log(`Migrating storage from version ${fromVersion} to ${toVersion}`)
    
    // Future migration logic would go here
    switch (fromVersion) {
      case 1:
        // Migration from version 1 to 2
        break
      default:
        console.warn('Unknown migration path')
    }
  }
}

// Create and export singleton instance
export const storage = new StorageService()

// Auto-initialize storage when module is imported
storage.init().catch(console.error)

// Periodic cleanup (run every 30 minutes)
if (typeof window !== 'undefined') {
  setInterval(() => {
    storage.cleanup().catch(console.error)
  }, 30 * 60 * 1000)
}