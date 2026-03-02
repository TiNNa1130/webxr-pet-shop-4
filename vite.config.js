import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === 'model-viewer'
        }
      }
    })
  ],
  server: {
    host: true,                 // 允许外部访问
    port: 5173,
    strictPort: true,
    allowedHosts: ['.trycloudflare.com'] // 允许所有 trycloudflare 子域
  }
})