# 개발 스택 · 로컬 환경 · Vibe 코딩 (정본)

> React + Vite 기반 정적 사이트. **로컬에서 개발 → GitHub 업로드 → 빌드 → GitHub Pages 배포**.
> ✅ **버전 확정됨**(2026-06-22). 정확한 버전·스캐폴드는 [`mcp-setup.md` D-2](./mcp-setup.md)(SSOT). 이 문서는 **절차·규약 중심**.

---

## 1. 스택 개요

| 영역 | 선택 | 고정 버전 (→ [mcp-setup D-2](./mcp-setup.md)) |
|------|------|------|
| UI 라이브러리 | **React** | **19.2.7** (react/react-dom) |
| 빌드/dev 서버 | **Vite** | **8.0.16** (+ `@vitejs/plugin-react` 6.0.2) |
| 언어 | **TypeScript** | **6.0.3** (react-ts 템플릿) |
| 패키지 매니저 | **npm** | Node 24 동봉 11.x |
| 런타임 | **Node 24 LTS** | **24.17.0** "Krypton" (로컬·CI 동일) |
| 라우팅 | **React Router(해시)** | **react-router 8.0.1** (구 -dom 아님) → [`deploy.md §4`](./deploy.md) |

> 버전의 **단일 출처는 [`mcp-setup.md` D-2](./mcp-setup.md)**. 갱신 시 그 표를 먼저 고친다(SSOT).

## 2. 로컬 환경 준비 (절차)

1. **Node 24.17.0 LTS** 설치(로컬 22.20.0 → 24 업그레이드). → [mcp-setup D-2](./mcp-setup.md)
2. 프로젝트 초기화: `npm create vite@latest . -- --template react-ts` → [mcp-setup D-3](./mcp-setup.md).
3. `npm install` → `npm run dev` 기동 → 브라우저 HMR 확인.
4. `react-router-dom` 추가(해시 라우팅) · `.env` / `.gitignore` / git 원격 연결 → [`git-setup.md`](./git-setup.md).

> 정확한 버전·스캐폴드 명령은 [`mcp-setup.md`](./mcp-setup.md)(SSOT) 참조.

## 3. 프로젝트 구조 (예정 규약)

```
ppp/
├─ index.html            ← Vite 진입(루트의 HTML)
├─ src/
│  ├─ main.(jsx|tsx)     ← 앱 부트스트랩 (createRoot)
│  ├─ App.(jsx|tsx)      ← 루트 컴포넌트
│  ├─ components/        ← 재사용 컴포넌트
│  ├─ pages/ 또는 routes/← 화면 단위
│  ├─ assets/            ← 이미지·폰트 등 (상대경로 import)
│  └─ styles/            ← CSS / CSS Modules
├─ public/               ← 그대로 복사되는 정적 파일
├─ vite.config.(js|ts)   ← base·플러그인 설정 (배포와 직결)
├─ .env / .env.example   ← 로컬 자격정보 (.env 는 커밋 금지)
└─ docs/ · CLAUDE.md     ← 문서·허브
```

- **에셋은 `import` 또는 `src/` 기준 상대경로**로 참조 → Vite 가 해시·base 를 처리. 절대경로(`/img.png`) 지양.
- 정적 원본 그대로 두려면 `public/`. 단 `public/` 은 base 접두가 자동 적용되는지 배포 시 확인.

## 4. Vibe 코딩 워크플로 (로컬 반복 개발) ⭐

> "Vibe 코딩" = 로컬 dev 서버를 켜둔 채 **AI 보조 + 즉시 미리보기**로 빠르게 반복하는 개발 루프.

**기본 루프**
1. `dev` 서버 상시 기동(HMR) → 저장하면 브라우저 즉시 반영.
2. 작은 단위로 변경 → 화면에서 바로 확인 → 다음 변경. (큰 덩어리 한 번에 X)
3. 컴포넌트 단위로 만들고, 상태/로직은 점진적으로 끌어올림.
4. 깨지면 **브라우저 콘솔 + Vite 오버레이** 먼저 확인.

**Vibe 코딩 체크포인트**
- [ ] dev 서버에서 **동작 확인 후** 커밋. (배포 전 로컬에서 먼저 본다)
- [ ] AI 가 생성한 코드도 **HMR 화면으로 즉시 검증** — "그럴듯함"이 아니라 실제 렌더 확인.
- [ ] 외부 입력·네트워크 의존이 없는 **정적 전제**를 깬다면(서버 호출 등) 운영 모델(§1)과 충돌 → 먼저 점검.
- [ ] 라우팅을 추가하면 **새로고침/직접 진입**도 로컬에서 테스트(배포 시 404 함정과 직결).
- [ ] 빌드 결과까지 보려면 `build` → `preview` 로 **프로덕션 모드 미리보기**(dev 와 다른 점 조기 발견).

## 5. 정본 / 연계

- 빌드·배포: [`deploy.md`](./deploy.md) (허브 **B**)
- Git·자격정보: [`git-setup.md`](./git-setup.md) (허브 **C**)
- MCP·도구·**버전 고정표(SSOT)**: [`mcp-setup.md`](./mcp-setup.md) (허브 **D**) ✅
