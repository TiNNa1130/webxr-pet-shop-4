/**
 * Supabase 客户端初始化
 * 
 * 功能说明：
 * - 创建与 Supabase 云数据库的连接实例
 * - 整个应用共享这一个连接，避免重复创建
 * 
 * 技术要点（论文可引用）：
 * - 使用环境变量存储敏感信息，符合安全规范
 * - 单例模式确保全局只有一个数据库连接
 */

import { createClient } from '@supabase/supabase-js'

// 从环境变量读取配置（Vite 项目用 import.meta.env）
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 创建 Supabase 客户端实例
// 这个实例会在整个应用中被复用
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 导出一个简单的测试函数，用于验证连接是否成功
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('数据库连接测试失败:', error.message)
      return false
    }
    
    console.log('✅ Supabase 连接成功!')
    return true
  } catch (err) {
    console.error('连接异常:', err)
    return false
  }
}