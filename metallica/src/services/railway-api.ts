import { api } from './api'
import type { 
  RailwayNetwork, 
  RailwayNode, 
  Connection, 
  Signal,
  TrafficFlow,
  PerformanceMetrics,
  MaintenanceRecord,
  APIResponse,
  PaginationParams
} from '@/types/railway'

export class RailwayAPIService {
  
  // Network Management
  async getNetworks(params?: PaginationParams): Promise<APIResponse<RailwayNetwork[]>> {
    return api.get('/networks', { params })
  }

  async getNetwork(id: string): Promise<APIResponse<RailwayNetwork>> {
    return api.get(`/networks/${id}`)
  }

  async createNetwork(network: Omit<RailwayNetwork, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<APIResponse<RailwayNetwork>> {
    return api.post('/networks', network, {
      metadata: {
        successMessage: 'Network created successfully',
        loadingMessage: 'Creating network...'
      }
    })
  }

  async updateNetwork(id: string, network: Partial<RailwayNetwork>): Promise<APIResponse<RailwayNetwork>> {
    return api.put(`/networks/${id}`, network, {
      metadata: {
        successMessage: 'Network updated successfully',
        loadingMessage: 'Saving network...'
      }
    })
  }

  async deleteNetwork(id: string): Promise<APIResponse<void>> {
    return api.delete(`/networks/${id}`, {
      metadata: {
        successMessage: 'Network deleted successfully',
        loadingMessage: 'Deleting network...'
      }
    })
  }

  async duplicateNetwork(id: string, name: string): Promise<APIResponse<RailwayNetwork>> {
    return api.post(`/networks/${id}/duplicate`, { name }, {
      metadata: {
        successMessage: 'Network duplicated successfully',
        loadingMessage: 'Duplicating network...'
      }
    })
  }

  // Node Management
  async getNodes(networkId: string, params?: PaginationParams): Promise<APIResponse<RailwayNode[]>> {
    return api.get(`/networks/${networkId}/nodes`, { params })
  }

  async getNode(networkId: string, nodeId: string): Promise<APIResponse<RailwayNode>> {
    return api.get(`/networks/${networkId}/nodes/${nodeId}`)
  }

  async createNode(networkId: string, node: Omit<RailwayNode, 'id' | 'createdAt' | 'updatedAt'>): Promise<APIResponse<RailwayNode>> {
    return api.post(`/networks/${networkId}/nodes`, node)
  }

  async updateNode(networkId: string, nodeId: string, node: Partial<RailwayNode>): Promise<APIResponse<RailwayNode>> {
    return api.put(`/networks/${networkId}/nodes/${nodeId}`, node)
  }

  async deleteNode(networkId: string, nodeId: string): Promise<APIResponse<void>> {
    return api.delete(`/networks/${networkId}/nodes/${nodeId}`)
  }

  async bulkUpdateNodes(networkId: string, updates: Array<{ id: string; data: Partial<RailwayNode> }>): Promise<APIResponse<RailwayNode[]>> {
    return api.patch(`/networks/${networkId}/nodes/bulk`, { updates }, {
      metadata: {
        loadingMessage: 'Updating nodes...'
      }
    })
  }

  async bulkDeleteNodes(networkId: string, nodeIds: string[]): Promise<APIResponse<void>> {
    return api.delete(`/networks/${networkId}/nodes/bulk`, {
      data: { nodeIds },
      metadata: {
        loadingMessage: 'Deleting nodes...'
      }
    })
  }

  // Connection Management
  async getConnections(networkId: string, params?: PaginationParams): Promise<APIResponse<Connection[]>> {
    return api.get(`/networks/${networkId}/connections`, { params })
  }

  async createConnection(networkId: string, connection: Omit<Connection, 'id'>): Promise<APIResponse<Connection>> {
    return api.post(`/networks/${networkId}/connections`, connection)
  }

  async updateConnection(networkId: string, connectionId: string, connection: Partial<Connection>): Promise<APIResponse<Connection>> {
    return api.put(`/networks/${networkId}/connections/${connectionId}`, connection)
  }

  async deleteConnection(networkId: string, connectionId: string): Promise<APIResponse<void>> {
    return api.delete(`/networks/${networkId}/connections/${connectionId}`)
  }

  // Signal Management
  async getSignals(networkId: string, params?: PaginationParams): Promise<APIResponse<Signal[]>> {
    return api.get(`/networks/${networkId}/signals`, { params })
  }

  async createSignal(networkId: string, signal: Omit<Signal, 'id'>): Promise<APIResponse<Signal>> {
    return api.post(`/networks/${networkId}/signals`, signal)
  }

  async updateSignal(networkId: string, signalId: string, signal: Partial<Signal>): Promise<APIResponse<Signal>> {
    return api.put(`/networks/${networkId}/signals/${signalId}`, signal)
  }

  async deleteSignal(networkId: string, signalId: string): Promise<APIResponse<void>> {
    return api.delete(`/networks/${networkId}/signals/${signalId}`)
  }

  async updateSignalState(networkId: string, signalId: string, state: Signal['state']): Promise<APIResponse<Signal>> {
    return api.patch(`/networks/${networkId}/signals/${signalId}/state`, { state })
  }

  // Real-time Data
  async getTrafficFlows(networkId: string): Promise<APIResponse<TrafficFlow[]>> {
    return api.get(`/networks/${networkId}/traffic-flows`)
  }

  async getPerformanceMetrics(networkId: string, timeframe?: '1h' | '24h' | '7d' | '30d'): Promise<APIResponse<PerformanceMetrics>> {
    return api.get(`/networks/${networkId}/performance-metrics`, {
      params: { timeframe }
    })
  }

  async getRealtimeStatus(networkId: string): Promise<APIResponse<any>> {
    return api.get(`/networks/${networkId}/realtime-status`)
  }

  // Maintenance
  async getMaintenanceRecords(networkId: string, params?: PaginationParams): Promise<APIResponse<MaintenanceRecord[]>> {
    return api.get(`/networks/${networkId}/maintenance`, { params })
  }

  async createMaintenanceRecord(networkId: string, record: Omit<MaintenanceRecord, 'id'>): Promise<APIResponse<MaintenanceRecord>> {
    return api.post(`/networks/${networkId}/maintenance`, record, {
      metadata: {
        successMessage: 'Maintenance record created successfully'
      }
    })
  }

  async updateMaintenanceRecord(networkId: string, recordId: string, record: Partial<MaintenanceRecord>): Promise<APIResponse<MaintenanceRecord>> {
    return api.put(`/networks/${networkId}/maintenance/${recordId}`, record)
  }

  // Analytics & Reports
  async getNetworkAnalytics(networkId: string, type: 'capacity' | 'performance' | 'safety' | 'efficiency'): Promise<APIResponse<any>> {
    return api.get(`/networks/${networkId}/analytics/${type}`)
  }

  async generateReport(networkId: string, type: 'summary' | 'detailed' | 'performance', format: 'pdf' | 'excel' | 'csv'): Promise<Blob> {
    return api.download(`/networks/${networkId}/reports/${type}`, `railway-report-${type}.${format}`)
  }

  // Path Finding & Routing
  async findPath(networkId: string, fromNodeId: string, toNodeId: string, options?: {
    algorithm?: 'dijkstra' | 'astar' | 'floyd-warshall'
    constraints?: {
      maxLength?: number
      avoidNodeTypes?: string[]
      preferTrackTypes?: string[]
    }
  }): Promise<APIResponse<{
    path: string[]
    distance: number
    estimatedTime: number
    waypoints: Array<{ nodeId: string; position: { x: number; y: number } }>
  }>> {
    return api.post(`/networks/${networkId}/pathfinding`, {
      fromNodeId,
      toNodeId,
      ...options
    }, {
      metadata: {
        loadingMessage: 'Finding optimal path...'
      }
    })
  }

  async validateNetwork(networkId: string): Promise<APIResponse<{
    isValid: boolean
    errors: Array<{
      type: 'error' | 'warning'
      code: string
      message: string
      nodeId?: string
      connectionId?: string
    }>
    suggestions: Array<{
      type: string
      description: string
      action: string
    }>
  }>> {
    return api.get(`/networks/${networkId}/validate`, {
      metadata: {
        loadingMessage: 'Validating network...'
      }
    })
  }

  // Import/Export
  async exportNetwork(networkId: string, format: 'json' | 'xml' | 'kml' | 'geojson'): Promise<Blob> {
    return api.download(`/networks/${networkId}/export`, `network-${networkId}.${format}`)
  }

  async importNetwork(file: File, options?: {
    format?: 'json' | 'xml' | 'kml' | 'geojson'
    merge?: boolean
    validateBeforeImport?: boolean
  }): Promise<APIResponse<RailwayNetwork>> {
    const formData = new FormData()
    formData.append('file', file)
    if (options) {
      Object.entries(options).forEach(([key, value]) => {
        formData.append(key, value.toString())
      })
    }

    return api.upload('/networks/import', formData)
  }

  // Collaboration
  async shareNetwork(networkId: string, options: {
    email?: string
    permissions: 'view' | 'edit' | 'admin'
    expiresAt?: string
    message?: string
  }): Promise<APIResponse<{ shareId: string; shareUrl: string }>> {
    return api.post(`/networks/${networkId}/share`, options, {
      metadata: {
        successMessage: 'Network shared successfully'
      }
    })
  }

  async getNetworkShares(networkId: string): Promise<APIResponse<Array<{
    id: string
    email: string
    permissions: string
    createdAt: string
    expiresAt?: string
    lastAccessed?: string
  }>>> {
    return api.get(`/networks/${networkId}/shares`)
  }

  async revokeNetworkShare(networkId: string, shareId: string): Promise<APIResponse<void>> {
    return api.delete(`/networks/${networkId}/shares/${shareId}`, {
      metadata: {
        successMessage: 'Share access revoked'
      }
    })
  }

  // Version Control
  async getNetworkVersions(networkId: string): Promise<APIResponse<Array<{
    version: number
    createdAt: string
    author: string
    message?: string
    changes: Array<{
      type: 'added' | 'modified' | 'deleted'
      entityType: 'node' | 'connection' | 'signal'
      entityId: string
      description: string
    }>
  }>>> {
    return api.get(`/networks/${networkId}/versions`)
  }

  async revertNetworkVersion(networkId: string, version: number): Promise<APIResponse<RailwayNetwork>> {
    return api.post(`/networks/${networkId}/revert/${version}`, {}, {
      metadata: {
        loadingMessage: 'Reverting to version...',
        successMessage: 'Network reverted successfully'
      }
    })
  }

  async createNetworkCheckpoint(networkId: string, message?: string): Promise<APIResponse<{ version: number }>> {
    return api.post(`/networks/${networkId}/checkpoint`, { message }, {
      metadata: {
        successMessage: 'Checkpoint created successfully'
      }
    })
  }

  // Search
  async searchNetworks(query: string, filters?: {
    region?: string
    operator?: string
    minNodes?: number
    maxNodes?: number
    tags?: string[]
  }): Promise<APIResponse<RailwayNetwork[]>> {
    return api.get('/networks/search', {
      params: { query, ...filters }
    })
  }

  async searchNodes(networkId: string, query: string, filters?: {
    type?: string
    operational?: boolean
    tags?: string[]
  }): Promise<APIResponse<RailwayNode[]>> {
    return api.get(`/networks/${networkId}/nodes/search`, {
      params: { query, ...filters }
    })
  }

  // WebSocket connections for real-time updates
  connectToRealtime(networkId: string, callbacks: {
    onNodeUpdate?: (node: RailwayNode) => void
    onConnectionUpdate?: (connection: Connection) => void
    onSignalUpdate?: (signal: Signal) => void
    onTrafficUpdate?: (flow: TrafficFlow) => void
    onError?: (error: any) => void
  }): WebSocket {
    const wsUrl = import.meta.env.VITE_WS_URL || 'wss://api.railway.com/ws'
    const ws = new WebSocket(`${wsUrl}/networks/${networkId}/realtime`)
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      
      switch (data.type) {
        case 'node_update':
          callbacks.onNodeUpdate?.(data.payload)
          break
        case 'connection_update':
          callbacks.onConnectionUpdate?.(data.payload)
          break
        case 'signal_update':
          callbacks.onSignalUpdate?.(data.payload)
          break
        case 'traffic_update':
          callbacks.onTrafficUpdate?.(data.payload)
          break
        default:
          console.log('Unknown realtime event:', data)
      }
    }
    
    ws.onerror = (error) => {
      callbacks.onError?.(error)
    }
    
    return ws
  }
}

// Create and export singleton instance
export const railwayAPI = new RailwayAPIService()