<script setup lang="ts">
import { useUIStore } from '@/stores/ui-basic'
import { getNavigationRoutes } from '@/router'

const uiStore = useUIStore()
const navigationRoutes = getNavigationRoutes()
</script>

<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900">
    <!-- Navigation -->
    <nav class="bg-white dark:bg-gray-800 shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                Railway Designer
              </h1>
            </div>
            <div class="ml-6 flex space-x-8">
              <RouterLink v-for="route in navigationRoutes" :key="route.name" :to="route.path"
                class="inline-flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                active-class="border-b-2 border-blue-500 text-gray-900 dark:text-white">
                {{ route.meta?.title }}
              </RouterLink>
            </div>
          </div>

          <div class="flex items-center space-x-4">
            <button @click="uiStore.toggleDarkMode()" class="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
              :title="uiStore.isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'">
              {{ uiStore.isDarkMode ? '☀️' : '🌙' }}
            </button>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main content -->
    <main>
      <slot />
    </main>
  </div>
</template>
