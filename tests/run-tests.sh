#!/bin/bash
# KiiPS Agent System Test Runner
# Usage: bash tests/run-tests.sh [suite]
# Suites: all, hooks, agents, skills, e2e, managers, ui, evals

set -e

SUITE="${1:-all}"
TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$TEST_DIR/.."

echo "========================================"
echo "  KiiPS Agent System Tests"
echo "  Suite: $SUITE"
echo "  Time:  $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================"
echo ""

EXIT_CODE=0

run_test() {
  local name="$1"
  local file="$2"
  echo "--- $name ---"
  if node "tests/$file" 2>&1; then
    echo "  PASS"
  else
    echo "  FAIL"
    EXIT_CODE=1
  fi
  echo ""
}

case "$SUITE" in
  all)
    node tests/run-all-tests.js
    EXIT_CODE=$?
    ;;
  hooks)
    run_test "Hook Activation" "test-hook-activation.js"
    ;;
  agents)
    run_test "Agent Activation" "test-agent-activation.js"
    ;;
  skills)
    run_test "Skills" "test-skills.js"
    ;;
  e2e)
    run_test "E2E Workflow" "test-e2e-workflow.js"
    ;;
  managers)
    run_test "Manager Routing" "test-manager-routing.js"
    ;;
  ui)
    run_test "UI Skills Integration" "test-ui-skills-integration.js"
    ;;
  evals)
    run_test "Agent Evals" "agent-evals/run-agent-evals.js"
    ;;
  *)
    echo "Unknown suite: $SUITE"
    echo "Available: all, hooks, agents, skills, e2e, managers, ui, evals"
    exit 1
    ;;
esac

echo "========================================"
if [ $EXIT_CODE -eq 0 ]; then
  echo "  All tests passed"
else
  echo "  Some tests failed (exit code: $EXIT_CODE)"
fi
echo "========================================"

exit $EXIT_CODE
