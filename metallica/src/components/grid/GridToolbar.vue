<script setup lang="ts">
import { ref, computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Props {
  entityType: 'nodes' | 'connections'
  selectedCount: number
  totalCount: number
  filteredCount: number
  showFilters: boolean
  showStats: boolean
}

interface Emits {
  (e: 'search', query: string): void
  (e: 'add-new'): void
  (e: 'bulk-edit'): void
  (e: 'bulk-delete'): void
  (e: 'export', format: 'csv' | 'excel'): void
  (e: 'toggle-filters'): void
  (e: 'toggle-stats'): void
  (e: 'clear-selection'): void
  (e: 'select-all'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Local state
const searchQuery = ref('')
const showExportMenu = ref(false)

// Computed properties
const entityLabel = computed(() => {
  return props.entityType === 'nodes' ? 'Node' : 'Connection'
})

const entityLabelPlural = computed(() => {
  return props.entityType === 'nodes' ? 'Nodes' : 'Connections'
})

const hasSelection = computed(() => props.selectedCount > 0)
const hasFilter = computed(() => props.filteredCount < props.totalCount)

// Methods
const handleSearch = (query: string) => {
  searchQuery.value = query
  emit('search', query)
}

const clearSearch = () => {
  searchQuery.value = ''
  emit('search', '')
}

const handleExport = (format: 'csv' | 'excel') => {
  emit('export', format)
  showExportMenu.value = false
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
    <!-- Main Toolbar -->
    <div class="flex items-center justify-between mb-4">
      <!-- Left Section - Search & Actions -->
      <div class="flex items-center space-x-4">
        <!-- Search -->
        <div class="relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon icon="mdi:magnify" class="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
          <input v-model="searchQuery" type="text" :placeholder="`Search ${entityLabelPlural.toLowerCase()}...`"
            class="w-64 pl-10 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            @input="handleSearch(($event.target as HTMLInputElement)?.value || '')" />

          <!-- Clear Search -->
          <button v-if="searchQuery" class="absolute inset-y-0 right-0 pr-3 flex items-center" @click="clearSearch">
            <Icon icon="mdi:close" class="h-4 w-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" />
          </button>
        </div>

        <!-- Add New -->
        <ElButton type="primary" @click="emit('add-new')">
          <Icon icon="mdi:plus" class="mr-1" />
          Add {{ entityLabel }}
        </ElButton>
      </div>

      <!-- Right Section - View Controls -->
      <div class="flex items-center space-x-2">
        <!-- Bulk Actions -->
        <div v-if="hasSelection" class="flex items-center space-x-1 mr-4">
          <ElButton size="small" @click="emit('bulk-edit')">
            <Icon icon="mdi:pencil" class="mr-1" />
            Edit Selected
          </ElButton>
          <ElButton size="small" type="danger" @click="emit('bulk-delete')">
            <Icon icon="mdi:delete" class="mr-1" />
            Delete Selected
          </ElButton>
        </div>

        <!-- Export -->
        <ElDropdown v-model:visible="showExportMenu" trigger="click" placement="bottom-end">
          <ElButton size="small">
            <Icon icon="mdi:export" class="mr-1" />
            Export
            <Icon icon="mdi:chevron-down" class="ml-1" />
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem @click="handleExport('csv')">
                <Icon icon="mdi:file-delimited" class="mr-2" />
                Export as CSV
              </ElDropdownItem>
              <ElDropdownItem @click="handleExport('excel')">
                <Icon icon="mdi:file-excel" class="mr-2" />
                Export as Excel
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>

        <!-- View Options -->
        <div class="flex items-center border-l border-gray-200 dark:border-gray-600 pl-4 ml-2">
          <!-- Toggle Filters -->
          <ElTooltip content="Toggle Filters" placement="bottom">
            <ElButton size="small" :type="showFilters ? 'primary' : ''" @click="emit('toggle-filters')">
              <Icon icon="mdi:filter" />
            </ElButton>
          </ElTooltip>

          <!-- Toggle Stats -->
          <ElTooltip content="Toggle Statistics" placement="bottom">
            <ElButton size="small" :type="showStats ? 'primary' : ''" @click="emit('toggle-stats')">
              <Icon icon="mdi:chart-bar" />
            </ElButton>
          </ElTooltip>
        </div>
      </div>
    </div>

    <!-- Stats Bar -->
    <div class="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
      <!-- Left - Count Info -->
      <div class="flex items-center space-x-6">
        <div class="flex items-center">
          <Icon icon="mdi:database" class="h-4 w-4 mr-1" />
          <span>
            <span class="font-medium text-gray-900 dark:text-white">{{ totalCount }}</span>
            total {{ entityLabelPlural.toLowerCase() }}
          </span>
        </div>

        <div v-if="hasFilter" class="flex items-center">
          <Icon icon="mdi:filter-check" class="h-4 w-4 mr-1 text-blue-500" />
          <span>
            <span class="font-medium text-gray-900 dark:text-white">{{ filteredCount }}</span>
            filtered
          </span>
        </div>

        <div v-if="hasSelection" class="flex items-center">
          <Icon icon="mdi:checkbox-multiple-marked" class="h-4 w-4 mr-1 text-blue-500" />
          <span>
            <span class="font-medium text-gray-900 dark:text-white">{{ selectedCount }}</span>
            selected
          </span>
        </div>
      </div>

      <!-- Right - Selection Actions -->
      <div v-if="hasSelection" class="flex items-center space-x-4">
        <button class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          @click="emit('clear-selection')">
          Clear Selection
        </button>

        <button class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          @click="emit('select-all')">
          Select All {{ filteredCount }}
        </button>
      </div>

      <!-- Right - View Help -->
      <div v-else class="flex items-center space-x-1 text-xs">
        <Icon icon="mdi:information" class="h-3 w-3" />
        <span>Double-click rows to view in diagram</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom input focus styles */
input:focus {
  outline: none;
}

/* Button hover effects */
button:hover {
  transform: translateY(-1px);
}

button:active {
  transform: translateY(0);
}
</style>