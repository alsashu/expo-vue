import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRailwayStore } from '@stores/railway'
import { useUIStore } from '@stores/ui'
import type { Command, CommandCategory } from '@/types/railway'

export function useCommandPalette() {
  const router = useRouter()
  const railwayStore = useRailwayStore()
  const uiStore = useUIStore()

  const isCommandPaletteOpen = ref(false)

  // Command categories
  const categories: CommandCategory[] = [
    { id: 'navigation', title: 'Navigation', icon: 'mdi:compass', color: 'blue' },
    { id: 'creation', title: 'Creation', icon: 'mdi:plus-circle', color: 'green' },
    { id: 'edit', title: 'Edit', icon: 'mdi:pencil', color: 'orange' },
    { id: 'view', title: 'View', icon: 'mdi:eye', color: 'purple' },
    { id: 'file', title: 'File', icon: 'mdi:file', color: 'gray' },
    { id: 'help', title: 'Help', icon: 'mdi:help-circle', color: 'indigo' }
  ]

  // Base commands
  const baseCommands = computed(() => [
    // Navigation Commands
    {
      id: 'nav-home',
      title: 'Go to Dashboard',
      description: 'Navigate to the main dashboard',
      icon: 'mdi:home',
      category: 'navigation',
      shortcut: 'Ctrl+1',
      action: () => router.push('/')
    },
    {
      id: 'nav-grid',
      title: 'Go to Data Grid',
      description: 'View and manage railway data in grid format',
      icon: 'mdi:table',
      category: 'navigation',
      shortcut: 'Ctrl+2',
      action: () => router.push('/grid')
    },
    {
      id: 'nav-diagram',
      title: 'Go to Network Diagram',
      description: 'View interactive railway network diagram',
      icon: 'mdi:graph',
      category: 'navigation',
      shortcut: 'Ctrl+3',
      action: () => router.push('/diagram')
    },
    {
      id: 'nav-analytics',
      title: 'Go to Analytics',
      description: 'View network performance analytics',
      icon: 'mdi:chart-line',
      category: 'navigation',
      shortcut: 'Ctrl+4',
      action: () => router.push('/analytics')
    },

    // Creation Commands
    {
      id: 'create-network',
      title: 'Create New Network',
      description: 'Start designing a new railway network',
      icon: 'mdi:plus-network',
      category: 'creation',
      shortcut: 'Ctrl+N',
      action: async () => {
        const result = await (window as any).ElMessageBox.prompt(
          'Enter network name:',
          'New Network',
          {
            confirmButtonText: 'Create',
            cancelButtonText: 'Cancel'
          }
        )
        
        if (result.action === 'confirm') {
          const newNetwork = {
            name: result.value,
            description: 'New railway network',
            nodes: {},
            connections: {},
            signals: {},
            metadata: {
              region: 'Unknown',
              operator: 'Railway Designer',
              totalLength: 0,
              nodeCount: 0,
              connectionCount: 0,
              offline: true
            },
            version: 1
          }
          
          railwayStore.setCurrentNetwork(newNetwork as any)
          router.push('/diagram')
        }
      }
    },
    {
      id: 'create-station',
      title: 'Add Station',
      description: 'Add a new station to the network',
      icon: 'mdi:train',
      category: 'creation',
      shortcut: 'Shift+S',
      disabled: computed(() => !railwayStore.currentNetwork),
      action: () => {
        // This would typically open a modal or switch to node creation mode
        uiStore.showInfo('Add Station', 'Switch to diagram view to add stations')
        router.push('/diagram')
      }
    },
    {
      id: 'create-junction',
      title: 'Add Junction',
      description: 'Add a new junction to the network',
      icon: 'mdi:call-split',
      category: 'creation',
      shortcut: 'Shift+J',
      disabled: computed(() => !railwayStore.currentNetwork),
      action: () => {
        uiStore.showInfo('Add Junction', 'Switch to diagram view to add junctions')
        router.push('/diagram')
      }
    },
    {
      id: 'create-signal',
      title: 'Add Signal',
      description: 'Add a new signal to the network',
      icon: 'mdi:traffic-light',
      category: 'creation',
      shortcut: 'Shift+G',
      disabled: computed(() => !railwayStore.currentNetwork),
      action: () => {
        uiStore.showInfo('Add Signal', 'Switch to diagram view to add signals')
        router.push('/diagram')
      }
    },

    // Edit Commands
    {
      id: 'edit-undo',
      title: 'Undo',
      description: 'Undo the last action',
      icon: 'mdi:undo',
      category: 'edit',
      shortcut: 'Ctrl+Z',
      disabled: computed(() => !railwayStore.canUndo()),
      action: () => railwayStore.undo()
    },
    {
      id: 'edit-redo',
      title: 'Redo',
      description: 'Redo the last undone action',
      icon: 'mdi:redo',
      category: 'edit',
      shortcut: 'Ctrl+Y',
      disabled: computed(() => !railwayStore.canRedo()),
      action: () => railwayStore.redo()
    },
    {
      id: 'edit-select-all',
      title: 'Select All',
      description: 'Select all items in current view',
      icon: 'mdi:select-all',
      category: 'edit',
      shortcut: 'Ctrl+A',
      disabled: computed(() => !railwayStore.currentNetwork),
      action: () => {
        const allNodeIds = Object.keys(railwayStore.currentNetwork?.nodes || {})
        railwayStore.selectNodes(allNodeIds)
        uiStore.showSuccess('Select All', `Selected ${allNodeIds.length} nodes`)
      }
    },
    {
      id: 'edit-clear-selection',
      title: 'Clear Selection',
      description: 'Clear current selection',
      icon: 'mdi:selection-off',
      category: 'edit',
      shortcut: 'Escape',
      disabled: computed(() => !railwayStore.hasSelection),
      action: () => {
        railwayStore.clearSelection()
        uiStore.showSuccess('Selection Cleared', 'All items deselected')
      }
    },
    {
      id: 'edit-duplicate',
      title: 'Duplicate Selected',
      description: 'Duplicate the selected items',
      icon: 'mdi:content-duplicate',
      category: 'edit',
      shortcut: 'Ctrl+D',
      disabled: computed(() => !railwayStore.hasSelection),
      action: () => {
        railwayStore.duplicateSelected()
        uiStore.showSuccess('Duplicated', 'Selected items duplicated')
      }
    },
    {
      id: 'edit-delete',
      title: 'Delete Selected',
      description: 'Delete the selected items',
      icon: 'mdi:delete',
      category: 'edit',
      shortcut: 'Delete',
      disabled: computed(() => !railwayStore.hasSelection),
      action: async () => {
        const confirmed = await uiStore.confirm(
          'Delete Items',
          'Are you sure you want to delete the selected items?',
          { type: 'danger' }
        )
        
        if (confirmed) {
          railwayStore.deleteSelected()
          uiStore.showSuccess('Deleted', 'Selected items deleted')
        }
      }
    },

    // View Commands
    {
      id: 'view-zoom-fit',
      title: 'Zoom to Fit',
      description: 'Zoom to fit all content in view',
      icon: 'mdi:fit-to-page-outline',
      category: 'view',
      shortcut: 'Ctrl+0',
      action: () => {
        // This would call the diagram zoom method
        uiStore.showInfo('Zoom to Fit', 'Available in diagram view')
      }
    },
    {
      id: 'view-zoom-in',
      title: 'Zoom In',
      description: 'Zoom in to see more detail',
      icon: 'mdi:magnify-plus',
      category: 'view',
      shortcut: 'Ctrl++',
      action: () => {
        uiStore.showInfo('Zoom In', 'Available in diagram view')
      }
    },
    {
      id: 'view-zoom-out',
      title: 'Zoom Out',
      description: 'Zoom out to see more of the network',
      icon: 'mdi:magnify-minus',
      category: 'view',
      shortcut: 'Ctrl+-',
      action: () => {
        uiStore.showInfo('Zoom Out', 'Available in diagram view')
      }
    },
    {
      id: 'view-toggle-grid',
      title: 'Toggle Grid',
      description: 'Show or hide the background grid',
      icon: 'mdi:grid',
      category: 'view',
      shortcut: 'Ctrl+G',
      action: () => {
        const newValue = !uiStore.diagramSettings.showGrid
        uiStore.updateDiagramSettings({ showGrid: newValue })
        uiStore.showSuccess(
          'Grid Toggled',
          `Grid ${newValue ? 'enabled' : 'disabled'}`
        )
      }
    },
    {
      id: 'view-toggle-theme',
      title: 'Toggle Dark Mode',
      description: 'Switch between light and dark themes',
      icon: 'mdi:theme-light-dark',
      category: 'view',
      shortcut: 'Ctrl+Shift+T',
      action: () => {
        uiStore.toggleDarkMode()
        uiStore.showSuccess(
          'Theme Changed',
          `Switched to ${uiStore.isDarkMode ? 'dark' : 'light'} mode`
        )
      }
    },

    // File Commands
    {
      id: 'file-save',
      title: 'Save Network',
      description: 'Save the current network',
      icon: 'mdi:content-save',
      category: 'file',
      shortcut: 'Ctrl+S',
      disabled: computed(() => !railwayStore.isDirty || !railwayStore.currentNetwork),
      action: async () => {
        try {
          await railwayStore.saveNetwork()
          uiStore.showSuccess('Saved', 'Network saved successfully')
        } catch (error) {
          uiStore.showError('Save Failed', 'Failed to save network')
        }
      }
    },
    {
      id: 'file-export-json',
      title: 'Export as JSON',
      description: 'Export network data as JSON file',
      icon: 'mdi:code-braces',
      category: 'file',
      disabled: computed(() => !railwayStore.currentNetwork),
      action: () => {
        try {
          const data = railwayStore.exportNetwork()
          const blob = new Blob([data], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${railwayStore.currentNetwork?.name || 'network'}.json`
          a.click()
          URL.revokeObjectURL(url)
          uiStore.showSuccess('Exported', 'Network exported as JSON')
        } catch (error) {
          uiStore.showError('Export Failed', 'Failed to export network')
        }
      }
    },
    {
      id: 'file-import',
      title: 'Import Network',
      description: 'Import network from file',
      icon: 'mdi:import',
      category: 'file',
      action: () => {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = '.json'
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0]
          if (!file) return

          try {
            const text = await file.text()
            await railwayStore.importNetwork(text)
            uiStore.showSuccess('Imported', 'Network imported successfully')
            router.push('/diagram')
          } catch (error) {
            uiStore.showError('Import Failed', 'Failed to import network')
          }
        }
        input.click()
      }
    },

    // Help Commands
    {
      id: 'help-shortcuts',
      title: 'Show Keyboard Shortcuts',
      description: 'View all available keyboard shortcuts',
      icon: 'mdi:keyboard',
      category: 'help',
      shortcut: 'F1',
      action: () => {
        uiStore.openModal({
          component: 'KeyboardShortcutsModal',
          title: 'Keyboard Shortcuts'
        })
      }
    },
    {
      id: 'help-about',
      title: 'About Railway Designer',
      description: 'Learn about the application',
      icon: 'mdi:information',
      category: 'help',
      action: () => router.push('/about')
    },
    {
      id: 'help-docs',
      title: 'Open Documentation',
      description: 'View the user documentation',
      icon: 'mdi:book-open',
      category: 'help',
      action: () => {
        window.open('/docs', '_blank')
      }
    }
  ])

  // Dynamic commands based on current state
  const dynamicCommands = computed<Command[]>(() => {
    const commands: Command[] = []

    // Network-specific commands
    if (railwayStore.currentNetwork) {
      commands.push({
        id: 'network-info',
        title: `Current Network: ${railwayStore.currentNetwork.name}`,
        description: `${railwayStore.networkStats?.totalNodes || 0} nodes, ${railwayStore.networkStats?.totalConnections || 0} connections`,
        icon: 'mdi:information',
        category: 'view',
        action: () => {
          uiStore.openModal({
            component: 'NetworkInfoModal',
            title: 'Network Information',
            props: { network: railwayStore.currentNetwork }
          })
        }
      })
    }

    // Selection-based commands
    if (railwayStore.hasSelection) {
      const selectedCount = railwayStore.selectedNodes.length + railwayStore.selectedConnections.length
      
      commands.push({
        id: 'selection-info',
        title: `${selectedCount} Items Selected`,
        description: `${railwayStore.selectedNodes.length} nodes, ${railwayStore.selectedConnections.length} connections`,
        icon: 'mdi:selection',
        category: 'view',
        action: () => {
          uiStore.showInfo(
            'Selection Info',
            `Selected: ${railwayStore.selectedNodes.length} nodes, ${railwayStore.selectedConnections.length} connections`
          )
        }
      })
    }

    return commands
  })

  // All available commands
  const commands = computed(() => [
    ...baseCommands.value,
    ...dynamicCommands.value
  ])

  // Methods
  const registerCommand = (command: Command) => {
    // This would add to a custom commands registry
    console.log('Registering command:', command)
  }

  const executeCommand = (commandId: string) => {
    const command = commands.value.find(cmd => cmd.id === commandId)
    if (command && !command.disabled) {
      try {
        command.action()
      } catch (error) {
        console.error('Command execution failed:', error)
        uiStore.showError('Command Failed', 'Failed to execute command')
      }
    }
  }

  const openPalette = () => {
    isCommandPaletteOpen.value = true
  }

  const closePalette = () => {
    isCommandPaletteOpen.value = false
  }

  return {
    isCommandPaletteOpen,
    commands,
    categories,
    registerCommand,
    executeCommand,
    openPalette,
    closePalette
  }
}