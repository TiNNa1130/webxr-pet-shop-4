import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/home' },
  { path: '/home', component: () => import('../pages/HomePage.vue'), meta: { title: '首页' } },
  { path: '/products', component: () => import('../pages/ProductListPage.vue'), meta: { title: '商品' } },
  { path: '/product/:id', component: () => import('../pages/ProductDetailPage.vue'), meta: { title: '商品详情' } },
  { path: '/pets', component: () => import('../pages/PetProfilePage.vue'), meta: { title: '我的宠物' } },
  { path: '/cart', component: () => import('../pages/CartPage.vue'), meta: { title: '购物车' } },
  { path: '/login', component: () => import('../pages/LoginPage.vue'), meta: { title: '登录' } }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  document.title = to.meta.title || 'WebXR宠物商城'
  next()
})

export default router