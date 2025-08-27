<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useDiagram } from '@composables/useDiagram'
import { useRailwayStore } from '@stores/railway'
import { useUIStore } from '@stores/ui'
import { Icon } from '@iconify/vue'
import DiagramToolbar from '@components/diagram/DiagramToolbar.vue'
import DiagramPalette from '@components/diagram/DiagramPalette.vue'
import DiagramMiniMap from '@components/diagram/DiagramMiniMap.vue'
import DiagramProperties from '@components/diagram/DiagramProperties.vue'
import DiagramContextMenu from '@components/diagram/DiagramContextMenu.vue'

const router = useRouter()
const railwayStore = useRailwayStore()
const uiStore = useUIStore()

// Refs
const diagramContainer = ref<HTMLDivElement>()
const minimapContainer = ref<HTMLDivElement>()

// Diagram composable
const {
  diagram,
  initDiagram,
  addNode,
  addConnection,
  updateNode,
  deleteNode,
  zoomToFit,
  zoomIn,
  zoomOut,
  resetZoom,
  centerDiagram,
  enablePanning,
  enableDrawing,
  saveLayout,
  loadLayout,
  exportImage,
  exportSVG
} = useDiagram({
  containerId: 'diagram-container',
  enableMiniMap: uiStore.diagramSettings.showMiniMap,
  allowDragDrop: true,
  showGrid: uiStore.diagramSettings.showGrid,
  snapToGrid: uiStore.diagramSettings.snapToGrid,
  gridSize: uiStore.diagramSettings.gridSize,
  animationEnabled: uiStore.diagramSettings.animationEnabled
})

// UI State
const selectedTool = ref<'select' | 'pan' | 'node' | 'connection'>('select')
const selectedNodeType = ref<'station' | 'junction' | 'signal' | 'switch'>('station')
const showPalette = ref(true)
const showMinimap = ref(uiStore.diagramSettings.showMiniMap)
const showProperties = ref(true)
const showGrid = ref(uiStore.diagramSettings.showGrid)
const contextMenu = ref<{ x: number, y: number, items: any[] } | null>(null)

// Computed properties
const hasCurrentNetwork = computed(() => !!railwayStore.currentNetwork)
const isDrawingMode = computed(() => selectedTool.value === 'node' || selectedTool.value === 'connection')
const hasSelection = computed(() => railwayStore.hasSelection)

const diagramStats = computed(() => {
  if (!railwayStore.currentNetwork) return null

  return {
    nodes: Object.keys(railwayStore.currentNetwork.nodes).length,
    connections: Object.keys(railwayStore.currentNetwork.connections).length,
    selectedNodes: railwayStore.selectedNodes.length,
    selectedConnections: railwayStore.selectedConnections.length
  }
})

// Methods
const handleToolChange = (tool: typeof selectedTool.value) => {
  selectedTool.value = tool

  switch (tool) {
    case 'select':
      enablePanning(false)
      enableDrawing(false)
      break
    case 'pan':
      enablePanning(true)
      enableDrawing(false)
      break
    case 'node':
      enablePanning(false)
      enableDrawing(true)
      break
    case 'connection':
      enablePanning(false)
      enableDrawing('connection')
      break
  }
}

const handleNodeTypeChange = (type: typeof selectedNodeType.value) => {
  selectedNodeType.value = type
}

const handleDiagramClick = (event: MouseEvent) => {
  if (selectedTool.value === 'node') {
    const rect = diagramContainer.value?.getBoundingClientRect()
    if (!rect) return

    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Convert screen coordinates to diagram coordinates
    const diagramPoint = diagram.value?.transformViewToDoc({ x, y }) || { x, y }
    if (!diagramPoint) return

    // Add node at clicked position
    const nodeId = railwayStore.addNode({
      type: selectedNodeType.value,
      position: { x: diagramPoint.x, y: diagramPoint.y },
      properties: {
        name: `${selectedNodeType.value.charAt(0).toUpperCase() + selectedNodeType.value.slice(1)} ${Date.now()}`,
        operational: true,
        capacity: selectedNodeType.value === 'station' ? 1000 : undefined,
        attributes: {}
      },
      connections: [],
      metadata: {
        category: selectedNodeType.value === 'station' ? 'passenger' : 'infrastructure',
        priority: 1,
        tags: [selectedNodeType.value],
        maintenanceStatus: 'good' as const
      }
    })

    if (nodeId) {
      // Add node to diagram
      addNode({
        key: nodeId,
        category: selectedNodeType.value,
        text: railwayStore.getNodeById(nodeId)?.properties.name || '',
        loc: `${diagramPoint.x} ${diagramPoint.y}`,
        color: getNodeColor(selectedNodeType.value)
      })

      uiStore.showSuccess('Node Added', 'New node created successfully')
    }
  }
}

const handleDiagramContextMenu = (event: MouseEvent) => {
  event.preventDefault()

  const items = [
    {
      label: 'Add Station',
      icon: 'mdi:train',
      action: () => handleAddNode('station', event)
    },
    {
      label: 'Add Junction',
      icon: 'mdi:call-split',
      action: () => handleAddNode('junction', event)
    },
    {
      label: 'Add Signal',
      icon: 'mdi:traffic-light',
      action: () => handleAddNode('signal', event)
    },
    { divider: true },
    {
      label: 'Paste',
      icon: 'mdi:content-paste',
      action: () => pasteCopiedNodes(event),
      disabled: !hasCopiedNodes()
    },
    { divider: true },
    {
      label: 'Zoom to Fit',
      icon: 'mdi:fit-to-page',
      action: zoomToFit
    },
    {
      label: 'Center Diagram',
      icon: 'mdi:crosshairs',
      action: centerDiagram
    }
  ]

  contextMenu.value = {
    x: event.clientX,
    y: event.clientY,
    items
  }
}

const handleAddNode = (type: string, event: MouseEvent) => {
  selectedNodeType.value = type as any
  selectedTool.value = 'node'
  handleDiagramClick(event)
  contextMenu.value = null
}

const getNodeColor = (type: string): string => {
  const colors = {
    station: '#3b82f6',
    junction: '#8b5cf6',
    signal: '#10b981',
    switch: '#f59e0b',
    crossing: '#ef4444',
    bridge: '#6b7280',
    tunnel: '#374151'
  }
  return colors[type as keyof typeof colors] || '#6b7280'
}

const hasCopiedNodes = (): boolean => {
  // Check if there are nodes in clipboard
  return false // Implement clipboard functionality
}

const pasteCopiedNodes = (event: MouseEvent) => {
  // Implement paste functionality
  uiStore.showInfo('Paste', 'Paste functionality not implemented')
}

const handleSave = async () => {
  try {
    await railwayStore.saveNetwork()
    saveLayout()
    uiStore.showSuccess('Saved', 'Network saved successfully')
  } catch (error) {
    uiStore.showError('Save Failed', 'Failed to save network')
  }
}

const handleExport = async (format: 'png' | 'svg' | 'pdf') => {
  try {
    switch (format) {
      case 'png':
        await exportImage('png')
        break
      case 'svg':
        await exportSVG()
        break
      case 'pdf':
        // Implement PDF export
        uiStore.showInfo('Export', 'PDF export not implemented')
        break
    }
    uiStore.showSuccess('Export', `Diagram exported as ${format.toUpperCase()}`)
  } catch (error) {
    uiStore.showError('Export Failed', `Failed to export as ${format.toUpperCase()}`)
  }
}

const handleUndo = () => {
  railwayStore.undo()
}

const handleRedo = () => {
  railwayStore.redo()
}

const handleDelete = () => {
  if (railwayStore.hasSelection) {
    railwayStore.deleteSelected()
    uiStore.showSuccess('Deleted', 'Selected items deleted')
  }
}

const handleDuplicate = () => {
  if (railwayStore.hasSelection) {
    railwayStore.duplicateSelected()
    uiStore.showSuccess('Duplicated', 'Selected items duplicated')
  }
}

const toggleGrid = () => {
  showGrid.value = !showGrid.value
  uiStore.updateDiagramSettings({ showGrid: showGrid.value })
  // Update diagram grid visibility
  if (diagram.value) {
    diagram.value.grid.visible = showGrid.value
  }
}

const toggleMinimap = () => {
  showMinimap.value = !showMinimap.value
  uiStore.updateDiagramSettings({ showMiniMap: showMinimap.value })
}

const togglePalette = () => {
  showPalette.value = !showPalette.value
}

const toggleProperties = () => {
  showProperties.value = !showProperties.value
}

const handleKeyDown = (event: KeyboardEvent) => {
  // Handle keyboard shortcuts
  if (event.ctrlKey || event.metaKey) {
    switch (event.key) {
      case 's':
        event.preventDefault()
        handleSave()
        break
      case 'z':
        event.preventDefault()
        if (event.shiftKey) {
          handleRedo()
        } else {
          handleUndo()
        }
        break
      case 'y':
        event.preventDefault()
        handleRedo()
        break
      case 'd':
        event.preventDefault()
        handleDuplicate()
        break
      case 'a':
        event.preventDefault()
        // Select all
        break
    }
  } else {
    switch (event.key) {
      case 'Delete':
      case 'Backspace':
        event.preventDefault()
        handleDelete()
        break
      case 'Escape':
        selectedTool.value = 'select'
        handleToolChange('select')
        contextMenu.value = null
        break
      case '1':
        selectedTool.value = 'select'
        handleToolChange('select')
        break
      case '2':
        selectedTool.value = 'pan'
        handleToolChange('pan')
        break
      case '3':
        selectedTool.value = 'node'
        handleToolChange('node')
        break
      case '4':
        selectedTool.value = 'connection'
        handleToolChange('connection')
        break
    }
  }
}

// Watchers
watch(() => railwayStore.currentNetwork, async (network) => {
  if (network && diagramContainer.value) {
    await nextTick()
    await initDiagram()
    loadLayout()
  }
}, { immediate: true })

watch(() => uiStore.diagramSettings, (settings) => {
  if (diagram.value) {
    diagram.value.grid.visible = settings.showGrid
    diagram.value.toolManager.draggingTool.isGridSnapEnabled = settings.snapToGrid
  }
}, { deep: true })

// Lifecycle
onMounted(async () => {
  if (!railwayStore.currentNetwork && railwayStore.networks.length > 0) {
    const first = railwayStore.networks[0]
    if (first) {
      await railwayStore.loadNetwork(first.id)
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  document.addEventListener('click', () => {
    contextMenu.value = null
  })
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleKeyDown)
  saveLayout()
})
</script>

<template>
  <div class="flex h-full bg-gray-50 dark:bg-gray-900">
    <!-- Left Sidebar - Palette -->
    <Transition name="slide-left">
      <div v-if="showPalette"
        class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <DiagramPalette :selected-tool="selectedTool" :selected-node-type="selectedNodeType"
          @tool-change="handleToolChange" @node-type-change="handleNodeTypeChange" />
      </div>
    </Transition>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Header Toolbar -->
      <DiagramToolbar :selected-tool="selectedTool" :has-selection="hasSelection" :can-undo="railwayStore.canUndo()"
        :can-redo="railwayStore.canRedo()" :show-grid="showGrid" :show-minimap="showMinimap" :show-palette="showPalette"
        :show-properties="showProperties" :stats="diagramStats" @tool-change="handleToolChange" @save="handleSave"
        @export="handleExport" @undo="handleUndo" @redo="handleRedo" @delete="handleDelete" @duplicate="handleDuplicate"
        @zoom-in="zoomIn" @zoom-out="zoomOut" @zoom-fit="zoomToFit" @zoom-reset="resetZoom" @toggle-grid="toggleGrid"
        @toggle-minimap="toggleMinimap" @toggle-palette="togglePalette" @toggle-properties="toggleProperties" />

      <!-- Diagram Area -->
      <div class="flex-1 relative min-h-0">
        <!-- No Network State -->
        <div v-if="!hasCurrentNetwork" class="flex items-center justify-center h-full">
          <div class="text-center">
            <Icon icon="mdi:graph-outline" class="mx-auto h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No Network Selected
            </h3>
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              Please select a railway network to view the diagram
            </p>
            <div class="space-x-2">
              <ElButton type="primary" @click="router.push('/')">
                Select Network
              </ElButton>
              <ElButton @click="router.push('/grid')">
                View Data Grid
              </ElButton>
            </div>
          </div>
        </div>

        <!-- Diagram Container -->
        <div v-else ref="diagramContainer" id="diagram-container" class="w-full h-full cursor-crosshair" :class="{
          'cursor-grab': selectedTool === 'pan',
          'cursor-pointer': selectedTool === 'select',
          'cursor-crosshair': isDrawingMode
        }" @click="handleDiagramClick" @contextmenu="handleDiagramContextMenu" />

        <!-- Minimap -->
        <Transition name="fade">
          <div v-if="showMinimap && hasCurrentNetwork"
            class="absolute top-4 right-4 w-48 h-32 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <DiagramMiniMap ref="minimapContainer" :diagram="diagram" />
          </div>
        </Transition>

        <!-- Context Menu -->
        <DiagramContextMenu v-if="contextMenu" :x="contextMenu.x" :y="contextMenu.y" :items="contextMenu.items"
          @close="contextMenu = null" />

        <!-- Tool Indicator -->
        <div
          class="absolute bottom-4 left-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-3 py-2">
          <div class="flex items-center space-x-2 text-sm">
            <Icon :icon="{
              select: 'mdi:cursor-default',
              pan: 'mdi:hand',
              node: 'mdi:plus-circle',
              connection: 'mdi:connection'
            }[selectedTool]" class="w-4 h-4" />
            <span class="text-gray-700 dark:text-gray-300 capitalize">
              {{ selectedTool === 'node' ? `Add ${selectedNodeType}` : selectedTool }}
            </span>
          </div>
        </div>

        <!-- Keyboard Shortcuts Help -->
        <div class="absolute bottom-4 right-4">
          <ElTooltip content="Press 'H' for keyboard shortcuts" placement="top">
            <ElButton size="small" circle class="bg-white dark:bg-gray-800"
              @click="uiStore.openModal({ component: 'KeyboardShortcutsModal' })">
              <Icon icon="mdi:keyboard" />
            </ElButton>
          </ElTooltip>
        </div>
      </div>
    </div>

    <!-- Right Sidebar - Properties -->
    <Transition name="slide-right">
      <div v-if="showProperties && hasCurrentNetwork"
        class="w-80 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex-shrink-0">
        <DiagramProperties />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
/* Transition animations */
.slide-left-enter-active,
.slide-left-leave-active {
  transition: transform 0.3s ease;
}

.slide-left-enter-from,
.slide-left-leave-to {
  transform: translateX(-100%);
}

.slide-right-enter-active,
.slide-right-leave-active {
  transition: transform 0.3s ease;
}

.slide-right-enter-from,
.slide-right-leave-to {
  transform: translateX(100%);
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* GoJS diagram styling */
:deep(#diagram-container canvas) {
  outline: none;
}

/* Custom scrollbars */
:deep(.diagram-container) {
  scrollbar-width: thin;
  scrollbar-color: theme('colors.gray.400') theme('colors.gray.100');
}

:deep(.diagram-container::-webkit-scrollbar) {
  width: 8px;
  height: 8px;
}

:deep(.diagram-container::-webkit-scrollbar-track) {
  background: theme('colors.gray.100');
}

:deep(.diagram-container::-webkit-scrollbar-thumb) {
  background: theme('colors.gray.400');
  border-radius: 4px;
}

:deep(.diagram-container::-webkit-scrollbar-thumb:hover) {
  background: theme('colors.gray.500');
}
</style>