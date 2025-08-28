import Dexie, { Table } from 'dexie'
import type { Item, DiagramModel, OutboxEntry } from '@/types'

export class BoilerplateDB extends Dexie {
  items!: Table<Item>
  diagrams!: Table<DiagramModel>
  outbox!: Table<OutboxEntry>

  constructor() {
    super('Boilerplate')
    this.version(1).stores({
      items: '++id, name, category, status, updatedAt',
      diagrams: 'id',
      outbox: '++id, method, path, timestamp'
    })
  }
}

export const db = new BoilerplateDB()