<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import { Icon } from '@iconify/vue'
import Fuse from 'fuse.js'
import type { Command } from '@/types/railway'

interface Props {
  visible: boolean
  commands: Command[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// Refs
const searchInput = ref<HTMLInputElement>()
const commandList = ref<HTMLElement>()
const searchQuery = ref('')
const selectedIndex = ref(0)

// Fuse.js search configuration
const fuseOptions = {
  keys: [
    { name: 'title', weight: 0.7 },
    { name: 'description', weight: 0.3 },
    { name: 'category', weight: 0.2 }
  ],
  threshold: 0.3,
  includeScore: true,
  minMatchCharLength: 1
}

const fuse = new Fuse(props.commands, fuseOptions)

// Computed properties
const filteredCommands = computed(() => {
  if (!searchQuery.value.trim()) {
    return props.commands
      .filter(cmd => !cmd.hidden)
      .slice(0, 10) // Limit initial results
  }

  const results = fuse.search(searchQuery.value.trim())
  return results
    .map(result => result.item)
    .filter(cmd => !cmd.hidden && !cmd.disabled)
    .slice(0, 20) // Limit search results
})

const groupedCommands = computed(() => {
  const groups: Record<string, Command[]> = {}

  filteredCommands.value.forEach(command => {
    const category = command.category || 'Other'
    const bucket = groups[category] ?? (groups[category] = [])
    bucket.push(command)
  })

  return groups
})

const totalCommands = computed(() => filteredCommands.value.length)

const selectedCommand = computed(() => {
  return filteredCommands.value[selectedIndex.value]
})

// Methods
const close = () => {
  emit('update:visible', false)
  searchQuery.value = ''
  selectedIndex.value = 0
}

const executeCommand = (command?: Command) => {
  const cmd = command || selectedCommand.value
  if (cmd && !cmd.disabled) {
    try {
      cmd.action()
      close()
    } catch (error) {
      console.error('Command execution failed:', error)
    }
  }
}

const navigateUp = () => {
  selectedIndex.value = Math.max(0, selectedIndex.value - 1)
  scrollToSelected()
}

const navigateDown = () => {
  selectedIndex.value = Math.min(totalCommands.value - 1, selectedIndex.value + 1)
  scrollToSelected()
}

const scrollToSelected = async () => {
  await nextTick()

  const listElement = commandList.value
  const selectedElement = listElement?.querySelector(`[data-index="${selectedIndex.value}"]`)

  if (listElement && selectedElement) {
    selectedElement.scrollIntoView({
      block: 'nearest',
      behavior: 'smooth'
    })
  }
}

const handleKeyDown = (event: KeyboardEvent) => {
  switch (event.key) {
    case 'ArrowUp':
      event.preventDefault()
      navigateUp()
      break
    case 'ArrowDown':
      event.preventDefault()
      navigateDown()
      break
    case 'Enter':
      event.preventDefault()
      executeCommand()
      break
    case 'Escape':
      event.preventDefault()
      close()
      break
    case 'Tab':
      event.preventDefault()
      if (event.shiftKey) {
        navigateUp()
      } else {
        navigateDown()
      }
      break
  }
}

const formatShortcut = (shortcut: string) => {
  return shortcut
    .replace('Ctrl', '⌃')
    .replace('Alt', '⌥')
    .replace('Shift', '⇧')
    .replace('Meta', '⌘')
    .replace('+', ' ')
}

const getCategoryIcon = (category: string) => {
  const icons = {
    'Creation': 'mdi:plus-circle',
    'Navigation': 'mdi:compass',
    'Edit': 'mdi:pencil',
    'View': 'mdi:eye',
    'File': 'mdi:file',
    'Help': 'mdi:help-circle',
    'Other': 'mdi:dots-horizontal'
  }
  return icons[category as keyof typeof icons] || icons.Other
}

// Watchers
watch(() => props.visible, async (visible) => {
  if (visible) {
    await nextTick()
    searchInput.value?.focus()
    selectedIndex.value = 0
  }
})

watch(searchQuery, () => {
  selectedIndex.value = 0
})

// Lifecycle
onMounted(() => {
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault()
      if (!props.visible) {
        emit('update:visible', true)
      }
    }
  })
})
</script>

<template>
  <ElDialog :model-value="visible" :width="600" :show-close="false" :close-on-click-modal="true"
    :close-on-press-escape="true" class="command-palette-dialog" @update:model-value="emit('update:visible', $event)">
    <template #header>
      <div />
    </template>

    <div class="command-palette">
      <!-- Search Input -->
      <div class="search-container">
        <div class="flex items-center px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Icon icon="mdi:magnify" class="h-5 w-5 text-gray-400 dark:text-gray-500 mr-3" />
          <input ref="searchInput" v-model="searchQuery" type="text" placeholder="Type a command or search..."
            class="flex-1 bg-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none text-lg"
            @keydown="handleKeyDown" />

          <!-- Search Stats -->
          <div class="text-sm text-gray-500 dark:text-gray-400 ml-3">
            {{ totalCommands }} commands
          </div>
        </div>
      </div>

      <!-- Commands List -->
      <div ref="commandList" class="max-h-96 overflow-y-auto">
        <template v-if="totalCommands === 0">
          <div class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
            <Icon icon="mdi:magnify" class="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No commands found</p>
            <p class="text-sm mt-1">Try a different search term</p>
          </div>
        </template>

        <template v-else>
          <div v-for="(commands, category) in groupedCommands" :key="category" class="command-group">
            <!-- Category Header -->
            <div
              class="px-4 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 flex items-center">
              <Icon :icon="getCategoryIcon(category)" class="h-4 w-4 mr-2" />
              {{ category }}
            </div>

            <!-- Commands in Category -->
            <div v-for="(command, commandIndex) in commands" :key="command.id"
              :data-index="filteredCommands.indexOf(command)" class="command-item" :class="{
                'bg-blue-50 dark:bg-blue-900/30': selectedIndex === filteredCommands.indexOf(command),
                'cursor-not-allowed opacity-50': command.disabled
              }" @click="executeCommand(command)" @mouseenter="selectedIndex = filteredCommands.indexOf(command)">
              <div class="flex items-center px-4 py-3">
                <!-- Command Icon -->
                <div class="flex-shrink-0 mr-3">
                  <Icon :icon="command.icon || 'mdi:circle-small'" class="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>

                <!-- Command Info -->
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 dark:text-white">
                    {{ command.title }}
                  </div>
                  <div v-if="command.description" class="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                    {{ command.description }}
                  </div>
                </div>

                <!-- Keyboard Shortcut -->
                <div v-if="command.shortcut" class="flex-shrink-0 ml-4">
                  <kbd
                    class="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-700 text-xs font-mono text-gray-600 dark:text-gray-300 rounded">
                    {{ formatShortcut(command.shortcut) }}
                  </kbd>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>

      <!-- Footer -->
      <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-800/50">
        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <div class="flex items-center space-x-4">
            <span class="flex items-center">
              <kbd
                class="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded mr-1">↑↓</kbd>
              Navigate
            </span>
            <span class="flex items-center">
              <kbd
                class="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded mr-1">↵</kbd>
              Execute
            </span>
            <span class="flex items-center">
              <kbd
                class="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded mr-1">esc</kbd>
              Close
            </span>
          </div>

          <div class="flex items-center">
            <span>Press</span>
            <kbd
              class="inline-flex items-center px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded mx-1">⌘K</kbd>
            <span>to toggle</span>
          </div>
        </div>
      </div>
    </div>
  </ElDialog>
</template>

<style scoped>
:deep(.command-palette-dialog) {
  .el-dialog {
    margin-top: 8vh !important;
    border-radius: 12px;
    overflow: hidden;
  }

  .el-dialog__header {
    padding: 0;
    margin: 0;
  }

  .el-dialog__body {
    padding: 0;
  }
}

.command-palette {
  @apply bg-white dark:bg-gray-900;
}

.command-item {
  @apply transition-colors duration-150 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800;
}

.command-item:active {
  @apply bg-blue-100 dark:bg-blue-900/50;
}

/* Custom scrollbar */
.max-h-96::-webkit-scrollbar {
  width: 6px;
}

.max-h-96::-webkit-scrollbar-track {
  background: theme('colors.gray.100');
}

.max-h-96::-webkit-scrollbar-thumb {
  background: theme('colors.gray.400');
  border-radius: 3px;
}

.max-h-96::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.500');
}

.dark .max-h-96::-webkit-scrollbar-track {
  background: theme('colors.gray.800');
}

.dark .max-h-96::-webkit-scrollbar-thumb {
  background: theme('colors.gray.600');
}

.dark .max-h-96::-webkit-scrollbar-thumb:hover {
  background: theme('colors.gray.500');
}
</style>