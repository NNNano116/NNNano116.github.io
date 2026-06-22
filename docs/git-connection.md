# Git 연동 현황 (정본 · 실제 상태)

> 이 프로젝트에 **실제로 연결된** git/GitHub 연동 상태의 단일 출처(SSOT).
> 규약·절차·보안 원칙은 [`git-setup.md`](./git-setup.md)(허브 **C** 정본)에 있고, **이 문서는 그 규약이 적용된 결과(현황)** 만 기록한다.
> ⚠️ 이 문서는 **PUBLIC 레포에 커밋**된다 → 비밀번호·PAT 등 **비밀값은 절대 기재하지 않는다**(계정명·레포 URL·noreply 이메일은 공개 정보).

**최종 갱신**: 2026-06-22

---

## 1. 연동 요약

| 항목 | 값 |
|------|-----|
| GitHub 계정 | `NNNano116` |
| 저장소 | **`nano-portfolio`** (이전명 `ppp` → rename, GitHub 자동 리다이렉트) |
| 저장소 URL | https://github.com/NNNano116/nano-portfolio |
| 가시성 | **PUBLIC** |
| 저장소 모델 | **프로젝트 페이지** ([`git-setup.md §1`](./git-setup.md)) |
| 기본 브랜치 | `main` (`origin/main` 추적) |
| 원격(`origin`) | `https://github.com/NNNano116/nano-portfolio.git` |
| 배포 URL | **`https://NNNano116.github.io/nano-portfolio/`** ✅ 라이브(HTTP 200) |
| `base` | `'/nano-portfolio/'` 적용됨 (`vite.config.ts`) → 허브 **B** [`deploy.md`](./deploy.md) |
| Pages | **활성화됨** — Source `GitHub Actions`(`build_type=workflow`), HTTPS 강제. 첫 배포 성공(2026-06-22) |
| 첫 커밋 | `9be5131` (허브 문서 + git/.env 규약 초기 커밋) |

## 2. 인증 방식 (현행)

- **채택: `gh` CLI 인증** — `gh auth login -h github.com -w`(웹 브라우저 디바이스 플로우)로 로그인.
  토큰은 **OS keyring** 에 보관되어 파일에 남지 않는다([`git-setup.md §3`](./git-setup.md) 1순위 권장 방식).
- 활성 계정: `NNNano116` (keyring) / **토큰 스코프**: `repo`, `read:org`, `gist`, **`workflow`**.
  (`workflow` 는 `.github/workflows/*` 푸시에 필요 — `gh auth refresh -h github.com -s workflow` 로 2026-06-22 추가.)
- `.env` 의 `GITHUB_TOKEN` 은 **비워둠** — 푸시 인증을 gh 가 담당하므로 PAT 불필요(백업이 필요할 때만 fine-grained 최소권한 토큰을 채운다).

> 재인증이 필요하면: `gh auth login -h github.com -w` → 표시된 코드를 https://github.com/login/device 에 입력.

## 3. 로컬 git 설정 (현행)

| 설정 | 값 |
|------|-----|
| `user.name` | `NNNano116` |
| `user.email` | `237364871+NNNano116@users.noreply.github.com` (GitHub **noreply** — 개인 이메일 비노출) |

> 커밋 이메일을 개인 이메일로 바꾸려면 `git config user.email <메일>` 한 줄. noreply 형식은 `<userid>+<login>@users.noreply.github.com`.

## 4. `.env` 실제 키 (로컬 전용 · 미추적)

루트 `.env` 에 채워진 값(파일 자체는 `.gitignore` 로 **추적 제외**, 템플릿은 [`.env.example`](../.env.example)):

| 키 | 현재 값 | 비밀 여부 |
|----|---------|-----------|
| `GIT_USER_NAME` | `NNNano116` | 공개 |
| `GIT_USER_EMAIL` | `237364871+NNNano116@users.noreply.github.com` | 공개(noreply) |
| `GITHUB_USERNAME` | `NNNano116` | 공개 |
| `GITHUB_TOKEN` | *(비움 — gh keyring 사용)* | 비밀(채울 경우) |
| `GIT_REMOTE_URL` | `https://github.com/NNNano116/nano-portfolio.git` | 공개 |

## 5. 재현 / 검증 명령

```bash
# 연동 상태 확인
gh auth status                 # NNNano116 (keyring), Active
git remote -v                  # origin → .../nano-portfolio.git
git branch -vv                 # main [origin/main]
gh repo view NNNano116/nano-portfolio --json name,visibility,url

# .env 미추적 검증 (출력 없어야 정상)
git ls-files | grep -E "^\.env$"
```

## 6. 변경 시 갱신 규칙 (SSOT 유지)

- **레포명 변경**: GitHub Settings → rename 후 `git remote set-url origin <새 URL>` + `.env` 의 `GIT_REMOTE_URL` + 본 문서 §1 갱신. (GitHub 가 구 URL 자동 리다이렉트)
- **계정/이메일 변경**: `git config user.*` + `.env` + 본 문서 §3·§4 갱신.
- **배포 셋업 시**: `base:'/nano-portfolio/'` 적용은 허브 **B** [`deploy.md`](./deploy.md) 에서 처리(여기서 값만 참조).
- 규약 자체(원칙·보안)는 [`git-setup.md`](./git-setup.md) 에만 두고, 본 문서는 **현황 값**만 둔다(중복 금지).

## 7. 체크리스트 (현 상태)

- [x] `.env` 가 `.gitignore` 에 포함·**미추적** (원격에 비밀 없음)
- [x] PAT 를 원격 URL·코드·`dist/` 에 박지 않음 (gh keyring 사용)
- [x] `.env.example` 은 키 이름만(값 없음) 추적
- [x] 첫 커밋·푸시 완료, `main` ↔ `origin/main` 추적
- [x] **GitHub Pages 활성화 + 첫 배포 성공** (Actions `deploy.yml`, `GITHUB_TOKEN` 자동) → 허브 **B**

## 8. 정본 / 연계

- 규약·원칙(상위): [`git-setup.md`](./git-setup.md) · 허브: [`guide/_hub_git.md`](./guide/_hub_git.md)
- 배포 연계: [`deploy.md`](./deploy.md) (허브 **B**) — `base`·Actions Secrets
- 보안 메모: 초기 셋업 중 공유된 계정 비밀번호는 **사용·저장하지 않았으며**, 노출되었으므로 **비밀번호 변경 권장**.
