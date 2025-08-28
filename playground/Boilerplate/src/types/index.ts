export interface Item {
  id: number
  name: string
  category: string
  quantity: number
  unitPrice: number
  status: 'in-stock' | 'low' | 'out'
  updatedAt: string
}

export interface DiagramModel {
  id: string
  nodes: Array<{
    key: string
    text: string
    category?: 'Supplier' | 'Item' | 'Consumer'
    loc?: string
  }>
  links: Array<{
    from: string
    to: string
  }>
}

export interface OutboxEntry {
  id?: number
  method: string
  path: string
  body?: any
  timestamp: number
}