# KiiPS Claude Code 환경 이전 가이드 (git-seed 방식)

> 새 직원 PC로 KiiPS Claude Code 환경을 옮기는 절차.
> **전제: 저장소가 PRIVATE** (메모리·내부 인프라 정보가 git-seed 에 포함되므로).
> 자동화: `.claude/scripts/seed-global.sh`(원본) + `setup.sh`(대상) + `selftest-setup.sh`(검증).

## 왜 git-seed 인가 (번들 방식 대비)

`.claude/`는 이미 git 관리(236파일, `github.com:k002bill2/KiiPS`)이므로 새 직원은 **`git clone`만으로 프로젝트 층 전체**(훅·스킬·에이전트·커맨드·rules·scripts)를 받는다. 따라서 자동화의 진짜 대상은 git 으로 안 따라오는 **글로벌 비-git 층**뿐이다:

| 층 | 위치 | git clone 으로? | 처리 |
|----|------|:---:|------|
| 프로젝트 로컬 | `<프로젝트>/.claude/` | ✅ | clone 이 제공 |
| 글로벌 | `~/.claude/{projects/*/memory, settings, commands, agents, output-styles}` | ❌ | **`_global-seed/` 로 커밋 → setup.sh 가 설치** |
| 외부 도구 | `$PATH`, `~/.zshrc` | ❌ | setup.sh 진단 + 안내 |

핵심: 글로벌 층을 저장소 안 `.claude/_global-seed/` 에 커밋해 두면 `git clone`이 그것까지 가져오고, `setup.sh`가 새 PC의 `~/.claude/`로 설치한다. **tarball 번들 불필요, 부트스트랩 1줄.**

> ⚠️ **PRIVATE 필수**: `_global-seed/memory/` 에는 OCI 사설 IP·DB 스키마 등 내부 인프라 정보가 포함된다. 저장소가 PUBLIC 이면 절대 커밋 금지. (2026-06-05 기준 private 전환 완료)

## 절차

### 1) 원본 PC — seed 추출 (1회, 또는 글로벌 설정 변경 시 갱신)
```bash
cd <프로젝트루트>
bash .claude/scripts/seed-global.sh        # → .claude/_global-seed/ 생성
bash .claude/scripts/selftest-setup.sh     # → PASS=13 FAIL=0 확인 (계약 검증)
git add .claude/_global-seed .claude/scripts/{seed-global,setup,selftest-setup}.sh
git commit -m "chore(onboarding): git-seed 환경 이전 자동화"
git push
```
seed 구성(48파일): `memory/`(22), `global/{commands,agents,output-styles,awesome-statusline.sh}`, `global-settings.overlay.json`(안전한 5키), `plugins-to-install.json`, `MANIFEST.txt`.

### 2) 새 직원 PC — 1줄 부트스트랩
```bash
git clone <private-url>/KiiPS && bash KiiPS/.claude/scripts/setup.sh
```
`--install-tools` 플래그로 brew 누락도구 자동설치 시도, `--no-zshrc` 로 zshrc 안내 생략.

setup.sh 자동 처리:
- 메모리 → `~/.claude/projects/<새PC 재계산 PROJ_KEY>/memory` (사용자명 자동 보정)
- 글로벌 settings 에 안전한 5키 overlay 병합 (기존 개인설정 비파괴, F6/F7)
- statusLine 스크립트 설치 + 경로 `$HOME` 보정
- jdtls/openjdk/JDK8 경로를 `brew --prefix`·`java_home` 으로 동적 보정 (brew 부재 시 가드, F3)
- settings.local.json serena dead-entry 제거
- 외부 도구 진단 (gemini 는 sunset 예정 → warn, 나머지 누락 ❌ 비치명적)
- self-verify (실패 시 exit 1)

### 3) 새 직원 — 남은 수동 작업 (setup.sh 가 안내)
1. 플러그인 본체 재설치: Claude Code 에서 `/plugin` (목록: `_global-seed/plugins-to-install.json`)
2. 미설치 ❌ 도구: `brew install jq sass` / `nvm install --lts` 등
3. `~/.zshrc` 에 `export OBSIDIAN_VAULT_PATH="..."` 후 `source ~/.zshrc`
4. Claude Code 재시작 → SessionStart 훅 통과 확인

## 설계에 반영된 검증 결과 (워크플로 감사 + 인라인 실측)

| 항목 | 처리 |
|------|------|
| **F1** PROJ_KEY 비ASCII 발산 | `sed 's#/#-#g'` → `sed -E 's/[^A-Za-z0-9]/-/g'`. ASCII 실측 일치. 비ASCII는 loud guard(잔여 리스크) |
| **F3** 머신 경로 하드코딩 | brew prefix·java_home 동적 보정 (Apple Silicon=no-op, Intel만 재작성) |
| **F6** jq merge truncation | tmp+mv, 배열 overlay 제외 → 사용자 `permissions.allow` 보존 |
| **F7** 위험 권한 플래그 전파 | overlay = 안전한 5키만 (`skipDangerousModePermissionPrompt` 등 제외, leak-guard 검증) |
| **brew 닭-달걀** | `command -v brew` 가드 — Homebrew 없는 새 Mac 에서 즉사 방지 |
| **gemini hard-throw** | `gemini-bridge.js:435` throw 하나 `settings.json:114` `|| true` 가 훅경계에서 흡수 → noisy-but-safe. sunset(2026-06-18) 임박 |
| **멱등성** | 2회 실행 byte-identical 실측 (selftest G/H/I) |

## 알려진 함정 / 잔여 결정

- **비ASCII 경로 직원**(한글 사용자명 등): PROJ_KEY 가 Claude Code 실제(Node code-point) 규칙과 미검증. 첫 Claude 실행 후 `ls ~/.claude/projects/` 로 실제 키 확인, 불일치 시 메모리 디렉토리명 수동 보정.
- **gemini sunset(2026-06-18)**: Stop 훅의 gemini 리뷰 트리거는 `|| true` 로 보호되나, 근본 제거는 antigravity 전환(`project_antigravity_migration`)에서.
- **export-claude-env.sh / import-claude-env.sh** (tarball 방식): git-seed 로 대체됨. 제거 가능(중복). private 전환 전 임시 수단이었음.
- **settings.local.json git-tracked**: private 전환으로 노출 위험 해소. serena dead-entry 는 setup.sh 가 strip. 더 근본적으로는 `.gitignore` 이관 가능(선택).
