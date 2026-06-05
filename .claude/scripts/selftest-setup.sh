#!/usr/bin/env bash
#
# selftest-setup.sh — setup.sh 를 "다른 사용자 PC" 흉내(가짜 HOME)에서 계약 검증.
#
# 격리 전략(샌드박스 안전): 모든 단계를 단일 실행 안에서.
#   - mktemp 는 $TMPDIR prefix 명시 (바닥 mktemp -d 는 샌드박스 차단)
#   - 멱등 diff 는 jq -S 정규화 → temp 파일 → plain diff (프로세스치환 <() 는 /dev/fd 차단)
#   - brew 스텁으로 동적 prefix 해석 검증 (Apple Silicon 박스에서 Intel 분기 테스트)
#
# 사용: bash .claude/scripts/selftest-setup.sh   → 끝에 PASS=n FAIL=0 이어야 성공
#
set +e
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
PASS=0; FAIL=0
ok(){ echo "  PASS $1"; PASS=$((PASS+1)); }
ng(){ echo "  FAIL $1"; FAIL=$((FAIL+1)); }

# ── 1. 샌드박스-안전 작업공간 ───────────────────────────────────────────────
WORK="$(mktemp -d "${TMPDIR:-/tmp}/setup-selftest.XXXXXX")" || { echo "mktemp 차단"; exit 1; }
trap 'rm -rf "$WORK"' EXIT
FAKEHOME="$WORK/fakehome"; mkdir -p "$FAKEHOME/.claude"

# ── 2. [판별성 핵심] 가짜 글로벌 settings 에 seed 에 없는 user-only 키 심기 ──
cat > "$FAKEHOME/.claude/settings.json" <<'JSON'
{ "permissions": { "allow": ["Bash(my-custom-user-cmd:*)"] },
  "enabledPlugins": { "user-only-plugin@x": true },
  "language": "english" }
JSON

# ── 3. 프로젝트를 새 경로로 복사 → PROJ_KEY 진짜 재계산 (seed 포함됨) ────────
mkdir -p "$WORK/proj"
rsync -a --exclude '*.log' "$PROJECT_DIR/.claude" "$WORK/proj/" 2>/dev/null
NEW_KEY="$(printf '%s' "$WORK/proj" | sed -E 's/[^A-Za-z0-9]/-/g')"

# ── 4. brew 스텁 (동적 prefix=/usr/local 강제) ──────────────────────────────
STUB="$WORK/stubbin"; mkdir -p "$STUB"
printf '#!/usr/bin/env bash\necho /usr/local\n' > "$STUB/brew"; chmod +x "$STUB/brew"

# ── 5. RUN 1, RUN 2 (HOME/PATH 격리, OBSIDIAN 미설정으로 ❌ 분기 유발) ───────
run(){ HOME="$FAKEHOME" PATH="$STUB:$PATH" OBSIDIAN_VAULT_PATH="" \
       bash "$WORK/proj/.claude/scripts/setup.sh" > "$1" 2>&1; echo "$?"; }
RC1="$(run "$WORK/out1.txt")"; cp "$FAKEHOME/.claude/settings.json" "$WORK/run1.json"
RC2="$(run "$WORK/out2.txt")"; cp "$FAKEHOME/.claude/settings.json" "$WORK/run2.json"

# ── 6. ASSERTIONS ───────────────────────────────────────────────────────────
# (A) MERGE 판별: 심은 user-only 키 생존 (clobber 아님)
jq -e '.permissions.allow | index("Bash(my-custom-user-cmd:*)")' "$WORK/run1.json" >/dev/null 2>&1 \
  && jq -e '.enabledPlugins["user-only-plugin@x"]' "$WORK/run1.json" >/dev/null 2>&1 \
  && ok "user-only 키 생존 (비파괴 머지)" || ng "user 키 손실 = clobber"
# (B) MERGE 추가: seed 키 병합
jq -e '.enabledPlugins["superpowers@claude-plugins-official"] and .extraKnownMarketplaces.ecc and (.language=="한국어") and (.advisorModel=="opus")' "$WORK/run1.json" >/dev/null 2>&1 \
  && ok "seed 5키 병합" || ng "seed 키 누락"
# (C) SANITIZE: 옛 사용자명 부재 + statusLine → fake HOME
grep -q '/Users/younghwankang' "$WORK/run1.json" && ng "옛 사용자명 잔존" || ok "옛 사용자명 부재"
jq -r '.statusLine.command' "$WORK/run1.json" 2>/dev/null | grep -q "$FAKEHOME" \
  && ok "statusLine → \$HOME 재해석" || ng "statusLine 미보정"
# (D) SANITIZE: brew 동적 prefix (스텁이 준 /usr/local 반영)
jq -r '.lsp.java.command // ""' "$WORK/proj/.claude/settings.json" 2>/dev/null | grep -q '/usr/local/bin/jdtls' \
  && ok "jdtls brew prefix 동적해석(/usr/local)" || ng "brew prefix 미반영"
# (E) SANITIZE: serena dead-entry 제거
grep -q 'archive-v0' "$WORK/proj/.claude/settings.local.json" 2>/dev/null && ng "serena dead-entry 잔존" || ok "serena dead-entry 제거"
# (F) MEMORY: 새 PROJ_KEY 로 22개 배치
MEM="$FAKEHOME/.claude/projects/$NEW_KEY/memory"
[ "$(ls "$MEM"/*.md 2>/dev/null | wc -l | tr -d ' ')" = "22" ] && ok "memory 22개 @ 재계산 키" || ng "memory 개수/경로 오류(키=$NEW_KEY)"
# (G) IDEMPOTENT: 2회 실행 후 글로벌 settings diff 없음 (temp-file diff)
jq -S . "$WORK/run1.json" > "$WORK/a.norm" 2>/dev/null; jq -S . "$WORK/run2.json" > "$WORK/b.norm" 2>/dev/null
diff "$WORK/a.norm" "$WORK/b.norm" >/dev/null 2>&1 && ok "2회 실행 글로벌 settings 동일(멱등)" || ng "비멱등"
# (H) IDEMPOTENT: permissions.allow 배열 중복 없음
jq -e '.permissions.allow | (length == (unique|length))' "$WORK/run2.json" >/dev/null 2>&1 && ok "배열 중복 없음" || ng "배열 append 중복"
# (I) IDEMPOTENT: 2회 후에도 memory 22개 (44 아님)
[ "$(ls "$MEM"/*.md 2>/dev/null | wc -l | tr -d ' ')" = "22" ] && ok "2회 후 memory 비중복(22)" || ng "memory 중복"
# (J) 진단 비치명적: OBSIDIAN 미설정 ❌ 출력 + exit 0
grep -q '❌' "$WORK/out1.txt" && ok "누락항목 ❌ 출력" || ng "❌ 미출력"
[ "$RC1" = "0" ] && ok "진단 비치명적 (exit 0)" || ng "exit≠0 치명적(RC1=$RC1)"
# (K) import 잔재 부재 (setup 은 직접 머지 → settings.imported.json 생성 안 함)
[ -f "$FAKEHOME/.claude/settings.imported.json" ] && ng "settings.imported.json 잔재" || ok "import 잔재 없음"

echo ""
echo "PASS=$PASS FAIL=$FAIL"
[ "$FAIL" -eq 0 ]