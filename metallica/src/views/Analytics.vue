<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRailwayStore } from '@stores/railway'
import { useUIStore } from '@stores/ui'
import { Icon } from '@iconify/vue'
// Mock chart components for TypeScript compatibility
const LineChart = { template: '<div>Chart</div>' }
const XAxis = { template: '<div>XAxis</div>' }
const YAxis = { template: '<div>YAxis</div>' }
const CartesianGrid = { template: '<div>Grid</div>' }
const Tooltip = { template: '<div>Tooltip</div>' }
const Legend = { template: '<div>Legend</div>' }
const ResponsiveContainer = { template: '<div>Container</div>' }
const BarChart = { template: '<div>BarChart</div>' }
const Bar = { template: '<div>Bar</div>' }
const PieChart = { template: '<div>PieChart</div>' }
const Pie = { template: '<div>Pie</div>' }
const Cell = { template: '<div>Cell</div>' }

const railwayStore = useRailwayStore()
const uiStore = useUIStore()

// State
const loading = ref(false)
const timeRange = ref<'24h' | '7d' | '30d' | '90d'>('7d')
const selectedMetrics = ref<string[]>(['performance', 'capacity', 'maintenance'])

// Sample data (in real app, this would come from API)
const performanceData = ref([
  { name: 'Mon', onTime: 95, delayed: 5, cancelled: 0.5 },
  { name: 'Tue', onTime: 92, delayed: 7, cancelled: 1 },
  { name: 'Wed', onTime: 89, delayed: 10, cancelled: 1 },
  { name: 'Thu', onTime: 94, delayed: 5, cancelled: 1 },
  { name: 'Fri', onTime: 87, delayed: 11, cancelled: 2 },
  { name: 'Sat', onTime: 91, delayed: 8, cancelled: 1 },
  { name: 'Sun', onTime: 93, delayed: 6, cancelled: 1 }
])

const capacityData = ref([
  { name: 'Peak Hours', utilized: 85, available: 15 },
  { name: 'Off-Peak', utilized: 45, available: 55 },
  { name: 'Night', utilized: 20, available: 80 }
])

const nodeTypeDistribution = ref([
  { name: 'Stations', value: 45, color: '#3b82f6' },
  { name: 'Junctions', value: 25, color: '#8b5cf6' },
  { name: 'Signals', value: 20, color: '#10b981' },
  { name: 'Switches', value: 10, color: '#f59e0b' }
])

// Computed properties
const networkStats = computed(() => {
  if (!railwayStore.currentNetwork) return null

  const stats = railwayStore.networkStats
  return {
    ...stats,
    utilizationRate: 78,
    averageDelay: 3.2,
    safetyScore: 94,
    maintenanceAlerts: 7
  }
})

const kpiCards = computed(() => [
  {
    title: 'On-Time Performance',
    value: '92.5%',
    change: '+2.1%',
    trend: 'up',
    color: 'green',
    icon: 'mdi:clock-check'
  },
  {
    title: 'Network Utilization',
    value: '78%',
    change: '+5.3%',
    trend: 'up',
    color: 'blue',
    icon: 'mdi:gauge'
  },
  {
    title: 'Average Delay',
    value: '3.2 min',
    change: '-0.8 min',
    trend: 'down',
    color: 'green',
    icon: 'mdi:timer'
  },
  {
    title: 'Safety Score',
    value: '94/100',
    change: '+1',
    trend: 'up',
    color: 'green',
    icon: 'mdi:shield-check'
  }
])

// Methods
const refreshData = async () => {
  loading.value = true
  try {
    await railwayStore.loadPerformanceMetrics()
    // Load other analytics data
    await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
  } catch (error) {
    uiStore.showError('Error', 'Failed to load analytics data')
  } finally {
    loading.value = false
  }
}

const exportReport = async (format: 'pdf' | 'excel') => {
  try {
    uiStore.showInfo('Export', `Generating ${format.toUpperCase()} report...`)
    // Implement export logic
    await new Promise(resolve => setTimeout(resolve, 2000))
    uiStore.showSuccess('Export Complete', `Report exported as ${format.toUpperCase()}`)
  } catch (error) {
    uiStore.showError('Export Failed', 'Failed to generate report')
  }
}

// Lifecycle
onMounted(() => {
  refreshData()
})
</script>

<template>
  <div class="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
    <!-- Header -->
    <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Network Analytics
          </h1>
          <p class="text-gray-600 dark:text-gray-400 mt-1">
            Performance insights and network statistics
          </p>
        </div>

        <div class="flex items-center space-x-3">
          <!-- Time Range Selector -->
          <ElSelect v-model="timeRange" class="w-32">
            <ElOption value="24h" label="Last 24h" />
            <ElOption value="7d" label="Last 7 days" />
            <ElOption value="30d" label="Last 30 days" />
            <ElOption value="90d" label="Last 90 days" />
          </ElSelect>

          <!-- Export -->
          <ElDropdown trigger="click">
            <ElButton>
              <Icon icon="mdi:download" class="mr-1" />
              Export Report
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem @click="exportReport('pdf')">
                  <Icon icon="mdi:file-pdf" class="mr-2" />
                  Export as PDF
                </ElDropdownItem>
                <ElDropdownItem @click="exportReport('excel')">
                  <Icon icon="mdi:file-excel" class="mr-2" />
                  Export as Excel
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>

          <!-- Refresh -->
          <ElButton @click="refreshData" :loading="loading">
            <Icon icon="mdi:refresh" />
          </ElButton>
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="flex-1 overflow-y-auto p-6 space-y-6">
      <!-- KPI Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div v-for="kpi in kpiCards" :key="kpi.title"
          class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <div :class="`p-2 rounded-lg bg-${kpi.color}-100 dark:bg-${kpi.color}-900/20`">
                <Icon :icon="kpi.icon" :class="`h-5 w-5 text-${kpi.color}-600 dark:text-${kpi.color}-400`" />
              </div>
              <div class="ml-3">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">
                  {{ kpi.title }}
                </p>
                <p class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ kpi.value }}
                </p>
              </div>
            </div>

            <div class="text-right">
              <div :class="{
                'text-green-600 dark:text-green-400': kpi.trend === 'up',
                'text-red-600 dark:text-red-400': kpi.trend === 'down'
              }" class="flex items-center text-sm font-medium">
                <Icon :icon="kpi.trend === 'up' ? 'mdi:trending-up' : 'mdi:trending-down'" class="h-4 w-4 mr-1" />
                {{ kpi.change }}
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                vs last period
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Charts Row 1 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Performance Trends -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Performance Trends
            </h3>
            <div class="flex space-x-2">
              <span class="inline-flex items-center text-xs">
                <span class="w-3 h-3 bg-green-500 rounded-full mr-1"></span>
                On Time
              </span>
              <span class="inline-flex items-center text-xs">
                <span class="w-3 h-3 bg-yellow-500 rounded-full mr-1"></span>
                Delayed
              </span>
              <span class="inline-flex items-center text-xs">
                <span class="w-3 h-3 bg-red-500 rounded-full mr-1"></span>
                Cancelled
              </span>
            </div>
          </div>

          <div class="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart :data="performanceData">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" fill="#10b981" name="On Time %" />
                <Bar dataKey="delayed" fill="#f59e0b" name="Delayed %" />
                <Bar dataKey="cancelled" fill="#ef4444" name="Cancelled %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <!-- Capacity Utilization -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Capacity Utilization
            </h3>
          </div>

          <div class="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart :data="capacityData" layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis type="category" dataKey="name" />
                <Tooltip />
                <Legend />
                <Bar dataKey="utilized" stackId="a" fill="#3b82f6" name="Utilized %" />
                <Bar dataKey="available" stackId="a" fill="#e5e7eb" name="Available %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <!-- Charts Row 2 -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Network Composition -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Network Composition
          </h3>

          <div class="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie :data="nodeTypeDistribution" cx="50%" cy="50%" :outer-radius="80" data-key="value" :label="(entry) => `${entry.name} ${(entry.percent * 100).toFixed(0)}%`"
                  >
                  <Cell v-for="(entry, index) in nodeTypeDistribution" :key="`cell-${index}`" :fill="entry.color" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <!-- Network Health -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Network Health
          </h3>

          <div class="space-y-4">
            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Infrastructure</span>
              <div class="flex items-center">
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 94%"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">94%</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Signaling</span>
              <div class="flex items-center">
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 89%"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">89%</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Rolling Stock</span>
              <div class="flex items-center">
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div class="bg-yellow-500 h-2 rounded-full" style="width: 76%"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">76%</span>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <span class="text-gray-600 dark:text-gray-400">Power Systems</span>
              <div class="flex items-center">
                <div class="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-3">
                  <div class="bg-green-500 h-2 rounded-full" style="width: 91%"></div>
                </div>
                <span class="text-sm font-medium text-gray-900 dark:text-white">91%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Alerts -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
              Recent Alerts
            </h3>
            <ElBadge :value="3" type="danger">
              <Icon icon="mdi:bell" class="h-5 w-5 text-gray-400" />
            </ElBadge>
          </div>

          <div class="space-y-3">
            <div class="flex items-start space-x-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
              <Icon icon="mdi:alert-circle" class="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-red-900 dark:text-red-100">
                  Signal Failure
                </p>
                <p class="text-xs text-red-700 dark:text-red-200 mt-1">
                  Junction A-12 signal offline
                </p>
                <p class="text-xs text-red-600 dark:text-red-300 mt-1">
                  2 minutes ago
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Icon icon="mdi:alert" class="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Maintenance Due
                </p>
                <p class="text-xs text-yellow-700 dark:text-yellow-200 mt-1">
                  Track Section B-7 inspection overdue
                </p>
                <p class="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
                  1 hour ago
                </p>
              </div>
            </div>

            <div class="flex items-start space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Icon icon="mdi:information" class="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Schedule Update
                </p>
                <p class="text-xs text-blue-700 dark:text-blue-200 mt-1">
                  Route 15 timetable updated
                </p>
                <p class="text-xs text-blue-600 dark:text-blue-300 mt-1">
                  3 hours ago
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4">
            <ElButton size="small" class="w-full">
              View All Alerts
            </ElButton>
          </div>
        </div>
      </div>

      <!-- Detailed Tables -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Performing Routes -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Top Performing Routes
          </h3>

          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Route
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    On-Time %
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                    Capacity
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">Route A-1</td>
                  <td class="px-3 py-2 text-sm">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      98.5%
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">85%</td>
                </tr>
                <tr>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">Route B-3</td>
                  <td class="px-3 py-2 text-sm">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      96.2%
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">72%</td>
                </tr>
                <tr>
                  <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">Route C-7</td>
                  <td class="px-3 py-2 text-sm">
                    <span
                      class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      94.1%
                    </span>
                  </td>
                  <td class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">68%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Maintenance Schedule -->
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Upcoming Maintenance
          </h3>

          <div class="space-y-3">
            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-orange-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Track Section A-5
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Scheduled rail replacement
                  </p>
                </div>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Tomorrow
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-blue-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Signal Box B-2
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    System software update
                  </p>
                </div>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Dec 15
              </span>
            </div>

            <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div class="flex items-center space-x-3">
                <div class="w-3 h-3 bg-green-500 rounded-full"></div>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    Bridge C-9
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Structural inspection
                  </p>
                </div>
              </div>
              <span class="text-xs text-gray-500 dark:text-gray-400">
                Dec 20
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom chart container styling */
:deep(.recharts-responsive-container) {
  font-family: inherit;
}

:deep(.recharts-cartesian-grid-horizontal line),
:deep(.recharts-cartesian-grid-vertical line) {
  stroke: theme('colors.gray.200');
}

.dark :deep(.recharts-cartesian-grid-horizontal line),
.dark :deep(.recharts-cartesian-grid-vertical line) {
  stroke: theme('colors.gray.600');
}

:deep(.recharts-text) {
  fill: theme('colors.gray.600');
}

.dark :deep(.recharts-text) {
  fill: theme('colors.gray.300');
}
</style>