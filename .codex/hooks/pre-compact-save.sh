#!/bin/bash
# PreCompact Hook - Auto-save Dev Docs before compact
# Triggered when context window is full and auto-compact starts

# stdin 소비 (PreCompact 이벤트 데이터)
cat > /dev/null

LOG_FILE=".claude/hooks/hook-debug.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Update Dev Docs timestamps
# 구조: dev/active/{project-name}/{project-name}-context.md
# 패턴: "**Last Updated**: ..." (bold markdown) 또는 "Last Updated: ..." (plain)
UPDATED=0
NOW=$(date '+%Y-%m-%d %H:%M')
for file in dev/active/*/*-context.md dev/active/*/*-tasks.md; do
  if [ -f "$file" ]; then
    # **Last Updated**: ... (bold markdown 형식)
    if grep -q '\*\*Last Updated\*\*:' "$file" 2>/dev/null; then
      sed -i '' "s/\*\*Last Updated\*\*:.*/\*\*Last Updated\*\*: $NOW/" "$file" 2>/dev/null
      UPDATED=$((UPDATED + 1))
    # Last Updated: ... (plain 형식)
    elif grep -q 'Last Updated:' "$file" 2>/dev/null; then
      sed -i '' "s/Last Updated:.*/Last Updated: $NOW/" "$file" 2>/dev/null
      UPDATED=$((UPDATED + 1))
    fi
  fi
done

# 디버그 로그 기록
echo "[$TIMESTAMP] PreCompact: updated $UPDATED dev-doc files" >> "$LOG_FILE" 2>/dev/null

if [ "$UPDATED" -gt 0 ]; then
  echo "✅ Dev Docs auto-saved before compact ($UPDATED files)"
else
  echo "ℹ️  PreCompact: no dev-doc files found to update"
fi

# ─── Strategic Compact: 학습 체크포인트 저장 ────────────────────

CHECKPOINT_FILE=".claude/learning/compact-checkpoint.json"
INSTINCT_COUNT=$(ls -1 .claude/learning/instincts/personal/*.md 2>/dev/null | wc -l | tr -d ' ')
# 캐시된 health 파일에서 관찰 수를 읽음 (전체 파일 스캔 회피)
OBS_COUNT=$(python3 -c "
import json
try:
    with open('.claude/learning/observer-health.json') as f:
        print(json.load(f).get('observationsFileSizeKB', 0) * 10)  # 대략적 줄 수 추정
except: print(0)
" 2>/dev/null)
OBS_COUNT=${OBS_COUNT:-0}

# 최근 작업 도메인 top 3 추출
TOP_DOMAINS=$(tail -50 .claude/learning/observations.jsonl 2>/dev/null | python3 -c "
import json, sys, collections
domains = collections.Counter()
for line in sys.stdin:
    try:
        obj = json.loads(line.strip())
        for d in obj.get('domains', []):
            if d != 'general': domains[d] += 1
    except: pass
top3 = [d for d, _ in domains.most_common(3)]
print(','.join(top3) if top3 else 'general')
" 2>/dev/null || echo "general")

# 체크포인트 JSON 생성
cat > "$CHECKPOINT_FILE" << CKEOF
{
  "timestamp": "$TIMESTAMP",
  "instinctCount": $INSTINCT_COUNT,
  "observationCount": $OBS_COUNT,
  "recentDomains": $(python3 -c "import json; print(json.dumps('$TOP_DOMAINS'))" 2>/dev/null || echo '"general"'),
  "hint": "compact 후 복구 시 이 파일을 확인하여 학습 상태를 복원하세요"
}
CKEOF

echo "📊 Learning checkpoint: ${INSTINCT_COUNT} instincts, ${OBS_COUNT} observations, domains: ${TOP_DOMAINS}"

# ─── Agent State: stale 에이전트 정리 ─────────────────────────
AGENT_STATE=".claude/agents/agent-state.json"
if [ -f "$AGENT_STATE" ]; then
  STALE_COUNT=$(node -e "
    const s = require('./.claude/hooks/agentStateManager.js');
    console.log(s.cleanupStale());
  " 2>/dev/null || echo "0")
  if [ "$STALE_COUNT" != "0" ]; then
    echo "🧹 Cleaned ${STALE_COUNT} stale agent(s) before compact"
  fi
fi

# ─── 세션 변경 파일 요약 (compact 후 컨텍스트 복구용) ──────────
COMPACT_SUMMARY=".claude/learning/compact-summary.md"
CHANGED_FILES=$(git diff --name-only HEAD 2>/dev/null | head -20)
if [ -n "$CHANGED_FILES" ]; then
  FILE_COUNT=$(echo "$CHANGED_FILES" | wc -l | tr -d ' ')
  cat > "$COMPACT_SUMMARY" << SUMEOF
# Pre-Compact Session Summary
**Time**: $TIMESTAMP
**Changed files**: $FILE_COUNT
**Active domains**: $TOP_DOMAINS

## Files modified this session
\`\`\`
$CHANGED_FILES
\`\`\`

## Learning state
- Instincts: $INSTINCT_COUNT
- Observations: ~$OBS_COUNT

_This summary was auto-generated before context compaction._
SUMEOF
  echo "📝 Session summary saved to $COMPACT_SUMMARY ($FILE_COUNT files)"
fi

exit 0
