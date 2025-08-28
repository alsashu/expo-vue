<script setup lang="ts">
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUIStore } from '@/stores/ui'
import AppHeader from './AppHeader.vue'
import AppSidebar from './AppSidebar.vue'
import AppFooter from './AppFooter.vue'

interface Props {
  currentNetwork?: any
  isOnline?: boolean
  syncStatus?: 'synced' | 'syncing' | 'error'
}

const props = withDefaults(defineProps<Props>(), {
  isOnline: true,
  syncStatus: 'synced'
})

const router = useRouter()
const route = useRoute()
const uiStore = useUIStore()

// Computed properties
const sidebarCollapsed = computed(() => uiStore.sidebarCollapsed)

// Navigation routes
const navigationRoutes = computed(() => [
  { name: 'home', path: '/', meta: { title: 'Dashboard', icon: 'mdi:view-dashboard', showInNav: true } },
  { name: 'grid', path: '/grid', meta: { title: 'Data Grid', icon: 'mdi:table', showInNav: true } },
  { name: 'diagram', path: '/diagram', meta: { title: 'Diagram', icon: 'mdi:graph', showInNav: true } },
  { name: 'analytics', path: '/analytics', meta: { title: 'Analytics', icon: 'mdi:chart-line', showInNav: true } },
  { name: 'settings', path: '/settings', meta: { title: 'Settings', icon: 'mdi:cog', showInNav: true } }
].filter(route => route.meta?.showInNav))

const currentRoute = computed(() => route.name as string || 'home')

// Methods
const handleNavigate = (path: string) => {
  router.push(path)
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <!-- Header -->
    <AppHeader 
      :current-network="currentNetwork"
      :is-online="isOnline"
      :sync-status="syncStatus"
      @toggle-sidebar="uiStore.toggleSidebar"
      @toggle-theme="uiStore.toggleTheme"
    />

    <div class="flex h-[calc(100vh-4rem)]">
      <!-- Sidebar -->
      <AppSidebar 
        :collapsed="sidebarCollapsed"
        :routes="navigationRoutes"
        :current-route="currentRoute"
        @toggle="uiStore.toggleSidebar"
        @navigate="handleNavigate"
      />

      <!-- Main Content -->
      <main class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <div class="flex-1 overflow-auto">
          <slot />
        </div>
        
        <!-- Footer -->
        <AppFooter />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Ensure proper height calculations */
:deep(.router-view) {
  min-height: 400px;
}
</style>