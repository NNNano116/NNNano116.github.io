# main-1 스크롤 인터랙션 시스템 (3페이지 전환 · 색 반전 · 스냅 · 다국어 · 글라스) (정본)

> `/main-1` 의 **스크롤 기반 인터랙션 레이어** 단일 출처(SSOT). 히어로 비주얼(3D 구체·레이저·드래그 안내)은
> [`main1-hero.md`](./main1-hero.md), 라우트/구조는 [`portfolio-plan.md`](./portfolio-plan.md),
> 운영 제약(정적·상대경로·해시라우팅)은 [`CLAUDE.md §1`](../CLAUDE.md)을 **참조**(값 복제 금지).
>
> ✅ **상태: 확정** (2026-06-24). 빌드 검증 ✔ · Playwright로 진행도(`--inv`)·스냅·핸드오프·반응형 측정 ✔.
> 구현: `src/routes/Main1.tsx`(스크롤 effect·스냅·다국어 상태·3D resize) · `src/routes/Main1.css`(전환·글라스·반응형).

---

## 1. 개요 — 3페이지 1-라우트 스크롤 경험

`/main-1` 한 라우트 안에서 `.main1`(=`position:fixed` 스크롤 컨테이너)이 3개 섹션을 세로로 흘린다.

| 페이지 | 섹션 | 톤 | 내용 |
|--------|------|-----|------|
| **1p** | `.seg--hero` (100svh) | **다크** | 3D 구체 + 레이저 + 가운데 **다국어 자기소개 명칭** + 스크롤 안내 |
| **2p** | `.seg--resume` | **라이트** | 자기소개(`// profile`) — 명칭이 섹션 타이틀로, 이력 카드(내 상태/학력/교육/경력) |
| **3p** | `.seg--work` | 라이트 | `// works` 개발 & 포트폴리오 — 기술 스택 카드(hover 펼침) |

- `.main1`: `position:fixed; inset:0; overflow-y:auto` — `#root`(1126px 테두리)를 벗어나 전체 뷰포트를 채우고 내부가 스크롤.
- **배경 레이어**(`.main1__backdrop`, fixed, z0): 다크/라이트 그라데이션 + 레이저. 섹션은 투명 → 배경이 비친다.
- **3D 구체**(`.main1__canvas`, z2): 히어로 영역에 묶여 스크롤되며 위로 사라짐.
- **명칭**(`.main1__hero`, fixed, z6): 1p 중앙 ↔ 2p 좌상단 모프. 섹션·글라스 위에 그려짐.

## 2. 핵심 진행도 변수 `--inv` (다크↔라이트)

스크롤 effect(`Main1.tsx`)가 매 프레임 `--inv`(0=다크 … 1=라이트)와 `--p`(=`inv*100%`, color-mix 비율)를 갱신.

- **트리거**: 1→2 이동 거리(0 ~ 이력 top)의 **3/5 지점**(`INV.TRIGGER_FRAC 0.6`)에서 `target` 이 0↔1 로 **스텝**.
- **부드러운 전환**: `cur += (target-cur)·LERP(0.16)` lerp → 한 번에 휙 넘기지 않고 부드럽게 플립.
- `--p` 는 **퍼센트 문자열**(`"63.20%"`)로 직접 세팅 — `color-mix(in srgb, A, B var(--p))` 형식(콤마 3개 금지, 비율은 두 번째 색에 공백).
- 본문 색·카드·격자·로고·메뉴 색은 전부 `--p` 로 다크↔라이트 보간.

### 2-1. 색 반전을 '듀얼 레이어 크로스페이드'로
단일 `filter:invert()`는 중간값(0.5)이 평평한 회색이라 정착 위치에서 탁함 → **두 그라데이션을 opacity 크로스페이드**.
- `.main1__bg--dark`(네이비) / `.main1__bg--light`(쿨 라이트 블루그레이 + **격자** + 은은한 컬러 블롭, `opacity:var(--inv)`).
- 레이저(`.main1__lasers`)만 thin-line 이라 `filter:invert(var(--inv))`로 흰선↔검은선(중간 회색 거의 안 보임).
- 격자는 라이트 배경 레이어에만 → 라이트 전환 시 '개발자 코드' 톤으로 등장.

### 2-2. 클릭 게이트
`gateRef = scrollTop ≥ 3/5 트리거` → 그 이후 3D **클릭 버스트 미생성**(기존 관성은 유지). 복귀 시 자동 해제.

## 3. 명칭 모프 + 섹션 타이틀 핸드오프 ⭐

1p 가운데 **fixed** 명칭이 색 전환과 함께 좌상단으로 올라가 **이력 섹션의 타이틀**(in-flow)로 바뀐다(이중 노출 없음).

| 단계 | inv | 동작 |
|------|-----|------|
| 1p 고정 | 0 | `.main1__hero` 중앙(`translate(-50%,-50%)`), **마우스 패럴럭스**(`--px/--py`·`(1-inv)` 스케일) |
| 모프 | 0→0.8 | 좌상단(왼쪽 가장자리 **15vw**, `transform-origin:left top`)로 이동 + `scale 0.5`. 폭 무관하게 left edge 고정 |
| 페이드아웃 | 0.8→0.9 | `.main1__hero { opacity: (0.9-inv)*10 }` → 안착 직전 사라짐 |
| 섹션 타이틀 등장 | >0.88 | `.is-settled` → in-flow `.seg__title--name` 가 같은 자리에 나타남(스크롤과 함께 이동, fixed 아님) |

- **핵심**: 1p 명칭(fixed)과 2p 섹션 타이틀(in-flow)은 **시간차로 교대**(0.9 전 fixed만 / 0.9 후 in-flow만) → 동시에 2개 안 보임.
- 2p 섹션 타이틀이 in-flow 라 스크롤하면 섹션과 함께 자연스레 흘러간다(과거 fixed 명칭이 카드 사이에 떠다니던 문제 해결).
- `--name-vis`(JS) 는 3p 로 갈 때 명칭 잔상 페이드용.

## 4. 다국어 자기소개 + 단어별 rise ⭐

명칭은 11개 언어로 순환(`TITLES`, `titleIdx` 3.4s 간격). 세그먼트 구조로 **이름은 크게, 나머지는 2px 작게**, 마침표는 둥근 `。`.

- **데이터**: `TITLES[i] = { spaced, lines:[ [word:[ {t, name?} ] ] ] }`. 문장=줄, 줄=단어, 단어=세그먼트.
  - 한국어 전체: `개발자 김준영입니다。 / 잘부탁드립니다。`. 길어지는 언어는 짧은 형태(이름 문장 + 인사).
  - `renderTitle(idx, firstLineOnly)`: 히어로=전체(2줄), **섹션 타이틀=첫 문장만**(`firstLineOnly`) → // profile 헤딩 한 줄 고정(오버플로 방지).
- **이름/나머지 크기**: `.main1__name { font-size:1em }` · `.main1__rest { font-size: calc(1em - 2px) }`.
- **단어별 rise (1p)**: 언어 전환 시 `titleIn` 을 `false→(rAF×2)→true` 로 토글. CSS:
  - 기본 `.main1__title-word { opacity:0; translateY(0.6em); transition }`, `--reset` 은 `transition:none`(즉시 숨김→깜빡임 방지), `.main1__title--in` 에서 `opacity:1`(단어별 `--w·0.08s` 스태거).
  - ⚠️ **키프레임-on-remount 는 무거운 3D 위에서 starve** 되어 단어가 opacity 0 에 갇힘 → **transition + 클래스 토글**(JS 제어)로 안정화.
- **단어별 rise (2p)**: 섹션 타이틀은 **`.is-settled` 도착 시 1회** rise(`.main1.is-settled .seg__title--name .main1__title-word`). 이후 **보인 채로 텍스트만 순환**(리셋 없음 → 사라지지 않음).
- 로고(`.main1__logo-word`)는 **J·Young** → 1→2 전환 시 `· portfolio` 펼침 + 라이트에서 다크로.

## 5. 임계 스프링 스냅 (페이지 자동 정렬) ⭐

스크롤/드래그를 멈춘 위치가 두 페이지 사이면, **떠난 방향에서 3/10 이상** 이동했으면 그쪽 페이지로, 미만이면 원래로.

| 옵션(`SNAP`) | 값 | 의미 |
|------|-----|------|
| `THRESHOLD` | **0.3** | 3/10 이상=다음/이전, 미만=복구 |
| `DUR_FWD` / `DUR_BACK` | 680 / 480ms | easeOutCubic |
| `IDLE` | 120ms | 멈춤(터치 관성 종료) 감지 |

- 스냅 지점 = 섹션 상단들 `[0, rTop, wTop]`. 방향(`dir`)은 직전 스크롤 부호로 판정 → "위/아래 상황에 맞춰".
- **오실레이션 방지**: 스냅점 ±12px 정착 가드 + animateTo 정수 라운딩.
- **떨림 방지**: 사용자가 다시 wheel/touchstart 하면 진행 중 스냅 즉시 취소(`cancelSnap`) → 입력과 다투지 않음.
- 안내 클릭(`scrollToNext`)·스냅은 모두 JS rAF 이징(CSS `scroll-snap` 미사용).

## 6. 라이트 섹션 글라스 + 카드 인터랙션 ⭐

- **프로스트 글라스 패널**(`.seg__inner::before`): 라이트 전환(`.is-light`) 시 부드럽게 등장. 얇은 유리 — `backdrop-filter: blur(5px)` + 옅은 sheen → **레이저·격자가 살짝 흐릿하게 비침**(불투명 채움 아님). 라운드+테두리.
- **이력 카드**: `.is-settled`(명칭 안착 후) 좌→우 스태거로 "텍스트에서 확장되듯" 등장(`transform-origin:top left`·scale+translateY). hover 시 즉시 위로 + 좌측 강조 바 + `＋`→`✕` + 상세 라인 reveal.
- **기술 카드**: hover/focus 시 스택 칩이 스태거로 펼쳐짐(상세 탐색). 터치는 `tabIndex` 포커스로 동일.
- **명칭 z-index**: `.main1__hero` 는 `.main1` 직속(섹션 밖) z6 → 글라스 패널 위에 그려져 **블러되지 않음**.

## 7. 마우스 패럴럭스 + 3D 구체 인터랙션

- **패럴럭스**: `.main1__hero` 에 `translate(--px·18px·(1-inv), --py·10px·(1-inv))` → 1p 마우스 따라 이동, 2p(`inv→1`)로 갈수록 0(중앙 고정)으로 자연 연계. 터치·reduced-motion 비활성.
- **유령 마우스 수정**: 캔버스가 뷰포트보다 큼(140svh·`top:-20svh`·`CANVAS_SCALE 1.4`)·오프셋 → `toWorld` 가 `getBoundingClientRect`로 실제 캔버스 위치 반영(커서와 정확히 일치).
- **구체 잘림 방지**: 캔버스를 뷰포트보다 크게 렌더(상하 여백) → 스크롤 중 구체가 가장자리에 안 잘림.
- **유휴 순환**: 메인 보는 중 + 3초+ 무입력이면 좌→우 짧은 펄스로 과밀 해소.
- **렌더 스킵(성능·전환 안정)**: `scrollTop > 0.9vh`(캔버스 사라짐) 이면 `renderer.render` 건너뜀 → GPU 절약 + 2p CSS 전환이 매끄러움(물리는 유지해 복귀 시 안 튐).

## 8. 반응형

| 구간 | 처리 |
|------|------|
| **PC 가로폭** | 좁아질수록 구체 클러스터 축소(`widthShrink = clamp(w/1600, .72, 1)`, camera.z↑) + 타이틀 `clamp(26px,5.6vw,82px)` 유동 |
| **≤1300px** | 서브타이틀이 타이틀 '아래' → **메인 타이틀 우측 하단**으로(우측 정렬, `top` 유지) |
| **≤1024px** | 2p(// profile) 섹션 타이틀 폰트 축소 `clamp(20px,3.6vw,32px)` |
| **모바일(2줄)** | `.main1__title-line { white-space:nowrap }` → 문장당 1줄(개발자 김준영입니다。 / 잘부탁드립니다。), 3줄로 안 깨짐 |
| **reduced-motion** | 스냅·단어 rise·전환 정적 처리 |

## 9. 검증 (Playwright)

- `--inv`: 3/5 통과 시 0→1 플립(페이지2 라이트), 복귀 시 0. 클릭 게이트 동기.
- 스냅: 아래 0.35→다음 / 아래 0.2→복구 / 위 0.35→이전 / 위 0.2→복구. 오실레이션 없음.
- 핸드오프: 2p 도착 시 `.main1__hero` opacity 0 + 섹션 타이틀 visible(이중 노출 없음). 섹션 타이틀 언어 순환 + 단어 opacity 1.
- 글라스: `.is-light` 패널 블러로 레이저 비침. 명칭 글라스 위 선명.

> ⚠️ **헤드리스 한계**: 무거운 3D WebGL이 컴포지터/rAF를 점유해 헤드리스에선 타이틀 CSS 전환·`--inv` lerp가 정체되어 보일 수 있음(opacity 0 표시). 실제 GPU 브라우저에선 정상. 렌더 스킵(§7)으로 완화.

## 10. 주요 튜닝 상수

| 카테고리 | 상수 | 값 |
|----------|------|-----|
| 색 전환 | `INV.TRIGGER_FRAC` / `LERP` | 0.6(3/5) / 0.16 |
| 스냅 | `THRESHOLD` / `DUR_FWD·BACK` / `IDLE` / 정착 EPS | 0.3 / 680·480 / 120 / 12px |
| 명칭 모프 | left edge / top / scale / 페이드 | 15vw / -34vh / 0.5 / `(0.9-inv)*10` |
| 다국어 | 언어 수 / 간격 / 단어 스태거 | 11 / 3.4s / `--w·0.08s` |
| 안착 | is-light / is-settled | inv>0.5 / inv>0.88 |
| 3D | CANVAS_SCALE / widthShrink / 렌더 스킵 | 1.4 / `clamp(w/1600,.72,1)` / `scrollTop>0.9vh` |

## 11. 변경 관리 / 정본

- 색 전환·`--inv` → §2, 명칭/핸드오프 → §3, 다국어/rise → §4, 스냅 → §5, 글라스/카드 → §6, 패럴럭스/3D → §7, 반응형 → §8 먼저 갱신 후 코드.
- 히어로 비주얼(구체 물리·레이저·드래그 안내)은 [`main1-hero.md`](./main1-hero.md). 라우트/구조는 [`portfolio-plan.md`](./portfolio-plan.md).
- 소스: `src/routes/Main1.tsx` · `src/routes/Main1.css` · `src/main.tsx`(라우트).
