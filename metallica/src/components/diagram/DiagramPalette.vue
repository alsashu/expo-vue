<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  selectedTool: 'select' | 'pan' | 'node' | 'connection'
  selectedNodeType: 'station' | 'junction' | 'signal' | 'switch'
}

interface Emits {
  (e: 'tool-change', tool: 'select' | 'pan' | 'node' | 'connection'): void
  (e: 'node-type-change', type: 'station' | 'junction' | 'signal' | 'switch'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tools = [
  { id: 'select', name: 'Select', icon: 'mdi:cursor-default', description: 'Select and move objects' },
  { id: 'pan', name: 'Pan', icon: 'mdi:hand', description: 'Pan around the diagram' },
  { id: 'node', name: 'Add Node', icon: 'mdi:plus-circle', description: 'Add railway nodes' },
  { id: 'connection', name: 'Connect', icon: 'mdi:connection', description: 'Connect nodes' }
] as const

const nodeTypes = [
  {
    id: 'station',
    name: 'Station',
    icon: 'mdi:train',
    description: 'Passenger or freight station',
    color: '#3b82f6'
  },
  {
    id: 'junction',
    name: 'Junction',
    icon: 'mdi:call-split',
    description: 'Railway track junction',
    color: '#8b5cf6'
  },
  {
    id: 'signal',
    name: 'Signal',
    icon: 'mdi:traffic-light',
    description: 'Railway signal control',
    color: '#10b981'
  },
  {
    id: 'switch',
    name: 'Switch',
    icon: 'mdi:swap-horizontal',
    description: 'Track switching point',
    color: '#f59e0b'
  }
] as const
</script>

<template>
  <div class="h-full flex flex-col bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
        Tools
      </h3>
      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
        Select tools to design your network
      </p>
    </div>

    <!-- Tools Section -->
    <div class="p-4 space-y-2">
      <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Tools
      </h4>

      <div class="space-y-1">
        <button v-for="tool in tools" :key="tool.id"
          class="w-full flex items-center p-3 rounded-lg transition-colors text-left" :class="{
            'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700': selectedTool === tool.id,
            'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700': selectedTool !== tool.id
          }" @click="emit('tool-change', tool.id)">
          <Icon :icon="tool.icon" class="h-5 w-5 mr-3 flex-shrink-0" />
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium">{{ tool.name }}</div>
            <div class="text-xs opacity-75 truncate">{{ tool.description }}</div>
          </div>
        </button>
      </div>
    </div>

    <!-- Node Types Section -->
    <div class="p-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
        Node Types
      </h4>
      <p class="text-xs text-gray-500 dark:text-gray-400">
        Select type when adding nodes
      </p>

      <div class="space-y-1">
        <button v-for="nodeType in nodeTypes" :key="nodeType.id"
          class="w-full flex items-center p-3 rounded-lg transition-colors text-left" :class="{
            'bg-gray-50 dark:bg-gray-700 border-2': selectedNodeType === nodeType.id,
            'border border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700': selectedNodeType !== nodeType.id
          }" :style="selectedNodeType === nodeType.id ? { borderColor: nodeType.color } : {}"
          @click="emit('node-type-change', nodeType.id)">
          <div class="w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0"
            :style="{ backgroundColor: nodeType.color + '20', color: nodeType.color }">
            <Icon :icon="nodeType.icon" class="h-4 w-4" />
          </div>
          <div class="flex-1 min-w-0">
            <div class="text-sm font-medium text-gray-900 dark:text-white">
              {{ nodeType.name }}
            </div>
            <div class="text-xs text-gray-500 dark:text-gray-400 truncate">
              {{ nodeType.description }}
            </div>
          </div>
        </button>
      </div>
    </div>

    <!-- Keyboard Shortcuts -->
    <div class="mt-auto p-4 border-t border-gray-200 dark:border-gray-700">
      <h4 class="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-2">
        Shortcuts
      </h4>

      <div class="space-y-1 text-xs text-gray-500 dark:text-gray-400">
        <div class="flex justify-between">
          <span>Select</span>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">1</kbd>
        </div>
        <div class="flex justify-between">
          <span>Pan</span>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">2</kbd>
        </div>
        <div class="flex justify-between">
          <span>Add Node</span>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">3</kbd>
        </div>
        <div class="flex justify-between">
          <span>Connect</span>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">4</kbd>
        </div>
        <div class="flex justify-between">
          <span>Delete</span>
          <kbd class="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">Del</kbd>
        </div>
      </div>
    </div>
  </div>
</template>