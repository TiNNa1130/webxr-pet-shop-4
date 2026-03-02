<template>
  <!-- 
    3D 模型查看器组件
    
    功能说明：
    - 加载并展示 GLB/GLTF 格式 3D 模型
    - 支持触摸/鼠标旋转、缩放
    - 显示加载进度
    
    论文技术要点：
    - 基于 Three.js 实现 WebGL 渲染
    - 组件封装，可复用于不同页面
  -->
  <div class="model-viewer-container" ref="containerRef">
    <!-- 加载中状态 -->
    <div class="loading-overlay" v-if="loading">
      <van-loading type="spinner" color="#FF6B35" size="36" />
      <p class="loading-text">模型加载中 {{ progress }}%</p>
    </div>
    
    <!-- 加载失败状态 -->
    <div class="error-overlay" v-if="error">
      <van-icon name="warning-o" size="48" color="#999" />
      <p class="error-text">{{ error }}</p>
      <van-button size="small" @click="retryLoad">重新加载</van-button>
    </div>
    
    <!-- 操作提示 -->
    <div class="hint-overlay" v-if="!loading && !error && showHint">
      <van-icon name="gesture" class="gesture-icon" />
      <span>拖动旋转 · 双指缩放</span>
    </div>
    
    <!-- Three.js 渲染的 canvas 会被插入到这里 -->
  </div>
</template>

<script setup>
/**
 * 3D 模型查看器组件逻辑
 * 
 * 使用 Vue 3 组合式 API
 */
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { createScene } from '../xr/three/scene.js'
import { loadModel, normalizeModel, disposeLoaders } from '../xr/three/loaders.js'

// ========== Props 定义 ==========
const props = defineProps({
  // 模型文件 URL
  modelUrl: {
    type: String,
    default: ''
  },
  // 模型目标大小
  modelSize: {
    type: Number,
    default: 1
  },
  // 是否自动旋转
  autoRotate: {
    type: Boolean,
    default: false
  }
})

// ========== 响应式数据 ==========
const containerRef = ref(null)  // 容器 DOM 引用
const loading = ref(false)      // 加载状态
const progress = ref(0)         // 加载进度
const error = ref('')           // 错误信息
const showHint = ref(true)      // 是否显示操作提示

// ========== 内部变量 ==========
let sceneManager = null         // 场景管理器
let currentModel = null         // 当前加载的模型

// ========== 方法定义 ==========

/**
 * 初始化场景
 */
async function initScene() {
  if (!containerRef.value) return
  
  // 创建 Three.js 场景
  sceneManager = createScene(containerRef.value)
  
  // 如果有初始模型 URL，加载它
  if (props.modelUrl) {
    await loadModelFromUrl(props.modelUrl)
  }
  
  // 3秒后隐藏操作提示
  setTimeout(() => {
    showHint.value = false
  }, 3000)
}

/**
 * 加载模型
 */
async function loadModelFromUrl(url) {
  if (!sceneManager || !url) return
  
  // 重置状态
  loading.value = true
  progress.value = 0
  error.value = ''
  
  // 移除旧模型
  if (currentModel) {
    sceneManager.scene.remove(currentModel)
    currentModel = null
  }
  
  try {
    // 加载新模型
    const model = await loadModel(url, (p) => {
      progress.value = p
    })
    
    // 归一化模型（居中、缩放）
    normalizeModel(model, props.modelSize)
    
    // 添加到场景
    sceneManager.scene.add(model)
    currentModel = model
    
    // 重置相机位置
    sceneManager.controls.reset()
    
    console.log('✅ 模型已添加到场景')
    
  } catch (err) {
    console.error('模型加载失败:', err)
    error.value = '模型加载失败，请重试'
  } finally {
    loading.value = false
  }
}

/**
 * 重新加载
 */
function retryLoad() {
  if (props.modelUrl) {
    loadModelFromUrl(props.modelUrl)
  }
}

/**
 * 清理资源
 */
function cleanup() {
  if (sceneManager) {
    sceneManager.dispose()
    sceneManager = null
  }
  currentModel = null
  disposeLoaders()
}

// ========== 监听 Props 变化 ==========
watch(() => props.modelUrl, (newUrl) => {
  if (newUrl && sceneManager) {
    loadModelFromUrl(newUrl)
  }
})

// ========== 生命周期 ==========
onMounted(() => {
  initScene()
})

onUnmounted(() => {
  cleanup()
})

// ========== 暴露方法给父组件 ==========
defineExpose({
  loadModel: loadModelFromUrl,
  retryLoad
})
</script>

<style scoped>
.model-viewer-container {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, #f8f8f8 0%, #eeeeee 100%);
  border-radius: var(--radius-md);
  overflow: hidden;
}

/* 加载状态 */
.loading-overlay,
.error-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 12px;
  background-color: rgba(255, 255, 255, 0.9);
  z-index: 10;
}

.loading-text,
.error-text {
  font-size: 14px;
  color: var(--text-secondary);
}

/* 操作提示 */
.hint-overlay {
  position: absolute;
  bottom: 16px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background-color: rgba(0, 0, 0, 0.5);
  border-radius: 20px;
  color: white;
  font-size: 12px;
  z-index: 5;
  animation: fadeInOut 3s ease-in-out;
}

.gesture-icon {
  font-size: 16px;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeInOut {
  0% { opacity: 0; }
  20% { opacity: 1; }
  80% { opacity: 1; }
  100% { opacity: 0; }
}

/* ✅ 3D Viewer：移动端保证可见高度 */
@media (max-width: 768px) {
  .model-viewer-container {
    min-height: 260px;
    height: 42vh;             /* 如果父容器没给高度，也能正常显示 */
    border-radius: 12px;
  }

  .hint-overlay {
    bottom: 10px;
    font-size: 11px;
  }
}

</style>