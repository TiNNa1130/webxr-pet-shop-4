<template>
  <div class="home-page">
    <!-- Banner 区域 -->
    <div class="banner-section">
      <van-swipe :autoplay="4000" indicator-color="#FF6B35" class="banner-swipe">
        <van-swipe-item>
          <div class="banner-item banner-1">
            <div class="banner-text">
              <h1>3D 虚拟试穿</h1>
              <p>基于参数化建模，为你的宠物找到最合身的衣服</p>
              <van-button type="primary" round @click="$router.push('/products')">立即体验</van-button>
            </div>
          </div>
        </van-swipe-item>
        <van-swipe-item>
          <div class="banner-item banner-2">
            <div class="banner-text">
              <h1>AR 实景预览</h1>
              <p>大件宠物家居，一键投射到你的真实空间</p>
              <van-button type="primary" round @click="$router.push('/products')">查看商品</van-button>
            </div>
          </div>
        </van-swipe-item>
      </van-swipe>
    </div>

    <!-- 核心功能区 -->
    <div class="section">
      <h2 class="section-title">核心功能</h2>
      <div class="feature-grid">
        <div class="feature-card" @click="$router.push('/products')">
          <div class="feature-icon" style="background: linear-gradient(135deg, #FF6B35, #FF8F65);">
            <van-icon name="shop-o" size="32" color="white" />
          </div>
          <h3>商品浏览</h3>
          <p>浏览全部宠物服饰与家居商品</p>
        </div>
        <div class="feature-card" @click="$router.push('/pets')">
          <div class="feature-icon" style="background: linear-gradient(135deg, #4ECDC4, #7BDDD5);">
            <van-icon name="smile-o" size="32" color="white" />
          </div>
          <h3>宠物档案</h3>
          <p>录入宠物体型参数，获取精准尺码推荐</p>
        </div>
        <div class="feature-card" @click="goTryOn">
          <div class="feature-icon" style="background: linear-gradient(135deg, #FFB347, #FFCC70);">
            <van-icon name="eye-o" size="32" color="white" />
          </div>
          <h3>虚拟试穿</h3>
          <p>3D 模型实时预览穿戴效果</p>
        </div>
        <div class="feature-card" @click="goAR">
          <div class="feature-icon" style="background: linear-gradient(135deg, #95E1D3, #B8EBE0);">
            <van-icon name="scan" size="32" color="white" />
          </div>
          <h3>AR 体验</h3>
          <p>增强现实，家居商品实景摆放</p>
        </div>
      </div>
    </div>

    <!-- 热门商品区 -->
    <div class="section">
      <div class="section-header">
        <h2 class="section-title">热门商品</h2>
        <span class="view-more" @click="$router.push('/products')">查看更多 →</span>
      </div>
      <div class="product-grid">
        <div class="product-card" v-for="p in hotProducts" :key="p.id" @click="goProduct(p.id)">
          <div class="product-image" :style="{ background: getColor(p.category) }">
            <span>{{ p.shortName }}</span>
            <div class="product-tags">
              <van-tag type="primary" size="small" v-if="p.has_3d_model">3D</van-tag>
              <van-tag color="#4ECDC4" size="small" v-if="p.has_ar">AR</van-tag>
            </div>
          </div>
          <div class="product-info">
            <div class="product-name">{{ p.name }}</div>
            <div class="product-price">
              <span class="current">¥{{ p.price }}</span>
              <span class="original" v-if="p.original_price">¥{{ p.original_price }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getProducts } from '../services/productsService.js'

const router = useRouter()
const hotProducts = ref([])

const colorMap = {
  'clothing': 'linear-gradient(135deg, #FF6B35, #FF8F65)',
  'furniture': 'linear-gradient(135deg, #C68642, #D4A574)',
  'accessory': 'linear-gradient(135deg, #4ECDC4, #7BDDD5)',
  'toy': 'linear-gradient(135deg, #FFE66D, #FFF0A5)',
  'food': 'linear-gradient(135deg, #95E1D3, #B8EBE0)',
  'other': 'linear-gradient(135deg, #999, #bbb)'
}

function getColor(cat) {
  return colorMap[cat] || colorMap['other']
}

onMounted(async () => {
  const data = await getProducts({ limit: 8 })
  hotProducts.value = data.map(p => ({
    ...p,
    shortName: p.name.slice(0, 6)
  }))
})

function goProduct(id) {
  router.push('/product/' + id)
}

function goTryOn() {
  showToast('请先选择商品和宠物')
  router.push('/products')
}

function goAR() {
  showToast('请在商品详情页体验AR功能')
  router.push('/products')
}
</script>

<style scoped>
.home-page {
  padding-bottom: 40px;
}

/* Banner */
.banner-section {
  margin-bottom: 40px;
}

.banner-swipe {
  border-radius: 16px;
  overflow: hidden;
}

.banner-item {
  height: 320px;
  display: flex;
  align-items: center;
  padding: 60px;
}

.banner-1 {
  background: linear-gradient(135deg, #FF6B35 0%, #FF8F65 50%, #FFB088 100%);
}

.banner-2 {
  background: linear-gradient(135deg, #4ECDC4 0%, #7BDDD5 50%, #A8EBE4 100%);
}

.banner-text {
  color: white;
}

.banner-text h1 {
  font-size: 36px;
  margin-bottom: 16px;
}

.banner-text p {
  font-size: 16px;
  opacity: 0.9;
  margin-bottom: 24px;
}

/* Section */
.section {
  margin-bottom: 40px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 22px;
  font-weight: 600;
  color: #333;
  margin-bottom: 24px;
}

.section-header .section-title {
  margin-bottom: 0;
}

.view-more {
  font-size: 14px;
  color: #FF6B35;
  cursor: pointer;
}

/* Feature Grid */
.feature-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.feature-card {
  background: white;
  border-radius: 16px;
  padding: 30px 24px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.feature-icon {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 16px;
}

.feature-card h3 {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.feature-card p {
  font-size: 13px;
  color: #999;
  line-height: 1.5;
}

/* Product Grid */
.product-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
}

.product-image {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 18px;
  font-weight: 600;
  position: relative;
}

.product-tags {
  position: absolute;
  top: 12px;
  left: 12px;
  display: flex;
  gap: 6px;
}

.product-info {
  padding: 16px;
}

.product-name {
  font-size: 14px;
  color: #333;
  line-height: 1.5;
  height: 42px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  margin-bottom: 8px;
}

.product-price .current {
  font-size: 18px;
  font-weight: 600;
  color: #FF6B35;
}

.product-price .original {
  font-size: 13px;
  color: #999;
  text-decoration: line-through;
  margin-left: 8px;
}

@media (max-width: 768px) {
  .home-page { padding-bottom: 80px; }

  .banner-section { margin-bottom: 20px; }
  .banner-item {
    height: 220px;
    padding: 18px;
  }

  .banner-text h1 { font-size: 22px; margin-bottom: 10px; }
  .banner-text p { font-size: 13px; margin-bottom: 14px; }

  .section { margin-bottom: 22px; }
  .section-title { font-size: 18px; margin-bottom: 14px; }
  .section-header { margin-bottom: 14px; }

  .feature-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .feature-card { padding: 16px 12px; border-radius: 12px; }
  .feature-icon { width: 52px; height: 52px; border-radius: 14px; }

  .product-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
  .product-image { height: 140px; font-size: 16px; }
  .product-info { padding: 12px; }
  .product-price .current { font-size: 16px; }
}
</style>