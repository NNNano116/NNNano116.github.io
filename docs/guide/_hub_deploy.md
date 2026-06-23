# 가이드 허브 — B. 빌드·GitHub Pages 정적 배포

> Vite 정적 빌드(`dist/`)와 GitHub Pages 배포(Actions 자동 / 정적 빌드본 수동 업로드),
> base 경로·SPA 404 회피를 다루는 작업의 진입 허브.
> ⚠️ 이 프로젝트의 **배포 함정(base·새로고침 404·절대경로)**이 여기 모인다.

---

## 1. 트리거 키워드

`vite build` · `dist/` · `vite.config` 의 `base` · `vite preview` ·
GitHub Pages · `Settings → Pages` · GitHub Actions · `deploy.yml` ·
`actions/upload-pages-artifact`·`actions/deploy-pages` · `GITHUB_TOKEN`(CI) ·
`gh-pages` 브랜치 · 정적 빌드본 업로드 · 새로고침 404 · 해시 라우팅 · `404.html` fallback ·
사용자페이지 `<user>.github.io` · 프로젝트페이지 `/<repo>/` · 상대 경로

## 2. 세부 도메인 목차

| # | 도메인 | 무엇 | 정본 |
|---|--------|------|------|
| B-1 | 핵심 제약 | base·SPA 404·상대경로 3대 함정 | [deploy §1](../deploy.md) |
| B-2 | base 설정 | 사용자페이지 `'/'` / 프로젝트페이지 `'/<repo>/'` | [deploy §2](../deploy.md) |
| B-3 | 빌드 | `vite build`→`dist/` · `preview` 미리보기 | [deploy §3](../deploy.md) |
| B-3a | **로컬 빌드·preview 포트** | `npm run build`(tsc+vite)·`preview` 4173·포트 변경/충돌 | [local-run](../local-run.md) ✔ |
| B-4 | SPA 404 회피 | 해시 라우팅 / `404.html` 복사 | [deploy §4](../deploy.md) |
| B-5 | 방식 A(권장) | GitHub Actions 자동 빌드·배포 | [deploy §5](../deploy.md) |
| B-6 | 방식 B | 정적 빌드본 수동 업로드(`gh-pages` 브랜치) | [deploy §6](../deploy.md) |

## 3. 실제 확인사항 (작업 전 체크리스트) ⚠️

- [ ] `base` 가 배포 위치와 일치하는가(사용자페이지 `'/'` / 프로젝트페이지 `'/<repo>/'`).
- [ ] 라우팅이 있으면 **새로고침/직접진입**이 되는가(해시 또는 `404.html`).
- [ ] 에셋이 상대경로/`import` 인가(절대경로 누수 금지).
- [ ] 배포 전 `vite preview` 로 프로덕션 빌드본을 로컬 확인했는가. (포트 4173·`base` 접속 URL → [`local-run.md §3`](../local-run.md))
- [ ] `npm run build` 실패 시 **`tsc -b` 타입 에러인지 `vite build` 인지** 로그로 구분했는가 → [`local-run.md §2`](../local-run.md).
- [ ] **비밀값을 빌드 산출에 넣지 않았는가** — 정적이라 클라이언트에 그대로 노출 → 허브 **C**.
- [ ] 방식 A: Pages Source = "GitHub Actions" / 방식 B: `gh-pages` 브랜치로 푸시(자격증명 필요 → 허브 **C**).
- [ ] 방식 B 에서 빌드 출력을 `docs/` 로 내보내 **문서 폴더와 충돌**시키지 않았는가(→ `gh-pages` 브랜치 권장).
- [x] ✅ 액션 버전 확정: checkout@v7 · setup-node@v6(node 24) · configure-pages@v6 · upload-pages-artifact@v5 · deploy-pages@v5 → SSOT [`mcp-setup.md` D-2](../mcp-setup.md).

## 4. 정본 / 소스

- 정본: [`deploy.md`](../deploy.md) · **로컬 빌드·실행·포트**: [`local-run.md`](../local-run.md) ✔ · **초기화 시 `base`·`deploy.yml` 작성 절차**: [`project-init.md`](../project-init.md)
- 소스: `vite.config.ts`(`base`), `.github/workflows/deploy.yml`, `dist/`(생성물), `package.json`(스크립트)

## 5. 자주 함께 걸리는 대분류

- **A** (개발): 라우팅·에셋 경로 설계
- **C** (Git): 푸시·자격증명·CI Secrets
- **D** (MCP/버전): 액션·도구 버전 확정
