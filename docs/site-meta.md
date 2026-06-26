# 사이트 헤더·메타데이터·파비콘 (site-meta) ✅

> `index.html` `<head>` 의 페이지명·메타 설명·OG/Twitter 카드·테마컬러와
> `public/favicon.svg`(J·Y 글라스 원형)를 다루는 정본. (2026-06-26 확정)
> 대분류 **A. 로컬 개발** 진입: [`_hub_dev.md`](./guide/_hub_dev.md). 배포 경로 함정은 **B** 연계(§5).

---

## 1. 확정 값 (SSOT)

| 항목 | 값 |
|------|-----|
| 페이지명 `<title>` | `J·Young portfolio` |
| `<html lang>` | `ko` |
| 메타 설명 / OG / Twitter description | `안녕하세요, 4년차 백엔드 개발자 김준영입니다. 잘부탁드립니다.` |
| author | `김준영 (J·Young)` |
| 파비콘 | `public/favicon.svg` — **J·Y 글라스 원형** |
| theme-color (light) | `#e9eff7` (글라스 블루) |
| theme-color (dark) | `#0d181f` (히어로 네이비) |
| 배포 URL(OG `og:url`) | `https://nnnano116.github.io/nano-portfolio/` |

> 위 문구·값을 바꾸려면 **이 표를 먼저 갱신**한 뒤 `index.html` 을 수정한다(SSOT 원칙, CLAUDE.md §4-4).

---

## 2. 파비콘 — J·Y 글라스 원형 (`public/favicon.svg`)

페이지 글라스 패널과 **동일 톤**으로 디자인한 원형 워드마크. 구성 레이어:

1. **글라스 본체** — `radialGradient #glass`: 흰색(0.95) → 연블루 `#eaf0fb`(0.78) → `#d7e0f0`(0.62). 반투명 유리감.
2. **컬러 글로우** — `#tintA`(블루 `#4a86de`, 좌상) + `#tintB`(퍼플 `#9676e0`, 우하). 본문 배경의 블루↔퍼플 그라데이션/레이저 반사 느낌.
3. **유리 림(이중)** — 외곽 `#ring`(흰↔연회색 그라데이션 1.5px) + 내부 흰색 0.35 하이라이트 림.
4. **상단 반사 하이라이트** — 흰색 0.5 타원(반사광).
5. **워드마크 `J·Y`** — `#text` 그라데이션(블루 `#3f6fd1` → 퍼플 `#7d54d6`), `font-weight:700`, system-ui. 16px 탭 아이콘에서도 읽히게 굵게.

- 뷰박스 `0 0 64 64`. `xml.dom.minidom` 유효성 검증 통과.
- 색 토큰은 본문 라이트 글라스(`Main1.css` `--bg--light` 의 `rgba(74,134,222)`·`rgba(150,118,224)`)와 맞춤 → 톤 변경 시 함께 점검.

---

## 3. `<head>` 메타 구성

| 그룹 | 태그 | 비고 |
|------|------|------|
| 파비콘 | `icon`(svg) · `apple-touch-icon` · `mask-icon`(color `#4a86de`) | 셋 다 `favicon.svg` 재사용 |
| 기본 | `title` · `description` · `author` · `keywords` | §1 값 |
| 테마 | `theme-color`×2(light/dark `media`) · `color-scheme` | 1P 다크 ↔ 3P 라이트 분기와 정합 |
| Open Graph | `og:type/site_name/title/description/url/image/locale(ko_KR)` | 카카오톡·슬랙·페북 미리보기 |
| Twitter | `twitter:card(summary)/title/description/image` | |

---

## 4. 배포 경로 주의 (base 연계)

- `vite.config.ts` `base:'/nano-portfolio/'` 이므로 **빌드 시 Vite 가 `index.html` 내 `/favicon.svg` → `/nano-portfolio/favicon.svg` 로 자동 재작성**한다. → `<link>` 의 루트 절대경로는 그대로 두면 됨(CLAUDE.md §1-4 정합).
- 단, **OG/Twitter 의 `og:image`·`og:url` 은 절대 URL 직접 기입**(`https://nnnano116.github.io/nano-portfolio/...`) — 크롤러는 base 재작성을 못 받으므로 풀 URL 필수.
- 개발 서버 확인 시 `http://localhost:<port>/nano-portfolio/favicon.svg` (base 경로 포함).

---

## 5. 확인사항 / 한계

- [x] 페이지명·메타 문구·파비콘 반영, dev 서버 파비콘 200 응답·SVG 유효성 확인.
- [ ] **`og:image` 가 현재 SVG** — 카카오톡 등 일부 플랫폼은 SVG 미리보기 미지원. 정식 공유 미리보기가 필요하면 **1200×630 PNG OG 이미지**를 별도 제작해 교체(후속).
- [ ] 문구·톤 변경 시 §1 표 → `index.html` → (톤이면) `favicon.svg` 순으로 갱신.

---

## 6. 정본 / 소스

- 소스: `index.html`, `public/favicon.svg`, `vite.config.ts`(base)
- 연계: 배포 base/404 → [`deploy.md`](./deploy.md) · 본문 글라스 톤 → [`main1-scroll-interactions.md`](./main1-scroll-interactions.md)
