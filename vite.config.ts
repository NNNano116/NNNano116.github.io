import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 배포: https://NNNano116.github.io/nano-portfolio/ (GitHub Pages 프로젝트 페이지)
// → base 를 레포명에 맞춤. 사용자 페이지로 바꾸면 '/' 로. (docs/deploy.md §2)
export default defineConfig({
  base: '/nano-portfolio/',
  plugins: [react()],
})
