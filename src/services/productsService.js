/**
 * 商品数据服务层
 * 
 * 功能说明：
 * - 封装所有与商品相关的数据库操作
 * - 统一管理商品的增删改查逻辑
 * 
 * 设计模式（论文可引用）：
 * - Service Layer 模式：将数据访问逻辑与视图层分离
 * - 便于后期维护和单元测试
 */

import { supabase } from '../lib/supabaseClient.js'

/**
 * 获取商品列表
 * @param {Object} options - 查询选项
 * @param {string} options.category - 商品分类筛选
 * @param {number} options.limit - 返回数量限制
 * @param {number} options.offset - 分页偏移量
 * @returns {Promise<Array>} 商品列表
 */
export async function getProducts(options = {}) {
  const { 
    category = null, 
    limit = 20, 
    offset = 0 
  } = options

  try {
    // 构建查询
    let query = supabase
      .from('products')
      .select(`
        id,
        name,
        description,
        category,
        subcategory,
        price,
        original_price,
        cover_image_url,
        has_3d_model,
        has_ar,
        has_try_on,
        avg_rating,
        review_count,
        sold_count
      `)
      .eq('is_active', true)  // 只查询上架商品
      .order('created_at', { ascending: false })  // 按创建时间倒序
      .range(offset, offset + limit - 1)  // 分页

    // 如果指定了分类，添加筛选条件
    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('获取商品列表失败:', error.message)
      throw error
    }

    console.log(`✅ 成功获取 ${data.length} 个商品`)
    return data

  } catch (err) {
    console.error('getProducts 异常:', err)
    return []
  }
}

/**
 * 根据 ID 获取商品详情
 * @param {string} productId - 商品 UUID
 * @returns {Promise<Object>} 商品详情（包含 SKU 和 3D 模型信息）
 */
export async function getProductById(productId) {
  try {
    // 查询商品基本信息，同时关联查询 SKU 和 3D 模型
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_skus (*),
        product_models (*)
      `)
      .eq('id', productId)
      .single()  // 只返回一条记录

    if (error) {
      console.error('获取商品详情失败:', error.message)
      throw error
    }

    console.log('✅ 成功获取商品详情:', data.name)
    return data

  } catch (err) {
    console.error('getProductById 异常:', err)
    return null
  }
}

/**
 * 获取商品分类列表
 * @returns {Promise<Array>} 分类列表
 */
export async function getCategories() {
  // 目前返回固定分类，与数据库 CHECK 约束一致
  // 后期可改为从数据库动态读取
  return [
    { value: 'clothing', label: '宠物服饰', icon: '👔' },
    { value: 'furniture', label: '宠物家居', icon: '🏠' },
    { value: 'accessory', label: '配饰', icon: '🎀' },
    { value: 'toy', label: '玩具', icon: '🎾' },
    { value: 'food', label: '食品', icon: '🦴' },
    { value: 'other', label: '其他', icon: '📦' }
  ]
}