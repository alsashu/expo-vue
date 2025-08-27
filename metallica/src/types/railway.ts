// Re-export all types for easier imports
export * from './railway'

// Main types
export interface Position {
  x: number
  y: number
}

export interface Dimensions {
  width: number
  height: number
}

export interface RailwayNode {
  id: string
  type: NodeType
  position: Position
  properties: NodeProperties
  connections: Connection[]
  metadata: NodeMetadata
  createdAt: string
  updatedAt: string
}

export type NodeType = 
  | 'station' 
  | 'junction' 
  | 'signal' 
  | 'switch' 
  | 'crossing' 
  | 'bridge' 
  | 'tunnel'

export interface NodeProperties {
  name: string
  description?: string
  capacity?: number
  operational: boolean
  attributes: Record<string, any>
}

export interface NodeMetadata {
  category: string
  priority: number
  tags: string[]
  lastInspection?: string
  maintenanceStatus: 'good' | 'fair' | 'poor' | 'critical'
}

export interface Connection {
  id: string
  fromNodeId: string
  toNodeId: string
  type: TrackType
  properties: TrackProperties
  geometry: TrackGeometry
  status: ConnectionStatus
}

export type TrackType = 
  | 'mainline' 
  | 'siding' 
  | 'yard' 
  | 'industrial' 
  | 'passenger' 
  | 'freight'

export interface TrackProperties {
  length: number // meters
  maxSpeed: number // km/h
  gauge: number // mm
  electrified: boolean
  signaling: SignalingType
  capacity: number // trains per hour
}

export type SignalingType = 'manual' | 'automatic' | 'centralized' | 'ptc'

export interface TrackGeometry {
  points: Position[]
  curves: CurveSegment[]
  gradients: GradientSegment[]
}

export interface CurveSegment {
  startPoint: number
  endPoint: number
  radius: number // meters
}

export interface GradientSegment {
  startPoint: number
  endPoint: number
  grade: number // percentage
}

export type ConnectionStatus = 'active' | 'inactive' | 'maintenance' | 'blocked'

export interface Signal {
  id: string
  nodeId: string
  type: SignalType
  state: SignalState
  position: Position
  direction: number // degrees
  aspects: SignalAspect[]
  controlSystem: string
}

export type SignalType = 'block' | 'distant' | 'home' | 'route' | 'speed'

export interface SignalState {
  aspect: SignalAspect
  indication: string
  timestamp: string
  automatic: boolean
}

export interface SignalAspect {
  color: 'red' | 'yellow' | 'green' | 'white' | 'blue'
  pattern: 'solid' | 'flashing' | 'lunar'
  meaning: string
}

export interface RailwayNetwork {
  id: string
  name: string
  description: string
  nodes: Record<string, RailwayNode>
  connections: Record<string, Connection>
  signals: Record<string, Signal>
  metadata: NetworkMetadata
  version: number
  createdAt: string
  updatedAt: string
}

export interface NetworkMetadata {
  region: string
  operator: string
  totalLength: number // km
  nodeCount: number
  connectionCount: number
  lastSynchronized?: string
  offline: boolean
}

export interface TrafficFlow {
  id: string
  routeId: string
  direction: 'eastbound' | 'westbound' | 'northbound' | 'southbound'
  trainCount: number
  averageSpeed: number
  capacity: number
  utilization: number // percentage
  timestamp: string
}

export interface MaintenanceRecord {
  id: string
  nodeId?: string
  connectionId?: string
  type: 'inspection' | 'repair' | 'upgrade' | 'replacement'
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  description: string
  scheduledDate: string
  completedDate?: string
  technician?: string
  cost?: number
  notes?: string
}

export interface PerformanceMetrics {
  networkId: string
  timestamp: string
  onTimePerformance: number // percentage
  averageDelay: number // minutes
  throughput: number // trains per hour
  reliability: number // percentage
  safetyScore: number // 0-100
  energyEfficiency: number // kWh per train-km
}

// Grid-specific interfaces for AG Grid
export interface GridRowData extends Partial<RailwayNode> {
  [key: string]: any
}

export interface GridColumnDef {
  field: string
  headerName: string
  type?: string
  width?: number
  sortable?: boolean
  filter?: boolean | string
  cellRenderer?: string
  valueGetter?: string
  cellStyle?: any
  hide?: boolean
}

// Diagram-specific interfaces for GoJS
export interface DiagramNodeData {
  key: string
  category: string
  text: string
  loc: string
  color?: string
  size?: string
  [key: string]: any
}

export interface DiagramLinkData {
  from: string
  to: string
  category?: string
  points?: number[]
  color?: string
  thickness?: number
  [key: string]: any
}

// Command palette interfaces
export interface Command {
  id: string
  title: string
  description?: string
  icon?: string
  shortcut?: string
  category: string
  action: () => void | Promise<void>
  disabled?: boolean
  hidden?: boolean
}

export interface CommandCategory {
  id: string
  title: string
  icon?: string
  color?: string
}

// API response interfaces
export interface APIResponse<T = any> {
  success: boolean
  data: T
  message?: string
  errors?: string[]
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
  }
}

export interface PaginationParams {
  page: number
  limit: number
  search?: string
  sort?: string
  order?: 'asc' | 'desc'
  filters?: Record<string, any>
}