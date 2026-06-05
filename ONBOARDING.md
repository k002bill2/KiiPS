# KiiPS 신규 개발자 — Claude Code 환경 셋업 (1페이지)

> 이 저장소를 받은 새 팀원이 Claude Code 개발 환경을 한 번에 갖추기 위한 안내문입니다.
> 자세한 설계/원리는 [.claude/docs/claude-env-migration.md](.claude/docs/claude-env-migration.md) 참조.

## TL;DR — 한 줄로 시작

```bash
git clone <이-저장소-private-url>/KiiPS && bash KiiPS/.claude/scripts/setup.sh
```

`setup.sh` 가 글로벌 설정(메모리·플러그인 설정·커맨드·경로 보정)을 `~/.claude/` 로 자동 설치합니다.
끝에 `✅ setup self-verify 통과` 가 나오면 핵심 설치는 완료입니다.

---

## 0. 사전 준비 (셋업 전 1회)

macOS 기준. 아래 도구가 PATH 에 있어야 훅/LSP 가 동작합니다.

```bash
# Homebrew (없으면 먼저 설치) — setup.sh 가 brew 로 경로를 보정합니다
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install jq sass openjdk maven subversion jdtls
# Java 8 (KiiPS 빌드용) — 사내 표준 JDK 설치 경로를 따르세요
# Node 는 nvm 권장:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
```

옵시디언 MCP 를 쓰면 `~/.zshrc` 에:
```bash
export OBSIDIAN_VAULT_PATH="<옵시디언 vault 경로>"
```

> 도구를 자동 설치하려면: `bash KiiPS/.claude/scripts/setup.sh --install-tools`

---

## 1. 셋업 실행

```bash
git clone <private-url>/KiiPS
cd KiiPS
bash .claude/scripts/setup.sh        # 또는 --install-tools
```

setup.sh 가 자동 처리하는 것:
- ✅ 메모리 22개를 `~/.claude/projects/<당신PC-경로>/memory` 로 (사용자명 자동 보정)
- ✅ 글로벌 `settings.json` 에 플러그인/언어/모델 설정 **병합**(기존 개인설정 보존)
- ✅ statusLine·jdtls·openjdk·JDK8 경로를 **당신 PC 기준으로 보정**
- ✅ 외부 도구 진단 (❌ 표시된 건 설치 필요)

---

## 2. 셋업 후 마무리 (2가지)

1. **플러그인 본체 재설치** — Claude Code 안에서:
   ```
   /plugin
   ```
   목록은 `.claude/_global-seed/plugins-to-install.json` 참고.
   > ⚠️ 재설치 전까지 플러그인이 "활성화됐는데 본체 없음"으로 보일 수 있습니다 — **정상입니다.**

2. **Claude Code 재시작** → 시작 시 SessionStart 훅이 에러 없이 통과하는지 확인.

---

## 3. 동작 확인 체크리스트

- [ ] `setup.sh` 끝에 `✅ setup self-verify 통과`
- [ ] Claude Code 재시작 시 빨간 훅 에러 없음
- [ ] `.scss` 파일 편집 → SCSS 검증 동작 (`sass` 필요)
- [ ] `.java` 파일 열기 → Java LSP(jdtls) 동작
- [ ] 메모리 로드됨 (이전 작업 맥락이 인식됨)

---

## 4. 문제 해결

| 증상 | 원인 / 조치 |
|------|------------|
| `❌ _global-seed 없음` | clone 이 불완전. `git pull` 로 최신화 후 재실행 |
| Java LSP 안 됨 | `jdtls`/`openjdk` 미설치. `brew install jdtls openjdk` 후 setup 재실행 |
| 메모리 안 보임 (한글 사용자명 PC) | `ls ~/.claude/projects/` 로 실제 디렉토리명 확인 → 팀에 문의 (PROJ_KEY 보정) |
| obsidian MCP 실패 | `~/.zshrc` 에 `OBSIDIAN_VAULT_PATH` export 누락 |
| gemini 관련 메시지 | 무시 가능 (2026-06-18 sunset 예정, 치명적 아님) |
| 빌드/DB 연결 안 됨 | OCI 사설망 접근은 **PCAssist 실행** 필요 (코드 의심 전 먼저 확인) |

---

setup.sh 는 **멱등**합니다 — 막히면 도구 설치 후 그냥 다시 실행하세요. 안전합니다.
막히는 단계의 출력 화면을 팀에 공유하면 빠르게 도와드립니다.
