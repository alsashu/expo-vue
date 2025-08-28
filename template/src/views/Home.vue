<script setup lang="ts">
import { useRailwayStore } from '@/stores/railway-basic'
import { useUIStore } from '@/stores/ui-basic'

const railwayStore = useRailwayStore()
const uiStore = useUIStore()
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <div class="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div class="text-center">
        <h1 class="text-4xl font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
          Smart Railway Network Designer
        </h1>
        <p class="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Advanced PWA for designing and managing smart railway networks.
        </p>
        <div class="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
          <RouterLink to="/grid" class="btn-primary">
            Get Started
          </RouterLink>
        </div>
      </div>
    </div>
  </div>
</template>