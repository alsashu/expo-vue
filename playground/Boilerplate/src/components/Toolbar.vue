<template>
  <div class="toolbar">
    <button class="btn" @click="$emit('add')">
      ➕ Add Item
    </button>

    <button class="btn btn-danger" @click="$emit('delete')" :disabled="!hasSelection">
      🗑️ Delete Selected
    </button>

    <div class="toolbar-spacer"></div>

    <span v-if="hasSelection" class="selection-info">
      {{ hasSelection ? 'Items selected' : 'No items selected' }}
    </span>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hasSelection: boolean
}>()

defineEmits<{
  add: []
  delete: []
}>()
</script>

<style scoped>
.toolbar-spacer {
  flex: 1;
}

.selection-info {
  color: #666;
  font-size: 0.9rem;
}
</style>