import { defineStore } from 'pinia'
import type { 
  RailwayNetwork, 
  RailwayNode, 
  Connection, 
  Signal,
  TrafficFlow,
  PerformanceMetrics 
} from '@/types/railway'
import { railwayAPI } from '@services/railway-api'
import { storage } from '@utils/storage'

interface RailwayState {
  // Core data
  currentNetwork: RailwayNetwork | null
  networks: RailwayNetwork[]
  selectedNodes: string[]
  selectedConnections: string[]
  
  // UI state
  viewMode: 'grid' | 'diagram' | 'hybrid'
  isLoading: boolean
  isDirty: boolean
  lastSaved: string | null
  
  // Real-time data
  trafficFlows: TrafficFlow[]
  performanceMetrics: PerformanceMetrics | null
  
  // Filters and search
  nodeFilter: {
    type?: string
    status?: string
    search?: string
  }
  connectionFilter: {
    type?: string
    status?: string
    search?: string
  }
}

export const useRailwayStore = defineStore('railway', {
  state: (): RailwayState => ({
    currentNetwork: null,
    networks: [],
    selectedNodes: [],
    selectedConnections: [],
    
    viewMode: 'diagram',
    isLoading: false,
    isDirty: false,
    lastSaved: null,
    
    trafficFlows: [],
    performanceMetrics: null,
    
    nodeFilter: {},
    connectionFilter: {}
  }),

  getters: {
    // Minimal getters to prevent infinite loops
    hasSelection: (state) => {
      return state.selectedNodes.length > 0 || state.selectedConnections.length > 0
    },

    // Simple getters that don't access complex objects
    networkCount: (state) => state.networks.length,
    selectedCount: (state) => state.selectedNodes.length + state.selectedConnections.length,

    // Essential getters for components
    networkNodes: (state): RailwayNode[] => {
      if (!state.currentNetwork || !state.currentNetwork.nodes) return []
      return Object.values(state.currentNetwork.nodes)
    },

    networkConnections: (state): Connection[] => {
      if (!state.currentNetwork || !state.currentNetwork.connections) return []
      return Object.values(state.currentNetwork.connections)
    },

    // Simple filtered getters
    filteredNodes: (state): RailwayNode[] => {
      if (!state.currentNetwork || !state.currentNetwork.nodes) return []
      const nodes = Object.values(state.currentNetwork.nodes)
      return nodes.filter(node => {
        const { type, status, search } = state.nodeFilter
        
        if (type && node.type !== type) return false
        if (status && node.properties.operational !== (status === 'operational')) return false
        if (search) {
          const searchLower = search.toLowerCase()
          return (
            node.properties.name.toLowerCase().includes(searchLower) ||
            node.type.toLowerCase().includes(searchLower) ||
            node.metadata.tags.some(tag => tag.toLowerCase().includes(searchLower))
          )
        }
        
        return true
      })
    },

    filteredConnections: (state): Connection[] => {
      if (!state.currentNetwork || !state.currentNetwork.connections) return []
      const connections = Object.values(state.currentNetwork.connections)
      return connections.filter(connection => {
        const { type, status, search } = state.connectionFilter
        
        if (type && connection.type !== type) return false
        if (status && connection.status !== status) return false
        if (search) {
          const searchLower = search.toLowerCase()
          return (
            connection.type.toLowerCase().includes(searchLower) ||
            connection.id.toLowerCase().includes(searchLower)
          )
        }
        
        return true
      })
    }
  },

  actions: {
    // Network management
    async loadNetworks() {
      this.isLoading = true
      try {
        const response = await railwayAPI.getNetworks()
        this.networks = response.data
        
        // Load from offline storage if available
        const offlineNetworks = await storage.getAllNetworks()
        const offlineMap = new Map(offlineNetworks.map(n => [n.id, n]))
        
        // Merge with offline data (offline takes precedence if newer)
        this.networks = this.networks.map(network => {
          const offline = offlineMap.get(network.id)
          return offline && new Date(offline.updatedAt) > new Date(network.updatedAt) 
            ? offline 
            : network
        })
        
      } catch (error) {
        console.error('Failed to load networks:', error)
        // Fallback to offline data
        this.networks = await storage.getAllNetworks()
      } finally {
        this.isLoading = false
      }
    },

    async loadNetwork(id: string) {
      this.isLoading = true
      try {
        const response = await railwayAPI.getNetwork(id)
        this.setCurrentNetwork(response.data)
        
        // Save to offline storage
        await storage.saveNetwork(response.data)
        
      } catch (error) {
        console.error('Failed to load network:', error)
        // Try offline storage
        const offlineNetwork = await storage.getNetwork(id)
        if (offlineNetwork) {
          this.setCurrentNetwork(offlineNetwork)
        } else {
          throw error
        }
      } finally {
        this.isLoading = false
      }
    },

    async saveNetwork() {
      if (!this.currentNetwork || !this.isDirty) return

      this.isLoading = true
      try {
        const response = await railwayAPI.updateNetwork(this.currentNetwork.id, this.currentNetwork)
        this.currentNetwork = response.data
        this.isDirty = false
        this.lastSaved = new Date().toISOString()
        
        // Update offline storage
        await storage.saveNetwork(this.currentNetwork)
        
      } catch (error) {
        console.error('Failed to save network:', error)
        // Save to offline storage for later sync
        await storage.saveNetwork(this.currentNetwork)
        this.isDirty = false
        this.lastSaved = new Date().toISOString()
      } finally {
        this.isLoading = false
      }
    },

    setCurrentNetwork(network: RailwayNetwork) {
      this.currentNetwork = network
      this.selectedNodes = []
      this.selectedConnections = []
      this.isDirty = false
    },

    // Node management
    addNode(node: Omit<RailwayNode, 'id' | 'createdAt' | 'updatedAt'>) {
      if (!this.currentNetwork) return

      const newNode: RailwayNode = {
        ...node,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      this.currentNetwork.nodes[newNode.id] = newNode
      this.markDirty()
      
      return newNode.id
    },

    updateNode(id: string, updates: Partial<RailwayNode>) {
      const node = this.currentNetwork?.nodes?.[id]
      if (!node) return

      Object.assign(node, updates, { updatedAt: new Date().toISOString() })
      this.markDirty()
    },

    removeNode(id: string) {
      if (!this.currentNetwork) return

      // Remove node
      delete this.currentNetwork.nodes[id]
      
      // Remove related connections
      if (this.currentNetwork.connections) {
        Object.keys(this.currentNetwork.connections).forEach(connId => {
          const conn = this.currentNetwork!.connections[connId]
          if (conn && (conn.fromNodeId === id || conn.toNodeId === id)) {
            delete this.currentNetwork!.connections[connId]
          }
        })
      }

      // Update selection
      this.selectedNodes = this.selectedNodes.filter(nodeId => nodeId !== id)
      this.markDirty()
    },

    // Connection management
    addConnection(connection: Omit<Connection, 'id'>) {
      if (!this.currentNetwork) return

      const newConnection: Connection = {
        ...connection,
        id: crypto.randomUUID()
      }

      this.currentNetwork.connections[newConnection.id] = newConnection
      this.markDirty()
      
      return newConnection.id
    },

    updateConnection(id: string, updates: Partial<Connection>) {
      const conn = this.currentNetwork?.connections?.[id]
      if (!conn) return

      Object.assign(conn, updates)
      this.markDirty()
    },

    removeConnection(id: string) {
      if (!this.currentNetwork) return

      delete this.currentNetwork.connections[id]
      this.selectedConnections = this.selectedConnections.filter(connId => connId !== id)
      this.markDirty()
    },

    // Bulk operations
    deleteSelected() {
      this.selectedNodes.forEach(id => this.removeNode(id))
      this.selectedConnections.forEach(id => this.removeConnection(id))
      this.clearSelection()
    },

    // Filters
    setNodeFilter(filter: Partial<typeof this.nodeFilter>) {
      this.nodeFilter = { ...this.nodeFilter, ...filter }
    },

    setConnectionFilter(filter: Partial<typeof this.connectionFilter>) {
      this.connectionFilter = { ...this.connectionFilter, ...filter }
    },

    clearFilters() {
      this.nodeFilter = {}
      this.connectionFilter = {}
    },

    // Selection management
    selectNodes(nodeIds: string[], append = false) {
      if (append) {
        this.selectedNodes = [...new Set([...this.selectedNodes, ...nodeIds])]
      } else {
        this.selectedNodes = nodeIds
      }
    },

    selectConnections(connectionIds: string[], append = false) {
      if (append) {
        this.selectedConnections = [...new Set([...this.selectedConnections, ...connectionIds])]
      } else {
        this.selectedConnections = connectionIds
      }
    },

    clearSelection() {
      this.selectedNodes = []
      this.selectedConnections = []
    },

    // Utility methods
    markDirty() {
      this.isDirty = true
      if (this.currentNetwork) {
        this.currentNetwork.updatedAt = new Date().toISOString()
        this.currentNetwork.version += 1
      }
    },

    getNodeById(id: string): RailwayNode | null {
      return this.currentNetwork?.nodes?.[id] || null
    },

    getConnectionById(id: string): Connection | null {
      return this.currentNetwork?.connections?.[id] || null
    }
  }
})