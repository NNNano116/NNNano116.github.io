# 로컬 빌드 · 실행 · 포트 (정본)

> 로컬에서 **빌드하는 방법**과 **dev/preview 서버 포트 설정값**, 그리고 **주의사항**을 한곳에 모은 정본.
> 검증: 2026-06-22 빌드·실행 확인 ✔ (Vite 8.0.16 · Node 24.17.0).
> 배포용 빌드(`base`·SPA 404·Actions)는 [`deploy.md`](./deploy.md), 버전 SSOT 는 [`mcp-setup.md` D-2](./mcp-setup.md).

---

## 1. npm 스크립트 한눈에 (`package.json`)

| 스크립트 | 명령 | 무엇 | 기본 포트 |
|----------|------|------|-----------|
| `npm run dev` | `vite` | 개발 서버(HMR). 로컬 Vibe 코딩용 | **5173** |
| `npm run build` | `tsc -b && vite build` | 타입체크 + 정적 빌드 → `dist/` | — (서버 아님) |
| `npm run preview` | `vite preview` | **빌드된 `dist/`** 를 로컬에서 프로덕션 모드로 서빙 | **4173** |
| `npm run lint` | `eslint .` | 정적 검사 | — |

> dev 와 preview 는 **다른 서버**다. dev=소스 실시간(HMR), preview=빌드 산출물(`dist/`) 확인용.

## 2. 빌드 방법 ⭐

```bash
npm run build
```

내부적으로 **2단계**로 실행된다:

1. **`tsc -b`** — TypeScript 타입체크(프로젝트 레퍼런스 빌드). **타입 에러가 있으면 여기서 실패**하고 `vite build` 로 넘어가지 않는다.
2. **`vite build`** — 정적 산출물 생성 → **`dist/`** (html/css/js + 해시 처리된 에셋).

**성공 출력 예 (2026-06-22 검증):**

```
vite v8.0.16 building client environment for production...
✓ 83 modules transformed.
dist/index.html                 0.50 kB
dist/assets/index-*.css         4.10 kB
dist/assets/index-*.js        284.89 kB │ gzip: 90.38 kB
✓ built in ~200ms
```

- 산출물은 **`dist/`** 한 곳. 이게 곧 배포물이다(서버 로직 없음 → [CLAUDE.md §1](../CLAUDE.md)).
- `dist/` 는 **생성물**이라 `.gitignore` 처리됨(Actions 가 매번 새로 빌드). 직접 커밋하지 말 것.
- 배포 맥락의 빌드(`base`·`404.html`·Actions)는 → [`deploy.md`](./deploy.md).

## 3. 포트 설정값 ⭐

### 3-1. 기본 포트

| 서버 | 기본 포트 | 실제 접속 URL (이 프로젝트) |
|------|-----------|------------------------------|
| `vite` (dev) | **5173** | `http://localhost:5173/nano-portfolio/` |
| `vite preview` | **4173** | `http://localhost:4173/nano-portfolio/` |

> ⚠️ **`base` 경로 필수**: `vite.config.ts` 의 `base: '/nano-portfolio/'` 때문에 루트(`/`)가 아니라
> **`/nano-portfolio/` 경로**로 접속해야 한다. `http://localhost:5173/` 만 열면 빈 화면/404 가 난다.
> (사용자 페이지로 바꿔 `base:'/'` 가 되면 루트 접속 — → [`deploy.md §2`](./deploy.md))

### 3-2. 포트 바꾸기 / 옵션

```bash
npm run dev -- --port 3000          # dev 포트 변경
npm run dev -- --host               # LAN(다른 기기)에서 접속 허용
npm run dev -- --port 3000 --strictPort   # 점유 시 자동 증가 대신 즉시 실패
npm run preview -- --port 5000      # preview 포트 변경
```

- `--` 뒤에 옵션을 줘야 npm 이 아니라 vite 로 전달된다(`npm run dev -- --port ...`).
- 고정하려면 `vite.config.ts` 에 `server: { port: 3000 }` / `preview: { port: 5000 }` 로 박을 수 있다.

### 3-3. 포트 충돌 동작

- 기본 포트가 사용 중이면 Vite 가 **다음 빈 포트로 자동 증가**(예: 5173 점유 → 5174). 기동 로그의 `Local:` URL 을 확인할 것.
- `--strictPort`(또는 config `strictPort: true`)면 자동 증가 없이 **즉시 에러** → 포트를 명시적으로 관리할 때 사용.

## 4. 실행 절차

**개발(권장 일상 루프):**

```bash
npm run dev          # → http://localhost:5173/nano-portfolio/
```
HMR 로 `src/**` 저장 시 즉시 반영. Vibe 코딩 루프 → [`dev-stack.md §4`](./dev-stack.md).

**프로덕션 빌드본 확인(배포 전 점검):**

```bash
npm run build        # dist/ 생성
npm run preview      # → http://localhost:4173/nano-portfolio/
```
dev 와 동작이 다른 부분(에셋 경로·base·번들 분할 등)을 배포 전에 조기 발견.

## 5. 주의사항 ⚠️

- [ ] **`base` 경로를 URL 에 붙여라**: `http://localhost:5173/nano-portfolio/`. 루트로 접속하면 빈 화면/404.
- [ ] **dev ≠ preview**: dev 는 소스 실시간, preview 는 **빌드된 `dist/`**. preview 로 본 게 실제 배포에 가깝다(반드시 `build` 먼저).
- [ ] **빌드 실패의 1차 원인은 `tsc -b` 타입 에러**: `vite build` 가 아니라 타입체크에서 멈춘 건지 로그로 구분.
- [ ] **포트는 점유 시 자동 증가**할 수 있다 — 5173 을 가정하지 말고 기동 로그의 `Local:` URL 을 확인.
- [ ] **`--host` 노출은 LAN 전체 공개**: 외부에 dev 서버를 여는 것이므로 신뢰된 네트워크에서만.
- [ ] **`dist/` 를 커밋하지 마라**(생성물·`.gitignore`). 배포는 Actions 자동 빌드 → [`deploy.md §5`](./deploy.md).
- [ ] **비밀값 금지**: 정적 빌드는 클라이언트에 그대로 노출 → 빌드에 비밀을 넣지 말 것 → 허브 **C** [`git-setup.md`](./git-setup.md).
- [ ] **에셋은 `import`/상대경로**: 절대경로(`/img.png`)는 `base` 와 충돌해 배포에서 404 → [`dev-stack.md §3`](./dev-stack.md).

## 6. 정본 / 연계

- 개발 스택·Vibe 루프: [`dev-stack.md`](./dev-stack.md) (허브 **A**)
- 배포용 빌드·`base`·SPA 404·Actions: [`deploy.md`](./deploy.md) (허브 **B**)
- 버전 고정(SSOT): [`mcp-setup.md` D-2](./mcp-setup.md) (허브 **D**)
- 운영 제약 원칙: 루트 [`../CLAUDE.md`](../CLAUDE.md) §1
