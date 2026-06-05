#!/usr/bin/env bash
#
# seed-global.sh — [원본 PC 전용] 글로벌 비-git 층을 저장소 안 _global-seed/ 로 추출.
#
# 전제: 저장소가 PRIVATE 임 (메모리·내부 인프라 정보를 git 에 담으므로).
#       PUBLIC 인 동안 실행/커밋 금지 — 먼저 `gh repo edit --visibility private` 후 진행.
#
# 산출: .claude/_global-seed/
#   ├── memory/                     22개 .md (전체, 개인 포함)
#   ├── global/{commands,agents,output-styles,awesome-statusline.sh}
#   ├── global-settings.overlay.json  글로벌 settings 중 "안전한 5키"만 (위험 플래그 제외)
#   ├── plugins-to-install.json       플러그인 키 목록 (본체는 /plugin 재설치)
#   └── MANIFEST.txt                  추출 메타 + leak-guard 결과
#
# 멱등: 선두 rm -rf 로 매번 클린 재생성 → 원본 PC 현재 상태가 단일 진실원.
#
set -euo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
G="$HOME/.claude"
SEED="$PROJECT_DIR/.claude/_global-seed"

# PROJ_KEY: Claude Code 규칙(비영숫자 → '-')과 동일하게. (F1 수정: sed 's#/#-#g' 아님)
PROJ_KEY="$(printf '%s' "$PROJECT_DIR" | sed -E 's/[^A-Za-z0-9]/-/g')"
MEM_SRC="$G/projects/$PROJ_KEY/memory"

echo "▶ 원본 프로젝트: $PROJECT_DIR"
echo "▶ PROJ_KEY:      $PROJ_KEY"
echo "▶ 메모리 소스:   $MEM_SRC"

# tmp 헬퍼 (샌드박스 안전: $TMPDIR prefix 명시 — 바닥 mktemp 차단 회피)
mktmp() { mktemp "${TMPDIR:-/tmp}/seed.XXXXXX"; }

rm -rf "$SEED"
mkdir -p "$SEED/memory" "$SEED/global"

# ── 1. 메모리 (전체) ────────────────────────────────────────────────────────
if [ -d "$MEM_SRC" ]; then
  rsync -a "$MEM_SRC/" "$SEED/memory/"
  echo "▶ [1/6] 메모리 $(ls "$SEED/memory"/*.md 2>/dev/null | wc -l | tr -d ' ')개 추출"
else
  echo "❌ 메모리 디렉토리 없음: $MEM_SRC"; exit 1
fi

# ── 2. 글로벌 settings overlay (안전한 5키만 — F7: 위험 권한 플래그 비전파) ──
echo "▶ [2/6] 글로벌 settings overlay 추출 (화이트리스트 5키)"
jq '{enabledPlugins, extraKnownMarketplaces, language, advisorModel, effortLevel}' \
  "$G/settings.json" > "$SEED/global-settings.overlay.json"

# ── 3. 사람이 만든 글로벌 자산 ──────────────────────────────────────────────
echo "▶ [3/6] 글로벌 commands/agents/output-styles 추출"
for d in commands agents output-styles; do
  [ -d "$G/$d" ] && rsync -a --exclude '*.log' "$G/$d/" "$SEED/global/$d/"
done

# ── 4. statusLine 스크립트 동봉 + 내부 머신경로 일반화 ──────────────────────
if [ -f "$G/awesome-statusline.sh" ]; then
  cp "$G/awesome-statusline.sh" "$SEED/global/awesome-statusline.sh"
  # /Users/<name> → $HOME 로 일반화 (현재 0건이지만 방어적). BSD/GNU 양립 위해 tmp+perl 대신 sed tmp.
  t="$(mktmp)"
  sed -E "s#/Users/[^/\"' ]+#\$HOME#g; s#${HOME}#\$HOME#g" "$SEED/global/awesome-statusline.sh" > "$t" && mv "$t" "$SEED/global/awesome-statusline.sh"
  echo "▶ [4/6] awesome-statusline.sh 동봉 + 경로 일반화"
fi

# ── 5. 플러그인 재설치 목록 (키만) ──────────────────────────────────────────
if [ -f "$G/plugins/installed_plugins.json" ]; then
  jq '{plugins: (.plugins // {} | keys)}' "$G/plugins/installed_plugins.json" \
    > "$SEED/plugins-to-install.json" 2>/dev/null || echo '{"plugins":[]}' > "$SEED/plugins-to-install.json"
  echo "▶ [5/6] 플러그인 목록 $(jq '.plugins|length' "$SEED/plugins-to-install.json")개"
fi

# ── 6. MANIFEST + leak-guard ────────────────────────────────────────────────
{
  echo "# _global-seed manifest (PROJ_KEY=$PROJ_KEY)"
  echo "## overlay 포함 키:"
  jq -r 'keys[]' "$SEED/global-settings.overlay.json" | sed 's/^/  - /'
  echo "## leak-guard (false 여야 안전 — 위험 플래그 미포함):"
  echo "  skipDangerousModePermissionPrompt: $(jq 'has("skipDangerousModePermissionPrompt")' "$SEED/global-settings.overlay.json")"
  echo "  permissions:                       $(jq 'has("permissions")' "$SEED/global-settings.overlay.json")"
  echo "  statusLine:                        $(jq 'has("statusLine")' "$SEED/global-settings.overlay.json")"
  echo "  remoteControlAtStartup:            $(jq 'has("remoteControlAtStartup")' "$SEED/global-settings.overlay.json")"
} > "$SEED/MANIFEST.txt"
echo "▶ [6/6] MANIFEST 작성"

# 자기검증: overlay 에 위험 플래그가 새지 않았는지 (증거 기반)
if jq -e '(has("skipDangerousModePermissionPrompt")|not) and (has("permissions")|not) and (has("statusLine")|not) and (has("remoteControlAtStartup")|not)' \
   "$SEED/global-settings.overlay.json" >/dev/null; then
  echo "✅ overlay leak-guard 통과 (위험 플래그 4종 부재)"
else
  echo "❌ overlay 에 위험 플래그 누출 — 중단"; exit 1
fi

echo ""
echo "✅ seed 추출 완료 → $SEED"
echo "   다음: (1) 저장소 PRIVATE 확인  (2) git add .claude/_global-seed && git commit"
echo "   ⚠ PUBLIC 이면 커밋 금지 — 메모리/인프라 정보가 공개됩니다."