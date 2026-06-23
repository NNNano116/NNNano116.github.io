# 트리거 인덱스 — 대분류 ↔ 가이드 허브 ↔ 정본 라우팅 맵

> [`CLAUDE.md §3`](../../CLAUDE.md) 의 대분류 인덱스에서 진입하는 3단 체계의 라우팅 맵.
> 매칭이 모호하면 후보 허브를 **모두** Read 한다.

## 대분류 → 허브 → 정본

| 대분류 | 가이드 허브 | 정본 / 소스 |
|--------|------------|------------|
| **A. 로컬 개발·React·Vibe 코딩** | [`_hub_dev.md`](./_hub_dev.md) | `dev-stack.md` · `local-run.md`(빌드·실행·포트 ✔) · `portfolio-plan.md`(앱 구조 계획 🟡) · `main1-hero.md`(main-1 3D 물리 히어로 ✅) · `src/**`·`vite.config.*`·`package.json` |
| **B. 빌드·GitHub Pages 정적 배포** | [`_hub_deploy.md`](./_hub_deploy.md) | `deploy.md` · `local-run.md`(로컬 빌드·preview 포트 ✔) · `vite.config.*`·`.github/workflows/`·`dist/` |
| **C. Git 연계·`.env` 자격정보** | [`_hub_git.md`](./_hub_git.md) | `git-setup.md`(규약) · `git-connection.md`(현황 ✅) · `.gitignore`·`.env.example` |
| **D. MCP·도구 설정·버전 고정** ✅ | [`_hub_mcp.md`](./_hub_mcp.md) | `mcp-setup.md`(버전 SSOT) · `project-init.md`(초기화 런북) · `~/.claude.json` |

## 자주 함께 걸리는 조합

| 작업 | 동시 트리거 |
|------|-------------|
| 새 화면/라우트 추가 | **A**(컴포넌트·라우팅) + **B**(새로고침 404·base) |
| 첫 배포 셋업 | **B**(Actions·base) + **C**(원격·푸시·Secrets) |
| 프로젝트 초기화 | **D**(스캐폴드·버전) + **A**(구조) + **C**(`.gitignore`·`.env`) |
| 비밀/토큰 다루기 | **C**(`.env`·Secrets) + **B**(빌드 산출에 미포함) |

## 3단 체계 복습

```
CLAUDE.md §3 (대분류 분류)
   └─► docs/guide/_hub_*.md (세부 도메인 목차 + 실제 확인사항)
          └─► 정본 docs/*.md + 소스코드
```

일반 작업은 **허브 수준에서 충분**하고, 세부 디테일이 필요할 때만 정본·소스로 내려간다.
✅ 버전·스캐폴드 확정됨 → SSOT [`mcp-setup.md` D-2](../mcp-setup.md). 다음은 **프로젝트 초기화**(사용자 확인 후).
