import { createRouter, createWebHistory } from 'vue-router'

import DashboardView from '../views/DashboardView.vue'
import AnimalsView from '../views/AnimalsView.vue'
import HealthView from '../views/HealthView.vue'
import BreedingView from '../views/BreedingView.vue'
import ProductionView from '../views/ProductionView.vue'
import ExpensesView from '../views/ExpensesView.vue'
import SalesView from '../views/SalesView.vue'
import ReportsView from '../views/ReportsView.vue'
import UsersView from '../views/UsersView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import { hasRouteAccess } from '../utils/rbac'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', component: LoginView, meta: { public: true } },
    { path: '/register', component: RegisterView, meta: { public: true } },
    { path: '/', component: DashboardView, meta: { routeKey: 'dashboard' } },
    { path: '/animals', component: AnimalsView, meta: { routeKey: 'animals' } },
    { path: '/health', component: HealthView, meta: { routeKey: 'health' } },
    { path: '/breeding', component: BreedingView, meta: { routeKey: 'breeding' } },
    { path: '/production', component: ProductionView, meta: { routeKey: 'production' } },
    { path: '/expenses', component: ExpensesView, meta: { routeKey: 'expenses' } },
    { path: '/sales', component: SalesView, meta: { routeKey: 'sales' } },
    { path: '/reports', component: ReportsView, meta: { routeKey: 'reports' } },
    { path: '/users', component: UsersView, meta: { routeKey: 'users' } }
  ]
})

router.beforeEach((to) => {
  const token = localStorage.getItem('farmpro_token')
  const role = localStorage.getItem('farmpro_role') || ''
  if (!to.meta.public && !token) {
    return '/login'
  }
  if (to.meta.public && token) {
    return '/'
  }
  if (!to.meta.public && to.meta.routeKey && role && !hasRouteAccess(role, to.meta.routeKey)) {
    return '/'
  }
  return true
})

export default router
