import { standings } from '@/assets/data/england'
import DomesticLeaguePage from '@/pages/DomesticLeaguePage.vue'
import HomePage from '@/pages/HomePage.vue'
import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes: [
    {
      name: 'home',
      path: '/',
      component: HomePage,
    },
    {
      name: 'league',
      path: '/domestic',
      component: DomesticLeaguePage,
    },
  ],
})

export default router
