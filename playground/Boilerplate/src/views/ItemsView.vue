<template>
  <div class="items-view">
    <h1>📋 Inventory Items</h1>

    <!-- API Test Component (show if no items loaded) -->
    <ApiTest v-if="showApiTest" />

    <Toolbar @add="handleAdd" @delete="handleDelete" :has-selection="selectedItems.length > 0" />

    <div class="card">
      <!-- Loading State -->
      <div v-if="itemsStore.loading" class="loading-state">
        <p>🔄 Loading items...</p>
      </div>

      <!-- Error State -->
      <div v-else-if="itemsStore.error" class="error-state">
        <p>❌ {{ itemsStore.error }}</p>
      </div>

      <!-- No Data State -->
      <div v-else-if="itemsStore.items.length === 0" class="no-data-state">
        <p>📦 No items found</p>
        <p>API Server Status: Check above</p>
        <button @click="handleRefresh" class="btn">🔄 Refresh</button>
      </div>

      <!-- Items Grid -->
      <ItemsGrid
        v-else
        ref="itemsGridRef"
        @selection-changed="handleSelectionChanged"
        @cell-value-changed="handleCellValueChanged"
      />
    </div>

    <!-- Debug Info -->
    <div class="debug-panel">
      <h3>🐛 Debug Info</h3>
      <div class="debug-grid">
        <div><strong>Loading:</strong> {{ itemsStore.loading }}</div>
        <div><strong>Items Count:</strong> {{ itemsStore.items.length }}</div>
        <div><strong>Error:</strong> {{ itemsStore.error || 'None' }}</div>
        <div><strong>Selected:</strong> {{ selectedItems.length }}</div>
      </div>
      <details>
        <summary>Raw Items Data</summary>
        <pre>{{ JSON.stringify(itemsStore.items, null, 2) }}</pre>
      </details>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useItemsStore } from '@/stores/items'
import ItemsGrid from '@/components/ItemsGrid.vue'
import Toolbar from '@/components/Toolbar.vue'
import ApiTest from '@/components/ApiTest.vue'
import type { Item } from '@/types'

const itemsStore = useItemsStore()
const selectedItems = ref<Item[]>([])
const itemsGridRef = ref<InstanceType<typeof ItemsGrid> | null>(null)

const showApiTest = computed(() =>
  !itemsStore.loading && itemsStore.items.length === 0
)

const handleSelectionChanged = (items: Item[]) => {
  selectedItems.value = items
  console.log('🎯 Selected items:', items.length)
}

const handleCellValueChanged = (params: any) => {
  const { data, colDef, newValue } = params
  const field = colDef.field

  console.log('✏️ Cell changed:', field, '→', newValue)
  itemsStore.update(data.id, { [field]: newValue })
}

const handleAdd = async () => {
  console.log('➕ Adding new item...')

  const newItem = {
    name: `New Item ${new Date().toLocaleTimeString()}`,
    category: 'General',
    quantity: 10,
    unitPrice: 25.99,
    status: 'in-stock' as const
  }

  try {
    await itemsStore.add(newItem)
    console.log('✅ Item added successfully. Total items:', itemsStore.items.length)
    // Ensure grid shows the new record immediately
    itemsGridRef.value?.refresh()
  } catch (error) {
    console.error('❌ Failed to add item:', error)
  }
}

const handleDelete = async () => {
  console.log('🗑️ Deleting items:', selectedItems.value.length)

  try {
    for (const item of selectedItems.value) {
      await itemsStore.remove(item.id)
    }
    selectedItems.value = []
    console.log('✅ Items deleted. Remaining:', itemsStore.items.length)
  } catch (error) {
    console.error('❌ Failed to delete items:', error)
  }
}

const handleRefresh = async () => {
  console.log('🔄 Refreshing items...')
  await itemsStore.load()
}

onMounted(async () => {
  console.log('🚀 ItemsView mounted')
  console.log('📊 Initial items count:', itemsStore.items.length)

  await itemsStore.load()

  console.log('📋 Items loaded:', itemsStore.items.length)
  console.log('📍 Current items:', itemsStore.items)
})
</script>

<style scoped>
.items-view h1 {
  margin-bottom: 1rem;
  color: #333;
}

.loading-state,
.error-state,
.no-data-state {
  text-align: center;
  padding: 3rem;
  color: #666;
}

.error-state {
  color: #d32f2f;
  background: #ffebee;
  border-radius: 4px;
}

.loading-state {
  background: #f8f9fa;
  border-radius: 4px;
}

.debug-panel {
  margin-top: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid #dee2e6;
}

.debug-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.debug-panel details {
  margin-top: 1rem;
}

.debug-panel pre {
  background: #fff;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
  max-height: 300px;
  font-size: 0.8rem;
}
</style>