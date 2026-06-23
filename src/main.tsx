import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import App from './App.tsx'
import Main1 from './routes/Main1.tsx'

// 해시 라우팅: GitHub Pages 새로고침 404 회피(경로가 # 뒤에 있어 항상 index.html 서빙).
// 화면 추가 시 라우트를 확장한다. (docs/deploy.md §4, docs/project-init.md §4)
// main-1: 3D 구체 물리 히어로(three.js). 추후 메인('/')으로 승격 가능. 현재 메인은 기존 화면 유지.
const router = createHashRouter([
  { path: '/', element: <App /> },
  { path: '/main-1', element: <Main1 /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
