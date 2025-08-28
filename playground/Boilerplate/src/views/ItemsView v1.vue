<template>
  <div class="items-view">
    <h1>📋 Inventory Items</h1>

    <Toolbar @add="handleAdd" @delete="handleDelete" :has-selection="selectedItems.length > 0" />

    <div class="card">
      <ItemsGrid @selection-changed="handleSelectionChanged" @cell-value-changed="handleCellValueChanged" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useItemsStore } from '@/stores/items'
import ItemsGrid from '@/components/ItemsGrid.vue'
import Toolbar from '@/components/Toolbar.vue'
import type { Item } from '@/types'

const itemsStore = useItemsStore()
const selectedItems = ref<Item[]>([])

const handleSelectionChanged = (items: Item[]) => {
  selectedItems.value = items
}

const handleCellValueChanged = (params: any) => {
  const { data, colDef, newValue } = params
  const field = colDef.field

  itemsStore.update(data.id, { [field]: newValue })
}

const handleAdd = () => {
  const newItem = {
    name: `New Item ${Date.now()}`,
    category: 'General',
    quantity: 0,
    unitPrice: 0,
    status: 'out' as const
  }

  itemsStore.add(newItem)
}

const handleDelete = () => {
  selectedItems.value.forEach(item => {
    itemsStore.remove(item.id)
  })
  selectedItems.value = []
}

onMounted(async () => {
  await itemsStore.load()
})
</script>

<style scoped>
.items-view h1 {
  margin-bottom: 1rem;
  color: #333;
}
</style>