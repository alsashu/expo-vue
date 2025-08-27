<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@stores/ui'
import { useRailwayStore } from '@stores/railway'
import { Icon } from '@iconify/vue'
import type { RailwayNetwork } from '@/types/railway'

interface Props {
  currentNetwork: RailwayNetwork | null
  isOnline: boolean
  syncStatus: 'synced' | 'syncing' | 'error'
}

interface Emits {
  (e: 'toggle-sidebar'): void
  (e: 'toggle-theme'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()
const railwayStore = useRailwayStore()

// Inject global state
const isOnline = inject('isOnline', ref(true))
const syncStatus = inject('syncStatus', ref('synced'))

// Computed properties
const currentPageTitle = computed(() => {
  const routeMeta = route.meta
  return routeMeta?.title || 'Railway Designer'
})

const networkStatusIcon = computed(() => {
  if (!props.isOnline) return 'mdi:wifi-off'

  switch (props.syncStatus) {
    case 'syncing': return 'mdi:sync'
    case 'error': return 'mdi:sync-alert'
    default: return 'mdi:sync'
  }
})

const networkStatusColor = computed(() => {
  if (!props.isOnline) return 'text-red-500'

  switch (props.syncStatus) {
    case 'syncing': return 'text-blue-500 animate-spin'
    case 'error': return 'text-red-500'
    default: return 'text-green-500'
  }
})

const networkStatusText = computed(() => {
  if (!props.isOnline) return 'Offline'

  switch (props.syncStatus) {
    case 'syncing': return 'Syncing...'
    case 'error': return 'Sync Error'
    default: return 'Synced'
  }
})

const hasUnsavedChanges = computed(() => railwayStore.isDirty)
const canUndo = computed(() => railwayStore.canUndo())
const canRedo = computed(() => railwayStore.canRedo())

// Methods
const handleSave = async () => {
  try {
    await railwayStore.saveNetwork()
    uiStore.showSuccess('Saved', 'Network saved successfully')
  } catch (error) {
    uiStore.showError('Save Failed', 'Failed to save network')
  }
}

const handleUndo = () => {
  railwayStore.undo()
}

const handleRedo = () => {
  railwayStore.redo()
}

const openCommandPalette = () => {
  uiStore.openCommandPalette()
}

const openNetworkSelector = () => {
  uiStore.openModal({
    component: 'NetworkSelectorModal',
    title: 'Select Network',
    props: {
      networks: railwayStore.networks,
      currentNetworkId: props.currentNetwork?.id,
      onSelect: (networkId: string) => {
        railwayStore.loadNetwork(networkId)
      }
    }
  })
}

const openUserMenu = () => {
  // Implementation for user menu
  console.log('User menu opened')
}
</script>

<template>
  <header
    class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
    <!-- Left Section -->
    <div class="flex items-center space-x-4">
      <!-- Mobile Sidebar Toggle -->
      <button class="lg:hidden p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        @click="emit('toggle-sidebar')">
        <Icon icon="mdi:menu" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>

      <!-- Breadcrumb -->
      <div class="flex items-center space-x-2 text-sm">
        <Icon icon="mdi:home" class="h-4 w-4 text-gray-400 dark:text-gray-500" />
        <span class="text-gray-400 dark:text-gray-500">/</span>
        <span class="font-medium text-gray-900 dark:text-white">
          {{ currentPageTitle }}
        </span>

        <template v-if="currentNetwork">
          <span class="text-gray-400 dark:text-gray-500">/</span>
          <button
            class="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
            @click="openNetworkSelector">
            {{ currentNetwork.name }}
          </button>
        </template>
      </div>
    </div>

    <!-- Center Section - Network Status -->
    <div v-if="currentNetwork" class="flex items-center space-x-4">
      <!-- Network Status -->
      <div class="flex items-center space-x-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <Icon :icon="networkStatusIcon" :class="[
          'h-4 w-4',
          networkStatusColor
        ]" />
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ networkStatusText }}
        </span>
      </div>

      <!-- Unsaved Changes Indicator -->
      <div v-if="hasUnsavedChanges"
        class="flex items-center space-x-2 px-3 py-1.5 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400 rounded-lg">
        <Icon icon="mdi:circle" class="h-2 w-2 fill-current" />
        <span class="text-sm font-medium">Unsaved Changes</span>
      </div>
    </div>

    <!-- Right Section -->
    <div class="flex items-center space-x-2">
      <!-- Action Buttons -->
      <div class="flex items-center space-x-1">
        <!-- Save -->
        <ElTooltip content="Save (Ctrl+S)" placement="bottom">
          <ElButton size="small" :disabled="!hasUnsavedChanges" @click="handleSave">
            <Icon icon="mdi:content-save" class="h-4 w-4" />
          </ElButton>
        </ElTooltip>

        <!-- Undo -->
        <ElTooltip content="Undo (Ctrl+Z)" placement="bottom">
          <ElButton size="small" :disabled="!canUndo" @click="handleUndo">
            <Icon icon="mdi:undo" class="h-4 w-4" />
          </ElButton>
        </ElTooltip>

        <!-- Redo -->
        <ElTooltip content="Redo (Ctrl+Y)" placement="bottom">
          <ElButton size="small" :disabled="!canRedo" @click="handleRedo">
            <Icon icon="mdi:redo" class="h-4 w-4" />
          </ElButton>
        </ElTooltip>

        <div class="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-1" />

        <!-- Command Palette -->
        <ElTooltip content="Command Palette (Ctrl+K)" placement="bottom">
          <ElButton size="small" @click="openCommandPalette">
            <Icon icon="mdi:console" class="h-4 w-4" />
          </ElButton>
        </ElTooltip>

        <!-- Theme Toggle -->
        <ElTooltip content="Toggle Theme" placement="bottom">
          <ElButton size="small" @click="emit('toggle-theme')">
            <Icon :icon="uiStore.isDarkMode ? 'mdi:weather-sunny' : 'mdi:weather-night'" class="h-4 w-4" />
          </ElButton>
        </ElTooltip>
      </div>

      <div class="w-px h-6 bg-gray-200 dark:bg-gray-600 mx-2" />

      <!-- Network Selector -->
      <ElSelect v-if="railwayStore.networks.length > 0" :model-value="currentNetwork?.id" placeholder="Select Network"
        size="small" class="w-48" @change="railwayStore.loadNetwork">
        <template #prefix>
          <Icon icon="mdi:network" class="h-4 w-4 text-gray-400" />
        </template>

        <ElOption v-for="network in railwayStore.networks" :key="network.id" :label="network.name" :value="network.id">
          <div class="flex items-center justify-between">
            <span>{{ network.name }}</span>
            <div class="flex items-center space-x-1 text-xs text-gray-500">
              <Icon :icon="network.metadata.offline ? 'mdi:wifi-off' : 'mdi:wifi'" class="h-3 w-3" />
              <span>{{ network.metadata.nodeCount }} nodes</span>
            </div>
          </div>
        </ElOption>
      </ElSelect>

      <!-- User Menu -->
      <ElDropdown trigger="click" placement="bottom-end">
        <ElButton size="small" circle>
          <Icon icon="mdi:account-circle" class="h-5 w-5" />
        </ElButton>

        <template #dropdown>
          <ElDropdownMenu>
            <ElDropdownItem @click="router.push('/settings')">
              <Icon icon="mdi:cog" class="mr-2" />
              Settings
            </ElDropdownItem>
            <ElDropdownItem @click="router.push('/about')">
              <Icon icon="mdi:information" class="mr-2" />
              About
            </ElDropdownItem>
            <ElDropdownItem divided>
              <Icon icon="mdi:help-circle" class="mr-2" />
              Help & Support
            </ElDropdownItem>
          </ElDropdownMenu>
        </template>
      </ElDropdown>

      <!-- Notifications -->
      <ElBadge :value="uiStore.unreadNotifications.length" :hidden="uiStore.unreadNotifications.length === 0">
        <ElButton size="small" circle>
          <Icon icon="mdi:bell" class="h-4 w-4" />
        </ElButton>
      </ElBadge>
    </div>
  </header>
</template>

<style scoped>
/* Custom transitions */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>