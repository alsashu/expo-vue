<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'

interface Route {
  name: string
  path: string
  meta?: {
    title?: string
    icon?: string
    showInNav?: boolean
  }
}

interface Props {
  collapsed: boolean
  routes: Route[]
  currentRoute: string
}

interface Emits {
  (e: 'navigate', path: string): void
  (e: 'toggle'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const sidebarClass = computed(() => [
  'fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40',
  {
    'w-64': !props.collapsed,
    'w-16': props.collapsed
  }
])

const isRouteActive = (routeName: string) => {
  return props.currentRoute === routeName
}

const handleNavigate = (path: string) => {
  emit('navigate', path)
}
</script>

<template>
  <aside :class="sidebarClass">
    <!-- Logo & Brand -->
    <div class="h-16 flex items-center px-4 border-b border-gray-200 dark:border-gray-700">
      <div class="flex items-center">
        <div class="flex-shrink-0">
          <Icon icon="mdi:train" class="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>

        <Transition name="fade">
          <div v-if="!collapsed" class="ml-3">
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">
              Railway Designer
            </h1>
          </div>
        </Transition>
      </div>

      <!-- Collapse Toggle -->
      <button class="ml-auto p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        @click="emit('toggle')">
        <Icon :icon="collapsed ? 'mdi:menu' : 'mdi:menu-open'" class="h-5 w-5 text-gray-500 dark:text-gray-400" />
      </button>
    </div>

    <!-- Navigation -->
    <nav class="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
      <template v-for="route in routes" :key="route.name">
        <div class="group relative rounded-md cursor-pointer transition-colors duration-200" :class="{
          'bg-blue-50 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300': isRouteActive(route.name),
          'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700': !isRouteActive(route.name)
        }" @click="handleNavigate(route.path)">
          <div class="flex items-center px-3 py-2">
            <!-- Icon -->
            <div class="flex-shrink-0">
              <Icon :icon="route.meta?.icon || 'mdi:circle'" class="h-5 w-5" :class="{
                'text-blue-600 dark:text-blue-400': isRouteActive(route.name),
                'text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300': !isRouteActive(route.name)
              }" />
            </div>

            <!-- Label -->
            <Transition name="fade-slide">
              <div v-if="!collapsed" class="ml-3 flex-1">
                <span class="text-sm font-medium">
                  {{ route.meta?.title || route.name }}
                </span>
              </div>
            </Transition>
          </div>

          <!-- Tooltip for collapsed state -->
          <ElTooltip v-if="collapsed" :content="route.meta?.title || route.name" placement="right" :offset="10">
            <div class="absolute inset-0"></div>
          </ElTooltip>

          <!-- Active indicator -->
          <div v-if="isRouteActive(route.name)"
            class="absolute right-0 top-0 bottom-0 w-1 bg-blue-600 dark:bg-blue-400 rounded-l-full" />
        </div>
      </template>
    </nav>

    <!-- Footer Actions -->
    <div class="border-t border-gray-200 dark:border-gray-700 p-2">
      <!-- Settings -->
      <div
        class="group relative rounded-md cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        @click="handleNavigate('/settings')">
        <div class="flex items-center px-3 py-2">
          <div class="flex-shrink-0">
            <Icon icon="mdi:cog"
              class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          </div>

          <Transition name="fade-slide">
            <div v-if="!collapsed" class="ml-3 flex-1">
              <span class="text-sm font-medium">Settings</span>
            </div>
          </Transition>
        </div>

        <ElTooltip v-if="collapsed" content="Settings" placement="right" :offset="10">
          <div class="absolute inset-0"></div>
        </ElTooltip>
      </div>

      <!-- Help -->
      <div
        class="group relative rounded-md cursor-pointer text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
        @click="handleNavigate('/about')">
        <div class="flex items-center px-3 py-2">
          <div class="flex-shrink-0">
            <Icon icon="mdi:help-circle"
              class="h-5 w-5 text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-gray-300" />
          </div>

          <Transition name="fade-slide">
            <div v-if="!collapsed" class="ml-3 flex-1">
              <span class="text-sm font-medium">Help</span>
            </div>
          </Transition>
        </div>

        <ElTooltip v-if="collapsed" content="Help & Support" placement="right" :offset="10">
          <div class="absolute inset-0"></div>
        </ElTooltip>
      </div>
    </div>
  </aside>
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

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.2s ease;
}

.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  transform: translateX(-10px);
}

/* Custom scrollbar */
nav::-webkit-scrollbar {
  width: 4px;
}

nav::-webkit-scrollbar-track {
  background: transparent;
}

nav::-webkit-scrollbar-thumb {
  background: theme('colors.gray.300');
  border-radius: 2px;
}

nav::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.400');
}

.dark nav::-webkit-scrollbar-thumb {
  background: theme('colors.gray.600');
}

.dark nav::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.500');
}
</style>