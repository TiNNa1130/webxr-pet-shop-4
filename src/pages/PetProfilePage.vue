<template>
  <div class="pet-profile-page">
    <div class="page-header">
      <div>
        <h1>我的宠物</h1>
        <p>管理宠物档案，获取精准尺码推荐</p>
      </div>
      <van-button type="primary" round @click="openForm()">
        <van-icon name="plus" /> 添加宠物
      </van-button>
    </div>

    <van-empty v-if="pets.length === 0" description="还没有添加宠物档案">
      <van-button type="primary" round @click="openForm()">添加我的宠物</van-button>
    </van-empty>

    <div class="pet-grid" v-else>
      <div class="pet-card" v-for="pet in pets" :key="pet.id">
        <div class="pet-avatar">
          <span>{{ pet.species === 'dog' ? '🐕' : '🐈' }}</span>
        </div>
        <div class="pet-info">
          <h3>{{ pet.name }}</h3>
          <p class="breed">{{ pet.breed || '未知品种' }} · {{ pet.species === 'dog' ? '狗狗' : '猫咪' }}</p>
          <div class="params">
            <div class="param-item">
              <span class="label">体重</span>
              <span class="value">{{ pet.weight_kg }} kg</span>
            </div>
            <div class="param-item">
              <span class="label">胸围</span>
              <span class="value">{{ pet.chest_cm }} cm</span>
            </div>
            <div class="param-item">
              <span class="label">背长</span>
              <span class="value">{{ pet.back_length_cm }} cm</span>
            </div>
          </div>
          <div class="recommended" v-if="pet.recommended_size">
            <van-tag type="warning" size="large">推荐尺码: {{ pet.recommended_size.size }}</van-tag>
            <span class="confidence">匹配度 {{ Math.round((pet.recommended_size.confidence || 0) * 100) }}%</span>
          </div>
        </div>
        <div class="pet-actions">
          <van-button size="small" @click="openForm(pet)">编辑</van-button>
          <van-button size="small" type="danger" plain @click="removePet(pet.id)">删除</van-button>
        </div>
      </div>
    </div>

    <!-- 添加/编辑弹窗 -->
    <van-dialog v-model:show="showForm" :title="editing ? '编辑宠物' : '添加宠物'" :showConfirmButton="false">
      <div class="form-content">
        <van-form @submit="savePet">
          <van-cell-group inset>
            <van-field v-model="form.name" label="名字" placeholder="宠物名字" :rules="[{ required: true }]" />
            <van-field label="类型">
              <template #input>
                <van-radio-group v-model="form.species" direction="horizontal">
                  <van-radio name="dog">🐕 狗狗</van-radio>
                  <van-radio name="cat">🐈 猫咪</van-radio>
                </van-radio-group>
              </template>
            </van-field>
            <van-field v-model="form.breed" label="品种" placeholder="如柯基、金毛" />
            <van-field v-model="form.weight_kg" type="number" label="体重(kg)" placeholder="体重" :rules="[{ required: true }]" />
            <van-field v-model="form.chest_cm" type="number" label="胸围(cm)" placeholder="胸围" :rules="[{ required: true }]" />
            <van-field v-model="form.back_length_cm" type="number" label="背长(cm)" placeholder="背长" :rules="[{ required: true }]" />
          </van-cell-group>
          
          <div class="form-tip" v-if="previewSize">
            <van-icon name="info-o" /> 根据参数预测推荐尺码: <strong>{{ previewSize.size }}</strong>
          </div>

          <div class="form-actions">
            <van-button round block type="primary" native-type="submit">保存</van-button>
            <van-button round block @click="showForm = false">取消</van-button>
          </div>
        </van-form>
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { showToast, showSuccessToast, showConfirmDialog } from 'vant'
import { getMyPets, createPet, updatePet, deletePet, calculateRecommendedSize } from '../services/petsService.js'

const pets = ref([])
const showForm = ref(false)
const editing = ref(null)
const form = ref({
  name: '',
  species: 'dog',
  breed: '',
  weight_kg: '',
  chest_cm: '',
  back_length_cm: ''
})

const previewSize = computed(() => {
  if (form.value.chest_cm && form.value.back_length_cm) {
    return calculateRecommendedSize({
      chest_cm: Number(form.value.chest_cm),
      back_length_cm: Number(form.value.back_length_cm)
    })
  }
  return null
})

async function loadPets() {
  pets.value = await getMyPets()
}

function openForm(pet = null) {
  if (pet) {
    editing.value = pet.id
    form.value = {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || '',
      weight_kg: String(pet.weight_kg),
      chest_cm: String(pet.chest_cm),
      back_length_cm: String(pet.back_length_cm)
    }
  } else {
    editing.value = null
    form.value = { name: '', species: 'dog', breed: '', weight_kg: '', chest_cm: '', back_length_cm: '' }
  }
  showForm.value = true
}

async function savePet() {
  try {
    const data = {
      name: form.value.name,
      species: form.value.species,
      breed: form.value.breed,
      weight_kg: Number(form.value.weight_kg),
      chest_cm: Number(form.value.chest_cm),
      back_length_cm: Number(form.value.back_length_cm)
    }
    if (editing.value) {
      await updatePet(editing.value, data)
    } else {
      await createPet(data)
    }
    showSuccessToast('保存成功')
    showForm.value = false
    loadPets()
  } catch (e) {
    showToast(e.message || '保存失败')
  }
}

async function removePet(id) {
  try {
    await showConfirmDialog({ title: '确认删除', message: '确定要删除这个宠物档案吗？' })
    await deletePet(id)
    showSuccessToast('已删除')
    loadPets()
  } catch (e) {
    // 用户取消
  }
}

onMounted(() => loadPets())
</script>

<style scoped>
.pet-profile-page {
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.page-header h1 {
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 8px;
}

.page-header p {
  font-size: 14px;
  color: #999;
}

/* 宠物卡片网格 */
.pet-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.pet-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  display: flex;
  gap: 20px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.04);
}

.pet-avatar {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #FFE4C4, #FFDAB9);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40px;
  flex-shrink: 0;
}

.pet-info {
  flex: 1;
}

.pet-info h3 {
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin-bottom: 6px;
}

.pet-info .breed {
  font-size: 13px;
  color: #999;
  margin-bottom: 12px;
}

.params {
  display: flex;
  gap: 16px;
  margin-bottom: 12px;
}

.param-item {
  text-align: center;
}

.param-item .label {
  display: block;
  font-size: 11px;
  color: #999;
  margin-bottom: 4px;
}

.param-item .value {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.recommended {
  display: flex;
  align-items: center;
  gap: 10px;
}

.confidence {
  font-size: 12px;
  color: #FF6B35;
}

.pet-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* 表单 */
.form-content {
  padding: 16px;
}

.form-tip {
  background: #FFF5F2;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  color: #FF6B35;
  margin: 16px;
}

.form-actions {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>