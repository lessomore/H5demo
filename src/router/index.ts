import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/HomePage.vue'),
    meta: { transition: 'fade' },
  },
  {
    path: '/level1',
    name: 'Level1',
    component: () => import('@/views/Level1/index.vue'),
    meta: { transition: 'slide-left' },
  },
  {
    path: '/level2',
    name: 'Level2',
    component: () => import('@/views/Level2/index.vue'),
    meta: { transition: 'slide-left' },
  },
  {
    path: '/level3',
    name: 'Level3',
    component: () => import('@/views/Level3/index.vue'),
    meta: { transition: 'slide-left' },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
