import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import './Main1.css'

// main-1: 3D 구체 클러스터 물리 히어로 랜딩.
// 효과: 중심 응집(자석) + 구체끼리 충돌 + 커서 반발 + 클릭 버스트 + 부유/흐름(완만한 회전).
// 세 힘(자석·부유·흐름)의 가중치를 느린 사인으로 교차시켜 번갈아 강조한다.

// 로드 시 무작위로 뽑는 태그라인.
const TAGLINES = [
  'k-pop fan.',
  'boba maniac.',
  'code wizard.',
  'coffee addict.',
  'night owl.',
  'pixel dreamer.',
]

const NAME = 'SHIYUN LU' // 가운데 타이틀 — 추후 교체 가능
const LOGO = 'S' // 좌상단 원형 배지 글자

export default function Main1() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [tagline] = useState(() => TAGLINES[Math.floor(Math.random() * TAGLINES.length)])

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
      pos: THREE.Vector3
      vel: THREE.Vector3
      r: number
      ph: THREE.Vector3
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
      mesh.scale.setScalar(r)
      const pos = new THREE.Vector3(
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 6,
        (Math.random() - 0.5) * 3.5,
      )
      mesh.position.copy(pos)
      scene.add(mesh)
      bodies.push({
        mesh,
        pos,
        vel: new THREE.Vector3(),
        r,
        ph: new THREE.Vector3(
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
          Math.random() * Math.PI * 2,
        ),
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

      for (const b of bodies) {
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
        for (let j = i + 1; j < bodies.length; j++) {
          const c = bodies[j]
          delta.subVectors(c.pos, a.pos)
          const dist = delta.length() || 0.001
          const min = a.r + c.r + gap
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

      <div className="main1__hero">
        <h1 className="main1__title">{NAME}</h1>
        <h2 className="main1__tagline">{tagline}</h2>
      </div>

      <footer className="main1__footer">
        <span className="main1__rule" />
        <span>
          Made with <a href="https://react.dev/" target="_blank" rel="noreferrer">react</a>, <a href="https://vite.dev/" target="_blank" rel="noreferrer">vite</a>, and <a href="https://threejs.org/" target="_blank" rel="noreferrer">three.js</a>.
        </span>
      </footer>
    </div>
  )
}
