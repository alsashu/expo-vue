<template>
  <div class="dashboard">
    <h1>Stockroom Dashboard</h1>

    <div class="stats-grid grid grid-4">
      <div class="card stat-card">
        <div class="stat-number">{{ itemsStore.totalItems }}</div>
        <div class="stat-label">Total Items</div>
      </div>

      <div class="card stat-card">
        <div class="stat-number">{{ itemsStore.lowStockCount }}</div>
        <div class="stat-label">Low Stock Items</div>
      </div>

      <div class="card stat-card">
        <div class="stat-number">${{ itemsStore.totalValue.toFixed(2) }}</div>
        <div class="stat-label">Total Inventory Value</div>
      </div>

      <div class="card stat-card">
        <div class="stat-number">{{ isOnline ? '🟢' : '🔴' }}</div>
        <div class="stat-label">Connection Status</div>
      </div>
    </div>


  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useItemsStore } from '@/stores/items'

const itemsStore = useItemsStore()
const isOnline = ref(navigator.onLine)

const handleOnline = () => {
  isOnline.value = true
}

const handleOffline = () => {
  isOnline.value = false
}

onMounted(async () => {
  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Load items data for stats
  await itemsStore.load()
})

onUnmounted(() => {
  window.removeEventListener('online', handleOnline)
  window.removeEventListener('offline', handleOffline)
})
</script>

<style scoped>
.dashboard h1 {
  margin-bottom: 2rem;
  color: #333;
}

.stats-grid {
  margin-bottom: 2rem;
}

.quick-start {
  margin-bottom: 2rem;
}

.quick-start h2 {
  color: #1976d2;
  margin-bottom: 1.5rem;
}

.guide-sections {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 2rem;
}

.guide-section {
  padding: 1.5rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #1976d2;
}

.guide-section h3 {
  color: #1976d2;
  margin-bottom: 1rem;
}

.guide-section p {
  margin-bottom: 0.5rem;
}

.guide-section ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
}

.guide-section li {
  margin-bottom: 0.5rem;
}

.actions h3 {
  margin-bottom: 1rem;
  color: #1976d2;
}

.actions p {
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.5;
}

.actions ul {
  margin: 1rem 0;
  padding-left: 1.5rem;
  color: #666;
}

.actions li {
  margin-bottom: 0.5rem;
}

.technical-features {
  margin-top: 2rem;
}

.technical-features h2 {
  color: #1976d2;
  margin-bottom: 1.5rem;
}
</style>