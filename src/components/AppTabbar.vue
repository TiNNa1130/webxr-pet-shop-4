<template>
  <div class="tabbar-wrapper">
    <van-tabbar v-model="active" active-color="#FF6B35" inactive-color="#999">
      <van-tabbar-item name="home" icon="home-o" to="/home">首页</van-tabbar-item>
      <van-tabbar-item name="products" icon="shop-o" to="/products">商品</van-tabbar-item>
      <van-tabbar-item name="pets" icon="smile-o" to="/pets">宠物</van-tabbar-item>
      <van-tabbar-item name="cart" icon="cart-o" to="/cart" :badge="cartCount || ''">购物车</van-tabbar-item>
      <van-tabbar-item name="user" icon="user-o" @click="handleUserClick">
        {{ isLoggedIn ? '我的' : '登录' }}
      </van-tabbar-item>
    </van-tabbar>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../lib/supabaseClient.js'

const route = useRoute()
const router = useRouter()
const active = ref('home')
const cartCount = ref(0)
const isLoggedIn = ref(false)

const tabMap = {
  '/home': 'home',
  '/products': 'products',
  '/pets': 'pets',
  '/cart': 'cart',
  '/login': 'user'
}

watch(() => route.path, (path) => {
  if (path.startsWith('/product/')) {
    active.value = 'products'
  } else {
    active.value = tabMap[path] || 'home'
  }
}, { immediate: true })

async function checkAuth() {
  const { data: { user } } = await supabase.auth.getUser()
  isLoggedIn.value = !!user
}

function handleUserClick() {
  if (isLoggedIn.value) {
    // 已登录，可以跳转到个人中心（暂时跳到宠物页）
    router.push('/pets')
  } else {
    router.push('/login')
  }
}

onMounted(() => {
  checkAuth()
  supabase.auth.onAuthStateChange(() => {
    checkAuth()
  })
})
</script>

<style scoped>
.tabbar-wrapper {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 100;
}
</style>