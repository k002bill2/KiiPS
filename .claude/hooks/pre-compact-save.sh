#!/bin/bash
# PreCompact Hook - Auto-save Dev Docs before compact
# Triggered when context window is full and auto-compact starts

INPUT=$(cat)
TRIGGER=$(echo "$INPUT" | jq -r '.trigger')

if [ "$TRIGGER" = "auto" ]; then
  # Update Dev Docs timestamps
  # 구조: dev/active/{project-name}/{project-name}-context.md
  for file in dev/active/*/*-context.md dev/active/*/*-tasks.md; do
    if [ -f "$file" ]; then
      sed -i '' "s/Last Updated:.*/Last Updated: $(date '+%Y-%m-%d %H:%M')/" "$file" 2>/dev/null
    fi
  done

  echo "✅ Dev Docs auto-saved before compact"
fi

exit 0
