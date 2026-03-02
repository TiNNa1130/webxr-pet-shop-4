<template>
  <div class="login-page">
    <div class="login-card">
      <div class="login-header">
        <div class="logo">🐾</div>
        <h1>{{ isRegister ? '创建账号' : '欢迎登录' }}</h1>
        <p>WebXR 宠物商城</p>
      </div>

      <van-form @submit="handleSubmit" class="login-form">
        <van-cell-group inset>
          <van-field
            v-model="email"
            label="邮箱"
            placeholder="请输入邮箱地址"
            type="email"
            left-icon="envelop-o"
            :rules="[{ required: true, message: '请输入邮箱' }]"
          />
          <van-field
            v-model="password"
            label="密码"
            placeholder="请输入密码（6位以上）"
            type="password"
            left-icon="lock"
            :rules="[{ required: true, message: '请输入密码' }]"
          />
        </van-cell-group>

        <div class="form-actions">
          <van-button round block type="primary" native-type="submit" :loading="loading" size="large">
            {{ isRegister ? '注册并登录' : '登录' }}
          </van-button>
          <van-button round block plain size="large" @click="isRegister = !isRegister">
            {{ isRegister ? '已有账号？去登录' : '没有账号？免费注册' }}
          </van-button>
        </div>
      </van-form>

      <!-- 测试账号快速登录 -->
      <div class="test-accounts">
        <div class="test-title">快速测试登录</div>
        <div class="test-btn-row">
          <van-button size="small" plain round @click="quickLogin('alice@example.com')">Alice（用户）</van-button>
          <van-button size="small" plain round @click="quickLogin('bob@example.com')">Bob（用户）</van-button>
          <van-button size="small" plain round @click="quickLogin('seller@webxrpet.com')">商家账号</van-button>
        </div>
        <p class="test-pass">密码均为：TestPass123!</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { showToast, showSuccessToast } from 'vant'
import { supabase } from '../lib/supabaseClient.js'

const router = useRouter()
const email = ref('')
const password = ref('TestPass123!')
const loading = ref(false)
const isRegister = ref(false)

async function handleSubmit() {
  loading.value = true
  try {
    if (isRegister.value) {
      const { error } = await supabase.auth.signUp({ email: email.value, password: password.value })
      if (error) throw error
      showSuccessToast('注册成功！')
      // 注册成功后自动登录
      await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      if (error) throw error
      showSuccessToast('登录成功')
    }
    // 返回上一页或首页
    const redirect = router.currentRoute.value.query.redirect || '/home'
    router.push(redirect)
  } catch (err) {
    const msg = err.message || '操作失败'
    if (msg.includes('Invalid login')) showToast('邮箱或密码错误')
    else if (msg.includes('already registered')) showToast('该邮箱已注册，请直接登录')
    else showToast(msg)
  } finally {
    loading.value = false
  }
}

async function quickLogin(testEmail) {
  email.value = testEmail
  password.value = 'TestPass123!'
  loading.value = true
  try {
    const { error } = await supabase.auth.signInWithPassword({ email: testEmail, password: 'TestPass123!' })
    if (error) throw error
    showSuccessToast('登录成功')
    router.push('/home')
  } catch (err) {
    showToast(err.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 60vh;
  display: flex; align-items: center; justify-content: center;
  padding: 40px;
}

.login-card {
  width: 100%; max-width: 440px;
  background: white; border-radius: 20px;
  padding: 40px; box-shadow: 0 4px 24px rgba(0,0,0,0.08);
}

.login-header { text-align: center; margin-bottom: 32px; }
.logo { font-size: 52px; margin-bottom: 16px; }
.login-header h1 { font-size: 24px; font-weight: 600; color: #333; margin-bottom: 8px; }
.login-header p { font-size: 14px; color: #999; }

.form-actions { margin-top: 24px; display: flex; flex-direction: column; gap: 12px; }

.test-accounts {
  margin-top: 24px;
  background: #f9f9f9; border-radius: 12px; padding: 16px;
}
.test-title { font-size: 13px; font-weight: 600; color: #666; margin-bottom: 12px; }
.test-btn-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 10px; }
.test-pass { font-size: 12px; color: #bbb; }
</style>