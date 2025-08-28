<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-container">
        <router-link to="/" class="nav-brand">Boilerplate Lite</router-link>
        <div class="nav-links">
          <router-link to="/" class="nav-link">Dashboard</router-link>
          <router-link to="/items" class="nav-link">Items</router-link>
          <router-link to="/diagram" class="nav-link">Diagram</router-link>
        </div>
        <div class="controls">
          <label class="offline-toggle">
            <input type="checkbox" v-model="uiStore.offlineMode" @change="handleOfflineToggle" />
            <span>Offline mode</span>
          </label>
          <div class="connection-status" :class="{ offline: !isOnline || uiStore.offlineMode }">
            {{ (!isOnline || uiStore.offlineMode) ? '🔴 Offline' : '🟢 Online' }}
          </div>
        </div>
      </div>
    </nav>

    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useUIStore } from '@/stores/ui'
import { syncService } from '@/services/sync'
import { useItemsStore } from '@/stores/items'

const isOnline = ref(navigator.onLine)
const uiStore = useUIStore()
const itemsStore = useItemsStore()

const handleOnline = () => {
  isOnline.value = true
}

const handleOffline = () => {
  isOnline.value = false
}

onMounted(() => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})

const handleOfflineToggle = async () => {
  // When toggled back online and network is available, push outbox and refresh items
  if (!uiStore.offlineMode && navigator.onLine) {
    await syncService.pushOutbox()
    await itemsStore.load()
  }
}
</script>

<style scoped>
#app {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 1rem 0;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
  color: #333;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.2s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: #e3f2fd;
  color: #1976d2;
}

.connection-status {
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #e8f5e8;
}

.connection-status.offline {
  background: #ffebee;
  color: #c62828;
}

.controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.offline-toggle {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  color: #333;
}

.main-content {
  max-width: 1200px;
  margin: 2rem auto;
  padding: 0 1rem;
}
</style>