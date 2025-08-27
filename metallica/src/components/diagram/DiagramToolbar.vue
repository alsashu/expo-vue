<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface Props {
  selectedTool: 'select' | 'pan' | 'node' | 'connection'
  hasSelection: boolean
  canUndo: boolean
  canRedo: boolean
  showGrid: boolean
  showMinimap: boolean
  showPalette: boolean
  showProperties: boolean
  stats?: {
    nodes: number
    connections: number
    selectedNodes: number
    selectedConnections: number
  } | null
}

interface Emits {
  (e: 'tool-change', tool: 'select' | 'pan' | 'node' | 'connection'): void
  (e: 'save'): void
  (e: 'export', format: 'png' | 'svg' | 'pdf'): void
  (e: 'undo'): void
  (e: 'redo'): void
  (e: 'delete'): void
  (e: 'duplicate'): void
  (e: 'zoom-in'): void
  (e: 'zoom-out'): void
  (e: 'zoom-fit'): void
  (e: 'zoom-reset'): void
  (e: 'toggle-grid'): void
  (e: 'toggle-minimap'): void
  (e: 'toggle-palette'): void
  (e: 'toggle-properties'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const tools = [
  { id: 'select', icon: 'mdi:cursor-default', tooltip: 'Select (1)' },
  { id: 'pan', icon: 'mdi:hand', tooltip: 'Pan (2)' },
  { id: 'node', icon: 'mdi:plus-circle', tooltip: 'Add Node (3)' },
  { id: 'connection', icon: 'mdi:connection', tooltip: 'Add Connection (4)' }
] as const
</script>

<template>
  <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2">
    <div class="flex items-center justify-between">
      <!-- Left Section - Tools -->
      <div class="flex items-center space-x-1">
        <!-- Tool Selection -->
        <div class="flex bg-gray-100 dark:bg-gray-700 rounded-md p-1">
          <button v-for="tool in tools" :key="tool.id" class="p-2 rounded-md transition-colors" :class="{
            'bg-blue-500 text-white': selectedTool === tool.id,
            'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white': selectedTool !== tool.id
          }" @click="emit('tool-change', tool.id)">
            <Icon :icon="tool.icon" class="h-4 w-4" />
          </button>
        </div>

        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <!-- Actions -->
        <ElButton size="small" :disabled="!canUndo" @click="emit('undo')">
          <Icon icon="mdi:undo" class="mr-1" />
          Undo
        </ElButton>

        <ElButton size="small" :disabled="!canRedo" @click="emit('redo')">
          <Icon icon="mdi:redo" class="mr-1" />
          Redo
        </ElButton>

        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <ElButton size="small" :disabled="!hasSelection" @click="emit('duplicate')">
          <Icon icon="mdi:content-copy" class="mr-1" />
          Duplicate
        </ElButton>

        <ElButton size="small" type="danger" :disabled="!hasSelection" @click="emit('delete')">
          <Icon icon="mdi:delete" class="mr-1" />
          Delete
        </ElButton>
      </div>

      <!-- Center Section - Stats -->
      <div v-if="stats" class="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
        <span>{{ stats.nodes }} nodes</span>
        <span>{{ stats.connections }} connections</span>
        <span v-if="hasSelection">
          {{ stats.selectedNodes + stats.selectedConnections }} selected
        </span>
      </div>

      <!-- Right Section - View Controls -->
      <div class="flex items-center space-x-1">
        <!-- Zoom Controls -->
        <ElButton size="small" @click="emit('zoom-in')">
          <Icon icon="mdi:magnify-plus" />
        </ElButton>

        <ElButton size="small" @click="emit('zoom-out')">
          <Icon icon="mdi:magnify-minus" />
        </ElButton>

        <ElButton size="small" @click="emit('zoom-fit')">
          <Icon icon="mdi:fit-to-page" />
        </ElButton>

        <ElButton size="small" @click="emit('zoom-reset')">
          <Icon icon="mdi:magnify" />
        </ElButton>

        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <!-- View Toggles -->
        <ElButton size="small" :type="showGrid ? 'primary' : ''" @click="emit('toggle-grid')">
          <Icon icon="mdi:grid" />
        </ElButton>

        <ElButton size="small" :type="showMinimap ? 'primary' : ''" @click="emit('toggle-minimap')">
          <Icon icon="mdi:map" />
        </ElButton>

        <ElButton size="small" :type="showPalette ? 'primary' : ''" @click="emit('toggle-palette')">
          <Icon icon="mdi:palette" />
        </ElButton>

        <ElButton size="small" :type="showProperties ? 'primary' : ''" @click="emit('toggle-properties')">
          <Icon icon="mdi:information" />
        </ElButton>

        <div class="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-2" />

        <!-- Export -->
        <ElDropdown trigger="click">
          <ElButton size="small">
            <Icon icon="mdi:export" class="mr-1" />
            Export
          </ElButton>
          <template #dropdown>
            <ElDropdownMenu>
              <ElDropdownItem @click="emit('export', 'png')">
                <Icon icon="mdi:file-image" class="mr-2" />
                Export as PNG
              </ElDropdownItem>
              <ElDropdownItem @click="emit('export', 'svg')">
                <Icon icon="mdi:vector-square" class="mr-2" />
                Export as SVG
              </ElDropdownItem>
              <ElDropdownItem @click="emit('export', 'pdf')">
                <Icon icon="mdi:file-pdf" class="mr-2" />
                Export as PDF
              </ElDropdownItem>
            </ElDropdownMenu>
          </template>
        </ElDropdown>

        <!-- Save -->
        <ElButton size="small" type="primary" @click="emit('save')">
          <Icon icon="mdi:content-save" class="mr-1" />
          Save
        </ElButton>
      </div>
    </div>
  </div>
</template>