import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue')
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: () => import('../views/DashboardView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/items',
      name: 'items',
      component: () => import('../views/ItemsView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/diagram',
      name: 'diagram',
      component: () => import('../views/DiagramView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
    }
  ]
})

// Navigation guard for authentication
router.beforeEach(async (to, from, next) => {
  try {
    // Dynamically import the store to avoid initialization issues
    const { useAppStore } = await import('@/stores/app')
    const appStore = useAppStore()
    
    if (to.meta.requiresAuth && !appStore.isAuthenticated) {
      next('/login')
    } else {
      next()
    }
  } catch (error) {
    console.warn('Store not initialized yet, allowing navigation:', error)
    // If store is not initialized, allow navigation for now
    next()
  }
})

export default router
