import { Fragment, useCallback, useEffect, useRef, useState, type TouchEvent as ReactTouchEvent } from 'react'
import { createPortal } from 'react-dom'
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

// 포트폴리오(3페이지 // works) — 세로 타임라인(선+점). 년도별 그룹 + 점(노드) 선택 시 펼쳐지는 인터랙션.
//   · year : 년도 그룹 키(숫자, 내림차순 정렬) · period : 화면 표기 기간(범위 가능) · role : 담당(모노 대문자)
//   · summary : 펼침 한 줄 소개 · overview : 소개 · features : 주요기능 · team : 개발 인원 · status : 서비스 현황
//   · note : 성과/특이사항 하이라이트(선택) · links : 서비스 URL(선택) · tone : 커버 듀오톤 색조(a~e)
//   · 실제 스크린샷은 .tl-item[data-tone] 의 --cover 를 import 한 url() 로 교체(절대경로 금지).
//   · idx 는 커리어 순번(01=최초 이지몬 … 23=최신 윈오피스). 타임라인은 년도 내림차순이라 상단이 최신.
type ProjectLink = { label: string; url: string }
type Project = {
  idx: string
  name: string
  client: string
  year: number
  period: string
  role: string
  summary: string
  overview: string[]
  features: string[]
  stack: string[]
  team: string
  status: string
  links?: ProjectLink[]
  note?: string
  tone: string
  hasImage: boolean // 펼침 패널에 커버(이미지) 노출 여부. false 면 텍스트 전용 레이아웃.
  slug?: string // 상세 모달 갤러리 이미지 그룹 키(src/assets/works/<slug>/*.webp) — 있으면 슬라이더 노출.
}

// 프로젝트 갤러리 이미지 — 웹용 리사이즈본(webp, ≤1366px)만 사용. 원본(docs/upload)은 리포에 넣지 않고,
// PIL 로 최적화한 src/assets/works/<slug>/NN-*.webp 를 Vite glob 으로 URL 로딩(파일명 NN 접두사로 정렬).
const WORK_IMG = import.meta.glob('../assets/works/**/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>
const IMAGES_BY_SLUG: Record<string, string[]> = {}
Object.keys(WORK_IMG)
  .sort()
  .forEach((p) => {
    const m = p.match(/\/works\/([^/]+)\//)
    if (m) (IMAGES_BY_SLUG[m[1]] ||= []).push(WORK_IMG[p])
  })
const WINCARD_LINKS: ProjectLink[] = [
  { label: 'wincard.kr', url: 'https://www.wincard.kr' },
  { label: 'wincard.co.kr', url: 'https://www.wincard.co.kr' },
]
const VWALLET_LINKS: ProjectLink[] = [{ label: 'vwallet.kr', url: 'https://www.vwallet.kr' }]
const PROJECTS: Project[] = [
  {
    idx: '01', name: '이지몬 — NFT 수익공유 플랫폼', client: '이지몬', year: 2022, period: '2022.01 ~ 2022.04',
    role: 'Backend · App', tone: 'a', hasImage: false, slug: 'ezmon',
    summary: 'NFT 캐릭터 기반 수익공유 플랫폼 리뉴얼 및 신규 기능 개발.',
    overview: [
      '사내 운영 플랫폼 이지몬의 서비스 리뉴얼 및 신규 기능 추가.',
      '당시 유행하던 NFT 기반 캐릭터 생성·부여 방식의 수익공유 프로젝트.',
      '계약 오프라인 상점 소개 페이지 개발·광고 및 보상형 광고 리워드 지급.',
    ],
    features: [
      'PG 빌링 결제 기반 멤버십 기간제 상품 설정 및 정기결제 연계.',
      'PG 카드결제 기반 랜덤박스 뽑기 및 민팅 이벤트 상품 출시.',
      '일/주/월 매출 기준 캐릭터 보유 수량별 전체회원 수익공유 수당 지급.',
      '앱 배너·동영상 리워드 기반 보상형 광고 리워드 지급.',
    ],
    stack: ['PHP', 'jQuery', 'MariaDB', 'HTML'],
    team: '기획 1 · 디자인 2 · 프론트 2 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '02', name: '오디스트 · 예잇 — 웹 에이전시', client: '오디스트 · 예잇', year: 2022, period: '2022.04 ~ 2022.05',
    role: 'Backend', tone: 'b', hasImage: false,
    summary: '아티스트 소개 페이지와 SNS형 쇼핑몰 제작·유지보수.',
    overview: [
      '웹 에이전시 프로젝트 개발 및 서비스 유지보수.',
      '오디스트: 소속 아티스트 소개·음반·굿즈 노출 및 공지·영상 광고 페이지 제작.',
      '예잇: SNS 구성의 쇼핑몰 — 예술인 자체제작 상품 홍보·판매 및 공예품 제작 의뢰.',
    ],
    features: [
      '아티스트 음반·굿즈 상품 노출 및 소속사 안내·공지·영상 광고 페이지.',
      'SNS형 쇼핑몰 구성 및 예술 공예품 판매·제작 의뢰 기능.',
    ],
    stack: ['PHP', 'jQuery', 'MariaDB', 'HTML'],
    team: '디자인 1 · 프론트 1 · 백엔드 1',
    status: '유지보수 종료',
  },
  {
    idx: '03', name: '윈카드 — B2B 복지카드 솔루션 (신규)', client: '윈카드', year: 2022, period: '2022.05 ~ 2022.07',
    role: 'Backend · App', tone: 'c', hasImage: false, slug: 'wincard',
    summary: '신한카드 MOU 기반 B2B 복지카드·수당지급 솔루션 신규 개발.',
    overview: [
      '사내 B2B 복지카드 및 영업 수당지급 솔루션 신규 개발.',
      '신한카드사 MOU 기반 법인카드 수당 지급 솔루션.',
      '관리자 충전 요청으로 회원카드에 실재화 충전 → 온/오프라인 카드결제 지원.',
    ],
    features: [
      '은행·PG 펌뱅킹 계좌 입출금 조회 및 입출금 노티 기반 서비스.',
      '신한카드 상태·한도 조회 및 사용내역 제공, 한도 조정 기반 충전 자동화·실카드 잔액 연계.',
      '카드 외 포인트 계좌이체 및 회원 간 포인트 전송·전환.',
      '실명·본인인증 및 원천징수 정보 제공, 수수료 정산 스냅샷 계산·표시.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '기획 1 · 디자인 2 · 프론트 1 · 백엔드 1',
    status: '운영 중 · 영업 진행',
    links: WINCARD_LINKS,
  },
  {
    idx: '04', name: 'LM월드 · 조이널 — 네트워크 마케팅 마이오피스', client: 'LMWORLD · JOINALL', year: 2022, period: '2022.08 ~ 2022.10',
    role: 'Backend', tone: 'd', hasImage: false,
    summary: '네트워크 마케팅 수당 지급 체계 및 쇼핑몰 마이오피스 전산 개발.',
    overview: [
      'LMWORLD·JOINALL 2개 기업의 네트워크 마케팅 전용 마이오피스 전산 개발.',
      '윈카드 서비스 이용 기업의 고객사 페이지 개발.',
      '마케터 상품 판매·수당 지급을 위한 쇼핑몰 기능 및 수당 지급 체계.',
    ],
    features: [
      '자사 판매 상품·판매가·시세 기반 PV 설계.',
      '구매 상품 일일·누적 PV 기반 추천/후원 보너스·직급 체계 설계.',
      '스테이킹 구조 수당 — 특정 상품 구매 시 일일 보너스 지급.',
      '실시간 직급 체계 및 산하 PV 계산 기반 일/주/월 수당 지급.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '디자인 2 · 프론트 1 · 백엔드 1',
    status: 'JOINALL 운영 중 · LMWORLD 종료',
    links: [{ label: 'joinall.company', url: 'https://www.joinall.company' }],
  },
  {
    idx: '05', name: '나를미디어 — 네이버 플레이스 랭킹 추적', client: '나를미디어', year: 2022, period: '2022.10 ~ 2022.12',
    role: 'Backend', tone: 'e', hasImage: false,
    summary: '4만 가게의 네이버 플레이스 검색 순위를 크롤링·기록하는 광고효과 추적 전산.',
    overview: [
      '광고 서비스 등록 가게 리스트를 전산 등록·관리·운영하는 시스템.',
      '네이버 플레이스 기반 광고 전/후 검색 랭킹 변화를 기록·관리해 광고효과 입증.',
    ],
    features: [
      '총 4만 건 가게를 매일 1회 크롤링해 현황 수집.',
      '가게별 추적 키워드 등록 → 네이버 플레이스 검색 노출 순위 크롤링·기록.',
      '비공식 API 구조 분석·호출로 순위 집계 로직 고도화(웹드라이버 크롤러 → API 크롤러).',
      '외부 추가 서버 API 방식 부분 탐색·집결 및 상태 단계화(대기/탐색중/완료) 무결성 예외 처리.',
    ],
    stack: ['PHP', 'Python', 'Vanilla JS', 'MariaDB'],
    team: '디자인 1 · 프론트 1 · 백엔드 1',
    status: '서비스 종료',
    note: '크롤러 고도화 — 3일 최대 5천 건 → 일 2시간 이내 10만 회 키워드 탐색으로 처리량 대폭 개선.',
  },
  {
    idx: '06', name: '조이널 — 입점몰 · SNS 플랫폼', client: 'JOINALL', year: 2023, period: '2023.01 ~ 2023.04',
    role: 'Backend', tone: 'a', hasImage: false,
    summary: 'JOINALL 리뉴얼 + 입점몰 조인샵 · 소상공인 조이로드 · SNS HOOK 개발·연동.',
    overview: [
      'JOINALL COMPANY 플랫폼 리뉴얼 및 수당 체계 추가.',
      '입점몰 조인샵 / 소상공인 플랫폼 조이로드 / SNS 서비스 HOOK 개발·연동.',
      '조인샵: 수당 포인트를 복합 사용하는 폐쇄형 몰인몰 쇼핑몰.',
    ],
    features: [
      '관리자·판매자·회원 3뎁스 체계의 폐쇄형 몰인몰(입점몰), 장바구니·쿠폰 기능.',
      'JOINALL COMPANY DB 연계 REST API 개발 — 회원·포인트 복합 결제 지원.',
      'HOOK: 네이버·카카오·구글 소셜로그인 SNS 및 이미지/동영상 압축 플롯 설계.',
      'Firebase 기반 풀링 UI 및 실시간 댓글/대화창/알림 서비스.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'Firebase'],
    team: '디자인 1 · 프론트 2 · 백엔드 1',
    status: '조인샵·조이로드 운영 중 · HOOK 만료',
    links: [
      { label: 'joinall.shop', url: 'https://joinall.shop' },
      { label: 'joyroad.kr', url: 'https://joyroad.kr' },
    ],
  },
  {
    idx: '07', name: '윈카드 — 하나카드 · 글로벌 결제 (2차)', client: '윈카드', year: 2023, period: '2023.04 ~ 2023.08',
    role: 'Backend', tone: 'b', hasImage: false,
    summary: '하나카드 MOU 이관 및 MASTER/UNION 글로벌 해외 결제 지원 2차 개발.',
    overview: [
      'B2B 복지카드·수당지급 솔루션 기능 개선 및 2차 개발.',
      '신한카드 외 하나카드 MOU 기반 법인카드 수당 지급 솔루션.',
      'MASTER/UNION 카드 글로벌 해외 온/오프라인 결제 지원.',
    ],
    features: [
      '하나카드 법인카드 전산 이관 및 시스템 구축, 거래내역·사용량 조회 연동.',
      '하나카드 한도 설정·조회·상태 관리 등 카드 관리 기능 연동.',
      '해외결제 및 해외 거래이력 관리.',
      '국제문자 서비스·국가별 번역 및 국가 간 계좌이체 등 글로벌 사용 지원.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '디자인 1 · 프론트 3 · 백엔드 1',
    status: '운영 중 · 영업 진행',
    links: WINCARD_LINKS,
  },
  {
    idx: '08', name: '빅토리월렛 — 블록체인 코인 지갑 (신규)', client: '빅토리월렛', year: 2023, period: '2023.09 ~ 2023.12',
    role: 'Backend', tone: 'c', hasImage: false,
    summary: 'TRON 네트워크 HD 지갑 기반 코인 지갑 솔루션 신규 개발, 윈카드 연계.',
    overview: [
      '코인 네트워크 기반 블록체인 코인 지갑 솔루션 신규 개발.',
      '윈카드 연계 프로젝트 — 실물 카드 외 코인 지갑 서비스 지원.',
      '윈카드와 동일 구조로 운영하며 회원에게 지갑 서비스 제공.',
    ],
    features: [
      '외부 코인 API 기반 TRON 단일 HD 지갑 및 파생주소 생성·부여.',
      '웹훅 기반 주소별 입출금 트리거로 한도량 관리.',
      '지갑 한도 조회 및 시세 기반 브릿지 서비스.',
      '회원 간 P2P 전송 및 외부 지갑 코인 전송 기능.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'TRON'],
    team: '디자인 2 · 프론트 2 · 백엔드 1',
    status: '운영 중 · 영업 진행',
    links: VWALLET_LINKS,
  },
  {
    idx: '09', name: 'XTRUN — 글로벌 입점몰 쇼핑몰', client: 'XTRUN', year: 2024, period: '2024.01 ~ 2024.04',
    role: 'Planning · Backend', tone: 'd', hasImage: false,
    summary: '중국 쇼핑센터 XTURN의 한국 입점몰·수익공유 쇼핑몰 개발.',
    overview: [
      '중국 오프라인 쇼핑센터 XTURN의 한국 쇼핑몰 개발.',
      '판매자 모집·상품 등록 판매 입점몰 및 영업 네트워크 수익 공유 서비스.',
      '윈카드 서비스 이용 기업의 고객사 페이지 개발.',
    ],
    features: [
      '자사 판매상품 마진 기반 PV·수익 체계 설계.',
      '입점몰 판매자별 원가·마진율 설계 및 공유금액(PV) 설정.',
      '누적 공유금액 기반 직급 체계 설정 및 공유 수익금 지급.',
      '일/주/월 누적금액 기반 공유 수당 체계 설정·지급 관리.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '기획·디자인 2 · 프론트 2 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '10', name: '한울그룹 · 한울오피스 — 협동조합 온라인 장터', client: '한울그룹', year: 2024, period: '2024.05 ~ 2024.06',
    role: 'Planning · Backend', tone: 'e', hasImage: false,
    summary: '교회 공동체·지역 상인 협동조합형 온라인 장터, 티켓 기반 상생 보너스 설계.',
    overview: [
      '교회 공동체·지역 상인이 서로의 상품을 사고파는 협동조합형 온라인 장터 개발.',
      '소개 페이지·마이오피스 전산·지역 쇼핑몰 3단계 구성.',
      '오프라인 상점 구매 시 티켓 지급 → 순차 수익 공유 상생 보너스.',
    ],
    features: [
      '티켓 순서 지정 및 만료(일정 인원 모집) 알고리즘 개발.',
      '티켓 만료 시점 특정 순서 회원에게 상생 보너스 지급.',
      '티켓 만료 대상 후순위 배치 알고리즘 개발·적용.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '기획·디자인 2 · 프론트 1 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '11', name: '빅토리월렛 — BSC · 커스텀 토큰 (2차)', client: '빅토리월렛', year: 2024, period: '2024.06 ~ 2024.07',
    role: 'Backend', tone: 'a', hasImage: false,
    summary: 'BSC 네트워크·커스텀 토큰 지원 및 P2P/P2C 거래소, TRON 수수료 최적화.',
    overview: [
      '코인 지갑 솔루션 기능 개선 및 2차 개발.',
      '신규 BSC(Binance Smart Chain) 지원 및 P2P·P2C(마켓 메이커) 거래 추가.',
      '기존 TRON 트랜잭션 수수료 최적화.',
    ],
    features: [
      '단일 HD 지갑에 TRON 외 BSC 네트워크 지원·호환 개발.',
      '메인/서브 토큰 외 TRC20·BEP20 파생 비상장 토큰 탐색·지원.',
      '마더지갑 집금 자동화 및 잔액 트래커 개발.',
      'TRON 리소스(Energy·Bandwidth) 최적화, 스테이킹·리소스 위임 개발.',
      'P2P 코인 거래소 및 P2C 퀵거래·회사 시제 관리 서비스.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'TRON', 'BSC'],
    team: '프론트 1 · 백엔드 1',
    status: '운영 중 · 영업 진행',
    links: VWALLET_LINKS,
  },
  {
    idx: '12', name: '윈윈 — 글로벌 쇼핑센터 리뉴얼', client: '윈윈', year: 2024, period: '2024.08 ~ 2024.09',
    role: 'Backend', tone: 'b', hasImage: false,
    summary: 'XTURN 한국 쇼핑몰 리뉴얼, 국가별 결제·수당·번역 병합 운영.',
    overview: [
      'XTURN 한국 쇼핑몰 개발 리뉴얼 및 수당 체계 수정.',
      '판매자 모집·상품 등록 판매 입점몰 및 영업 네트워크 수익 공유.',
      '한중 외 다국가 쇼핑센터 병합 운영 및 국가별 수익 수당 체계 신설.',
    ],
    features: [
      '한국 외 중국·대만·태국·일본 글로벌 번역 및 국가 서비스 지원.',
      '원화 카드결제 외 중국 알리페이 및 국가별 카드 결제 수단 지원.',
      '일본 거래소 USDT 시세 기반 코인 결제 지원.',
      '글로벌 국가별 별도 수당 체계 및 공유 보너스, 실시간 번역.',
    ],
    stack: ['PHP', 'jQuery', 'MariaDB', 'HTML'],
    team: '프론트 1 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '13', name: '레오맥스 · M2M — 스테이킹 마이오피스', client: '레오맥스 · M2M', year: 2024, period: '2024.09 ~ 2024.10',
    role: 'Backend', tone: 'c', hasImage: false,
    summary: 'USDT 기반 예치상품 스테이킹형 마이오피스 전산 개발.',
    overview: [
      '네트워크 마케팅 기업 스테이킹형 마이오피스 전산 개발.',
      '예치상품 판매·구매 수량 기록 관리 마이오피스 서비스.',
    ],
    features: [
      '한국 외 중국·대만·필리핀 글로벌 회원 유치용 문자인증·번역 지원.',
      '테더 USDT 기반 예치상품 시세 변동 상품 판매·결제 지원.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'USDT'],
    team: '디자인 1 · 프론트 1 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '14', name: '온리윈 · 힐링셀바이오 — 프로모션 마이오피스', client: 'ONLYWIN · 힐링셀바이오', year: 2024, period: '2024.10 ~ 2025.01',
    role: 'Backend', tone: 'd', hasImage: false, slug: 'hcbrs',
    summary: '선착순·멤버십 특수 프로모션 수당 알고리즘 기반 마이오피스 신규 개발.',
    overview: [
      '네트워크 마케팅 조합 신규 플랫폼 ONLYWIN 마이오피스 전산 개발.',
      '선착순 프로모션·멤버십 기간 프로모션 등 특수 프로모션 서비스.',
      '윈카드 서비스 이용 기업의 고객사 마이오피스 개발.',
    ],
    features: [
      '상품 구매 시 예치상품 스테이킹 및 기간제 멤버십 가입.',
      '월정액 기간만료 상품 지급 및 빌링결제 멤버십 자동 결제.',
      '멤버십 데일리 보너스 및 추천/후원 특수 프로모션 수당 알고리즘.',
      '선착순 배치 학년·레벨링 프로모션 — 단계 달성 시 수익 공유.',
      '직급·레벨·지사·지점 다중 체계별 주/월 수익 공유 서비스.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '디자인 2 · 프론트 3 · 백엔드 2',
    status: '서비스 종료',
  },
  {
    idx: '15', name: 'NOAH · NOAH K BIO — 코인 기반 마이오피스', client: 'NOAH', year: 2025, period: '2025.01 ~ 2025.02',
    role: 'Backend', tone: 'e', hasImage: false,
    summary: 'ONLYWIN 신규 플랫폼 — 코인 네트워크 상품·스테이킹 수익률 강화.',
    overview: [
      'ONLYWIN 사 신규 플랫폼 NOAH K BIO 개발.',
      '기존 체계에 코인 네트워크 기반 상품·공유 수익 서비스.',
      '학년 등 선착순 프로모션 체계 및 스테이킹 수익률 강화.',
    ],
    features: [
      '상품 구매 시 예치상품 스테이킹 및 기간제 멤버십 가입.',
      '월정액 기간만료 상품 및 빌링결제 멤버십 자동 결제.',
      '데일리 보너스 및 추천/후원 특수 프로모션 수당 알고리즘.',
      '학년 프로모션 1·2·3 설계 — 조건 달성 시 수익 공유.',
      '직급·레벨·지사·지점 다중 체계별 주/월 수익 공유.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '디자인 1 · 프론트 2 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '16', name: '윈카드 · 빅토리월렛 — 글로벌 이체 · 상점 (3차)', client: '윈카드 · 빅토리월렛', year: 2025, period: '2025.02 ~ 2025.06',
    role: 'Backend', tone: 'a', hasImage: false, slug: 'wincard-shop',
    summary: '중국 글로벌 이체·라이브 환전, 충전·결제 API 및 윈카드 상점 서비스.',
    overview: [
      'B2B 복지카드·수당지급 솔루션 기능 개선 및 3차 개발.',
      '중국 알리페이·유니온페이 전송으로 국내외 글로벌 이체 지원.',
      '충전·결제 API 연동으로 고객사 사이트 내 윈카드 서비스 제공.',
      '소상공인 가게 솔루션 윈카드 상점 서비스 및 할인 바우처.',
    ],
    features: [
      '중국 현지 알리페이·유니온페이 계좌 이체로 글로벌 이체 지원.',
      '달러·위안화 실시간 환율 기반 양방향 라이브 환전 서비스.',
      '카드 관리·충전 API 개발로 외부 고객사 윈카드 관리 지원.',
      '카드 잔액·포인트·코인 결제 API로 제휴 사이트 윈카드 결제.',
      '소상공인 상점 등록·상품 관리·홍보 플랫폼 윈카드 상점.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'HTML'],
    team: '디자인 1 · 프론트 1 · 백엔드 1',
    status: '운영 중 · 영업 진행',
    links: WINCARD_LINKS,
  },
  {
    idx: '17', name: 'HCBRS · NOAH · NOAH SKY — 글로벌 2차 개발', client: 'ONLYWIN', year: 2025, period: '2025.06 ~ 2025.08',
    role: 'Backend', tone: 'b', hasImage: false, slug: 'noahsky',
    summary: '힐링셀바이오·NOAH 리뉴얼 및 글로벌 확장, 승급형 멤버십 추가.',
    overview: [
      'ONLYWIN 사 플랫폼 힐링셀바이오·NOAH 리뉴얼 및 글로벌 2차 개발.',
      '기간제 멤버십 외 일회성 승급형 멤버십 상품 추가.',
      '수당 체계 지급 비율 업데이트 및 신규 프로모션 추가.',
    ],
    features: [
      '한국 외 인도·두바이·중국·일본·태국 글로벌 서비스 확장.',
      '언어 번역 및 USDT 코인 기반 해외 결제 도입.',
      '국가별 글로벌 프로모션 체계 설계 및 기존 체계 분할 운영.',
    ],
    stack: ['PHP', 'Vanilla JS', 'MariaDB', 'USDT'],
    team: '프론트 2 · 백엔드 1',
    status: '서비스 종료',
  },
  {
    idx: '18', name: '잇플 (EATPLE) — 노쇼 음식 특가 커머스', client: '잇플', year: 2025, period: '2025.09 ~ 2025.12',
    role: 'Backend · App', tone: 'c', hasImage: false, slug: 'eatple',
    summary: '노쇼 음식을 특가 판매하는 위치기반 하이브리드 웹/앱 커머스, 기획~운영 담당.',
    overview: [
      '기획·개발·운영까지 담당한 하이브리드 웹/앱 프로젝트.',
      '예약 후 판매되지 않은 노쇼 음식을 프로모션(할인) 전문 판매·관리.',
      '소비자에겐 저렴한 상품, 판매자에겐 폐기 피해 최소화 효과.',
    ],
    features: [
      '오픈마켓 입점몰 — 판매자(상점)·소비자(회원) 분리 서비스.',
      '위치기반 서비스 — 현재 위치 기준 판매 상점·상품 노출, 지도·도착 예상시간.',
      '실시간 주문 처리 및 웹/앱 하이브리드 풀링 실시간 알림·PUSH·라이브 UI.',
      '하이브리드 웹/앱 래퍼 앱 개발·배포(소비자·판매자 각각).',
    ],
    stack: ['Laravel', 'Vue.js', 'TypeScript', 'Tailwind', 'React Native', 'FCM', 'Docker'],
    team: '기획 2 · 디자인 1 · 프론트 1 · 백엔드 1',
    status: '서비스 종료',
    note: 'Claude Code 바이브 코딩 프로젝트.',
  },
  {
    idx: '19', name: '빅토리월렛 — 지갑 API 마이그레이션', client: '빅토리월렛', year: 2026, period: '2026.01 ~ 2026.01',
    role: 'Fullstack (단독)', tone: 'd', hasImage: false,
    summary: '지갑 솔루션을 거래소 API로 마이그레이션, ETH·BASE 추가 — 연 4,900만원 절감.',
    overview: [
      '코인 지갑 솔루션 기능 개선 및 2차 개발(단독).',
      'TRON·BSC 외 신규 ETH·BASE 네트워크 지원 추가.',
      '기존 지갑 솔루션 → 해외 거래소 기반 API로 마이그레이션.',
    ],
    features: [
      '국내 지갑 솔루션 → 블록체인 지갑 API(해외 거래소 API) 기반으로 마이그레이션.',
      '파생지갑 생성·웹훅 구독·잔액 추적 트래커 구현.',
      'ETH·BASE 네트워크 지원 및 수수료 자동 계산.',
      '서비스 집금·잔액 관리 기능 자동화.',
    ],
    stack: ['PHP', 'TypeScript', 'Tailwind', 'Flutter', 'MariaDB', 'FCM'],
    team: '풀스택 1 (단독)',
    status: '운영 중 · 영업 진행',
    links: VWALLET_LINKS,
    note: '운영비 연 5,000만원 → 100만원, 연 약 4,900만원 절감. · Claude Code 바이브 코딩 프로젝트.',
  },
  {
    idx: '20', name: '윈카드 · 빅토리월렛 — 보안 · Passkey 인증', client: '윈카드 · 빅토리월렛', year: 2026, period: '2026.01 ~ 2026.02',
    role: 'Fullstack (단독)', tone: 'e', hasImage: false,
    summary: 'Passkey 생체 2차 인증 도입 및 개인정보 암호화 보안 강화.',
    overview: [
      '윈카드·빅토리월렛 보안 업데이트 및 2차 인증수단 추가.',
      '문자인증 외 생체인증 Passkey 인증 지원.',
      '개인정보·민감정보 암호화 및 방화벽 인증 강화.',
    ],
    features: [
      '구글 Passkey 서비스 모듈화 개발 — 생체 2차 인증 지원.',
      '웹/앱 Passkey 설정 및 호환 마이그레이션 브릿지 코드.',
      'QR 스캔·임시 패스워드 기반 외부기기 인증·인증키 생성.',
      '개인정보/민감정보 개별 암호모듈 기반 미설정 항목 보안.',
    ],
    stack: ['PHP', 'TypeScript', 'Tailwind', 'React Native', 'Flutter', 'FCM'],
    team: '풀스택 1 (단독)',
    status: '운영 중 · 영업 진행',
    links: WINCARD_LINKS,
  },
  {
    idx: '21', name: '윈카드 — 충전 서비스 (4차)', client: '윈카드', year: 2026, period: '2026.02 ~ 2026.03',
    role: 'Fullstack (단독)', tone: 'a', hasImage: false,
    summary: '신용카드·휴대폰 소액결제 등 회원 직접 선불 충전 및 PG 선점 알고리즘.',
    overview: [
      'B2B 복지카드·수당지급 솔루션 기능 개선 및 4차 개발.',
      '기존 관리자 충전 외 회원이 카드에 직접 선불 충전 불가 문제 해소.',
      '신용카드·휴대폰 소액결제·무통장 입금 등 직접 선불 충전 지원.',
    ],
    features: [
      '국내외 신용카드 수기결제·소액결제·알리페이·유니온페이·무통장 등 PG별 충전.',
      '결제수단별 1~4개 PG 연동, 월/일 결제금액 순 PG 선점 알고리즘.',
      '일/주/월 PG별 정산 모니터링 및 정산 수익금 집금 자동화.',
      '2차 인증 기반 충전 보안 및 canvas 결제 약관 작성 시스템.',
    ],
    stack: ['PHP', 'TypeScript', 'Tailwind', 'React Native', 'Flutter', 'FCM'],
    team: '풀스택 1 (단독)',
    status: '운영 중 · 영업 진행',
    links: WINCARD_LINKS,
  },
  {
    idx: '22', name: '노온 (NOON) — AI 불만리뷰 SNS', client: '노온', year: 2026, period: '2026.03 ~ 2026.04',
    role: 'Fullstack · App', tone: 'b', hasImage: false,
    summary: 'AI 리뷰 도우미·OCR 검증을 지원하는 불만 공유 리뷰 SNS 신규 개발.',
    overview: [
      'AI 지원 불만 공유 리뷰 서비스 NOON 신규 개발.',
      'SNS 형식으로 사업체·제품·서비스 불만사항을 공유하는 플랫폼.',
      '리뷰 작성 시 AI 리뷰 도우미 서비스 지원.',
    ],
    features: [
      '블로그 형식 리뷰 피드 공유형 SNS.',
      '리뷰 등록 시 AI 검수로 부적절 리뷰 탐색(리뷰 도우미 AI).',
      '영수증 첨부 OCR 인증 및 AI 이미지 분석 검증.',
    ],
    stack: ['NestJS', 'Vue.js', 'TypeScript', 'Tailwind', 'React Native', 'Gemini API', 'FCM'],
    team: '디자인 1 · 프론트 1 · 풀스택 1',
    status: '운영 중 · 스토어 앱 배포',
    links: [{ label: 'noonx.kr', url: 'https://www.noonx.kr' }],
    note: 'Claude Code 바이브 코딩 프로젝트.',
  },
  {
    idx: '23', name: '윈오피스 (WINOFFICE) — 마이오피스 빌더', client: '윈오피스', year: 2026, period: '2026.04 ~ 2026.06',
    role: 'Solo (기획·디자인·개발)', tone: 'c', hasImage: false,
    summary: '누구나 마이오피스를 생성·운영하는 빌더 SaaS, 기획·디자인·개발 1인 완성.',
    overview: [
      '마이오피스 빌더 서비스 WINOFFICE 신규 개발.',
      '높은 개발비·낮은 접근성 해소 — 누구나 쉽게 만드는 빌딩형 마이오피스.',
      '카페24·아임웹처럼 전산 생성·수당 체계 선택으로 기업별 마이오피스 운영.',
    ],
    features: [
      '빌더 구조 — 회원가입 후 마이오피스 생성·설정으로 자체 운영·관리.',
      '생성 URL 공유로 만들어진 마이오피스 홍보·운영.',
      '기존 전산·회원 이관 엑셀 대량 등록 및 AI 전산 이관 서비스.',
      '쇼핑몰형 상품 등록·판매 및 판매 기반 수당 체계.',
      '스토리지 마운트·미러링 — 이미지·영수증·약관·로그 보관.',
      '수당 상세 설정·지급 비율 커스터마이즈, 요청 기반 수당 항목 확장.',
      'OCR 거래내역 인증 및 AI 상황설정 챗봇 서비스.',
    ],
    stack: ['PHP', 'TypeScript', 'Tailwind', 'MariaDB', 'Gemini API', 'HTML'],
    team: '1인 (기획·디자인·개발)',
    status: '운영 중 · 영업 진행',
    links: [
      { label: 'winofficex.com', url: 'https://www.winofficex.com' },
      { label: 'my.winofficex.com', url: 'https://my.winofficex.com' },
    ],
    note: 'Claude 기획 → Claude Design 프로토타입 → Claude Code 개발.',
  },
]

// 포트폴리오 타임라인(// works) — 세로 스파인(선) + 노드(점). 년도별 그룹(큰 라벨·노드) + 점 선택 시 펼쳐짐.
//  · 기본 첫 프로젝트 열림. 노드/바 클릭 = 선택/토글. 패널은 grid-template-rows 0fr→1fr 로 부드럽게 전개.
//  · 리빌은 React state(shown: idx Set)로 소유 — 전역 .reveal IO 처럼 DOM 에 직접 클래스를 넣으면
//    토글 리렌더 때 React 가 className 을 덮어써 지워진다(→ 항목이 사라짐). 그래서 자체 IO + state 로 관리.
function WorksTimeline({ page, menuOpen }: { page: number; menuOpen: boolean }) {
  // 최신순(내림차순) — idx 는 커리어 오름차순(01=최초)이라 가장 큰 idx 가 최신. 타임라인 상단이 최신.
  const firstIdx = PROJECTS[PROJECTS.length - 1]?.idx ?? '' // 자동 펼침 대상 = 최신(상단 첫 항목)
  const years = Array.from(new Set(PROJECTS.map((p) => p.year))).sort((a, b) => b - a) // 년도 내림차순
  const [active, setActive] = useState<string>('') // 열린 프로젝트(오버레이 복원 시 유지)
  const [entered, setEntered] = useState(false) // 진입 재생 트리거(스파인→년도·항목 순차 등장)
  const [modal, setModal] = useState<string | null>(null) // View → 상세 모달(프로젝트 idx)
  const interacted = useRef(false) // 사용자가 먼저 항목을 조작하면 자동 전개 취소
  const openTimer = useRef(0)
  const revealTimer = useRef(0)

  // ── 진입/재생 오케스트레이션 — entered 를 껐다(숨김) 잠시 뒤 켜서 CSS 스태거를 재시작(2P 처럼 도착마다 재생).
  //   · fresh=true(스크롤 도착): active 리셋 → 스태거 종료 시 첫 프로젝트 자동 전개.
  //   · fresh=false(메뉴/모달 해제): 이전에 열려있던 프로젝트(active) 유지하며 재생(복원).
  //   ⚠️ rAF 대신 setTimeout 사용 — rAF 는 idle/백그라운드에서 멈출 수 있어 재생이 걸릴 수 있음(견고성).
  const replay = useCallback(
    (fresh: boolean) => {
      clearTimeout(openTimer.current)
      clearTimeout(revealTimer.current)
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        setEntered(true)
        if (fresh) {
          interacted.current = false
          setActive(firstIdx)
        }
        return
      }
      setEntered(false) // 숨김으로 리셋(이 상태가 페인트된 뒤 다시 켜야 트랜지션이 재생됨)
      if (fresh) {
        interacted.current = false
        setActive('')
      }
      revealTimer.current = window.setTimeout(() => {
        setEntered(true)
        if (fresh) {
          // 자동 펼침 = 최신(최상단) 항목. seq 가 작아 일찍 등장하므로 총 개수와 무관한 고정 지연으로 빠르게 연다.
          openTimer.current = window.setTimeout(() => {
            if (!interacted.current) setActive(firstIdx)
          }, 720)
        }
      }, 40)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [firstIdx],
  )

  const onPage = page === 2 // works 가 현재 섹션(2P 의 is-page-2 와 동일 개념)
  // ⚠️ 가림 판정에는 '메뉴'만 포함. 모달(View)은 타임라인을 전체(모바일)·백드롭 블러(PC)로 완전히 덮으므로
  //    뒤의 타임라인은 entered 그대로 두고 재생하지 않는다 → 모달을 닫아도 스태거가 다시 돌지 않음(깜빡임 제거).
  const covered = menuOpen // 메뉴가 가림(모달은 제외)
  const visible = onPage && !covered
  const prevVisible = useRef(false)
  const prevOnPage = useRef(false)
  const nextFresh = useRef(true) // 다음 재생이 fresh(스크롤 도착)인지 restore(오버레이 해제)인지

  useEffect(() => {
    if (!onPage && prevOnPage.current) nextFresh.current = true // 스크롤로 이탈 → 다음은 fresh
    prevOnPage.current = onPage
  }, [onPage])
  useEffect(() => {
    if (covered && onPage) nextFresh.current = false // 메뉴로 가려짐 → 다음(메뉴 닫힘)은 복원
  }, [covered, onPage])
  useEffect(() => {
    const was = prevVisible.current
    prevVisible.current = visible
    if (visible && !was) replay(nextFresh.current)
    else if (!visible && was) setEntered(false)
  }, [visible, replay])
  useEffect(
    () => () => {
      clearTimeout(openTimer.current)
      clearTimeout(revealTimer.current)
    },
    [],
  )

  const onSelect = (idx: string, open: boolean) => {
    interacted.current = true // 자동 전개보다 사용자 선택 우선
    setActive(open ? '' : idx)
  }

  let seq = 0 // 등장 스태거 순번(스파인 이후 년도·항목 순서대로)
  return (
    <>
      <div className={`tl${entered ? ' is-entered' : ''}`}>
        <span className="tl__line" aria-hidden="true" />
        {years.map((yr) => {
          // 년도 내 최신 달 먼저(내림차순) — idx 내림차순 정렬(월 순서와 일치).
          const items = PROJECTS.filter((p) => p.year === yr).sort((a, b) => Number(b.idx) - Number(a.idx))
          const headSeq = ++seq
          return (
            <section className="tl-year" key={yr}>
              <div className="tl-year__head" style={{ ['--seq' as string]: headSeq }}>
                <span className="tl-year__node" aria-hidden="true" />
                <span className="tl-year__label">{yr}</span>
                <span className="tl-year__meta">
                  {items.length} project{items.length > 1 ? 's' : ''}
                </span>
              </div>
              <div className="tl-year__items">
                {items.map((p) => {
                  const open = active === p.idx
                  const itemSeq = ++seq
                  return (
                    <div
                      className={`tl-item${open ? ' is-open' : ''}${p.hasImage ? '' : ' is-noimg'}`}
                      key={p.idx}
                      data-row={p.idx}
                      data-tone={p.tone}
                      style={{ ['--seq' as string]: itemSeq }}
                    >
                      <button
                        type="button"
                        className="tl-item__bar"
                        aria-expanded={open}
                        onClick={() => onSelect(p.idx, open)}
                      >
                        <span className="tl-item__dot" aria-hidden="true" />
                        <span className="tl-item__idx">{p.idx}</span>
                        <span className="tl-item__title">{p.name}</span>
                        <span className="tl-item__chev" aria-hidden="true" />
                      </button>
                      <div className="tl-item__panel">
                        <div className="tl-item__clip">
                          <div className="tl-item__content">
                            {p.hasImage ? (
                              <div className="tl-item__cover" aria-hidden="true">
                                <div className="tl-item__art" />
                                <span className="tl-item__num">{p.idx}</span>
                              </div>
                            ) : null}
                            <div className="tl-item__detail">
                              {/* 메타 — 기간 · 담당 · 고객사(초기 노출 정보 보강) */}
                              <div className="tl-item__meta">
                                <span className="tl-item__meta-period">{p.period}</span>
                                <span className="tl-item__meta-dot" aria-hidden="true" />
                                <span className="tl-item__meta-role">{p.role}</span>
                                <span className="tl-item__meta-dot" aria-hidden="true" />
                                <span className="tl-item__meta-client">{p.client}</span>
                              </div>
                              <p className="tl-item__desc">{p.summary}</p>
                              {/* 핵심 기능 미리보기(상위 3개) — 자세히는 View 모달 */}
                              <ul className="tl-item__points">
                                {p.features.slice(0, 3).map((f) => (
                                  <li key={f}>{f}</li>
                                ))}
                              </ul>
                              <div className="tl-item__tags">
                                {p.stack.map((s, ci) => (
                                  <span className="tl-chip" key={s} style={{ ['--ci' as string]: ci }}>
                                    {s}
                                  </span>
                                ))}
                              </div>
                              <div className="tl-item__foot">
                                <span className="tl-item__status">{p.status}</span>
                                <button
                                  type="button"
                                  className="tl-item__view"
                                  onClick={() => setModal(p.idx)}
                                >
                                  View&nbsp;→
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </div>
      {modal
        ? createPortal(
            <WorkModal
              project={PROJECTS.find((p) => p.idx === modal) as Project}
              onClose={() => setModal(null)}
            />,
            document.body,
          )
        : null}
    </>
  )
}

// 상세 모달 — View 클릭 시. PC=중앙 다이얼로그 / 태블릿·모바일=전체 화면 덮기(메뉴처럼).
//  · 백드롭/ESC 로 닫힘. document.body 로 portal → .main1 변형·스크롤과 독립(전체 뷰포트 고정).
function WorkModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const images = project.slug ? IMAGES_BY_SLUG[project.slug] ?? [] : []
  const [lightbox, setLightbox] = useState<number | null>(null) // 원본 보기(라이트박스) 인덱스
  const lbRef = useRef(lightbox)
  lbRef.current = lightbox
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lbRef.current === null) onClose() // 라이트박스 열려있으면 그쪽이 먼저 닫힘
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])
  return (
    <div className="wm" role="dialog" aria-modal="true" aria-label={project.name} onClick={onClose}>
      <div
        className="wm__panel"
        data-tone={project.tone}
        data-noimg={project.hasImage ? undefined : ''}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="wm__close" onClick={onClose} aria-label="닫기">
          <span />
          <span />
        </button>
        {project.hasImage ? (
          // 커버 포스터 — 듀오톤 아트(느린 켄번스 줌) + 하단 스크림 + 글래스 role 태그 + 대형 인덱스.
          <div className="wm__cover" aria-hidden="true">
            <div className="wm__art" />
            <div className="wm__cover-scrim" />
            <span className="wm__cover-tag">{project.role}</span>
            <span className="wm__num">{project.idx}</span>
          </div>
        ) : null}
        {/* 본문 — 직계 자식이 순차(스태거) 라이즈. head → note → overview → features → stack → details 순.
            레이아웃은 이전(Details 행) 버전 복원 + 2P(resume) 디자인 언어(섹션 헤더·칩·key/value 행·버튼) 통일. */}
        <div className="wm__body">
          <div className="wm__head">
            <span className="wm__kicker" aria-hidden="true" />
            <p className="wm__client">{project.client}</p>
            <h3 className="wm__title">{project.name}</h3>
            <p className="wm__period">
              <span className="wm__period-dot" aria-hidden="true" />
              {project.period}
            </p>
            <p className="wm__lead">{project.summary}</p>
          </div>
          {project.note ? <p className="wm__note">{project.note}</p> : null}
          {images.length ? (
            <section className="wm__section">
              <h4 className="wm__h">Gallery</h4>
              <WorkGallery images={images} onOpen={setLightbox} />
            </section>
          ) : null}
          <section className="wm__section">
            <h4 className="wm__h">Overview</h4>
            <ul className="wm__list">
              {project.overview.map((o) => (
                <li key={o}>{o}</li>
              ))}
            </ul>
          </section>
          <section className="wm__section">
            <h4 className="wm__h">Key Features</h4>
            <ul className="wm__list wm__list--feat">
              {project.features.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </section>
          <section className="wm__section">
            <h4 className="wm__h">Tech Stack</h4>
            <div className="wm__tags">
              {project.stack.map((s) => (
                <span className="wm__chip" key={s}>
                  {s}
                </span>
              ))}
            </div>
          </section>
          <section className="wm__section">
            <h4 className="wm__h">Details</h4>
            <dl className="wm__rows">
              <div className="wm__row">
                <dt className="wm__row-k">담당</dt>
                <dd className="wm__row-v">{project.role}</dd>
              </div>
              <div className="wm__row">
                <dt className="wm__row-k">개발 인원</dt>
                <dd className="wm__row-v">{project.team}</dd>
              </div>
              <div className="wm__row">
                <dt className="wm__row-k">서비스 현황</dt>
                <dd className="wm__row-v">{project.status}</dd>
              </div>
              {project.links && project.links.length ? (
                <div className="wm__row">
                  <dt className="wm__row-k">링크</dt>
                  <dd className="wm__row-v wm__links">
                    {project.links.map((l) => (
                      <a
                        key={l.url}
                        className="wm__link"
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {l.label}
                        <span className="wm__link-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </a>
                    ))}
                  </dd>
                </div>
              ) : null}
            </dl>
          </section>
        </div>
      </div>
      {lightbox !== null
        ? createPortal(
            <Lightbox images={images} index={lightbox} onClose={() => setLightbox(null)} />,
            document.body,
          )
        : null}
    </div>
  )
}

// 상세 갤러리 슬라이더 — scroll-snap 기반(모바일 스와이프 네이티브 + PC 화살표/도트). 슬라이드는 크롭(cover),
//  클릭 시 원본(라이트박스, contain)로 전체 확인. reduced-motion 이면 부드러운 스크롤 대신 즉시 이동.
function WorkGallery({ images, onOpen }: { images: string[]; onOpen: (i: number) => void }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const multi = images.length > 1
  const go = (i: number) => {
    const el = trackRef.current
    if (!el) return
    const to = Math.max(0, Math.min(images.length - 1, i))
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: el.clientWidth * to, behavior: smooth ? 'smooth' : 'auto' })
  }
  const onScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / Math.max(1, el.clientWidth)))
  }
  return (
    <div className={`wg${multi ? '' : ' wg--single'}`}>
      <div className="wg__track" ref={trackRef} onScroll={onScroll}>
        {images.map((src, i) => (
          <button
            type="button"
            className="wg__slide"
            key={src}
            onClick={() => onOpen(i)}
            aria-label={`이미지 ${i + 1} 원본 보기`}
          >
            <img src={src} alt="" loading="lazy" draggable={false} />
            <span className="wg__zoom" aria-hidden="true">
              ⤢
            </span>
          </button>
        ))}
      </div>
      {multi ? (
        <>
          <button
            type="button"
            className="wg__nav wg__nav--prev"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="이전 이미지"
          />
          <button
            type="button"
            className="wg__nav wg__nav--next"
            onClick={() => go(active + 1)}
            disabled={active === images.length - 1}
            aria-label="다음 이미지"
          />
          <div className="wg__dots">
            {images.map((_, i) => (
              <button
                type="button"
                className={`wg__dot${i === active ? ' is-active' : ''}`}
                key={i}
                onClick={() => go(i)}
                aria-label={`${i + 1}번째 이미지`}
              />
            ))}
          </div>
          <span className="wg__count">
            {active + 1} / {images.length}
          </span>
        </>
      ) : null}
    </div>
  )
}

// 원본 라이트박스 — 전체 이미지(contain) + 좌우 이동·ESC·백드롭 닫힘. document.body portal.
function Lightbox({
  images,
  index,
  onClose,
}: {
  images: string[]
  index: number
  onClose: () => void
}) {
  const [i, setI] = useState(index)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowLeft') setI((v) => Math.max(0, v - 1))
      else if (e.key === 'ArrowRight') setI((v) => Math.min(images.length - 1, v + 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [images.length, onClose])
  const multi = images.length > 1
  return (
    <div className="lb" role="dialog" aria-modal="true" aria-label="원본 이미지" onClick={onClose}>
      <button type="button" className="lb__close" onClick={onClose} aria-label="닫기">
        <span />
        <span />
      </button>
      <img
        className="lb__img"
        src={images[i]}
        alt=""
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />
      {multi ? (
        <>
          <button
            type="button"
            className="lb__nav lb__nav--prev"
            onClick={(e) => {
              e.stopPropagation()
              setI((v) => Math.max(0, v - 1))
            }}
            disabled={i === 0}
            aria-label="이전"
          />
          <button
            type="button"
            className="lb__nav lb__nav--next"
            onClick={(e) => {
              e.stopPropagation()
              setI((v) => Math.min(images.length - 1, v + 1))
            }}
            disabled={i === images.length - 1}
            aria-label="다음"
          />
          <div className="lb__count">
            {i + 1} / {images.length}
          </div>
        </>
      ) : null}
    </div>
  )
}

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
  const menuOpenRef = useRef(false) // 메뉴 열림 — 배경(.main1) 휠/터치 네비 무시용(스크롤 잠금)
  const resyncRef = useRef<(() => void) | null>(null) // 메뉴 토글 후 스크롤 진행도(--inv·is-page-2) 강제 재동기화
  const navPanelRef = useRef<HTMLDivElement>(null) // 풀스크린 메뉴 패널(스와이프-투-클로즈 transform 제어)
  const navScrimRef = useRef<HTMLDivElement>(null) // 메뉴 스크림(드래그에 맞춰 opacity 페이드)
  const [titleIdx, setTitleIdx] = useState(0) // 다국어 타이틀 순환
  const [titleIn, setTitleIn] = useState(false) // 단어별 rise 트리거(언어 전환 시 false→true)
  const [subIdx, setSubIdx] = useState(0) // 메인페이지 서브타이틀 순환
  const [page, setPage] = useState(0) // 현재 섹션(0=히어로/1=프로필/2=works) — 게이지·모바일 메뉴 활성 표시
  const [menuOpen, setMenuOpen] = useState(false) // 모바일/작은 태블릿 풀스크린 메뉴 열림

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
    let lastPage = -1 // 현재 섹션 인덱스 변화 시에만 setPage(불필요 리렌더 방지)

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
      // 현재 섹션(뷰포트 중앙 기준) → 게이지/모바일 메뉴 활성 표시. 변화 시에만 갱신.
      const mid = el!.scrollTop + vh * 0.5
      const pg = mid >= wTop ? 2 : mid >= rTop ? 1 : 0
      if (pg !== lastPage) {
        lastPage = pg
        setPage(pg)
      }
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
    // 외부(메뉴 토글 등)에서 강제 재동기화 — 리플로우로 어긋난 진행도 상태를 실제 scrollTop 기준으로 즉시 바로잡음.
    resyncRef.current = () => {
      computeTarget()
      if (!raf) raf = requestAnimationFrame(tick)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
      resyncRef.current = null
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

  // ── 벤토 썸네일 패럴럭스 — works 섹션이 뷰포트를 지나는 진행도를 --par(≈-1.2..1.2)로 노출.
  //    스크롤 컨테이너(scrollRef)에 passive 리스너만 추가(읽기 전용) → 휠-락(wheel preventDefault) 모델 불간섭.
  //    카드별 --depth(px)와 곱해 .bento-card__img 가 천천히 드리프트. reduced-motion 이면 비활성(정지). ──
  useEffect(() => {
    const root = scrollRef.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const work = root.querySelector('.seg--work') as HTMLElement | null
    if (!work) return
    let raf = 0
    const update = () => {
      raf = 0
      const vh = root.clientHeight || 1
      const r = work.getBoundingClientRect()
      const rr = root.getBoundingClientRect()
      const center = r.top - rr.top + r.height / 2 // 컨테이너 뷰포트 기준 섹션 중심
      const par = Math.max(-1.2, Math.min(1.2, (center - vh / 2) / (vh * 0.5)))
      work.style.setProperty('--par', par.toFixed(3))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    update()
    root.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      root.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(raf)
    }
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
    let animSafety = 0 // 워치독 타이머 — rAF 스톨 시 강제 완료(스크롤 영구 정지 방지)
    const tops = () =>
      ['.seg--hero', '.seg--resume', '.seg--work']
        .map((s) => el.querySelector<HTMLElement>(s))
        .filter((s): s is HTMLElement => !!s)
        .map((s) => ({ top: s.offsetTop, bottom: s.offsetTop + s.offsetHeight }))
    function animateTo(to: number) {
      cancelAnimationFrame(raf)
      clearTimeout(animSafety)
      const from = el!.scrollTop
      const dist = to - from
      // 플래그를 확실히 내리는 공용 종료 처리(early-return·정상완료·워치독 모두 여기로).
      const done = () => {
        clearTimeout(animSafety)
        cancelAnimationFrame(raf)
        animating = false
        animatingRef.current = false
      }
      if (Math.abs(dist) < 2) {
        done() // 이동 없음 — 플래그 즉시 해제(락 고착 방지)
        return
      }
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
          done()
        }
      }
      raf = requestAnimationFrame(step)
      // ⚠️ 워치독: 모달의 전체화면 backdrop-filter(blur) 가 캔버스 위에서 rAF 를 스톨시키면
      //    animateTo 가 완료되지 못해 animating/락 이 영구 고착 → 이후 모든 휠이 무시되어 '스크롤이 죽는' 버그.
      //    dur+400ms 안에 rAF 가 끝나지 못하면 강제로 목표까지 이동·플래그 해제(자가 치유).
      animSafety = window.setTimeout(() => {
        el!.scrollTop = to
        done()
      }, dur + 400)
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
      clearTimeout(animSafety)
      animating = false
      locked = false
      clearTimeout(idleTimer)
    }
    wheelStopRef.current = stopWheel // 버튼(맨위로·안내)이 이어받을 때 휠 애니/락 해제
    function onWheel(e: WheelEvent) {
      if (menuOpenRef.current) {
        e.preventDefault() // 메뉴 열림: 배경 네이티브 스크롤/네비 완전 차단(overflow 토글 없이 잠금)
        return
      }
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
      if (menuOpenRef.current) return // 메뉴 열림: 배경 드래그 네비 금지
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
      clearTimeout(animSafety)
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

    // ⚡ 무거운 three.js 초기화(PMREM 환경맵·구체 생성·WebGL 컨텍스트)를 첫 페인트 뒤로 미룬다.
    //    useEffect 는 페인트 후 실행되지만 이 동기 초기화가 길어 진입 CSS 애니메이션의 다음 프레임들을
    //    막아 '로드 버벅임'이 생김 → 2 프레임 양보 후 부팅해 셸/텍스트/진입 애니메이션을 먼저 매끄럽게.
    let disposed = false
    let cleanup: () => void = () => {}
    const boot = () => {
      if (disposed || !canvasRef.current) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // ── 렌더러 / 씬 / 카메라 ──
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.75))
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

      // ── 정리(부팅 완료분) ──
      cleanup = () => {
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
    }

    // 첫 페인트(진입 애니메이션) 이후로 부팅을 미룸 — 2 프레임 양보.
    const startId = requestAnimationFrame(() => requestAnimationFrame(boot))
    return () => {
      disposed = true
      cancelAnimationFrame(startId)
      cleanup() // 부팅 전이면 no-op, 부팅 후면 실제 dispose
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

  // 게이지/메뉴 → 지정 섹션(0=히어로/1=프로필/2=works)으로 부드럽게 이동.
  //  단일 easeInOutCubic 스크롤이라 1→3·3→1 도 중간 섹션을 '거쳐서' 자연스럽게 흐른다('맨 위로' 버튼과 동일 메커니즘).
  //  거리가 멀수록(여러 페이지) 시간이 늘어 과속 없이 매끄럽게 통과.
  function scrollToSection(idx: number) {
    const el = scrollRef.current
    if (!el) return
    wheelStopRef.current?.() // 휠 lerp/락 해제(충돌 방지)
    const segs = ['.seg--hero', '.seg--resume', '.seg--work']
    const target = el.querySelector<HTMLElement>(segs[idx])
    const to = idx === 0 ? 0 : target ? target.offsetTop : 0
    const start = el.scrollTop
    const dist = to - start
    if (Math.abs(dist) < 4) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      el.scrollTop = to
      return
    }
    const dur = Math.min(1400, 520 + Math.abs(dist) * 0.5)
    let t0 = 0
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2)
    animatingRef.current = true // 스냅/휠 컨트롤러가 끼어들지 않도록
    const step = (now: number) => {
      if (!t0) t0 = now
      const p = Math.min(1, (now - t0) / dur)
      el.scrollTop = Math.round(start + dist * ease(p))
      if (p < 1) requestAnimationFrame(step)
      else {
        el.scrollTop = to
        animatingRef.current = false
      }
    }
    requestAnimationFrame(step)
  }

  // ── 모바일 메뉴 스와이프-투-클로즈 ──
  //   메뉴는 우→좌로 열렸으므로, 반대 방향(좌→우) 드래그로 닫는다.
  //   손가락을 1:1 로 따라오고(패널 translateX + 스크림 페이드), 놓을 때 임계(패널 폭 30%)·플릭이면 닫힘·미만이면 복귀.
  const navDrag = useRef({ active: false, startX: 0, startY: 0, dx: 0, lastX: 0, lastT: 0, vx: 0, lock: '' as '' | 'x' | 'y' })
  function onNavTouchStart(e: ReactTouchEvent) {
    if (e.touches.length !== 1) return
    const t = e.touches[0]
    navDrag.current = { active: true, startX: t.clientX, startY: t.clientY, dx: 0, lastX: t.clientX, lastT: e.timeStamp, vx: 0, lock: '' }
  }
  function onNavTouchMove(e: ReactTouchEvent) {
    const d = navDrag.current
    if (!d.active || e.touches.length !== 1) return
    const t = e.touches[0]
    const dx = t.clientX - d.startX
    const dy = t.clientY - d.startY
    // 방향 락(첫 의미있는 이동으로 결정) — 세로 우세면 닫기 드래그 아님(무시)
    if (!d.lock && Math.abs(dx) + Math.abs(dy) > 6) d.lock = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
    if (d.lock === 'y') return
    const now = e.timeStamp
    const dt = now - d.lastT
    if (dt > 0) d.vx = (t.clientX - d.lastX) / dt
    d.lastX = t.clientX
    d.lastT = now
    const panel = navPanelRef.current
    const w = panel ? panel.offsetWidth : window.innerWidth
    // 좌→우(dx>0)만 따라옴. 우→좌(dx<0)는 이미 열린 상태라 무시(0 고정).
    const clamped = Math.max(0, dx)
    d.dx = clamped
    if (panel) {
      panel.style.transition = 'none'
      panel.style.transform = `translateX(${clamped}px)`
    }
    if (navScrimRef.current) navScrimRef.current.style.opacity = String(Math.max(0, 1 - clamped / w))
  }
  function onNavTouchEnd() {
    const d = navDrag.current
    if (!d.active) return
    d.active = false
    const panel = navPanelRef.current
    const w = panel ? panel.offsetWidth : window.innerWidth
    const shouldClose = d.dx > w * 0.3 || d.vx > 0.5 // 30% 이상 또는 우향 플릭 → 닫기
    // 인라인 스타일 제거 → CSS(.is-open 유무)가 최종 위치 전환 애니메이션을 이어받음(부드러운 닫힘/복귀)
    if (panel) {
      panel.style.transition = ''
      panel.style.transform = ''
    }
    if (navScrimRef.current) navScrimRef.current.style.opacity = ''
    if (shouldClose) setMenuOpen(false)
  }

  // 모바일 메뉴: ESC 로 닫기 + 열렸을 때 데스크탑 폭으로 리사이즈되면 자동 닫힘(게이지로 전환).
  useEffect(() => {
    menuOpenRef.current = menuOpen // 배경 네비(휠/터치) 가드 동기화
    // 메뉴 열림/닫힘에 따른 스크롤바 토글 리플로우로 진행도 상태(--inv·is-page-2)가 어긋날 수 있으므로
    // 매 토글 후 실제 scrollTop 기준으로 재동기화(특히 닫힘 시 — 콘텐츠 리빌/테마 고착 방지).
    // effect 는 className 커밋 후 실행 → computeTarget 의 offsetTop 읽기가 최신 레이아웃을 강제 동기화하므로 즉시 호출.
    resyncRef.current?.()
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    const onResize = () => {
      if (window.innerWidth > 768) setMenuOpen(false)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', onResize)
    }
  }, [menuOpen])

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
    <div
      className={`main1${IS_ANDROID ? ' is-android' : ''}${menuOpen ? ' is-nav-open' : ''}`}
      ref={scrollRef}
    >
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
        {/* 햄버거 — 모바일/작은 태블릿(≤768)에서만 노출. 누르면 풀스크린 메뉴가 우→좌로 슬라이드 인. */}
        <button
          className="main1__menu"
          type="button"
          aria-label="메뉴 열기"
          aria-expanded={menuOpen}
          aria-controls="main1-nav"
          onClick={() => setMenuOpen(true)}
        >
          <span />
          <span />
        </button>
      </header>

      {/* ── 데스크탑/큰 태블릿(≥769): 우측 중앙 세로 슬라이더 게이지 ──
          현재 페이지 = 채워진 동그라미, 연결 = 선. 영역 클릭 시 현재 페이지 기준으로 자연스럽게 이동
          (1→3·3→1 도 중간 섹션을 거쳐 흐름). 색은 --p 로 테마(다크↔라이트) 따라 가독성 유지. */}
      <nav className="main1__gauge" aria-label="페이지 네비게이션" style={{ ['--seg' as string]: page }}>
        {[
          { i: 0, label: 'Main' },
          { i: 1, label: 'Profile' },
          { i: 2, label: 'works' },
        ].map((s) => (
          <button
            key={s.i}
            type="button"
            className={`main1__gauge-dot${page === s.i ? ' is-active' : ''}`}
            aria-label={`${s.label} 섹션으로 이동`}
            aria-current={page === s.i ? 'true' : undefined}
            onClick={() => scrollToSection(s.i)}
          >
            <span className="main1__gauge-mark" />
            <span className="main1__gauge-tip">{s.label}</span>
          </button>
        ))}
      </nav>

      {/* ── 모바일/작은 태블릿(≤768): 풀스크린 슬라이드 메뉴(우→좌) ──
          Main / Profile / works. 현재 페이지 활성 표시 + 호버 효과. 항목 클릭 → 해당 섹션 이동 후 닫힘. */}
      <div
        id="main1-nav"
        className={`main1__nav${menuOpen ? ' is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        aria-hidden={!menuOpen}
      >
        <div className="main1__nav-scrim" ref={navScrimRef} onClick={() => setMenuOpen(false)} />
        <div
          className="main1__nav-panel"
          ref={navPanelRef}
          onTouchStart={onNavTouchStart}
          onTouchMove={onNavTouchMove}
          onTouchEnd={onNavTouchEnd}
          onTouchCancel={onNavTouchEnd}
        >
          <button
            type="button"
            className="main1__nav-close"
            aria-label="메뉴 닫기"
            onClick={() => setMenuOpen(false)}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M6 6 L18 18 M18 6 L6 18"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <ul className="main1__nav-list">
            {[
              { i: 0, label: 'Main' },
              { i: 1, label: 'Profile' },
              { i: 2, label: 'works' },
            ].map((s, k) => (
              <li key={s.i} style={{ ['--k' as string]: k }}>
                <button
                  type="button"
                  className={`main1__nav-link${page === s.i ? ' is-active' : ''}`}
                  aria-current={page === s.i ? 'true' : undefined}
                  onClick={() => {
                    setMenuOpen(false)
                    scrollToSection(s.i)
                  }}
                >
                  <span className="main1__nav-num">{`0${s.i + 1}`}</span>
                  <span className="main1__nav-label">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>

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
        {/* 인플로우 섹션 타이틀(// works 프로젝트) — 섹션과 함께 자연 스크롤.
            ⚠️ 배경/패널 영역은 2P(resume)와 '동일 구조' 사용 — inner 에 seg__inner--resume(공유 폭/패널)를
            그대로 부여해 2P 의 확정된 프로스트 패널·폭을 그대로 상속(3P 전용 배경 코드 없음). */}
        <div className="seg__inner seg__inner--resume">
          <div className="seg__head">
            <p className="seg__eyebrow">// works</p>
            <h2 className="seg__title">프로젝트</h2>
          </div>
          <div className="seg__fade">
          {/* 타임라인 — 세로 스파인(선)+노드(점), 년도별 그룹. 점 선택 시 커버·상세가 펼쳐짐.
              page/menuOpen 전달 → 도착·오버레이 해제마다 진입 재생(2P 처럼). */}
          <WorksTimeline page={page} menuOpen={menuOpen} />
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
