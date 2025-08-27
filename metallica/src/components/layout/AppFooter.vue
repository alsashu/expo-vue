<script setup lang="ts">
import { computed, ref } from 'vue'
import { useUIStore } from '@stores/ui'
import { useRailwayStore } from '@stores/railway'
import { Icon } from '@iconify/vue'

const uiStore = useUIStore()
const railwayStore = useRailwayStore()

// Reactive online status
const isOnline = ref(navigator.onLine)

// Listen for online/offline events
const updateOnlineStatus = () => {
  isOnline.value = navigator.onLine
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

// Computed properties
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || '1.0.0')
const buildDate = computed(() => new Date().getFullYear())
const currentNetwork = computed(() => railwayStore.currentNetwork)
const syncStatus = computed(() => railwayStore.isDirty ? 'unsaved' : 'saved')

const statusIcon = computed(() => {
  switch (syncStatus.value) {
    case 'unsaved': return 'mdi:circle'
    case 'saved': return 'mdi:check-circle'
    default: return 'mdi:circle-outline'
  }
})

const statusColor = computed(() => {
  switch (syncStatus.value) {
    case 'unsaved': return 'text-yellow-500'
    case 'saved': return 'text-green-500'
    default: return 'text-gray-500'
  }
})
</script>

<template>
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-3">
    <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <!-- Left Section - App Info -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <Icon icon="mdi:train" class="h-4 w-4" />
          <span>Railway Designer</span>
          <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">
            v{{ appVersion }}
          </span>
        </div>

        <div class="text-gray-400 dark:text-gray-500">
          © {{ buildDate }} Railway Systems Inc.
        </div>
      </div>

      <!-- Center Section - Network Status -->
      <div v-if="currentNetwork" class="flex items-center space-x-2">
        <Icon :icon="statusIcon" :class="[
          'h-3 w-3',
          statusColor
        ]" />
        <span>{{ currentNetwork.name }}</span>
        <span class="text-gray-400 dark:text-gray-500">•</span>
        <span class="capitalize">{{ syncStatus }}</span>
      </div>

      <!-- Right Section - System Info -->
      <div class="flex items-center space-x-4">
        <div class="flex items-center space-x-1">
          <Icon :icon="isOnline ? 'mdi:wifi' : 'mdi:wifi-off'" :class="[
            'h-3 w-3',
            isOnline ? 'text-green-500' : 'text-red-500'
          ]" />
          <span>{{ isOnline ? 'Online' : 'Offline' }}</span>
        </div>

        <div class="text-gray-400 dark:text-gray-500">
          Press Ctrl+K for commands
        </div>
      </div>
    </div>
  </footer>
</template>