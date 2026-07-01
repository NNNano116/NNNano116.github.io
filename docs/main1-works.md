# main-1 3P `// works` 포트폴리오 타임라인 + 상세 모달 (정본)

> `/` (Main1) **3페이지(// works) 개발·포트폴리오 섹션**의 단일 출처(SSOT).
> 기존 스킬 카드 그리드(`.work-grid`/`.work-card`)를 **세로 타임라인(스파인+노드)** 으로 교체(2026-07-01).
> 섹션 프레임(색반전·휠 섹션 캡·글라스·리빌)은 [`main1-scroll-interactions.md`](./main1-scroll-interactions.md), 히어로는 [`main1-hero.md`](./main1-hero.md).
> 소스: `src/routes/Main1.tsx`(`WorksTimeline`·`WorkModal`·`PROJECTS`) · `src/routes/Main1.css`(`.tl*`·`.wm*`).

> ✅ **상태: 인터랙션·레이아웃·실데이터 확정**(2026-07-01, 빌드 검증 ✔). `PROJECTS` **23개 실경력 반영 완료**(§2). 남은 것은 **커버 이미지(실스크린샷) 교체**뿐.

---

## 1. 개요 — 왜 타임라인인가

- 3P(`// works`)는 이제 **년도별 세로 타임라인**: 왼쪽 **스파인(선) + 노드(점)**, 년도 그룹 헤더(큰 노드·라벨·프로젝트 수), 그 아래 프로젝트 바(점 클릭 → 커버·상세 펼침).
- **배경/패널은 2P(디자인 이력서)와 동일 구조 재사용**: `seg__inner` 에 `seg__inner--resume` 를 그대로 부여해 확정된 프로스트 패널·폭(`max-width:1260px`)·글라스를 상속(3P 전용 배경 코드 없음) → [`main1-scroll-interactions.md §6-2`](./main1-scroll-interactions.md).
- 색은 진행도 변수 `--p`(=`--inv`)로 다크↔라이트 적응(3P 는 라이트).

## 2. 데이터 모델 (`PROJECTS`) — ✅ 실데이터 (2026-07-01)

`type Project`:
- `idx`(커리어 순번 문자열, `01`=최초 이지몬 … `23`=최신 윈오피스) · `name`(표시 제목) · `client`(회사/고객사, 커버 태그·모달 헤드) · `year`(그룹 키, 내림차순) · `period`
- `role`(담당, 모노 대문자 — Backend / Planning · Backend / Fullstack (단독) / Solo …) · `summary`(펼침 한 줄) · `overview[]`(소개) · `features[]`(주요기능) · `stack[]`(기술 칩)
- `team`(개발 인원) · `status`(서비스 현황) · `links?`(서비스 URL) · `note?`(성과/특이사항 하이라이트 — 예: 빅토리월렛 마이그레이션 연 4,900만원 절감, 바이브 코딩) · `tone`(커버 듀오톤 `a`~`e`) · `hasImage`.
- `WINCARD_LINKS`/`VWALLET_LINKS` 상수로 반복 링크 공유.

**23개 실경력 프로젝트**(백엔드→풀스택, 2022.01~2026.06). 년도 그룹: 2022(5) · 2023(3) · 2024(6) · 2025(4) · 2026(5).

> ⚠️ **커버 이미지 현재 비활성**(실스크린샷 없음): `hasImage` 를 **전부 `false`** 로 두어 타임라인 펼침·모달 모두 **커버 없이 텍스트 전용**으로 표기(가짜 그라디언트 포스터·대형 인덱스 미노출). 실스크린샷 확보 시 커버 아트(`.tl-item__art` / `.wm__art`)를 **import 한 `url()`** 로 채우고 해당 항목 `hasImage:true` 로 전환(**절대경로 금지** → [`CLAUDE.md §1`](../CLAUDE.md)). `tone` 은 (커버 활성 시) 색조만 결정.
> · **정렬 = 최신순**: 년도 그룹은 `year` 로 자동 묶여 **내림차순**(상단이 최신 2026), 년도 내 항목도 **`idx` 내림차순**(같은 해 최신 달이 위). `idx` 는 커리어 순번이라 오래된 프로젝트가 작은 번호. 자동 펼침 대상(`firstIdx`)은 **최신 = `PROJECTS` 마지막 원소**(최상단 항목).

## 3. 타임라인 인터랙션 (`WorksTimeline`)

- **접힌 바 = 프로젝트명만**(2026-07-01): idx + **타이틀**(+ 토글 chevron)만 노출. 기간·담당·고객사는 펼침 메타로 이동(스캔 가독성). 타이틀은 대비·크기 상향(`clamp(16,1.7vw,25px)`·weight 700).
- **펼침(펴짐)**: 바 클릭 = 선택/토글. 열린 프로젝트는 React state `active`(idx)로 **단일 소유**. 패널은 `grid-template-rows 0fr→1fr`(`.tl-item.is-open`)로 높이 애니메이션(clip). (커버 비활성이라) 좌측 액센트 quote 블록(`.is-noimg`)에 **메타(기간·담당·고객사) → 한 줄 소개 → 핵심 기능 3개 불릿 → 스택 칩 → 현황 뱃지 + View** 를 전개(초기 노출 정보 보강).
- **토글 인디케이터(`.tl-item__chev`)**: 원형 버튼 안 chevron(⌄). 열림 시 **원이 180° 회전(⌃)** + 악센트 링/점등(과거 `+/−` 의 '−' 가 맨대시처럼 보이던 문제 → chevron 으로 교체, 2026-07-01).
- **정렬**: 년도 내림차순 그룹 + 년도 내 `idx` 내림차순(최신 달 위) → 최상단이 커리어 최신. 자동 펼침은 최신(최상단) 항목.
- ⚡ **등장 속도(2026-07-01)**: 항목 28개(년도+프로젝트)라 per-seq 지연이 크면 하단이 3초+ 늦게 떴음 → **`transition-delay: calc(0.4s+seq*0.11s)` → `calc(0.1s+seq*0.028s)`**, 숨김 트랜지션 `0.6/0.72/0.7s → 0.45/0.5/0.45s`, 자동 펼침 타이머 `550+총개수*100ms`(≈3.35s) → **고정 720ms**(최신=최상단이라 일찍 등장). 체감 로드 대폭 단축.
- ⚠️ **리빌을 전역 `.reveal` IO 로 하지 않는 이유**: 토글 리렌더 때 React 가 `className` 을 덮어써 IO 가 넣은 클래스를 지운다(→ 항목이 사라짐). 그래서 **자체 state(`entered`)로만** 등장을 소유.
- **진입 스태거(`--seq`)**: 스파인 draw 후 년도 헤더·항목이 `--seq` 순번대로 `blur(7px)+translateY(22px)` → sharp 로 focus-in. `transition-delay: calc(0.4s + var(--seq)*0.11s)`. `.tl.is-entered` 가 게이트.
- **진입/재생 오케스트레이션(`replay`)**: `entered` 를 껐다(숨김) 40ms 뒤 켜서 CSS 스태거를 **재시작**(2P 처럼 도착마다 재생).
  - `fresh=true`(스크롤로 섹션 도착): `active` 리셋 → 스태거 종료(`550 + (년도수+항목수)*100`ms) 뒤 **첫 프로젝트 자동 전개**(단, 사용자가 먼저 조작했으면 `interacted` 로 취소).
  - `fresh=false`(메뉴/모달 오버레이 해제): 열려있던 `active` **유지하며 복원 재생**.
  - `visible = onPage(page===2) && !covered`, 여기서 **`covered = menuOpen`(모달 제외)**. `onPage` 이탈 → 다음은 fresh, 메뉴로 가려짐 → 다음(메뉴 닫힘)은 restore(`nextFresh` 플래그).
  - ⚠️ **모달은 가림 판정에서 제외**: 모달(View)은 타임라인을 전체(모바일)·백드롭 블러(PC)로 완전히 덮으므로, 뒤의 타임라인은 `entered` 그대로 두고 **재생하지 않는다** → **모달을 닫아도 스태거가 다시 돌지 않음**(재확인 후 깜빡임 제거). 열린 항목(`active`)도 그대로 유지.
  - ⚠️ **rAF 대신 `setTimeout`**: rAF 는 idle/백그라운드에서 멈춰 재생이 걸릴 수 있어 견고성 위해 타이머 사용. `reduced-motion` 이면 스태거 없이 즉시 `entered`.
- **부모 연동**: `<WorksTimeline page={page} menuOpen={menuOpen} />` — 섹션 추적 state(§5-4)와 메뉴 상태를 그대로 받아 재생 타이밍 판단.
- **PC 사이즈 튜닝(2026-07-01)**: 초기 렌더가 PC 에서 과대해 **여러 차례에 걸쳐 축소 → 최종 확정값**(모바일 하한은 유지, vw 계수·최대값만 낮춰 **PC 에서만 컴팩트**). 현재 핵심 `clamp` 값:

  | 요소 | 클래스 | 최종 `font-size` |
  |---|---|---|
  | 년도 라벨 | `.tl-year__label` | `clamp(22px, 1.9vw, 30px)` |
  | 프로젝트명(타이틀) | `.tl-item__title` | `clamp(15px, 1.25vw, 19px)` |
  | 한 줄 소개 | `.tl-item__desc` | `clamp(14px, 1vw, 15.5px)` |
  | 텍스트전용 소개 | `.is-noimg .tl-item__desc` | `clamp(14.5px, 1.05vw, 16px)` |
  | 핵심 기능 불릿 | `.tl-item__points li` | `clamp(12.5px, 0.85vw, 13.5px)` |
  | 메타 라인 | `.tl-item__meta` | `11.5px` |

  - **여백**: 년도 헤더 상단 `clamp(20px,2vw,30px)`, 항목 바 상하 `clamp(12px,1.35vw,18px)`.
  - **레이아웃(커버 활성 시 대비)**: `.tl-item__content` `max-width:820px`, 커버 `max-width:340px`+`align-self:center`(현재는 `hasImage:false` 라 커버 미표시·텍스트 전용).
  - ⚠️ **가독성↔크기 균형**: 한 번 크게 올렸다가(가독성) 다시 낮춘(PC 과대) 이력 → 값 재조정 시 **모바일 하한은 건드리지 말고 vw·최대값만** 손댈 것.

## 4. 상세 모달 (`WorkModal`)

- 펼친 패널의 **`View →` 클릭 → `modal`(idx) state** → `createPortal(<WorkModal/>, document.body)`.
- **`document.body` 로 portal 하는 이유**: `.main1`(스크롤 컨테이너)의 변형·스크롤과 독립시켜 **전체 뷰포트에 고정**(`position:fixed; inset:0`).
- **반응형**: PC = 중앙 다이얼로그(`max-width`), **≤768 = 전체화면 덮기**(`inset:0; max-width:none; max-height:100dvh`) — 풀스크린 메뉴와 동일 감각.
- 백드롭 클릭·**ESC** 로 닫힘(`onClose` → `setModal(null)`). 백드롭 `backdrop-filter: blur(7px)`.
- 모달은 **가림 판정(`covered`)에서 제외** → 열고 닫아도 뒤의 타임라인은 `entered`·`active` 그대로 유지되며 **재생(스태거)이 다시 돌지 않는다**(§3). 모달이 뷰포트를 덮으므로 뒤가 정지해 있어도 시각적 문제 없음.
- **고급화 디자인·인터랙션(2026-07-01)** — `document.body` portal 이라 `--p`/`--inv` 미상속 → 자체 라이트 테마로 고정.
  - **패널**: 그라디언트 배경(`#fff→#eef2f9`)·22px 라운드·이중 그림자, 상단을 가로지르는 **그라디언트 액센트 라인**(`::before`, 블루→인디고, 양끝 페이드), 스크롤바 숨김.
  - **커버 포스터(현재 비활성)**: 실이미지가 없어 `hasImage:false` → 모달도 커버 없이 본문만 표시(`data-noimg` → 상단 여백 확대 + **닫기 버튼 밝은 배경용 재스타일**). 커버 CSS(켄번스 줌 `wmArt`·스크림·글래스 role 태그·대형 인덱스)는 이미지 확보 시 재사용 위해 유지.
  - **본문(실데이터 구조)**: 직계 자식(head → note? → Overview → Key Features → Tech Stack → Details)이 **순차 라이즈 스태거**(`wmRise`, nth-child 1~6 지연).
    - **head**: 키커 라인(그라디언트 바) + **client**(모노 라벨) + 타이틀 + 기간(점 인디케이터).
    - **note 콜아웃**(선택): 좌측 액센트 바 + 옅은 틴트 — 성과/특이사항(연 4,900만원 절감·바이브 코딩 등) 강조.
    - **Overview / Key Features**: `wm__list` 불릿(소개=다이아 마커, 기능=도트 마커).
    - **Tech Stack**: 칩(hover 리프트·글로우).
    - **Details**: 담당 / 개발 인원 / 서비스 현황 / 링크(`wm__rows` 라벨·값 2열, 행 구분선). 링크는 `target=_blank rel=noopener` 새 탭.
    - 섹션 헤더 `wm__h` 앞에 **짧은 액센트 라인**(`::before`).
  - **반응형**: PC = 중앙 다이얼로그(`min(720px)`), **≤768 = 전체화면**(하단 슬라이드 업 `wmSlideUp`·커버 `3/2`·타이틀/여백 조정). 이미지 없는 항목(`data-noimg`)은 본문 상단 여백 확대.
  - **접근성**: `reduced-motion` 이면 팝·슬라이드·켄번스·스태거 **전부 정지**(정적 표시).

## 5. ⚠️ animateTo 워치독 — 모달 blur 가 휠 스크롤을 '죽이던' 버그 (2026-07-01)

> **증상**: 모달을 한 번 열었다 닫으면 이후 **모든 휠이 무시**되어 섹션 이동이 완전히 멈춤('스크롤이 죽음').
> **원인**: 모달의 **전체화면 `backdrop-filter: blur`** 가 캔버스(three.js) 위에서 `requestAnimationFrame` 을 스톨 → `animateTo` 의 `step` 이 완료되지 못해 `animating`/`animatingRef`(휠 락)가 **영구 고착**.
> **해결**: `animateTo` 에 **워치독 타이머(`animSafety`)** 추가 — `dur+400ms` 안에 rAF 가 끝나지 못하면 **강제로 목표까지 이동 + 플래그 해제**(자가 치유). 종료 처리를 공용 `done()`(early-return·정상완료·워치독 공용)으로 통일해 어느 경로로 빠져도 락이 확실히 풀리게 함. `stopWheel`·클린업에서도 `clearTimeout(animSafety)`.

> 이 수정은 §5(페이지 이동)의 `animateTo` 견고성 항목이기도 함 → [`main1-scroll-interactions.md §5-5`](./main1-scroll-interactions.md).

## 6. 벤토 썸네일 패럴럭스 (`--par`)

- `.seg--work` 가 뷰포트를 지나는 진행도를 `--par`(≈ -1.2..1.2)로 노출 → 커버 아트가 `translate3d(0, calc(var(--par)*10px), 0)` 로 천천히 드리프트.
- 스크롤 컨테이너(`scrollRef`)에 **passive 리스너(읽기 전용)** 만 추가 → 휠-락(`wheel preventDefault`) 모델 **불간섭**. rAF 코얼레싱. `reduced-motion` 이면 비활성(정지).

## 7. 검증

- 빌드 ✔(83 modules, 2026-07-01). ⚠️ Playwright 시각 검증은 **다른 세션이 브라우저 프로필을 점유**해 자동 캡처 불가 → 사용자 프리뷰(`vite preview`) 육안 확인으로 진행.
- 수동 확인 목록: 최신순 정렬(2026 상단·년도 내 최신 달 위)·최상단 항목 자동 전개·접힌 바=프로젝트명만·펼침 메타/핵심기능/현황 노출·모달 열고 닫은 뒤 **휠 스크롤 정상(워치독)**·오버레이 해제 후 열린 항목 복원·`reduced-motion` 즉시 표시·PC 폰트 컴팩트.

## 8. 변경 관리 / 정본

- 프로젝트 데이터·커버 이미지 교체 시 **이 문서 §2 먼저 갱신** → `PROJECTS` 코드 → 필요 시 상위(CLAUDE.md) 동기화.
- 섹션 프레임(색반전·휠 캡·글라스·리빌·헤더 네비): [`main1-scroll-interactions.md`](./main1-scroll-interactions.md).
- 라우트·앱 구조 계획: [`portfolio-plan.md`](./portfolio-plan.md) · 운영 제약: [`CLAUDE.md §1`](../CLAUDE.md).
- 소스: `src/routes/Main1.tsx`(`WorksTimeline`·`WorkModal`·`PROJECTS`·패럴럭스 effect·`animSafety` 워치독) · `src/routes/Main1.css`(`.tl*`·`.wm*`).
