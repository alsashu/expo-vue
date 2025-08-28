<template>
  <div class="diagram-view">
    <!-- Header Section -->
    <div class="row mb-4">
      <div class="col">
        <h1 class="h3">Item Diagram</h1>
        <p class="text-muted">Visualize your items in an interactive diagram</p>
      </div>
      <div class="col-auto">
        <div class="btn-group" role="group">
          <button @click="resetDiagram" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-clockwise"></i> Reset
          </button>
          <button @click="zoomToFit" class="btn btn-outline-secondary">
            <i class="bi bi-fullscreen"></i> Zoom to Fit
          </button>
          <button @click="exportDiagram" class="btn btn-outline-secondary">
            <i class="bi bi-download"></i> Export
          </button>
        </div>
      </div>
    </div>

    <!-- Diagram Controls -->
    <div class="card mb-4">
      <div class="card-body">
        <div class="row g-3">
          <div class="col-md-3">
            <label class="form-label">Layout Type</label>
            <select v-model="layoutType" class="form-select" @change="updateLayout">
              <option value="ForceDirected">Force Directed</option>
              <option value="Tree">Tree Layout</option>
              <option value="LayeredDigraph">Layered Digraph</option>
              <option value="Circular">Circular</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Filter by Category</label>
            <select v-model="selectedCategory" class="form-select" @change="filterByCategory">
              <option value="">All Categories</option>
              <option v-for="category in uniqueCategories" :key="category" :value="category">
                {{ category }}
              </option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Filter by Status</label>
            <select v-model="selectedStatus" class="form-select" @change="filterByStatus">
              <option value="">All Status</option>
              <option value="Available">Available</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Pending">Pending</option>
              <option value="Planning">Planning</option>
            </select>
          </div>
          <div class="col-md-3">
            <label class="form-label">Node Size</label>
            <input
              v-model="nodeSize"
              type="range"
              class="form-range"
              min="30"
              max="100"
              @input="updateNodeSize"
            >
          </div>
        </div>
      </div>
    </div>

    <!-- GoJS Diagram - Full Width -->
    <div class="diagram-container-wrapper">
      <!-- Loading State -->
      <div v-if="isLoading" class="diagram-loading">
        <div class="text-center">
          <div class="spinner-border text-primary" role="status">
            <span class="visually-hidden">Loading...</span>
          </div>
          <p class="mt-2 text-muted">Loading diagram...</p>
        </div>
      </div>
      
      <!-- Error State -->
      <div v-else-if="error" class="diagram-error">
        <div class="text-center">
          <i class="bi bi-exclamation-triangle text-warning" style="font-size: 3rem;"></i>
          <p class="mt-2 text-muted">{{ error }}</p>
          <button @click="retryInitialization" class="btn btn-outline-primary">
            <i class="bi bi-arrow-clockwise"></i> Retry
          </button>
        </div>
      </div>
      
      <!-- Diagram Container -->
      <div
        v-else
        ref="diagramDiv"
        class="diagram-container"
      ></div>
    </div>

    <!-- Node Details Panel -->
    <div v-if="selectedNode" class="card mt-4">
      <div class="card-header">
        <h5 class="card-title mb-0">Node Details</h5>
      </div>
      <div class="card-body">
        <div class="row">
          <div class="col-md-6">
            <h6>{{ selectedNode.name }}</h6>
            <p class="text-muted">{{ selectedNode.description }}</p>
            
            <div class="mb-3">
              <strong>Category:</strong>
              <span class="badge bg-secondary ms-2">{{ selectedNode.category }}</span>
            </div>
            
            <div class="mb-3">
              <strong>Status:</strong>
              <span class="badge ms-2" :class="getStatusBadgeClass(selectedNode.status)">
                {{ selectedNode.status }}
              </span>
            </div>
            
            <div class="mb-3">
              <strong>Priority:</strong>
              <span class="badge ms-2" :class="getPriorityBadgeClass(selectedNode.priority)">
                {{ selectedNode.priority }}
              </span>
            </div>
          </div>
          
          <div class="col-md-6">
            <div class="mb-3">
              <strong>Tags:</strong>
              <div class="mt-2">
                <span
                  v-for="tag in selectedNode.tags"
                  :key="tag"
                  class="badge bg-light text-dark me-1"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
            
            <div class="mb-3">
              <strong>Created:</strong>
              <div>{{ formatDate(selectedNode.createdAt) }}</div>
            </div>
            
            <div class="mb-3">
              <strong>Updated:</strong>
              <div>{{ formatDate(selectedNode.updatedAt) }}</div>
            </div>
          </div>
        </div>
        
        <div class="row mt-3">
          <div class="col">
            <button @click="editNode" class="btn btn-primary me-2">
              <i class="bi bi-pencil"></i> Edit
            </button>
            <button @click="deleteNode" class="btn btn-danger">
              <i class="bi bi-trash"></i> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { useItemsStore } from '@/stores/items';
import type { Item } from '@/types';

// Import GoJS
import * as go from 'gojs';

// GoJS is used for diagramming, no ag-Grid needed here

const router = useRouter();
const itemsStore = useItemsStore();

// Reactive data
const diagramDiv = ref<HTMLElement>();
const diagram = ref<go.Diagram>();
const selectedNode = ref<Item | null>(null);
const layoutType = ref('ForceDirected');
const selectedCategory = ref('');
const selectedStatus = ref('');
const nodeSize = ref(60);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Computed
const items = computed(() => itemsStore.items);
const filteredItems = computed(() => {
  let filtered = items.value;
  
  if (selectedCategory.value) {
    filtered = filtered.filter(item => item.category === selectedCategory.value);
  }
  
  if (selectedStatus.value) {
    filtered = filtered.filter(item => item.status === selectedStatus.value);
  }
  
  return filtered;
});

const uniqueCategories = computed(() => {
  const categories = new Set(items.value.map(item => item.category));
  return Array.from(categories).sort();
});

// Methods
const initializeDiagram = () => {
  try {
    if (!diagramDiv.value) {
      console.warn('Diagram div not ready');
      return;
    }

    // Check if GoJS is available
    if (typeof go === 'undefined') {
      console.error('GoJS not loaded');
      return;
    }

    // Create new diagram instance
    diagram.value = new go.Diagram(diagramDiv.value);

  // Define the node template
  diagram.value.nodeTemplate =
    new go.Node('Auto')
      .add(
        new go.Shape('Circle', { name: 'SHAPE' })
          .bind('fill', 'color')
          .bind('stroke', 'strokeColor')
          .bind('strokeWidth', 'strokeWidth')
          .bind('desiredSize', 'size'),
        new go.TextBlock()
          .bind('text', 'name')
          .bind('font', 'font')
          .bind('stroke', 'textColor')
      );

  // Define the link template
  diagram.value.linkTemplate =
    new go.Link()
      .add(
        new go.Shape()
          .bind('stroke', 'color')
          .bind('strokeWidth', 'width'),
        new go.Shape('Triangle')
          .bind('fill', 'color')
          .bind('stroke', 'color')
      );

  // Set up the model
  diagram.value.model = new go.GraphLinksModel({
    nodeDataArray: getNodeData(),
    linkDataArray: getLinkData(),
  });

  // Set up layout
  updateLayout();

  // Set up event listeners
  diagram.value.addDiagramListener('ChangedSelection', onSelectionChanged);
  diagram.value.addDiagramListener('ObjectSingleClicked', onNodeClicked);
  
  console.log('Diagram initialized successfully');
} catch (error) {
  console.error('Failed to initialize diagram:', error);
  // Clean up on error
  if (diagram.value) {
    diagram.value.div = null;
    diagram.value = undefined;
  }
}
};

const getNodeData = () => {
  return filteredItems.value.map(item => ({
    key: item.id,
    name: item.name,
    color: getNodeColor(item.category),
    strokeColor: getNodeStrokeColor(item.status),
    strokeWidth: item.priority === 'High' ? 3 : 1,
    size: new go.Size(nodeSize.value, nodeSize.value),
    font: `${Math.max(10, nodeSize.value / 6)}px sans-serif`,
    textColor: '#ffffff',
    category: item.category,
    status: item.status,
    priority: item.priority,
    description: item.description,
    tags: item.tags,
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
  }));
};

const getLinkData = () => {
  const links = [];
  const items = filteredItems.value;
  
  // Create links based on shared categories or tags
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      const item1 = items[i];
      const item2 = items[j];
      
      // Link items with same category
      if (item1.category === item2.category) {
        links.push({
          from: item1.id,
          to: item2.id,
          color: '#6c757d',
          width: 1,
        });
      }
      
      // Link items with shared tags
      const sharedTags = item1.tags.filter(tag => item2.tags.includes(tag));
      if (sharedTags.length > 0) {
        links.push({
          from: item1.id,
          to: item2.id,
          color: '#28a745',
          width: 2,
        });
      }
    }
  }
  
  return links;
};

const getNodeColor = (category: string) => {
  const colors = {
    'Electronics': '#007bff',
    'Software': '#28a745',
    'Design': '#ffc107',
    'Backend': '#dc3545',
    'Mobile': '#6f42c1',
  };
  return colors[category as keyof typeof colors] || '#6c757d';
};

const getNodeStrokeColor = (status: string) => {
  const colors = {
    'Available': '#28a745',
    'In Progress': '#ffc107',
    'Completed': '#17a2b8',
    'Pending': '#6c757d',
    'Planning': '#007bff',
  };
  return colors[status as keyof typeof colors] || '#6c757d';
};

const updateLayout = () => {
  if (!diagram.value) return;

  switch (layoutType.value) {
    case 'ForceDirected':
      diagram.value.layout = new go.ForceDirectedLayout();
      break;
    case 'Tree':
      diagram.value.layout = new go.TreeLayout();
      break;
    case 'LayeredDigraph':
      diagram.value.layout = new go.LayeredDigraphLayout();
      break;
    case 'Circular':
      diagram.value.layout = new go.CircularLayout();
      break;
  }
};

const updateNodeSize = () => {
  if (!diagram.value) return;
  
  // Update the model data with new sizes
  diagram.value.model.nodeDataArray.forEach((node: any) => {
    node.size = new go.Size(nodeSize.value, nodeSize.value);
    node.font = `${Math.max(10, nodeSize.value / 6)}px sans-serif`;
  });
  
  // Force a diagram update
  diagram.value.updateAllTargetBindings();
};

const filterByCategory = () => {
  updateDiagram();
};

const filterByStatus = () => {
  updateDiagram();
};

const updateDiagram = () => {
  if (!diagram.value) return;
  
  diagram.value.model = new go.GraphLinksModel({
    nodeDataArray: getNodeData(),
    linkDataArray: getLinkData(),
  });
};

const onSelectionChanged = () => {
  const selection = diagram.value?.selection;
  if (selection && selection.count > 0) {
    const selected = selection.first();
    if (selected && selected.data && selected.data.key) {
      const itemId = selected.data.key;
      const item = items.value.find(i => i.id === itemId);
      selectedNode.value = item || null;
    }
  } else {
    selectedNode.value = null;
  }
};

const onNodeClicked = (event: any) => {
  const part = event.subject.part;
  if (part instanceof go.Node) {
    const itemId = part.data.key;
    const item = items.value.find(i => i.id === itemId);
    selectedNode.value = item || null;
  }
};

const resetDiagram = () => {
  if (!diagram.value) return;
  diagram.value.commandHandler.resetZoom();
  // Reset pan by setting position to center
  diagram.value.position = new go.Point(0, 0);
};

const zoomToFit = () => {
  if (!diagram.value) return;
  diagram.value.commandHandler.zoomToFit();
};

const exportDiagram = () => {
  if (!diagram.value) return;
  const svg = diagram.value.makeSvg({
    scale: 2,
  });
  
  const svgData = new XMLSerializer().serializeToString(svg as SVGElement);
  const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);
  
  const downloadLink = document.createElement('a');
  downloadLink.href = svgUrl;
  downloadLink.download = 'diagram.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
  URL.revokeObjectURL(svgUrl);
};

const editNode = () => {
  if (selectedNode.value) {
    router.push(`/items?selected=${selectedNode.value.id}`);
  }
};

const deleteNode = async () => {
  if (selectedNode.value && confirm('Are you sure you want to delete this item?')) {
    try {
      await itemsStore.deleteItem(selectedNode.value.id);
      selectedNode.value = null;
      updateDiagram();
    } catch (error) {
      console.error('Error deleting item:', error);
      alert('Error deleting item. Please try again.');
    }
  }
};

const getStatusBadgeClass = (status: string) => {
  const classes = {
    'Available': 'bg-success',
    'In Progress': 'bg-warning',
    'Completed': 'bg-info',
    'Pending': 'bg-secondary',
    'Planning': 'bg-primary',
  };
  return classes[status as keyof typeof classes] || 'bg-secondary';
};

const getPriorityBadgeClass = (priority: string) => {
  const classes = {
    'High': 'bg-danger',
    'Medium': 'bg-warning',
    'Low': 'bg-success',
  };
  return classes[priority as keyof typeof classes] || 'bg-secondary';
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};

const retryInitialization = async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Wait for items to load first
    await itemsStore.loadItems();
    
    // Add a small delay to ensure DOM is ready
    await nextTick();
    
    // Only initialize diagram if we have items and DOM is ready
    if (diagramDiv.value && items.value.length > 0) {
      initializeDiagram();
    } else {
      error.value = 'No items available to display';
    }
  } catch (err) {
    console.error('Failed to retry diagram initialization:', err);
    error.value = 'Failed to load diagram';
  } finally {
    isLoading.value = false;
  }
};

// Watchers
watch(items, (newItems, oldItems) => {
  // Only update if items actually changed and we have a diagram
  if (diagram.value && newItems.length !== oldItems.length) {
    updateDiagram();
  }
}, { deep: false }); // Use deep: false to avoid infinite loops

// Lifecycle
onMounted(async () => {
  try {
    isLoading.value = true;
    error.value = null;
    
    // Wait for items to load first
    await itemsStore.loadItems();
    
    // Add a small delay to ensure DOM is ready
    await nextTick();
    
    // Only initialize diagram if we have items and DOM is ready
    if (diagramDiv.value && items.value.length > 0) {
      initializeDiagram();
    } else {
      error.value = 'No items available to display';
    }
  } catch (err) {
    console.error('Failed to initialize diagram:', err);
    error.value = 'Failed to load diagram';
  } finally {
    isLoading.value = false;
  }
});

onUnmounted(() => {
  if (diagram.value) {
    diagram.value.div = null;
  }
});
</script>

<style lang="scss" scoped>
.diagram-view {
  // Full width layout
  width: 100%;
  
  .form-range {
    width: 100%;
  }
  
  .badge {
    font-size: 0.75rem;
  }
}

// Diagram container wrapper - full width
.diagram-container-wrapper {
  width: 100%;
  margin: 0;
  padding: 0;
  
  // Loading state
  .diagram-loading {
    height: 70vh;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
  }
  
  // Error state
  .diagram-error {
    height: 70vh;
    min-height: 500px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
  }
  
  // Diagram container - full width and height
  .diagram-container {
    width: 100%;
    height: 70vh;
    min-height: 500px;
    background-color: #f8f9fa;
    border: 1px solid #dee2e6;
    border-radius: 0.375rem;
  }
}

// Dark mode support
.dark-mode {
  .diagram-container-wrapper {
    .diagram-loading,
    .diagram-error,
    .diagram-container {
      background-color: #2d2d2d;
      border-color: #444;
    }
  }
  
  .card {
    background-color: #2d2d2d;
    border-color: #444;
  }
}
</style>
