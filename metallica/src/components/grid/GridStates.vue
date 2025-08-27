<script setup lang="ts">
import { computed } from 'vue'
import { useRailwayStore } from '@/stores/railway'
import { Icon } from '@iconify/vue'

interface Props {
  entityType: 'nodes' | 'connections'
}

const props = defineProps<Props>()
const railwayStore = useRailwayStore()

// Computed statistics based on entity type
const stats = computed(() => {
  const networkStats = railwayStore.networkStats

  if (props.entityType === 'nodes') {
    const nodes = railwayStore.filteredNodes
    const nodesByType = nodes.reduce((acc, node) => {
      acc[node.type] = (acc[node.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const operationalCount = nodes.filter(node => node.properties.operational).length
    const maintenanceIssues = nodes.filter(node =>
      node.metadata.maintenanceStatus === 'poor' || node.metadata.maintenanceStatus === 'critical'
    ).length

    return {
      total: nodes.length,
      operational: operationalCount,
      nonOperational: nodes.length - operationalCount,
      maintenanceIssues,
      breakdown: nodesByType,
      utilizationRate: operationalCount > 0 ? Math.round((operationalCount / nodes.length) * 100) : 0
    }
  } else {
    const connections = railwayStore.filteredConnections
    const connectionsByType = connections.reduce((acc, conn) => {
      acc[conn.type] = (acc[conn.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const activeCount = connections.filter(conn => conn.status === 'active').length
    const totalLength = connections.reduce((sum, conn) => sum + conn.properties.length, 0)

    return {
      total: connections.length,
      active: activeCount,
      inactive: connections.length - activeCount,
      totalLength: Math.round(totalLength / 1000 * 100) / 100, // Convert to km
      breakdown: connectionsByType,
      utilizationRate: activeCount > 0 ? Math.round((activeCount / connections.length) * 100) : 0
    }
  }
})

const chartData = computed(() => {
  return Object.entries(stats.value.breakdown).map(([type, count]) => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    value: count,
    percentage: Math.round((count / stats.value.total) * 100)
  }))
})

// Status color mapping
const getStatusColor = (type: string) => {
  const colors = {
    station: 'bg-blue-500',
    junction: 'bg-purple-500',
    signal: 'bg-green-500',
    switch: 'bg-yellow-500',
    crossing: 'bg-red-500',
    mainline: 'bg-blue-600',
    siding: 'bg-indigo-500',
    yard: 'bg-gray-500',
    industrial: 'bg-orange-500',
    passenger: 'bg-teal-500',
    freight: 'bg-brown-500'
  }
  return colors[type as keyof typeof colors] || 'bg-gray-400'
}
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
    <div class="flex items-center justify-between mb-4">
      <div class="flex items-center space-x-2">
        <Icon icon="mdi:chart-bar" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
        <h3 class="text-sm font-medium text-gray-900 dark:text-white">
          {{ entityType === 'nodes' ? 'Node' : 'Connection' }} Statistics
        </h3>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
      <!-- Total Count -->
      <div class="text-center">
        <div class="text-2xl font-bold text-gray-900 dark:text-white">
          {{ stats.total }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Total {{ entityType === 'nodes' ? 'Nodes' : 'Connections' }}
        </div>
      </div>

      <!-- Operational/Active -->
      <div class="text-center">
        <div class="text-2xl font-bold text-green-600 dark:text-green-400">
          {{ entityType === 'nodes' ? stats.operational : stats.active }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ entityType === 'nodes' ? 'Operational' : 'Active' }}
        </div>
      </div>

      <!-- Non-Operational/Inactive -->
      <div class="text-center">
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ entityType === 'nodes' ? stats.nonOperational : stats.inactive }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          {{ entityType === 'nodes' ? 'Down' : 'Inactive' }}
        </div>
      </div>

      <!-- Utilization Rate -->
      <div class="text-center">
        <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
          {{ stats.utilizationRate }}%
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Utilization
        </div>
      </div>

      <!-- Maintenance Issues (nodes only) / Total Length (connections only) -->
      <div v-if="entityType === 'nodes'" class="text-center">
        <div class="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
          {{ stats.maintenanceIssues || 0 }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Maintenance Issues
        </div>
      </div>

      <div v-else class="text-center">
        <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
          {{ stats.totalLength }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Total Length (km)
        </div>
      </div>

      <!-- Health Score -->
      <div class="text-center">
        <div class="text-2xl font-bold" :class="{
          'text-green-600 dark:text-green-400': stats.utilizationRate >= 80,
          'text-yellow-600 dark:text-yellow-400': stats.utilizationRate >= 60 && stats.utilizationRate < 80,
          'text-red-600 dark:text-red-400': stats.utilizationRate < 60
        }">
          {{ stats.utilizationRate >= 80 ? 'Good' : stats.utilizationRate >= 60 ? 'Fair' : 'Poor' }}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">
          Health Score
        </div>
      </div>
    </div>

    <!-- Type Breakdown -->
    <div>
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Breakdown by Type
      </h4>

      <div class="space-y-2">
        <div v-for="item in chartData" :key="item.name"
          class="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-3">
            <div :class="[getStatusColor(item.name.toLowerCase()), 'w-3 h-3 rounded-full']"></div>
            <span class="text-sm font-medium text-gray-900 dark:text-white">
              {{ item.name }}
            </span>
          </div>

          <div class="flex items-center space-x-3">
            <span class="text-sm text-gray-600 dark:text-gray-400">
              {{ item.value }}
            </span>
            <div class="w-20 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
              <div class="h-2 rounded-full transition-all duration-300" :class="getStatusColor(item.name.toLowerCase())"
                :style="{ width: `${item.percentage}%` }"></div>
            </div>
            <span class="text-xs text-gray-500 dark:text-gray-400 w-8 text-right">
              {{ item.percentage }}%
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- Performance Indicators -->
    <div v-if="entityType === 'nodes'" class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Performance Indicators
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Availability -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:check-circle" class="h-4 w-4 text-green-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Availability</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ stats.utilizationRate }}%
          </span>
        </div>

        <!-- Reliability -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:shield-check" class="h-4 w-4 text-blue-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Reliability</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ Math.max(0, 100 - ((stats.maintenanceIssues || 0) * 10)) }}%
          </span>
        </div>

        <!-- Efficiency -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:speedometer" class="h-4 w-4 text-purple-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Efficiency</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ Math.round(((stats.operational || 0) / Math.max(1, stats.total)) * 100) }}%
          </span>
        </div>
      </div>
    </div>

    <!-- Connection-specific metrics -->
    <div v-else class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-600">
      <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
        Network Metrics
      </h4>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Connectivity -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:connection" class="h-4 w-4 text-green-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Connectivity</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ stats.utilizationRate }}%
          </span>
        </div>

        <!-- Average Length -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:ruler" class="h-4 w-4 text-blue-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Avg Length</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ stats.total > 0 ? Math.round(((stats.totalLength || 0) / stats.total) * 100) / 100 : 0 }} km
          </span>
        </div>

        <!-- Density -->
        <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div class="flex items-center space-x-2">
            <Icon icon="mdi:network" class="h-4 w-4 text-purple-500" />
            <span class="text-sm text-gray-700 dark:text-gray-300">Density</span>
          </div>
          <span class="text-sm font-medium text-gray-900 dark:text-white">
            {{ (stats.totalLength || 0) > 0 ? Math.round((stats.total / (stats.totalLength || 1)) * 100) / 100 : 0 }}/km
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Progress bar animations */
.progress-bar {
  transition: width 0.6s ease-in-out;
}

/* Responsive grid adjustments */
@media (max-width: 768px) {
  .grid-cols-6 {
    grid-template-columns: repeat(2, 1fr);
  }

  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }

  .md\:grid-cols-3 {
    grid-template-columns: repeat(1, 1fr);
  }
}

/* Status indicators */
.status-good {
  @apply text-green-600 dark:text-green-400;
}

.status-fair {
  @apply text-yellow-600 dark:text-yellow-400;
}

.status-poor {
  @apply text-red-600 dark:text-red-400;
}
</style>