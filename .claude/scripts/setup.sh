#!/usr/bin/env bash
#
# setup.sh — [새 직원 PC] git clone 후 단일 진입점. 글로벌 비-git 층을 ~/.claude/ 로 설치.
#
# 부트스트랩:  git clone <private-url>/KiiPS && bash KiiPS/.claude/scripts/setup.sh
#
# 책임:
#   1) 메모리 → ~/.claude/projects/<새PC 재계산 PROJ_KEY>/memory   (사용자명 자동 보정)
#   2) 글로벌 commands/agents/output-styles 설치
#   3) 글로벌 settings.json 에 안전한 5키 overlay 병합 (clobber 금지)
#   4) statusLine 스크립트 설치 + 경로를 $HOME 기준으로
#   5) 머신 종속 경로 sanitize (jdtls/openjdk/JDK8 — brew prefix 동적, brew 부재 시 가드)
#   6) settings.local.json 머신별 serena dead-entry 제거
#   7) 외부 도구 진단 (누락은 ❌ 비치명적)
#   8) self-verify (실패 시 exit 1)
#
# 플래그: --install-tools (brew/누락도구 설치 시도)   --no-zshrc (zshrc 자동편집 안내 생략)
# 멱등: N회 재실행 동일 결과 (rsync --delete 없음, jq 상수 overlay, 가드된 조건부 패치).
#
set -uo pipefail   # set -e 제외: 진단 단계가 의도적으로 비0 종료를 다룸

INSTALL_TOOLS=0; NO_ZSHRC=0
for a in "$@"; do case "$a" in
  --install-tools) INSTALL_TOOLS=1 ;;
  --no-zshrc) NO_ZSHRC=1 ;;
esac; done

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
GLOBAL_DIR="$HOME/.claude"
SEED="$PROJECT_DIR/.claude/_global-seed"
PS="$PROJECT_DIR/.claude/settings.json"
LS="$PROJECT_DIR/.claude/settings.local.json"

mktmp() { mktemp "${TMPDIR:-/tmp}/setup.XXXXXX"; }   # 샌드박스 안전(prefix 명시)

[ -d "$SEED" ] || { echo "❌ _global-seed 없음 — git clone 불완전이거나 seed-global.sh 미실행"; exit 1; }

# PROJ_KEY: 비영숫자 → '-' (F1). 새 PC 사용자명/경로 기준 재계산 = 자동 보정.
PROJ_KEY="$(printf '%s' "$PROJECT_DIR" | sed -E 's/[^A-Za-z0-9]/-/g')"
MEM_DST="$GLOBAL_DIR/projects/$PROJ_KEY/memory"

echo "▶ 프로젝트:  $PROJECT_DIR"
echo "▶ PROJ_KEY:  $PROJ_KEY"
# 비ASCII 경로 경고 (Node code-point 규칙과 미검증 — loud guard)
case "$PROJECT_DIR" in
  *[!\ -~]*) echo "  ⚠ 경로에 비ASCII 문자 포함 — 메모리 키가 Claude Code 실제 키와 어긋날 수 있음."
             echo "    Claude 최초 실행 후 'ls ~/.claude/projects/' 로 실제 키 확인하고 불일치 시 알려주세요." ;;
esac

# ── 1. 메모리 ───────────────────────────────────────────────────────────────
mkdir -p "$MEM_DST"
rsync -a "$SEED/memory/" "$MEM_DST/"   # --delete 금지: 직원 로컬 추가 메모리 보존
echo "▶ [1/8] 메모리 $(ls "$MEM_DST"/*.md 2>/dev/null | wc -l | tr -d ' ')개 → $MEM_DST"

# ── 2. 글로벌 사람작성 자산 ─────────────────────────────────────────────────
for d in commands agents output-styles; do
  [ -d "$SEED/global/$d" ] && rsync -a "$SEED/global/$d/" "$GLOBAL_DIR/$d/"
done
echo "▶ [2/8] 글로벌 commands/agents/output-styles 설치"

# ── 3. 글로벌 settings overlay 병합 (F6: tmp+mv, clobber 금지) ───────────────
S="$GLOBAL_DIR/settings.json"
[ -f "$S" ] || echo '{}' > "$S"
if [ -f "$SEED/global-settings.overlay.json" ]; then
  t="$(mktmp)"
  # base(.[0]=새PC 기존) * overlay(.[1]) → overlay-wins deep-merge.
  # overlay 는 객체맵 5키뿐(배열 없음) → permissions.allow 등 사용자 배열 안전.
  jq -s '.[0] * .[1]' "$S" "$SEED/global-settings.overlay.json" > "$t" && mv "$t" "$S"
  echo "▶ [3/8] 글로벌 settings overlay 병합 (5키, 기존 설정 보존)"
fi

# ── 4. statusLine 스크립트 설치 + $HOME 경로 ────────────────────────────────
if [ -f "$SEED/global/awesome-statusline.sh" ]; then
  cp "$SEED/global/awesome-statusline.sh" "$GLOBAL_DIR/awesome-statusline.sh"
  chmod +x "$GLOBAL_DIR/awesome-statusline.sh"
  t="$(mktmp)"
  jq --arg c "bash $HOME/.claude/awesome-statusline.sh" \
     '.statusLine = {type:"command", command:$c}' "$S" > "$t" && mv "$t" "$S"
  echo "▶ [4/8] statusLine 설치 + 경로 $HOME 보정"
fi

# ── 5. 프로젝트 settings.json 머신경로 sanitize (brew 가드 — F3/brew 닭달걀) ─
if [ -f "$PS" ] && command -v jq >/dev/null 2>&1; then
  if command -v brew >/dev/null 2>&1; then
    B="$(brew --prefix 2>/dev/null || echo /opt/homebrew)"
    OJ="$(brew --prefix openjdk 2>/dev/null || echo "$B/opt/openjdk")"
    CUR="$(jq -r '.lsp.java.command // ""' "$PS" 2>/dev/null)"
    if [ -n "$CUR" ] && [ "$CUR" != "$B/bin/jdtls" ]; then
      t="$(mktmp)"
      jq --arg b "$B" --arg oj "$OJ" \
        '.lsp.java.command = ($b+"/bin/jdtls") | .lsp.java.home = ($oj+"/libexec/openjdk.jdk/Contents/Home")' \
        "$PS" > "$t" && mv "$t" "$PS"
      echo "▶ [5/8] jdtls/openjdk 경로를 brew prefix($B) 기준으로 보정"
    else
      echo "▶ [5/8] jdtls 경로 이미 정상 (Apple Silicon no-op)"
    fi
  else
    echo "▶ [5/8] ⚠ Homebrew 미설치 — Java LSP 경로 보정 생략. brew 설치 후 재실행 권장."
  fi
  # JDK 1.8 런타임 경로 (brew 무관, java_home 탐지)
  JH="$(/usr/libexec/java_home -v 1.8 2>/dev/null || true)"
  if [ -n "$JH" ]; then
    t="$(mktmp)"
    jq --arg p "$JH" '(.lsp.java.configuration.runtimes[]? | select(.name=="JavaSE-1.8") | .path) = $p' "$PS" > "$t" 2>/dev/null && mv "$t" "$PS" || rm -f "$t"
  else
    echo "       ⚠ JDK 1.8 미발견 — JavaSE-1.8 path 수동 확인 필요"
  fi
fi

# ── 6. settings.local.json serena dead-entry 제거 (멱등 select-filter) ───────
if [ -f "$LS" ] && command -v jq >/dev/null 2>&1; then
  t="$(mktmp)"
  jq '(.permissions.allow) |= (map(select(test("cache/uv/archive.*serena")|not)))' "$LS" > "$t" 2>/dev/null && mv "$t" "$LS" || rm -f "$t"
  echo "▶ [6/8] settings.local.json serena dead-entry 제거"
fi

# ── 7. 외부 도구 진단 ───────────────────────────────────────────────────────
echo "▶ [7/8] 외부 도구 진단"
MISS=0
for tool in node python3 jq sass jdtls mvn java svn; do
  if command -v "$tool" >/dev/null 2>&1; then
    printf '  ✅ %-8s %s\n' "$tool" "$(command -v "$tool")"
  else
    printf '  ❌ %-8s 미설치\n' "$tool"; MISS=$((MISS+1))
  fi
done
if [ "$INSTALL_TOOLS" = 1 ] && command -v brew >/dev/null 2>&1; then
  for tool in jq sass; do command -v "$tool" >/dev/null 2>&1 || brew install "$tool"; done
fi
if [ -z "${OBSIDIAN_VAULT_PATH:-}" ]; then
  echo "  ❌ OBSIDIAN_VAULT_PATH 미설정 — obsidian MCP 작동 안 함"
  [ "$NO_ZSHRC" != 1 ] && echo "     제안: echo 'export OBSIDIAN_VAULT_PATH=\"<vault 경로>\"' >> ~/.zshrc && source ~/.zshrc"
fi

# ── 8. self-verify (증거 기반 완료 — seed 실제 개수 대비, 부분복사 탐지) ─────
echo "▶ [8/8] self-verify"
ERR=0
# 메모리: 배치본 ≥ seed본 (부분복사면 실패). rsync 비파괴라 직원 로컬 추가본은 허용.
SEED_MEM="$(ls "$SEED/memory"/*.md 2>/dev/null | wc -l | tr -d ' ')"
HAVE_MEM="$(ls "$MEM_DST"/*.md 2>/dev/null | wc -l | tr -d ' ')"
if [ "$SEED_MEM" -gt 0 ] && [ "$HAVE_MEM" -ge "$SEED_MEM" ]; then :; else echo "  ✗ 메모리 배치 불완전 ($HAVE_MEM/$SEED_MEM)"; ERR=1; fi
# enabledPlugins: 병합본 ≥ seed overlay 개수 (병합 절반실패 탐지)
SEED_PL="$(jq '(.enabledPlugins // {}) | length' "$SEED/global-settings.overlay.json" 2>/dev/null || echo 0)"
HAVE_PL="$(jq '(.enabledPlugins // {}) | length' "$S" 2>/dev/null || echo 0)"
[ "$HAVE_PL" -ge "$SEED_PL" ] || { echo "  ✗ enabledPlugins 병합 불완전 ($HAVE_PL/$SEED_PL)"; ERR=1; }
# overlay 스칼라 키가 실제 병합됐는지 (language/advisorModel 표본)
jq -e '.advisorModel and .language' "$S" >/dev/null 2>&1 || { echo "  ✗ overlay 스칼라 병합 실패"; ERR=1; }
if [ -f "$LS" ]; then
  jq -e '[.permissions.allow[]? | select(test("cache/uv/archive.*serena"))] | length == 0' "$LS" >/dev/null 2>&1 || { echo "  ✗ serena dead-entry 잔존"; ERR=1; }
fi
if [ "$ERR" = 0 ]; then
  echo "  ✅ self-verify 통과"
else
  echo "❌ self-verify 실패"; exit 1
fi

echo ""
echo "✅ setup 완료. 남은 수동 작업:"
echo "  1) 플러그인 본체 재설치: Claude Code 에서 /plugin (목록: $SEED/plugins-to-install.json)"
echo "  2) 미설치 ❌ 도구 설치: brew install jq sass / nvm install --lts 등"
[ "$MISS" -gt 0 ] && echo "     (이번 실행에서 $MISS개 누락)"
echo "  3) Claude Code 재시작 → SessionStart 훅 통과 확인"