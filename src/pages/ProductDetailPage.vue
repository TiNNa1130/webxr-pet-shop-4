<template>
  <div class="product-detail-page">
    <div class="loading-state" v-if="loading">
      <van-loading type="spinner" color="#FF6B35" />
    </div>

    <div class="detail-content" v-else-if="product">
      <!-- 左侧媒体区 -->
      <div class="media-section">
        <div class="main-media">
          <!-- 3D 模型 -->
          <div v-if="product.has_3d_model && show3D" class="model-box">
            <ThreeModelViewer :modelUrl="modelUrl" :modelSize="1.2" style="height:100%" />
          </div>
          <!-- 商品图片 -->
          <div v-else class="image-box">
            <img v-if="coverImage" :src="coverImage" :alt="product.name" class="cover-img" @error="coverImage = null" />
            <div v-else class="image-fallback" :style="{ background: getColor(product.category) }">
              <span>{{ product.name.slice(0, 8) }}</span>
            </div>
          </div>
        </div>

        <!-- 切换按钮 -->
        <div class="media-actions">
          <van-button v-if="product.has_3d_model" :type="show3D ? 'primary' : 'default'" size="small" @click="show3D = true">3D 查看</van-button>
          <van-button size="small" :type="!show3D ? 'primary' : 'default'" @click="show3D = false">图片</van-button>
          <van-button v-if="product.has_ar" size="small" type="success" @click="openAR">
            <van-icon name="scan" /> AR 体验
          </van-button>
        </div>
      </div>

      <!-- 右侧信息区 -->
      <div class="info-section">
        <div class="product-tags">
          <van-tag type="primary" v-if="product.has_3d_model">3D展示</van-tag>
          <van-tag color="#4ECDC4" v-if="product.has_ar">AR体验</van-tag>
          <van-tag color="#FF6B35" v-if="product.has_try_on">虚拟试穿</van-tag>
        </div>
        <h1 class="product-name">{{ product.name }}</h1>
        <div class="product-meta">
          <span class="rating">
            <van-rate v-model="product.avg_rating" readonly allow-half size="14" color="#FFD700" />
            {{ product.avg_rating || 0 }} 分
          </span>
          <span class="sold">已售 {{ product.sold_count || 0 }}</span>
          <span class="views">浏览 {{ product.view_count || 0 }}</span>
        </div>
        <div class="price-box">
          <span class="current-price">¥{{ product.price }}</span>
          <span class="original-price" v-if="product.original_price">¥{{ product.original_price }}</span>
          <van-tag type="danger" v-if="discount">{{ discount }}折</van-tag>
        </div>

        <!-- SKU -->
        <div class="sku-section" v-if="skus.length > 0">
          <div class="sku-group" v-if="colors.length">
            <label>颜色</label>
            <div class="sku-options">
              <span v-for="c in colors" :key="c" class="sku-item" :class="{ active: selectedColor === c }" @click="selectedColor = c">{{ c }}</span>
            </div>
          </div>
          <div class="sku-group" v-if="sizes.length">
            <label>尺码</label>
            <div class="sku-options">
              <span v-for="s in sizes" :key="s" class="sku-item" :class="{ active: selectedSize === s }" @click="selectedSize = s">{{ s }}</span>
            </div>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <van-button v-if="product.has_try_on" type="warning" size="large" round @click="showTryOn = true">
            🐾 虚拟试穿
          </van-button>
          <van-button type="primary" size="large" round :loading="addingCart" @click="addToCart">加入购物车</van-button>
          <van-button type="danger" size="large" round @click="buyNow">立即购买</van-button>
        </div>

        <div class="description">
          <h3>商品详情</h3>
          <p>{{ product.description || '暂无详细描述' }}</p>
        </div>

        <!-- 尺码表 -->
        <div class="size-chart" v-if="product.size_chart">
          <h3>尺码参考</h3>
          <div class="size-table">
            <div class="size-row size-header">
              <span>尺码</span><span>胸围</span><span>背长</span><span>体重</span>
            </div>
            <div class="size-row" v-for="(v, k) in parsedSizeChart" :key="k">
              <span class="size-name-cell">{{ k }}</span>
              <span>{{ v.chest_cm || v.chest || '-' }}</span>
              <span>{{ v.back_cm || v.back || '-' }}</span>
              <span>{{ v.weight_kg || '-' }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 虚拟试穿弹窗 -->
    <TryOnModal
      v-model="showTryOn"
      :product="product"
      @addToCart="handleTryOnAdd"
    />

    <!-- AR model-viewer（家具类） -->
    <van-popup v-model:show="showAR" position="bottom" round :style="{ height: '80%' }">
      <div class="ar-panel">
        <div class="ar-panel-header">
          <h3>AR 实景预览</h3>
          <van-icon name="cross" size="20" @click="showAR = false" style="cursor:pointer" />
        </div>
        <div class="ar-content">
          <model-viewer
            v-if="arModelUrl"
            :src="arModelUrl"
            ar
            ar-modes="webxr scene-viewer quick-look"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style="width:100%;height:100%"
          >
            <van-button slot="ar-button" type="success" round size="large" style="margin:16px">
              📱 在真实环境中查看
            </van-button>
          </model-viewer>
          <div v-else class="ar-no-model">
            <van-icon name="scan" size="60" color="#ddd" />
            <p>暂无 AR 模型</p>
          </div>
        </div>
      </div>
    </van-popup>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import ThreeModelViewer from '../components/ThreeModelViewer.vue'
import TryOnModal from '../components/TryOnModal.vue'
import { getProductById } from '../services/productsService.js'
import { supabase } from '../lib/supabaseClient.js'

const route = useRoute()
const loading = ref(true)
const addingCart = ref(false)
const product = ref(null)
const skus = ref([])
const models = ref([])
const show3D = ref(false)
const showTryOn = ref(false)
const showAR = ref(false)
const selectedColor = ref('')
const selectedSize = ref('')
const coverImage = ref(null)

const colorMap = {
  'clothing': 'linear-gradient(135deg, #FF6B35, #FF8F65)',
  'furniture': 'linear-gradient(135deg, #C68642, #D4A574)',
  'accessory': 'linear-gradient(135deg, #4ECDC4, #7BDDD5)',
  'toy': 'linear-gradient(135deg, #FFE66D, #FFF0A5)',
  'other': 'linear-gradient(135deg, #999, #bbb)'
}
function getColor(cat) { return colorMap[cat] || colorMap.other }

const colors = computed(() => [...new Set(skus.value.map(s => s.color_name).filter(Boolean))])
const sizes  = computed(() => [...new Set(skus.value.map(s => s.size_name).filter(Boolean))])

const discount = computed(() => {
  if (product.value?.original_price && product.value?.price) {
    return Math.round((product.value.price / product.value.original_price) * 10)
  }
  return null
})

const modelUrl = computed(() => {
  const m = models.value.find(x => x.model_type === 'clothing_display') || models.value[0]
  if (m) return m.draco_url || m.model_url
  return ''
})

const arModelUrl = computed(() => {
  const m = models.value.find(x => x.model_type === 'ar_furniture') || models.value[0]
  if (m) return m.draco_url || m.model_url
  return ''
})

const parsedSizeChart = computed(() => {
  if (!product.value?.size_chart) return {}
  return typeof product.value.size_chart === 'string'
    ? JSON.parse(product.value.size_chart)
    : product.value.size_chart
})

function getProductImage(p) {
  if (p.cover_image_url && !p.cover_image_url.includes('placehold')) return p.cover_image_url
  const imgs = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls || '[]') : (p.image_urls || [])
  return imgs.find(u => u && !u.includes('placehold')) || null
}

function openAR() {
  if (product.value?.has_ar) {
    showAR.value = true
  } else {
    showToast('该商品暂不支持AR体验')
  }
}

async function addToCart(opts = {}) {
  addingCart.value = true
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { showToast('请先登录'); return }

    const selectedSku = skus.value.find(s =>
      (!selectedColor.value || s.color_name === selectedColor.value) &&
      (!selectedSize.value || s.size_name === selectedSize.value)
    )

    await supabase.from('cart_items').upsert({
      user_id: user.id,
      product_id: product.value.id,
      sku_id: selectedSku?.id || null,
      pet_id: opts.pet?.id || null,
      quantity: 1,
      snapshot_price: product.value.price,
      snapshot_name: product.value.name,
      is_checked: true
    }, {
      onConflict: 'user_id,product_id,sku_id,pet_id',
      ignoreDuplicates: false
    })

    showSuccessToast('已加入购物车')
  } catch (e) {
    console.error(e)
    showToast('加入购物车失败')
  } finally {
    addingCart.value = false
  }
}

function handleTryOnAdd(data) { addToCart(data) }
function buyNow() { showToast('结算功能即将上线') }

onMounted(async () => {
  const id = route.params.id
  if (id) {
    const data = await getProductById(id)
    if (data) {
      product.value = data
      skus.value = data.product_skus || []
      models.value = data.product_models || []
      coverImage.value = getProductImage(data)
      if (colors.value.length) selectedColor.value = colors.value[0]
      if (sizes.value.length) selectedSize.value = sizes.value[0]
      if (data.has_3d_model) show3D.value = true
    }
  }
  loading.value = false
})
</script>

<style scoped>
.product-detail-page { padding-bottom: 40px; }
.loading-state { display: flex; justify-content: center; padding: 100px 0; }

.detail-content { display: flex; gap: 40px; background: white; border-radius: 16px; padding: 30px; }

.media-section { width: 480px; flex-shrink: 0; }
.main-media { width: 100%; aspect-ratio: 1/1; border-radius: 12px; overflow: hidden; background: #f5f5f5; }
.model-box { width: 100%; height: 100%; }
.image-box { width: 100%; height: 100%; }
.cover-img { width: 100%; height: 100%; object-fit: cover; display: block; }
.image-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 32px; font-weight: 600; }
.media-actions { display: flex; gap: 10px; margin-top: 16px; }

.info-section { flex: 1; min-width: 0; }
.product-tags { display: flex; gap: 8px; margin-bottom: 16px; }
.product-name { font-size: 24px; font-weight: 600; color: #333; line-height: 1.4; margin-bottom: 16px; }
.product-meta { display: flex; align-items: center; gap: 20px; font-size: 14px; color: #999; margin-bottom: 20px; }
.rating { display: flex; align-items: center; gap: 6px; }

.price-box { background: #FFF5F2; padding: 20px; border-radius: 12px; margin-bottom: 24px; display: flex; align-items: baseline; gap: 12px; }
.current-price { font-size: 32px; font-weight: 600; color: #FF6B35; }
.original-price { font-size: 16px; color: #999; text-decoration: line-through; }

.sku-section { margin-bottom: 24px; }
.sku-group { margin-bottom: 16px; }
.sku-group label { display: block; font-size: 14px; font-weight: 500; color: #333; margin-bottom: 10px; }
.sku-options { display: flex; flex-wrap: wrap; gap: 10px; }
.sku-item { padding: 8px 20px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; cursor: pointer; transition: all 0.2s; }
.sku-item:hover { border-color: #FF6B35; }
.sku-item.active { border-color: #FF6B35; color: #FF6B35; background: #FFF5F2; }

.action-buttons { display: flex; gap: 12px; margin-bottom: 30px; }
.action-buttons .van-button { flex: 1; height: 48px; }

.description { border-top: 1px solid #eee; padding-top: 24px; margin-bottom: 24px; }
.description h3, .size-chart h3 { font-size: 16px; font-weight: 600; color: #333; margin-bottom: 12px; }
.description p { font-size: 14px; color: #666; line-height: 1.8; }

/* 尺码表 */
.size-chart { border-top: 1px solid #eee; padding-top: 24px; }
.size-table { border: 1px solid #eee; border-radius: 8px; overflow: hidden; font-size: 13px; }
.size-row { display: grid; grid-template-columns: 60px 1fr 1fr 1fr; text-align: center; padding: 10px 0; border-bottom: 1px solid #f5f5f5; }
.size-row:last-child { border-bottom: none; }
.size-header { background: #f8f8f8; font-weight: 600; color: #666; }
.size-name-cell { font-weight: 600; color: #FF6B35; }

/* AR 面板 */
.ar-panel { display: flex; flex-direction: column; height: 100%; }
.ar-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 20px 24px; border-bottom: 1px solid #eee; }
.ar-panel-header h3 { font-size: 18px; font-weight: 600; }
.ar-content { flex: 1; overflow: hidden; background: #000; }
.ar-no-model { height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; background: #f0f0f0; color: #999; }
</style>