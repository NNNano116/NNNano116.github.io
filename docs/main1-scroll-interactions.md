# main-1 스크롤 인터랙션 시스템 (3페이지 · 색반전 · 휠 섹션 캡 · 디자인 이력서 · 글라스) (정본)

> `/main-1` 의 **스크롤 기반 인터랙션 레이어** 단일 출처(SSOT). 히어로 비주얼(3D 구체·레이저·드래그 안내)은
> [`main1-hero.md`](./main1-hero.md), 라우트/구조는 [`portfolio-plan.md`](./portfolio-plan.md),
> 운영 제약(정적·상대경로·해시라우팅)은 [`CLAUDE.md §1`](../CLAUDE.md)을 **참조**(값 복제 금지).
>
> ✅ **상태: 확정** (2026-06-26). 빌드 검증 ✔ · Playwright로 `--inv`·휠/터치 섹션 캡·핸드오프·리빌·반응형 측정 ✔.
> 구현: `src/routes/Main1.tsx`(스크롤 effect·휠/터치 섹션 캡·리빌 IO·다국어·3D) · `src/routes/Main1.css`(전환·이력서·글라스·반응형).
> 모바일 보강: 터치 섹션 캡(§5-2)·글라스 블러 폴백·다크 노출 방지(§6-2).

---

## 1. 개요 — 3페이지 1-라우트 '인플로우 자연 스크롤'

`/main-1` 한 라우트 안에서 `.main1`(=`position:fixed` 스크롤 컨테이너)이 3개 섹션을 **일반 흐름(in-flow)** 으로 흘린다.
(과거의 '핀 고정·크로스페이드' 방식은 폐기 — 콘텐츠·타이틀이 섹션과 함께 자연스럽게 스크롤된다.)

| 페이지 | 섹션 | 톤 | 내용 |
|--------|------|-----|------|
| **1p** | `.seg--hero` (100svh) | **다크** | 3D 구체 + 레이저 + 가운데 **다국어 자기소개 명칭** + 스크롤 안내 |
| **2p** | `.seg--resume` | **라이트** | `// profile` + 명칭(인플로우) + **디자인 이력서 2단**(좌 연락처·스킬 / 우 경력·학력·교육) |
| **3p** | `.seg--work` | 라이트 | `// works` 개발 & 포트폴리오 — 기술 스택 카드(hover 펼침) |

- `.main1`: `position:fixed; inset:0; overflow-y:auto` — `#root`(1126px 테두리)를 벗어나 전체 뷰포트를 채우고 내부가 스크롤.
- **배경 레이어**(`.main1__backdrop`, fixed, z0): 다크/라이트 그라데이션 + 레이저. 섹션은 투명 → 배경이 비친다.
- **3D 구체**(`.main1__canvas`, z2): 히어로 영역에 묶여 스크롤되며 위로 사라짐(렌더 스킵 §7).
- **명칭**(`.main1__hero`, fixed, z6): 1p 중앙 ↔ 2p 좌상단 모프 후 **인플로우 섹션 타이틀로 핸드오프**(§3).
- **섹션 타이틀**(`.seg__head`, in-flow): 각 섹션 상단의 `// profile 명칭` / `// works 개발&포트폴리오` — 섹션과 함께 스크롤.

## 2. 핵심 진행도 변수 `--inv` (다크↔라이트)

스크롤 effect(`Main1.tsx`)가 매 프레임 `--inv`(0=다크 … 1=라이트)와 `--p`(=`inv*100%`, color-mix 비율)를 갱신.

- **트리거**: 1→2 이동 거리(0 ~ 이력 top)의 **3/5 지점**(`INV.TRIGGER_FRAC 0.6`)에서 `target` 이 0↔1 로 **스텝**.
- **부드러운 전환**: `cur += (target-cur)·LERP(0.16)` lerp → 한 번에 휙 넘기지 않고 부드럽게 플립.
- `--p` 는 **퍼센트 문자열**(`"63.20%"`)로 직접 세팅 — `color-mix(in srgb, A, B var(--p))` 형식(콤마 3개 금지, 비율은 두 번째 색에 공백).
- 본문 색·카드·격자·로고·메뉴 색은 전부 `--p` 로 다크↔라이트 보간. 클래스: `is-light`(inv>0.5)·`is-settled`(inv>0.88).

### 2-1. 색 반전을 '듀얼 레이어 크로스페이드'로
단일 `filter:invert()`는 중간값(0.5)이 평평한 회색이라 탁함 → **두 그라데이션을 opacity 크로스페이드**.
- `.main1__bg--dark`(네이비) / `.main1__bg--light`(쿨 라이트 + **격자** + 컬러 블롭, `opacity:var(--inv)`).
- 레이저(`.main1__lasers`)만 thin-line 이라 `filter:invert(var(--inv))`로 흰선↔검은선(중간 회색 거의 안 보임).

### 2-2. 클릭 게이트
`gateRef = scrollTop ≥ 3/5 트리거` → 그 이후 3D **클릭 버스트 미생성**(기존 관성은 유지). 복귀 시 자동 해제.

## 3. 명칭 모프 + 섹션 타이틀 핸드오프 ⭐

1p 가운데 **fixed** 명칭이 색 전환과 함께 좌상단으로 올라가 **이력 섹션의 인플로우 타이틀**(`.seg__head .seg__title--name`)로 교대된다(이중 노출 없음).

| 단계 | inv | 동작 |
|------|-----|------|
| 1p 고정 | 0 | `.main1__hero` 중앙, **마우스 패럴럭스**(`--px/--py`·`(1-inv)` 스케일) |
| 모프 | 0→0.8 | 좌상단(왼쪽 가장자리 **15vw**, `transform-origin:left top`)로 이동 + `scale 0.5` |
| 페이드아웃 | 0.8→0.9 | `.main1__hero { opacity:(0.9-inv)*10 }` → 안착 직전 사라짐 |
| 섹션 타이틀 등장 | >0.88 | `.is-settled` → 인플로우 `.seg__head`(eyebrow·명칭)이 같은 자리에 나타남(섹션과 함께 스크롤) |

- **핵심**: 1p 명칭(fixed)과 2p 섹션 타이틀(in-flow)은 **시간차 교대**(0.9 전 fixed만 / 0.9 후 in-flow만). eyebrow·명칭 단어 모두 `.is-settled` 게이트 → 도착 전 숨김.

## 4. 다국어 자기소개 + 단어별 rise ⭐

명칭은 11개 언어로 순환(`TITLES`, `titleIdx` 3.4s). 세그먼트 구조로 **이름은 크게, 나머지 2px 작게**, 마침표 `。`.

- **데이터**: `TITLES[i] = { spaced, lines:[ [word:[ {t, name?} ] ] ] }`. 한국어 전체 `개발자 김준영입니다。 / 잘부탁드립니다。`.
  - `renderTitle(idx, firstLineOnly)`: 히어로=전체(2줄) / **섹션 타이틀=첫 문장만**(오버플로 방지).
- **단어별 rise**: 언어 전환 시 `titleIn` 을 `false→(rAF×2)→true` 토글. 기본 `.main1__title-word{opacity:0;translateY}`,
  `--reset`은 `transition:none`(즉시 숨김), `.main1__title--in` 에서 `opacity:1`(단어별 `--w·0.08s` 스태거).
  - ⚠️ 키프레임-on-remount 는 무거운 3D 위에서 starve → **transition + 클래스 토글**(JS 제어)로 안정화.
  - 섹션 타이틀(2p)도 동일 `titleIn` + `.is-settled` 게이트로 매 전환 rise.
- 로고(`.main1__logo-word`)는 **J·Young** → 1→2 전환 시 `· portfolio` 펼침 + 라이트에서 다크로.

## 5. 페이지 이동 — JS 섹션 캡 (데스크탑 wheel + 모바일 touch, 동일 경험) ⭐⭐

> 핵심 UX: **한 번의 제스처(휠/드래그)로는 한 섹션만** 이동(1P→2P 가 최대, 오버슈트 차단). 이력이 뷰포트보다 길면 그 안에서는 자유 스크롤.
> CSS 스냅(`mandatory`=긴 콘텐츠 읽기불가 / `proximity`=오버슈트·전환 불안정)은 둘 다 부적합 → **데스크탑 wheel·모바일 touch 모두 JS 로 정밀 제어**(CSS 스냅 off).

### 5-1. 데스크탑(wheel) — '한 제스처 = 최대 1섹션' 락 모델 ⭐ (재설계 2026-06-26)
> ❌ 과거: 섹션 내부에서 **네이티브 스크롤을 허용**했는데 그 **관성이 경계 `animateTo` 와 충돌** →
> 2→3 에서 위로 튕기고 3→2 가 미완료. 또 **빠른 스크롤 한 번에 여러 섹션(1→3) 건너뜀**.
> → **항상 `preventDefault`(네이티브 스크롤 0)** + **휠 버스트당 1회만 이동하는 락**.
- `onWheel`(passive:false): 매 휠마다 `tryUnlock()`(150ms 후 락 해제) 예약 → **휠이 멎어야** 락이 풀림(= 한 제스처 = 1회).
  - `locked || animating || animatingRef.current` 이면 무시(이동 안 함).
  - 아니면 한 번 이동: 현재 섹션이 **'내용상' 뷰포트보다 충분히 큼(>1.2vh)** 이면 그 안에서 한 스텝(`±0.9vh`), 아니면 **다음/이전 섹션 top 으로 한 페이지**(`animateTo`).
  - 미세 초과(예: 이력 962px = 빈 패딩 62px)는 `tall` 아님 → **2↔3 은 항상 한 페이지 전환**(1→2, 2→3, 3→2, 2→1).
- `animateTo`: easeInOutCubic, `dur = min(720, 360 + |dist|·0.34)ms`(부드러운 속도). 버튼(맨위로·안내)은 `wheelStopRef` 로 휠 애니/락을 먼저 해제(충돌 방지).
- 검증(합성): 빠른 연타 8회도 **한 섹션만** 이동(1→3 건너뜀 없음), idle 후 다음 제스처에 다음 섹션 ✔.

### 5-2. 모바일(touch/drag) — '완전 제어' 드래그 모델 ⭐ (재설계 2026-06-26 v2)
> ❌ 과거 1: `touchmove` preventDefault → 안드로이드 초기 작은 이동에 네이티브 스크롤이 먼저 시작되면 stuck.
> ❌ 과거 2: 네이티브 스크롤 + 종료 스냅 → 임계가 **절반(0.5vh)** 이라 큰 드래그도 전환 안 되고, **상단 오버스크롤 갭** 노출.
> → **`touch-action: none`(CSS) 로 네이티브 스크롤/관성을 아예 끄고 JS 가 100% 제어**. 손가락을 1:1 로 따라오고 놓을 때 판단.
- `touchstart`: 진행 중 전환·관성 취소. 시작 scrollTop·**주 섹션**(뷰포트 중앙 기준)의 `top`/`bottom`/`readBot(=bottom−vh)` 기록.
- `touchmove`(passive:false, `preventDefault`): `scrollTop = 시작 + (시작Y − 현재Y)` 를 **문서 [0,max] 클램프** → **갭 없음**, 다음 페이지가 손가락 따라 슬라이드 인. 속도(`tVel`) 추적.
- `touchend`: 총 드래그 `rawDy` 와 방향으로 —
  - **시작이 섹션 경계**(상단/하단)였고 그 방향으로 `rawDy > 0.16vh` 또는 플릭(`|v|>0.45`) → `animateTo(다음/이전 섹션 top)` = **한 페이지 전환**, 아니면 **복귀**.
  - **섹션 내부에서 시작** → 그 섹션 범위 `[top, readBot]` 안에서만 **관성**(긴 이력 읽기, 다른 섹션으로 안 넘침).
- 효과: **드래그 16%·플릭이면 전환**(쉬움)·미만 복귀, 상단 갭 없음, **한 제스처 = 최대 1페이지**(1→2,2→3,3→2,2→1). 1P 3D 터치와 공존(스크롤=별도).
  검증(합성): 1P→2P(200px/플릭)·2P→3P 전환 / 느린 작은 드래그 복귀 / 이력 내부 읽기 비전환 / 상단 드래그다운 갭 0 ✔.
- `animateTo`: easeInOutCubic, `dur = min(720, 360 + |dist|·0.34)ms`(wheel·touch 공용). `reduced-motion` 비활성.
- **2P→3P 버벅임 완화**: 오프-히어로(`scrollTop > vh·0.92`)에서 **레이저 캔버스 렌더 스킵**(마지막 프레임 고정) → 전환 중 메인스레드 부하 ↓.

### 5-3. 안내 클릭 / 맨 위로
- 히어로 안내(`scrollToNext`): 다음(이력) 섹션으로 easeInOutCubic ~1.2s.
- **우측 하단 '맨 위로' 버튼**(`.main1__top`): `opacity:var(--inv)` → 1→2 전환에 맞춰 화살표가 자연스럽게 생성/소멸. 클릭 시 `scrollToTop`(최상단으로 easeInOutCubic). `reduced-motion` 비활성.

### 5-4. 헤더 네비게이션 — 반응형(게이지 / 풀스크린 메뉴) ⭐ (2026-06-30)
> 헤더 메뉴를 **입력·공간 환경별로 분기**. 현재 섹션은 `page`(0/1/2) state 로 추적(스크롤 effect 의 `computeTarget` 에서 뷰포트 중앙 기준 `mid = scrollTop + vh/2` 로 산출, 변화 시에만 `setPage`).
- **공용 이동 함수 `scrollToSection(idx)`**: 대상 섹션 `offsetTop`(0=히어로는 0)으로 **단일 easeInOutCubic 스크롤**(`dur = min(1400, 520 + |dist|·0.5)ms`). 단일 연속 스크롤이라 **1→3·3→1 도 중간 섹션을 '거쳐서' 자연스럽게 흐른다**('맨 위로'와 동일 메커니즘). 시작 시 `wheelStopRef.current?.()` 로 휠 락/lerp 해제(충돌 방지) + `animatingRef` 세팅.
- **PC·큰 태블릿(≥769) = 우측 중앙 세로 슬라이더 게이지**(`.main1__gauge`): 점(비활성 hollow 링) + 연결 트랙 + **진행도 악센트 fill**(`--seg=page` → 트랙의 `seg/2` 높이까지 차오름) + **활성 노드**(악센트 코어·글로우·은은한 펄스 링 `gaugePulse`). 영역 클릭 → `scrollToSection`. 메뉴명은 평소 숨김(호버 툴팁 `.main1__gauge-tip`만). 색은 `--p` 로 다크↔라이트 적응. 햄버거는 `display:none`. **게이지 길이(=점 간격 `gap: clamp(38px, 5vw, 82px)`)는 vw 기반** → 넓은 PC 에서 길고(≈278px@1920) 큰 태블릿으로 좁아질수록 점진 축소(≈216px@1024 → ≈194px@800).
- **모바일·작은 태블릿(≤768) = 풀스크린 슬라이드 메뉴**(`.main1__nav`): 햄버거 클릭 → `menuOpen` → 패널이 **우→좌 `translateX(100%)→0`**(꽉 찬 화면). 항목 **Main / Profile / works**(번호 01·02·03 + 라벨), 현재 페이지 **활성 강조(악센트 언더라인)**, 호버 시 `translateX` 슬라이드. 항목 클릭 → `setMenuOpen(false)` 후 `scrollToSection`. 스크림 클릭·ESC·**좌→우 스와이프**·데스크탑 폭 리사이즈로 닫힘. 패널 배경도 `--p` 로 다크↔라이트 적응(`-webkit-` 먼저/표준 마지막 — §6-2a 함정 준수). 게이지는 `display:none`.
  - **스와이프-투-클로즈**(2026-06-30): 메뉴가 우→좌로 열렸으므로 **반대 방향(좌→우) 드래그로 닫는다**. 패널에 `touch-action:none` → JS 가 완전 제어(`onNavTouch*`): 방향 락(세로 우세면 무시)·`translateX(dx)` 1:1 추종 + 스크림 opacity 페이드, 놓을 때 **드래그 ≥ 패널폭 30% 또는 우향 플릭(vx>0.5)** 이면 `setMenuOpen(false)`·미만이면 복귀(인라인 transform 제거 → CSS `.is-open` 전환이 이어받음).
  - **배경 스크롤 잠금**: 패널은 `.main1` 자식이라 휠이 버블로 배경 네비를 움직이던 버그가 있었음 → 배경 휠/터치 핸들러가 `menuOpenRef` 가드로 무시(휠은 `preventDefault` 로 네이티브 스크롤도 차단)·스크롤바는 `.main1.is-nav-open { scrollbar-width:none }` + `::-webkit-scrollbar{display:none}` 로 숨김.
  - ⚠️ **`overflow:hidden` 으로 잠그지 말 것**(2026-06-30 회귀 수정): 스크롤 컨테이너(`.main1`)에 `overflow:hidden` 을 토글하면 브라우저가 `scrollTop` 을 리셋/복원하며 **가짜 scroll 이벤트**를 일으켜 `--inv`/`is-page-2` 가 잘못 계산되고, 닫은 뒤 **위치는 히어로(0)로 튀고 테마는 라이트로 남아 '빈 라이트 화면'** 으로 고착됐다. → overflow 는 건드리지 않고 위처럼 스크롤바만 숨김.
  - **재동기화 안전장치**: 스크롤바 토글 리플로우가 섹션 높이(`wTop`)를 흔들어 `is-page-2`(리빌 게이트)가 어긋날 수 있어, 메뉴 토글마다 `resyncRef`(스크롤 effect 가 노출)로 **실제 `scrollTop` 기준 `computeTarget` 강제 재실행** → 콘텐츠 리빌/테마 고착 방지(닫힘 후 상태가 항상 실제 위치와 일치).
- 브레이크포인트 **768/769** 는 기존 이력 2열↔1열(§8)과 동일 경계.

### 5-5. `animateTo` 워치독 — 모달 blur 가 휠 스크롤을 '죽이던' 버그 ⚠️ (2026-07-01)
> ❌ 증상: 3P `View` 상세 **모달을 한 번 열었다 닫으면** 이후 **모든 휠이 무시**되어 섹션 이동이 완전히 멈춤('스크롤이 죽음').
> ❌ 원인: 모달의 **전체화면 `backdrop-filter: blur`** 가 캔버스(three.js) 위에서 `requestAnimationFrame` 을 스톨 → `animateTo` 의 `step` 이 완료되지 못해 `animating`/`animatingRef`(휠 락)가 **영구 고착**.
- ✅ **워치독 타이머 `animSafety`**: `animateTo` 시작 시 `dur+400ms` 예약 → 그 안에 rAF 가 못 끝내면 **강제로 `scrollTop=to` + 플래그 해제**(자가 치유).
- **공용 종료 `done()`**: early-return(`|dist|<2`)·정상완료·워치독이 **모두 `done()` 으로 수렴** → 어느 경로로 빠져도 `animating/animatingRef` 락이 확실히 풀림. `stopWheel`·언마운트 클린업에서도 `clearTimeout(animSafety)`.
- 상세(모달·타임라인): [`main1-works.md §5`](./main1-works.md).

## 6. 2P 디자인 이력서 + 글라스 + 리빌 ⭐

### 6-1. 디자인 이력서 (2단 / 세로 1단) — 확정
- 구조: `.seg__head`(// profile + 명칭) → `.resume__intro`(인사말 `-lead` + 본문 `-body`) → `.resume`(2단 그리드).
  - **좌(`.resume__col--left`)**: 연락처(Email·Phone·GitHub·Location) + 스킬(칩 11개).
  - **우(`.resume__col--right`)**: 경력·학력·교육 **세로 타임라인**(점 + 한 줄 `org · role` + 우측 기간 + 불릿/desc).
- 실데이터(확정): 연락처 `top9786@gmail.com`·`+82 10-9763-3007`·`경기 의왕시 오전동` / 스킬 11 /
  경력 `주식회사 윈카드(WINCARD) · 개발 팀장·대리`(주요 업무 3불릿) / 학력 `학점은행제 · 컴퓨터공학 전공(진행 중)` `· 정보처리 전공` / 교육 `빅데이터 UI 전문가반 · 코리아IT아카데미`.
- 타임라인 항목 필드: `org` `role` `period` + 선택 `desc`/`bullets`/`ongoing`.
  - **org · role 한 줄**(`.resume__head` flex:1) — 좁아지면 **role 만 통째로 아랫줄**로 내려가고 **기간은 윗줄 유지**(period flex:0, baseline 정렬).
  - `ongoing` → **진행 중 배지**(`.resume__badge`, 하늘색 #00aeff) + 채워진 활성 점(`.resume__entry--ongoing::before`).
  - 경력 `bullets` → 간략 업무 불릿 리스트(`.resume__bullets`).
- 자기소개 본문(`-body`)은 **의미 단위(`.resume__unit`)로 분리** → 단위 사이에서만 줄바꿈(PC `nowrap` / ≤768 `normal`).
- **헤더 클리어런스**: `.seg--resume`/`.seg--work` 에 `padding-top: clamp(56~62)` → 글라스·// profile 이 **고정 헤더(모바일 64/PC 80px) 아래에서 시작**(겹침 방지). 글라스 내부 상/하 패딩은 자연스러운 숨 공간 확보.
- 반응형: **≥769 = 좌/우 2열** / **≤768 = 세로 1열**(`.resume{grid-template-columns:1fr}`). PC에선 전체가 한 화면에 수렴(여백 압축).
- `box-sizing:border-box`로 `seg__inner` 가 max-width 에 padding 포함 → 타이틀·콘텐츠 좌측 정렬 일치.

### 6-2. 글라스 패널 (`.seg__inner::before`)
- 라이트 전환(`.is-light`) 시 부드럽게 등장. `backdrop-filter: blur(6px) saturate(1.18)` + 아주 옅은 sheen → 레이저·격자가 더 비침. 라운드+테두리.
- **투명도(흰색 틴트, 상단→하단) — 환경별**:
  - **PC·터치 PC(≥769)** = `0.1 / 0.045 / 0.018` (+blur, 레이저 비침).
  - **iOS·일반 폰(coarse ≤768)** = `0.4 / 0.31 / 0.26` — **iOS 는 backdrop-filter 정상 → 블러로 정돈, 완벽**.
  - **안드로이드(`.main1.is-android`, JS userAgent 감지)** = `0.66 / 0.56 / 0.5` — ⚠️ **안드로이드 크롬은 backdrop-filter 가 canvas(레이저·3D) 위에서 미작동** → 블러가 없어 0.4 면 배경이 너무 비침 → **블러 없이도 정돈되도록 더 불투명**(iOS·PC 는 영향 없음).
- ⚠️ **opacity 는 반드시 `::before` 자신에** 둔다 — 부모(`seg__inner`)에 opacity 를 주면 자식 `backdrop-filter` 가 격리되어 **블러가 사라진다**(과거 버그). 콘텐츠 페이드가 필요하면 별도 래퍼(`.seg__fade`) 사용.
- ⚠️ **블러 미작동은 OS 별로 다름**(핵심): **iOS·PC 는 backdrop-filter 정상** → 얇은 유리 유지. **안드로이드 크롬만** canvas 위 블러 미작동 → **JS userAgent 로 `.is-android` 부여 후 그때만 더 불투명**(위 투명도 표). `@supports` 는 '지원되지만 미렌더' 를 못 잡고, `pointer:coarse` 는 iOS/Android 를 못 가리므로 **userAgent 감지가 정답**. iOS 보강으로 `-webkit-overflow-scrolling:touch` 도 제거.
- 타이틀(`.seg__head`)이 `seg__inner` 안에 인플로우로 있어 **글라스가 // profile·명칭+콘텐츠 전체를 감싼다**.
- ⚠️ **오버스크롤/틈에 다크 배경 노출 방지**: `.main1` 의 배경을 `color-mix(#0d181f, light var(--p))` 로 두어 **--inv 따라 다크↔라이트 전환**(1P 다크 / 2P·3P 라이트). + `overscroll-behavior: none`(바운스 차단). (모바일에서 라이트 2P/3P 하단에 1P 다크가 노출되던 문제)

### 6-2a. ⚠️ 프로덕션 빌드에서 PC 글라스 블러가 사라지는 함정 (2026-06-26 수정) ⭐
**증상**: `npm run dev`(데스크탑 Chrome)에선 글라스가 정상 프로스트인데, **빌드 후(`vite preview`·GitHub Pages)** 에선 PC에서 블러가 사라져 레이저·격자가 카드를 그대로 관통. (안드로이드 미작동(§6-2)과는 **다른 별개 문제** — 이건 데스크탑 Chrome·프로덕션 한정.)

**원인**: **esbuild(Vite 기본 프로덕션 CSS 미니파이)가 `backdrop-filter` 와 `-webkit-backdrop-filter` 를 같은 속성으로 보고 한 규칙 안의 '마지막 선언만' 남긴다.** 글라스 규칙들이 소스에서 `표준 → -webkit-` 순서라, **표준 `backdrop-filter` 가 제거되고 `-webkit-` 만** 남아 데스크탑 Chrome 에서 블러가 미렌더(`getComputedStyle(...,'::before').backdropFilter === 'none'`). dev 서버는 CSS 비압축이라 둘 다 살아있어 정상 → **dev=O / prod=X 불일치**.

**해결**: 모든 글라스 규칙에서 **`-webkit-backdrop-filter` 를 먼저, 표준 `backdrop-filter` 를 '마지막'** 에 둔다(원래 정상이던 `.main1__top` 버튼과 동일 패턴) → 표준이 빌드에 살아남음. 대상 규칙: **`.seg__inner::before` · `.card` · `.work-card`**. (`Main1.css` 해당 위치에 순서 주의 주석 있음.)

**검증**: `vite preview`(프로덕션 빌드 로컬 서빙)로 재현 → 수정 후 computed `backdrop-filter:blur(6px) saturate(1.18)` 복구 → live(github.io)에서 Playwright 로 페이지2 스크롤·스크린샷 비교 ✔. **앞으로 `backdrop-filter` 추가 시 항상 webkit 먼저/표준 마지막**(다른 벤더 프리픽스 속성도 동일 리스크) → 빌드 후 `vite preview` 로 1회 확인 권장. (허브 **B** [`_hub_deploy.md`](./guide/_hub_deploy.md) 체크리스트 연동)

### 6-3. 리빌(스크롤하며 천천히 등장) ⭐
- **이력(2p)**: `.resume__intro`/`.resume__block` 은 **`.is-page-2`(이력이 '현재 페이지') + `.is-settled`** 게이트로 리빌.
  `transition-delay: calc(0.2s + var(--i)·0.11s)` → **명칭이 뜬 직후** 자기소개→연락처→스킬→경력… 순서로 **'적히듯' 구성**.
  - **`is-page-2`** = `scrollTop` 이 `[rTop·0.5, wTop − vh·0.15)` 일 때(JS). `is-settled`(색상)는 2P·3P 모두 true 라 3→2 재구성을 못 잡으므로 **별도 페이지 상태**가 필요.
    → **1P→2P / 3P→2P 어느 방향이든** 2P 도착 시 다시 구성. transition 은 '보임' 상태에만 둬 떠날 땐 즉시 숨김(staggered fade-out·깜빡임 방지). 자기소개는 인사말(`-lead`) + 본문(`-body`, 의미 단위 `.resume__unit`)로 구성.
- **포트폴리오(3p)**: 구 스킬 카드(`.work-grid`/`.work-card` + 전역 `.reveal` IO)는 **세로 타임라인으로 교체**(2026-07-01). 타임라인은 전역 `.reveal` IO 를 쓰지 않고 **자체 state(`entered`)** 로 등장을 소유(토글 리렌더 때 React 가 IO 클래스를 덮어써 지우는 문제 회피) — 도착·오버레이 해제마다 `--seq` 스태거 재생. → [`main1-works.md §3`](./main1-works.md).
  - 전역 `.reveal` IO(`Main1.tsx`, root=`.main1`·`rootMargin:0 0 -12% 0`·`unobserve`·`reduced-motion` 즉시)는 다른 리빌 요소용으로 유지.

## 7. 마우스 패럴럭스 + 3D 구체 인터랙션

- **패럴럭스**: `.main1__hero` 에 `translate(--px·18px·(1-inv), --py·10px·(1-inv))` → 1p 마우스 따라, 2p 로 갈수록 0. 터치·reduced-motion 비활성.
- **유령 마우스 수정**: `toWorld` 가 `getBoundingClientRect`로 실제 캔버스 위치 반영(CANVAS_SCALE 1.4·`top:-20svh`).
- **유휴 순환**: 메인 + 3초+ 무입력이면 좌→우 짧은 펄스로 과밀 해소.
- **렌더 스킵**: `scrollTop > 0.9vh` 면 `renderer.render` 건너뜀 → GPU 절약 + 2p 전환 매끄러움(물리는 유지).

## 8. 반응형

| 구간 | 처리 |
|------|------|
| **PC 가로폭** | 좁아질수록 구체 클러스터 축소(`widthShrink=clamp(w/1600,.72,1)`) + 히어로 타이틀 `clamp(26px,5.6vw,82px)` 유동 |
| **≤1300px** | 서브타이틀이 타이틀 '아래' → **메인 타이틀 우측 하단**(우측 정렬) |
| **≤1024px** | 2p 섹션 타이틀 폰트 축소 `clamp(20px,3.6vw,32px)` |
| **≤768px** | 이력 **2열 → 세로 1열** · 페이지 이동 CSS `proximity` 스냅(터치) |
| **모바일(2줄)** | `.main1__title-line{white-space:nowrap}` → 문장당 1줄 |
| **reduced-motion** | 휠 캡·리빌·단어 rise 비활성(정적), CSS 스냅 off |

## 9. 검증 (Playwright)

- **휠 섹션 캡**: 1P 에서 `deltaY 1200`(강한 관성) → `scrollTop` 이 정확히 `rTop`(2P)에서 캡, 2→3 오버슈트 0 ✔.
  2P top 휠다운 → 이력 내부 자유 스크롤(3P 로 안 튐) ✔. 이력 끝 휠다운 → 3P 스냅 ✔.
- **모바일 스냅**: `.main1 scroll-snap-type:y(proximity)`·`.seg scroll-snap-stop:always` ✔.
- **리빌**: 이력 블록 `.is-settled`로 등장(opacity 1, IO 아님) ✔ · 포트폴리오 카드 3P 진입 시 `.is-inview` ✔.
- **글라스**: `.is-light` 패널 `backdrop-filter:blur(5px)` 유지, 타이틀까지 감쌈 ✔. **정렬**: 타이틀·콘텐츠 left 일치(border-box) ✔.

> ⚠️ **헤드리스 한계**: 무거운 3D WebGL + 레이저 2D 캔버스가 컴포지터를 점유해, 헤드리스에선 타이틀 단어 rise·`--inv` lerp·is-settled 전환이 정체되어 보일 수 있음. **실제 GPU 브라우저에선 정상**. 휠 캡·리빌은 측정으로 검증됨.

## 10. 주요 튜닝 상수

| 카테고리 | 상수 | 값 |
|----------|------|-----|
| 색 전환 | `INV.TRIGGER_FRAC` / `LERP` | 0.6(3/5) / 0.16 |
| 섹션 캡 | `animateTo dur` | `min(720, 360+|dist|·0.34)ms` (easeInOutCubic, wheel·touch 공용) |
| 헤더 네비 | `scrollToSection dur` / 브레이크포인트 | `min(1400, 520+|dist|·0.5)ms` (1→3 멀수록 천천히) / 게이지≥769·메뉴≤768 |
| 터치 전환 임계 | 거리 / 플릭 / 따라옴 | `vh·0.14` / `1.3 px/ms` / `tDrag·0.42`(최대 0.55vh) |
| CSS 스냅 | 전 화면 | `none` (JS wheel·touch 가 제어) |
| 명칭 모프 | left edge / scale / 페이드 | 15vw / 0.5 / `(0.9-inv)*10` |
| 다국어 | 언어 수 / 간격 / 단어 스태거 | 11 / 3.4s / `--w·0.08s` |
| 리빌(이력) | 트리거 / delay | `.is-settled` / `0.2s + --i·0.11s` |
| 리빌(카드) | 트리거 / IO rootMargin | `.is-inview`(IntersectionObserver) / `0 0 -12% 0` |
| 안착 | is-light / is-settled | inv>0.5 / inv>0.88 |
| 3D | CANVAS_SCALE / 렌더 스킵 | 1.4 / `scrollTop>0.9vh` |

## 11. 변경 관리 / 정본

- 색 전환·`--inv` → §2, 명칭/핸드오프 → §3, 다국어/rise → §4, **페이지 이동(휠 캡/스냅) → §5**, **헤더 네비(게이지/풀스크린 메뉴) → §5-4**, **이력서/글라스/리빌 → §6**, 패럴럭스/3D → §7, 반응형 → §8 먼저 갱신 후 코드.
- 히어로 비주얼(구체 물리·레이저·드래그 안내)은 [`main1-hero.md`](./main1-hero.md). 라우트/구조는 [`portfolio-plan.md`](./portfolio-plan.md).
- 소스: `src/routes/Main1.tsx`(스크롤·휠 캡·리빌·다국어·3D) · `src/routes/Main1.css`(전환·이력서·글라스·반응형) · `src/main.tsx`(라우트).
