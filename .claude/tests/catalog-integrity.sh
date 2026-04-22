#!/usr/bin/env bash
# Catalog Integrity Test
#
# 문서(README.md / COMMANDS.md / SKILLS.md / agents-registry.json)의 수량 주장이
# 실제 파일 시스템과 일치하는지 검증. v3.5.2 문서 drift 재발 방지용.
#
# 실행 방법: sh ./.claude/tests/catalog-integrity.sh
# CI 통합 가능: exit code 0 = all pass, 1 = any drift detected

set -u

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

PASS=0
FAIL=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_count() {
  local label="$1"
  local expected="$2"
  local actual="$3"
  if [ "$expected" = "$actual" ]; then
    printf "  ${GREEN}[PASS]${NC} %s — 문서 주장 %s / 실측 %s\n" "$label" "$expected" "$actual"
    PASS=$((PASS + 1))
  else
    printf "  ${RED}[FAIL]${NC} %s — 문서 주장 %s / 실측 %s (drift 감지)\n" "$label" "$expected" "$actual"
    FAIL=$((FAIL + 1))
  fi
}

echo "════════════════════════════════════════════════════════"
echo "  Catalog Integrity Test (.claude/ 문서-실측 대조)"
echo "════════════════════════════════════════════════════════"
echo ""

# ─── 1. Agents ─────────────────────────────────────────────
echo "┌─ Agents (agents-registry.json 기준) ─"
REGISTRY_TOTAL=$(grep -o '"totalAgents":[[:space:]]*[0-9]*' .claude/agents-registry.json | grep -o '[0-9]*$')
ACTUAL_AGENTS=$(find .claude/agents -type f -name "*.md" -not -path "*/shared/*" | wc -l | tr -d ' ')
check_count "에이전트 수" "$REGISTRY_TOTAL" "$ACTUAL_AGENTS"

REGISTRY_SHARED=$(grep -o '"sharedProtocols":[[:space:]]*[0-9]*' .claude/agents-registry.json | grep -o '[0-9]*$')
ACTUAL_SHARED=$(find .claude/agents/shared -type f -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
check_count "shared 프로토콜 수" "$REGISTRY_SHARED" "$ACTUAL_SHARED"
echo ""

# ─── 2. Skills ──────────────────────────────────────────────
echo "┌─ Skills (SKILLS.md + skills-registry.json 기준) ─"
SKILLS_CLAIMED=$(grep -oE 'Active Skills \([0-9]+개\)' .claude/SKILLS.md | grep -oE '[0-9]+' | head -1)
ACTUAL_SKILLS=$(find .claude/skills -name "SKILL.md" -type f | wc -l | tr -d ' ')
check_count "스킬 수" "$SKILLS_CLAIMED" "$ACTUAL_SKILLS"

if [ -f .claude/skills-registry.json ]; then
  REG_SKILLS=$(grep -o '"totalSkills":[[:space:]]*[0-9]*' .claude/skills-registry.json | grep -o '[0-9]*$')
  check_count "skills-registry 수" "$REG_SKILLS" "$ACTUAL_SKILLS"
else
  printf "  ${YELLOW}[WARN]${NC} skills-registry.json 부재 — node .claude/scripts/build-registries.js 실행 권장\n"
fi
echo ""

# ─── 3. Commands ─────────────────────────────────────────────
echo "┌─ Commands (COMMANDS.md + commands-registry.json 기준) ─"
COMMANDS_CLAIMED=$(grep -oE 'Active Commands \([0-9]+개\)' .claude/COMMANDS.md | grep -oE '[0-9]+' | head -1)
ACTUAL_COMMANDS=$(find .claude/commands -maxdepth 1 -name "*.md" -type f | wc -l | tr -d ' ')
check_count "커맨드 수" "$COMMANDS_CLAIMED" "$ACTUAL_COMMANDS"

if [ -f .claude/commands-registry.json ]; then
  REG_COMMANDS=$(grep -o '"totalCommands":[[:space:]]*[0-9]*' .claude/commands-registry.json | grep -o '[0-9]*$')
  check_count "commands-registry 수" "$REG_COMMANDS" "$ACTUAL_COMMANDS"
else
  printf "  ${YELLOW}[WARN]${NC} commands-registry.json 부재 — node .claude/scripts/build-registries.js 실행 권장\n"
fi
echo ""

# ─── 4. Hooks ────────────────────────────────────────────────
echo "┌─ Hooks (README.md / settings.json) ─"
README_BINDINGS=$(grep -oE '총 [0-9]+ 바인딩' .claude/README.md | grep -oE '[0-9]+' | head -1)
# 훅 바인딩만 카운트 (LSP 의 jdtls command 제외)
ACTUAL_BINDINGS=$(grep '"command":' .claude/settings.json | grep -c 'claude/hooks/\|python3 -c')
check_count "훅 바인딩 수" "$README_BINDINGS" "$ACTUAL_BINDINGS"

# 유니크 훅 파일 수 (min.js / log / README 제외 — 순수 훅 스크립트만)
ACTUAL_UNIQUE=$(find .claude/hooks -maxdepth 1 -type f \( -name "*.js" -o -name "*.sh" \) -not -name "*.min.js" | wc -l | tr -d ' ')
README_UNIQUE=$(grep 'Hooks (유니크)' .claude/README.md | grep -oE '\| [0-9]+' | grep -oE '[0-9]+' | head -1)
check_count "유니크 훅 파일 수" "$README_UNIQUE" "$ACTUAL_UNIQUE"
echo ""

# ─── 5. Commands 개별 파일 존재 검증 ────────────────────────
echo "┌─ Commands 개별 파일 존재 검증 ─"
MISSING_CMDS=0
while IFS= read -r line; do
  name=$(printf '%s' "$line" | grep -oE '/[a-z0-9-]+' | head -1 | sed 's|^/||')
  [ -z "$name" ] && continue
  if [ ! -f ".claude/commands/${name}.md" ]; then
    printf "  ${RED}[FAIL]${NC} COMMANDS.md 에 /%s 가 있지만 .claude/commands/%s.md 부재\n" "$name" "$name"
    MISSING_CMDS=$((MISSING_CMDS + 1))
    FAIL=$((FAIL + 1))
  fi
done < <(grep -E '^\| `/[a-z0-9-]+`' .claude/COMMANDS.md)
if [ $MISSING_CMDS -eq 0 ]; then
  printf "  ${GREEN}[PASS]${NC} COMMANDS.md 모든 항목의 파일 존재 확인\n"
  PASS=$((PASS + 1))
fi
echo ""

# ─── 6. Skills 개별 디렉토리 존재 검증 ────────────────────────
echo "┌─ Skills 개별 디렉토리 존재 검증 ─"
MISSING_SKILLS=0
while IFS= read -r line; do
  name=$(printf '%s' "$line" | grep -oE '`[a-z0-9-]+`' | head -1 | tr -d '`')
  [ -z "$name" ] && continue
  if [ ! -f ".claude/skills/${name}/SKILL.md" ]; then
    printf "  ${RED}[FAIL]${NC} SKILLS.md 에 %s 가 있지만 .claude/skills/%s/SKILL.md 부재\n" "$name" "$name"
    MISSING_SKILLS=$((MISSING_SKILLS + 1))
    FAIL=$((FAIL + 1))
  fi
done < <(grep -E '^\| `[a-z0-9-]+`' .claude/SKILLS.md)
if [ $MISSING_SKILLS -eq 0 ]; then
  printf "  ${GREEN}[PASS]${NC} SKILLS.md 모든 항목의 디렉토리 존재 확인\n"
  PASS=$((PASS + 1))
fi
echo ""

# ─── 결과 ─────────────────────────────────────────────────
echo "════════════════════════════════════════════════════════"
TOTAL=$((PASS + FAIL))
if [ $FAIL -eq 0 ]; then
  printf "  ${GREEN}ALL PASS: %d/%d checks${NC}\n" "$PASS" "$TOTAL"
  echo "  문서-실측 drift 없음."
  echo "════════════════════════════════════════════════════════"
  exit 0
else
  printf "  ${RED}FAIL: %d/%d checks${NC} (${GREEN}PASS: %d${NC})\n" "$FAIL" "$TOTAL" "$PASS"
  printf "  ${YELLOW}drift 를 수정하거나 문서/레지스트리를 업데이트하세요.${NC}\n"
  echo "════════════════════════════════════════════════════════"
  exit 1
fi
