import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  // 添加环境变量配置
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV),
    }
  },
  // 配置开发服务器代理
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3009/',
        changeOrigin: true,
        rewrite: (path) => path
      }
    }
  }
})