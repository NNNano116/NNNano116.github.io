# CLAUDE.md — 프로젝트 허브

> **(앱 목적 미정)** · **React + Vite** → **GitHub Pages 정적 배포** 프로젝트
> 이 파일은 **상시 공통 규칙 + 작업 대분류 인덱스(§3) + docs 허브 구조화 규약(§4)** 을 담는 **허브**입니다.
> 각 대분류의 세부 내용은 **가이드 허브**(`docs/guide/_hub_*.md`)가 보유합니다(§3 표에서 진입).

> 🟡 **현재 상태**: 스택(React+Vite+GH Pages)·개발 스킬 문서·git/`.env` 규약 **확정**.
> **MCP**: `context7`·`playwright` 연결됨(D-1). **버전 고정**(D-2/D-3): Node 24.17.0 · React 19.2.7 · Vite 8.0.16 · TS 6.0.3 · react-router 8.0.1 · three 0.184.0 · npm 11 → SSOT [`mcp-setup.md`](./docs/mcp-setup.md).
> ✅ **초기화·배포 완료**: 스캐폴드+`base`+해시 라우터+`deploy.yml`, **빌드 검증 ✔**, **GH Pages 라이브**(유저 페이지) https://nnnano116.github.io/ → [`project-init.md`](./docs/project-init.md).
> ✅ **`/main-1` 메인(히어로) + 자기소개(2P) 섹션 개발 완료** (2026-06-26): 3D 구체 물리 히어로 → [`main1-hero.md`](./docs/main1-hero.md), 3페이지 스크롤 인터랙션(색반전·명칭 모프·디자인 이력서)·**페이지 이동 UX 확정**(데스크탑 휠 '한 제스처=1섹션' 락 / 모바일 터치 '완전 제어' 드래그)·글라스 OS 분기 → [`main1-scroll-interactions.md`](./docs/main1-scroll-interactions.md).
> ✅ **2026-06-26 운영/수정 묶음**: ① **유저 페이지 전환**(레포 `nano-portfolio`→`NNNano116.github.io`·`base:'/'`) → [`git-connection.md`](./docs/git-connection.md) ② **Main1 히어로 `/` 메인 승격** + 기본 Vite 스캐폴드 정리(App·assets·icons 제거) ③ **프로덕션 글라스 블러 깨짐 수정**(esbuild 가 `backdrop-filter` 중복 제거 → webkit 먼저/표준 마지막) → [`main1-scroll-interactions.md §6-2a`](./docs/main1-scroll-interactions.md) ④ **모바일 '빈 파비콘' 수정**(불투명 네이비 베이스+PNG/manifest) → [`site-meta.md`](./docs/site-meta.md).
> ✅ **2026-06-30 헤더 네비게이션 반응형**: **PC·큰 태블릿(≥769) = 우측 중앙 세로 슬라이더 게이지**(진행도 fill·글로우·펄스·hollow 링·호버 툴팁, vw 기반 길이 반응형, 클릭 시 `scrollToSection` 단일 스크롤로 1→3 중간 섹션 통과) / **모바일·작은 태블릿(≤768) = 풀스크린 슬라이드 메뉴**(우→좌, Main·Profile·works·활성 언더라인, **좌→우 스와이프-투-클로즈**·배경 스크롤 잠금). ⚠️ **회귀 수정**: 스크롤 잠금을 `overflow:hidden` 으로 하면 `scrollTop` 리셋→테마/위치 고착 → 스크롤바만 숨김 + 토글 후 `resyncRef` 재동기화 → [`main1-scroll-interactions.md §5-4`](./docs/main1-scroll-interactions.md).
> ✅ **2026-07-01 3P 프로젝트 섹션 개발 + 실데이터**(빌드 검증 ✔): 구 스킬 카드 그리드 → **세로 타임라인**(스파인+노드·년도 그룹·점 선택 시 커버/상세 펼침·`--seq` 진입 스태거·도착/오버레이 해제마다 재생) + **상세 모달**(`View` → `createPortal(body)`·PC 다이얼로그/모바일 풀스크린·Overview/Features 불릿·Tech Stack 칩·Details 담당/인원/현황/링크·성과 note). ⚠️ **`animateTo` 워치독**: 모달 전체화면 `backdrop-filter: blur` 가 캔버스 위 rAF 를 스톨 → 휠 락 영구 고착('스크롤 죽음') → `animSafety`+공용 `done()` 자가치유. **`PROJECTS` 23개 실경력**(2022~2026, 백엔드→풀스택) 반영, 섹션 제목 **"프로젝트"**, **최신순 정렬·커버 비활성(텍스트 전용)·chevron 토글·접힌 바=이름만/펼침 정보 보강·등장 속도·PC 컴팩트 튜닝**. → [`main1-works.md`](./docs/main1-works.md)·[`main1-scroll-interactions.md §5-5`](./docs/main1-scroll-interactions.md). **다음: 커버 이미지(실스크린샷) 교체.**
> ✅ **2026-07-01 로드 성능 최적화**: 로드 버벅임 → ① **three.js 청크 분리**(`vite.config.ts` manualChunks 함수형·Vite 8/Rolldown / 앱 860→340KB + three 519KB 병렬·캐시) ② **히어로 three 초기화 지연 부팅**(`rAF→rAF` 2프레임 뒤 → 셸/진입 애니 먼저 페인트) ③ `setPixelRatio` `2→1.75`. → [`main1-hero.md §13-1`](./docs/main1-hero.md).

---

## ⚡ 30초 요약

- **무엇**: _(앱 목적 미정)_ — React 컴포넌트 기반 정적 사이트.
- **스택**: **React 19 + Vite 8 + TS 6** (로컬 dev → `vite build` → `dist/`). ✅ 버전 고정·초기화 완료 → [`project-init.md`](./docs/project-init.md).
- **운영**: GitHub Pages **정적 배포**. 서버(백엔드·DB) 없음. → §1
- **워크플로**: 로컬 **Vibe 코딩**(HMR 반복) → git 푸시 → **Actions 자동 빌드·배포** 또는 정적 빌드본 수동 업로드.
- **자격정보**: **`.env`**(로컬·미추적)로 git/토큰 관리 → 허브 **C**.
- **문서**: 개발 스킬은 `docs/` 에, 대분류는 `docs/guide/_hub_*.md` 허브로 구조화 → **규약 §4**.

---

## ⚠️ 1. 운영 모델 — React + Vite → GitHub Pages 정적 (고정 제약)

> 이 절은 프로젝트 내용과 무관하게 **항상 적용**되는 빌드·배포·실행 제약입니다.

1. **정적 결과물만 배포**: 서버 사이드 처리·DB 없음. 모든 로직·상태·계산은 **브라우저(클라이언트)** 에서.
   `vite build` 산출(`dist/`)이 곧 배포물.
2. **빌드 기반**: 로컬 `dev`(HMR) 로 개발 → `vite build` → `dist/`. → 허브 **A·B**.
3. **배포 위치 ↔ `base` 일치**: 사용자 페이지 `<user>.github.io` → `base:'/'`(권장) / 프로젝트 페이지 `/<repo>/` → `base:'/<repo>/'`.
4. **에셋은 상대경로/`import`**: 절대경로(`/asset.js`)는 하위 경로 배포에서 누수·404 → Vite 의 `import`/`base` 에 맡긴다.
5. **SPA 새로고침 404 대비**: 경로 라우팅은 새로고침 시 404 → **해시 라우팅**(`#/...`) 또는 **`404.html` fallback**. → 허브 **B**.
6. **배포 경로 2가지**: ⓐ **GitHub Actions 자동(권장)** / ⓑ **정적 빌드본 수동 업로드**(`gh-pages` 브랜치). → 허브 **B**.
7. **비밀은 빌드에 넣지 않는다**: 정적이라 클라이언트에 그대로 노출. `.env` 는 **로컬 git/도구 인증용**, CI 비밀은 Actions Secrets. → 허브 **C**.
8. **HTTPS 기본 제공**: 필요 시 PWA 확장 여지(도입은 추후).

> 위 제약을 바꾸는 결정(SSR 도입, 라우팅 방식 변경 등)은 **사용자 확인 후** §1·해당 허브에 반영합니다.

---

## 🗂 2. 파일 구조 (초기화 완료 ✅)

```
ppp/
├─ CLAUDE.md               ← (이 파일) 프로젝트 허브 = 대분류 인덱스
├─ .gitignore             ✅ (.env·node_modules·dist 제외)
├─ .env.example           ✅ (자격정보 템플릿 / .env 는 로컬·미추적)
├─ README.md               ← 실행/배포 안내 (추후)
│
│  ── 앱 코드: Vite react-ts 스캐폴드 (2026-06-22, 빌드 검증 ✔) ──
├─ index.html             ✅ Vite 진입
├─ src/                   ✅ main.tsx(해시 라우터·'/'→Main1)·routes/Main1.*·index.css
├─ public/               ✅ favicon.svg·favicon-32/apple-touch/icon-192·512.png·manifest.webmanifest·og-image.png
├─ vite.config.ts        ✅ base:'/'(유저 페이지)·plugin-react
├─ package.json          ✅ react 19·vite 8·react-router 8.0.1·ts 6
├─ tsconfig*.json        ✅ (app·node 분리)
├─ eslint.config.js      ✅ flat config
├─ .github/workflows/    ✅ deploy.yml (Actions 자동 배포)
│  (node_modules/·dist/ 는 생성물·미추적)
│
└─ docs/                  ✅ 생성됨
   ├─ guide/_hub_dev.md · _hub_deploy.md · _hub_git.md · _hub_mcp.md
   ├─ guide/trigger_index.md   ← 대분류 ↔ 허브 ↔ 정본 라우팅 맵
   ├─ dev-stack.md · local-run.md · deploy.md · git-setup.md · git-connection.md · mcp-setup.md · project-init.md · portfolio-plan.md  ← 정본
   └─ README.md                ← 문서 인덱스
```

> ✅ = 생성 완료. 앱 코드는 [`docs/project-init.md`](./docs/project-init.md) 절차로 스캐폴드·설정·빌드 검증됨.

---

## 🧭 3. 작업 대분류 트리거 인덱스

> ⛔ **규칙**: 작업이 아래 대분류 중 하나에 닿으면, **코드를 만지기 전에** 해당 가이드 허브
> (`docs/guide/_hub_*.md`)를 먼저 Read 합니다. 매칭이 모호하면 후보 허브를 **모두** 펼칩니다.
>
> **3단 체계**: 본 표(대분류 분류) → **가이드 허브**(세부 도메인 목차 + 실제 확인사항) → **정본**(`docs/*.md`) + 소스코드.

| 대분류 | 닿는 작업 (핵심 신호) | 가이드 허브 |
|--------|----------------------|------------|
| **A. 로컬 개발·React·Vibe 코딩** | React·Vite·`dev`/HMR·`src/`·컴포넌트·라우팅·에셋 import·Vibe 코딩 반복 | [`_hub_dev.md`](./docs/guide/_hub_dev.md) |
| **B. 빌드·GitHub Pages 정적 배포** ⚠️ | `vite build`·`dist/`·`base`·SPA 404·`vite preview`·Actions `deploy.yml`·정적 빌드본 업로드·`gh-pages` | [`_hub_deploy.md`](./docs/guide/_hub_deploy.md) |
| **C. Git 연계·`.env` 자격정보** ⚠️ | `git init`/원격/푸시·브랜치·`.gitignore`·`.env`/PAT·`gh` CLI·Actions Secrets | [`_hub_git.md`](./docs/guide/_hub_git.md) |
| **D. MCP·도구 설정·버전 고정** ✅ | MCP 서버·Node/Vite/React **버전 고정**·스캐폴드·최신 액션 버전·**초기화 런북** | [`_hub_mcp.md`](./docs/guide/_hub_mcp.md) |

> 각 허브가 자기 대분류의 **전체 트리거 키워드 + 세부 도메인 목차 + 실제 확인사항**을 보유.
> 라우팅 맵: [`docs/guide/trigger_index.md`](./docs/guide/trigger_index.md). 개발 스킬 전반: [`docs/README.md`](./docs/README.md).

### 복수 대분류가 걸리는 작업
예: **첫 배포 셋업** → **B**(Actions·base) + **C**(원격·푸시·Secrets). 해당 허브를 **모두 Read**.

---

## 📐 4. docs 허브 구조화 규약 ⭐

> 이 절이 **이번 단계의 핵심**입니다. 앞으로 docs 를 만들 때 **반드시 이 규약**을 따릅니다.

### 4-1. 3단 체계

```
CLAUDE.md §3 (대분류 분류)
   └─► docs/guide/_hub_<대분류>.md   (세부 도메인 목차 + 실제 확인사항 체크리스트)
          └─► 정본 docs/*.md + 소스코드   (사소한 디테일이 필요할 때만 내려감)
```

- **1단(CLAUDE.md §3)**: 트리거 신호로 **대분류만 분류**. 짧게 유지.
- **2단(가이드 허브 `_hub_*.md`)**: 그 대분류의 **전체 트리거 키워드 + 세부 도메인 목차 + 실제 확인사항**.
  일반 작업은 **여기까지 읽으면 충분**해야 한다.
- **3단(정본 `docs/*.md`)**: 도메인별 상세 사양. 허브에서 링크로 연결. 세부가 필요할 때만 진입.

### 4-2. 파일·네이밍 규칙

- 가이드 허브: `docs/guide/_hub_<대분류키>.md` (예: `_hub_deploy.md`, `_hub_state.md`). 접두사 `_hub_` 고정.
- 라우팅 맵: 허브가 **2개 이상**이면 `docs/guide/trigger_index.md` 에 `대분류 ↔ 허브 ↔ 정본` 표를 둔다.
- 정본 문서: `docs/<도메인>.md` (예: `architecture.md`, `deploy.md`). 가이드 허브에서 링크.
- 문서 인덱스: `docs/README.md` 에 허브 목록 + 정본 목록을 둔다.

### 4-3. 가이드 허브(`_hub_*.md`) 작성 템플릿

각 허브는 아래 **5개 구획**을 포함한다(이 프로젝트의 모든 허브가 동일 형식).

```markdown
# 가이드 허브 — <대분류 코드·이름>

> 한 줄: 이 허브가 다루는 범위. (개념 단계면 🟡 상태 배지)

## 1. 트리거 키워드
이 중 하나라도 닿으면 이 허브 — 심볼·파일명·용어를 빠짐없이 나열.

## 2. 세부 도메인 목차
| # | 도메인 | 무엇 | 정본 |  ← 하위 주제를 표로 분해

## 3. 실제 확인사항 (작업 전 체크리스트)
- [ ] 실수하기 쉬운 지점·불변 규칙·다른 허브와의 연계를 체크박스로.

## 4. 정본 / 소스
- 정본: docs/*.md 링크 · 소스: 실제 파일 경로

## 5. 자주 함께 걸리는 대분류
- 복수 대분류가 동시 트리거되는 경우 안내.
```

### 4-4. 작성 원칙

1. **CLAUDE.md 는 얇게**: 대분류 분류·공통 규칙만. 세부는 허브로 내린다.
2. **허브는 자족적으로**: 해당 대분류 작업을 허브만 읽고 시작할 수 있게 키워드·체크리스트를 충분히.
3. **단일 출처(SSOT)**: 같은 사실을 여러 문서에 복붙하지 않는다. 정본 1곳 + 나머지는 링크.
4. **운영 제약 연동**: 모든 허브의 체크리스트는 §1(정적·상대경로·해시라우팅)과 어긋나지 않는지 점검 항목을 포함.
5. **상태 표기**: 구현 전 개념이면 🟡, 확정이면 그대로. 미결 항목은 체크박스로 남긴다.
6. **불일치 시 정본 우선**: CLAUDE.md·허브·정본이 어긋나면 정본을 신뢰하고 상위를 갱신.

---

## 5. 다음 단계

0. ✅ **MCP 연결**(D-1) + **버전 고정**(D-2/D-3) + **초기화·빌드 검증** + **커밋·푸시** + **GH Pages 첫 배포(라이브)** 완료.
1. ✅ 로컬 Node **24.17.0 업그레이드** + `react-router@8.0.1` 상향 + lockfile 갱신 완료(빌드 검증).
2. ✅ **`/main-1` 메인(히어로) + 자기소개(2P) 섹션 개발 완료**(2026-06-26): 3D 물리 히어로 → [`main1-hero.md`](./docs/main1-hero.md) / 3페이지 스크롤·색반전·디자인 이력서·**페이지 이동 UX 확정**(데스크탑 휠 락 모델 / 모바일 터치 완전 제어 드래그)·글라스 OS 분기·헤더 메타/OG → [`main1-scroll-interactions.md`](./docs/main1-scroll-interactions.md)·[`site-meta.md`](./docs/site-meta.md).
3. ✅ **2026-06-26 운영/수정 묶음**(전부 라이브 검증): ⓐ **유저 페이지 전환**(레포 rename·`base:'/'`·OG·문서 일괄) → [`git-connection.md`](./docs/git-connection.md)·허브 **B/C** ⓑ **Main1 `/` 메인 승격** + Vite 스캐폴드 정리(App·assets·`icons.svg` 제거, `<Navigate>` 구 `/main-1` 리다이렉트) ⓒ **프로덕션 글라스 블러 깨짐 수정**(esbuild `backdrop-filter` 중복 제거 → webkit 먼저/표준 마지막) → [`main1-scroll-interactions.md §6-2a`](./docs/main1-scroll-interactions.md)·허브 **B** ⓓ **모바일 '빈 파비콘' 수정**(불투명 베이스+PNG 폴백+manifest) → [`site-meta.md`](./docs/site-meta.md).
4. ✅ **2026-06-30 헤더 네비게이션 반응형**(빌드 검증·Playwright 측정): **PC·큰 태블릿(≥769) 우측 세로 슬라이더 게이지**(점·트랙·진행도 fill·글로우/펄스 활성 노드·호버 툴팁, `gap: clamp(38px,5vw,82px)` vw 기반 길이 반응형, `scrollToSection` 단일 easeInOutCubic 으로 1→3 중간 섹션 통과) / **모바일·작은 태블릿(≤768) 풀스크린 슬라이드 메뉴**(우→좌, Main·Profile·works·활성 언더라인·호버, 항목 클릭→이동, 스크림/ESC/리사이즈/**좌→우 스와이프**로 닫힘) + **배경 스크롤 잠금**(휠 `preventDefault`·터치 `menuOpenRef` 가드·스크롤바 숨김). ⚠️ **회귀 수정**: `overflow:hidden` 잠금이 `scrollTop` 을 리셋해 닫은 뒤 '빈 라이트 화면'으로 고착 → overflow 미사용(스크롤바만 숨김) + 메뉴 토글마다 `resyncRef` 로 진행도(`--inv`·`is-page-2`) 재동기화. → [`main1-scroll-interactions.md §5-4`](./docs/main1-scroll-interactions.md)·허브 **A**.
5. ✅ **2026-07-01 3P(// works) 포트폴리오 섹션 개발**(빌드 검증 ✔, 콘텐츠 더미): 세로 타임라인(스파인+노드·년도 그룹·펼침·`--seq` 재생) + 상세 모달(portal·PC 다이얼로그/모바일 풀스크린) + **`animateTo` 워치독**(모달 blur rAF 스톨 → 휠 락 고착 자가치유) + 벤토 패럴럭스(`--par`) + 2P 패널 구조 재사용. → [`main1-works.md`](./docs/main1-works.md)·[`main1-scroll-interactions.md §5-5`](./docs/main1-scroll-interactions.md)·허브 **A**.
6. ✅ **2026-07-01 3P `PROJECTS` 실데이터 + UX 다듬기**(빌드 검증 ✔): 더미 5개 → **23개 실경력 프로젝트**(2022~2026, 백엔드→풀스택). 데이터 모델 확장(`client`·`summary`·`overview[]`·`features[]`·`team`·`status`·`links`·`note`) + **상세 모달 재구성**(Overview/Key Features 불릿 · Tech Stack 칩 · Details 담당/인원/현황/링크 · 성과 note 콜아웃). **섹션 제목 → "프로젝트"**. 추가 다듬기: **최신순 정렬**(년도·년도내 월 내림차순, 최상단 자동 전개) · **커버 이미지 비활성**(실스크린샷 없음 → `hasImage:false` 텍스트 전용) · **`+/−` → 원형 chevron 토글** · **접힌 바=프로젝트명만 / 펼침에 메타·핵심기능·현황 보강** · **등장 속도 개선**(스태거 지연·자동전개 타이머 축소) · **PC 폰트 컴팩트 튜닝**. → [`main1-works.md §2·§3·§4`](./docs/main1-works.md).
8. **(다음)** **커버 이미지(실스크린샷) 교체**(커버는 `import` `url()`·절대경로 금지). → [`main1-works.md §2`](./docs/main1-works.md).
9. 변경 푸시 시 Actions가 자동 재배포(→ 라이브 URL 갱신). 앱 목적/기능 확장 시 §30초요약·대분류 표 갱신.

> 확정: **스택·문서·허브·MCP·버전 고정·앱 스캐폴드·배포 파이프라인(라이브)·`/main-1` 메인+자기소개 섹션·페이지 이동 UX·헤더 메타/OG·유저 페이지 전환·`/` 메인 승격·프로덕션 글라스 블러 수정·모바일 파비콘 수정·헤더 네비게이션 반응형(게이지/풀스크린 메뉴·스와이프 클로즈·스크롤 잠금)·3P 프로젝트 타임라인+상세 모달+`animateTo` 워치독·`PROJECTS` 23개 실경력 반영**.
> 다음: **커버 이미지(실스크린샷) 교체**. 커밋·푸시는 사용자 확인 후.
