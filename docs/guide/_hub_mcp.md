# 가이드 허브 — D. MCP·도구 설정·버전 고정 ✅

> MCP 서버 설정과 도구/런타임 **버전 고정**을 다루는 허브.
> ✅ **상태: 확정(2026-06-22).** D-1: **context7 연결됨**. D-2: **버전 고정표 확정**(Node 24·React 19.2.7·Vite 8.0.16·TS 6.0.3·react-router 8.0.1). D-3: **스캐폴드 명령 확정**.
> 정확한 값은 정본 [`mcp-setup.md`](../mcp-setup.md)(SSOT). **실제 초기화 절차·실행 결과는 [`project-init.md`](../project-init.md)**.

---

## 1. 트리거 키워드

MCP 서버·설정 · 도구 인증 · Node·Vite·React **버전 고정** · 패키지매니저 선택 ·
스캐폴드 명령(`npm create vite@latest …`) · 최신 액션 버전 · 버전 호환성

## 2. 세부 도메인 목차

| # | 도메인 | 무엇 | 정본 |
|---|--------|------|------|
| D-1 | MCP 서버 | 사용할 서버·용도·인증 | [mcp-setup](../mcp-setup.md) ✅ context7 |
| D-2 | 버전 고정표 | Node·Vite·React·매니저 확정 | [mcp-setup](../mcp-setup.md) ✅ |
| D-3 | 스캐폴드 | 최신 플래그로 프로젝트 초기화 | [mcp-setup](../mcp-setup.md) ✅ |
| D-4 | **초기화 런북** | 실제 스캐폴드·`base`·라우터·`deploy.yml` 실행 절차 | [project-init](../project-init.md) ✅ |

## 3. 실제 확인사항 (작업 전 체크리스트)

- [x] **D-1: context7 MCP 연결됨** (user scope, HTTP). 라이브러리 최신 문서·버전 조회용.
- [x] **D-2: 버전 고정표 확정** — Node 24.17.0 · React 19.2.7 · Vite 8.0.16 · TS 6.0.3 · react-router 8.0.1 · npm. → [mcp-setup D-2](../mcp-setup.md)
- [x] **D-3: 스캐폴드 명령 확정** — `npm create vite@latest . -- --template react-ts`.
- [x] SSOT 동기화 완료: [`dev-stack.md`](../dev-stack.md)·[`deploy.md`](../deploy.md)·[CLAUDE.md](../../CLAUDE.md).
- [ ] **버전 변경 시**: 이 표(mcp-setup D-2)를 **먼저** 고치고 위 3개 문서 동기화.
- [ ] **프로젝트 초기화(스캐폴드 실행)는 사용자 확인 후** — 아직 미수행(앱 코드 미생성).

## 4. 정본 / 소스

- 버전 SSOT: [`mcp-setup.md`](../mcp-setup.md) · 초기화 런북: [`project-init.md`](../project-init.md)
- 소스: `~/.claude.json`(MCP) · `package.json`·`vite.config.ts`·`.github/workflows/deploy.yml`

## 5. 자주 함께 걸리는 대분류

- **A·B 전부**: 초기화 런북([`project-init.md`](../project-init.md))이 개발(A)·배포(B) 절차를 한 번에 실행한다.
