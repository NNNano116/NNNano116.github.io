# 가이드 허브 — A. 로컬 개발·React 스택·Vibe 코딩

> React + Vite 로컬 개발 환경과 컴포넌트 작성, Vibe 코딩(즉시 미리보기 반복) 워크플로를 다루는 작업의 진입 허브.
> 🟡 도구 버전은 추후 최신 가이드에서 고정.

---

## 1. 트리거 키워드

React · Vite · `dev` 서버 · HMR · `src/` · `components/` · `pages`/`routes` ·
`main.(jsx|tsx)` · `App` · 컴포넌트 작성 · 상태(`useState`/`useEffect`) · 라우팅(해시) ·
**`index.html` `<head>`·페이지명(`<title>`)·메타 설명·파비콘(`favicon.svg` J·Y 글라스 원형)·OG/Twitter 카드·theme-color·`lang`·SEO** ·
TypeScript 여부 · 에셋 `import`/상대경로 · `public/` · Vibe 코딩 · `preview`(프로덕션 미리보기) ·
Node LTS · npm/pnpm · **멀티 라우트·페이지 구성(Home/About/Projects/Contact)·슬라이더·`RootLayout`/`Outlet`** ·
**`npm run dev/build/preview` · 포트(5173/4173) · `--port`/`--host`/`--strictPort` · 로컬 접속 URL·`base` 경로 함정** ·
**`three.js`·WebGL·캔버스·물리(파티클·충돌·반발)·`main-1` 히어로·마우스 인터랙션(`useEffect` 애니메이션 루프)·`requestAnimationFrame`** ·
**배경 레이저(2D 캔버스·대각선·63.1°·드리프트·모바일 우하단 커버)·드래그 안내 인디케이터(마우스 캡슐+네온 화살표·`stroke-dashoffset`·SVG 키프레임)·mattwilldev.com 레퍼런스·Playwright 픽셀 측정** ·
**`nano-portfolio` 타이틀·서브타이틀 순환·키네틱 타이포(`token-in` blur+slide)·마우스 패럴럭스·구체 인트로 생성(scale·리플·`er` 충돌·펼침)·모바일 반응형(`clamp`·`vw`·`pointer:coarse`·입력환경별 라벨 CLICK·SCROLL/TOUCH & DRAG)·푸터 제거** ·
**스크롤 인터랙션(3페이지 1-라우트 인플로우·`--inv` 다크↔라이트 색반전·3/5 트리거·듀얼레이어 크로스페이드)·명칭 모프+섹션 타이틀 핸드오프(`is-light`/`is-settled`)·다국어 11개 순환+단어별 rise(`titleIn`)·페이지 이동(데스크탑 휠 '한 제스처=1섹션' 락 모델: 항상 `preventDefault`·휠 버스트당 1회·휠 멎을 때(150ms)까지 락 / 모바일 터치 '완전 제어' 드래그: `touch-action:none`·`scrollTop` 1:1 추종·드래그 16%/플릭 전환·미만 복귀·상단 갭 없음·한 제스처=최대 1페이지)·디자인 이력서 2단(연락처·스킬 / 경력·학력·교육 타임라인)·라이트 글라스(`backdrop-filter`·opacity는 ::before 에)·리빌(이력 is-settled 스태거 / 카드 IntersectionObserver)·맨위로 버튼·J·Young 로고·반응형(구체 widthShrink·≤1300 서브타이틀·≤768 1열)**

## 2. 세부 도메인 목차

| # | 도메인 | 무엇 | 정본 |
|---|--------|------|------|
| A-1 | 스택 구성 | React·Vite·TS 여부·패키지매니저·Node | [dev-stack §1](../dev-stack.md) |
| A-2 | 로컬 환경 준비 | 설치·스캐폴드·dev 기동 | [dev-stack §2](../dev-stack.md) |
| A-3 | 프로젝트 구조 | `src/`·`components/`·`public/`·에셋 규약 | [dev-stack §3](../dev-stack.md) |
| A-4 | Vibe 코딩 루프 | HMR 반복·AI 보조 즉시 검증·작은 단위 | [dev-stack §4](../dev-stack.md) |
| A-5 | **포트폴리오 앱 구조** | 멀티 라우트(해시)·페이지(Home/About/Projects/Contact)·슬라이더 — **현재는 `/`(Main1) 단일 라우트에 1P 히어로·2P 자기소개·3P `// works` 인플로우**(멀티라우트 미착수) | [portfolio-plan](../portfolio-plan.md) 🟢 |
| A-6 | **로컬 빌드·실행·포트** | `npm run dev/build/preview`·dev 5173·preview 4173·`base` 접속 URL·포트 변경/충돌 | [local-run](../local-run.md) ✔ |
| A-7 | **main-1 3D 물리 히어로** | `three.js` 씬·렌더·물리 루프(자석·부유·흐름·충돌·표면장력)·마우스/드래그/클릭 반응·속도 임계값 반발 | [main1-hero §4–§6](../main1-hero.md) ✅ |
| A-8 | **main-1 인트로 생성** | 구체 제자리 우아한 등장(scale easeOutCubic·가운데→바깥 리플)·충돌 `er`(스케일 반지름)로 버벅임 제거·수축→약한 펼침 | [main1-hero §7](../main1-hero.md) ✅ |
| A-9 | **main-1 타이틀/서브타이틀** | `nano-portfolio`·서브 4줄 2.8s 순환·키네틱 타이포(`token-in` blur+slide 스태거)·마우스 패럴럭스·흰색 통일 | [main1-hero §8](../main1-hero.md) ✅ |
| A-10 | **main-1 배경 레이저** | 2D 캔버스·고정 63.1°·`min(W·0.07,150)`·상단 가장자리 앵커+좌하 연장·드리프트·헤드 점·커서 밝힘·**모바일 우하단 커버(`driftRange=W·1.08+H·0.55`)** | [main1-hero §9](../main1-hero.md) ✅ |
| A-11 | **main-1 드래그 안내** | SVG `stroke-dashoffset` draw/erase·마우스+네온 라인+화살표·루프 4s·**입력환경별 라벨(CLICK·SCROLL/TOUCH & DRAG)**·**반응형 크기(`clamp`)** | [main1-hero §10](../main1-hero.md) ✅ |
| A-12 | **main-1 모바일 반응형** | 레이저 우하단 커버·서브타이틀 좌측 이동·패럴럭스(터치 비활성)·드래그 안내 `clamp` 축소·입력환경별 문구·푸터 제거 | [main1-hero §11](../main1-hero.md) ✅ |
| A-14 | **사이트 헤더·메타·파비콘** | `index.html` 페이지명(`J·Young portfolio`)·메타 설명·OG/Twitter 카드·theme-color·`lang=ko` / **파비콘: 불투명 네이비 베이스+J·Y 글라스 코인(svg)+PNG 폴백(32/180/192/512)+manifest** — 모바일 '빈 파비콘' 수정 / OG 절대 URL 주의 | [site-meta](../site-meta.md) ✅ |
| A-13 | **main-1 스크롤 인터랙션** | 3페이지 인플로우·`--inv` 색반전(3/5)·명칭 모프+핸드오프·다국어+단어 rise·**페이지 이동 UX 확정(데스크탑 휠 '한 제스처=1섹션' 락 모델 / 모바일 터치 '완전 제어' 드래그 — touch-action:none·1:1 추종·16% 임계/플릭 전환·상단 갭 없음·한 제스처=1페이지)**·**헤더 네비 반응형(PC/큰태블릿 ≥769 우측 세로 슬라이더 게이지: 진행도 fill·글로우·펄스·hollow 링·호버 툴팁 / 모바일·작은태블릿 ≤768 풀스크린 슬라이드 메뉴 우→좌 Main·Profile·works·활성 언더라인 / 공용 `scrollToSection` 단일 easeInOutCubic — 1→3 중간 섹션 통과)**·**`animateTo` 워치독(§5-5 — 모달 blur 가 rAF 스톨시켜 휠 락 고착 → `animSafety`/공용 `done()` 자가치유)**·**디자인 이력서 2단(실데이터·org·role 한 줄·헤더 클리어런스·의미단위 줄바꿈)**·글라스(iOS/PC 얇은유리+blur / 안드로이드 .is-android 불투명·다크노출 방지 color-mix bg+overscroll·레이저 오프히어로 렌더스킵)·**리빌(is-settled/IO)**·맨위로 버튼·반응형 | [main1-scroll-interactions](../main1-scroll-interactions.md) ✅ |
| A-14 | **main-1 3P `프로젝트`(// works) 포트폴리오** | 세로 타임라인(`.tl` 스파인+노드·년도 그룹·점 선택 시 `grid-rows 0fr→1fr` 펼침)·**최신순 정렬**(년도·월 내림차순, 최상단 자동전개)·진입 스태거(`--seq` blur→sharp, **지연 축소로 빠른 로드**)·도착/오버레이 해제 재생(`replay`/`entered`·`setTimeout` 견고성·rAF 회피)·**자체 state 리빌**(전역 `.reveal` IO 는 토글 리렌더 때 className 덮어써 지움 → 사용)·**접힌 바=프로젝트명만 / 펼침 메타·핵심기능·현황 보강**·**원형 chevron 토글**·**커버 비활성**(`hasImage:false` 텍스트 전용)·상세 모달(`WorkModal` `createPortal(body)`·데이터리치: Overview/Features/Stack/Details/note·PC 다이얼로그/≤768 풀스크린·ESC/백드롭)·벤토 패럴럭스(`--par` passive)·**2P 패널 구조 재사용**(`seg__inner--resume`)·`PROJECTS` **23개 실경력**·PC 폰트 컴팩트·다음=커버 실이미지 | [main1-works](../main1-works.md) ✅ |

## 3. 실제 확인사항 (작업 전 체크리스트)

- [x] ✅ 버전 확정됨(Node 24·React 19.2.7·Vite 8.0.16·TS 6.0.3·react-router 8.0.1) → SSOT [`mcp-setup.md` D-2](../mcp-setup.md). 변경 시 그 표 먼저 갱신.
- [ ] 에셋은 `import` 또는 상대경로로. **절대경로(`/img.png`) 금지**(배포 base 와 충돌) → 허브 **B**.
- [ ] 라우팅을 추가하면 **새로고침/직접진입**을 로컬에서 테스트(배포 404 함정과 직결) → 허브 **B**.
- [ ] 정적 전제를 깨는 변경(서버 호출·런타임 비밀 등)은 운영 모델([CLAUDE.md §1](../../CLAUDE.md))과 충돌 → 먼저 점검.
- [ ] AI 생성 코드도 **HMR 화면에서 실제 렌더 확인** 후 커밋.
- [ ] 빌드 시점 차이를 보려면 `build` → `preview` 로 프로덕션 모드 점검 → 허브 **B**.
- [ ] **로컬 접속은 루트**(`http://localhost:5173/`) — 사용자 페이지라 `base:'/'`. (구 프로젝트 페이지처럼 `/nano-portfolio/` 붙이면 404) 빌드·포트 상세 → [`local-run.md`](../local-run.md).
- [ ] 포트는 **점유 시 자동 증가**할 수 있으니 기동 로그의 `Local:` URL 확인(5173 가정 금지).
- [ ] **3D/물리/인트로(`main-1`)**: `three` 의존성은 [`mcp-setup.md` D-2](../mcp-setup.md) 버전표 우선 갱신. 언마운트 시 **rAF(구체·레이저·패럴럭스)**·리스너·geometry/material/renderer **dispose** 필수. 물리/인트로 튜닝은 [`main1-hero.md §5–§7·§14`](../main1-hero.md) 상수표와 동기화(인트로 충돌은 `er` 사용 — 버벅임 방지).
- [ ] **페이지 이동 UX(`main-1` 스크롤)**: 데스크탑 휠은 **항상 `preventDefault`**(네이티브 관성이 경계 `animateTo` 와 충돌 → 2→3 튕김·3→2 미완료) + 휠 멎을 때까지 락(한 제스처=1섹션). 모바일은 **`touch-action:none` 유지**(빼면 안드로이드 stuck·상단 갭 재발) + JS 가 `scrollTop` 1:1 제어. 버튼(맨위로·안내)은 `wheelStopRef` 로 휠 애니/락 먼저 해제. 상세·상수 → [`main1-scroll-interactions §5-1·§5-2`](../main1-scroll-interactions.md) **먼저 갱신** 후 코드.
- [ ] ⚠️ **글라스 `backdrop-filter` 추가/수정 시 — `-webkit-` 먼저, 표준 마지막**: esbuild 프로덕션 미니파이가 중복으로 보고 마지막만 남겨, 표준이 먼저면 prod(빌드)에서 PC 블러가 사라짐(dev 는 정상). 빌드 후 `vite preview` 로 확인. 상세 → [`main1-scroll-interactions §6-2a`](../main1-scroll-interactions.md) · 허브 **B**.
- [ ] **파비콘 변경 시**: 반투명·밝은 SVG-only 는 흰 배경 모바일 탭에서 '빈 것처럼' 보이고 iOS apple-touch-icon 은 SVG 미지원 → **불투명 베이스 + PNG 폴백 + manifest** 유지. PNG 재생성은 Playwright 래스터(무의존). 상세 → [`site-meta.md §2·§5`](../site-meta.md).
- [ ] ⚠️ **3P `// works` 타임라인(`main-1`)**: ① **전역 `.reveal` IO 로 리빌하지 말 것** — 토글 리렌더 때 React 가 `className` 을 덮어써 IO 클래스를 지워 항목이 사라짐 → **자체 state(`entered`)+`--seq`** 로 소유. ② **모달 `backdrop-filter: blur` 는 캔버스 위 rAF 를 스톨** → `animateTo` 워치독(`animSafety`·공용 `done()`) 없으면 휠 락 영구 고착('스크롤 죽음'). ③ 재생 타이머는 **rAF 아닌 `setTimeout`**(idle 스톨 회피). ④ 배경/폭은 **2P `seg__inner--resume` 재사용**(3P 전용 배경 금지). ⑤ 커버 이미지는 `import` `url()`(**절대경로 금지**) — 현재는 실이미지 없어 `hasImage:false`(텍스트 전용), 확보 시 해당 항목만 true. ⑥ **정렬은 년도·`idx` 모두 내림차순**(최신 위)·자동 전개는 `PROJECTS` 마지막(최신). ⑦ 항목 28개라 **스태거 per-seq 지연을 작게**(0.028s) 유지(크면 하단이 수초 늦음). ⑧ **PC 폰트는 vw·최대값만** 조정(모바일 하한 유지 — 과대/가독성 왕복 이력). 상세 → [`main1-works`](../main1-works.md) · [`main1-scroll-interactions §5-5`](../main1-scroll-interactions.md).
- [ ] **레이저/타이포/드래그(`main-1`)**: 레퍼런스 **mattwilldev.com**. 레이저는 [`§9·§14`](../main1-hero.md)(우측 한계 `driftRange=W·1.08+H·0.55` 모바일 커버 주의), 타이틀/서브는 [`§8·§14`](../main1-hero.md), 드래그 안내는 [`§10·§14`](../main1-hero.md), 반응형은 [`§11`](../main1-hero.md) **먼저 갱신** 후 코드. 검증 시 **stale dev 서버 주의**(HMR 미반영 → 클린 포트 재기동).

## 4. 정본 / 소스

- 정본: [`dev-stack.md`](../dev-stack.md) · **로컬 빌드·실행·포트**: [`local-run.md`](../local-run.md) ✔ · **초기화·설정 절차**: [`project-init.md`](../project-init.md) · **앱 구조·계획**: [`portfolio-plan.md`](../portfolio-plan.md) 🟢 · **main-1 3D 물리 히어로**: [`main1-hero.md`](../main1-hero.md) ✅ · **main-1 스크롤 인터랙션**: [`main1-scroll-interactions.md`](../main1-scroll-interactions.md) ✅ · **main-1 3P `// works` 포트폴리오**: [`main1-works.md`](../main1-works.md) ✅ · **사이트 헤더·메타·파비콘**: [`site-meta.md`](../site-meta.md) ✅
- 소스: `src/**`, `index.html`, `vite.config.ts`, `package.json`

## 5. 자주 함께 걸리는 대분류

- **B** (빌드·배포): base·라우팅·에셋 경로
- **C** (Git): 커밋·`.env`·푸시
- **D** (MCP/버전): 스캐폴드 명령·버전 고정
