#!/usr/bin/env bash
# Hook Stats Weekly Summary
#
# .claude/learning/regression-stats.jsonl 을 읽어 주간 요약 출력.
# 향후 확장: 각 훅별 실행 빈도/실패율 수집 로직 추가 가능.
#
# 실행: bash .claude/tests/hook-stats-summary.sh
# Output: 콘솔 통계 표

set -u

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
STATS="$PROJECT_ROOT/.claude/learning/regression-stats.jsonl"

if [ ! -f "$STATS" ]; then
  echo "stats 파일 없음: $STATS"
  echo "regressionGuard가 최소 1회 실행되면 자동 생성됩니다."
  exit 0
fi

TOTAL=$(wc -l < "$STATS" | tr -d ' ')
if [ "$TOTAL" -eq 0 ]; then
  echo "stats 파일 비어있음 ($STATS)"
  exit 0
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Hook Stats Summary (regression-stats.jsonl)"
echo "═══════════════════════════════════════════════════════"
echo ""

PASSES=$(grep -c '"result":"pass"' "$STATS" 2>/dev/null | head -1)
PASSES=${PASSES:-0}
FAILS=$(grep -c '"result":"fail"' "$STATS" 2>/dev/null | head -1)
FAILS=${FAILS:-0}

printf "  총 실행: %d회\n" "$TOTAL"
printf "  성공:    %d회\n" "$PASSES"
printf "  실패:    %d회\n" "$FAILS"
echo ""

# 실행 시간 통계 (간단한 평균)
echo "┌─ 실행 시간 통계 ─"
DURATIONS=$(grep -oE '"duration_s":[0-9]+' "$STATS" | grep -oE '[0-9]+')
if [ -n "$DURATIONS" ]; then
  MAX=$(echo "$DURATIONS" | sort -n | tail -1)
  MIN=$(echo "$DURATIONS" | sort -n | head -1)
  AVG=$(echo "$DURATIONS" | awk '{s+=$1; n++} END {printf "%.1f", s/n}')
  printf "  min: %ss / avg: %ss / max: %ss\n" "$MIN" "$AVG" "$MAX"

  # 3초 이상 실행 (느린 실행)
  SLOW=$(echo "$DURATIONS" | awk '$1 > 3' | wc -l | tr -d ' ')
  printf "  3s 초과: %d회 (%.0f%%)\n" "$SLOW" "$(echo "$SLOW $TOTAL" | awk '{printf "%.0f", $1/$2*100}')"
fi

echo ""
echo "┌─ 최근 7일 실행 ─"
# ISO 날짜 기준 최근 7일 엔트리
SEVEN_DAYS_AGO=$(date -u -v-7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "7 days ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null)
RECENT=$(awk -v cutoff="$SEVEN_DAYS_AGO" '
  match($0, /"ts":"([^"]+)"/, a) {
    if (a[1] > cutoff) print
  }
' "$STATS" 2>/dev/null | wc -l | tr -d ' ')
printf "  최근 7일 실행: %s회\n" "$RECENT"

echo ""
echo "┌─ 최근 5개 엔트리 ─"
tail -5 "$STATS" | while read -r line; do
  echo "  $line"
done

echo ""
echo "═══════════════════════════════════════════════════════"
exit 0
