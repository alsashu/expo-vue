<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { AgGridVue } from 'ag-grid-vue3'
import { useGrid } from '@/composables/useGrid'
import { useRailwayStore } from '@/stores/railway'
import { useUIStore } from '@/stores/ui'
import { Icon } from '@iconify/vue'
import GridToolbar from '@/components/grid/GridToolbar.vue'
import GridFilter from '@/components/grid/GridFilter.vue'
import GridStates from '@/components/grid/GridStates.vue'

const router = useRouter()
const railwayStore = useRailwayStore()
const uiStore = useUIStore()

// Current view mode
const currentEntityType = ref<'nodes' | 'connections'>('nodes')

// Grid composables for both entity types
const nodesGrid = useGrid({
  entityType: 'nodes',
  enableSelection: true,
  enableGrouping: true,
  enableFiltering: true,
  enableSorting: true,
  enableExport: true,
  pageSize: uiStore.gridSettings.pageSize,
  virtualScrolling: true
})

const connectionsGrid = useGrid({
  entityType: 'connections',
  enableSelection: true,
  enableGrouping: true,
  enableFiltering: true,
  enableSorting: true,
  enableExport: true,
  pageSize: uiStore.gridSettings.pageSize,
  virtualScrolling: true
})

// Current grid based on selected entity type
const currentGrid = computed(() => {
  return currentEntityType.value === 'nodes' ? nodesGrid : connectionsGrid
})

// Grid container refs
const nodesGridContainer = ref<HTMLDivElement>()
const connectionsGridContainer = ref<HTMLDivElement>()

// Toolbar state
const searchQuery = ref('')
const showFilters = ref(false)
const showStats = ref(true)

// Computed properties
const hasCurrentNetwork = computed(() => !!railwayStore.currentNetwork)
const hasSelection = computed(() => currentGrid.value.selectedRows.value.length > 0)

const gridContainerClass = computed(() => [
  uiStore.currentGridTheme,
  'w-full flex-1 min-h-0'
])

// Methods
const handleEntityTypeChange = (type: 'nodes' | 'connections') => {
  currentEntityType.value = type
  // Clear selection when switching
  currentGrid.value.clearSelection()
}

const handleSearch = (query: string) => {
  searchQuery.value = query
  if (currentEntityType.value === 'nodes') {
    railwayStore.setNodeFilter({ search: query })
  } else {
    railwayStore.setConnectionFilter({ search: query })
  }
}

const handleBulkEdit = () => {
  const selectedIds = currentGrid.value.selectedRows.value.map((row: any) => row.id)
  if (selectedIds.length === 0) {
    uiStore.showWarning('No Selection', 'Please select items to edit')
    return
  }

  // Open bulk edit modal
  uiStore.openModal({
    component: 'BulkEditModal',
    title: `Edit ${selectedIds.length} ${currentEntityType.value}`,
    props: {
      entityType: currentEntityType.value,
      entityIds: selectedIds,
      onSave: (updates: any) => {
        // Apply bulk updates
        selectedIds.forEach((id: string) => {
          if (currentEntityType.value === 'nodes') {
            railwayStore.updateNode(id, updates)
          } else {
            railwayStore.updateConnection(id, updates)
          }
        })
        uiStore.showSuccess('Bulk Edit', `Updated ${selectedIds.length} items`)
      }
    }
  })
}

const handleBulkDelete = async () => {
  const selectedIds = currentGrid.value.selectedRows.value.map((row: any) => row.id)
  if (selectedIds.length === 0) {
    uiStore.showWarning('No Selection', 'Please select items to delete')
    return
  }

  const confirmed = await uiStore.confirm(
    'Delete Items',
    `Are you sure you want to delete ${selectedIds.length} ${currentEntityType.value}?`,
    { type: 'danger', confirmText: 'Delete' }
  )

  if (confirmed) {
    try {
      railwayStore.deleteSelected()
      uiStore.showSuccess('Items Deleted', `Deleted ${selectedIds.length} items`)
    } catch (error) {
      uiStore.showError('Delete Failed', 'Failed to delete selected items')
    }
  }
}

const handleAddNew = () => {
  uiStore.openModal({
    component: currentEntityType.value === 'nodes' ? 'NodeEditModal' : 'ConnectionEditModal',
    title: `Add New ${currentEntityType.value.slice(0, -1)}`,
    props: {
      mode: 'create',
      onSave: (data: any) => {
        if (currentEntityType.value === 'nodes') {
          railwayStore.addNode(data)
        } else {
          railwayStore.addConnection(data)
        }
        uiStore.showSuccess('Item Added', 'New item created successfully')
      }
    }
  })
}

const handleRowDoubleClick = (event: any) => {
  // Select the item in store and navigate to diagram
  if (currentEntityType.value === 'nodes') {
    railwayStore.selectNodes([event.data.id])
  } else {
    railwayStore.selectConnections([event.data.id])
  }
  router.push('/diagram')
}

const handleExport = (format: 'csv' | 'excel') => {
  if (format === 'csv') {
    currentGrid.value.exportToCsv()
  } else {
    currentGrid.value.exportToExcel()
  }
}

const toggleFilters = () => {
  showFilters.value = !showFilters.value
}

const toggleStats = () => {
  showStats.value = !showStats.value
}

// Lifecycle hooks
onMounted(async () => {
  // Load network data if not already loaded
  if (!railwayStore.currentNetwork && railwayStore.networks.length > 0) {
    const first = railwayStore.networks[0]
    if (first) {
      await railwayStore.loadNetwork(first.id)
    }
  }
})

// Watch for theme changes
watch(() => uiStore.isDarkMode, () => {
  // Grid theme is handled by the computed property
})
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Data Grid
          </h1>

          <!-- Entity Type Selector -->
          <ElRadioGroup v-model="currentEntityType" size="small"
            @change="(value: any) => handleEntityTypeChange(value as 'nodes' | 'connections')">
            <ElRadioButton label="nodes">
              <Icon icon="mdi:train" class="mr-1" />
              Nodes
            </ElRadioButton>
            <ElRadioButton label="connections">
              <Icon icon="mdi:connection" class="mr-1" />
              Connections
            </ElRadioButton>
          </ElRadioGroup>
        </div>

        <div class="flex items-center space-x-2">
          <!-- Network Selector -->
          <ElSelect v-if="railwayStore.networks.length > 0" :model-value="railwayStore.currentNetwork?.id"
            placeholder="Select Network" class="w-64" @change="railwayStore.loadNetwork">
            <ElOption v-for="network in railwayStore.networks" :key="network.id" :label="network.name"
              :value="network.id" />
          </ElSelect>

          <ElButton type="primary" :disabled="!hasCurrentNetwork" @click="router.push('/diagram')">
            <Icon icon="mdi:graph" class="mr-1" />
            Diagram View
          </ElButton>
        </div>
      </div>
    </div>

    <!-- Network Status -->
    <div v-if="!hasCurrentNetwork" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <Icon icon="mdi:database-off" class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Network Selected
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-4">
          Please select a railway network to view data
        </p>
        <ElButton type="primary" @click="router.push('/')">
          Back to Dashboard
        </ElButton>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="flex-1 flex flex-col min-h-0">
      <!-- Toolbar -->
      <GridToolbar :entity-type="currentEntityType" :selected-count="currentGrid.selectedRows.value.length"
        :total-count="currentGrid.totalRowCount.value" :filtered-count="currentGrid.filteredRowCount.value"
        :show-filters="showFilters" :show-stats="showStats" @search="handleSearch" @add-new="handleAddNew"
        @bulk-edit="handleBulkEdit" @bulk-delete="handleBulkDelete" @export="handleExport"
        @toggle-filters="toggleFilters" @toggle-stats="toggleStats" @clear-selection="currentGrid.clearSelection"
        @select-all="currentGrid.selectAll" />

      <!-- Filters Panel -->
      <Transition name="slide-down">
        <GridFilter v-if="showFilters" :entity-type="currentEntityType" @apply-filter="currentGrid.applyFilter"
          @clear-filters="currentGrid.clearFilters" />
      </Transition>

      <!-- Stats Panel -->
      <Transition name="slide-down">
        <GridStates v-if="showStats" :entity-type="currentEntityType" />
      </Transition>

      <!-- Grid Container -->
      <div class="flex-1 px-6 pb-6 min-h-0">
        <div
          class="h-full bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">

          <!-- Nodes Grid -->
          <div v-show="currentEntityType === 'nodes'" ref="nodesGridContainer" :class="gridContainerClass">
            <AgGridVue :grid-options="nodesGrid.gridOptions.value" @row-double-clicked="handleRowDoubleClick" />
          </div>

          <!-- Connections Grid -->
          <div v-show="currentEntityType === 'connections'" ref="connectionsGridContainer" :class="gridContainerClass">
            <AgGridVue :grid-options="connectionsGrid.gridOptions.value" @row-double-clicked="handleRowDoubleClick" />
          </div>
        </div>
      </div>
    </div>

    <!-- Selection Panel -->
    <Transition name="slide-up">
      <div v-if="hasSelection"
        class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ currentGrid.selectedRows.value.length }}
              {{ currentEntityType }} selected
            </span>
            <ElButton size="small" @click="currentGrid.clearSelection()">
              Clear Selection
            </ElButton>
          </div>

          <div class="flex items-center space-x-2">
            <ElButton size="small" @click="railwayStore.duplicateSelected()">
              <Icon icon="mdi:content-copy" class="mr-1" />
              Duplicate
            </ElButton>
            <ElButton size="small" @click="handleBulkEdit">
              <Icon icon="mdi:pencil" class="mr-1" />
              Edit
            </ElButton>
            <ElButton size="small" type="danger" @click="handleBulkDelete">
              <Icon icon="mdi:delete" class="mr-1" />
              Delete
            </ElButton>
            <ElButton size="small" type="primary" @click="router.push('/diagram')">
              <Icon icon="mdi:eye" class="mr-1" />
              View in Diagram
            </ElButton>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transition animations */
.slide-down-enter-active,
.slide-down-leave-active {
  transition: all 0.3s ease;
}

.slide-down-enter-from,
.slide-down-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  transform: translateY(10px);
  opacity: 0;
}

/* AG Grid custom styling */
:deep(.ag-theme-alpine) {
  --ag-header-background-color: theme('colors.gray.50');
  --ag-header-foreground-color: theme('colors.gray.900');
  --ag-border-color: theme('colors.gray.200');
  --ag-row-hover-color: theme('colors.blue.50');
  --ag-selected-row-background-color: theme('colors.blue.100');
}

:deep(.ag-theme-alpine-dark) {
  --ag-header-background-color: theme('colors.gray.800');
  --ag-header-foreground-color: theme('colors.gray.100');
  --ag-border-color: theme('colors.gray.700');
  --ag-row-hover-color: theme('colors.gray.700');
  --ag-selected-row-background-color: theme('colors.blue.900');
  --ag-background-color: theme('colors.gray.800');
  --ag-foreground-color: theme('colors.gray.100');
  --ag-odd-row-background-color: theme('colors.gray.700');
}
</style>