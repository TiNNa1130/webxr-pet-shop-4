<template>
  <div class="product-card" @click="goDetail">
    <div class="image-wrapper">
      <van-image :src="imageUrl" fit="cover" class="product-image">
        <template #error>
          <div class="image-error">{{ product.name?.slice(0, 6) }}</div>
        </template>
        <template #loading>
          <van-loading type="spinner" size="20" />
        </template>
      </van-image>
      <div class="tags" v-if="product.has_3d_model || product.has_ar">
        <van-tag type="primary" size="small" v-if="product.has_3d_model">3D</van-tag>
        <van-tag color="#4ECDC4" size="small" v-if="product.has_ar">AR</van-tag>
      </div>
    </div>
    <div class="info">
      <div class="name">{{ product.name }}</div>
      <div class="price-row">
        <span class="price">¥{{ product.price }}</span>
        <span class="original" v-if="product.original_price">¥{{ product.original_price }}</span>
      </div>
      <div class="meta">
        <span class="rating" v-if="product.avg_rating">
          <van-icon name="star" color="#FFD700" size="12" />
          {{ product.avg_rating }}
        </span>
        <span class="sold">已售{{ product.sold_count || 0 }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  product: { type: Object, required: true }
})

const router = useRouter()

const imageUrl = computed(() => {
  // 优先使用封面图，否则使用占位图
  if (props.product.cover_image_url && !props.product.cover_image_url.includes('placehold')) {
    return props.product.cover_image_url
  }
  // 根据商品类型生成不同颜色的占位图
  const colors = {
    'clothing': 'FF6B35',
    'furniture': 'C68642',
    'accessory': '4ECDC4',
    'toy': 'FFE66D',
    'food': '95E1D3',
    'other': '999999'
  }
  const color = colors[props.product.category] || 'FF6B35'
  const text = encodeURIComponent(props.product.name?.slice(0, 8) || '商品')
  return `https://placehold.co/300x300/${color}/white?text=${text}`
})

function goDetail() {
  router.push('/product/' + props.product.id)
}
</script>

<style scoped>
.product-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

.image-wrapper {
  position: relative;
  width: 100%;
  padding-top: 100%;
}

.product-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.image-error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #FF6B35, #FF8F65);
  color: white;
  font-size: 14px;
  font-weight: 600;
}

.tags {
  position: absolute;
  top: 8px;
  left: 8px;
  display: flex;
  gap: 4px;
}

.info {
  padding: 10px;
}

.name {
  font-size: 13px;
  color: #333;
  line-height: 1.4;
  height: 36px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.price-row {
  margin-top: 6px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.price {
  font-size: 16px;
  font-weight: 600;
  color: #FF6B35;
}

.original {
  font-size: 11px;
  color: #999;
  text-decoration: line-through;
}

.meta {
  margin-top: 6px;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #999;
}

.rating {
  display: flex;
  align-items: center;
  gap: 2px;
}
</style>