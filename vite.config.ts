import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 배포: https://NNNano116.github.io/ (GitHub Pages 사용자 페이지, 레포 NNNano116.github.io)
// → 사용자 페이지이므로 base 는 루트 '/'. (docs/deploy.md §2)
export default defineConfig({
  base: '/',
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // three.js 를 별도 청크로 분리 → 앱 셸(라우터/DOM) 파싱을 가볍게 유지하고
        // three 는 병렬 다운로드 + 브라우저 캐시(재방문 시 앱 코드만 재파싱). 로드 버벅임 완화.
        // (Vite 8/Rolldown 은 manualChunks 를 함수 형태로 받는다.)
        manualChunks: (id: string) =>
          id.includes('node_modules/three') ? 'three' : undefined,
      },
    },
  },
})
