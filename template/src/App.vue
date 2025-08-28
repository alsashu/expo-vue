<script setup lang="ts">
import { provide, ref } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'

// Basic setup without complex features for now
const isOnline = ref(true)
const syncStatus = ref('synced')
</script>

<template>
  <div id="app" class="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
    <AppLayout>
      <RouterView />
    </AppLayout>
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
</style>