<template>
  <div class="dashboard">
    <div class="row mb-4">
      <div class="col">
        <h1 class="h3">Dashboard</h1>
        <p class="text-muted">Overview of your items and statistics</p>
      </div>
    </div>

    <!-- Statistics Cards -->
    <div class="row mb-4">
      <div class="col-md-3 mb-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title text-muted">Total Items</h6>
                <h2 class="mb-0">{{ items.length }}</h2>
              </div>
              <div class="stat-icon">
                <i class="bi bi-box text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title text-muted">In Progress</h6>
                <h2 class="mb-0 text-warning">{{ itemsByStatus['In Progress'] }}</h2>
              </div>
              <div class="stat-icon">
                <i class="bi bi-clock text-warning"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title text-muted">Completed</h6>
                <h2 class="mb-0 text-success">{{ itemsByStatus.Completed }}</h2>
              </div>
              <div class="stat-icon">
                <i class="bi bi-check-circle text-success"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="col-md-3 mb-3">
        <div class="card stat-card">
          <div class="card-body">
            <div class="d-flex justify-content-between align-items-center">
              <div>
                <h6 class="card-title text-muted">High Priority</h6>
                <h2 class="mb-0 text-danger">{{ itemsByPriority.High }}</h2>
              </div>
              <div class="stat-icon">
                <i class="bi bi-exclamation-triangle text-danger"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Charts and Data -->
    <div class="row">
      <!-- Items by Status Chart -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Items by Status</h5>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <div
                v-for="(count, status) in itemsByStatus"
                :key="status"
                class="chart-item"
              >
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="chart-label">{{ status }}</span>
                  <span class="chart-value">{{ count }}</span>
                </div>
                <div class="progress">
                  <div
                    class="progress-bar"
                    :class="getStatusColor(status)"
                    :style="{ width: getPercentage(count, items.length) + '%' }"
                    role="progressbar"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Items by Category Chart -->
      <div class="col-md-6 mb-4">
        <div class="card">
          <div class="card-header">
            <h5 class="card-title mb-0">Items by Category</h5>
          </div>
          <div class="card-body">
            <div class="chart-container">
              <div
                v-for="(count, category) in itemsByCategory"
                :key="category"
                class="chart-item"
              >
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <span class="chart-label">{{ category }}</span>
                  <span class="chart-value">{{ count }}</span>
                </div>
                <div class="progress">
                  <div
                    class="progress-bar"
                    :style="{ width: getPercentage(count, items.length) + '%' }"
                    role="progressbar"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Recent Items -->
    <div class="row">
      <div class="col-12">
        <div class="card">
          <div class="card-header d-flex justify-content-between align-items-center">
            <h5 class="card-title mb-0">Recent Items</h5>
            <router-link to="/items" class="btn btn-primary btn-sm">
              View All
            </router-link>
          </div>
          <div class="card-body">
            <div class="table-responsive">
              <table class="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Status</th>
                    <th>Priority</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="item in recentItems"
                    :key="item.id"
                    @click="viewItem(item)"
                    class="cursor-pointer"
                  >
                    <td>{{ item.name }}</td>
                    <td>
                      <span class="badge" :class="getCategoryBadgeClass(item.category)">
                        {{ item.category }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="getStatusBadgeClass(item.status)">
                        {{ item.status }}
                      </span>
                    </td>
                    <td>
                      <span class="badge" :class="getPriorityBadgeClass(item.priority)">
                        {{ item.priority }}
                      </span>
                    </td>
                    <td>{{ formatDate(item.createdAt) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useItemsStore } from '@/stores/items';

const router = useRouter();
const itemsStore = useItemsStore();

const items = computed(() => itemsStore.items);
const itemsByStatus = computed(() => itemsStore.itemsByStatus);
const itemsByCategory = computed(() => itemsStore.itemsByCategory);
const itemsByPriority = computed(() => itemsStore.itemsByPriority);

const recentItems = computed(() => {
  return items.value
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);
});

const getStatusColor = (status: string) => {
  const colors = {
    'Available': 'bg-success',
    'In Progress': 'bg-warning',
    'Completed': 'bg-info',
    'Pending': 'bg-secondary',
    'Planning': 'bg-primary',
  };
  return colors[status as keyof typeof colors] || 'bg-secondary';
};

const getPercentage = (value: number, total: number) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

const getCategoryBadgeClass = (category: string) => {
  return 'bg-secondary';
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

const viewItem = (item: any) => {
  router.push(`/items?selected=${item.id}`);
};

onMounted(() => {
  itemsStore.loadItems();
});
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-card {
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    border: none;
    border-radius: 0.75rem;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
    }
  }

  .stat-icon {
    font-size: 2rem;
    opacity: 0.8;
  }

  .chart-container {
    .chart-item {
      margin-bottom: 1rem;
      
      &:last-child {
        margin-bottom: 0;
      }
    }

    .chart-label {
      font-weight: 500;
      font-size: 0.9rem;
    }

    .chart-value {
      font-weight: bold;
      color: #6c757d;
    }

    .progress {
      height: 0.5rem;
      border-radius: 0.25rem;
    }

    .progress-bar {
      border-radius: 0.25rem;
    }
  }

  .cursor-pointer {
    cursor: pointer;
    
    &:hover {
      background-color: rgba(0, 0, 0, 0.05);
    }
  }

  .badge {
    font-size: 0.75rem;
    padding: 0.375rem 0.75rem;
  }
}

// Dark mode support
.dark-mode {
  .stat-card {
    background-color: #2d2d2d;
    border-color: #444;
    
    &:hover {
      background-color: #333;
    }
  }
  
  .card {
    background-color: #2d2d2d;
    border-color: #444;
  }
  
  .table {
    color: #ffffff;
    
    tbody tr:hover {
      background-color: rgba(255, 255, 255, 0.05);
    }
  }
  
  .progress {
    background-color: #444;
  }
}
</style>
