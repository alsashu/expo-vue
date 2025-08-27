<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUIStore } from '@stores/ui'
import { useRailwayStore } from '@stores/railway'
import { storage } from '@utils/storage'
import { Icon } from '@iconify/vue'

const uiStore = useUIStore()
const railwayStore = useRailwayStore()

// Local state
const activeTab = ref('general')
const loading = ref(false)

// Storage stats
const storageStats = ref({
  networks: 0,
  nodes: 0,
  connections: 0,
  cacheEntries: 0,
  syncQueueSize: 0,
  estimatedSize: 0
})

// Form data
const generalSettings = ref({
  theme: uiStore.isDarkMode ? 'dark' : 'light',
  language: 'en',
  autoSave: true,
  autoSaveInterval: 30
})

const gridSettings = ref({
  pageSize: uiStore.gridSettings.pageSize,
  showGroupPanel: uiStore.gridSettings.showGroupPanel,
  enableRangeSelection: uiStore.gridSettings.enableRangeSelection,
  enableCharts: uiStore.gridSettings.enableCharts
})

const diagramSettings = ref({
  showGrid: uiStore.diagramSettings.showGrid,
  snapToGrid: uiStore.diagramSettings.snapToGrid,
  gridSize: uiStore.diagramSettings.gridSize,
  showMiniMap: uiStore.diagramSettings.showMiniMap,
  animationEnabled: uiStore.diagramSettings.animationEnabled
})

const performanceSettings = ref({
  performanceMode: uiStore.performanceMode,
  enableWebWorkers: uiStore.enableWebWorkers,
  maxRenderItems: uiStore.maxRenderItems
})

// Computed properties
const tabs = [
  { id: 'general', title: 'General', icon: 'mdi:cog' },
  { id: 'appearance', title: 'Appearance', icon: 'mdi:palette' },
  { id: 'grid', title: 'Data Grid', icon: 'mdi:table' },
  { id: 'diagram', title: 'Diagram', icon: 'mdi:graph' },
  { id: 'performance', title: 'Performance', icon: 'mdi:speedometer' },
  { id: 'storage', title: 'Storage', icon: 'mdi:database' },
  { id: 'about', title: 'About', icon: 'mdi:information' }
]

const storageUsedMB = computed(() => {
  return (storageStats.value.estimatedSize / 1024 / 1024).toFixed(2)
})

// Methods
const loadStorageStats = async () => {
  try {
    storageStats.value = await storage.getStorageStats()
  } catch (error) {
    console.error('Failed to load storage stats:', error)
  }
}

const saveSettings = async () => {
  loading.value = true

  try {
    // Apply general settings
    if (generalSettings.value.theme !== (uiStore.isDarkMode ? 'dark' : 'light')) {
      uiStore.setDarkMode(generalSettings.value.theme === 'dark')
    }

    // Apply grid settings
    uiStore.updateGridSettings(gridSettings.value)

    // Apply diagram settings
    uiStore.updateDiagramSettings(diagramSettings.value)

    // Apply performance settings
    uiStore.setPerformanceMode(performanceSettings.value.performanceMode)
    uiStore.enableWebWorkers = performanceSettings.value.enableWebWorkers
    uiStore.maxRenderItems = performanceSettings.value.maxRenderItems

    uiStore.showSuccess('Settings Saved', 'Your preferences have been saved')
  } catch (error) {
    uiStore.showError('Save Failed', 'Failed to save settings')
  } finally {
    loading.value = false
  }
}

const resetSettings = async () => {
  const confirmed = await uiStore.confirm(
    'Reset Settings',
    'Are you sure you want to reset all settings to defaults?',
    { type: 'warning' }
  )

  if (confirmed) {
    // Reset to defaults
    generalSettings.value = {
      theme: 'light',
      language: 'en',
      autoSave: true,
      autoSaveInterval: 30
    }

    gridSettings.value = {
      pageSize: 100,
      showGroupPanel: false,
      enableRangeSelection: true,
      enableCharts: true
    }

    diagramSettings.value = {
      showGrid: true,
      snapToGrid: true,
      gridSize: 20,
      showMiniMap: true,
      animationEnabled: true
    }

    performanceSettings.value = {
      performanceMode: 'standard',
      enableWebWorkers: true,
      maxRenderItems: 10000
    }

    await saveSettings()
  }
}

const clearAllData = async () => {
  const confirmed = await uiStore.confirm(
    'Clear All Data',
    'This will permanently delete all stored railway networks and cached data. This action cannot be undone.',
    { type: 'danger', confirmText: 'Delete All Data' }
  )

  if (confirmed) {
    try {
      await storage.clearAllData()
      railwayStore.networks = []
      railwayStore.currentNetwork = null
      await loadStorageStats()
      uiStore.showSuccess('Data Cleared', 'All local data has been deleted')
    } catch (error) {
      uiStore.showError('Clear Failed', 'Failed to clear data')
    }
  }
}

const exportAllData = async () => {
  try {
    const data = await storage.exportAllData()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `railway-designer-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    uiStore.showSuccess('Export Complete', 'Data exported successfully')
  } catch (error) {
    uiStore.showError('Export Failed', 'Failed to export data')
  }
}

const importData = () => {
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.json'
  input.onchange = async (e) => {
    const file = (e.target as HTMLInputElement).files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const data = JSON.parse(text)
      await storage.importAllData(data)
      await railwayStore.loadNetworks()
      await loadStorageStats()
      uiStore.showSuccess('Import Complete', 'Data imported successfully')
    } catch (error) {
      uiStore.showError('Import Failed', 'Failed to import data')
    }
  }
  input.click()
}

// Load initial data
loadStorageStats()
</script>

<template>
  <div class="flex h-full bg-gray-50 dark:bg-gray-900">
    <!-- Sidebar -->
    <div class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div class="p-6">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white mb-6">Settings</h1>

        <nav class="space-y-1">
          <button v-for="tab in tabs" :key="tab.id"
            class="w-full flex items-center px-3 py-2 text-left rounded-md transition-colors" :class="{
              'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300': activeTab === tab.id,
              'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': activeTab !== tab.id
            }" @click="activeTab = tab.id">
            <Icon :icon="tab.icon" class="h-5 w-5 mr-3" />
            {{ tab.title }}
          </button>
        </nav>
      </div>
    </div>

    <!-- Main Content -->
    <div class="flex-1 overflow-y-auto">
      <div class="max-w-4xl mx-auto p-8">

        <!-- General Settings -->
        <div v-if="activeTab === 'general'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">General Settings</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Configure basic application preferences</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Theme
                </label>
                <ElSelect v-model="generalSettings.theme" class="w-full">
                  <ElOption value="light" label="Light Theme" />
                  <ElOption value="dark" label="Dark Theme" />
                  <ElOption value="auto" label="Auto (System)" />
                </ElSelect>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Language
                </label>
                <ElSelect v-model="generalSettings.language" class="w-full">
                  <ElOption value="en" label="English" />
                  <ElOption value="es" label="Español" />
                  <ElOption value="fr" label="Français" />
                  <ElOption value="de" label="Deutsch" />
                </ElSelect>
              </div>
            </div>

            <div>
              <ElCheckbox v-model="generalSettings.autoSave">
                Enable auto-save
              </ElCheckbox>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Automatically save changes every few minutes
              </p>
            </div>

            <div v-if="generalSettings.autoSave">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Auto-save interval (seconds)
              </label>
              <ElSlider v-model="generalSettings.autoSaveInterval" :min="10" :max="300" :step="10" show-input />
            </div>
          </div>
        </div>

        <!-- Grid Settings -->
        <div v-if="activeTab === 'grid'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Data Grid Settings</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Configure AG Grid behavior and appearance</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Page Size
              </label>
              <ElSelect v-model="gridSettings.pageSize" class="w-48">
                <ElOption :value="25" label="25 rows" />
                <ElOption :value="50" label="50 rows" />
                <ElOption :value="100" label="100 rows" />
                <ElOption :value="200" label="200 rows" />
              </ElSelect>
            </div>

            <div class="space-y-3">
              <ElCheckbox v-model="gridSettings.showGroupPanel">
                Show group panel
              </ElCheckbox>
              <ElCheckbox v-model="gridSettings.enableRangeSelection">
                Enable range selection
              </ElCheckbox>
              <ElCheckbox v-model="gridSettings.enableCharts">
                Enable integrated charts
              </ElCheckbox>
            </div>
          </div>
        </div>

        <!-- Diagram Settings -->
        <div v-if="activeTab === 'diagram'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Diagram Settings</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Configure network diagram behavior</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Grid Size (pixels)
              </label>
              <ElSlider v-model="diagramSettings.gridSize" :min="10" :max="50" :step="5" show-input class="w-64" />
            </div>

            <div class="space-y-3">
              <ElCheckbox v-model="diagramSettings.showGrid">
                Show background grid
              </ElCheckbox>
              <ElCheckbox v-model="diagramSettings.snapToGrid">
                Snap objects to grid
              </ElCheckbox>
              <ElCheckbox v-model="diagramSettings.showMiniMap">
                Show mini-map
              </ElCheckbox>
              <ElCheckbox v-model="diagramSettings.animationEnabled">
                Enable animations
              </ElCheckbox>
            </div>
          </div>
        </div>

        <!-- Performance Settings -->
        <div v-if="activeTab === 'performance'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Performance Settings</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Optimize application performance</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 space-y-6">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Performance Mode
              </label>
              <ElRadioGroup v-model="performanceSettings.performanceMode">
                <ElRadio label="standard">Standard</ElRadio>
                <ElRadio label="high-performance">High Performance</ElRadio>
              </ElRadioGroup>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                High performance mode disables animations and reduces visual effects
              </p>
            </div>

            <div>
              <ElCheckbox v-model="performanceSettings.enableWebWorkers">
                Enable Web Workers
              </ElCheckbox>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Use Web Workers for heavy computations (recommended)
              </p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Max render items: {{ performanceSettings.maxRenderItems.toLocaleString() }}
              </label>
              <ElSlider v-model="performanceSettings.maxRenderItems" :min="1000" :max="50000" :step="1000"
                class="w-64" />
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Maximum number of items to render simultaneously
              </p>
            </div>
          </div>
        </div>

        <!-- Storage Settings -->
        <div v-if="activeTab === 'storage'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Storage Management</h2>
            <p class="text-gray-600 dark:text-gray-400 mb-6">Manage local data and cache</p>
          </div>

          <!-- Storage Stats -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Storage Statistics</h3>

            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {{ storageStats.networks }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Networks</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600 dark:text-green-400">
                  {{ storageStats.nodes }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Nodes</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {{ storageStats.connections }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">Connections</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                  {{ storageUsedMB }}
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">MB Used</div>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <ElButton @click="loadStorageStats">
                <Icon icon="mdi:refresh" class="mr-1" />
                Refresh Stats
              </ElButton>
              <ElButton @click="exportAllData">
                <Icon icon="mdi:export" class="mr-1" />
                Export All Data
              </ElButton>
              <ElButton @click="importData">
                <Icon icon="mdi:import" class="mr-1" />
                Import Data
              </ElButton>
              <ElButton type="danger" @click="clearAllData">
                <Icon icon="mdi:delete" class="mr-1" />
                Clear All Data
              </ElButton>
            </div>
          </div>
        </div>

        <!-- About -->
        <div v-if="activeTab === 'about'" class="space-y-6">
          <div>
            <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">About Railway Designer</h2>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center mb-6">
              <Icon icon="mdi:train" class="h-16 w-16 text-blue-600 dark:text-blue-400 mr-4" />
              <div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                  Smart Railway Network Designer
                </h3>
                <p class="text-gray-600 dark:text-gray-400">
                  Version {{ import.meta.env.VITE_APP_VERSION || '1.0.0' }}
                </p>
              </div>
            </div>

            <div class="space-y-4 text-sm text-gray-600 dark:text-gray-400">
              <p>
                A professional tool for designing and managing smart railway networks with
                real-time collaboration, advanced analytics, and offline-first architecture.
              </p>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Technologies</h4>
                  <ul class="space-y-1">
                    <li>Vue 3 + TypeScript</li>
                    <li>Pinia State Management</li>
                    <li>AG Grid Enterprise</li>
                    <li>GoJS Diagramming</li>
                    <li>IndexedDB Storage</li>
                  </ul>
                </div>

                <div>
                  <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Features</h4>
                  <ul class="space-y-1">
                    <li>Offline-first PWA</li>
                    <li>Real-time collaboration</li>
                    <li>Advanced data visualization</li>
                    <li>Performance analytics</li>
                    <li>Export/Import capabilities</li>
                  </ul>
                </div>
              </div>

              <div class="border-t border-gray-200 dark:border-gray-600 pt-4 mt-6">
                <p class="text-center">
                  © {{ new Date().getFullYear() }} Railway Systems Inc. All rights reserved.
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Save Actions -->
        <div class="flex justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <ElButton @click="resetSettings">
            Reset to Defaults
          </ElButton>
          <ElButton type="primary" :loading="loading" @click="saveSettings">
            Save Settings
          </ElButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom slider styling */
:deep(.el-slider__runway) {
  background-color: theme('colors.gray.200');
}

.dark :deep(.el-slider__runway) {
  background-color: theme('colors.gray.600');
}
</style>