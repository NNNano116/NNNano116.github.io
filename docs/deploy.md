# 빌드 · GitHub Pages 정적 배포 (정본)

> 로컬 개발물을 **Vite 로 정적 빌드(`dist/`)** 하여 **GitHub Pages** 로 서빙한다.
> 두 가지 배포 방식을 모두 지원: **(A) GitHub Actions 자동 배포(권장)**, **(B) 정적 빌드본 수동 업로드**.
> ✅ 도구·액션 버전 확정됨(2026-06-22) → [`mcp-setup.md` D-2](./mcp-setup.md)(SSOT).

---

## 1. 핵심 제약 3가지 (GH Pages 특유)

| 함정 | 내용 | 해결 |
|------|------|------|
| **base 경로** | 산출 에셋이 `/`(루트) 기준이라 하위 경로 배포 시 404 | `vite.config` 의 `base` 를 배포 위치에 맞춤 (§2) |
| **SPA 새로고침 404** | `/about` 직접 진입/새로고침 시 Pages 가 파일을 못 찾음 | **해시 라우팅**(`#/about`) 또는 **`404.html` fallback**(§4) |
| **상대 경로** | 절대경로(`/img.png`)는 하위 경로 배포에서 깨짐 | Vite `import`/상대경로 사용, `base` 에 맡김 |

## 2. `base` 설정 (가장 중요)

`vite.config` 의 `base` 값을 배포 위치에 맞춰야 한다.

| 배포 위치 | URL | `base` |
|-----------|-----|--------|
| **사용자 페이지** | `https://<user>.github.io/` | `'/'` ✅ 가장 단순 |
| **프로젝트 페이지** | `https://<user>.github.io/<repo>/` | `'/<repo>/'` |

> 사용자 페이지(`<user>.github.io` 저장소)면 `base: '/'` 로 끝나 함정이 줄어든다. 가능하면 이 방식 권장.

## 3. 빌드

- 산출: `vite build` → `dist/` (정적 html/css/js + 에셋).
- 프로덕션 미리보기: `vite preview` 로 빌드본을 로컬에서 확인(배포 전 최종 점검).
- `dist/` 는 **생성물** → `.gitignore` 에 포함(Actions 가 매번 새로 빌드). 단 방식 B(수동)에서는 별도 브랜치로 푸시.

## 4. SPA 라우팅 404 회피 (택1)

- **해시 라우팅(권장·단순)**: `#/path` 형태. Pages 가 항상 `index.html` 을 주므로 새로고침 안전.
- **`404.html` fallback**: 빌드 후 `dist/404.html` 에 `index.html` 내용을 복사 → 미스 경로를 SPA 가 처리.
  Actions 워크플로의 빌드 뒤 스텝에 복사 단계를 넣는다.

> 결정은 라우팅 도입 시점에 [`dev-stack.md`](./dev-stack.md) 와 함께 확정. 초기엔 해시 라우팅이 마찰이 가장 적다.

## 5. 방식 A — GitHub Actions 자동 배포 (권장)

흐름: **push → Actions 가 `build` → `dist/` 를 Pages 에 배포.**

1. 저장소 **Settings → Pages → Source: GitHub Actions** 선택.
2. `.github/workflows/deploy.yml` 추가 — 단계 개요(액션 태그는 [`mcp-setup.md` D-2](./mcp-setup.md), 조회 2026-06-22):
   - `actions/checkout@v7` → `actions/setup-node@v6`(`node-version: 24`) → `npm ci` → `npm run build` → (필요 시 `404.html` 복사) → `actions/configure-pages@v6` → `actions/upload-pages-artifact@v5` → `actions/deploy-pages@v5`.
3. push 시 자동 빌드·배포. **자격증명 불필요** — Actions 의 `GITHUB_TOKEN` 자동 사용(로컬 `.env` 와 무관).

> 액션 버전의 SSOT 는 [`mcp-setup.md` D-2](./mcp-setup.md). 갱신 시 그 표를 먼저 고친다.

## 6. 방식 B — 정적 빌드본 수동 업로드

로컬에서 빌드한 `dist/` 를 직접 올리는 방식(Actions 없이).

- **옵션 1: `gh-pages` 브랜치 푸시** — 로컬 `build` → `dist/` 를 `gh-pages` 브랜치 루트로 푸시 →
  Settings → Pages → Source 를 해당 브랜치로. (`gh-pages` npm 도구 또는 수동 git)
- **옵션 2: `docs/` 폴더 배포** — `vite build --outDir docs` 로 빌드 후 main 의 `/docs` 를 Pages 소스로 지정.
  ⚠️ 이 경우 우리 **문서 `docs/` 와 충돌**하므로 권장하지 않음(빌드 출력은 `gh-pages` 브랜치로 분리).

> 수동 업로드는 자격증명이 필요(푸시) → [`git-setup.md`](./git-setup.md) 의 `.env` 토큰 사용.

## 7. 배포 전 체크리스트

- [ ] `vite.config` 의 `base` 가 배포 위치와 일치하는가. (사용자페이지 `'/'` / 프로젝트페이지 `'/<repo>/'`)
- [ ] 라우팅이 있으면 새로고침·직접진입이 동작하는가(해시 또는 `404.html`).
- [ ] 에셋이 상대경로/`import` 인가(절대경로 누수 없음).
- [ ] `vite preview` 로 프로덕션 빌드본을 로컬 확인했는가.
- [ ] 방식 A: Pages Source 가 "GitHub Actions" / 방식 B: 올바른 브랜치인가.
- [ ] 비밀값을 빌드 산출에 박지 않았는가(정적이라 **클라이언트에 그대로 노출**됨 — `.env` 의 비밀은 빌드에 넣지 말 것).

## 8. 정본 / 연계

- 개발·로컬: [`dev-stack.md`](./dev-stack.md) (허브 **A**)
- Git·자격정보·`.env`: [`git-setup.md`](./git-setup.md) (허브 **C**)
- 운영 제약 원칙: 루트 [`../CLAUDE.md`](../CLAUDE.md) §1
