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

exit 0
