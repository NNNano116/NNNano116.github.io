import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import './Main1.css'

// main-1: 3D 구체 클러스터 물리 히어로 랜딩.
// 효과: 중심 응집(자석) + 구체끼리 충돌 + 커서 반발 + 클릭 버스트 + 부유/흐름(완만한 회전).
// 세 힘(자석·부유·흐름)의 가중치를 느린 사인으로 교차시켜 번갈아 강조한다.

const NAME = 'nano-portfolio' // 가운데 타이틀
const LOGO = 'n' // 좌상단 원형 배지 글자

// 서브타이틀: 한 줄(카테고리 + 기술 아이템)씩 순환 전환
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

// 점 p 에서 선분 ab 까지의 최단거리(커서 근접 판정용).
function distToSeg(px: number, py: number, ax: number, ay: number, bx: number, by: number) {
  const dx = bx - ax
  const dy = by - ay
  const l2 = dx * dx + dy * dy || 1
  let t = ((px - ax) * dx + (py - ay) * dy) / l2
  t = Math.max(0, Math.min(1, t))
  return Math.hypot(px - (ax + t * dx), py - (ay + t * dy))
}

export default function Main1() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const laserRef = useRef<HTMLCanvasElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const [subIdx, setSubIdx] = useState(0)

  // 서브타이틀 한 줄씩 순환(약 2.8s 간격). reduced-motion 이면 첫 줄 고정.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const id = window.setInterval(
      () => setSubIdx((i) => (i + 1) % SUBTITLES.length),
      2800,
    )
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
      raf = requestAnimationFrame(frame)
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

    function toWorld(px: number, py: number, out: THREE.Vector3) {
      ndc.set((px / window.innerWidth) * 2 - 1, -(py / window.innerHeight) * 2 + 1)
      raycaster.setFromCamera(ndc, camera)
      raycaster.ray.intersectPlane(plane, out)
    }

    function resize() {
      const w = window.innerWidth
      const h = window.innerHeight
      renderer.setSize(w, h, false)
      camera.aspect = w / h
      // 세로가 길거나 좁은 화면에서도 클러스터가 화면을 채우도록 카메라 거리 보정
      camera.position.z = 18 * Math.max(1, 0.95 / Math.min(1.6, w / h))
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

      renderer.render(scene, camera)
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

  return (
    <div className="main1">
      {/* 배경 레이저(2D 캔버스) — 3D 구체 캔버스보다 뒤 */}
      <canvas ref={laserRef} className="main1__lasers" aria-hidden="true" />

      <canvas ref={canvasRef} className="main1__canvas" />

      <header className="main1__chrome">
        <a className="main1__logo" href="#/" aria-label="home">
          {LOGO}
        </a>
        <button className="main1__menu" type="button" aria-label="open menu">
          <span />
          <span />
        </button>
      </header>

      <div className="main1__hero" ref={heroRef}>
        <h1 className="main1__title">{NAME}</h1>
        {/* 서브타이틀: key 로 줄 전환마다 토큰별 스태거(블러+상승) 재생 */}
        <h2 className="main1__tagline" key={subIdx}>
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

      {/* 하단 가운데 — 드래그 안내: 마우스(흰선·시계방향) → 네온선(위→아래) → 화살표,
          이후 화살표↓ 소멸 → 네온선 위→아래 소멸 → 마우스 시계방향 소멸 (반복) */}
      <div className="main1__scroll">
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
      </div>
    </div>
  )
}
