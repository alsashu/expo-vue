<template>
  <div class="app-layout" :class="{ 'dark-mode': isDarkMode }">
    <!-- Navigation -->
    <nav class="navbar navbar-expand-lg" :class="navbarClass">
      <div class="container-fluid">
        <router-link class="navbar-brand" to="/dashboard">
          <i class="bi bi-grid-3x3-gap"></i>
          Vue PWA Grid Go
        </router-link>

        <button
          class="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span class="navbar-toggler-icon"></span>
        </button>

        <div class="collapse navbar-collapse" id="navbarNav">
          <ul class="navbar-nav me-auto" v-if="isAuthenticated">
            <li class="nav-item">
              <router-link class="nav-link" to="/dashboard" active-class="active">
                <i class="bi bi-speedometer2"></i>
                Dashboard
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/items" active-class="active">
                <i class="bi bi-table"></i>
                Items
              </router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link" to="/diagram" active-class="active">
                <i class="bi bi-diagram-3"></i>
                Diagram
              </router-link>
            </li>
          </ul>

          <ul class="navbar-nav">
            <!-- Sync Status Indicator -->
            <li class="nav-item" v-if="isAuthenticated">
              <span class="nav-link position-relative">
                <i 
                  class="bi" 
                  :class="syncStatus.isSyncing ? 'bi-arrow-repeat spin' : 'bi-cloud-arrow-up'"
                  :title="getSyncTooltip()"
                ></i>
                <span 
                  v-if="syncStatus.pendingCount > 0" 
                  class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-warning"
                  style="font-size: 0.6rem;"
                >
                  {{ syncStatus.pendingCount }}
                </span>
              </span>
            </li>

                         <!-- Online Status Indicator -->
             <li class="nav-item">
               <span class="nav-link position-relative">
                 <i 
                   class="bi" 
                   :class="isOnline ? 'bi-wifi text-success' : 'bi-wifi-off text-danger'"
                   :title="`${isOnline ? 'Online' : 'Offline'} (Click to refresh)`"
                   @click="checkOnlineStatus"
                   style="cursor: pointer;"
                 ></i>
                 <span 
                   v-if="isOnline" 
                   class="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-success"
                   style="font-size: 0.5rem;"
                 >
                   ✓
                 </span>
               </span>
             </li>

            <!-- Dark Mode Toggle -->
            <li class="nav-item">
              <button @click="toggleDarkMode" class="btn btn-link nav-link">
                <i class="bi" :class="isDarkMode ? 'bi-sun' : 'bi-moon'"></i>
              </button>
            </li>

                         <!-- User Menu -->
             <li class="nav-item dropdown" v-if="isAuthenticated">
               <a
                 class="nav-link dropdown-toggle"
                 href="#"
                 role="button"
                 data-bs-toggle="dropdown"
                 aria-expanded="false"
                 ref="dropdownToggle"
                 @click="toggleUserMenu"
               >
                 <i class="bi bi-person-circle"></i>
                 {{ currentUser?.name || 'User' }}
               </a>
               <ul class="dropdown-menu" :class="{ show: showUserMenu }">
                 <li>
                   <a class="dropdown-item" href="#" @click.prevent="logout">
                     <i class="bi bi-box-arrow-right"></i>
                     Logout
                   </a>
                 </li>
               </ul>
             </li>

            <!-- Login Link -->
            <li class="nav-item" v-if="!isAuthenticated">
              <router-link class="nav-link" to="/login">
                <i class="bi bi-box-arrow-in-right"></i>
                Login
              </router-link>
            </li>
          </ul>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <main class="main-content">
      <router-view />
    </main>

    <!-- Offline Notification -->
    <div 
      v-if="!isOnline" 
      class="alert alert-warning alert-dismissible fade show position-fixed bottom-0 end-0 m-3"
      role="alert"
    >
      <i class="bi bi-exclamation-triangle"></i>
      You're currently offline. Some features may be limited.
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    </div>

    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, nextTick, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAppStore } from '@/stores/app';

const router = useRouter();
const appStore = useAppStore();

// User menu state
const showUserMenu = ref(false);

const isOnline = computed(() => appStore.isOnline);
const isDarkMode = computed(() => appStore.isDarkMode);
const isLoading = computed(() => appStore.isLoading);
const currentUser = computed(() => appStore.currentUser);
const isAuthenticated = computed(() => appStore.isAuthenticated);
const syncStatus = computed(() => appStore.syncStatus);

const navbarClass = computed(() => ({
  'navbar-dark bg-dark': isDarkMode.value,
  'navbar-light bg-light': !isDarkMode.value,
}));

const toggleDarkMode = () => {
  appStore.toggleDarkMode();
};

const logout = () => {
  console.log('🔍 [AppLayout] logout called');
  console.log('🔍 [AppLayout] Current user before logout:', appStore.currentUser);
  appStore.logout();
  console.log('🔍 [AppLayout] User logged out, redirecting to login');
  router.push('/login');
  console.log('🔍 [AppLayout] Logout completed');
};

const getSyncTooltip = () => {
  if (syncStatus.value.isSyncing) {
    return 'Syncing...';
  }
  if (syncStatus.value.pendingCount > 0) {
    return `Pending ${syncStatus.value.pendingCount} operations`;
  }
  return 'Synced';
};

const toggleUserMenu = () => {
  console.log('🔍 [AppLayout] toggleUserMenu called');
  console.log('🔍 [AppLayout] Current showUserMenu value:', showUserMenu.value);
  showUserMenu.value = !showUserMenu.value;
  console.log('🔍 [AppLayout] New showUserMenu value:', showUserMenu.value);
};

const checkOnlineStatus = () => {
  console.log('🔍 [AppLayout] Manual online status check triggered');
  const currentStatus = navigator.onLine;
  console.log('🔍 [AppLayout] Current navigator.onLine status:', currentStatus);
  console.log('🔍 [AppLayout] Current appStore.isOnline value:', isOnline.value);
  appStore.setOnlineStatus(currentStatus);
  console.log('🔍 [AppLayout] Manual online status check completed');
};

// Ensure Bootstrap dropdowns work properly
onMounted(async () => {
  console.log('🔍 [AppLayout] Component mounted');
  await nextTick();
  
  console.log('🔍 [AppLayout] Setting up Bootstrap dropdowns...');
  
  // Function to initialize Bootstrap dropdowns
  const initializeBootstrapDropdowns = () => {
    if (typeof window !== 'undefined' && (window as any).bootstrap) {
      const { Dropdown } = (window as any).bootstrap;
      const dropdownElementList = document.querySelectorAll('.dropdown-toggle');
      console.log('🔍 [AppLayout] Found dropdown elements:', dropdownElementList.length);
      dropdownElementList.forEach(dropdownToggleEl => {
        try {
          new Dropdown(dropdownToggleEl);
        } catch (error) {
          console.warn('🔍 [AppLayout] Failed to initialize dropdown:', error);
        }
      });
      console.log('🔍 [AppLayout] Bootstrap dropdowns initialized successfully');
      return true;
    } else {
      console.log('🔍 [AppLayout] Bootstrap not yet available, will retry...');
      return false;
    }
  };
  
  // Try to initialize immediately
  let bootstrapInitialized = initializeBootstrapDropdowns();
  
  // If not available, retry with increasing delays
  if (!bootstrapInitialized) {
    const retryDelays = [100, 500, 1000, 2000];
    
    retryDelays.forEach((delay, index) => {
      setTimeout(() => {
        if (!bootstrapInitialized) {
          console.log(`🔍 [AppLayout] Retry ${index + 1}: Attempting Bootstrap initialization after ${delay}ms...`);
          bootstrapInitialized = initializeBootstrapDropdowns();
        }
      }, delay);
    });
  }
  
  // Add click outside handler to close user menu
  console.log('🔍 [AppLayout] Setting up click outside handler...');
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (!target.closest('.dropdown')) {
      if (showUserMenu.value) {
        console.log('🔍 [AppLayout] Click outside dropdown detected, closing user menu');
        showUserMenu.value = false;
      }
    }
  });
  
  // Listen for online status changes
  console.log('🔍 [AppLayout] Setting up online status change listener...');
  document.addEventListener('onlineStatusChanged', (event: any) => {
    console.log('🔍 [AppLayout] Online status change event received:', event.detail);
    // Force reactivity update
    appStore.$patch({ isOnline: event.detail.isOnline });
    console.log('🔍 [AppLayout] Online status updated via patch');
  });
  
  console.log('🔍 [AppLayout] Component mount completed');
});
</script>

<style lang="scss" scoped>
.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;

  &.dark-mode {
    background-color: #1a1a1a;
    color: #ffffff;
  }
}

.navbar {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.navbar-brand {
  font-weight: bold;
  
  i {
    margin-right: 0.5rem;
  }
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: color 0.2s ease;
  
  i {
    font-size: 1.1rem;
  }
  
  &.active {
    font-weight: 600;
    color: #007bff !important;
  }
  
  &:hover {
    color: #0056b3 !important;
  }
}

  .main-content {
    flex: 1;
    padding: 2rem 2rem 2rem 2rem;
  }

  // Sync indicator styles
  .spin {
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

// Dark mode overrides
.dark-mode {
  .navbar-light {
    background-color: #2d2d2d !important;
    border-bottom: 1px solid #444;
    
    .navbar-brand,
    .nav-link {
      color: #ffffff !important;
    }
    
    .nav-link.active {
      color: #4dabf7 !important;
    }
    
    .nav-link:hover {
      color: #74c0fc !important;
    }
    
    .navbar-toggler {
      border-color: #666;
      
      .navbar-toggler-icon {
        background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 30 30'%3e%3cpath stroke='rgba%28255, 255, 255, 0.55%29' stroke-linecap='round' stroke-miterlimit='10' stroke-width='2' d='m4 7h22M4 15h22M4 23h22'/%3e%3c/svg%3e");
      }
    }
  }
  
  .dropdown-menu {
    background-color: #2d2d2d;
    border-color: #444;
    
    .dropdown-item {
      color: #ffffff;
      
      &:hover {
        background-color: #444;
      }
    }
  }
}

// Responsive navigation improvements
@media (max-width: 991.98px) {
  .navbar-collapse {
    margin-top: 1rem;
    
    .navbar-nav {
      margin-bottom: 1rem;
    }
  }
}
</style>
