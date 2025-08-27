import { ref, computed, watch, onMounted, onUnmounted, readonly, markRaw } from 'vue'
import type { GridApi, ColumnApi, GridOptions, ColDef, RowSelectedEvent } from 'ag-grid-community'
import { useUIStore } from '@/stores/ui'
import { useRailwayStore } from '@/stores/railway'
import type { RailwayNode, Connection } from '@/types/railway'

export interface GridConfig {
  entityType: 'nodes' | 'connections'
  enableSelection?: boolean
  enableGrouping?: boolean
  enableFiltering?: boolean
  enableSorting?: boolean
  enableExport?: boolean
  pageSize?: number
  virtualScrolling?: boolean
}

export function useGrid(config: GridConfig) {
  const uiStore = useUIStore()
  const railwayStore = useRailwayStore()
  
  // Grid instances - use markRaw to prevent Vue from making them reactive
  const gridApi = ref<GridApi | null>(null)
  const columnApi = ref<ColumnApi | null>(null)
  
  // Grid state
  const loading = ref(false)
  const selectedRows = ref<any[]>([])
  const filteredRowCount = ref(0)
  const totalRowCount = ref(0)
  
  // Get data based on entity type
  const rowData = computed(() => {
    switch (config.entityType) {
      case 'nodes':
        // Create local filtered nodes since the store getter was removed
        const allNodes = railwayStore.currentNetwork ? Object.values(railwayStore.currentNetwork.nodes || {}) : []
        const filteredNodes = allNodes.filter(node => {
          const { type, status, search } = railwayStore.nodeFilter
          
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
        
        return filteredNodes.map(node => ({
          ...node,
          // Flatten nested properties for grid display
          nodeName: node.properties.name,
          nodeType: node.type,
          operational: node.properties.operational,
          capacity: node.properties.capacity || 0,
          maintenanceStatus: node.metadata.maintenanceStatus,
          tags: node.metadata.tags.join(', '),
          lastInspection: node.metadata.lastInspection || 'Never',
          x: node.position.x,
          y: node.position.y
        }))
      case 'connections':
        // Create local filtered connections since the store getter was removed
        const allConnections = railwayStore.currentNetwork ? Object.values(railwayStore.currentNetwork.connections || {}) : []
        const filteredConnections = allConnections.filter(connection => {
          const { type, status, search } = railwayStore.connectionFilter
          
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
        
        return filteredConnections.map(connection => ({
          ...connection,
          connectionType: connection.type,
          fromNode: railwayStore.getNodeById(connection.fromNodeId)?.properties.name || 'Unknown',
          toNode: railwayStore.getNodeById(connection.toNodeId)?.properties.name || 'Unknown',
          length: connection.properties.length,
          maxSpeed: connection.properties.maxSpeed,
          electrified: connection.properties.electrified,
          signaling: connection.properties.signaling,
          status: connection.status
        }))
      default:
        return []
    }
  })

  // Column definitions based on entity type
  const columnDefs = computed<ColDef[]>(() => {
    const baseColumns: ColDef[] = []

    if (config.enableSelection) {
      baseColumns.push({
        headerCheckboxSelection: true,
        checkboxSelection: true,
        width: 50,
        pinned: 'left',
        lockPosition: true,
        suppressMenu: true
      })
    }

    const entityColumns: ColDef[] = config.entityType === 'nodes' ? [
      {
        field: 'nodeName',
        headerName: 'Name',
        pinned: 'left',
        width: 200,
        filter: 'agTextColumnFilter',
        sortable: true
      },
      {
        field: 'nodeType',
        headerName: 'Type',
        width: 120,
        filter: 'agSetColumnFilter',
        sortable: true,
        cellStyle: { textTransform: 'capitalize' }
      },
      {
        field: 'operational',
        headerName: 'Status',
        width: 100,
        cellRenderer: 'statusCellRenderer',
        filter: 'agSetColumnFilter',
        sortable: true
      },
      {
        field: 'capacity',
        headerName: 'Capacity',
        width: 100,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: params => params.value ? `${params.value}` : 'N/A'
      },
      {
        field: 'maintenanceStatus',
        headerName: 'Maintenance',
        width: 130,
        cellRenderer: 'maintenanceCellRenderer',
        filter: 'agSetColumnFilter',
        sortable: true
      },
      {
        field: 'tags',
        headerName: 'Tags',
        width: 200,
        filter: 'agTextColumnFilter',
        sortable: false,
        cellRenderer: 'tagsCellRenderer'
      },
      {
        field: 'lastInspection',
        headerName: 'Last Inspection',
        width: 140,
        sortable: true,
        filter: 'agDateColumnFilter',
        valueFormatter: params => {
          if (!params.value || params.value === 'Never') return 'Never'
          return new Date(params.value).toLocaleDateString()
        }
      }
    ] : [
      {
        field: 'fromNode',
        headerName: 'From',
        pinned: 'left',
        width: 150,
        filter: 'agTextColumnFilter',
        sortable: true
      },
      {
        field: 'toNode',
        headerName: 'To',
        pinned: 'left',
        width: 150,
        filter: 'agTextColumnFilter',
        sortable: true
      },
      {
        field: 'connectionType',
        headerName: 'Type',
        width: 120,
        filter: 'agSetColumnFilter',
        sortable: true,
        cellStyle: { textTransform: 'capitalize' }
      },
      {
        field: 'length',
        headerName: 'Length (m)',
        width: 120,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: params => `${params.value.toLocaleString()} m`
      },
      {
        field: 'maxSpeed',
        headerName: 'Max Speed',
        width: 120,
        type: 'numericColumn',
        filter: 'agNumberColumnFilter',
        sortable: true,
        valueFormatter: params => `${params.value} km/h`
      },
      {
        field: 'electrified',
        headerName: 'Electrified',
        width: 100,
        cellRenderer: 'booleanCellRenderer',
        filter: 'agSetColumnFilter',
        sortable: true
      },
      {
        field: 'signaling',
        headerName: 'Signaling',
        width: 120,
        filter: 'agSetColumnFilter',
        sortable: true,
        cellStyle: { textTransform: 'capitalize' }
      },
      {
        field: 'status',
        headerName: 'Status',
        width: 120,
        cellRenderer: 'statusCellRenderer',
        filter: 'agSetColumnFilter',
        sortable: true
      }
    ]

    return baseColumns.concat(entityColumns)
  })

  // Grid options
  const gridOptions = computed<GridOptions>(() => ({
    columnDefs: columnDefs.value,
    rowData: rowData.value,
    
    // Basic options
    animateRows: true,
    enableRangeSelection: uiStore.gridSettings.enableRangeSelection,
    suppressMenuHide: true,
    
    // Selection
    rowSelection: config.enableSelection ? 'multiple' : undefined,
    suppressRowClickSelection: !config.enableSelection,
    
    // Pagination
    pagination: true,
    paginationPageSize: config.pageSize || uiStore.gridSettings.pageSize,
    paginationAutoPageSize: false,
    
    // Filtering
    enableFilter: config.enableFiltering,
    floatingFilter: config.enableFiltering,
    
    // Sorting
    enableSorting: config.enableSorting,
    
    // Virtual scrolling for performance
    rowBuffer: config.virtualScrolling ? 10 : 0,
    
    // Components
    components: {
      statusCellRenderer: StatusCellRenderer,
      maintenanceCellRenderer: MaintenanceCellRenderer,
      tagsCellRenderer: TagsCellRenderer,
      booleanCellRenderer: BooleanCellRenderer
    },
    
    // Events
    onGridReady: (event) => {
      // Use markRaw to prevent Vue from making AG Grid instances reactive
      gridApi.value = markRaw(event.api)
      columnApi.value = markRaw(event.columnApi)
      
      // Auto-size columns
      event.api.sizeColumnsToFit()
      
      // Set initial filter/sort state
      loadGridState()
    },
    
    onSelectionChanged: (event) => {
      selectedRows.value = event.api.getSelectedRows()
      
      // Sync selection with store
      if (config.entityType === 'nodes') {
        railwayStore.selectNodes(selectedRows.value.map(row => row.id))
      } else {
        railwayStore.selectConnections(selectedRows.value.map(row => row.id))
      }
    },
    
    onFilterChanged: (event) => {
      filteredRowCount.value = event.api.getDisplayedRowCount()
      totalRowCount.value = rowData.value.length
      
      // Save filter state
      saveGridState()
    },
    
    onSortChanged: () => {
      saveGridState()
    },
    
    onColumnResized: () => {
      saveGridState()
    }
  }))

  // Actions
  const refreshData = () => {
    gridApi.value?.setRowData(rowData.value)
  }

  const clearSelection = () => {
    gridApi.value?.deselectAll()
  }

  const selectAll = () => {
    gridApi.value?.selectAll()
  }

  const applyFilter = (column: string, value: any) => {
    const filterInstance = gridApi.value?.getFilterInstance(column)
    if (filterInstance) {
      filterInstance.setModel({ filter: value, type: 'contains' })
      gridApi.value?.onFilterChanged()
    }
  }

  const clearFilters = () => {
    gridApi.value?.setFilterModel(null)
  }

  const exportToCsv = () => {
    if (!config.enableExport) return
    
    gridApi.value?.exportDataAsCsv({
      fileName: `railway-${config.entityType}-${new Date().toISOString().split('T')[0]}.csv`,
      onlySelected: selectedRows.value.length > 0
    })
  }

  const exportToExcel = () => {
    if (!config.enableExport) return
    
    gridApi.value?.exportDataAsExcel({
      fileName: `railway-${config.entityType}-${new Date().toISOString().split('T')[0]}.xlsx`,
      onlySelected: selectedRows.value.length > 0
    })
  }

  // Grid state management
  const saveGridState = () => {
    if (!gridApi.value) return
    
    const state = {
      filter: gridApi.value.getFilterModel(),
      columns: columnApi.value?.getColumnState()
    }
    
    localStorage.setItem(`grid-state-${config.entityType}`, JSON.stringify(state))
  }

  const loadGridState = () => {
    const saved = localStorage.getItem(`grid-state-${config.entityType}`)
    if (!saved || !gridApi.value) return
    
    try {
      const state = JSON.parse(saved)
      
      if (state.filter) {
        gridApi.value.setFilterModel(state.filter)
      }
      
      if (state.columns && columnApi.value) {
        columnApi.value.applyColumnState({ state: state.columns })
      }
    } catch (error) {
      console.warn('Failed to load grid state:', error)
    }
  }

  const resetGridState = () => {
    localStorage.removeItem(`grid-state-${config.entityType}`)
    gridApi.value?.setFilterModel(null)
    columnApi.value?.resetColumnState()
    gridApi.value?.sizeColumnsToFit()
  }

  // Watchers
  watch(() => uiStore.currentGridTheme, () => {
    // Theme changes require grid recreation in AG Grid
    // This would typically trigger a component re-render
  })

  watch(() => railwayStore.selectedNodes, (newSelection) => {
    if (config.entityType === 'nodes' && gridApi.value) {
      // Update grid selection to match store
      gridApi.value.forEachNode(node => {
        const selected = newSelection.includes(node.data.id)
        node.setSelected(selected, false)
      })
    }
  })

  watch(() => railwayStore.selectedConnections, (newSelection) => {
    if (config.entityType === 'connections' && gridApi.value) {
      gridApi.value.forEachNode(node => {
        const selected = newSelection.includes(node.data.id)
        node.setSelected(selected, false)
      })
    }
  })

  // Lifecycle
  onMounted(() => {
    // Initialize counts
    filteredRowCount.value = rowData.value.length
    totalRowCount.value = rowData.value.length
  })

  onUnmounted(() => {
    saveGridState()
  })

  return {
    // Grid instances
    gridApi: readonly(gridApi),
    columnApi: readonly(columnApi),
    
    // Grid options
    gridOptions,
    
    // State
    loading: readonly(loading),
    selectedRows: readonly(selectedRows),
    filteredRowCount: readonly(filteredRowCount),
    totalRowCount: readonly(totalRowCount),
    
    // Actions
    refreshData,
    clearSelection,
    selectAll,
    applyFilter,
    clearFilters,
    exportToCsv,
    exportToExcel,
    
    // State management
    saveGridState,
    loadGridState,
    resetGridState
  }
}

// Cell renderer components with proper typing
const StatusCellRenderer = {
  template: `
    <span :class="statusClass">
      <i :class="iconClass" class="mr-1"></i>
      {{ displayText }}
    </span>
  `,
  props: ['params'],
  computed: {
    statusClass(this: any): string {
      const status = this.params?.value
      const classes: Record<string, boolean> = {
        'text-green-600': status === 'operational' || status === 'active',
        'text-red-600': status === 'blocked' || !status,
        'text-yellow-600': status === 'maintenance',
        'text-gray-600': status === 'inactive'
      }
      return Object.keys(classes).filter(key => classes[key]).join(' ')
    },
    iconClass(this: any): string {
      const status = this.params?.value
      const classes: Record<string, boolean> = {
        'mdi mdi-check-circle': status === 'operational' || status === 'active',
        'mdi mdi-alert-circle': status === 'blocked' || !status,
        'mdi mdi-wrench': status === 'maintenance',
        'mdi mdi-pause-circle': status === 'inactive'
      }
      return Object.keys(classes).filter(key => classes[key]).join(' ')
    },
    displayText(this: any): string {
      return typeof this.params?.value === 'boolean' 
        ? (this.params.value ? 'Operational' : 'Down')
        : this.params?.value || 'Unknown'
    }
  }
}

const MaintenanceCellRenderer = {
  template: `
    <span :class="statusClass" class="px-2 py-1 rounded-full text-xs">
      {{ params?.value }}
    </span>
  `,
  props: ['params'],
  computed: {
    statusClass(this: any): string {
      const status = this.params?.value
      const classes: Record<string, boolean> = {
        'bg-green-100 text-green-800': status === 'good',
        'bg-blue-100 text-blue-800': status === 'fair',
        'bg-yellow-100 text-yellow-800': status === 'poor',
        'bg-red-100 text-red-800': status === 'critical'
      }
      return Object.keys(classes).filter(key => classes[key]).join(' ')
    }
  }
}

const TagsCellRenderer = {
  template: `
    <div class="flex flex-wrap gap-1">
      <span 
        v-for="tag in tags" 
        :key="tag"
        class="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs"
      >
        {{ tag }}
      </span>
    </div>
  `,
  props: ['params'],
  computed: {
    tags(this: any): string[] {
      return this.params?.value ? this.params.value.split(', ').slice(0, 3) : []
    }
  }
}

const BooleanCellRenderer = {
  template: `
    <span :class="{ 'text-green-600': params?.value, 'text-gray-400': !params?.value }">
      <i :class="params?.value ? 'mdi-check' : 'mdi-close'" class="mdi"></i>
      {{ params?.value ? 'Yes' : 'No' }}
    </span>
  `,
  props: ['params']
}


