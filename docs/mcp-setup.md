# MCP · 도구 설정 (정본) — 버전 고정표 포함

> **상태: D-1(MCP)·D-2(버전 고정)·D-3(스캐폴드) 확정 + 초기화 실행 완료(빌드 검증 ✔, 2026-06-22).**
> 이 문서가 **버전의 단일 출처(SSOT)**. 실행 절차·결과는 [`project-init.md`](./project-init.md). `dev-stack.md`·`deploy.md`·`CLAUDE.md` 는 이 표를 참조·링크.

---

## 설정된 MCP 서버 (D-1) ✅

| 서버 | 용도 | 전송 | 범위 | 인증 | 상태 |
|------|------|------|------|------|------|
| **context7** | 라이브러리 **최신 문서·버전** 조회 (버전 고정 D-2 의 근거 소스) | HTTP (원격) | user (전 프로젝트) | API 키 없음(무료/저 rate limit) | ✔ Connected |
| **playwright** | **실제 브라우저 조작·검증**(레퍼런스 사이트 탐색, 로컬 페이지 UI/UX 비교·스크린샷) | stdio (`npx @playwright/mcp@latest`) | user (전 프로젝트) | 없음 | ✔ Connected (2026-06-23) |

**설치 명령** (재현용):
```sh
claude mcp add --scope user --transport http context7 https://mcp.context7.com/mcp
claude mcp add --scope user playwright npx @playwright/mcp@latest   # 첫 실행 시 npx 다운로드 → Chromium은 `npx playwright install chromium`
```
- 원격 URL: `https://mcp.context7.com/mcp` · 패키지(로컬 대안): `@upstash/context7-mcp`
- 설정 파일: `~/.claude.json` (user config). `.env`/git 와 무관(로컬 도구 인증).
- **API 키 추가 시**(rate limit 상향, `context7.com/dashboard` 무료 발급):
  ```sh
  claude mcp remove context7 -s user
  claude mcp add --scope user --header "CONTEXT7_API_KEY: <KEY>" --transport http context7 https://mcp.context7.com/mcp
  ```
- 사용법: 프롬프트에 `use context7` 또는 라이브러리 ID 지정 시 최신 공식 문서를 가져온다.

---

## 버전 고정표 (D-2) ✅ — SSOT

> 조회일 **2026-06-22** (npm 레지스트리 + GitHub releases + nodejs.org). 결정: TypeScript · npm · Node 24 LTS · 라우팅 포함.

### 런타임·도구
| 항목 | 고정 | 비고 |
|------|------|------|
| **Node.js** | **24.17.0** (24 LTS "Krypton") | Active LTS. Vite 8(`>=22.12`) **및 react-router 8(`>=22.22.0`)** 동시 충족. **로컬·CI 모두 24.17.0** ✅ (로컬 winget으로 업그레이드 완료 2026-06-22, npm 11.13.0) |
| **패키지 매니저** | **npm** (Node 24 동봉 11.x) | 추가 설치 불필요 |
| **TypeScript** | **6.0.3** | react-ts 템플릿 |

### 런타임 의존성 (dependencies)
| 패키지 | 고정 | 비고 |
|--------|------|------|
| **react** / **react-dom** | **19.2.7** | React 19. React Compiler v1 정식(옵션) |
| **react-router** | **8.0.1** ✅ | v7부터 `react-router`로 통합(`react-router-dom` 아님). Node `>=22.22.0` 요구 → Node 24에서 설치 완료(✔ 빌드 검증). API: `createHashRouter`+`RouterProvider`(`react-router/dom`). 해시 라우팅으로 GH Pages 404 회피 → [`deploy.md §4`](./deploy.md) |
| **three** | **0.184.0** ✅ (`--save-exact`) | `main-1` 히어로의 3D 구체 클러스터(물리·조명)용. `RoomEnvironment`(`three/examples/jsm`)로 GI. dev 의존성 **@types/three 0.184.1**. 번들 +약 500KB(gzip ≈ 220KB) → 코드분할은 추후 검토. → [`portfolio-plan.md §4`](./portfolio-plan.md) |

### 개발 의존성 (devDependencies)
| 패키지 | 고정 | 비고 |
|--------|------|------|
| **vite** | **8.0.16** | Node `^20.19 \|\| >=22.12` 요구 |
| **@vitejs/plugin-react** | **6.0.2** | peer `vite ^8.0.0`. SWC 선호 시 `@vitejs/plugin-react-swc 4.3.1` 대체 가능 |
| **typescript** | **6.0.3** | (위 도구 항목과 동일) |

## 스캐폴드 명령 (D-3) ✅

루트에 **기존 파일(`docs/`·`CLAUDE.md`·`.env`·`.git`)이 있으므로** 직접 `.`에 스캐폴드하지 않고 **임시 디렉터리 → 병합** 방식을 쓴다(덮어쓰기 방지). 상세 절차는 [`project-init.md`](./project-init.md).

```sh
# 1) 임시 디렉터리에 최신 템플릿 생성 (create-vite 9.x)
npm create vite@latest .vite-tmp -- --template react-ts
# 2) 생성물(src/·public/·index.html·package.json·tsconfig*·vite.config.ts 등)만 루트로 이동
#    (.gitignore/README 등 기존 파일은 보존) → 3) .vite-tmp 삭제
# 4) 의존성 설치 + 라우터
npm install
npm install react-router       # 8.x (react-router-dom 아님)
npm run dev                    # HMR dev 서버
```
- 기본 플러그인은 `@vitejs/plugin-react`(Babel). SWC 원하면 템플릿 `react-swc-ts`.
- 초기화 후 `vite.config.ts` 의 **`base: '/nano-portfolio/'`** 적용(프로젝트 페이지) → [`deploy.md §2`](./deploy.md)·[`git-connection.md`](./git-connection.md).

## GitHub Actions 버전 (배포 — D-2 일부) ✅

`.github/workflows/deploy.yml` 에서 사용할 액션 태그(조회 2026-06-22):

| 액션 | 태그 | 용도 |
|------|------|------|
| `actions/checkout` | **v7** | 소스 체크아웃 |
| `actions/setup-node` | **v6** | `node-version: 24` |
| `actions/configure-pages` | **v6** | Pages 설정 |
| `actions/upload-pages-artifact` | **v5** | `dist/` 아티팩트 업로드 |
| `actions/deploy-pages` | **v5** | Pages 배포 |

> YAML 전문은 프로젝트 초기화(`.github/workflows/`) 시 [`deploy.md §5`](./deploy.md) 절차대로 작성.

## 남은 항목 (예정)

- [ ] 추가 MCP 서버 필요 시 (GitHub 등) D-1 표에 추가
- [ ] 버전 갱신 시 이 표를 먼저 고치고(SSOT) `dev-stack.md`·`deploy.md`·`CLAUDE.md` 동기화
- [ ] 프로젝트 초기화(스캐폴드 실행) — 아직 미수행 (사용자 확인 후)

## 확정 시 반영할 곳

이 문서가 채워지면 아래도 함께 갱신한다(단일 출처 유지):

- [`dev-stack.md`](./dev-stack.md) 의 "🟡 버전 추후 고정" 항목 → 실제 버전.
- [`deploy.md`](./deploy.md) §5 의 Actions YAML → 최신 액션 버전.
- 루트 [`../CLAUDE.md`](../CLAUDE.md) §1·§3 의 관련 표기.

> 그 전까지는 **버전·명령을 임의 확정하지 않는다.** 절차·규약 수준에서만 진행.
