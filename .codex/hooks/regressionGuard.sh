#!/usr/bin/env bash
# Regression Guard - SessionStart 자동 회귀 검증
#
# 24시간에 한 번씩 .claude/tests/hook-regression.sh 자동 실행.
# 실패 시 stderr에 prominent 경고 출력 (블로킹 안 함, fail-open).
#
# Throttle 마커: .claude/.last-regression-test (mtime 기반)
# Bypass: REGRESSION_GUARD_SKIP=1 환경변수

set -u

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
LAST_RUN="$PROJECT_ROOT/.claude/.last-regression-test"
TEST_RUNNER="$PROJECT_ROOT/.claude/tests/hook-regression.sh"
THROTTLE_HOURS=24

# Bypass 옵션
if [ "${REGRESSION_GUARD_SKIP:-0}" = "1" ]; then
  exit 0
fi

# 테스트 러너 없으면 조용히 종료
if [ ! -f "$TEST_RUNNER" ]; then
  exit 0
fi

# Throttle 체크 (24시간 인터벌)
if [ -f "$LAST_RUN" ]; then
  last_epoch=$(stat -f %m "$LAST_RUN" 2>/dev/null || stat -c %Y "$LAST_RUN" 2>/dev/null || echo 0)
  now_epoch=$(date +%s)
  diff_hours=$(( (now_epoch - last_epoch) / 3600 ))
  if [ "$diff_hours" -lt "$THROTTLE_HOURS" ]; then
    exit 0
  fi
fi

# 임시 로그 (sandbox 호환을 위해 TMPDIR 사용, 실패해도 진행)
TMPLOG="${TMPDIR:-/tmp}/kiips-regression-$$.log"
STATS_LOG="$PROJECT_ROOT/.claude/learning/regression-stats.jsonl"

# 실행 시간 측정
START_SEC=$(date +%s)
if bash "$TEST_RUNNER" > "$TMPLOG" 2>&1; then
  END_SEC=$(date +%s)
  DURATION=$((END_SEC - START_SEC))
  # 통계 기록 (성공)
  printf '{"ts":"%s","result":"pass","duration_s":%d}\n' \
    "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$DURATION" >> "$STATS_LOG" 2>/dev/null || true
  # 성공: 마커만 갱신, 알림 없음 (3초 초과 시만 stderr로 경고)
  touch "$LAST_RUN" || true
  if [ "$DURATION" -gt 3 ]; then
    echo "[regressionGuard] Tests passed but took ${DURATION}s (> 3s threshold)" >&2
  fi
  [ -f "$TMPLOG" ] && rm -f "$TMPLOG"
  exit 0
fi

END_SEC=$(date +%s)
DURATION=$((END_SEC - START_SEC))
# 통계 기록 (실패)
printf '{"ts":"%s","result":"fail","duration_s":%d}\n' \
  "$(date -u +%Y-%m-%dT%H:%M:%SZ)" "$DURATION" >> "$STATS_LOG" 2>/dev/null || true

# 실패: 경고 출력
{
  echo ""
  echo "┌─── REGRESSION GUARD ALERT ──────────────────────────┐"
  echo "│ Hook regression tests FAILED.                        │"
  echo "│                                                      │"
  echo "│ 최근 .claude/hooks/* 변경이 회귀를 일으켰을 수       │"
  echo "│ 있습니다. 다음 명령으로 상세 내용 확인:              │"
  echo "│                                                      │"
  echo "│   bash .claude/tests/hook-regression.sh              │"
  echo "│                                                      │"
  echo "│ 가드 비활성화: REGRESSION_GUARD_SKIP=1               │"
  echo "└──────────────────────────────────────────────────────┘"
  echo ""
  echo "Test output (last 30 lines):"
  tail -30 "$TMPLOG" || true
  echo ""
  echo "Recent .claude/ changes (git status):"
  git -C "$PROJECT_ROOT" status --short .claude/ 2>/dev/null | head -20 || true
  echo ""
  echo "Rollback 제안:"
  echo "  git -C \"$PROJECT_ROOT\" diff .claude/   # 변경사항 검토"
  echo "  git -C \"$PROJECT_ROOT\" restore .claude/<파일>   # 개별 revert"
  echo ""
} >&2

# 실패해도 마커 갱신 (반복 알림 방지 - 24시간 후 재시도)
touch "$LAST_RUN" || true
[ -f "$TMPLOG" ] && rm -f "$TMPLOG"

# fail-open: SessionStart 자체는 막지 않음
exit 0
