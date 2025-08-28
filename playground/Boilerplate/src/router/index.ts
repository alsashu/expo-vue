import { createRouter, createWebHistory } from 'vue-router'
import Dashboard from '@/views/Dashboard.vue'
import ItemsView from '@/views/ItemsView.vue'
import DiagramView from '@/views/DiagramView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env?.BASE_URL || '/'),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: Dashboard
    },
    {
      path: '/items',
      name: 'items',
      component: ItemsView
    },
    {
      path: '/diagram',
      name: 'diagram',
      component: DiagramView
    }
  ]
})

export default router