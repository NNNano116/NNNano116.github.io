import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import App from './App.tsx'

// 해시 라우팅: GitHub Pages 새로고침 404 회피(경로가 # 뒤에 있어 항상 index.html 서빙).
// 화면 추가 시 라우트를 확장한다. (docs/deploy.md §4, docs/project-init.md §4)
const router = createHashRouter([
  { path: '/', element: <App /> },
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
