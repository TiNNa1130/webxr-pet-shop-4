/**
 * Three.js 场景管理器
 * 
 * 功能说明：
 * - 创建和管理 3D 渲染场景
 * - 配置相机、光源、渲染器
 * - 提供场景初始化和销毁方法
 * 
 * 技术要点（论文可引用）：
 * - WebGL 硬件加速渲染
 * - PBR（基于物理的渲染）光照模型
 * - 响应式画布尺寸适配
 */

import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

/**
 * 创建 Three.js 场景
 * @param {HTMLElement} container - 容器 DOM 元素
 * @returns {Object} 场景相关对象
 */
export function createScene(container) {
  // 获取容器尺寸
  const width = container.clientWidth
  const height = container.clientHeight

  // ========== 1. 创建场景 ==========
  const scene = new THREE.Scene()
  // 设置背景色（浅灰色，突出模型）
  scene.background = new THREE.Color(0xf5f5f5)

  // ========== 2. 创建相机 ==========
  // 透视相机：模拟人眼视角
  // 参数：视角角度、宽高比、近裁剪面、远裁剪面
  const camera = new THREE.PerspectiveCamera(
    45,           // 视角 45 度
    width / height,
    0.1,          // 最近可见距离
    1000          // 最远可见距离
  )
  // 设置相机位置（稍微远离原点，方便观察模型）
  camera.position.set(0, 0.5, 2)

  // ========== 3. 创建渲染器 ==========
  const renderer = new THREE.WebGLRenderer({
    antialias: true,      // 开启抗锯齿
    alpha: true,          // 支持透明背景
    preserveDrawingBuffer: true  // 允许截图
  })
  renderer.setSize(width, height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))  // 限制像素比，优化性能
  
  // 启用物理正确的光照模型（PBR）
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.0
  
  // 启用阴影
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap

  // 将渲染器的 canvas 添加到容器
  container.appendChild(renderer.domElement)

  // ========== 4. 创建轨道控制器 ==========
  // 允许用户用鼠标/触摸旋转、缩放、平移视角
  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true       // 开启阻尼（惯性）
  controls.dampingFactor = 0.05
  controls.minDistance = 0.5          // 最小缩放距离
  controls.maxDistance = 5            // 最大缩放距离
  controls.maxPolarAngle = Math.PI    // 允许查看底部
  controls.target.set(0, 0.3, 0)      // 控制器焦点（模型中心偏上）

  // ========== 5. 添加光源 ==========
  // 环境光：均匀照亮场景
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)

  // 主方向光：模拟太阳光，产生阴影
  const mainLight = new THREE.DirectionalLight(0xffffff, 0.8)
  mainLight.position.set(5, 10, 7)
  mainLight.castShadow = true
  mainLight.shadow.mapSize.width = 1024
  mainLight.shadow.mapSize.height = 1024
  scene.add(mainLight)

  // 补光：减少阴影过暗
  const fillLight = new THREE.DirectionalLight(0xffffff, 0.3)
  fillLight.position.set(-5, 5, -5)
  scene.add(fillLight)

  // 底部反光：模拟地面反射
  const bottomLight = new THREE.DirectionalLight(0xffffff, 0.2)
  bottomLight.position.set(0, -5, 0)
  scene.add(bottomLight)

  // ========== 6. 添加地面（可选） ==========
  const groundGeometry = new THREE.CircleGeometry(2, 32)
  const groundMaterial = new THREE.MeshStandardMaterial({
    color: 0xeeeeee,
    roughness: 0.8,
    metalness: 0.2
  })
  const ground = new THREE.Mesh(groundGeometry, groundMaterial)
  ground.rotation.x = -Math.PI / 2  // 旋转为水平
  ground.position.y = 0
  ground.receiveShadow = true
  scene.add(ground)

  // ========== 7. 动画循环 ==========
  let animationId = null
  
  function animate() {
    animationId = requestAnimationFrame(animate)
    controls.update()  // 更新控制器（阻尼效果需要）
    renderer.render(scene, camera)
  }
  
  // 启动动画
  animate()

  // ========== 8. 窗口大小变化处理 ==========
  function handleResize() {
    const newWidth = container.clientWidth
    const newHeight = container.clientHeight
    
    camera.aspect = newWidth / newHeight
    camera.updateProjectionMatrix()
    renderer.setSize(newWidth, newHeight)
  }
  
  window.addEventListener('resize', handleResize)

  // ========== 9. 返回场景对象和清理函数 ==========
  return {
    scene,
    camera,
    renderer,
    controls,
    
    // 销毁场景，释放资源
    dispose() {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationId)
      controls.dispose()
      renderer.dispose()
      
      // 移除 canvas
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement)
      }
      
      console.log('🗑️ Three.js 场景已销毁')
    }
  }
}