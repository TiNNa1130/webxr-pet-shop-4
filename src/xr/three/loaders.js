/**
 * 3D 模型加载器
 * 
 * 功能说明：
 * - 加载 GLB/GLTF 格式的 3D 模型
 * - 支持 Draco 压缩模型（减小文件体积 70%+）
 * - 提供加载进度回调
 * 
 * 技术要点（论文可引用）：
 * - GLB 是 glTF 的二进制格式，加载更快
 * - Draco 压缩大幅减少网络传输时间
 */

import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'

// 创建 GLTF 加载器（单例）
let gltfLoader = null
let dracoLoader = null

/**
 * 获取配置好的 GLTF 加载器
 */
function getLoader() {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader()
    
    // 配置 Draco 解码器（用于加载压缩模型）
    dracoLoader = new DRACOLoader()
    // 使用 CDN 上的 Draco 解码器
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/')
    dracoLoader.setDecoderConfig({ type: 'js' })
    
    gltfLoader.setDRACOLoader(dracoLoader)
  }
  
  return gltfLoader
}

/**
 * 加载 3D 模型
 * @param {string} url - 模型文件 URL
 * @param {Function} onProgress - 加载进度回调 (0-100)
 * @returns {Promise<THREE.Group>} 加载的模型对象
 */
export async function loadModel(url, onProgress = null) {
  const loader = getLoader()
  
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      // 加载成功
      (gltf) => {
        const model = gltf.scene
        
        // 设置模型阴影
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true
            child.receiveShadow = true
            
            // 确保材质正确显示
            if (child.material) {
              child.material.needsUpdate = true
            }
          }
        })
        
        console.log('✅ 模型加载成功:', url)
        resolve(model)
      },
      // 加载进度
      (xhr) => {
        if (xhr.lengthComputable && onProgress) {
          const percent = Math.round((xhr.loaded / xhr.total) * 100)
          onProgress(percent)
        }
      },
      // 加载失败
      (error) => {
        console.error('❌ 模型加载失败:', error)
        reject(error)
      }
    )
  })
}

/**
 * 将模型居中并缩放到合适大小
 * @param {THREE.Object3D} model - 3D 模型
 * @param {number} targetSize - 目标大小（默认 1）
 */
export function normalizeModel(model, targetSize = 1) {
  // 计算模型的包围盒
  const box = new THREE.Box3().setFromObject(model)
  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())
  
  // 计算缩放比例（让最大边等于目标大小）
  const maxDim = Math.max(size.x, size.y, size.z)
  const scale = targetSize / maxDim
  
  model.scale.setScalar(scale)
  
  // 将模型移动到原点（底部贴地）
  model.position.x = -center.x * scale
  model.position.y = -box.min.y * scale  // 底部贴地
  model.position.z = -center.z * scale
  
  console.log(`📐 模型已归一化: 缩放 ${scale.toFixed(2)}, 尺寸 ${size.x.toFixed(2)} x ${size.y.toFixed(2)} x ${size.z.toFixed(2)}`)
}

/**
 * 释放加载器资源
 */
export function disposeLoaders() {
  if (dracoLoader) {
    dracoLoader.dispose()
    dracoLoader = null
  }
  gltfLoader = null
}