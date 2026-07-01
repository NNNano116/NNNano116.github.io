# 포트폴리오 앱 구조·개발 계획 (정본)

> `NNNano116/NNNano116.github.io` 의 **앱 자체 구조**(라우트·페이지·컴포넌트) 계획의 단일 출처(SSOT).
> 스택/버전은 [`mcp-setup.md` D-2](./mcp-setup.md), 초기화·설정 절차는 [`project-init.md`](./project-init.md),
> 배포 함정은 [`deploy.md`](./deploy.md), 운영 제약은 [`CLAUDE.md §1`](../CLAUDE.md)을 **참조**(값 복제 금지).

> 🟢 **상태: `/` (Main1) 단일 라우트 우선 구현 진행 중** (업데이트 2026-07-01). 멀티라우트(§2 하단 /about·/projects·/contact)는 **계획 유지·미착수** — 현재는 Main1 한 라우트에 히어로(1P)·자기소개(2P)·**포트폴리오(3P // works)** 를 인플로우로 담음.
> ✅ **3P `프로젝트`(// works) 포트폴리오 섹션 구현 완료**(2026-07-01): 세로 타임라인(최신순·접힌 바=이름만/펼침 정보 보강) + 데이터리치 상세 모달 + **`PROJECTS` 23개 실경력 반영**. 남은 것은 커버 실이미지뿐. → [`main1-works.md`](./main1-works.md).
> 진행 중 변경이 생기면 **이 문서를 먼저 갱신**한 뒤 코드/상위 문서를 맞춘다(§4-4 SSOT).

---

## 1. 방향 (확정)

- **유형**: 개발자 포트폴리오.
- **라우팅**: **멀티 라우팅**(실제 페이지 이동) — 메인/소개/프로젝트/Contact 등 개별 페이지.
- **페이지 내부**: 스크롤 + 슬라이더 혼재(보여줄 것·스크롤 분량이 많음).
- **방식**: **해시 라우팅**(`createHashRouter`) → GH Pages 새로고침 404 원천 회피 → [`deploy.md §4`](./deploy.md).

## 2. 라우트 맵

| 경로 | 페이지 | 내용(초안) |
|------|--------|-----------|
| `/` | **Main-1 (메인 승격)** | 3D 구체 클러스터 물리 히어로(three.js) + 자기소개 3페이지 스크롤. 마우스 반발·드래그 휩쓸기·클릭 버스트·중심 응집(자석)·부유·흐름(완만 회전)·구체 충돌. 상세 정본 [`main1-hero.md`](./main1-hero.md)·[`main1-scroll-interactions.md`](./main1-scroll-interactions.md). → `src/routes/Main1.tsx` |
| `/main-1` | (구 경로) | `<Navigate to="/" replace/>` 로 `/` 리다이렉트(OG·구 링크 호환). |
| `/about` | **About** | 소개·스킬·경력 |
| `/projects` | **Projects** | 프로젝트 카드·슬라이더 (스크롤 분량 多) |
| `/contact` | **Contact** | 이메일·GitHub `NNNano116`·외부 링크 |

- 실제 URL 형태: `https://NNNano116.github.io/#/about` (해시 뒤 경로 → 새로고침 안전).
- 페이지 추가/변경 시 본 표와 `src/main.tsx` 라우트 배열을 함께 갱신.

## 3. 파일 구조 (예정)

```
src/
  main.tsx                ← createHashRouter (라우트 + RootLayout)
  routes/
    RootLayout.tsx        ← 공통 Nav + <Outlet/> (페이지 이동 메뉴)
    Home.tsx · About.tsx · Projects.tsx · Contact.tsx
  components/             ← Nav · Slider(CSS scroll-snap) · ProjectCard 등 재사용 단위
  styles/                ← 전역/모듈 스타일
  assets/                ← import 로만 참조(절대경로 금지)
```

## 4. 컴포넌트·슬라이더 방침

- **슬라이더**: 초기엔 무의존 **CSS scroll-snap** 권장(가벼움·빌드부담 적음). 효과가 더 필요하면 `swiper` 등 추가 검토(의존성 추가 시 [mcp-setup D-2](./mcp-setup.md) 표에 반영).
- **3D/물리(main-1)**: `three` **0.184.0**(`RoomEnvironment` GI) — 캔버스 한 장 + `useEffect` 자체 물리 루프(외부 물리 라이브러리 無). 의존성·번들 영향은 [mcp-setup D-2](./mcp-setup.md) 표에 기록. 캔버스는 `alpha:true`(투명) → 배경 그라디언트는 CSS, 텍스트/크롬은 DOM 오버레이(`z-index`)로 캔버스 위에 둔다.
- **에셋**: `import` 또는 상대경로만. **절대경로(`/img.png`, `/icons.svg`) 금지** — `base`와 충돌 → [CLAUDE.md §1](../CLAUDE.md).
- **정적 전제 유지**: 서버 호출·런타임 비밀 없음(클라이언트 only) → [CLAUDE.md §1](../CLAUDE.md).

## 5. 착수 시 작업 순서 (단계 2 → 3 → 4)

> 설정 절차의 상세·코드 스니펫은 [`project-init.md`](./project-init.md)에 있다(여기서 중복하지 않음).

1. **설정(B/D)**: `vite.config.ts` `base:'/'`(사용자 페이지) · `react-router` 설치 · `main.tsx` 해시 라우터 + 멀티 라우트 · `.github/workflows/deploy.yml`.
2. **구현(A)**: RootLayout(Nav) → 4개 페이지 → 슬라이더/카드 컴포넌트. 기본 Vite 템플릿(카운터·`/icons.svg` 절대경로) 정리.
3. **검증·배포(B/C)**: `npm run preview` → push → Actions 빌드 → 실제 URL에서 라우팅/새로고침/에셋 점검. **Settings → Pages → Source = GitHub Actions**(사용자 1회 클릭).

## 6. 착수 전 차단 항목 (Blockers) ⚠️

| # | 항목 | 현황 | 해소 조건 |
|---|------|------|-----------|
| B-1 | 런북↔실제 불일치 | `project-init.md`는 "실행 완료"지만 `base`·해시라우터·`react-router`·`deploy.yml` **실제 미적용** | 설정 실제 적용(타 에이전트 또는 인계) |
| B-2 | react-router 버전 표기 불일치 | CLAUDE.md `8.0.1` vs [`mcp-setup.md`](./mcp-setup.md)(SSOT) `7.18.0` | 한 버전으로 통일(설치 명령 확정) |

> 위 2건이 풀리기 전엔 구현 착수하지 않는다(임의 진행 금지).

## 7. 변경 관리 규칙

- 라우트·페이지·구조가 바뀌면 **이 문서(§2·§3)를 먼저 고치고** → `src/` 코드 → 필요 시 상위(CLAUDE.md) 동기화.
- 의존성(슬라이더 등) 추가는 [`mcp-setup.md` D-2](./mcp-setup.md) 버전표에 먼저 반영.
- 라우팅 방식 변경(해시→404 fallback 등)은 [`deploy.md §4`](./deploy.md)와 함께 결정.
- 구현 착수/완료 시 본 문서 상단 상태 배지(🟡→✅)와 §6 차단표를 갱신.

## 8. 정본 / 연계

- 스택·버전: [`mcp-setup.md`](./mcp-setup.md) (허브 **D**) · 초기화 런북: [`project-init.md`](./project-init.md)
- 개발(A): [`dev-stack.md`](./dev-stack.md) · 배포(B): [`deploy.md`](./deploy.md) · Git/배포현황(C): [`git-connection.md`](./git-connection.md)
- Main1 구현 정본: 히어로 [`main1-hero.md`](./main1-hero.md) · 스크롤/헤더 [`main1-scroll-interactions.md`](./main1-scroll-interactions.md) · **3P works [`main1-works.md`](./main1-works.md)**
- 운영 제약: [`CLAUDE.md §1`](../CLAUDE.md)
- 소스(생성 예정): `src/main.tsx`·`src/routes/**`·`src/components/**`
