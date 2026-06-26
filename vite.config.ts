import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 배포: https://NNNano116.github.io/ (GitHub Pages 사용자 페이지, 레포 NNNano116.github.io)
// → 사용자 페이지이므로 base 는 루트 '/'. (docs/deploy.md §2)
export default defineConfig({
  base: '/',
  plugins: [react()],
})
