import { supabase } from '../lib/supabaseClient.js'

export async function getMyPets() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []
    
    const { data, error } = await supabase
      .from('pets')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data || []
  } catch (err) {
    console.error('获取宠物失败:', err)
    return []
  }
}

export async function createPet(petData) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('请先登录')
  
  const recommendedSize = calculateRecommendedSize(petData)
  
  const { data, error } = await supabase
    .from('pets')
    .insert({
      user_id: user.id,
      name: petData.name,
      species: petData.species || 'dog',
      breed: petData.breed || '',
      weight_kg: petData.weight_kg,
      chest_cm: petData.chest_cm,
      back_length_cm: petData.back_length_cm,
      neck_cm: petData.neck_cm || null,
      recommended_size: recommendedSize
    })
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function updatePet(petId, petData) {
  const recommendedSize = calculateRecommendedSize(petData)
  
  const { data, error } = await supabase
    .from('pets')
    .update({
      name: petData.name,
      species: petData.species,
      breed: petData.breed,
      weight_kg: petData.weight_kg,
      chest_cm: petData.chest_cm,
      back_length_cm: petData.back_length_cm,
      neck_cm: petData.neck_cm,
      recommended_size: recommendedSize
    })
    .eq('id', petId)
    .select()
    .single()
  
  if (error) throw error
  return data
}

export async function deletePet(petId) {
  const { error } = await supabase.from('pets').delete().eq('id', petId)
  if (error) throw error
  return true
}

export function calculateRecommendedSize(petData) {
  const { chest_cm, back_length_cm } = petData
  
  const sizeChart = [
    { size: 'XS', chest: [26, 33], back: [20, 26] },
    { size: 'S', chest: [34, 40], back: [27, 32] },
    { size: 'M', chest: [39, 46], back: [33, 38] },
    { size: 'L', chest: [46, 55], back: [39, 46] },
    { size: 'XL', chest: [56, 68], back: [47, 58] }
  ]
  
  let bestMatch = { size: 'M', confidence: 0.5, chest_match: '39-46cm', back_match: '33-38cm' }
  let bestScore = 0
  
  for (const s of sizeChart) {
    let score = 0
    if (chest_cm >= s.chest[0] && chest_cm <= s.chest[1]) score += 1
    if (back_length_cm >= s.back[0] && back_length_cm <= s.back[1]) score += 1
    
    if (score > bestScore) {
      bestScore = score
      bestMatch = {
        size: s.size,
        confidence: score / 2,
        chest_match: s.chest[0] + '-' + s.chest[1] + 'cm',
        back_match: s.back[0] + '-' + s.back[1] + 'cm'
      }
    }
  }
  return bestMatch
}

export function calculateModelScale(petData) {
  return {
    scaleX: petData.chest_cm / 45,
    scaleY: petData.back_length_cm / 40,
    scaleZ: petData.chest_cm / 45
  }
}

/**
 * 根据宠物参数和商品尺码表，计算最佳匹配尺码
 * 这是论文核心创新点：参数化适配算法
 * 
 * @param {Object} pet - 宠物数据 { chest_cm, back_length_cm, weight_kg }
 * @param {Object} sizeChart - 商品尺码表 { "S": { chest_cm: "34-38", back_cm: "27-32" }, ... }
 * @returns {Object} { size, fit_type, confidence, details }
 */
export function matchProductSize(pet, sizeChart) {
  if (!pet || !sizeChart) {
    return { size: 'M', fit_type: 'standard', confidence: 0.5, details: '无法匹配' }
  }

  const petChest = Number(pet.chest_cm)
  const petBack = Number(pet.back_length_cm)
  
  let bestMatch = null
  let bestScore = -1

  for (const [sizeName, sizeData] of Object.entries(sizeChart)) {
    // 解析尺码范围 "34-38" => [34, 38]
    const chestRange = parseRange(sizeData.chest_cm || sizeData.chest)
    const backRange = parseRange(sizeData.back_cm || sizeData.back)
    
    if (!chestRange || !backRange) continue

    // 计算匹配度
    const chestScore = calculateFitScore(petChest, chestRange)
    const backScore = calculateFitScore(petBack, backRange)
    const totalScore = (chestScore + backScore) / 2

    if (totalScore > bestScore) {
      bestScore = totalScore
      bestMatch = {
        size: sizeName,
        chestFit: getFitType(petChest, chestRange),
        backFit: getFitType(petBack, backRange),
        confidence: totalScore
      }
    }
  }

  if (!bestMatch) {
    return { size: 'M', fit_type: 'standard', confidence: 0.5, details: '无匹配数据' }
  }

  // 判断整体版型
  const fit_type = determineFitType(bestMatch.chestFit, bestMatch.backFit)

  return {
    size: bestMatch.size,
    fit_type: fit_type,
    confidence: bestMatch.confidence,
    details: `胸围${bestMatch.chestFit}，背长${bestMatch.backFit}`
  }
}

// 解析范围字符串 "34-38" => [34, 38]
function parseRange(rangeStr) {
  if (!rangeStr) return null
  const match = String(rangeStr).match(/(\d+\.?\d*)\s*[-~]\s*(\d+\.?\d*)/)
  if (match) {
    return [parseFloat(match[1]), parseFloat(match[2])]
  }
  return null
}

// 计算匹配分数
function calculateFitScore(value, range) {
  const [min, max] = range
  if (value >= min && value <= max) {
    // 完美匹配，越接近中间分数越高
    const mid = (min + max) / 2
    const deviation = Math.abs(value - mid) / (max - min)
    return 1 - deviation * 0.2
  } else if (value < min) {
    // 偏小
    const diff = (min - value) / min
    return Math.max(0, 0.8 - diff)
  } else {
    // 偏大
    const diff = (value - max) / max
    return Math.max(0, 0.8 - diff)
  }
}

// 判断单项合身度
function getFitType(value, range) {
  const [min, max] = range
  if (value < min) return '偏紧'
  if (value > max) return '偏松'
  const mid = (min + max) / 2
  if (value < mid - (max - min) * 0.2) return '略紧'
  if (value > mid + (max - min) * 0.2) return '略松'
  return '合身'
}

// 综合判断版型
function determineFitType(chestFit, backFit) {
  if (chestFit === '合身' && backFit === '合身') return '完美合身'
  if (chestFit.includes('紧') || backFit.includes('紧')) return '偏紧身'
  if (chestFit.includes('松') || backFit.includes('松')) return '偏宽松'
  return '标准版型'
}