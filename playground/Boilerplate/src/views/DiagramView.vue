<template>
  <div class="diagram-view">
    <h1>Supply Chain Diagram</h1>

    <!-- Diagram Toolbar -->
    <div class="diagram-toolbar">
      <button @click="addSupplier" class="btn">
        Add Supplier
      </button>
      <button @click="addItem" class="btn">
        Add Item
      </button>
      <button @click="addConsumer" class="btn">
        Add Consumer
      </button>
      <button @click="clearDiagram" class="btn btn-danger">
        Clear All
      </button>
      <button @click="resetToDefault" class="btn btn-secondary">
        Reset to Default
      </button>
    </div>

    <div class="card">
      <DiagramCanvas ref="diagramCanvas" />
    </div>

    <!-- <div class="card">
      <h3>How to Use the Diagram:</h3>
      <div class="instructions-grid">
        <div class="instruction-group">
          <h4>Basic Operations:</h4>
          <ul>
            <li><strong>Double-click nodes</strong> to edit text</li>
            <li><strong>Drag nodes</strong> to reposition them</li>
            <li><strong>Drag from one node to another</strong> to create connections</li>
            <li><strong>Select and delete</strong> nodes using Delete key</li>
          </ul>
        </div>

        <div class="instruction-group">
          <h4>Node Types:</h4>
          <ul>
            <li><span class="supplier-example">Yellow</span> = Suppliers (provide items)</li>
            <li><span class="item-example">Green</span> = Items (products/inventory)</li>
            <li><span class="consumer-example">Red</span> = Consumers (customers/buyers)</li>
          </ul>
        </div>

        <div class="instruction-group">
          <h4>Auto-Save:</h4>
          <ul>
            <li>Changes are <strong>automatically saved</strong></li>
            <li>Data persists when you reload the page</li>
            <li>Works offline and syncs when back online</li>
          </ul>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import DiagramCanvas from '@/components/DiagramCanvas.vue'
import { useDiagramStore } from '@/stores/diagram'

const diagramStore = useDiagramStore()
const diagramCanvas = ref<InstanceType<typeof DiagramCanvas> | null>(null)

const addSupplier = () => {
  const newNode = {
    key: `supplier_${Date.now()}`,
    text: `Supplier ${Date.now()}`,
    category: 'Supplier' as const,
    loc: '50 50'
  }

  if (diagramStore.diagram) {
    diagramStore.diagram.nodes.push(newNode)
    diagramStore.save({ nodes: diagramStore.diagram.nodes })
  }
}

const addItem = () => {
  const newNode = {
    key: `item_${Date.now()}`,
    text: `Item ${Date.now()}`,
    category: 'Item' as const,
    loc: '200 100'
  }

  if (diagramStore.diagram) {
    diagramStore.diagram.nodes.push(newNode)
    diagramStore.save({ nodes: diagramStore.diagram.nodes })
  }
}

const addConsumer = () => {
  const newNode = {
    key: `consumer_${Date.now()}`,
    text: `Consumer ${Date.now()}`,
    category: 'Consumer' as const,
    loc: '350 50'
  }

  if (diagramStore.diagram) {
    diagramStore.diagram.nodes.push(newNode)
    diagramStore.save({ nodes: diagramStore.diagram.nodes })
  }
}

const clearDiagram = () => {
  if (confirm('Are you sure you want to clear all nodes and links?')) {
    diagramStore.save({ nodes: [], links: [] })
  }
}

const resetToDefault = () => {
  if (confirm('Reset to the default supply chain diagram?')) {
    const defaultData = {
      nodes: [
        { key: 'supplier1', text: 'Tech Supplier', category: 'Supplier' as const, loc: '0 0' },
        { key: 'item1', text: 'Laptops', category: 'Item' as const, loc: '200 0' },
        { key: 'item2', text: 'Mice', category: 'Item' as const, loc: '200 100' },
        { key: 'consumer1', text: 'Retail Store', category: 'Consumer' as const, loc: '400 50' }
      ],
      links: [
        { from: 'supplier1', to: 'item1' },
        { from: 'supplier1', to: 'item2' },
        { from: 'item1', to: 'consumer1' },
        { from: 'item2', to: 'consumer1' }
      ]
    }
    diagramStore.save(defaultData)
  }
}
</script>

<style scoped>
.diagram-view h1 {
  margin-bottom: 1rem;
  color: #333;
}

.diagram-toolbar {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  flex-wrap: wrap;
  position: sticky;
  top: 0;
  z-index: 10;
}

.instructions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 1rem;
}

.instruction-group h4 {
  color: #1976d2;
  margin-bottom: 0.5rem;
}

.instruction-group ul {
  margin: 0;
  padding-left: 1.5rem;
}

.instruction-group li {
  margin-bottom: 0.5rem;
}

.supplier-example {
  background: #ffeb3b;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.item-example {
  background: #4caf50;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

.consumer-example {
  background: #f44336;
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: bold;
}

@media (max-width: 768px) {
  .diagram-toolbar {
    flex-direction: column;
  }

  .instructions-grid {
    grid-template-columns: 1fr;
  }
}
</style>