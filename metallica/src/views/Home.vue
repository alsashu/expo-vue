// Global reference to ElMessageBox
declare global {
const ElMessageBox: any
}
<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useRailwayStore } from '@stores/railway'
import { useUIStore } from '@stores/ui'
import { Icon } from '@iconify/vue'

const router = useRouter()
const railwayStore = useRailwayStore()
const uiStore = useUIStore()

// Reactive data
const recentNetworks = computed(() =>
  railwayStore.networks.slice(0, 6).sort((a, b) =>
    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  )
)

const stats = computed(() => ({
  totalNetworks: railwayStore.networks.length,
  totalNodes: railwayStore.networks.reduce((sum, n) => sum + Object.keys(n.nodes).length, 0),
  totalConnections: railwayStore.networks.reduce((sum, n) => sum + Object.keys(n.connections).length, 0),
  operationalNodes: railwayStore.networks.reduce((sum, n) =>
    sum + Object.values(n.nodes).filter(node => node.properties.operational).length, 0
  )
}))

const quickActions = [
  {
    title: 'New Network',
    description: 'Create a new railway network from scratch',
    icon: 'mdi:plus-circle',
    color: 'primary',
    action: () => createNewNetwork()
  },
  {
    title: 'Import Network',
    description: 'Import network from file or external source',
    icon: 'mdi:import',
    color: 'success',
    action: () => importNetwork()
  },
  {
    title: 'View Analytics',
    description: 'Analyze network performance and statistics',
    icon: 'mdi:chart-line',
    color: 'warning',
    action: () => router.push('/analytics')
  },
  {
    title: 'Settings',
    description: 'Configure application preferences',
    icon: 'mdi:cog',
    color: 'info',
    action: () => router.push('/settings')
  }
]

// Methods
const createNewNetwork = async () => {
  const name = await (window as any).ElMessageBox.prompt('Enter network name:', 'New Network', {
    confirmButtonText: 'Create',
    cancelButtonText: 'Cancel',
    inputPattern: /^.{1,100}$/,
    inputErrorMessage: 'Name must be 1-100 characters'
  })

  if (name.action === 'confirm') {
    const newNetwork = {
      name: name.value,
      description: 'New railway network',
      nodes: {},
      connections: {},
      signals: {},
      metadata: {
        region: 'Unknown',
        operator: 'Railway Designer',
        totalLength: 0,
        nodeCount: 0,
        connectionCount: 0,
        offline: true
      },
      version: 1
    }

    try {
      railwayStore.setCurrentNetwork(newNetwork as any)
      uiStore.showSuccess('Network Created', `"${name.value}" has been created successfully`)
      router.push('/diagram')
    } catch (error) {
      uiStore.showError('Error', 'Failed to create network')
    }
  }
}

const importNetwork = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json,.xml,.kml'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      await railwayStore.importNetwork(text)
      uiStore.showSuccess('Import Successful', 'Network imported successfully')
      router.push('/diagram')
    } catch (error) {
      uiStore.showError('Import Failed', 'Failed to import network file')
    }
  }
  input.click()
}

const openNetwork = async (networkId: string) => {
  try {
    uiStore.setLoading(true, 'Loading network...')
    await railwayStore.loadNetwork(networkId)
    router.push('/diagram')
  } catch (error) {
    uiStore.showError('Error', 'Failed to load network')
  } finally {
    uiStore.setLoading(false)
  }
}

const deleteNetwork = async (network: any) => {
  const confirmed = await uiStore.confirm(
    'Delete Network',
    `Are you sure you want to delete "${network.name}"? This action cannot be undone.`,
    { type: 'danger', confirmText: 'Delete' }
  )

  if (confirmed) {
    try {
      // Implementation would call API to delete network
      uiStore.showSuccess('Network Deleted', `"${network.name}" has been deleted`)
    } catch (error) {
      uiStore.showError('Error', 'Failed to delete network')
    }
  }
}

const formatFileSize = (bytes: number) => {
  const sizes = ['B', 'KB', 'MB', 'GB']
  if (bytes === 0) return '0 B'
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
}

// Lifecycle
onMounted(async () => {
  await railwayStore.loadNetworks()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          Railway Network Designer
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Design, analyze, and manage smart railway networks with professional tools
        </p>
      </div>

      <!-- Statistics Cards -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon icon="mdi:network" class="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Networks</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.totalNetworks }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon icon="mdi:train" class="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Total Nodes</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.totalNodes }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon icon="mdi:connection" class="h-8 w-8 text-purple-600 dark:text-purple-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Connections</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.totalConnections }}
              </p>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <Icon icon="mdi:check-circle" class="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div class="ml-4">
              <p class="text-sm font-medium text-gray-500 dark:text-gray-400">Operational</p>
              <p class="text-2xl font-semibold text-gray-900 dark:text-white">
                {{ stats.operationalNodes }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="mb-8">
        <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Quick Actions
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div v-for="action in quickActions" :key="action.title"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 cursor-pointer hover:shadow-md transition-shadow duration-200"
            @click="action.action">
            <div class="flex items-center mb-3">
              <Icon :icon="action.icon" :class="`h-6 w-6 text-${action.color}-600 dark:text-${action.color}-400`" />
              <h3 class="ml-2 font-medium text-gray-900 dark:text-white">
                {{ action.title }}
              </h3>
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400">
              {{ action.description }}
            </p>
          </div>
        </div>
      </div>

      <!-- Recent Networks -->
      <div>
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">
            Recent Networks
          </h2>
          <ElButton type="primary" @click="router.push('/grid')">
            View All
          </ElButton>
        </div>

        <div v-if="recentNetworks.length === 0" class="text-center py-12">
          <Icon icon="mdi:network-off" class="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
          <p class="text-gray-500 dark:text-gray-400 text-lg">
            No networks found
          </p>
          <p class="text-gray-400 dark:text-gray-500 text-sm mt-2">
            Create your first railway network to get started
          </p>
          <ElButton type="primary" class="mt-4" @click="createNewNetwork">
            <Icon icon="mdi:plus" class="mr-2" />
            Create Network
          </ElButton>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div v-for="network in recentNetworks" :key="network.id"
            class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow duration-200">
            <!-- Network Preview/Thumbnail -->
            <div class="h-48 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 relative">
              <div class="absolute inset-0 flex items-center justify-center">
                <Icon icon="mdi:train" class="h-16 w-16 text-blue-600 dark:text-blue-400 opacity-50" />
              </div>
              <div class="absolute top-4 right-4">
                <ElDropdown trigger="click" placement="bottom-end">
                  <ElButton size="small" circle class="bg-white/80 backdrop-blur-sm">
                    <Icon icon="mdi:dots-vertical" />
                  </ElButton>
                  <template #dropdown>
                    <ElDropdownMenu>
                      <ElDropdownItem @click="openNetwork(network.id)">
                        <Icon icon="mdi:open-in-app" class="mr-2" />
                        Open
                      </ElDropdownItem>
                      <ElDropdownItem @click="router.push('/grid')">
                        <Icon icon="mdi:table" class="mr-2" />
                        View Data
                      </ElDropdownItem>
                      <ElDropdownItem divided @click="deleteNetwork(network)">
                        <Icon icon="mdi:delete" class="mr-2 text-red-500" />
                        <span class="text-red-500">Delete</span>
                      </ElDropdownItem>
                    </ElDropdownMenu>
                  </template>
                </ElDropdown>
              </div>

              <!-- Status indicator -->
              <div class="absolute bottom-4 left-4">
                <span :class="{
                  'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': network.metadata.offline,
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200': !network.metadata.offline
                }" class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium">
                  <Icon :icon="network.metadata.offline ? 'mdi:wifi-off' : 'mdi:wifi'" class="w-3 h-3 mr-1" />
                  {{ network.metadata.offline ? 'Offline' : 'Online' }}
                </span>
              </div>
            </div>

            <!-- Network Info -->
            <div class="p-6">
              <div class="mb-4">
                <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                  {{ network.name }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
                  {{ network.description }}
                </p>
              </div>

              <div class="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Nodes:</span>
                  <span class="ml-1 font-medium text-gray-900 dark:text-white">
                    {{ network.metadata.nodeCount }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Connections:</span>
                  <span class="ml-1 font-medium text-gray-900 dark:text-white">
                    {{ network.metadata.connectionCount }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Region:</span>
                  <span class="ml-1 font-medium text-gray-900 dark:text-white">
                    {{ network.metadata.region }}
                  </span>
                </div>
                <div>
                  <span class="text-gray-500 dark:text-gray-400">Length:</span>
                  <span class="ml-1 font-medium text-gray-900 dark:text-white">
                    {{ (network.metadata.totalLength / 1000).toFixed(1) }}km
                  </span>
                </div>
              </div>

              <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                <span>Updated {{ new Date(network.updatedAt).toLocaleDateString() }}</span>
                <span>v{{ network.version }}</span>
              </div>

              <div class="flex gap-2">
                <ElButton type="primary" size="small" class="flex-1" @click="openNetwork(network.id)">
                  <Icon icon="mdi:open-in-app" class="mr-1" />
                  Open
                </ElButton>
                <ElButton size="small" @click="router.push('/grid')">
                  <Icon icon="mdi:table" />
                </ElButton>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>