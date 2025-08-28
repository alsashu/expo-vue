import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { AppState, Item } from '@/types';
import { storageService } from '@/services/storage';
import { syncService } from '@/services/sync';

export const useAppStore = defineStore('app', () => {
  // State
  const isOnline = ref(navigator.onLine);
  const isDarkMode = ref(false);
  const pendingSync = ref<Item[]>([]);
  const isLoading = ref(false);
  const currentUser = ref<any>(null);
  const syncStatus = ref({
    pendingCount: 0,
    isSyncing: false,
    lastSync: undefined as string | undefined
  });

  // Computed
  const isAuthenticated = computed(() => !!currentUser.value);

  // Actions
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value;
    document.documentElement.classList.toggle('dark', isDarkMode.value);
    storageService.saveSetting('darkMode', isDarkMode.value);
  };

  const setOnlineStatus = (status: boolean) => {
    const previousStatus = isOnline.value;
    console.log('🔍 [AppStore] setOnlineStatus called:', { from: previousStatus, to: status });
    
    isOnline.value = status;
    
    console.log(`🔍 [AppStore] Online status changed from ${previousStatus} to ${status}`);
    
    // Auto-sync when coming back online
    if (status && !previousStatus) {
      console.log('🔍 [AppStore] Back online, checking for pending sync operations...');
      // Delay sync to ensure network is stable
      setTimeout(() => {
        console.log('🔍 [AppStore] Delayed sync check triggered');
        checkAndSyncPendingOperations();
      }, 1000);
    }
    
    // Update UI immediately
    console.log('🔍 [AppStore] Dispatching onlineStatusChanged event');
    document.dispatchEvent(new CustomEvent('onlineStatusChanged', { detail: { isOnline: status } }));
    console.log('🔍 [AppStore] setOnlineStatus completed');
  };

  const addToPendingSync = (item: Item) => {
    pendingSync.value.push(item);
    updateSyncStatus();
  };

  const removeFromPendingSync = (itemId: number | string) => {
    pendingSync.value = pendingSync.value.filter(item => item.id !== itemId);
    updateSyncStatus();
  };

  const clearPendingSync = () => {
    pendingSync.value = [];
    updateSyncStatus();
  };

  const updateSyncStatus = async () => {
    try {
      const status = await syncService.getSyncStatus();
      syncStatus.value = {
        pendingCount: status.pendingCount,
        isSyncing: status.isSyncing,
        lastSync: status.lastSync || undefined
      };
    } catch (error) {
      console.error('Failed to update sync status:', error);
    }
  };

  const checkAndSyncPendingOperations = async () => {
    if (!isOnline.value) return;
    
    try {
      await updateSyncStatus();
      
      if (syncStatus.value.pendingCount > 0) {
        console.log(`Found ${syncStatus.value.pendingCount} pending operations, starting sync...`);
        await syncPendingItems();
      }
    } catch (error) {
      console.error('Failed to check pending operations:', error);
    }
  };

  const syncPendingItems = async () => {
    if (!isOnline.value || syncStatus.value.isSyncing) return;

    isLoading.value = true;
    try {
      const result = await syncService.syncPendingOperations();
      
      if (result.success) {
        console.log(`Sync completed: ${result.synced} synced, ${result.failed} failed`);
        
        if (result.synced > 0) {
          // Clear pending sync from local state
          clearPendingSync();
          
          // Update sync status
          await updateSyncStatus();
          
          // Save last sync timestamp
          await storageService.saveSetting('lastSync', new Date().toISOString());
        }
        
        if (result.failed > 0) {
          console.warn('Some operations failed to sync:', result.errors);
        }
      } else {
        console.error('Sync failed:', result.errors);
      }
      
      return result;
    } catch (error) {
      console.error('Failed to sync pending items:', error);
      throw error;
    } finally {
      isLoading.value = false;
    }
  };

  const setCurrentUser = (user: any) => {
    console.log('🔍 [AppStore] setCurrentUser called with user:', user);
    currentUser.value = user;
    localStorage.setItem('user', JSON.stringify(user));
    console.log('🔍 [AppStore] User saved to localStorage');
    console.log('🔍 [AppStore] Current user state:', currentUser.value);
  };

  const logout = () => {
    console.log('🔍 [AppStore] logout called');
    console.log('🔍 [AppStore] Current user before logout:', currentUser.value);
    currentUser.value = null;
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    console.log('🔍 [AppStore] User data cleared from localStorage');
    console.log('🔍 [AppStore] Current user after logout:', currentUser.value);
  };

  const checkAuthValidity = () => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('auth_token');
    
    console.log('🔍 [AppStore] Checking auth validity:', {
      hasUser: !!savedUser,
      hasToken: !!savedToken,
      currentUser: currentUser.value
    });
    
    if (!savedUser || !savedToken) {
      console.log('🔍 [AppStore] Auth validation failed - missing user or token');
      logout();
      return false;
    }
    
    if (!currentUser.value) {
      console.log('🔍 [AppStore] Auth validation failed - user not in store');
      logout();
      return false;
    }
    
    console.log('🔍 [AppStore] Auth validation passed');
    return true;
  };

  const initializeApp = async () => {
    console.log('🔍 [AppStore] initializeApp called');
    
    // Load saved settings
    console.log('🔍 [AppStore] Loading saved dark mode setting...');
    const savedDarkMode = await storageService.getSetting('darkMode');
    if (savedDarkMode !== undefined) {
      console.log('🔍 [AppStore] Dark mode setting found:', savedDarkMode);
      isDarkMode.value = savedDarkMode;
      document.documentElement.classList.toggle('dark', isDarkMode.value);
      console.log('🔍 [AppStore] Dark mode applied to DOM');
    } else {
      console.log('🔍 [AppStore] No dark mode setting found, using default');
    }

    // Load saved user with better error handling
    console.log('🔍 [AppStore] Loading saved user from localStorage...');
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('auth_token');
      
      console.log('🔍 [AppStore] localStorage contents:', { 
        user: savedUser, 
        token: savedToken,
        userExists: !!savedUser,
        tokenExists: !!savedToken
      });
      
      if (savedUser && savedToken) {
        const parsedUser = JSON.parse(savedUser);
        currentUser.value = parsedUser;
        console.log('🔍 [AppStore] User restored from localStorage:', currentUser.value);
        console.log('🔍 [AppStore] Authentication state restored successfully');
      } else if (savedUser && !savedToken) {
        console.warn('🔍 [AppStore] User found but no auth token - clearing user data');
        localStorage.removeItem('user');
        currentUser.value = null;
      } else if (!savedUser && savedToken) {
        console.warn('🔍 [AppStore] Auth token found but no user - clearing token');
        localStorage.removeItem('auth_token');
      } else {
        console.log('🔍 [AppStore] No saved user or token found - user needs to login');
      }
    } catch (error) {
      console.error('🔍 [AppStore] Error restoring user from localStorage:', error);
      // Clear corrupted data
      localStorage.removeItem('user');
      localStorage.removeItem('auth_token');
      console.log('🔍 [AppStore] Corrupted data cleared from localStorage');
    }

    // Set up online/offline listeners with immediate status check
    console.log('🔍 [AppStore] Setting up online/offline listeners...');
    const updateOnlineStatus = () => {
      const online = navigator.onLine;
      console.log('🔍 [AppStore] Network status changed:', online ? 'Online' : 'Offline');
      setOnlineStatus(online);
    };

    // Set initial online status
    console.log('🔍 [AppStore] Setting initial online status...');
    updateOnlineStatus();
    
    // Add event listeners
    console.log('🔍 [AppStore] Adding event listeners...');
    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
    
    // Also listen for visibility change to detect when user returns to tab
    let visibilityCheckTimeout: ReturnType<typeof setTimeout> | null = null;
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Debounce visibility checks to avoid excessive calls
        if (visibilityCheckTimeout) {
          clearTimeout(visibilityCheckTimeout);
        }
        visibilityCheckTimeout = setTimeout(() => {
          console.log('🔍 [AppStore] Tab became visible, checking online status...');
          updateOnlineStatus();
        }, 1000); // Wait 1 second before checking
      }
    });

    // Initial sync status check
    console.log('🔍 [AppStore] Performing initial sync status check...');
    await updateSyncStatus();
    
    // Set up periodic online status check (every 30 seconds)
    console.log('🔍 [AppStore] Setting up periodic online status check...');
    setInterval(() => {
      const currentOnlineStatus = navigator.onLine;
      if (currentOnlineStatus !== isOnline.value) {
        console.log('🔍 [AppStore] Periodic check: online status mismatch, updating...');
        setOnlineStatus(currentOnlineStatus);
      }
    }, 30000);
    
    // Log final authentication state
    console.log('🔍 [AppStore] Final authentication state:', {
      isAuthenticated: isAuthenticated.value,
      currentUser: currentUser.value,
      hasUser: !!currentUser.value,
      hasToken: !!localStorage.getItem('auth_token')
    });
    
    // Validate authentication state
    if (isAuthenticated.value) {
      console.log('🔍 [AppStore] Validating authentication state...');
      checkAuthValidity();
    }
    
    console.log('🔍 [AppStore] initializeApp completed');
  };

  return {
    // State
    isOnline,
    isDarkMode,
    pendingSync,
    isLoading,
    currentUser,
    syncStatus,

    // Computed
    isAuthenticated,

    // Actions
    toggleDarkMode,
    setOnlineStatus,
    addToPendingSync,
    removeFromPendingSync,
    clearPendingSync,
    syncPendingItems,
    checkAndSyncPendingOperations,
    updateSyncStatus,
    setCurrentUser,
    logout,
    checkAuthValidity,
    initializeApp,
  };
});
