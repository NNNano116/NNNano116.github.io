# 문서 인덱스 (docs/)

React + Vite 기반 정적 사이트(GitHub Pages) 프로젝트의 상세 문서.
전체 개요·대분류 진입은 루트 [`CLAUDE.md`](../CLAUDE.md) 를 보세요.

> ✅ 도구/런타임 **버전 고정 확정**(2026-06-22) → SSOT [`mcp-setup.md` D-2](./mcp-setup.md).
> 문서는 **절차·규약 중심**, 정확한 버전은 그 표를 참조.

## 가이드 허브 (작업 진입점)

[`CLAUDE.md §3`](../CLAUDE.md) 대분류 인덱스 → 허브 → 정본의 3단 체계 중 **2단**.

| 가이드 허브 | 대분류 |
|------------|--------|
| [guide/_hub_dev.md](./guide/_hub_dev.md) | A. 로컬 개발·React·Vibe 코딩 |
| [guide/_hub_deploy.md](./guide/_hub_deploy.md) | B. 빌드·GitHub Pages 정적 배포 |
| [guide/_hub_git.md](./guide/_hub_git.md) | C. Git 연계·`.env` 자격정보 |
| [guide/_hub_mcp.md](./guide/_hub_mcp.md) | D. MCP·도구 설정·버전 고정 ✅ |
| [guide/trigger_index.md](./guide/trigger_index.md) | 대분류 ↔ 허브 ↔ 정본 라우팅 맵 |

## 정본 문서

| 문서 | 내용 |
|------|------|
| [dev-stack.md](./dev-stack.md) | React·Vite 스택, 로컬 환경, 프로젝트 구조, **Vibe 코딩** 워크플로 |
| [local-run.md](./local-run.md) | **로컬 빌드·실행·포트** ✔ — `npm run dev/build/preview`·dev 5173·preview 4173·`base` 접속 URL·포트 변경/충돌·주의사항 |
| [deploy.md](./deploy.md) | Vite 빌드, base/SPA 404, **Actions 자동 배포 + 정적 빌드본 수동 업로드** |
| [git-setup.md](./git-setup.md) | git 초기화·원격·브랜치, **`.env` 자격정보 관리**, 인증·보안 (규약) |
| [git-connection.md](./git-connection.md) | **실제 연동 현황** ✅ — 계정 `NNNano116`·레포 `NNNano116.github.io`(사용자 페이지)·gh 인증·`.env` 실값·검증 |
| [mcp-setup.md](./mcp-setup.md) | MCP 설정(✅ **context7**) + **버전 고정표 D-2/D-3 (SSOT)** ✅ |
| [project-init.md](./project-init.md) | **초기화·설정 런북** ✅ — 스캐폴드·`base`·해시 라우터·`deploy.yml` 실행 절차(NNNano116.github.io) |
| [portfolio-plan.md](./portfolio-plan.md) | **앱 구조·개발 계획** 🟡 — 멀티 라우트(해시)·페이지(Home/About/Projects/Contact)·슬라이더·착수 순서·차단항목 |
| [main1-hero.md](./main1-hero.md) | **main-1 3D 구체 물리 히어로** ✅ — `three.js` 씬·물리 모델(자석·부유·흐름·충돌·표면장력)·마우스/드래그/클릭 반응·속도 임계값 반발(떨림 제거)·튜닝 상수 |
| [site-meta.md](./site-meta.md) | **사이트 헤더·메타·파비콘** ✅ (2026-06-26) — 페이지명 `J·Young portfolio`·메타 설명·OG/Twitter 카드·theme-color(light/dark)·`lang=ko` / `favicon.svg` J·Y 글라스 원형(블루↔퍼플) / base 재작성·OG 절대 URL 주의 |
| [main1-scroll-interactions.md](./main1-scroll-interactions.md) | **main-1 스크롤 인터랙션 시스템** ✅ (2026-07-01) — 3페이지 인플로우 자연 스크롤·다크↔라이트 색반전(`--inv` 3/5)·명칭 모프+핸드오프·11개 다국어+단어 rise·**페이지 이동 UX 확정(데스크탑 휠 '한 제스처=1섹션' 락 / 모바일 터치 '완전 제어' 드래그 — 1:1 추종·16% 임계 전환·상단 갭 없음)**·**헤더 네비 반응형(게이지/풀스크린 메뉴·스와이프 클로즈·스크롤 잠금)**·**`animateTo` 워치독(§5-5 — 모달 blur rAF 스톨로 휠 락 고착 자가치유)**·디자인 이력서 2단·라이트 글라스·리빌·맨위로 버튼·반응형 |
| [main1-works.md](./main1-works.md) | **main-1 3P `프로젝트`(// works) 포트폴리오** ✅ (2026-07-01, 실데이터) — 세로 타임라인(스파인+노드·년도 그룹·**최신순 정렬**·점 선택 펼침)·**접힌 바=이름만/펼침 메타·핵심기능·현황**·원형 chevron 토글·진입 스태거(`--seq`, 빠른 로드)·`replay`/`entered` 재생·상세 모달(데이터리치 Overview/Features/Stack/Details/note·portal·PC 다이얼로그/모바일 풀스크린)·`PROJECTS` **23개 실경력**·커버 비활성(텍스트 전용)·PC 컴팩트 튜닝 |
