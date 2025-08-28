import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'), // Changed from @views to @/views
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
    component: () => import('@/views/Grid.vue'), // Changed from @views to @/views
    meta: {
      title: 'Data Grid',
      icon: 'mdi:table',
      showInNav: true,
      keepAlive: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router

export const getNavigationRoutes = () => {
  return routes.filter(route => route.meta?.showInNav === true)
}