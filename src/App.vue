<template>
  <div class="app-layout">
    <!-- 顶部导航 -->
    <header class="app-header">
      <div class="header-inner">
        <!-- Logo -->
        <div class="logo" @click="$router.push('/home')">
          <span class="logo-icon">🐾</span>
          <span class="logo-text">WebXR 宠物商城</span>
        </div>

        <!-- 导航菜单 -->
        <nav class="nav-links">
          <router-link to="/home" class="nav-item">首页</router-link>
          <router-link to="/products" class="nav-item">全部商品</router-link>
          <router-link to="/pets" class="nav-item">宠物档案</router-link>
        </nav>

        <!-- 右侧操作 -->
        <div class="header-actions">
          <!-- 购物车 -->
          <div class="cart-btn" @click="$router.push('/cart')">
            <van-badge :content="cartCount || ''" max="99">
              <van-icon name="cart-o" size="22" />
            </van-badge>
            <span>购物车</span>
          </div>

          <!-- 已登录：用户菜单 -->
          <div class="user-menu" v-if="user" @click="toggleUserMenu" ref="userMenuRef">
            <van-icon name="manager-o" size="22" />
            <span>{{ userLabel }}</span>
            <van-icon name="arrow-down" size="12" />

            <div class="dropdown" v-show="showUserMenu">
              <div class="dropdown-item" @click.stop="$router.push('/pets'); showUserMenu = false">
                🐾 我的宠物
              </div>
              <div class="dropdown-item" @click.stop="$router.push('/cart'); showUserMenu = false">
                🛒 购物车
              </div>
              <div class="dropdown-divider"></div>
              <div class="dropdown-item danger" @click.stop="handleLogout">
                退出登录
              </div>
            </div>
          </div>

          <!-- 未登录 -->
          <div class="login-btn" v-else @click="$router.push('/login')">
            <van-icon name="manager-o" size="22" />
            <span>登录</span>
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容 -->
    <main class="app-main">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast } from 'vant'
import { supabase } from './lib/supabaseClient.js'

const router = useRouter()
const user = ref(null)
const cartCount = ref(0)
const showUserMenu = ref(false)
const userMenuRef = ref(null)

const userLabel = computed(() => {
  if (!user.value) return ''
  return user.value.email?.split('@')[0] || '我的'
})

// 关闭下拉菜单（点击外部）
function handleOutsideClick(e) {
  if (userMenuRef.value && !userMenuRef.value.contains(e.target)) {
    showUserMenu.value = false
  }
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

async function handleLogout() {
  showUserMenu.value = false
  await supabase.auth.signOut()
  user.value = null
  cartCount.value = 0
  showSuccessToast('已退出登录')
  router.push('/home')
}

async function loadCartCount() {
  if (!user.value) { cartCount.value = 0; return }
  const { count } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.value.id)
  cartCount.value = count || 0
}

onMounted(async () => {
  // 初始化认证状态
  const { data: { user: u } } = await supabase.auth.getUser()
  user.value = u
  if (u) loadCartCount()

  // 监听认证变化
  supabase.auth.onAuthStateChange((event, session) => {
    user.value = session?.user || null
    if (user.value) loadCartCount()
    else cartCount.value = 0
  })

  document.addEventListener('click', handleOutsideClick)
})

onUnmounted(() => {
  document.removeEventListener('click', handleOutsideClick)
})
</script>

<style>
/* 全局重置 */
* { margin: 0; padding: 0; box-sizing: border-box; }

html, body, #app {
  width: 100%;
  height: 100%;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background: #f5f5f5;
  color: #333;
  margin: 0;
  overflow-x: hidden; /* ✅ 关键：禁止横向溢出 */
  -webkit-text-size-adjust: 100%;
}

a { text-decoration: none; color: inherit; }

/* 媒体元素默认不撑破容器 */
img, video, canvas {
  max-width: 100%;
  height: auto;
  display: block;
}

.app-layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

/* 顶部导航 */
.app-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: white;
  box-shadow: 0 1px 8px rgba(0,0,0,0.06);
  height: 64px;
}

.header-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 40px;
  display: flex;
  align-items: center;
  gap: 40px;
  min-width: 0; /* ✅ 防止 flex 子元素把容器撑爆 */
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  flex-shrink: 0;
}
.logo-icon { font-size: 28px; }
.logo-text { font-size: 18px; font-weight: 700; color: #FF6B35; }

.nav-links {
  display: flex;
  gap: 8px;
  flex: 1;
  min-width: 0; /* ✅ 防溢出 */
}
.nav-item {
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 15px;
  color: #666;
  transition: all 0.2s;
  white-space: nowrap;
}
.nav-item:hover { color: #FF6B35; background: #FFF5F0; }
.nav-item.router-link-active {
  color: #FF6B35;
  font-weight: 600;
  border-bottom: 2px solid #FF6B35;
  border-radius: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.cart-btn, .login-btn, .user-menu {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  color: #666;
  transition: all 0.2s;
  position: relative;
  user-select: none;
  white-space: nowrap;
}
.cart-btn:hover, .login-btn:hover, .user-menu:hover {
  color: #FF6B35;
  background: #FFF5F0;
}

/* 用户下拉菜单 */
.dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background: white;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.12);
  min-width: 160px;
  overflow: hidden;
  z-index: 200;
}
.dropdown-item {
  padding: 12px 16px;
  font-size: 14px;
  color: #333;
  cursor: pointer;
  transition: background 0.15s;
  display: flex;
  align-items: center;
  gap: 8px;
}
.dropdown-item:hover { background: #f8f8f8; }
.dropdown-item.danger { color: #ee0a24; }
.dropdown-item.danger:hover { background: #fff5f5; }
.dropdown-divider { height: 1px; background: #f0f0f0; margin: 4px 0; }

/* 主内容区 */
.app-main {
  flex: 1;
  padding: 32px 40px;
}
.container {
  max-width: 1280px;
  margin: 0 auto;
  min-width: 0; /* ✅ 防止子元素溢出 */
}

/* ✅✅✅ 移动端适配：关键就在这里 */
@media (max-width: 768px) {
  .app-header { height: auto; } /* 手机端允许内容自然高度 */

  .header-inner {
    padding: 10px 12px; /* ✅ 手机端不要40px */
    gap: 10px;          /* ✅ 手机端不要40px */
  }

  .logo-text { font-size: 15px; }

  /* 方案1：隐藏中间菜单（推荐，手机用底部 tabbar） */
  .nav-links { display: none; }

  /* 如果你想保留顶部菜单（可滚动），用下面替换上一行：
  .nav-links { display: flex; overflow-x: auto; -webkit-overflow-scrolling: touch; }
  .nav-links::-webkit-scrollbar { display: none; }
  */

  .cart-btn span, .login-btn span, .user-menu span { display: none; } /* ✅ 图标更省空间 */

  .app-main {
    padding: 12px; /* ✅ 手机端缩小 padding */
  }
}
</style>