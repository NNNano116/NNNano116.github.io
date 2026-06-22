# CLAUDE.md — 프로젝트 허브

> **(앱 목적 미정)** · **React + Vite** → **GitHub Pages 정적 배포** 프로젝트
> 이 파일은 **상시 공통 규칙 + 작업 대분류 인덱스(§3) + docs 허브 구조화 규약(§4)** 을 담는 **허브**입니다.
> 각 대분류의 세부 내용은 **가이드 허브**(`docs/guide/_hub_*.md`)가 보유합니다(§3 표에서 진입).

> 🟡 **현재 상태**: 스택(React+Vite+GH Pages)·개발 스킬 문서·git/`.env` 규약 **확정**.
> **MCP**: `context7` 연결됨(D-1). **버전 고정**(D-2/D-3, 2026-06-22): Node 24.17.0 · React 19.2.7 · Vite 8.0.16 · TS 6.0.3 · react-router 7.18(→Node24 후 8.0.1) · npm → SSOT [`mcp-setup.md`](./docs/mcp-setup.md).
> ✅ **프로젝트 초기화 완료**(스캐폴드+`base`+해시 라우터+`deploy.yml`, **빌드 검증 ✔**) → [`project-init.md`](./docs/project-init.md). **앱의 구체 목적·기능**은 추후.

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
├─ src/                   ✅ main.tsx(해시 라우터)·App.tsx·assets·*.css
├─ public/               ✅ favicon.svg·icons.svg
├─ vite.config.ts        ✅ base:'/nano-portfolio/'·plugin-react
├─ package.json          ✅ react 19·vite 8·react-router 7.18(→24업 후 8)·ts 6
├─ tsconfig*.json        ✅ (app·node 분리)
├─ eslint.config.js      ✅ flat config
├─ .github/workflows/    ✅ deploy.yml (Actions 자동 배포)
│  (node_modules/·dist/ 는 생성물·미추적)
│
└─ docs/                  ✅ 생성됨
   ├─ guide/_hub_dev.md · _hub_deploy.md · _hub_git.md · _hub_mcp.md
   ├─ guide/trigger_index.md   ← 대분류 ↔ 허브 ↔ 정본 라우팅 맵
   ├─ dev-stack.md · deploy.md · git-setup.md · git-connection.md · mcp-setup.md · project-init.md · portfolio-plan.md  ← 정본
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

0. ✅ **MCP 연결**(D-1) + **버전 고정**(D-2/D-3) + **프로젝트 초기화·빌드 검증** 완료 → [`project-init.md`](./docs/project-init.md).
1. **(다음)** 로컬 Node 22.20.0 → **24.17.0 LTS 업그레이드** 후 `npm i react-router@latest`(→8.0.1) — 고정 버전 정합.
2. 스캐폴드 산출물 **커밋·푸시**(사용자 확인 후) → GitHub **Settings → Pages → Source: GitHub Actions** → 첫 배포.
3. **앱 개발 시작**(Vibe 코딩): `npm run dev` → `src/App.tsx`부터. → 허브 **A** [`dev-stack.md`](./docs/dev-stack.md).
4. 앱 목적/기능이 정해지면 §30초요약·대분류 표를 확장(필요 시 새 허브 추가).

> 현재까지 확정: **스택·문서·git/`.env` 규약·허브 구조·MCP·버전 고정·앱 스캐폴드(빌드 검증)**.
> 다음: **로컬 Node 24 업그레이드 · 커밋/푸시 · 첫 배포 · 앱 개발**(사용자 진행). 커밋·푸시는 사용자 확인 후.
