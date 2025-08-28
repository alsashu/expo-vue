<template>
  <div class="items-view">
    <div class="row mb-4">
      <div class="col">
        <h1 class="h3">Items Management</h1>
        <p class="text-muted">Manage your items with full CRUD operations</p>
      </div>
      <div class="col-auto">
        <div class="btn-group me-2" role="group">
          <button 
            @click="manualSync" 
            class="btn btn-outline-secondary"
            :disabled="!isOnline || syncStatus.isSyncing"
            :title="getSyncButtonTooltip()"
          >
            <i 
              class="bi" 
              :class="syncStatus.isSyncing ? 'bi-arrow-repeat spin' : 'bi-cloud-arrow-up'"
            ></i>
            {{ syncStatus.isSyncing ? 'Syncing...' : 'Sync' }}
            <span 
              v-if="syncStatus.pendingCount > 0" 
              class="badge bg-warning text-dark ms-1"
            >
              {{ syncStatus.pendingCount }}
            </span>
          </button>
        </div>
        <button @click="showCreateModal = true" class="btn btn-primary">
          <i class="bi bi-plus"></i> Add Item
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row">
          <div class="col-md-3">
            <label class="form-label">Search</label>
            <input
              v-model="filters.search"
              type="text"
              class="form-control"
              placeholder="Search items..."
            >
          </div>
          <div class="col-md-3">
            <label class="form-label">Category</label>
            <select v-model="filters.category" class="form-select">
              <option value="">All Categories</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Status</label>
            <select v-model="filters.status" class="form-select">
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Planning">Planning</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Priority</label>
            <select v-model="filters.priority" class="form-select">
              <option value="">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        <div class="row mt-3">
          <div class="col">
            <button @click="clearFilters" class="btn btn-outline-secondary btn-sm">
              Clear Filters
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ag-Grid -->
    <div class="card">
      <div class="card-body p-0">
        <ag-grid-vue
          class="ag-theme-alpine"
          :column-defs="columnDefs"
          :row-data="filteredItems"
          :grid-options="gridOptions"
          @grid-ready="onGridReady"
          @selection-changed="onSelectionChanged"
        >
        </ag-grid-vue>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <div
      class="modal fade"
      :class="{ show: showCreateModal || showEditModal }"
      :style="{ display: (showCreateModal || showEditModal) ? 'block' : 'none' }"
      tabindex="-1"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">
              {{ showEditModal ? 'Edit Item' : 'Create New Item' }}
            </h5>
            <button
              type="button"
              class="btn-close"
              @click="closeModal"
              :disabled="submitting"
            ></button>
          </div>
          <div class="modal-body">
            <form @submit.prevent="handleSubmit">
              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Name</label>
                    <input
                      v-model="form.name"
                      type="text"
                      class="form-control"
                      required
                    >
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Category</label>
                    <select v-model="form.category" class="form-select" required>
                      <option value="">Select Category</option>
                      <option value="Electronics">Electronics</option>
                      <option value="Software">Software</option>
                      <option value="Design">Design</option>
                      <option value="Backend">Backend</option>
                      <option value="Mobile">Mobile</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="row">
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Status</label>
                    <select v-model="form.status" class="form-select" required>
                      <option value="">Select Status</option>
                      <option value="Available">Available</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Completed">Completed</option>
                      <option value="Pending">Pending</option>
                      <option value="Planning">Planning</option>
                    </select>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="mb-3">
                    <label class="form-label">Priority</label>
                    <select v-model="form.priority" class="form-select" required>
                      <option value="">Select Priority</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="mb-3">
                <label class="form-label">Description</label>
                <textarea
                  v-model="form.description"
                  class="form-control"
                  rows="3"
                  required
                ></textarea>
              </div>

              <div class="mb-3">
                <label class="form-label">Tags (comma separated)</label>
                <input
                  v-model="form.tags"
                  type="text"
                  class="form-control"
                  placeholder="tag1, tag2, tag3"
                >
              </div>
            </form>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" @click="closeModal" :disabled="submitting">
              Cancel
            </button>
            <button
              type="button"
              class="btn btn-primary"
              @click="handleSubmit"
              :disabled="submitting"
            >
              <span v-if="submitting" class="spinner-border spinner-border-sm me-2"></span>
              {{ submitting ? 'Saving...' : (showEditModal ? 'Update' : 'Create') }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="showCreateModal || showEditModal"
      class="modal-backdrop fade show"
      @click="closeModal"
    ></div>
    
    <!-- Force close button for debugging -->
    <div v-if="showCreateModal || showEditModal" class="position-fixed top-0 end-0 p-3" style="z-index: 9999;">
      <button @click="forceCloseModal" class="btn btn-danger btn-sm">
        <i class="bi bi-x-circle"></i> Force Close
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, nextTick, watch } from 'vue';
import { AgGridVue } from 'ag-grid-vue3';
import { useItemsStore } from '@/stores/items';
import { useAppStore } from '@/stores/app';
import type { Item, CreateItemRequest } from '@/types';

// Import ag-Grid modules and CSS
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
// Import legacy CSS for legacy theme
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

const itemsStore = useItemsStore();
const appStore = useAppStore();

// Reactive data
const showCreateModal = ref(false);
const showEditModal = ref(false);
const submitting = ref(false);
const editingItem = ref<Item | null>(null);
const selectedItems = ref<Item[]>([]);

// Debug logging for reactive state changes
watch(showCreateModal, (newVal, oldVal) => {
  console.log('🔍 [ItemsView] showCreateModal changed:', { from: oldVal, to: newVal });
});

watch(showEditModal, (newVal, oldVal) => {
  console.log('🔍 [ItemsView] showEditModal changed:', { from: oldVal, to: newVal });
});

watch(submitting, (newVal, oldVal) => {
  console.log('🔍 [ItemsView] submitting changed:', { from: oldVal, to: newVal });
});

watch(editingItem, (newVal, oldVal) => {
  console.log('🔍 [ItemsView] editingItem changed:', { from: oldVal, to: newVal });
});

const form = reactive({
  name: '',
  category: '',
  status: '' as Item['status'],
  priority: '' as Item['priority'],
  description: '',
  tags: '',
});

// Computed
const items = computed(() => itemsStore.items);
const filters = computed(() => itemsStore.filters);

const filteredItems = computed(() => itemsStore.filteredItems);

const uniqueCategories = computed(() => {
  const categories = new Set(items.value.map(item => item.category));
  return Array.from(categories).sort();
});

// Sync status
const isOnline = computed(() => appStore.isOnline);
const syncStatus = computed(() => appStore.syncStatus);

// Grid configuration
const columnDefs = [
  {
    field: 'name',
    headerName: 'Name',
    sortable: true,
    filter: true,
    width: 200,
  },
  {
    field: 'category',
    headerName: 'Category',
    sortable: true,
    filter: true,
    width: 120,
    cellRenderer: (params: any) => {
      const badge = document.createElement('span');
      badge.className = 'badge bg-secondary';
      badge.textContent = params.value;
      return badge;
    },
  },
  {
    field: 'status',
    headerName: 'Status',
    sortable: true,
    filter: true,
    width: 130,
    cellRenderer: (params: any) => {
      const statusColors = {
        'Available': 'success',
        'In Progress': 'warning',
        'Completed': 'info',
        'Pending': 'secondary',
        'Planning': 'primary',
      };
      const color = statusColors[params.value as keyof typeof statusColors] || 'secondary';
      const badge = document.createElement('span');
      badge.className = `badge bg-${color}`;
      badge.textContent = params.value;
      return badge;
    },
  },
  {
    field: 'priority',
    headerName: 'Priority',
    sortable: true,
    filter: true,
    width: 100,
    cellRenderer: (params: any) => {
      const priorityColors = {
        'High': 'danger',
        'Medium': 'warning',
        'Low': 'success',
      };
      const color = priorityColors[params.value as keyof typeof priorityColors] || 'secondary';
      const badge = document.createElement('span');
      badge.className = `badge bg-${color}`;
      badge.textContent = params.value;
      return badge;
    },
  },
  {
    field: 'description',
    headerName: 'Description',
    sortable: true,
    filter: true,
    width: 250,
  },
  {
    field: 'createdAt',
    headerName: 'Created',
    sortable: true,
    width: 120,
    valueFormatter: (params: any) => {
      return new Date(params.value).toLocaleDateString();
    },
  },
  {
    headerName: 'Actions',
    width: 120,
    cellRenderer: (params: any) => {
      const editBtn = document.createElement('button');
      editBtn.className = 'btn btn-sm btn-outline-primary me-1';
      editBtn.innerHTML = '<i class="bi bi-pencil"></i>';
      editBtn.onclick = () => {
        const item = items.value.find(i => i.id === params.data.id);
        if (item) {
          editingItem.value = item;
          fillForm(item);
          showEditModal.value = true;
        }
      };
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn btn-sm btn-outline-danger';
      deleteBtn.innerHTML = '<i class="bi bi-trash"></i>';
      deleteBtn.onclick = () => {
        if (confirm('Are you sure you want to delete this item?')) {
          deleteItem(params.data.id);
        }
      };
      
      const container = document.createElement('div');
      container.appendChild(editBtn);
      container.appendChild(deleteBtn);
      return container;
    },
  },
];

const gridOptions = {
  theme: 'legacy' as const, // Use legacy theming to avoid API conflicts
  rowSelection: 'multiple' as const, // Keep using string for now to avoid type issues
  animateRows: true,
  pagination: true,
  paginationPageSize: 10,
  paginationPageSizeSelector: [10, 20, 50, 100],
  domLayout: 'autoHeight' as const,
  suppressCellFocus: true,
};

// Methods
const onGridReady = (params: any) => {
  try {
    params.api.sizeColumnsToFit();
  } catch (error) {
    console.warn('Grid sizing error:', error);
  }
};

const onSelectionChanged = (params: any) => {
  selectedItems.value = params.api.getSelectedRows();
  itemsStore.setSelectedItems(selectedItems.value);
};

const fillForm = (item: Item) => {
  console.log('🔍 [ItemsView] fillForm called with item:', item);
  form.name = item.name;
  form.category = item.category;
  form.status = item.status;
  form.priority = item.priority;
  form.description = item.description;
  form.tags = item.tags.join(', ');
  console.log('🔍 [ItemsView] Form filled with values:', form);
};

const resetForm = () => {
  console.log('🔍 [ItemsView] resetForm called');
  form.name = '';
  form.category = '';
  form.status = '' as Item['status'];
  form.priority = '' as Item['priority'];
  form.description = '';
  form.tags = '';
  console.log('🔍 [ItemsView] Form reset completed');
};

const closeModal = () => {
  console.log('🔍 [ItemsView] closeModal called');
  console.log('🔍 [ItemsView] Current modal states before close:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    submitting: submitting.value,
    editingItem: editingItem.value
  });
  
  // Force reset all modal states
  showCreateModal.value = false;
  showEditModal.value = false;
  editingItem.value = null;
  submitting.value = false;
  
  console.log('🔍 [ItemsView] Modal states after reset:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    submitting: submitting.value,
    editingItem: editingItem.value
  });
  
  // Reset form
  resetForm();
  
  // Force DOM update
  nextTick(() => {
    console.log('🔍 [ItemsView] Modal states after nextTick:', {
      showCreateModal: showCreateModal.value,
      showEditModal: showEditModal.value,
      submitting: submitting.value,
      editingItem: editingItem.value
    });
  });
  
  console.log('🔍 [ItemsView] closeModal completed');
};

const forceCloseModal = () => {
  console.log('🔍 [ItemsView] forceCloseModal called');
  console.log('🔍 [ItemsView] Current modal states before force close:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    submitting: submitting.value,
    editingItem: editingItem.value
  });
  
  showCreateModal.value = false;
  showEditModal.value = false;
  editingItem.value = null;
  submitting.value = false;
  
  console.log('🔍 [ItemsView] Modal states after force close:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    submitting: submitting.value,
    editingItem: editingItem.value
  });
  
  resetForm();
  console.log('🔍 [ItemsView] forceCloseModal completed');
};

const handleSubmit = async () => {
  console.log('🔍 [ItemsView] handleSubmit called');
  console.log('🔍 [ItemsView] Current form values:', form);
  console.log('🔍 [ItemsView] Current modal states:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    editingItem: editingItem.value
  });
  
  if (!form.name || !form.category || !form.status || !form.priority || !form.description) {
    console.warn('🔍 [ItemsView] Form validation failed - missing required fields');
    alert('Please fill in all required fields');
    return;
  }

  console.log('🔍 [ItemsView] Form validation passed, starting submission');
  submitting.value = true;
  console.log('🔍 [ItemsView] submitting set to true');

  try {
    const itemData: CreateItemRequest = {
      name: form.name,
      category: form.category,
      status: form.status,
      priority: form.priority,
      description: form.description,
      tags: form.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
    };

    console.log('🔍 [ItemsView] Prepared item data:', itemData);

    if (showEditModal.value && editingItem.value) {
      console.log('🔍 [ItemsView] Updating existing item:', editingItem.value.id);
      console.log('🔍 [ItemsView] Item data to update:', itemData);
      console.log('🔍 [ItemsView] Current online status:', appStore.isOnline);
      
      try {
        const updatedItem = await itemsStore.updateItem(editingItem.value.id, itemData);
        console.log('🔍 [ItemsView] Item update completed successfully:', updatedItem);
      } catch (updateError) {
        console.error('🔍 [ItemsView] Update operation failed:', updateError);
        throw updateError; // Re-throw to be caught by outer catch
      }
    } else {
      console.log('🔍 [ItemsView] Creating new item');
      console.log('🔍 [ItemsView] Current online status:', appStore.isOnline);
      
      try {
        const newItem = await itemsStore.createItem(itemData);
        console.log('🔍 [ItemsView] Item creation completed successfully:', newItem);
      } catch (createError) {
        console.error('🔍 [ItemsView] Create operation failed:', createError);
        throw createError; // Re-throw to be caught by outer catch
      }
    }

    console.log('🔍 [ItemsView] Item saved successfully, closing modal');
    
    // Force close modal after successful submission
    await nextTick();
    console.log('🔍 [ItemsView] nextTick completed, calling closeModal');
    closeModal();
    
    // Double-check modal is closed
    setTimeout(() => {
      console.log('🔍 [ItemsView] Double-checking modal state after 100ms');
      if (showCreateModal.value || showEditModal.value) {
        console.warn('🔍 [ItemsView] Modal still open, forcing close...');
        forceCloseModal();
      } else {
        console.log('🔍 [ItemsView] Modal closed successfully');
      }
    }, 100);
    
  } catch (error) {
    console.error('🔍 [ItemsView] Error saving item:', error);
    alert('Error saving item. Please try again.');
    // Don't close modal on error, let user fix and retry
  } finally {
    console.log('🔍 [ItemsView] handleSubmit finally block - resetting submitting state');
    submitting.value = false;
    console.log('🔍 [ItemsView] submitting set to false');
  }
};

const deleteItem = async (id: number | string) => {
  console.log('🔍 [ItemsView] deleteItem called with id:', id);
  try {
    console.log('🔍 [ItemsView] Calling itemsStore.deleteItem...');
    await itemsStore.deleteItem(id);
    console.log('🔍 [ItemsView] Item deletion completed successfully');
  } catch (error) {
    console.error('🔍 [ItemsView] Error deleting item:', error);
    alert('Error deleting item. Please try again.');
  }
};

const clearFilters = () => {
  console.log('🔍 [ItemsView] clearFilters called');
  console.log('🔍 [ItemsView] Current filters before clear:', filters.value);
  itemsStore.clearFilters();
  console.log('🔍 [ItemsView] Filters cleared');
};

// Sync functions
const manualSync = async () => {
  console.log('🔍 [ItemsView] manualSync called');
  console.log('🔍 [ItemsView] Current sync status:', syncStatus.value);
  console.log('🔍 [ItemsView] Current online status:', isOnline.value);
  
  try {
    console.log('🔍 [ItemsView] Calling itemsStore.syncPendingOperations...');
    await itemsStore.syncPendingOperations();
    console.log('🔍 [ItemsView] Manual sync completed successfully');
  } catch (error) {
    console.error('🔍 [ItemsView] Manual sync failed:', error);
    alert('Sync failed. Please try again.');
  }
};

const getSyncButtonTooltip = () => {
  if (!isOnline.value) {
    return 'Offline - Cannot sync';
  }
  if (syncStatus.value.isSyncing) {
    return 'Syncing...';
  }
  if (syncStatus.value.pendingCount > 0) {
    return `Sync ${syncStatus.value.pendingCount} pending operations`;
  }
  return 'All changes synced';
};

onMounted(() => {
  console.log('🔍 [ItemsView] Component mounted');
  console.log('🔍 [ItemsView] Initial modal states:', {
    showCreateModal: showCreateModal.value,
    showEditModal: showEditModal.value,
    submitting: submitting.value,
    editingItem: editingItem.value
  });
  console.log('🔍 [ItemsView] Calling itemsStore.loadItems...');
  itemsStore.loadItems();
  console.log('🔍 [ItemsView] Component mount completed');
});
</script>

<style lang="scss" scoped>
.items-view {
  .ag-theme-alpine {
    height: 600px;
    width: 100%;
  }
  
  .ag-row {
    cursor: pointer;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }
  
  .badge {
    font-size: 0.75rem;
  }

  // Sync button styles
  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
}

// Dark mode support
.dark-mode {
  .ag-theme-alpine {
    --ag-background-color: #2d2d2d;
    --ag-foreground-color: #ffffff;
    --ag-header-background-color: #1a1a1a;
    --ag-row-hover-color: rgba(255, 255, 255, 0.05);
    --ag-border-color: #444;
  }
}
</style>
