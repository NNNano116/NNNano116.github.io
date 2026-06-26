import { Fragment, useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import './Main1.css'

// main-1: 3D 구체 클러스터 물리 히어로 랜딩.
// 효과: 중심 응집(자석) + 구체끼리 충돌 + 커서 반발 + 클릭 버스트 + 부유/흐름(완만한 회전).
// 세 힘(자석·부유·흐름)의 가중치를 느린 사인으로 교차시켜 번갈아 강조한다.

// 가운데 타이틀 — 여러 언어로 순환되는 자기소개.
//  한국어는 전체("개발자 김준영입니다. 잘부탁드립니다."), 길어지는 다른 언어는 짧은 형태
//  ("김준영입니다. 잘부탁드립니다.")로 번역해 반영.
//  세그먼트 name:true = 이름(현재 크기 유지) / 나머지는 2px 작게.
//  spaced = 단어 사이 공백 사용(라틴·한글) / false = CJK(공백 없음).
// 문장마다 한 줄(lines). 각 줄 = 단어들, 각 단어 = 세그먼트. 마침표는 둥근 '。'로 통일.
type TitleSeg = { t: string; name?: boolean }
const TITLES: { spaced: boolean; lines: TitleSeg[][][] }[] = [
  {
    spaced: true,
    lines: [
      [[{ t: '개발자' }], [{ t: '김준영', name: true }, { t: '입니다。' }]],
      [[{ t: '잘부탁드립니다。' }]],
    ],
  },
  {
    spaced: true,
    lines: [
      [[{ t: "I'm" }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Nice' }], [{ t: 'to' }], [{ t: 'meet' }], [{ t: 'you。' }]],
    ],
  },
  {
    spaced: false,
    lines: [[[{ t: 'キム・ジュンヨン', name: true }, { t: 'です。' }]], [[{ t: 'よろしくお願いします。' }]]],
  },
  {
    spaced: false,
    lines: [[[{ t: '金俊英', name: true }, { t: '。' }]], [[{ t: '请多关照。' }]]],
  },
  {
    spaced: true,
    lines: [
      [[{ t: 'Soy' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Encantado。' }]],
    ],
  },
  {
    spaced: true, // Français
    lines: [
      [[{ t: 'Je' }], [{ t: 'suis' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Enchanté。' }]],
    ],
  },
  {
    spaced: true, // Deutsch
    lines: [
      [[{ t: 'Ich' }], [{ t: 'bin' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Freut' }], [{ t: 'mich。' }]],
    ],
  },
  {
    spaced: true, // Italiano
    lines: [
      [[{ t: 'Sono' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Piacere。' }]],
    ],
  },
  {
    spaced: true, // Português
    lines: [
      [[{ t: 'Sou' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Prazer。' }]],
    ],
  },
  {
    spaced: true, // Русский
    lines: [
      [[{ t: 'Я' }], [{ t: 'Ким', name: true }], [{ t: 'Джунён。', name: true }]],
      [[{ t: 'Очень' }], [{ t: 'приятно。' }]],
    ],
  },
  {
    spaced: true, // Tiếng Việt
    lines: [
      [[{ t: 'Tôi' }], [{ t: 'là' }], [{ t: 'Kim', name: true }], [{ t: 'Junyoung。', name: true }]],
      [[{ t: 'Rất' }], [{ t: 'vui。' }]],
    ],
  },
]

// 서브타이틀(메인페이지 전용): 한 줄(카테고리 + 기술 아이템)씩 순환. 2p 전환 시 제자리에서 사라짐.
const SUBTITLES: { label: string; items: string[] }[] = [
  { label: 'AI Services', items: ['Claude', 'Claude Design', 'Stitch', 'Gemini'] },
  { label: 'Vibe Coding', items: ['Claude Code', 'Codex'] },
  { label: 'Backend Fullstack', items: ['PHP', 'NestJS', 'MySQL'] },
  { label: 'Web/App Development', items: ['React Native', 'Flutter'] },
]

// ── 배경 레이저(mattwilldev.com 참조: Pts.js 기법 재현) ──
// 고정 기준선(우상향 대각)에 직교 투영한 수선들 = 모두 평행한 가파른 대각선(우상단→좌측하단).
// 점(레이저 헤드)이 중심 둘레를 아주 천천히 공전 → 선 길이·위치가 흔들린다. 커서 근처는 밝아짐.
const LASER_DOTS = ['#FF3F8E', '#04C2C9', '#2E55C1'] // 헤드 색(핑크·시안·블루)
// 사이트 실측: 레이저는 뷰포트 크기와 무관하게 고정 ~63.1°(수평 기준). refLine 은 그에 직교.
const LASER_DEG = 63.1

// 이력(2페이지) = 디자인 이력서. 좌: 연락처·스킬 / 우: 경력·학력·교육 타임라인.
const RESUME_INTRO = {
  lead: '안녕하세요, 4년차 백엔드 개발자 김준영입니다.',
  // 의미 단위(어절 그룹)로 분리 — 각 단위는 한 덩어리로 유지하고 줄바꿈은 단위 '사이'에서만(자연스러운 끊김).
  body: [
    'AI를 활용해',
    '기획·디자인·개발·운영을 아우르는',
    '엔드투엔드(End-to-End) 실무 프로젝트를 담당했고,',
    '단순 기능 구현을 넘어',
    '프로젝트 전체의 워크플로우와',
    '아키텍처를 설계할 수 있는 개발을 지향합니다.',
  ],
}
const RESUME_CONTACT: { k: string; v: string }[] = [
  { k: 'Email', v: 'top9786@gmail.com' },
  { k: 'Phone', v: '+82 10-9763-3007' },
  { k: 'GitHub', v: 'github.com/NNNano116' },
  { k: 'Location', v: '경기 의왕시 오전동' },
]
const RESUME_SKILLS = [
  'PHP',
  'MySQL',
  'NestJS',
  'React',
  'Vue',
  'Claude Code',
  'Codex',
  'Stitch',
  'Claude Design',
  'React Native',
  'Flutter',
]
type ResumeEntry = {
  org: string
  role: string
  period: string
  desc?: string
  bullets?: string[]
  ongoing?: boolean
}
const RESUME_CAREER: ResumeEntry[] = [
  {
    org: '주식회사 윈카드 (WINCARD)',
    role: '개발 팀장 / 대리',
    period: '2022.01 — 2026.07',
    bullets: [
      '사내 솔루션 윈카드·빅토리월렛 외 운영 플랫폼 신규 개발 및 유지보수',
      '인하우스 신규 프로젝트 및 외부 고객사 에이전시 웹/앱 프로젝트 개발',
      'Claude Code 기반 AI 에이전트 바이브 코딩 프로젝트 진행',
    ],
  },
]
const RESUME_EDU: ResumeEntry[] = [
  { org: '학점은행제', role: '컴퓨터공학 전공', period: '2026.04 — 2027.02 (예정)', ongoing: true },
  { org: '학점은행제', role: '정보처리 전공', period: '2021.04 — 2023.08' },
]
const RESUME_TRAINING: ResumeEntry[] = [
  {
    org: '빅데이터 UI 전문가반',
    role: '코리아IT아카데미',
    period: '2021.04 — 2021.09',
    desc: '국비지원 교육 · 빅데이터 UI 교육 이수',
  },
]
const RESUME_RIGHT: { h: string; entries: ResumeEntry[] }[] = [
  { h: '경력', entries: RESUME_CAREER },
  { h: '학력', entries: RESUME_EDU },
  { h: '교육', entries: RESUME_TRAINING },
]

// 개발 기술 그룹(포트폴리오 3페이지) — 카드 hover/focus 로 스택을 상세 탐색.
// 히어로 서브타이틀과 동일 축으로 구성해 일관성 유지.
const SKILL_GROUPS: { title: string; desc: string; stack: string[] }[] = [
  { title: 'AI · Vibe Coding', desc: 'AI 보조 개발 워크플로', stack: ['Claude', 'Claude Code', 'Codex', 'Gemini', 'Stitch'] },
  { title: 'Backend · Fullstack', desc: '서버 · API · DB 설계', stack: ['PHP', 'NestJS', 'MySQL'] },
  { title: 'Web · App', desc: '프론트 · 크로스플랫폼', stack: ['React', 'React Native', 'Flutter'] },
  { title: '기타 / 추후', desc: '추가 영역', stack: ['추후 채움'] },
]

// 점 p 에서 선분 ab 까지의 최단거리(커서 근접 판정용).
function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  let t = ((px - ax) * dx + (py - ay) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

// 안드로이드 감지 — backdrop-filter 가 canvas 위에서 미작동해 글라스가 너무 비치므로 더 불투명한 패널로 보강(.is-android).
//   iOS·PC 는 블러가 정상이라 제외(얇은 유리 유지).
const IS_ANDROID = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent)

export default function Main1() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const laserRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null) // 스크롤 컨테이너(.main1) — 스크롤 진행도 추적
  const gateRef = useRef(false) // true = 2페이지 2/5 통과 → 새 클릭 버스트 정지
  const animatingRef = useRef(false) // 프로그램 스크롤(클릭 전환·스냅) 진행 중 → 스냅 재진입 방지
  const wheelStopRef = useRef<(() => void) | null>(null) // 휠 lerp 중단(버튼 클릭이 이어받을 때 충돌 방지)
  const [titleIdx, setTitleIdx] = useState(0) // 다국어 타이틀 순환
  const [titleIn, setTitleIn] = useState(false) // 단어별 rise 트리거(언어 전환 시 false→true)
  const [subIdx, setSubIdx] = useState(0) // 메인페이지 서브타이틀 순환

  // 언어 전환 직후 다음 프레임에 단어별 rise 재생(transition 기반 — 키프레임-on-remount 불안정 회피)
  useEffect(() => {
    let r1 = 0
    let r2 = 0
    r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => setTitleIn(true))
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
    }
  }, [titleIdx])

  // 다국어 타이틀 순환(약 3.4s 간격). 전환 시 즉시 숨김(titleIn=false) → 새 문구가 숨은 채 렌더 → rise.
  // reduced-motion 이면 첫 언어 고정.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => {
      setTitleIn(false)
      setTitleIdx((i) => (i + 1) % TITLES.length)
    }, 3400)
    return () => window.clearInterval(id)
  }, [])

  // 서브타이틀 한 줄씩 순환(약 2.8s). reduced-motion 이면 첫 줄 고정.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(() => setSubIdx((i) => (i + 1) % SUBTITLES.length), 2800)
    return () => window.clearInterval(id)
  }, [])

  // 히어로 텍스트 마우스 패럴럭스(인터랙션) — 커서 위치를 CSS 변수로 전달
  useEffect(() => {
    const el = heroRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    // 터치 환경(태블릿·모바일)에선 패럴럭스 비활성(터치 후 텍스트가 어긋나 보이는 문제 방지)
    if (window.matchMedia('(pointer: coarse)').matches) return
    let raf = 0
    function onMove(e: PointerEvent) {
      const nx = e.clientX / window.innerWidth - 0.5
      const ny = e.clientY / window.innerHeight - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el!.style.setProperty('--px', nx.toFixed(3))
        el!.style.setProperty('--py', ny.toFixed(3))
      })
    }
    window.addEventListener('pointermove', onMove)
    return () => {
      window.removeEventListener('pointermove', onMove)
      cancelAnimationFrame(raf)
    }
  }, [])

  // ── 스크롤 → 다크↔라이트 색상반전 전환(--inv) + 클릭 게이트 + 임계 스냅 ──
  // 배경(backdrop)이 filter:invert(--inv)로 다크↔라이트 색반전. cur→target 매 프레임 lerp.
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const clamp = (v: number) => Math.max(0, Math.min(1, v))
    // 색상 전환 옵션: 1→2 전환에만 국한. 1→2 이동 거리(0~이력top)의 3/5 지점을
    // 통과하는 순간 다크→라이트로 '한 번에' 플립(target 0→1), lerp 가 부드러운 애니메이션으로 처리.
    const INV = {
      TRIGGER_FRAC: 0.6, // 1→2 이동의 3/5 지점에서 다크↔라이트 플립
      LERP: 0.16, // 플립 애니메이션 속도(클수록 빠르게 전환)
    }
    // 페이지 정렬은 CSS scroll-snap(proximity)이 담당 → JS 스냅 제거(모든 화면 자연 스크롤).
    let cur = 0
    let target = 0
    let raf = 0

    function geo() {
      const vh = el!.clientHeight || 1
      const resume = el!.querySelector('.seg--resume') as HTMLElement | null
      const rTop = resume ? resume.offsetTop : vh
      const work = el!.querySelector('.seg--work') as HTMLElement | null
      const wTop = work ? work.offsetTop : rTop * 2
      return { vh, rTop, wTop }
    }

    function computeTarget() {
      const { vh, rTop, wTop } = geo()
      // 3/5 지점 통과 = 라이트(1), 미만 = 다크(0). 스텝 + lerp = 애니메이션 플립.
      const trig = rTop * INV.TRIGGER_FRAC
      target = el!.scrollTop >= trig ? 1 : 0
      // 클릭 게이트: 색 전환(3/5)을 지나면 새 클릭 버스트 정지(복귀 시 자동 해제)
      gateRef.current = el!.scrollTop >= trig
      // is-page-2: 이력(2P)이 '현재 페이지'인지. 1P/3P 로 떠나면 false → 다시 2P 도착 시 이력 재구성(리빌 재생).
      //  (is-settled[색상]은 2P·3P 모두 true 라 3→2 재구성을 못 잡음 → 별도 페이지 상태 필요)
      //  떠날 때(3P) 리셋은 이력이 거의 화면 밖일 때(wTop-0.15vh) → 깜빡임 최소화. 콘텐츠 reveal 은 is-settled 와 AND.
      el!.classList.toggle(
        'is-page-2',
        el!.scrollTop >= rTop * 0.5 && el!.scrollTop < wTop - vh * 0.15,
      )
      // 명칭(자기소개) 표시: 1~2페이지에선 보이고, 3페이지(포트폴리오)로 가면서 사라짐
      el!.style.setProperty(
        '--name-vis',
        clamp(1 - (el!.scrollTop - rTop) / Math.max(1, (wTop - rTop) * 0.55)).toFixed(3),
      )
      // 3D 구체: 히어로를 벗어나며 옅게 사라짐
      el!.style.setProperty('--canvas-op', clamp(1 - (el!.scrollTop / vh - 0.35) / 0.5).toFixed(3))
      // 스크롤 안내: 0.2vh 까지 fix → 그 이하로 내려가면 fix 해제되며 사라짐
      const hint = clamp(1 - (el!.scrollTop / vh - 0.2) / 0.3)
      el!.style.setProperty('--hint', hint.toFixed(3))
      el!.classList.toggle('hint-off', hint < 0.05)
    }
    function apply(v: number) {
      el!.style.setProperty('--inv', v.toFixed(4)) // invert()·hue-rotate() 용 숫자
      el!.style.setProperty('--p', (v * 100).toFixed(2) + '%') // color-mix 보간 비율(깨끗한 %)
      el!.classList.toggle('is-light', v > 0.5) // 라이트 모드 → 섹션 프로스트 패널 on
      el!.classList.toggle('is-settled', v > 0.88) // 명칭이 좌상단에 안착 → profile 섹션 구성
    }
    function tick() {
      cur += (target - cur) * INV.LERP // 3/5 통과 시 다크↔라이트로 부드럽게 플립
      if (Math.abs(target - cur) < 0.0008) cur = target
      apply(cur)
      raf = cur === target ? 0 : requestAnimationFrame(tick)
    }

    function onScroll() {
      computeTarget()
      if (!raf) raf = requestAnimationFrame(tick)
    }
    computeTarget()
    cur = target
    apply(cur)
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
  }, [])

  // ── 콘텐츠 리빌 — .reveal 요소가 뷰포트에 들어오면 천천히 떠오르며 등장(.is-inview). 스크롤 인터랙션. ──
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    const els = Array.from(root.querySelectorAll<HTMLElement>('.reveal'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      els.forEach((e) => e.classList.add('is-inview'))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add('is-inview')
            io.unobserve(en.target) // 한 번만 등장
          }
        }
      },
      { root, rootMargin: '0px 0px -12% 0px', threshold: 0.12 },
    )
    els.forEach((e) => io.observe(e))
    return () => io.disconnect()
  }, [])

  // ── 섹션 캡 네비게이션 — 데스크탑(wheel) + 모바일(touch/drag) 동일 경험.
  //    한 번의 제스처로 '한 섹션'만 이동(1P→2P 가 최대). 섹션이 뷰포트보다 크면(긴 이력) 내부는 자유 스크롤,
  //    경계에서 더 가면 다음/이전 섹션으로 전환. 터치는 경계에서 드래그한 만큼 페이지가 따라오다
  //    임계 이상이면 전환·미만이면 복귀(휠과 동일 느낌). reduced-motion 이면 비활성. ──
  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    let animating = false
    let raf = 0
    const tops = () =>
      ['.seg--hero', '.seg--resume', '.seg--work']
        .map((s) => el.querySelector<HTMLElement>(s))
        .filter((s): s is HTMLElement => !!s)
        .map((s) => ({ top: s.offsetTop, bottom: s.offsetTop + s.offsetHeight }))
    function animateTo(to: number) {
      cancelAnimationFrame(raf)
      const from = el!.scrollTop
      const dist = to - from
      if (Math.abs(dist) < 2) return
      animating = true
      animatingRef.current = true
      let t0 = 0
      const dur = Math.min(720, 360 + Math.abs(dist) * 0.34)
      const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
      const step = (now: number) => {
        if (!t0) t0 = now
        const p = Math.min(1, (now - t0) / dur)
        el!.scrollTop = Math.round(from + dist * ease(p))
        if (p < 1) raf = requestAnimationFrame(step)
        else {
          el!.scrollTop = to
          animating = false
          animatingRef.current = false
        }
      }
      raf = requestAnimationFrame(step)
    }
    // ── 데스크탑 휠: '한 제스처 = 최대 1섹션' 락 모델(부드러운 animateTo). ⭐
    //    ❌ 과거: 섹션 내부 네이티브 스크롤의 관성이 경계 animateTo 와 충돌(2→3 튕김 / 3→2 미완료) +
    //       빠른 스크롤 한 번에 여러 섹션(1→3) 을 건너뜀.
    //    → 항상 preventDefault(네이티브 0). '한 제스처(휠 버스트)당 1회'만 이동하고, 휠이 멎을 때까지 '락'.
    //       1→2, 2→3, 3→2, 2→1 처럼 한 번에 한 페이지만. 섹션이 '내용상' 뷰포트보다 충분히 크면(>1.2vh)
    //       그 안에서 한 스텝(0.9vh) 스크롤하고, 다음 제스처에 다음 섹션으로. ──
    let locked = false
    let idleTimer = 0
    function tryUnlock() {
      clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => {
        if (animating) tryUnlock() // 전환 애니메이션 중이면 더 기다림
        else locked = false // 휠이 멎고(150ms) 전환도 끝남 → 다음 이동 허용
      }, 150)
    }
    function stopWheel() {
      cancelAnimationFrame(raf)
      animating = false
      locked = false
      clearTimeout(idleTimer)
    }
    wheelStopRef.current = stopWheel // 버튼(맨위로·안내)이 이어받을 때 휠 애니/락 해제
    function onWheel(e: WheelEvent) {
      if (Math.abs(e.deltaY) < 1) return
      e.preventDefault() // 항상 네이티브 스크롤 차단(관성 충돌·오버슈트 방지)
      tryUnlock() // 휠이 멎으면(150ms) 락 해제 → '한 제스처 = 1회 이동'
      if (locked || animating || animatingRef.current) return
      const vh = el!.clientHeight
      const y = el!.scrollTop
      const secs = tops()
      const cur = secs.find((s) => y >= s.top - 4 && y < s.bottom - 4) || secs[0]
      const tall = cur.bottom - cur.top > vh * 1.2 // 빈 패딩(미세 초과)이 아니라 '내용상' 큰 섹션만 내부 스크롤
      if (e.deltaY > 0) {
        if (tall && cur.bottom - vh > y + 8) {
          locked = true
          animateTo(Math.min(cur.bottom - vh, y + vh * 0.9)) // 큰 섹션 내부 한 스텝
        } else {
          const next = secs.find((s) => s.top > cur.top + 4)
          if (next) {
            locked = true
            animateTo(next.top) // 다음 섹션 한 페이지
          }
        }
      } else {
        if (tall && y > cur.top + 8) {
          locked = true
          animateTo(Math.max(cur.top, y - vh * 0.9))
        } else {
          const prev = [...secs].reverse().find((s) => s.top < cur.top - 4)
          if (prev) {
            locked = true
            animateTo(prev.top) // 이전 섹션 한 페이지
          }
        }
      }
    }
    // ── 모바일 터치/드래그: '완전 제어'(CSS touch-action:none). 손가락을 1:1 로 따라오고, 놓을 때 판단.
    //    네이티브 스크롤/관성을 아예 안 써서 ① 안드로이드 preventDefault 레이스 없음 ② 상단 오버스크롤 갭 없음.
    //    · 드래그 중: scrollTop = 시작 + 드래그(문서 [0,max] 클램프 → 갭 없음, 다음 페이지가 손가락 따라 슬라이드 인).
    //    · 놓을 때: '시작이 섹션 경계'였고 그 방향으로 임계(16%)·플릭이면 → 다음/이전 섹션 한 페이지 전환, 아니면 복귀.
    //               섹션 내부에서 시작했으면 → 그 섹션 범위 안에서 관성(긴 이력 읽기). 한 제스처 = 최대 1페이지. ──
    let tStartY = 0
    let tStartScroll = 0
    let tSecTop = 0
    let tSecBot = 0
    let tReadBot = 0 // 이 섹션 내 스크롤 가능한 최하단(= bottom-vh)
    let tLastY = 0
    let tLastT = 0
    let tVel = 0 // px/ms, + = 아래로 스크롤
    let tDragging = false
    let tMomRaf = 0
    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return // 핀치 등은 무시
      cancelAnimationFrame(raf)
      cancelAnimationFrame(tMomRaf)
      stopWheel()
      animating = false
      animatingRef.current = false
      const vh = el!.clientHeight
      tStartY = e.touches[0].clientY
      tStartScroll = el!.scrollTop
      tLastY = tStartY
      tLastT = e.timeStamp
      tVel = 0
      tDragging = true
      const secs = tops()
      const mid = tStartScroll + vh * 0.5
      const cur = secs.find((s) => mid >= s.top && mid < s.bottom) || secs[secs.length - 1]
      tSecTop = cur.top
      tSecBot = cur.bottom
      tReadBot = Math.max(cur.top, cur.bottom - vh)
    }
    function onTouchMove(e: TouchEvent) {
      if (!tDragging || e.touches.length !== 1) return
      e.preventDefault()
      const y = e.touches[0].clientY
      const t = e.timeStamp
      const dt = t - tLastT
      if (dt > 0) tVel = (tLastY - y) / dt
      tLastY = y
      tLastT = t
      const maxS = el!.scrollHeight - el!.clientHeight
      el!.scrollTop = Math.max(0, Math.min(maxS, tStartScroll + (tStartY - y))) // 1:1 추종·문서 클램프(갭 없음)
    }
    function momentum() {
      let v = tVel * 16 // px/frame
      const stepM = () => {
        v *= 0.92
        let ns = el!.scrollTop + v
        if (ns <= tSecTop) {
          ns = tSecTop
          v = 0
        }
        if (ns >= tReadBot) {
          ns = tReadBot
          v = 0
        }
        el!.scrollTop = ns
        if (Math.abs(v) > 0.4) tMomRaf = requestAnimationFrame(stepM)
      }
      if (Math.abs(v) > 0.4) tMomRaf = requestAnimationFrame(stepM)
    }
    function onTouchEnd() {
      if (!tDragging) return
      tDragging = false
      const vh = el!.clientHeight
      const secs = tops()
      const rawDy = tStartY - tLastY // 총 드래그(위로 +)
      const TH = vh * 0.16 // 전환 임계(16%)
      const FLICK = 0.45 // 플릭 속도(px/ms)
      if (rawDy > 0) {
        // 아래로(다음 섹션): 시작이 섹션 하단이면 전환 판단, 아니면 내부 관성(읽기)
        if (tStartScroll >= tReadBot - 4) {
          const next = secs.find((s) => s.top > tSecBot - 4)
          if (next && (rawDy > TH || tVel > FLICK)) animateTo(next.top)
          else animateTo(tReadBot) // 복귀
        } else momentum()
      } else if (rawDy < 0) {
        // 위로(이전 섹션)
        if (tStartScroll <= tSecTop + 4) {
          const prev = [...secs].reverse().find((s) => s.top < tSecTop - 4)
          if (prev && (-rawDy > TH || tVel < -FLICK)) animateTo(prev.top)
          else animateTo(tSecTop) // 복귀
        } else momentum()
      }
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd, { passive: true })
    el.addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove', onTouchMove)
      el.removeEventListener('touchend', onTouchEnd)
      el.removeEventListener('touchcancel', onTouchEnd)
      clearTimeout(idleTimer)
      cancelAnimationFrame(raf)
      cancelAnimationFrame(tMomRaf)
      wheelStopRef.current = null
    }
  }, [])

  // ── 배경 레이저 캔버스(2D) — 3D 구체 캔버스 뒤에 깔린다 ──
  useEffect(() => {
    const cnv = laserRef.current
    if (!cnv) return
    const ctx = cnv.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let W = 0
    let H = 0
    // 레이저 방향: 고정 63.1° 우상→좌하(아래로 갈수록 x 감소)
    const dirAng = (LASER_DEG * Math.PI) / 180
    const ddx = -Math.cos(dirAng)
    const ddy = Math.sin(dirAng)
    let wrapLeft = 0
    let driftRange = 0

    type Laser = { topX: number; len: number; color: string; bright: number }
    let lasers: Laser[] = []

    function build() {
      W = window.innerWidth
      H = window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      cnv!.width = Math.round(W * dpr)
      cnv!.height = Math.round(H * dpr)
      cnv!.style.width = W + 'px'
      cnv!.style.height = H + 'px'
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0)

      // 개수: min(width*0.07, 150) — 원본과 동일
      const N = Math.max(40, Math.min(Math.round(W * 0.07), 150))
      // 상단 시작 x 는 우측으로 치우침(우상단이 가장 빽뺵).
      // topX∈[~0,W] → 위쪽 가장자리에서 시작 / topX>W → 우측 가장자리로 진입.
      // 우측 한계는 화면 높이(H)도 반영: 레이저는 좌하향이라 길이(∝H)만큼 좌로 쓸리므로,
      // 세로로 긴 모바일에서도 우측 하단까지 닿으려면 topX_max ≳ W + cos(63.1°)/sin(63.1°)·H.
      wrapLeft = -W * 0.08
      driftRange = W * 1.08 + H * 0.55
      lasers = []
      for (let i = 0; i < N; i++) {
        lasers.push({
          topX: wrapLeft + Math.pow(Math.random(), 0.6) * driftRange,
          len: (0.55 + Math.random() * 1.05) * H, // 길이 제각각
          color: LASER_DOTS[i % 3],
          bright: 0.1,
        })
      }
    }
    build()

    const mouse = { x: -9999, y: -9999 }
    function onMove(e: PointerEvent) {
      mouse.x = e.clientX
      mouse.y = e.clientY
    }
    function onLeave() {
      mouse.x = -9999
      mouse.y = -9999
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerleave', onLeave)

    let resizeTimer = 0
    function onResize() {
      clearTimeout(resizeTimer)
      resizeTimer = window.setTimeout(build, 150)
    }
    window.addEventListener('resize', onResize)

    const driftSpeed = reduce ? 0 : 13 // px/s, 좌측으로 아주 느린 드리프트
    let raf = 0
    let prev = performance.now()

    function frame(now: number) {
      raf = requestAnimationFrame(frame)
      // 오프-히어로(2P/3P)에서는 레이저 드리프트 렌더 스킵 → 마지막 프레임 고정(전환 중 메인스레드 부하 ↓, 버벅임 완화).
      //   레이저는 라이트 글라스 뒤에 흐릿하게만 비쳐 고정돼도 티 안 남. 히어로로 돌아오면 자동 재개.
      const sc = scrollRef.current
      if (sc && sc.scrollTop > window.innerHeight * 0.92) {
        prev = now
        return
      }
      let dt = (now - prev) / 1000
      prev = now
      if (dt > 0.05) dt = 0.05
      ctx!.clearRect(0, 0, W, H)
      ctx!.lineWidth = 1
      for (const L of lasers) {
        // 좌측으로 드리프트 → 좌측 끝 넘으면 우측 너머로 wrap(새 길이로 재진입)
        L.topX -= driftSpeed * dt
        if (L.topX < wrapLeft) {
          L.topX += driftRange
          L.len = (0.55 + Math.random() * 1.05) * H
        }
        const x1 = L.topX
        const y1 = 0 // 상단 끝은 항상 위쪽 가장자리(우상단)에서 시작
        const x2 = L.topX + ddx * L.len
        const y2 = ddy * L.len
        // 커서 근접 시 밝아짐: 거리<40px → 0.1→0.25
        const d = distToSeg(mouse.x, mouse.y, x1, y1, x2, y2)
        L.bright = d < 40 ? Math.min(0.25, L.bright + 0.015) : Math.max(0.1, L.bright - 0.01)
        ctx!.strokeStyle = `rgba(255,255,255,${L.bright})`
        ctx!.beginPath()
        ctx!.moveTo(x1, y1)
        ctx!.lineTo(x2, y2)
        ctx!.stroke()
        // 헤드 점(하단 끝)
        if (x2 > 0 && x2 < W && y2 > 0 && y2 < H) {
          ctx!.fillStyle = L.color
          ctx!.beginPath()
          ctx!.arc(x2, y2, 1.2, 0, Math.PI * 2)
          ctx!.fill()
        }
      }
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(resizeTimer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── 렌더러 / 씬 / 카메라 ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    renderer.toneMapping = THREE.ACESFilmicToneMapping // 하이라이트를 부드럽게 롤오프 → 백화 방지
    renderer.toneMappingExposure = 0.86

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
    camera.position.set(0, 0, 18)

    // 부드러운 스튜디오 환경광(GI) — 매끈한 음영. 너무 밝지 않게 세기를 낮춘다.
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = envTex
    scene.environmentIntensity = 0.45 // 기본 1 → 라벤더 톤 유지 + 형태감 확보

    // ── 조명: 헤미스피어 위주의 평탄·말랑한 라벤더. 방향광은 약하게(백화 방지) ──
    const hemi = new THREE.HemisphereLight(0xeaecf6, 0xa294bb, 0.85)
    scene.add(hemi)
    const key = new THREE.DirectionalLight(0xffffff, 0.48)
    key.position.set(-5, 8, 7)
    scene.add(key)
    const fill = new THREE.DirectionalLight(0xc9bdd2, 0.22)
    fill.position.set(6, -4, 4)
    scene.add(fill)

    // ── 구체들 ──
    const COUNT = window.innerWidth < 640 ? 22 : 32
    const geo = new THREE.SphereGeometry(1, 48, 32)
    const SPHERE_TINTS = [0xd4d0e4, 0xccc8de, 0xdad6e9, 0xc7c3da, 0xd2cce4]

    type Body = {
      mesh: THREE.Mesh
      mat: THREE.MeshStandardMaterial
      pos: THREE.Vector3
      vel: THREE.Vector3
      r: number
      er: number // 현재 유효 반지름(인트로 중 스케일 반영) — 충돌 판정에 사용
      ph: THREE.Vector3
      born: number // 인트로 등장 시각(가운데→바깥 리플)
      shown: boolean // 인트로(스케일) 완료
    }
    const bodies: Body[] = []
    for (let i = 0; i < COUNT; i++) {
      const r = 0.55 + Math.random() * 1.05
      const mat = new THREE.MeshStandardMaterial({
        color: SPHERE_TINTS[i % SPHERE_TINTS.length],
        roughness: 0.5,
        metalness: 0.0,
      })
      const mesh = new THREE.Mesh(geo, mat)
      mesh.scale.setScalar(reduce ? r : 0.0001)
      // 제자리(클러스터 내 위치)에서 생성
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3.5,
      )
      // 인트로 시작은 중앙으로 ~10% 수축 → 자라며 약하게 바깥으로 펼쳐짐
      if (!reduce) pos.multiplyScalar(0.9)
      mesh.position.copy(pos)
      scene.add(mesh)
      bodies.push({
        mesh,
        mat,
        pos,
        // 등장 시 약한 바깥 방향 속도(거리에 비례) → 살짝 펼쳐지며 안착
        vel: reduce ? new THREE.Vector3() : pos.clone().multiplyScalar(0.8),
        r,
        er: reduce ? r : 0,
        ph: new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
        // 가운데→바깥 리플(중심에 가까운 구체부터 피어남)
        born: reduce ? 0 : Math.min(pos.length() / 5, 1) * 0.5,
        shown: reduce,
      })
    }

    // ── 포인터 → z=0 평면의 월드 좌표 ──
    const raycaster = new THREE.Raycaster()
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
    const ndc = new THREE.Vector2()
    const mouseWorld = new THREE.Vector3()
    const pointer = { x: 0, y: 0, vx: 0, vy: 0, active: false, down: false }
    let lastMoveT = performance.now()
    let lastInteract = performance.now() // 마지막 포인터 상호작용 시각(유휴 순환 판정용)

    // 화면 좌표 → z=0 평면 월드 좌표. 캔버스가 뷰포트보다 크고 오프셋(top:-20svh)이라
    // getBoundingClientRect 로 실제 캔버스 위치/크기를 반영해야 커서와 정확히 일치(유령 마우스 방지).
    function toWorld(px: number, py: number, out: THREE.Vector3) {
      const r = canvas!.getBoundingClientRect()
      ndc.set(((px - r.left) / r.width) * 2 - 1, -((py - r.top) / r.height) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      raycaster.ray.intersectPlane(plane, out)
    }

    // 캔버스를 뷰포트보다 크게(상하 여백) 렌더 → 스크롤 이동 중에도 구체가 가장자리에 잘리지 않음.
    // (이동 가능한 클러스터 범위보다 '보여지는 캔버스'를 더 크게 = 아래 공간 여유)
    const CANVAS_SCALE = 1.4
    function resize() {
      const w = window.innerWidth
      const vh = window.innerHeight
      const ch = vh * CANVAS_SCALE
      renderer.setSize(w, ch, false)
      camera.aspect = w / ch
      // 가로폭 반응형: 좁아질수록 카메라를 뒤로 빼 구체 클러스터를 유동적으로 축소(양옆 여백 확보).
      // 1600px↑ 기준(1) → 좁아질수록 0.72 까지 → z 가 커져 클러스터가 작아짐.
      const widthShrink = Math.min(1, Math.max(0.72, w / 1600))
      // 줌은 뷰포트 기준 유지 + 큰 캔버스(CANVAS_SCALE)만큼 뒤로 + 가로폭 축소
      camera.position.z =
        (18 * CANVAS_SCALE * Math.max(1, 0.95 / Math.min(1.6, w / vh))) / widthShrink
      camera.updateProjectionMatrix()
    }
    resize()

    // ── 상호작용 핸들러 ──
    function onMove(e: PointerEvent) {
      const now = performance.now()
      const mdt = Math.min(0.05, Math.max(0.001, (now - lastMoveT) / 1000))
      lastMoveT = now
      // 커서 화면 속도(px/s)를 평활화 → 빠르게 끌수록 구체를 더 세게 휩쓴다
      const nvx = (e.clientX - pointer.x) / mdt
      const nvy = (e.clientY - pointer.y) / mdt
      pointer.vx = pointer.vx * 0.55 + nvx * 0.45
      pointer.vy = pointer.vy * 0.55 + nvy * 0.45
      pointer.x = e.clientX
      pointer.y = e.clientY
      pointer.active = true
      pointer.down = (e.buttons & 1) === 1 // 드래그(버튼 누른 채 이동) 여부
      lastInteract = now
    }
    function onUp() {
      pointer.down = false
    }
    function onLeave() {
      pointer.active = false
      pointer.down = false
    }
    const burst = new THREE.Vector3()
    const dirTmp = new THREE.Vector3()
    function onDown(e: PointerEvent) {
      pointer.down = true
      pointer.x = e.clientX
      pointer.y = e.clientY
      lastInteract = performance.now()
      // 2페이지 2/5 통과 후엔 새 클릭 버스트를 만들지 않는다(기존 관성은 그대로 이어짐).
      if (gateRef.current) return
      toWorld(e.clientX, e.clientY, burst)
      for (const b of bodies) {
        dirTmp.subVectors(b.pos, burst)
        dirTmp.z *= 0.4
        const dist = dirTmp.length() || 0.001
        const R = b.r + 6
        if (dist < R) {
          dirTmp.divideScalar(dist)
          b.vel.addScaledVector(dirTmp, (1 - dist / R) * 23)
        }
      }
    }

    window.addEventListener('resize', resize)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointerleave', onLeave)

    // ── 물리 루프 ──
    const clock = new THREE.Clock()
    const acc = new THREE.Vector3()
    const delta = new THREE.Vector3()
    const flowAxis = new THREE.Vector3()
    const swirl = new THREE.Vector3()
    const sweepDir = new THREE.Vector3()
    const cohesion = new THREE.Vector3()
    const fScale = reduce ? 0.4 : 1
    let raf = 0

    function frame() {
      let dt = clock.getDelta()
      if (dt > 0.05) dt = 0.05
      const t = clock.elapsedTime

      // 세 힘의 교차(crossfade) 가중치 — 항상 켜져 있되 서서히 강약이 바뀜
      const wMagnet = 0.7 + 0.3 * Math.sin(t * 0.12)
      const wFloat = 0.7 + 0.3 * Math.sin(t * 0.1 + 2.1)
      const wFlow = 0.7 + 0.3 * Math.sin(t * 0.08 + 4.2)

      // 커서를 멈추면 휩쓸기 속도는 빠르게 잦아든다
      const vDecay = Math.pow(0.0015, dt)
      pointer.vx *= vDecay
      pointer.vy *= vDecay

      // 흐름 축: Y 중심으로 천천히 기울며 회전 → 클러스터가 입체적으로 굴러감
      flowAxis.set(Math.sin(t * 0.05) * 0.4, 1, Math.cos(t * 0.07) * 0.4).normalize()

      if (pointer.active) toWorld(pointer.x, pointer.y, mouseWorld)

      // 커서 화면속도 → 월드 방향(화면 y는 뒤집힘). 빠르게 끌수록 강하게 휩쓴다.
      const pSpeed = Math.hypot(pointer.vx, pointer.vy) // px/s
      sweepDir.set(pointer.vx, -pointer.vy, 0)
      if (pSpeed > 1) sweepDir.divideScalar(pSpeed)
      // 드래그(버튼 누름)면 더 활동적으로, 단순 호버면 절반 정도
      const sweepMag =
        Math.min(pSpeed, 2600) * 0.011 * (pointer.down ? 1 : 0.45)

      // 유휴 순환: 메인 화면을 보는 중 + 3초+ 무입력이면, 좌→우로 아주 짧게 순환(주기 펄스).
      // 과밀(중앙 응집)을 풀어주는 부드러운 쓸기. 메인페이지를 벗어나면 작동 안 함.
      const heroVisible = !scrollRef.current || scrollRef.current.scrollTop < window.innerHeight * 0.6
      let idleSweep = 0
      if (!reduce && heroVisible && performance.now() - lastInteract > 3000) {
        const phase = (performance.now() - lastInteract - 3000) % 4500 // 4.5s 주기
        if (phase < 1200) idleSweep = Math.sin((phase / 1200) * Math.PI) // 0→1→0 펄스
      }

      // 인트로: 제자리에서 우아하게 생성(0→full, 가운데→바깥 리플).
      // 충돌은 '현재 스케일 반지름(er)'으로 판정 → 작을 땐 안 부딪혀 버벅임/튐 없음.
      const introDur = 0.7
      for (const b of bodies) {
        if (b.shown) continue
        const age = t - b.born
        const p = Math.max(0, Math.min(1, age / introDur))
        const s = 1 - (1 - p) ** 3 // easeOutCubic
        b.er = b.r * s
        b.mesh.scale.setScalar(Math.max(0.0001, b.er))
        if (p >= 1) {
          b.er = b.r
          b.mesh.scale.setScalar(b.r)
          b.shown = true
        }
      }

      for (const b of bodies) {
        if (t < b.born) continue // 아직 등장 전엔 물리 정지(제자리 대기)
        acc.set(0, 0, 0)
        // 자석: 중심 스프링(응집)
        acc.addScaledVector(b.pos, -2.85 * wMagnet)
        // 부유: 위상이 다른 잔잔한 떨림
        acc.x += Math.sin(t * 1.15 + b.ph.x) * 4.4 * wFloat
        acc.y += Math.cos(t * 1.35 + b.ph.y) * 4.4 * wFloat
        acc.z += Math.sin(t * 0.95 + b.ph.z) * 2.6 * wFloat
        // 흐름: 축 둘레로 도는 소용돌이(advection). 반지름 비례라 과하면 발산 → 약하게
        swirl.crossVectors(flowAxis, b.pos).multiplyScalar(0.55 * wFlow)
        b.vel.addScaledVector(swirl, dt)
        // 유휴 순환 쓸기: 좌→우(+x)로 부드럽게 밀고, 살짝의 깊이 변주로 순환감
        if (idleSweep > 0) {
          acc.x += idleSweep * 4.6
          acc.z += Math.sin(t * 0.6 + b.ph.z) * idleSweep * 1.4
        }
        // 커서 반발(항상) — 가까울수록 급격히 세지는 탄력 반발(통통)
        if (pointer.active) {
          delta.subVectors(b.pos, mouseWorld)
          delta.z *= 0.4
          const dist = delta.length() || 0.001
          const R = b.r + 4.2 + (pointer.down ? 1.6 : 0) // 드래그면 영향권 확대
          if (dist < R) {
            const f = 1 - dist / R
            delta.divideScalar(dist)
            b.vel.addScaledVector(delta, f * f * 120 * dt)
            // 드래그 휩쓸기: 커서 진행 방향으로 구체를 끌고 간다(활동성↑)
            b.vel.addScaledVector(sweepDir, f * sweepMag * dt)
          }
        }
        b.vel.addScaledVector(acc, dt * fScale)
        b.vel.multiplyScalar(Math.pow(0.18, dt)) // 감쇠 — 에너지 누적/발산 방지
      }

      // 모임 정도(0=흩어짐 … 1=가운데로 응집). 뭉침 디테일을 이 값에 연동.
      const mNorm = Math.min(1, Math.max(0, (wMagnet - 0.4) / 0.6))
      const gap = 0.46 - 0.27 * mNorm // 모일수록 간격을 좁혀 nestle(과밀은 피함)
      const cohR = 2.4 // 표면장력 사정거리(이웃끼리 끌어당김)
      const cohK = 5.2 * mNorm // 모일 때만 강해지는 이웃 응집(부드럽게)
      // 속도 임계값 기반 반발: 접근속도가 vLow 이하면 e=0(완전 흡수→정지=떨림 없음),
      // vHigh 이상이면 e=eMax(탱탱). 그 사이는 선형 복구. (물리엔진 sleep threshold 방식)
      const vLow = 1.6 // 이 접근속도 이하 접촉은 e=0(완전 흡수→떨림 없음)
      const vHigh = 4.5
      const eMax = 0.9

      // 구체끼리 충돌(분리 + 탄성) + 근접 이웃 표면장력
      for (let i = 0; i < bodies.length; i++) {
        const a = bodies[i]
        if (t < a.born) continue // 아직 등장 전 제외
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j]
          if (t < c.born) continue
          delta.subVectors(c.pos, a.pos)
          const dist = delta.length() || 0.001
          // 현재 스케일 반지름(er)으로 판정 → 작을 때는 안 부딪혀 부드럽게 자라며 자리 잡음
          const min = a.er + c.er + gap
          if (dist < min) {
            delta.divideScalar(dist)
            const overlap = (min - dist) * 0.5
            a.pos.addScaledVector(delta, -overlap)
            c.pos.addScaledVector(delta, overlap)
            // 접근속도(approach>0 = 서로 다가오는 중)
            const approach =
              (a.vel.x - c.vel.x) * delta.x +
              (a.vel.y - c.vel.y) * delta.y +
              (a.vel.z - c.vel.z) * delta.z
            if (approach > 0) {
              // 느리면 e=0(완전 비탄성=흡수→정지), 빠르면 e=eMax(탱탱) 까지 선형 복구
              const e =
                eMax * Math.min(1, Math.max(0, (approach - vLow) / (vHigh - vLow)))
              // 등질량 충돌 임펄스: 상대 정상속도를 -e배로 (e=0이면 0으로 흡수→떨림 없음)
              const jimp = (1 + e) * approach * 0.5
              a.vel.addScaledVector(delta, -jimp)
              c.vel.addScaledVector(delta, jimp)
            }
          } else if (dist < min + cohR && cohK > 0.01) {
            // 표면장력: 살짝 떨어진 이웃을 끌어당겨 디테일하게 뭉친다(모일 때만)
            cohesion.copy(delta).divideScalar(dist)
            const pull = (1 - (dist - min) / cohR) * cohK * dt
            a.vel.addScaledVector(cohesion, pull)
            c.vel.addScaledVector(cohesion, -pull)
          }
        }
      }

      // 적분 + 부드러운 경계
      for (const b of bodies) {
        if (t < b.born) {
          b.mesh.position.copy(b.pos) // 아직 등장 전: 제자리(크기 0)
          continue
        }
        b.pos.addScaledVector(b.vel, dt)
        const maxR = 7.6
        const len = b.pos.length()
        if (len > maxR) {
          b.pos.multiplyScalar(maxR / len)
          b.vel.multiplyScalar(0.82) // 경계에서도 탄력 있게 튕김
        }
        b.mesh.position.copy(b.pos)
      }

      // 히어로를 벗어나면(2~3페이지) GPU 렌더를 건너뛴다 → 자원 절약 + 2페이지 CSS 전환이 매끄러워짐.
      // (물리는 그대로 두어 복귀 시 튀지 않음)
      const sc = scrollRef.current
      if (!sc || sc.scrollTop < window.innerHeight * 0.9) renderer.render(scene, camera)
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)

    // ── 정리 ──
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointerleave', onLeave)
      geo.dispose()
      for (const b of bodies) (b.mesh.material as THREE.Material).dispose()
      envTex.dispose()
      pmrem.dispose()
      renderer.dispose()
    }
  }, [])

  // 마우스 안내 클릭/터치 → 다음(이력) 섹션으로 천천히·고급스럽게 전환(커스텀 이징 스크롤).
  // CSS scroll-behavior 대신 rAF 이징(easeInOutCubic, ~1.2s)으로 속도·감속을 직접 제어.
  function scrollToNext() {
    const el = scrollRef.current
    if (!el) return
    wheelStopRef.current?.() // 휠 lerp 중단(충돌 방지)
    const start = el.scrollTop
    const dist = el.clientHeight - start // 한 화면 아래(=이력 섹션 상단)
    if (dist < 4) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollTop = el.clientHeight
      return
    }
    const dur = 1200
    let t0 = 0
    const ease = (x: number) =>
      x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2 // easeInOutCubic
    animatingRef.current = true // 스냅 컨트롤러가 끼어들지 않도록
    const step = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / dur)
      el.scrollTop = start + dist * ease(p)
      if (p < 1) requestAnimationFrame(step)
      else animatingRef.current = false
    }
    requestAnimationFrame(step)
  }

  // 우측 하단 '맨 위로' 버튼 → 최상단(히어로)로 부드럽게 복귀(easeInOutCubic). 2P 부터 노출.
  function scrollToTop() {
    const el = scrollRef.current
    if (!el) return
    wheelStopRef.current?.() // 휠 lerp 중단(충돌 방지)
    const start = el.scrollTop
    if (start < 4) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollTop = 0
      return
    }
    const dur = 900
    let t0 = 0
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    animatingRef.current = true // 스냅 컨트롤러가 끼어들지 않도록
    const step = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / dur)
      el.scrollTop = Math.round(start * (1 - ease(p)))
      if (p < 1) requestAnimationFrame(step)
      else {
        el.scrollTop = 0
        animatingRef.current = false
      }
    }
    requestAnimationFrame(step)
  }

  // 다국어 명칭 렌더(히어로·이력 섹션 타이틀 공용). 문장=줄, 단어별 스태거(--w), 이름은 크게.
  // firstLineOnly: 섹션 타이틀용 — 첫 문장(이름)만 → 길이가 길어 한 줄에서 넘치지 않게.
  const renderTitle = (idx: number, firstLineOnly = false) => {
    const T = TITLES[idx]
    const lines = firstLineOnly ? T.lines.slice(0, 1) : T.lines
    let w = 0
    return lines.map((line, li) => (
      <span className="main1__title-line" key={li}>
        {li > 0 ? ' ' : null}
        {line.map((word, j) => {
          const wIdx = w++
          return (
            <Fragment key={j}>
              {T.spaced && j > 0 ? ' ' : null}
              <span className="main1__title-word" style={{ ['--w' as string]: wIdx }}>
                {word.map((s, si) => (
                  <span key={si} className={s.name ? 'main1__name' : 'main1__rest'}>
                    {s.t}
                  </span>
                ))}
              </span>
            </Fragment>
          )
        })}
      </span>
    ))
  }

  return (
    // .main1 = 스크롤 컨테이너. 레이저는 뷰포트에 고정(블리드), 3D 구체는 히어로와 함께 위로 스크롤,
    // 그 위로 섹션(히어로 → 이력 → 개발/포트폴리오)이 흐른다.
    <div className={IS_ANDROID ? 'main1 is-android' : 'main1'} ref={scrollRef}>
      {/* ── 뷰포트 고정 배경 레이어(다크 그라데이션 + 레이저) ──
          스크롤이 2페이지 2/5 를 지나면 filter:invert(--inv)로 색반전 → 라이트 전환.
          2페이지 전체에 걸쳐 보이도록 fixed 로 깔고, 본문 섹션은 투명. */}
      <div className="main1__backdrop" aria-hidden="true">
        {/* 다크/라이트 그라데이션 크로스페이드(--inv) → 중간값에서도 회색 없이 색 유지 */}
        <div className="main1__bg main1__bg--dark" />
        <div className="main1__bg main1__bg--light" />
        {/* 레이저는 thin-line 이라 invert(--inv)로 흰선↔검은선 전환(중간 회색 거의 안 보임) */}
        <canvas ref={laserRef} className="main1__lasers" />
      </div>
      <canvas ref={canvasRef} className="main1__canvas" />

      <header className="main1__chrome">
        {/* 로고: 1p 에선 'J·Young'만. 1→2 전환(--inv)에 맞춰 다크로 색 전환 +
            ' portfolio' 가 펼쳐지며 'J·Young portfolio' 로 자연스럽게 완성 */}
        <a className="main1__logo" href="#/" aria-label="J·Young portfolio 홈">
          <span className="main1__logo-word">
            J·Young<span className="main1__logo-word2">&nbsp;portfolio</span>
          </span>
        </a>
        <button className="main1__menu" type="button" aria-label="open menu">
          <span />
          <span />
        </button>
      </header>

      {/* 자기소개 명칭 — .main1 직속(섹션 밖). z-index 6 으로 글라스 패널 '위'에 그려져 블러되지 않음.
          --inv 로 중앙(1p)↔좌상단(2p) 이동·축소·색 전환. 색 전환(3/5) 전엔 중앙 고정(fix). */}
      <div className="main1__hero" ref={heroRef}>
          <div className="main1__heroInner">
            {/* 다국어 타이틀: 문장마다 한 줄. 언어 전환 시 단어별로 아래→위로 떠오름(연속 스태거).
                이름(name) 세그먼트는 현재 크기, 나머지는 2px 작게. */}
            <h1 className={`main1__title ${titleIn ? 'main1__title--in' : 'main1__title--reset'}`}>
              {renderTitle(titleIdx)}
            </h1>
          </div>
          {/* 서브타이틀 — heroInner(모프) 밖. 메인에서만 보이고, 2p 전환 시 명칭을 '따라가지 않고'
              제자리에서 빠르게 페이드아웃(opacity = 1 - inv*2.2 → inv≈0.45 에서 사라짐). */}
          <h2 className="main1__tagline" key={`s${subIdx}`}>
            <span className="main1__sub-label" style={{ animationDelay: '0s' }}>
              {SUBTITLES[subIdx].label}
            </span>
            <span className="main1__sub-items">
              {SUBTITLES[subIdx].items.map((it, i) => (
                <span
                  className="main1__sub-item"
                  key={it}
                  style={{ animationDelay: `${0.07 * (i + 1) + 0.05}s` }}
                >
                  {it}
                </span>
              ))}
            </span>
          </h2>
      </div>

      {/* ───────────────── 1. 히어로(다크) — 스크롤 안내 ───────────────── */}
      <section className="seg seg--hero">
        {/* 하단 가운데 — 드래그 안내: 마우스(흰선·시계방향) → 네온선(위→아래) → 화살표,
            이후 화살표↓ 소멸 → 네온선 위→아래 소멸 → 마우스 시계방향 소멸 (반복) */}
        <button
          type="button"
          className="main1__scroll"
          onClick={scrollToNext}
          aria-label="다음 섹션으로 이동"
        >
          <svg className="main1__scroll-svg" viewBox="0 0 44 66" fill="none" aria-hidden="true">
            {/* 마우스 외곽선 — 흰선, 위 중앙에서 시계방향으로 그려졌다 시계방향으로 지워짐 */}
            <path
              className="main1__m-mouse"
              d="M22 1.5 A20.5 20.5 0 0 1 42.5 22 L42.5 44 A20.5 20.5 0 0 1 1.5 44 L1.5 22 A20.5 20.5 0 0 1 22 1.5 Z"
              pathLength={100}
              stroke="rgba(236,240,248,0.85)"
              strokeWidth="1.5"
            />
            {/* 네온 라인 — 위→아래로 그려졌다 위→아래로 지워짐(끝을 아래로 연장해 상하 여백 대칭) */}
            <path
              className="main1__m-line"
              d="M22 16 L22 44"
              pathLength={100}
              stroke="#00aeff"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* 화살표 머리 — 팁을 y50 까지(상단 여백 14.5 = 하단 여백 14.5) */}
            <path
              className="main1__m-arrow"
              d="M16.5 43 L22 50 L27.5 43"
              stroke="#00aeff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {/* 입력 환경별 안내: PC(마우스)=click·scroll / 태블릿·모바일(터치)=touch & drag */}
          <span className="main1__scroll-label">
            <span className="main1__lbl main1__lbl--pc">click&nbsp;·&nbsp;scroll</span>
            <span className="main1__lbl main1__lbl--touch">touch&nbsp;&amp;&nbsp;drag</span>
          </span>
        </button>
      </section>

      {/* ───────── 2. 이력(다크→라이트 전환) — 상단 2/5 투명으로 레이저 블리드 ───────── */}
      {/* 라이트 '개발자 코드' 톤. 상단 그라데이션이 투명→밝은색이라 뒤의 레이저가 비친다. */}
      <section className="seg seg--resume" id="resume">
        {/* 자기소개 섹션 타이틀 = 명칭(in-flow, 섹션과 함께 스크롤). 히어로의 fixed 명칭이
            좌상단으로 올라오며 여기로 핸드오프(페이드 크로스). // works 처럼 섹션 헤딩 역할. */}
        {/* 제목(// profile 명칭)은 고정 스테이지 타이틀(.main1__stage)로 이동 — 2→3 제자리 모프용. */}
        <div className="seg__inner seg__inner--resume">
          {/* 인플로우 섹션 타이틀(// profile + 명칭) — 섹션과 함께 자연 스크롤. 1→2 전환 시 히어로 명칭이
              여기로 핸드오프(좌상단). 다국어 순환 + 단어별 rise. */}
          <div className="seg__head">
            <p className="seg__eyebrow">// profile</p>
            <h2
              className={`seg__title seg__title--name ${titleIn ? 'main1__title--in' : 'main1__title--reset'}`}
            >
              {renderTitle(titleIdx, true)}
            </h2>
          </div>
          {/* .seg__fade = 콘텐츠 페이드 래퍼(--inv/--work). 글라스(::before)는 seg__inner 에 남겨
              backdrop-filter 가 격리되지 않도록(opacity 를 seg__inner 에 두면 블러가 사라짐). */}
          <div className="seg__fade">
          {/* 디자인 이력서 — 자기소개 한 줄 + 2단(좌 프로필 / 우 경력).
              2P 도착(.is-settled) 시 명칭 직후 이력이 차례로 '적히듯' 스태거 구성(--i). */}
          <div className="resume__intro" style={{ ['--i' as string]: 0 }}>
            <p className="resume__intro-lead">{RESUME_INTRO.lead}</p>
            <p className="resume__intro-body">
              {RESUME_INTRO.body.map((u, i) => (
                <Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <span className="resume__unit">{u}</span>
                </Fragment>
              ))}
            </p>
          </div>
          <div className="resume">
            <div className="resume__col resume__col--left">
              <section className="resume__block" style={{ ['--i' as string]: 1 }}>
                <h3 className="resume__h">연락처</h3>
                <ul className="resume__contact">
                  {RESUME_CONTACT.map((c) => (
                    <li key={c.k}>
                      <span className="resume__k">{c.k}</span>
                      <span className="resume__v">{c.v}</span>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="resume__block" style={{ ['--i' as string]: 2 }}>
                <h3 className="resume__h">스킬</h3>
                <div className="resume__skills">
                  {RESUME_SKILLS.map((s) => (
                    <span className="resume__skill" key={s}>
                      {s}
                    </span>
                  ))}
                </div>
              </section>
            </div>
            <div className="resume__col resume__col--right">
              {RESUME_RIGHT.map((sec, si) => (
                <section className="resume__block" key={sec.h} style={{ ['--i' as string]: 3 + si }}>
                  <h3 className="resume__h">{sec.h}</h3>
                  <ol className="resume__timeline">
                    {sec.entries.map((e, ei) => (
                      <li
                        className={`resume__entry${e.ongoing ? ' resume__entry--ongoing' : ''}`}
                        key={e.org + ei}
                      >
                        <div className="resume__entry-top">
                          <span className="resume__head">
                            <span className="resume__org">{e.org}</span>
                            <span className="resume__role">{e.role}</span>
                            {e.ongoing && <span className="resume__badge">진행 중</span>}
                          </span>
                          <span className="resume__period">{e.period}</span>
                        </div>
                        {e.bullets ? (
                          <ul className="resume__bullets">
                            {e.bullets.map((b, bi) => (
                              <li key={bi}>{b}</li>
                            ))}
                          </ul>
                        ) : e.desc ? (
                          <p className="resume__desc">{e.desc}</p>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ───────────── 3. 개발 · 포트폴리오(라이트) ───────────── */}
      <section className="seg seg--work" id="work">
        {/* 인플로우 섹션 타이틀(// works 개발&포트폴리오) — 섹션과 함께 자연 스크롤. */}
        <div className="seg__inner">
          <div className="seg__head">
            <p className="seg__eyebrow">// works</p>
            <h2 className="seg__title">개발 &amp; 포트폴리오</h2>
          </div>
          <div className="seg__fade">
          <div className="work-grid">
            {SKILL_GROUPS.map((g, gi) => (
              <article
                className="work-card reveal"
                key={g.title}
                tabIndex={0}
                style={{ ['--i' as string]: gi }}
              >
                <span className="work-card__tag">stack</span>
                <h3 className="work-card__h">{g.title}</h3>
                <p className="work-card__desc">{g.desc}</p>
                <div className="work-card__detail">
                  {g.stack.map((s, i) => (
                    <span
                      className="chip"
                      key={s}
                      style={{ ['--i' as string]: i }}
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <span className="work-card__more">자세히&nbsp;→</span>
              </article>
            ))}
          </div>
          </div>
        </div>
      </section>

      {/* 우측 하단 고정 '맨 위로' 버튼 — 1→2 전환(--inv)에 맞춰 자연스럽게 생성/소멸. */}
      <button
        type="button"
        className="main1__top"
        onClick={scrollToTop}
        aria-label="맨 위로"
        title="맨 위로"
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 19 V6 M6 12 L12 6 L18 12"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
