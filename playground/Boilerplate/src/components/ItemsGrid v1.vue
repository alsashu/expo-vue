<template>
  <div class="items-grid">
    <div class="ag-theme-quartz" style="height: 600px; width: 100%;">
      <ag-grid-vue :columnDefs="columnDefs" :rowData="itemsStore.items" :defaultColDef="defaultColDef"
        :rowSelection="'multiple'" :suppressRowClickSelection="true" @grid-ready="onGridReady"
        @selection-changed="onSelectionChanged" @cell-value-changed="onCellValueChanged" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { AgGridVue } from 'ag-grid-vue3'
import type { ColDef, GridReadyEvent, SelectionChangedEvent, CellValueChangedEvent } from 'ag-grid-community'
import { useItemsStore } from '@/stores/items'
import type { Item } from '@/types'

const itemsStore = useItemsStore()

const emit = defineEmits<{
  selectionChanged: [items: Item[]]
  cellValueChanged: [event: CellValueChangedEvent]
}>()

const gridApi = ref<any>(null)

const defaultColDef: ColDef = {
  sortable: true,
  filter: true,
  resizable: true,
  flex: 1
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
      values: ['Electronics', 'Clothing', 'Food', 'General', 'Tools', 'Books']
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
    valueFormatter: (params) => `$${params.value.toFixed(2)}`
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

const onGridReady = (params: GridReadyEvent) => {
  gridApi.value = params.api
}

const onSelectionChanged = (event: SelectionChangedEvent) => {
  const selectedRows = event.api.getSelectedRows()
  emit('selectionChanged', selectedRows)
}

const onCellValueChanged = (event: CellValueChangedEvent) => {
  emit('cellValueChanged', event)
}
</script>

<style scoped>
.items-grid {
  width: 100%;
}
</style>