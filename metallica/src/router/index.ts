import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUIStore } from '@/stores/ui'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@views/Home.vue'),
    meta: {
      title: 'Dashboard',
      icon: 'mdi:home',
      showInNav: true,
      keepAlive: false
    }
  },
  {
    path: '/grid',
    name: 'Grid',
    component: () => import('@views/Grid.vue'),
    meta: {
      title: 'Data Grid',
      icon: 'mdi:table',
      showInNav: true,
      keepAlive: true,
      description: 'Manage railway network data with advanced grid features'
    }
  },
  {
    path: '/diagram',
    name: 'Diagram',
    component: () => import('@views/Diagram.vue'),
    meta: {
      title: 'Network Diagram',
      icon: 'mdi:graph',
      showInNav: true,
      keepAlive: true,
      description: 'Visual railway network design and editing'
    }
  },
  {
    path: '/analytics',
    name: 'Analytics',
    component: () => import('@views/Analytics.vue'),
    meta: {
      title: 'Analytics',
      icon: 'mdi:chart-line',
      showInNav: true,
      keepAlive: false,
      description: 'Railway network performance analytics and insights'
    }
  },
  {
    path: '/settings',
    name: 'Settings',
    component: () => import('@views/Settings.vue'),
    meta: {
      title: 'Settings',
      icon: 'mdi:cog',
      showInNav: false,
      keepAlive: false
    }
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('@views/About.vue'),
    meta: {
      title: 'About',
      icon: 'mdi:information',
      showInNav: false,
      keepAlive: false
    }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@views/NotFound.vue'),
    meta: {
      title: '404 - Page Not Found',
      showInNav: false,
      keepAlive: false
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// Navigation guards
router.beforeEach(async (to, from, next) => {
  const uiStore = useUIStore()
  
  // Set loading state
  uiStore.setLoading(true)
  
  // Update page title
  const title = to.meta?.title as string || 'Smart Railway Network Designer'
  document.title = `${title} | Railway Designer`
  
  // Track route changes for analytics
  if (import.meta.env.PROD) {
    // Add your analytics tracking here
    console.log(`Navigation: ${from.path} → ${to.path}`)
  }
  
  next()
})

router.afterEach(() => {
  const uiStore = useUIStore()
  uiStore.setLoading(false)
})

router.onError((error) => {
  console.error('Router error:', error)
  const uiStore = useUIStore()
  uiStore.setLoading(false)
  uiStore.addNotification({
    type: 'error',
    title: 'Navigation Error',
    message: 'Failed to load the requested page. Please try again.'
  })
})

export default router

// Export route utilities
export const getRoutesByMeta = (metaKey: string, value: any) => {
  return routes.filter(route => route.meta?.[metaKey] === value)
}

export const getNavigationRoutes = () => {
  return routes.filter(route => route.meta?.showInNav === true)
}