<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRailwayStore } from '@/stores/railway'
import { Icon } from '@iconify/vue'

interface Props {
  entityType: 'nodes' | 'connections'
}

interface Emits {
  (e: 'apply-filter', column: string, value: any): void
  (e: 'clear-filters'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const railwayStore = useRailwayStore()

// Filter values
const filters = ref({
  type: '',
  status: '',
  operational: '',
  maintenanceStatus: '',
  search: ''
})

// Options based on entity type
const typeOptions = computed(() => {
  if (props.entityType === 'nodes') {
    return [
      { label: 'All Types', value: '' },
      { label: 'Station', value: 'station' },
      { label: 'Junction', value: 'junction' },
      { label: 'Signal', value: 'signal' },
      { label: 'Switch', value: 'switch' },
      { label: 'Crossing', value: 'crossing' }
    ]
  } else {
    return [
      { label: 'All Types', value: '' },
      { label: 'Mainline', value: 'mainline' },
      { label: 'Siding', value: 'siding' },
      { label: 'Yard', value: 'yard' },
      { label: 'Industrial', value: 'industrial' },
      { label: 'Passenger', value: 'passenger' },
      { label: 'Freight', value: 'freight' }
    ]
  }
})

const statusOptions = computed(() => {
  if (props.entityType === 'nodes') {
    return [
      { label: 'All Status', value: '' },
      { label: 'Operational', value: 'operational' },
      { label: 'Down', value: 'down' }
    ]
  } else {
    return [
      { label: 'All Status', value: '' },
      { label: 'Active', value: 'active' },
      { label: 'Inactive', value: 'inactive' },
      { label: 'Maintenance', value: 'maintenance' },
      { label: 'Blocked', value: 'blocked' }
    ]
  }
})

const maintenanceOptions = [
  { label: 'All Conditions', value: '' },
  { label: 'Good', value: 'good' },
  { label: 'Fair', value: 'fair' },
  { label: 'Poor', value: 'poor' },
  { label: 'Critical', value: 'critical' }
]

// Methods
const applyFilters = () => {
  Object.entries(filters.value).forEach(([key, value]) => {
    if (value) {
      emit('apply-filter', key, value)
    }
  })

  // Update store filters
  if (props.entityType === 'nodes') {
    railwayStore.setNodeFilter({
      type: filters.value.type || undefined,
      search: filters.value.search || undefined
    })
  } else {
    railwayStore.setConnectionFilter({
      type: filters.value.type || undefined,
      status: filters.value.status || undefined,
      search: filters.value.search || undefined
    })
  }
}

const clearFilters = () => {
  filters.value = {
    type: '',
    status: '',
    operational: '',
    maintenanceStatus: '',
    search: ''
  }

  emit('clear-filters')

  // Clear store filters
  if (props.entityType === 'nodes') {
    railwayStore.setNodeFilter({})
  } else {
    railwayStore.setConnectionFilter({})
  }
}

const hasActiveFilters = computed(() => {
  return Object.values(filters.value).some(value => value !== '')
})
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <Icon icon="mdi:filter" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          Filter {{ entityType === 'nodes' ? 'Nodes' : 'Connections' }}
        </h3>
      </div>

      <div class="flex items-center space-x-2">
        <ElButton v-if="hasActiveFilters" size="small" @click="clearFilters">
          <Icon icon="mdi:filter-off" class="mr-1" />
          Clear All
        </ElButton>

        <ElButton size="small" type="primary" @click="applyFilters">
          <Icon icon="mdi:check" class="mr-1" />
          Apply Filters
        </ElButton>
      </div>
    </div>

    <!-- Filter Controls -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      <!-- Type Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Type
        </label>
        <ElSelect v-model="filters.type" placeholder="All Types" size="small" class="w-full">
          <ElOption v-for="option in typeOptions" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>
      </div>

      <!-- Status Filter -->
      <div>
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Status
        </label>
        <ElSelect v-model="filters.status" placeholder="All Status" size="small" class="w-full">
          <ElOption v-for="option in statusOptions" :key="option.value" :label="option.label" :value="option.value" />
        </ElSelect>
      </div>

      <!-- Maintenance Status (for nodes) -->
      <div v-if="entityType === 'nodes'">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Maintenance
        </label>
        <ElSelect v-model="filters.maintenanceStatus" placeholder="All Conditions" size="small" class="w-full">
          <ElOption v-for="option in maintenanceOptions" :key="option.value" :label="option.label"
            :value="option.value" />
        </ElSelect>
      </div>

      <!-- Search Filter -->
      <div :class="entityType === 'connections' ? 'md:col-span-2' : ''">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Search
        </label>
        <ElInput v-model="filters.search" placeholder="Search in names, tags..." size="small" clearable>
          <template #prefix>
            <Icon icon="mdi:magnify" class="h-4 w-4 text-gray-400" />
          </template>
        </ElInput>
      </div>

      <!-- Quick Apply -->
      <div class="flex items-end">
        <ElButton size="small" type="primary" class="w-full" @click="applyFilters">
          Apply
        </ElButton>
      </div>
    </div>

    <!-- Active Filters Display -->
    <div v-if="hasActiveFilters" class="mt-4 flex flex-wrap gap-2">
      <span class="text-xs text-gray-500 dark:text-gray-400 mr-2">Active filters:</span>

      <ElTag v-for="(value, key) in filters" v-show="value" :key="key" size="small" closable
        @close="filters[key as keyof typeof filters] = ''; applyFilters()">
        {{ key }}: {{ value }}
      </ElTag>
    </div>
  </div>
</template>

<style scoped>
/* Custom styling for filter controls */
.filter-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
}

@media (max-width: 768px) {
  .filter-grid {
    grid-template-columns: 1fr;
  }
}
</style>