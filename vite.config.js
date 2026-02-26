import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 部署到 GitHub Pages 时，base 设为仓库名，例如: '/vape-pricing-dashboard/'
  // 如果使用自定义域名或根路径，改为 '/'
  base: '/vape-pricing-dashboard/',
})
