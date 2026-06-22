# 프로젝트 초기화·설정 런북 (정본) — nano-portfolio

> 이 프로젝트(`NNNano116/nano-portfolio`)를 **React + Vite + TypeScript** 정적 사이트로 **초기화·설정**하는
> 실행 절차의 단일 출처(SSOT). 버전은 [`mcp-setup.md` D-2](./mcp-setup.md), 배포 현황은 [`git-connection.md`](./git-connection.md),
> 운영 제약은 루트 [`CLAUDE.md §1`](../CLAUDE.md)을 따른다(값은 여기서 **복제하지 않고 참조**).

**상태**: ✅ 실행 완료(2026-06-22) · **조회·검증에 context7 MCP 활용**(Vite 8 / React Router 패턴).

---

## 0. 전제 (Prerequisites)

| 항목 | 값 | 출처 |
|------|-----|------|
| 저장소 모델 | 프로젝트 페이지 → `base: '/nano-portfolio/'` | [git-connection §1](./git-connection.md) |
| 배포 URL | `https://NNNano116.github.io/nano-portfolio/` | 〃 |
| Node | **24.17.0 LTS** 권장 (react-router 8 = `>=22.22.0`) | [mcp-setup D-2](./mcp-setup.md) |
| 패키지 매니저 | npm | 〃 |
| 라우팅 | 해시 라우팅(`createHashRouter`) | [deploy §4](./deploy.md) |

> ⚠️ **로컬 Node**가 22.20.0이면 react-router 8 설치 시 `EBADENGINE` 경고가 난다(설치·빌드는 동작).
> 정합을 위해 **24.17.0로 업그레이드 권장**. CI(`deploy.yml`)는 이미 Node 24 고정.

---

## 1. 스캐폴드 (임시 디렉터리 → 병합) ⭐

루트에 보존해야 할 파일(`docs/`·`CLAUDE.md`·`.env`·`.gitignore`·`.git`)이 있으므로 **`.`에 직접 스캐폴드하지 않는다**.
임시 디렉터리에 생성 후 **앱 코드만** 루트로 옮긴다.

```sh
# 루트(ppp/)에서
npm create vite@latest .vite-tmp -- --template react-ts   # create-vite 9.x, 비대화형
# 생성물 중 앱 코드만 루트로 이동: index.html · src/ · public/ · package.json
#   · tsconfig*.json · vite.config.ts · eslint.config.js  (기존 .gitignore/README는 보존)
# .vite-tmp 삭제
```

> 생성 파일은 create-vite 버전에 따라 다를 수 있다(예: `tsconfig.app.json`/`tsconfig.node.json` 분리, eslint flat config).
> **루트 기존 파일을 덮어쓰지 않는지** 이동 전 확인한다.

이후 `package.json` 의 `name` 을 `nano-portfolio` 로 변경.

## 2. 의존성 설치

```sh
npm install                 # 템플릿 의존성(react 19.2.7 · vite 8.0.16 · @vitejs/plugin-react 6.0.2 · typescript 6.0.3)
npm install react-router    # react-router-dom 아님(v7+ 통합 패키지)
```

> ⚠️ **engine-aware 자동 선택**: 최신 `react-router` 8.0.1은 Node `>=22.22.0` 요구.
> **로컬 Node 22.20.0에서는 npm이 호환 최신인 7.18.0을 자동 설치**한다(✔ 빌드 검증됨, API 동일).
> **Node 24 업그레이드 후** `npm i react-router@latest` 로 8.0.1 상향. 버전 정본은 [mcp-setup D-2](./mcp-setup.md).

## 3. `vite.config.ts` — base 적용 (가장 중요)

프로젝트 페이지이므로 `base` 를 레포명에 맞춘다. (출처: Vite 공식 *Deploying a Static Site → GitHub Pages*, context7 조회)

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// 배포: https://NNNano116.github.io/nano-portfolio/  (프로젝트 페이지)
export default defineConfig({
  base: '/nano-portfolio/',
  plugins: [react()],
})
```

> 사용자 페이지(`<user>.github.io` 레포)로 바꾸면 `base: '/'`. → [deploy §2](./deploy.md)

## 4. `src/main.tsx` — 해시 라우터

GH Pages 새로고침 404를 피하려 **해시 라우팅**을 쓴다(서버 fallback 불필요). `createHashRouter` 사용.
(출처: React Router `createHashRouter` — context7 조회. v7+는 `react-router`에서 import, `RouterProvider`는 `react-router/dom`.)

```tsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter } from 'react-router'
import { RouterProvider } from 'react-router/dom'
import './index.css'
import App from './App.tsx'

const router = createHashRouter([
  { path: '/', element: <App /> },
  // 화면 추가 시 라우트 확장 (예: { path: '/about', element: <About /> })
])

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
```

- 경로는 URL 해시에 들어간다: `…/nano-portfolio/#/`, `…/nano-portfolio/#/about`. 새로고침 안전.
- 에셋은 `import`/상대경로로만 — 절대경로 금지(`base`와 충돌) → [CLAUDE.md §1](../CLAUDE.md).

## 5. `.github/workflows/deploy.yml` — Actions 자동 배포

액션 태그는 [mcp-setup D-2](./mcp-setup.md)(조회 2026-06-22). Source: Settings → Pages → **GitHub Actions**.

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: true

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with:
          node-version: 24
          cache: npm
      - run: npm ci
      - run: npm run build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

> **자격증명 불필요** — Actions의 `GITHUB_TOKEN` 자동 사용(로컬 `.env`와 무관) → [deploy §5](./deploy.md).
> 해시 라우팅이라 `404.html` fallback은 불필요(경로가 `#` 뒤에 있어 항상 `index.html` 서빙).

## 6. 검증 ✔ (2026-06-22, Node 22.20.0)

```sh
npm run build      # dist/ 생성 — 에셋 경로가 /nano-portfolio/ 로 rewrite 되는지 확인
npm run preview    # 프로덕션 빌드본 로컬 미리보기
npm run dev        # HMR 개발 서버
```

- [x] `npm run build` 성공 — `tsc -b`(타입체크) 통과 + `vite v8.0.16` 빌드(27 모듈, ~290ms).
- [x] `dist/index.html` 에셋이 **`/nano-portfolio/assets/...`** 로 시작(base 적용 확인).
- [ ] `preview`에서 `#/` 라우트가 새로고침 후에도 뜨는가(배포 전 최종 점검 권장).
- [ ] 비밀값이 빌드 산출에 없는가(정적 = 클라이언트 노출) → [deploy §7](./deploy.md).

## 7. 배포 (실제 게시)

1. GitHub **Settings → Pages → Source: GitHub Actions**.
2. `main` 에 push → Actions가 build→deploy.
3. `https://NNNano116.github.io/nano-portfolio/` 확인.

> 커밋·푸시는 사용자 확인 후 진행(이 런북은 로컬 파일 생성까지). → 허브 **C** [git-connection](./git-connection.md).

## 8. 정본 / 연계

- 버전 SSOT: [`mcp-setup.md` D-2](./mcp-setup.md) · 배포 현황: [`git-connection.md`](./git-connection.md)
- 개발(A): [`dev-stack.md`](./dev-stack.md) · 배포(B): [`deploy.md`](./deploy.md) · 운영 제약: [`CLAUDE.md §1`](../CLAUDE.md)
- 소스: `package.json`·`vite.config.ts`·`src/main.tsx`·`.github/workflows/deploy.yml`
