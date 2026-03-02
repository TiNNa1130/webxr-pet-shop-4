<template>
  <div class="cart-page">
    <div class="page-header">
      <h1>购物车</h1>
      <p>共 {{ cartItems.length }} 件商品</p>
    </div>

    <!-- 未登录 -->
    <div class="login-prompt" v-if="!isLoggedIn">
      <van-empty description="请先登录查看购物车">
        <van-button type="primary" round @click="$router.push('/login')">去登录</van-button>
      </van-empty>
    </div>

    <!-- 加载中 -->
    <div class="loading-state" v-else-if="loading">
      <van-loading type="spinner" color="#FF6B35" />
    </div>

    <!-- 空购物车 -->
    <van-empty v-else-if="cartItems.length === 0" description="购物车是空的">
      <van-button type="primary" round @click="$router.push('/products')">去逛逛</van-button>
    </van-empty>

    <!-- 购物车内容 -->
    <div class="cart-content" v-else>
      <!-- 商品列表 -->
      <div class="cart-list">
        <!-- 全选 -->
        <div class="select-all-bar">
          <van-checkbox v-model="allChecked" @change="toggleAll">全选</van-checkbox>
          <span class="delete-selected" @click="deleteSelected" v-if="selectedItems.length > 0">
            删除所选 ({{ selectedItems.length }})
          </span>
        </div>

        <div class="cart-item" v-for="item in cartItems" :key="item.id">
          <van-checkbox v-model="item.is_checked" @change="() => updateCheck(item)" />

          <!-- 商品图 -->
          <div class="item-image">
            <img
              v-if="getItemImage(item)"
              :src="getItemImage(item)"
              style="width:100%;height:100%;object-fit:cover;border-radius:8px"
            />
            <div v-else class="item-image-fallback" :style="{ background: getColor(item.products?.category) }">
              <span>{{ (item.snapshot_name || '').slice(0, 4) }}</span>
            </div>
          </div>

          <!-- 商品信息 -->
          <div class="item-info">
            <div class="item-name">{{ item.snapshot_name }}</div>
            <div class="item-sku" v-if="item.product_skus">
              {{ item.product_skus.color_name }} · {{ item.product_skus.size_name }}
            </div>
            <!-- 宠物试穿标记 -->
            <div class="item-pet" v-if="item.pets">
              <van-tag color="#FF6B35" size="small" plain>🐾 {{ item.pets.name }} 试穿推荐</van-tag>
            </div>
            <div class="item-price">¥{{ item.snapshot_price || item.products?.price }}</div>
          </div>

          <!-- 数量 -->
          <div class="item-qty">
            <van-stepper
              v-model="item.quantity"
              min="1" max="10"
              @change="(v) => updateQuantity(item, v)"
            />
          </div>

          <!-- 小计 -->
          <div class="item-subtotal">
            ¥{{ ((item.snapshot_price || item.products?.price || 0) * item.quantity).toFixed(2) }}
          </div>

          <!-- 删除 -->
          <van-button type="danger" plain size="small" round @click="removeItem(item)">删除</van-button>
        </div>
      </div>

      <!-- 结算栏 -->
      <div class="cart-summary">
        <div class="summary-card">
          <h3>订单摘要</h3>
          <div class="summary-row">
            <span>已选 {{ selectedItems.length }} 件</span>
            <span>¥{{ subtotal }}</span>
          </div>
          <div class="summary-row">
            <span>运费</span>
            <span class="free-ship">免运费</span>
          </div>
          <div class="summary-divider"></div>
          <div class="summary-row total">
            <span>合计</span>
            <span class="total-price">¥{{ subtotal }}</span>
          </div>

          <van-button
            type="primary" block round size="large"
            :disabled="selectedItems.length === 0"
            @click="checkout"
            style="margin-top:20px"
          >
            结算 ({{ selectedItems.length }})
          </van-button>

          <div class="security-note">
            <van-icon name="shield-o" /> 安全支付 · 7天无理由退换
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { supabase } from '../lib/supabaseClient.js'

const router = useRouter()
const isLoggedIn = ref(false)
const loading = ref(false)
const cartItems = ref([])

const colorMap = {
  'clothing': 'linear-gradient(135deg, #FF6B35, #FF8F65)',
  'furniture': 'linear-gradient(135deg, #C68642, #D4A574)',
  'accessory': 'linear-gradient(135deg, #4ECDC4, #7BDDD5)',
  'other': 'linear-gradient(135deg, #999, #bbb)'
}
function getColor(cat) { return colorMap[cat] || colorMap.other }

function getItemImage(item) {
  const p = item.products
  if (!p) return null
  if (p.cover_image_url && !p.cover_image_url.includes('placehold')) return p.cover_image_url
  const imgs = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls || '[]') : (p.image_urls || [])
  return imgs.find(u => u && !u.includes('placehold')) || null
}

const selectedItems = computed(() => cartItems.value.filter(i => i.is_checked))

const subtotal = computed(() => {
  return selectedItems.value
    .reduce((sum, i) => sum + (Number(i.snapshot_price || i.products?.price) || 0) * i.quantity, 0)
    .toFixed(2)
})

const allChecked = computed({
  get: () => cartItems.value.length > 0 && cartItems.value.every(i => i.is_checked),
  set: () => {}
})

function toggleAll(val) {
  cartItems.value.forEach(i => { i.is_checked = val })
}

async function loadCart() {
  loading.value = true
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select(`
        *,
        products ( id, name, price, category, cover_image_url, image_urls ),
        product_skus ( color_name, size_name ),
        pets ( name, species )
      `)
      .order('added_at', { ascending: false })

    if (error) throw error
    cartItems.value = data || []
  } catch (e) {
    console.error('加载购物车失败:', e)
    showToast('加载购物车失败')
  } finally {
    loading.value = false
  }
}

async function updateQuantity(item, qty) {
  await supabase.from('cart_items').update({ quantity: qty }).eq('id', item.id)
}

async function updateCheck(item) {
  await supabase.from('cart_items').update({ is_checked: item.is_checked }).eq('id', item.id)
}

async function removeItem(item) {
  try {
    await showConfirmDialog({ title: '删除商品', message: '确定从购物车移除吗？' })
    await supabase.from('cart_items').delete().eq('id', item.id)
    cartItems.value = cartItems.value.filter(i => i.id !== item.id)
    showSuccessToast('已删除')
  } catch (e) { /* 用户取消 */ }
}

async function deleteSelected() {
  try {
    await showConfirmDialog({ title: '批量删除', message: `确定删除选中的 ${selectedItems.value.length} 件商品吗？`, confirmButtonColor: '#ee0a24' })
    const ids = selectedItems.value.map(i => i.id)
    await supabase.from('cart_items').delete().in('id', ids)
    cartItems.value = cartItems.value.filter(i => !ids.includes(i.id))
    showSuccessToast('已删除')
  } catch (e) { /* 用户取消 */ }
}

function checkout() {
  showToast('结算功能开发中，敬请期待')
}

async function init() {
  const { data: { user } } = await supabase.auth.getUser()
  isLoggedIn.value = !!user
  if (user) loadCart()
}

onMounted(init)
</script>

<style scoped>
.cart-page { padding-bottom: 40px; }
.page-header { margin-bottom: 30px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #333; margin-bottom: 8px; }
.page-header p { font-size: 14px; color: #999; }
.login-prompt, .loading-state { padding: 60px 0; display: flex; justify-content: center; }

.cart-content { display: flex; gap: 30px; align-items: flex-start; }
.cart-list { flex: 1; min-width: 0; }

/* 全选栏 */
.select-all-bar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 14px 20px; background: white;
  border-radius: 10px; margin-bottom: 12px;
  font-size: 14px;
}
.delete-selected { color: #ee0a24; cursor: pointer; font-size: 13px; }

/* 购物车条目 */
.cart-item {
  display: flex; align-items: center; gap: 16px;
  padding: 20px; background: white;
  border-radius: 12px; margin-bottom: 12px;
  box-shadow: 0 1px 6px rgba(0,0,0,0.04);
}

.item-image {
  width: 80px; height: 80px; flex-shrink: 0;
  border-radius: 8px; overflow: hidden;
  background: #f5f5f5;
}
.item-image-fallback {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  color: white; font-size: 13px; font-weight: 600;
}

.item-info { flex: 1; min-width: 0; }
.item-name {
  font-size: 14px; font-weight: 500; color: #333;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  margin-bottom: 4px;
}
.item-sku { font-size: 12px; color: #999; margin-bottom: 4px; }
.item-pet { margin-bottom: 6px; }
.item-price { font-size: 15px; font-weight: 600; color: #FF6B35; }

.item-qty { flex-shrink: 0; }

.item-subtotal {
  min-width: 70px; text-align: right;
  font-size: 15px; font-weight: 600; color: #333;
}

/* 结算栏 */
.cart-summary { width: 300px; flex-shrink: 0; }
.summary-card {
  background: white; border-radius: 12px;
  padding: 24px; position: sticky; top: 80px;
}
.summary-card h3 { font-size: 18px; font-weight: 600; margin-bottom: 20px; }
.summary-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; color: #666; }
.free-ship { color: #4ECDC4; font-weight: 500; }
.summary-divider { border-top: 1px solid #eee; margin: 16px 0; }
.summary-row.total { font-weight: 600; color: #333; font-size: 16px; }
.total-price { font-size: 22px; color: #FF6B35; }

.security-note {
  margin-top: 14px; text-align: center;
  font-size: 12px; color: #bbb;
  display: flex; align-items: center; justify-content: center; gap: 4px;
}

@media (max-width: 768px) {
  .cart-page { padding-bottom: 80px; }

  .page-header { margin-bottom: 16px; }
  .page-header h1 { font-size: 20px; }

  .cart-content {
    flex-direction: column; /* ✅ 左右变上下 */
    gap: 12px;
  }

  .cart-summary {
    width: 100%;           /* ✅ 不再固定 300px */
    order: 2;
  }

  .summary-card {
    position: static;      /* ✅ 取消 sticky */
    top: auto;
    padding: 16px;
  }

  /* ✅ 购物车条目：允许换行，避免挤成一条 */
  .cart-item {
    flex-wrap: wrap;
    gap: 10px;
    padding: 14px;
  }

  .item-image { width: 64px; height: 64px; }
  .item-info { flex: 1 1 calc(100% - 64px - 40px); } /* 让信息区域更宽 */
  .item-qty { width: 100%; }
  .item-subtotal { width: 100%; text-align: left; }
  
  /* 删除按钮在手机上独占一行更舒服 */
  .cart-item .van-button {
    margin-left: auto;
  }

  .select-all-bar { padding: 12px 14px; border-radius: 12px; }
}

</style>