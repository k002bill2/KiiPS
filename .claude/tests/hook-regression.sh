#!/usr/bin/env bash
# Hook Regression Test Runner
#
# 핵심 5개 훅의 차단/통과 동작을 페이로드 기반으로 검증.
# 향후 훅 수정 시 회귀 즉시 감지 (하네스 엔지니어링: 검증된 진실 고정).
#
# 실행: bash .claude/tests/hook-regression.sh
# CI 통합 가능: exit code 0 = all pass, 1 = any fail

set -u

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJECT_ROOT" || exit 1

PAYLOADS=".claude/.test-payloads"
HOOKS=".claude/hooks"
PASS=0
FAIL=0

# 색상
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# run_test <hook_path> <payload> <expected_exit> <description>
run_test() {
  local hook="$1"
  local payload="$2"
  local expected="$3"
  local desc="$4"

  if [ ! -f "$payload" ]; then
    printf "  ${RED}[MISSING]${NC} %s (payload not found: %s)\n" "$desc" "$payload"
    FAIL=$((FAIL+1))
    return
  fi

  local actual
  if [[ "$hook" == *.sh ]]; then
    bash "$hook" < "$payload" > /dev/null 2>&1
  else
    node "$hook" < "$payload" > /dev/null 2>&1
  fi
  actual=$?

  if [ "$actual" -eq "$expected" ]; then
    printf "  ${GREEN}[PASS]${NC} %s (exit=%d)\n" "$desc" "$actual"
    PASS=$((PASS+1))
  else
    printf "  ${RED}[FAIL]${NC} %s (expected=%d, actual=%d)\n" "$desc" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

# run_test_env <env_spec> <hook_path> <payload> <expected_exit> <description>
# env_spec 예: "KIIPS_VALIDATOR_AST=off"
run_test_env() {
  local env_spec="$1"
  local hook="$2"
  local payload="$3"
  local expected="$4"
  local desc="$5"

  if [ ! -f "$payload" ]; then
    printf "  ${RED}[MISSING]${NC} %s (payload not found: %s)\n" "$desc" "$payload"
    FAIL=$((FAIL+1))
    return
  fi

  local actual
  env "$env_spec" node "$hook" < "$payload" > /dev/null 2>&1
  actual=$?

  if [ "$actual" -eq "$expected" ]; then
    printf "  ${GREEN}[PASS]${NC} %s (exit=%d)\n" "$desc" "$actual"
    PASS=$((PASS+1))
  else
    printf "  ${RED}[FAIL]${NC} %s (expected=%d, actual=%d)\n" "$desc" "$expected" "$actual"
    FAIL=$((FAIL+1))
  fi
}

# load_test <module_path> <description>
load_test() {
  local mod="$1"
  local desc="$2"
  if node -e "require('./$mod')" 2>/dev/null; then
    printf "  ${GREEN}[LOAD]${NC} %s\n" "$desc"
    PASS=$((PASS+1))
  else
    printf "  ${RED}[FAIL]${NC} %s (module load error)\n" "$desc"
    FAIL=$((FAIL+1))
  fi
}

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  KiiPS Hook Regression Tests"
echo "═══════════════════════════════════════════════════════"
echo ""

echo "┌─ ethicalValidator (shell-context guard) ─"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/md-false-positive.json"  0 "MD with markdown table cells (allowed)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/real-attack.json"        2 "Real curl-pipe-bash attack (blocked)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/sh-write-attack.json"    2 "Shell script with attack (blocked)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/clean-bash.json"         0 "Clean ls command (allowed)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-md-text.json"         0 "MD file with rm text (false positive bypass)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-real-attack.json"     2 "Bash rm -rf real attack (blocked)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-stealth-bash.json"    2 "Bash rm with /dev/null redirect (blocked)"

echo ""
echo "┌─ ethicalValidator (AST filter active — default) ─"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-grep-literal.json"    0 "grep regex literal with |bash (AST: allowed)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-comment-docs.json"    0 "shell comment referencing curl|bash (AST: allowed)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-heredoc-docs.json"    0 "heredoc body with rm -rf text (AST: allowed)"
run_test "$HOOKS/ethicalValidator.js" "$PAYLOADS/sh-edit-unclosed-quote-regression.json" 2 "Edit .sh with unclosed quote + rm attack (regression guard)"

echo ""
echo "┌─ ethicalValidator (AST rollback — KIIPS_VALIDATOR_AST=off) ─"
run_test_env "KIIPS_VALIDATOR_AST=off" "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-grep-literal.json"    2 "grep regex literal (rollback: blocked)"
run_test_env "KIIPS_VALIDATOR_AST=off" "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-comment-docs.json"    2 "shell comment curl|bash (rollback: blocked)"
run_test_env "KIIPS_VALIDATOR_AST=off" "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-heredoc-docs.json"    2 "heredoc rm -rf text (rollback: blocked)"
run_test_env "KIIPS_VALIDATOR_AST=off" "$HOOKS/ethicalValidator.js" "$PAYLOADS/fs-real-attack.json"     2 "Real attack still blocked when AST off"

echo ""
echo "┌─ permissionGate (default active) ─"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-java-edit.json"    0 "Java file edit (allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-mapper.json"       0 "Mapper XML edit (allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-ls.json"           0 "ls command (allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-start-sh.json"     2 "./start.sh execution (blocked)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-pom-edit.json"     2 "pom.xml edit (blocked)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-svn-commit.json"   2 "svn commit (blocked)"

echo ""
echo "┌─ permissionGate (AST filter active — default) ─"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-svn-docstring.json"   0 "svn commit inside git -m dquote (AST: allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-heredoc-docs.json"    0 "./start.sh inside heredoc body (AST: allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-comment-docs.json"    0 "kill -9 inside shell comment (AST: allowed)"
run_test "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-v350-original-msg.json" 0 "v3.5.0 original commit msg (regression acceptance)"

echo ""
echo "┌─ permissionGate (AST rollback — KIIPS_PERMISSION_GATE_AST=off) ─"
run_test_env "KIIPS_PERMISSION_GATE_AST=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-svn-docstring.json"   2 "svn docstring (AST rollback: blocked)"
run_test_env "KIIPS_PERMISSION_GATE_AST=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-allow-heredoc-docs.json"    2 "heredoc start.sh (AST rollback: blocked)"
run_test_env "KIIPS_PERMISSION_GATE_AST=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-start-sh.json"        2 "Real ./start.sh still blocked when AST off"

echo ""
echo "┌─ permissionGate (rollback — KIIPS_PERMISSION_GATE=off) ─"
run_test_env "KIIPS_PERMISSION_GATE=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-start-sh.json"    0 "./start.sh (rollback: allowed)"
run_test_env "KIIPS_PERMISSION_GATE=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-pom-edit.json"    0 "pom.xml edit (rollback: allowed)"
run_test_env "KIIPS_PERMISSION_GATE=off" "$HOOKS/permissionGate.js" "$PAYLOADS/pg-block-svn-commit.json"  0 "svn commit (rollback: allowed)"

echo ""
echo "┌─ jspXssGuard ─"
run_test "$HOOKS/jspXssGuard.js" "$PAYLOADS/jsp-bad-scriptlet.json" 2 "Unescaped scriptlet in JSP (blocked)"
run_test "$HOOKS/jspXssGuard.js" "$PAYLOADS/jsp-safe-cout.json"     0 "Safe c:out wrapper (allowed)"
run_test "$HOOKS/jspXssGuard.js" "$PAYLOADS/jsp-non-jsp.json"       0 "Non-JSP file (no check)"

echo ""
echo "┌─ mybatisBindingGuard ─"
run_test "$HOOKS/mybatisBindingGuard.js" "$PAYLOADS/mybatis-dangerous.json"   2 "Dangerous \${userId} (blocked)"
run_test "$HOOKS/mybatisBindingGuard.js" "$PAYLOADS/mybatis-whitelisted.json" 0 "Whitelisted \${tableName}/\${orderBy} (allowed)"

echo ""
echo "┌─ Module load tests ─"
load_test ".claude/hooks/ethicalValidator.js"   "ethicalValidator.js"
load_test ".claude/hooks/shellContextTokenizer.js" "shellContextTokenizer.js"
load_test ".claude/hooks/permissionGate.js"         "permissionGate.js"
load_test ".claude/hooks/jspXssGuard.js"        "jspXssGuard.js"
load_test ".claude/hooks/mybatisBindingGuard.js" "mybatisBindingGuard.js"
load_test ".claude/hooks/multiFileGate.js"      "multiFileGate.js"
load_test ".claude/hooks/impactAnalyzer.js"     "impactAnalyzer.js"
load_test ".claude/hooks/buildChecker.js"       "buildChecker.js"
load_test ".claude/hooks/stopEvent.js"          "stopEvent.js"
load_test ".claude/hooks/observationsRoller.js" "observationsRoller.js"

echo ""
echo "┌─ Registry integrity ─"
REG_LOG="${TMPDIR:-/tmp}/registry-integrity.log"
if node "$PROJECT_ROOT/.claude/tests/registry-integrity.test.js" > "$REG_LOG" 2>&1; then
  REG_PASS=$(grep -c "\[PASS\]" "$REG_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} Registry integrity (%d checks)\n" "$REG_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} Registry integrity (see %s)\n" "$REG_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ Skill-rules integrity ─"
SR_LOG="${TMPDIR:-/tmp}/skill-rules-integrity.log"
if node "$PROJECT_ROOT/.claude/tests/skill-rules-integrity.test.js" > "$SR_LOG" 2>&1; then
  SR_PASS=$(grep -c "\[PASS\]" "$SR_LOG" 2>/dev/null | head -1)
  printf "  ${GREEN}[PASS]${NC} Skill-rules integrity (%d checks)\n" "${SR_PASS:-0}"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} Skill-rules integrity (see %s)\n" "$SR_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ Skills integrity ─"
SKILLS_LOG="${TMPDIR:-/tmp}/skills-integrity.log"
if node "$PROJECT_ROOT/.claude/tests/skills-integrity.test.js" > "$SKILLS_LOG" 2>&1; then
  SKILLS_PASS=$(grep -c "\[PASS\]" "$SKILLS_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} Skills integrity (%d checks)\n" "$SKILLS_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} Skills integrity (see %s)\n" "$SKILLS_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ Ralph Loop signature tracking (synthetic test) ─"
RALPH_LOG="${TMPDIR:-/tmp}/ralph-test-output.log"
if node "$PROJECT_ROOT/.claude/tests/ralph-loop-signature.test.js" > "$RALPH_LOG" 2>&1; then
  RALPH_PASS=$(grep -c "\[PASS\]" "$RALPH_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} Ralph Loop synthetic test (%d sub-tests)\n" "$RALPH_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} Ralph Loop synthetic test (see %s)\n" "$RALPH_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ permissionGate (unit tests) ─"
PG_LOG="${TMPDIR:-/tmp}/permission-gate.log"
if node "$PROJECT_ROOT/.claude/tests/permission-gate.test.js" > "$PG_LOG" 2>&1; then
  PG_PASS=$(grep -c "\[PASS\]" "$PG_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} permissionGate unit (%d sub-tests)\n" "$PG_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} permissionGate unit (see %s)\n" "$PG_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ shellContextTokenizer (unit tests) ─"
SCT_LOG="${TMPDIR:-/tmp}/shell-context-tokenizer.log"
if node "$PROJECT_ROOT/.claude/tests/shell-context-tokenizer.test.js" > "$SCT_LOG" 2>&1; then
  SCT_PASS=$(grep -c "\[PASS\]" "$SCT_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} shellContextTokenizer unit (%d sub-tests)\n" "$SCT_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} shellContextTokenizer unit (see %s)\n" "$SCT_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "┌─ extractBuildErrors (Maven output parsing) ─"
EBE_LOG="${TMPDIR:-/tmp}/extract-build-errors.log"
if node "$PROJECT_ROOT/.claude/tests/extract-build-errors.test.js" > "$EBE_LOG" 2>&1; then
  EBE_PASS=$(grep -c "\[PASS\]" "$EBE_LOG" 2>/dev/null || echo 0)
  printf "  ${GREEN}[PASS]${NC} extractBuildErrors parsing test (%d sub-tests)\n" "$EBE_PASS"
  PASS=$((PASS+1))
else
  printf "  ${RED}[FAIL]${NC} extractBuildErrors parsing test (see %s)\n" "$EBE_LOG"
  FAIL=$((FAIL+1))
fi

echo ""
echo "═══════════════════════════════════════════════════════"
TOTAL=$((PASS+FAIL))
if [ "$FAIL" -eq 0 ]; then
  printf "  ${GREEN}ALL PASS: %d/%d top-level tests${NC}\n" "$PASS" "$TOTAL"
  echo "═══════════════════════════════════════════════════════"
  exit 0
else
  printf "  ${RED}FAIL: %d/%d tests failed${NC}\n" "$FAIL" "$TOTAL"
  echo "═══════════════════════════════════════════════════════"
  exit 1
fi
