# 가이드 허브 — C. Git 연계·`.env` 자격정보 관리

> git 초기화·원격·브랜치·푸시와, **`.env` 로 계정/토큰을 관리**하는 규약을 다루는 작업의 진입 허브.
> ⚠️ **비밀값 커밋 금지**가 최우선 불변 규칙.

---

## 1. 트리거 키워드

`git init`·`git remote`·`git push`·브랜치(`main`/`gh-pages`) · `git config user.*` ·
`.gitignore` · `.env` · `.env.example` · `GITHUB_TOKEN`/PAT · `gh` CLI(`gh auth login`) ·
credential helper · Actions Secrets · 자격증명·인증 · 원격 URL · 저장소 모델(사용자/프로젝트 페이지) ·
**실제 연동 현황**(계정 `NNNano116`·레포 `nano-portfolio`·rename·연동 검증)

## 2. 세부 도메인 목차

| # | 도메인 | 무엇 | 정본 |
|---|--------|------|------|
| C-1 | 저장소 모델 | 사용자페이지 vs 프로젝트페이지 | [git-setup §1](../git-setup.md) |
| C-2 | 초기 설정 | `init`·`config`·원격·첫 푸시 | [git-setup §2](../git-setup.md) |
| C-3 | 인증 방식 | `gh` CLI / credential manager / `.env` PAT | [git-setup §3](../git-setup.md) |
| C-4 | `.env` 규약 | 키 목록·로컬 전용·CI 분리·빌드 미포함 | [git-setup §4](../git-setup.md) |
| C-5 | `.gitignore` | `.env`·`node_modules`·`dist` 제외 | [git-setup §5](../git-setup.md) · [`../../.gitignore`](../../.gitignore) |
| C-6 | 커밋·푸시 | 의미 단위 커밋 → 배포 연동 | [git-setup §6](../git-setup.md) |
| C-7 | **실제 연동 현황** | 계정·레포·인증·브랜치·`.env` 실값·검증 명령 | [git-connection](../git-connection.md) ⭐ |

## 3. 실제 확인사항 (작업 전 체크리스트) ⚠️

- [ ] `.env` 가 `.gitignore` 에 있고 **추적되지 않는가**(`git status` 미노출).
- [ ] 비밀(PAT)이 코드·**원격 URL**·`dist/` 에 박히지 않았는가.
- [ ] PAT 는 fine-grained·최소 권한(contents: write)·대상 한정·만료일 설정인가.
- [ ] **CI 비밀은 `.env` 가 아니라 Actions Secrets** 에 있는가(배포 토큰은 보통 `GITHUB_TOKEN` 자동).
- [ ] `.env.example` 은 **키 이름만**(값 없이) 담아 커밋되었는가.
- [ ] 정적 빌드물에 비밀을 주입하지 않았는가(클라이언트 노출) → 허브 **B**.

## 4. 정본 / 소스

- 정본(규약): [`git-setup.md`](../git-setup.md) — 원칙·절차·보안
- 정본(현황): [`git-connection.md`](../git-connection.md) ⭐ — 실제 연결된 계정·레포·인증·브랜치·`.env` 실값
- 소스: [`../../.gitignore`](../../.gitignore) · [`../../.env.example`](../../.env.example) · (`.env` 은 로컬 전용·미추적)

## 5. 자주 함께 걸리는 대분류

- **B** (배포): 푸시 → 빌드·배포 트리거, CI Secrets
- **A** (개발): 커밋 단위·Vibe 코딩 후 커밋
