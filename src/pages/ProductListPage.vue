<template>
  <div class="product-list-page">
    <div class="page-header">
      <h1>全部商品</h1>
      <p>共 {{ products.length }} 件商品</p>
    </div>

    <div class="page-content">
      <aside class="filter-sidebar">
        <div class="filter-group">
          <h3>商品分类</h3>
          <div class="filter-options">
            <div class="filter-item" :class="{ active: currentCat === '' }" @click="selectCat('')">全部商品</div>
            <div v-for="cat in categories" :key="cat.value" class="filter-item" :class="{ active: currentCat === cat.value }" @click="selectCat(cat.value)">{{ cat.label }}</div>
          </div>
        </div>
      </aside>

      <div class="product-area">
        <!-- 骨架屏 -->
        <div class="product-grid" v-if="loading">
          <div class="product-card skeleton-card" v-for="i in 6" :key="i">
            <div class="skeleton-image"></div>
            <div class="product-info">
              <div class="skeleton-line long"></div>
              <div class="skeleton-line short"></div>
              <div class="skeleton-line medium"></div>
            </div>
          </div>
        </div>

        <!-- 商品网格 -->
        <div class="product-grid" v-else>
          <div class="product-card" v-for="product in products" :key="product.id" @click="goProduct(product.id)">
            <div class="product-image-wrap">
              <img
                v-if="getImageUrl(product)"
                :src="getImageUrl(product)"
                :alt="product.name"
                class="product-img"
                @error="onImgError($event, product)"
              />
              <div v-else class="product-image-fallback" :style="{ background: getColor(product.category) }">
                <span>{{ product.name.slice(0, 6) }}</span>
              </div>
              <div class="product-tags">
                <van-tag type="primary" size="small" v-if="product.has_3d_model">3D</van-tag>
                <van-tag color="#4ECDC4" size="small" v-if="product.has_ar">AR</van-tag>
                <van-tag color="#FF6B35" size="small" v-if="product.has_try_on">试穿</van-tag>
              </div>
            </div>
            <div class="product-info">
              <div class="product-name">{{ product.name }}</div>
              <div class="product-meta">
                <span class="rating" v-if="product.avg_rating">
                  <van-icon name="star" color="#FFD700" /> {{ product.avg_rating }}
                </span>
                <span class="sold">已售 {{ product.sold_count || 0 }}</span>
              </div>
              <div class="product-price">
                <span class="current">¥{{ product.price }}</span>
                <span class="original" v-if="product.original_price">¥{{ product.original_price }}</span>
              </div>
            </div>
          </div>
        </div>

        <van-empty v-if="products.length === 0 && !loading" description="暂无商品" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getProducts, getCategories } from '../services/productsService.js'

const router = useRouter()
const products = ref([])
const categories = ref([])
const currentCat = ref('')
const loading = ref(false)
const imgErrorIds = ref(new Set())

const colorMap = {
  'clothing': 'linear-gradient(135deg, #FF6B35, #FF8F65)',
  'furniture': 'linear-gradient(135deg, #C68642, #D4A574)',
  'accessory': 'linear-gradient(135deg, #4ECDC4, #7BDDD5)',
  'toy': 'linear-gradient(135deg, #FFE66D, #FFF0A5)',
  'food': 'linear-gradient(135deg, #95E1D3, #B8EBE0)',
  'other': 'linear-gradient(135deg, #999, #bbb)'
}

function getColor(cat) { return colorMap[cat] || colorMap['other'] }

function getImageUrl(product) {
  if (imgErrorIds.value.has(product.id)) return null
  if (product.cover_image_url && !product.cover_image_url.includes('placehold')) {
    return product.cover_image_url
  }
  if (product.image_urls) {
    const imgs = typeof product.image_urls === 'string' ? JSON.parse(product.image_urls) : product.image_urls
    const real = Array.isArray(imgs) ? imgs.find(u => u && !u.includes('placehold')) : null
    if (real) return real
  }
  return null
}

function onImgError(e, product) {
  imgErrorIds.value = new Set([...imgErrorIds.value, product.id])
}

async function loadProducts() {
  loading.value = true
  try {
    products.value = await getProducts({ category: currentCat.value || null, limit: 20 })
  } finally {
    loading.value = false
  }
}

function selectCat(cat) { currentCat.value = cat; loadProducts() }
function goProduct(id) { router.push('/product/' + id) }

onMounted(() => { categories.value = getCategories(); loadProducts() })
</script>

<style scoped>
.product-list-page { padding-bottom: 40px; }
.page-header { margin-bottom: 24px; }
.page-header h1 { font-size: 28px; font-weight: 600; color: #333; margin-bottom: 8px; }
.page-header p { font-size: 14px; color: #999; }
.page-content { display: flex; gap: 30px; }

.filter-sidebar { width: 200px; flex-shrink: 0; }
.filter-group { background: white; border-radius: 12px; padding: 20px; position: sticky; top: 20px; }
.filter-group h3 { font-size: 15px; font-weight: 600; color: #333; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #eee; }
.filter-item { padding: 10px 12px; font-size: 14px; color: #666; border-radius: 8px; cursor: pointer; margin-bottom: 4px; transition: all 0.2s; }
.filter-item:hover { background: #f5f5f5; }
.filter-item.active { background: #FFF5F2; color: #FF6B35; font-weight: 500; }

.product-area { flex: 1; min-width: 0; }
.product-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }

.product-card { background: white; border-radius: 12px; overflow: hidden; cursor: pointer; transition: all 0.3s; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.product-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.10); }

.product-image-wrap { position: relative; width: 100%; aspect-ratio: 1 / 1; overflow: hidden; background: #f5f5f5; }
.product-img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.3s; display: block; }
.product-card:hover .product-img { transform: scale(1.05); }
.product-image-fallback { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; color: white; font-size: 18px; font-weight: 600; }
.product-tags { position: absolute; top: 10px; left: 10px; display: flex; gap: 5px; flex-wrap: wrap; }

.product-info { padding: 14px 16px 16px; }
.product-name { font-size: 14px; color: #333; line-height: 1.5; height: 42px; overflow: hidden; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; margin-bottom: 8px; }
.product-meta { display: flex; gap: 12px; font-size: 12px; color: #999; margin-bottom: 8px; }
.rating { display: flex; align-items: center; gap: 4px; }
.product-price .current { font-size: 18px; font-weight: 600; color: #FF6B35; }
.product-price .original { font-size: 13px; color: #bbb; text-decoration: line-through; margin-left: 8px; }

.skeleton-card { pointer-events: none; }
.skeleton-image { width: 100%; aspect-ratio: 1 / 1; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-line { height: 14px; border-radius: 6px; margin-bottom: 10px; background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
.skeleton-line.long { width: 90%; }
.skeleton-line.medium { width: 60%; }
.skeleton-line.short { width: 40%; }

@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}
</style>