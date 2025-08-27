<script setup lang="ts">
import { computed } from 'vue'
import { useRailwayStore } from '@/stores/railway'
import { Icon } from '@iconify/vue'

const railwayStore = useRailwayStore()

const selectedNode = computed(() => {
  if (railwayStore.selectedNodes.length === 1) {
    const [id] = railwayStore.selectedNodes
    return id ? railwayStore.getNodeById(id) : null
  }
  return null
})

const selectedConnection = computed(() => {
  if (railwayStore.selectedConnections.length === 1) {
    const [id] = railwayStore.selectedConnections
    return id ? railwayStore.getConnectionById(id) : null
  }
  return null
})

const hasSelection = computed(() => {
  return railwayStore.hasSelection
})

// Complete icon mapping for all node types
const getNodeIcon = (nodeType: string): string => {
  const iconMap: Record<string, string> = {
    station: 'mdi:train',
    junction: 'mdi:call-split',
    signal: 'mdi:traffic-light',
    switch: 'mdi:swap-horizontal',
    crossing: 'mdi:crosshairs',
    bridge: 'mdi:bridge',
    tunnel: 'mdi:tunnel'
  }
  return iconMap[nodeType] || 'mdi:circle'
}

const updateNodeProperty = (field: string, value: any) => {
  if (selectedNode.value) {
    const updates = {
      properties: {
        ...selectedNode.value.properties,
        [field]: value
      }
    }
    railwayStore.updateNode(selectedNode.value.id, updates)
  }
}

const updateConnectionProperty = (field: string, value: any) => {
  if (selectedConnection.value) {
    const updates = {
      properties: {
        ...selectedConnection.value.properties,
        [field]: value
      }
    }
    railwayStore.updateConnection(selectedConnection.value.id, updates)
  }
}

// Safe update functions for position
const updateNodePosition = (axis: 'x' | 'y', value: number | undefined) => {
  if (!selectedNode.value || value === undefined) return

  railwayStore.updateNode(selectedNode.value.id, {
    position: {
      ...selectedNode.value.position,
      [axis]: value
    }
  })
}

// Safe update function for maintenance status
const updateMaintenanceStatus = (status: string) => {
  if (!selectedNode.value) return

  railwayStore.updateNode(selectedNode.value.id, {
    metadata: {
      ...selectedNode.value.metadata,
      maintenanceStatus: status as 'good' | 'fair' | 'poor' | 'critical'
    }
  })
}

// Safe tag management functions
const removeTag = (tag: string) => {
  if (!selectedNode.value) return

  const newTags = selectedNode.value.metadata.tags.filter(t => t !== tag)
  railwayStore.updateNode(selectedNode.value.id, {
    metadata: { ...selectedNode.value.metadata, tags: newTags }
  })
}

const addTag = (event: Event | KeyboardEvent) => {
  const input = event.target as HTMLInputElement
  if (!selectedNode.value || !input.value.trim()) return

  const newTags = [...selectedNode.value.metadata.tags, input.value.trim()]
  railwayStore.updateNode(selectedNode.value.id, {
    metadata: { ...selectedNode.value.metadata, tags: newTags }
  })
  input.value = ''
}

// Safe connection status update
const updateConnectionStatus = (status: string) => {
  if (!selectedConnection.value) return

  railwayStore.updateConnection(selectedConnection.value.id, {
    status: status as 'active' | 'inactive' | 'maintenance' | 'blocked'
  })
}
</script>

<template>
  <div class="h-full bg-white dark:bg-gray-800 overflow-y-auto">
    <!-- Header -->
    <div class="p-4 border-b border-gray-200 dark:border-gray-700">
      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Properties</h3>
    </div>

    <!-- No Selection State -->
    <div v-if="!hasSelection" class="p-4 text-center text-gray-500 dark:text-gray-400">
      <Icon icon="mdi:information-outline" class="h-12 w-12 mx-auto mb-2 opacity-50" />
      <p class="text-sm">Select an object to view its properties</p>
    </div>

    <!-- Node Properties -->
    <div v-else-if="selectedNode" class="p-4 space-y-4">
      <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon :icon="getNodeIcon(selectedNode.type)" class="h-4 w-4" />
        <span>{{ selectedNode.type.charAt(0).toUpperCase() + selectedNode.type.slice(1) }}</span>
      </div>

      <!-- Basic Properties -->
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Name
          </label>
          <ElInput :model-value="selectedNode.properties.name" @input="updateNodeProperty('name', $event)"
            size="small" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Operational Status
          </label>
          <ElSwitch :model-value="selectedNode.properties.operational"
            @change="updateNodeProperty('operational', $event)" active-text="Operational" inactive-text="Down" />
        </div>

        <div v-if="selectedNode.properties.capacity">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Capacity
          </label>
          <ElInputNumber :model-value="selectedNode.properties.capacity"
            @change="updateNodeProperty('capacity', $event)" :min="0" size="small" class="w-full" />
        </div>

        <!-- Position -->
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              X Position
            </label>
            <ElInputNumber :model-value="selectedNode.position.x" @change="(val) => updateNodePosition('x', val)"
              size="small" class="w-full" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Y Position
            </label>
            <ElInputNumber :model-value="selectedNode.position.y" @change="(val) => updateNodePosition('y', val)"
              size="small" class="w-full" />
          </div>
        </div>

        <!-- Maintenance Status -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Maintenance Status
          </label>
          <ElSelect :model-value="selectedNode.metadata.maintenanceStatus" @change="updateMaintenanceStatus"
            size="small" class="w-full">
            <ElOption value="good" label="Good" />
            <ElOption value="fair" label="Fair" />
            <ElOption value="poor" label="Poor" />
            <ElOption value="critical" label="Critical" />
          </ElSelect>
        </div>

        <!-- Tags -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Tags
          </label>
          <div class="flex flex-wrap gap-1 mb-2">
            <ElTag v-for="tag in selectedNode.metadata.tags" :key="tag" closable size="small"
              @close="() => removeTag(tag)">
              {{ tag }}
            </ElTag>
          </div>
          <ElInput placeholder="Add tag and press Enter" size="small" @keydown.enter="addTag" />
        </div>
      </div>
    </div>

    <!-- Connection Properties -->
    <div v-else-if="selectedConnection" class="p-4 space-y-4">
      <div class="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <Icon icon="mdi:connection" class="h-4 w-4" />
        <span>{{ selectedConnection.type.charAt(0).toUpperCase() + selectedConnection.type.slice(1) }} Connection</span>
      </div>

      <!-- Connection Properties -->
      <div class="space-y-3">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Length (meters)
          </label>
          <ElInputNumber :model-value="selectedConnection.properties.length"
            @change="updateConnectionProperty('length', $event)" :min="0" size="small" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Max Speed (km/h)
          </label>
          <ElInputNumber :model-value="selectedConnection.properties.maxSpeed"
            @change="updateConnectionProperty('maxSpeed', $event)" :min="0" size="small" class="w-full" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Electrified
          </label>
          <ElSwitch :model-value="selectedConnection.properties.electrified"
            @change="updateConnectionProperty('electrified', $event)" active-text="Yes" inactive-text="No" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Signaling System
          </label>
          <ElSelect :model-value="selectedConnection.properties.signaling"
            @change="updateConnectionProperty('signaling', $event)" size="small" class="w-full">
            <ElOption value="manual" label="Manual" />
            <ElOption value="automatic" label="Automatic" />
            <ElOption value="centralized" label="Centralized" />
            <ElOption value="ptc" label="PTC" />
          </ElSelect>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Status
          </label>
          <ElSelect :model-value="selectedConnection.status" @change="updateConnectionStatus" size="small"
            class="w-full">
            <ElOption value="active" label="Active" />
            <ElOption value="inactive" label="Inactive" />
            <ElOption value="maintenance" label="Maintenance" />
            <ElOption value="blocked" label="Blocked" />
          </ElSelect>
        </div>

        <!-- Track Gauge -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Track Gauge (mm)
          </label>
          <ElInputNumber :model-value="selectedConnection.properties.gauge"
            @change="updateConnectionProperty('gauge', $event)" :min="0" size="small" class="w-full" />
        </div>

        <!-- Capacity -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Capacity (trains/hour)
          </label>
          <ElInputNumber :model-value="selectedConnection.properties.capacity"
            @change="updateConnectionProperty('capacity', $event)" :min="0" size="small" class="w-full" />
        </div>
      </div>
    </div>

    <!-- Multiple Selection -->
    <div v-else class="p-4">
      <div class="text-center text-gray-500 dark:text-gray-400">
        <Icon icon="mdi:select-multiple" class="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p class="text-sm">Multiple objects selected</p>
        <p class="text-xs mt-1">
          {{ railwayStore.selectedNodes.length }} nodes,
          {{ railwayStore.selectedConnections.length }} connections
        </p>

        <!-- Bulk Actions -->
        <div class="mt-4 space-y-2">
          <ElButton size="small" class="w-full" @click="railwayStore.duplicateSelected()">
            <Icon icon="mdi:content-copy" class="mr-1" />
            Duplicate All
          </ElButton>
          <ElButton size="small" type="danger" class="w-full" @click="railwayStore.deleteSelected()">
            <Icon icon="mdi:delete" class="mr-1" />
            Delete All
          </ElButton>
        </div>
      </div>
    </div>

    <!-- Actions Footer -->
    <div v-if="hasSelection" class="border-t border-gray-200 dark:border-gray-700 p-4">
      <div class="flex space-x-2">
        <ElButton size="small" @click="railwayStore.clearSelection()">
          Clear Selection
        </ElButton>
        <ElButton size="small" type="primary" @click="railwayStore.saveNetwork()">
          Save Changes
        </ElButton>
      </div>
    </div>
  </div>
</template>