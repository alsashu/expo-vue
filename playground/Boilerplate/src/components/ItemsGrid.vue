<template>
  <div class="items-grid">
    <!-- Loading State -->
    <div v-if="itemsStore.loading" class="loading">
      Loading items...
    </div>

    <!-- Error State -->
    <div v-else-if="itemsStore.error" class="error">
      Error: {{ itemsStore.error }}
    </div>

    <!-- No Data State -->
    <div v-else-if="itemsStore.items.length === 0" class="no-data">
      No items found. Click "Add Item" to create some inventory items.
    </div>

    <!-- AG Grid Container - Always show if we have data -->
    <div v-else class="ag-theme-quartz ag-grid-container" :style="gridContainerStyle">
      <ag-grid-vue ref="agGridRef" :columnDefs="columnDefs" :rowData="itemsStore.items" :defaultColDef="defaultColDef"
        :rowSelection="'multiple'" :suppressRowClickSelection="true" :animateRows="true" :enableCellTextSelection="true"
        :suppressMenuHide="false" :getRowId="getRowId" @grid-ready="onGridReady" @selection-changed="onSelectionChanged"
        @cell-value-changed="onCellValueChanged" style="height: 100%; width: 100%;" />
    </div>

    <!-- Force Refresh Button -->
    <div v-if="itemsStore.items.length > 0 && !gridVisible" class="grid-fix">
      <p>Grid not displaying properly?</p>
      <button @click="forceGridRefresh" class="btn">🔄 Force Refresh Grid</button>
    </div>

    <!-- Usage Instructions -->
    <!-- <div v-if="itemsStore.items.length > 0" class="instructions">
      <h4>How to use the grid:</h4>
      <ul>
        <li><strong>Select items:</strong> Click the checkbox to select rows</li>
        <li><strong>Edit data:</strong> Double-click any cell to edit it</li>
        <li><strong>Sort:</strong> Click column headers to sort</li>
        <li><strong>Filter:</strong> Use the filter icon in column headers</li>
        <li><strong>Delete:</strong> Select items and click "Delete Selected"</li>
      </ul>
    </div> -->
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick, watch } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type { ColDef, GridReadyEvent, SelectionChangedEvent, CellValueChangedEvent, GridApi } from 'ag-grid-community'
import { useItemsStore } from '@/stores/items'
import type { Item } from '@/types'

const itemsStore = useItemsStore()
const agGridRef = ref<InstanceType<typeof AgGridVue> | null>(null)
const gridApi = ref<GridApi | null>(null)
const gridVisible = ref(false)

const emit = defineEmits<{
  selectionChanged: [items: Item[]]
  cellValueChanged: [event: CellValueChangedEvent]
}>()

// Computed style for grid container
const gridContainerStyle = computed(() => ({
  height: '600px',
  width: '100%',
  minHeight: '600px',
  border: '2px solid #ddd',
  borderRadius: '4px',
  backgroundColor: '#ffffff'
}))

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1,
  minWidth: 100
}

const columnDefs: ColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 80,
    editable: false,
    checkboxSelection: true,
    headerCheckboxSelection: true
  },
  {
    field: 'name',
    headerName: 'Name',
    editable: true,
    minWidth: 150
  },
  {
    field: 'category',
    headerName: 'Category',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['Electronics', 'Clothing', 'Food', 'General', 'Tools', 'Books', 'Furniture', 'Office']
    }
  },
  {
    field: 'quantity',
    headerName: 'Quantity',
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor'
  },
  {
    field: 'unitPrice',
    headerName: 'Unit Price',
    editable: true,
    type: 'numericColumn',
    cellEditor: 'agNumberCellEditor',
    valueFormatter: (params) => `$${params.value?.toFixed(2) || '0.00'}`
  },
  {
    field: 'status',
    headerName: 'Status',
    editable: true,
    cellEditor: 'agSelectCellEditor',
    cellEditorParams: {
      values: ['in-stock', 'low', 'out']
    },
    cellRenderer: (params: any) => {
      const status = params.value
      const color = status === 'in-stock' ? '#4caf50' : status === 'low' ? '#ff9800' : '#f44336'
      return `<span style="color: ${color}; font-weight: bold;">${status}</span>`
    }
  },
  {
    field: 'updatedAt',
    headerName: 'Updated',
    editable: false,
    valueFormatter: (params) => new Date(params.value).toLocaleDateString()
  }
]

// Row ID getter for better performance
const getRowId = (params: any) => params.data.id.toString()

const onGridReady = (params: GridReadyEvent) => {
  console.log('🎯 AG Grid Ready with', itemsStore.items.length, 'items')
  gridApi.value = params.api

  // Force grid to display properly
  nextTick(() => {
    params.api.setRowData(itemsStore.items)
    params.api.sizeColumnsToFit()
    gridVisible.value = true
    console.log('✅ Grid data set and columns sized')
  })
}

const onSelectionChanged = (event: SelectionChangedEvent) => {
  const selectedRows = event.api.getSelectedRows()
  emit('selectionChanged', selectedRows)
}

const onCellValueChanged = (event: CellValueChangedEvent) => {
  emit('cellValueChanged', event)
}

const forceGridRefresh = () => {
  if (gridApi.value) {
    console.log('🔄 Force refreshing grid...')
    gridApi.value.setRowData(itemsStore.items)
    gridApi.value.sizeColumnsToFit()
    gridApi.value.redrawRows()
    gridVisible.value = true
  }
}

defineExpose({
  refresh: forceGridRefresh
})

// Watch for data changes and update grid
watch(() => itemsStore.items, (newItems, oldItems) => {
  if (gridApi.value && newItems && newItems !== oldItems) {
    console.log('📊 Updating grid with', newItems.length, 'items')
    gridApi.value.setRowData(newItems)
    if (!gridVisible.value) {
      forceGridRefresh()
    }
  }
}, { deep: true, immediate: true })

onMounted(async () => {
  console.log('🚀 ItemsGrid mounted')

  // Ensure items are loaded
  if (itemsStore.items.length === 0) {
    await itemsStore.load()
  }

  // Give the grid time to initialize
  await nextTick()

  // If we have data but grid isn't showing, force refresh
  setTimeout(() => {
    if (itemsStore.items.length > 0 && !gridVisible.value) {
      console.log('⚠️ Grid not visible, attempting force refresh')
      forceGridRefresh()
    }
  }, 1000)
})
</script>

<style scoped>
.items-grid {
  width: 100%;
}

.ag-grid-container {
  position: relative;
  box-sizing: border-box;
  /* Force grid to be visible */
  display: block !important;
  overflow: hidden;
}

.loading,
.error,
.no-data {
  padding: 2rem;
  text-align: center;
  color: #666;
  background: #f8f9fa;
  border-radius: 4px;
  margin: 1rem 0;
}

.error {
  color: #d32f2f;
  background: #ffebee;
}

.grid-fix {
  background: #fff3cd;
  border: 1px solid #ffeaa7;
  border-radius: 4px;
  padding: 1rem;
  margin: 1rem 0;
  text-align: center;
}

.grid-fix p {
  margin-bottom: 0.5rem;
  color: #856404;
}

.instructions {
  margin-top: 1rem;
  padding: 1rem;
  background: #e3f2fd;
  border-radius: 4px;
  border-left: 4px solid #1976d2;
}

.instructions h4 {
  margin-bottom: 0.5rem;
  color: #1976d2;
}

.instructions ul {
  margin: 0;
  padding-left: 1.5rem;
}

.instructions li {
  margin-bottom: 0.5rem;
}

/* Ensure AG Grid CSS is properly applied */
:deep(.ag-theme-quartz) {
  --ag-header-height: 40px;
  --ag-row-height: 35px;
  --ag-border-color: #ddd;
  --ag-header-background-color: #f8f9fa;
}

:deep(.ag-root-wrapper) {
  border: 1px solid var(--ag-border-color);
  border-radius: 4px;
}
</style>