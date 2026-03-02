<template>
  <van-popup
    v-model:show="show"
    position="bottom"
    round
    :style="{ height: '90%' }"
    safe-area-inset-bottom
  >
    <div class="tryon-panel">
      <!-- 头部 -->
      <div class="tryon-header">
        <h2>虚拟试穿</h2>
        <van-icon name="cross" size="20" @click="show = false" style="cursor:pointer" />
      </div>

      <div class="tryon-body">
        <!-- 左侧：3D 展示区 -->
        <div class="tryon-3d">
          <div class="model-wrap" ref="modelContainerRef">
            <ThreeModelViewer
              v-if="activeModelUrl"
              :modelUrl="activeModelUrl"
              :modelSize="1.0"
              :petScale="petScale"
              style="height:100%"
            />
            <div v-else class="model-placeholder">
              <van-icon name="photo-o" size="60" color="#ddd" />
              <p>请先选择宠物以查看试穿效果</p>
            </div>
          </div>

          <!-- 尺码推荐结果 -->
          <div class="size-result" v-if="selectedPet && sizeMatch">
            <div class="size-result-badge">
              <span class="size-label">推荐尺码</span>
              <span class="size-value">{{ sizeMatch.size }}</span>
            </div>
            <div class="size-details">
              <span class="fit-type" :class="getFitClass(sizeMatch.fit_type)">{{ sizeMatch.fit_type }}</span>
              <van-progress
                :percentage="Math.round((sizeMatch.confidence || 0) * 100)"
                color="#FF6B35"
                :show-pivot="true"
                stroke-width="6"
                style="flex:1"
              />
            </div>
            <div class="scale-display">
              3D缩放: X={{ petScale.scaleX.toFixed(2) }} · Y={{ petScale.scaleY.toFixed(2) }} · Z={{ petScale.scaleZ.toFixed(2) }}
            </div>
          </div>
        </div>

        <!-- 右侧：选择区 -->
        <div class="tryon-controls">
          <!-- 商品信息 -->
          <div class="product-info-bar" v-if="product">
            <div class="product-thumb" :style="{ background: getColor(product.category) }">
              <img v-if="productImage" :src="productImage" style="width:100%;height:100%;object-fit:cover" />
            </div>
            <div>
              <div class="product-title">{{ product.name }}</div>
              <div class="product-price">¥{{ product.price }}</div>
            </div>
          </div>

          <!-- 选择宠物 -->
          <div class="control-section">
            <div class="control-title">
              <van-icon name="smile-o" /> 选择宠物
            </div>

            <div v-if="loadingPets" class="pets-loading">
              <van-loading size="24" color="#FF6B35" />
            </div>

            <div v-else-if="pets.length === 0" class="no-pets">
              <p>还没有宠物档案</p>
              <van-button size="small" type="primary" round @click="goToPets">去添加宠物</van-button>
            </div>

            <div class="pet-list" v-else>
              <div
                v-for="pet in pets"
                :key="pet.id"
                class="pet-option"
                :class="{ active: selectedPet?.id === pet.id }"
                @click="selectPet(pet)"
              >
                <span class="pet-emoji">{{ pet.species === 'dog' ? '🐕' : '🐈' }}</span>
                <div class="pet-option-info">
                  <div class="pet-name">{{ pet.name }}</div>
                  <div class="pet-params">{{ pet.chest_cm }}cm · {{ pet.back_length_cm }}cm</div>
                </div>
                <van-tag v-if="pet.recommended_size" color="#FF6B35" text-color="white" size="small">
                  {{ pet.recommended_size.size }}
                </van-tag>
              </div>
            </div>
          </div>

          <!-- 选择颜色/尺码 -->
          <div class="control-section" v-if="skus.length > 0">
            <div class="control-title">
              <van-icon name="label-o" /> 选择规格
            </div>
            <div class="sku-options" v-if="colors.length">
              <span
                v-for="c in colors" :key="c"
                class="sku-chip"
                :class="{ active: selectedColor === c }"
                @click="selectedColor = c"
              >{{ c }}</span>
            </div>
            <div class="sku-options" v-if="sizes.length" style="margin-top:8px">
              <span
                v-for="s in sizes" :key="s"
                class="sku-chip"
                :class="{ active: selectedSize === s }"
                @click="selectedSize = s"
              >{{ s }}</span>
            </div>
          </div>

          <!-- 参数化算法说明 -->
          <div class="algo-note" v-if="selectedPet">
            <div class="algo-title">📐 参数化适配算法</div>
            <div class="algo-row">
              <span>胸围 {{ selectedPet.chest_cm }}cm</span>
              <span class="algo-arrow">→</span>
              <span>X/Z轴 ×{{ petScale.scaleX.toFixed(2) }}</span>
            </div>
            <div class="algo-row">
              <span>背长 {{ selectedPet.back_length_cm }}cm</span>
              <span class="algo-arrow">→</span>
              <span>Y轴 ×{{ petScale.scaleY.toFixed(2) }}</span>
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="tryon-actions">
            <van-button
              type="primary" block round size="large"
              :disabled="!selectedPet"
              @click="addToCart"
            >
              加入购物车
            </van-button>
            <van-button block round plain size="large" @click="show = false">
              继续浏览
            </van-button>
          </div>
        </div>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { showSuccessToast, showToast } from 'vant'
import ThreeModelViewer from './ThreeModelViewer.vue'
import { getMyPets, calculateModelScale, matchProductSize } from '../services/petsService.js'
import { supabase } from '../lib/supabaseClient.js'

const props = defineProps({
  modelValue: Boolean,
  product: Object
})
const emit = defineEmits(['update:modelValue', 'addToCart'])
const router = useRouter()

const show = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
})

const pets = ref([])
const loadingPets = ref(false)
const selectedPet = ref(null)
const selectedColor = ref('')
const selectedSize = ref('')

const colorMap = {
  'clothing': 'linear-gradient(135deg, #FF6B35, #FF8F65)',
  'furniture': 'linear-gradient(135deg, #C68642, #D4A574)',
  'other': 'linear-gradient(135deg, #999, #bbb)'
}
function getColor(cat) { return colorMap[cat] || colorMap.other }

const skus = computed(() => props.product?.product_skus || [])
const colors = computed(() => [...new Set(skus.value.map(s => s.color_name).filter(Boolean))])
const sizes  = computed(() => [...new Set(skus.value.map(s => s.size_name).filter(Boolean))])

const activeModelUrl = computed(() => {
  const models = props.product?.product_models || []
  if (!models.length) return ''
  // 优先找当前颜色SKU对应的模型，否则取第一个clothing_display
  const m = models.find(x => x.model_type === 'clothing_display') || models[0]
  return m?.draco_url || m?.model_url || ''
})

const productImage = computed(() => {
  const p = props.product
  if (!p) return null
  if (p.cover_image_url && !p.cover_image_url.includes('placehold')) return p.cover_image_url
  const imgs = typeof p.image_urls === 'string' ? JSON.parse(p.image_urls || '[]') : (p.image_urls || [])
  return imgs.find(u => u && !u.includes('placehold')) || null
})

const petScale = computed(() => {
  if (!selectedPet.value) return { scaleX: 1, scaleY: 1, scaleZ: 1 }
  return calculateModelScale(selectedPet.value)
})

const sizeMatch = computed(() => {
  if (!selectedPet.value || !props.product?.size_chart) return null
  const chart = typeof props.product.size_chart === 'string'
    ? JSON.parse(props.product.size_chart)
    : props.product.size_chart
  return matchProductSize(selectedPet.value, chart)
})

function getFitClass(fitType) {
  if (!fitType) return ''
  if (fitType.includes('偏紧')) return 'fit-tight'
  if (fitType.includes('偏松') || fitType.includes('宽松')) return 'fit-loose'
  return 'fit-perfect'
}

function selectPet(pet) {
  selectedPet.value = pet
  // 根据推荐尺码自动选中
  if (sizeMatch.value?.size && sizes.value.includes(sizeMatch.value.size)) {
    selectedSize.value = sizeMatch.value.size
  }
}

function goToPets() {
  show.value = false
  router.push('/pets')
}

async function loadPets() {
  loadingPets.value = true
  try {
    pets.value = await getMyPets()
    if (pets.value.length > 0 && !selectedPet.value) {
      selectPet(pets.value[0])
    }
  } finally {
    loadingPets.value = false
  }
}

function addToCart() {
  emit('addToCart', {
    product: props.product,
    pet: selectedPet.value,
    color: selectedColor.value,
    size: selectedSize.value || sizeMatch.value?.size,
    sizeMatch: sizeMatch.value
  })
  showSuccessToast('已加入购物车')
  show.value = false
}

watch(() => props.modelValue, (v) => {
  if (v) loadPets()
})
</script>

<style scoped>
.tryon-panel { display: flex; flex-direction: column; height: 100%; }

.tryon-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.tryon-header h2 { font-size: 18px; font-weight: 600; color: #333; }

.tryon-body {
  flex: 1; overflow: hidden;
  display: flex; gap: 0;
}

/* 左侧 3D */
.tryon-3d {
  flex: 1;
  display: flex; flex-direction: column;
  padding: 20px;
  border-right: 1px solid #f0f0f0;
  background: #fafafa;
}

.model-wrap {
  flex: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
  min-height: 0;
}

.model-placeholder {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  color: #bbb; font-size: 14px;
}

.size-result {
  margin-top: 16px;
  background: white;
  border-radius: 12px;
  padding: 14px 16px;
  flex-shrink: 0;
}

.size-result-badge { display: flex; align-items: center; gap: 12px; margin-bottom: 10px; }
.size-label { font-size: 12px; color: #999; }
.size-value { font-size: 28px; font-weight: 700; color: #FF6B35; }
.size-details { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
.fit-type { font-size: 13px; font-weight: 500; white-space: nowrap; }
.fit-perfect { color: #4ECDC4; }
.fit-tight { color: #FF6B35; }
.fit-loose { color: #FFB347; }

.scale-display { font-size: 11px; color: #bbb; font-family: monospace; }

/* 右侧控制 */
.tryon-controls {
  width: 320px; flex-shrink: 0;
  display: flex; flex-direction: column;
  overflow-y: auto;
  padding: 16px;
  gap: 16px;
}

.product-info-bar {
  display: flex; gap: 12px; align-items: center;
  background: #f8f8f8; border-radius: 10px; padding: 12px;
}
.product-thumb {
  width: 52px; height: 52px; border-radius: 8px;
  flex-shrink: 0; overflow: hidden;
}
.product-title { font-size: 13px; color: #333; line-height: 1.4; margin-bottom: 4px; }
.product-price { font-size: 16px; font-weight: 600; color: #FF6B35; }

.control-section { background: white; border-radius: 10px; padding: 14px; }
.control-title { font-size: 13px; font-weight: 600; color: #333; margin-bottom: 12px; display: flex; align-items: center; gap: 6px; }

.pets-loading { display: flex; justify-content: center; padding: 16px; }
.no-pets { text-align: center; padding: 16px; font-size: 13px; color: #999; }
.no-pets p { margin-bottom: 10px; }

.pet-list { display: flex; flex-direction: column; gap: 8px; }
.pet-option {
  display: flex; align-items: center; gap: 10px;
  padding: 10px 12px; border-radius: 8px;
  border: 1.5px solid #eee; cursor: pointer;
  transition: all 0.2s;
}
.pet-option:hover { border-color: #FFB088; background: #FFF8F5; }
.pet-option.active { border-color: #FF6B35; background: #FFF3EE; }
.pet-emoji { font-size: 24px; }
.pet-option-info { flex: 1; }
.pet-name { font-size: 14px; font-weight: 600; color: #333; }
.pet-params { font-size: 12px; color: #999; margin-top: 2px; }

.sku-options { display: flex; flex-wrap: wrap; gap: 6px; }
.sku-chip {
  padding: 5px 14px; border-radius: 20px;
  border: 1px solid #ddd; font-size: 13px;
  cursor: pointer; transition: all 0.2s;
}
.sku-chip:hover { border-color: #FF6B35; }
.sku-chip.active { border-color: #FF6B35; color: #FF6B35; background: #FFF3EE; }

.algo-note {
  background: linear-gradient(135deg, #FFF5F2, #FFF8F5);
  border: 1px solid #FFD5C0;
  border-radius: 10px; padding: 12px 14px;
}
.algo-title { font-size: 12px; font-weight: 600; color: #FF6B35; margin-bottom: 8px; }
.algo-row { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #666; margin-bottom: 4px; }
.algo-arrow { color: #FF6B35; font-weight: 700; }

.tryon-actions { display: flex; flex-direction: column; gap: 10px; margin-top: auto; padding-top: 8px; }

/* ✅ 虚拟试穿弹窗：移动端自适应 */
@media (max-width: 768px) {
  .tryon-header {
    padding: 14px 14px 12px;
  }

  .tryon-body {
    flex-direction: column;   /* ✅ 左右 -> 上下 */
    overflow: auto;
  }

  /* 上半：3D 区 */
  .tryon-3d {
    padding: 12px;
    border-right: none;
    border-bottom: 1px solid #f0f0f0;
  }

  .model-wrap {
    height: 42vh;             /* ✅ 给 3D 一个稳定高度 */
    min-height: 260px;
  }

  .size-result { margin-top: 12px; }

  /* 下半：控制区 */
  .tryon-controls {
    width: 100%;              /* ✅ 取消 320px 固定宽 */
    padding: 12px;
    gap: 12px;
  }

  .product-info-bar { padding: 10px; }
  .control-section { padding: 12px; }

  /* chip 太密就允许横向滚动也行（可选） */
  .sku-options {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    flex-wrap: nowrap;
  }
  .sku-options::-webkit-scrollbar { display: none; }
  .sku-chip { white-space: nowrap; flex-shrink: 0; }
}

</style>