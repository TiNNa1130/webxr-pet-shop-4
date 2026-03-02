<template>
  <div style="padding: 16px;">
    <h2>Debug 面板</h2>
    <p style="opacity: .8;">
      用于快速判断：Supabase 是否连对、Auth 是否正常、表是否可读、模型 URL 是否可访问。
    </p>

    <hr />

    <h3>1) 环境变量</h3>
    <pre>{{ envInfo }}</pre>

    <h3>2) Auth 状态</h3>
    <div>
      <button @click="refreshSession">刷新 session</button>
      <button @click="signOut" style="margin-left: 8px;">signOut</button>
    </div>
    <pre>{{ sessionInfo }}</pre>

    <h3>3) 数据库连通性</h3>
    <div>
      <button @click="testProducts">测试读取 products</button>
      <button @click="testModels" style="margin-left: 8px;">测试读取 product_models</button>
    </div>
    <pre>{{ dbInfo }}</pre>

    <h3>4) Storage / 模型 URL 访问</h3>
    <p style="opacity: .8;">用 HEAD/GET 测试一个 model_url 是否能被浏览器直接访问（200/403/404）。</p>
    <div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
      <input v-model="testUrl" placeholder="粘贴一个 model_url" style="width:min(680px, 100%); padding:8px;" />
      <button @click="testUrlFetch">测试 URL</button>
    </div>
    <pre>{{ urlInfo }}</pre>

    <hr />
    <p style="opacity:.7;">
      小提示：如果你改了 env.local / Supabase Project / Policies，记得重启 npm run dev。
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { supabase } from '../lib/supabaseClient'

const envInfo = ref('')
const sessionInfo = ref('')
const dbInfo = ref('')
const urlInfo = ref('')
const testUrl = ref('')

function safeDomain(url) {
  try {
    const u = new URL(url)
    return u.origin
  } catch (e) {
    return '(invalid url)'
  }
}

function initEnvInfo() {
  const url = import.meta.env.VITE_SUPABASE_URL || ''
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
  envInfo.value = JSON.stringify(
    {
      VITE_SUPABASE_URL: url,
      SUPABASE_ORIGIN: safeDomain(url),
      VITE_SUPABASE_ANON_KEY_masked: key ? key.slice(0, 6) + '...' + key.slice(-6) : '(empty)'
    },
    null,
    2
  )
}

async function refreshSession() {
  const { data, error } = await supabase.auth.getSession()
  sessionInfo.value = JSON.stringify(
    {
      error: error?.message || null,
      session: data?.session
        ? {
            user_id: data.session.user?.id,
            email: data.session.user?.email,
            expires_at: data.session.expires_at
          }
        : null
    },
    null,
    2
  )
}

async function signOut() {
  const { error } = await supabase.auth.signOut()
  sessionInfo.value = JSON.stringify({ signOut: error?.message || 'ok' }, null, 2)
}

async function testProducts() {
  dbInfo.value = 'loading products...'
  const { data, error } = await supabase
    .from('products')
    .select('id,name,price,is_active,has_3d_model,has_ar')
    .limit(20)

  dbInfo.value = JSON.stringify(
    { error: error?.message || null, count: data?.length || 0, sample: data?.slice(0, 3) || [] },
    null,
    2
  )
}

async function testModels() {
  dbInfo.value = 'loading product_models...'
  const { data, error } = await supabase
    .from('product_models')
    .select('id,product_id,model_url,poster_url')
    .limit(20)

  dbInfo.value = JSON.stringify(
    { error: error?.message || null, count: data?.length || 0, sample: data?.slice(0, 2) || [] },
    null,
    2
  )
}

async function testUrlFetch() {
  urlInfo.value = 'testing url...'
  const url = (testUrl.value || '').trim()
  if (!url) {
    urlInfo.value = '请先粘贴一个 model_url'
    return
  }

  try {
    const r = await fetch(url, { method: 'HEAD' })
    urlInfo.value = JSON.stringify({ method: 'HEAD', status: r.status, ok: r.ok }, null, 2)

    if (!r.ok) {
      const r2 = await fetch(url, { method: 'GET' })
      urlInfo.value += '\n' + JSON.stringify({ method: 'GET', status: r2.status, ok: r2.ok }, null, 2)
    }
  } catch (e) {
    urlInfo.value = 'fetch error: ' + (e?.message || String(e))
  }
}

initEnvInfo()
refreshSession()
</script>