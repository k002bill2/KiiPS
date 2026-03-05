#!/bin/bash
# PostToolUse Edit|Write hook - collect edited file paths for Gemini batch review
# 쿨다운 제거: grep dedup이 중복 방지, daemon debounce(5s)가 배치 처리 담당

PENDING=".claude/gemini-bridge/pending-files.txt"
mkdir -p "$(dirname "$PENDING")"

# Read JSON from stdin, extract file_path
FILE_PATH=$(cat | jq -r '.tool_input.file_path // empty' 2>/dev/null)
[ -z "$FILE_PATH" ] && exit 0

# Append with dedup (daemon debounce handles batching)
grep -qxF "$FILE_PATH" "$PENDING" 2>/dev/null || echo "$FILE_PATH" >> "$PENDING"

exit 0
