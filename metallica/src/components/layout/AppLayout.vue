<script setup lang="ts">
import { provide, watchEffect } from 'vue'
import { useEventListener } from '@vueuse/core'
import { useUIStore } from '@/stores/ui'
import { useRailwayStore } from '@/stores/railway'
import { useOfflineSync } from '@/composables/useOfflineSync'
import { useCommandPalette } from '@/composables/useCommandPalette'
import AppLayout from '@components/layout/AppLayout.vue'
import CommandPalette from '@components/common/CommandPalette.vue'

const uiStore = useUIStore()
const railwayStore = useRailwayStore()

// Initialize offline sync
const { isOnline, syncStatus } = useOfflineSync()

// Initialize command palette
const { isCommandPaletteOpen, commands } = useCommandPalette()

// Provide global state
provide('isOnline', isOnline)
provide('syncStatus', syncStatus)
provide('commands', commands)

// Methods
const reloadPage = () => {
  window.location.reload()
}

// Global keyboard shortcuts
useEventListener('keydown', (event: KeyboardEvent) => {
  // Command palette
  if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
    event.preventDefault()
    isCommandPaletteOpen.value = true
  }

  // Undo/Redo
  if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
    event.preventDefault()
    railwayStore.undo()
  }

  if ((event.ctrlKey || event.metaKey) && (event.key === 'y' || (event.key === 'z' && event.shiftKey))) {
    event.preventDefault()
    railwayStore.redo()
  }
})

// Theme management
watchEffect(() => {
  if (uiStore.isDarkMode) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppLayout>
      <RouterView v-slot="{ Component, route }">
        <Transition name="fade" mode="out-in">
          <KeepAlive :include="['Grid', 'Diagram']">
            <component :is="Component" :key="route.path" />
          </KeepAlive>
        </Transition>
      </RouterView>
    </AppLayout>

    <!-- Command Palette -->
    <CommandPalette v-model:visible="isCommandPaletteOpen" :commands="commands as any" />

    <!-- Global Notifications -->
    <Teleport to="body">
      <div id="notifications" class="fixed top-4 right-4 z-100 space-y-2">
        <!-- PWA Update Notification -->
        <ElNotification v-if="uiStore.showUpdateNotification" title="Update Available"
          message="A new version of the app is available. Please refresh to update." type="info" :duration="0"
          :closable="true" @close="uiStore.dismissUpdateNotification">
          <template #default>
            <div class="flex items-center gap-2">
              <span>A new version is available</span>
              <ElButton size="small" type="primary" @click="reloadPage">
                Update
              </ElButton>
            </div>
          </template>
        </ElNotification>

        <!-- Offline Status -->
        <ElAlert v-if="!isOnline" title="Offline Mode"
          description="You're currently offline. Changes will sync when connection is restored." type="warning"
          :closable="false" show-icon />

        <!-- Sync Status -->
        <ElAlert v-if="syncStatus === 'syncing'" title="Syncing" description="Syncing your changes..." type="info"
          :closable="false" show-icon />
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Loading spinner for lazy routes */
:deep(.router-view) {
  min-height: 400px;
}
</style>