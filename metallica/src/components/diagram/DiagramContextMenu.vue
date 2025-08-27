<script setup lang="ts">
import { Icon } from '@iconify/vue'

interface MenuItem {
  label: string
  icon?: string
  action: () => void
  disabled?: boolean
  divider?: boolean
}

interface Props {
  x: number
  y: number
  items: MenuItem[]
}

interface Emits {
  (e: 'close'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleItemClick = (item: MenuItem) => {
  if (!item.disabled && !item.divider) {
    item.action()
    emit('close')
  }
}

const handleOutsideClick = () => {
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50" @click="handleOutsideClick" @contextmenu.prevent="handleOutsideClick">
      <div
        class="absolute bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 py-2 min-w-48"
        :style="{ left: `${x}px`, top: `${y}px` }" @click.stop>
        <template v-for="(item, index) in items" :key="index">
          <!-- Divider -->
          <div v-if="item.divider" class="h-px bg-gray-200 dark:bg-gray-600 mx-2 my-1" />

          <!-- Menu Item -->
          <button v-else :class="[
            'w-full flex items-center px-3 py-2 text-sm text-left transition-colors',
            item.disabled
              ? 'text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          ]" :disabled="item.disabled" @click="handleItemClick(item)">
            <Icon v-if="item.icon" :icon="item.icon" class="h-4 w-4 mr-3" />
            <span>{{ item.label }}</span>
          </button>
        </template>
      </div>
    </div>
  </Teleport>
</template>