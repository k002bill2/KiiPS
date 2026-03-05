#!/bin/bash
# scssValidator.sh - PostToolUse hook for SCSS dark theme validation
# Non-blocking: outputs warnings only, never blocks editing
# Triggered on Edit|Write tool use for .scss files

# Read JSON from stdin (Claude Code hooks deliver tool input via stdin)
STDIN_INPUT=$(cat)

# Extract file path from stdin JSON
FILE_PATH=$(echo "$STDIN_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"/\1/')

# Fallback: try CLI args (legacy compatibility)
if [[ -z "$FILE_PATH" ]]; then
    TOOL_INPUT="$2"
    FILE_PATH=$(echo "$TOOL_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"/\1/')
fi

# Only validate .scss files
if [[ ! "$FILE_PATH" =~ \.scss$ ]]; then
    exit 0
fi

# Check if file exists
if [[ ! -f "$FILE_PATH" ]]; then
    exit 0
fi

WARNINGS=""

# 1. Check for forbidden dark theme selectors (.dark, .theme-dark)
FORBIDDEN_SELECTORS=$(grep -n '\.dark\s*[{,]' "$FILE_PATH" 2>/dev/null | grep -v '\[data-theme' | grep -v '^\s*//' | grep -v '^\s*\*')
FORBIDDEN_SELECTORS2=$(grep -n '\.theme-dark' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' | grep -v '^\s*\*')
if [[ -n "$FORBIDDEN_SELECTORS" ]] || [[ -n "$FORBIDDEN_SELECTORS2" ]]; then
    WARNINGS+="⚠️ SCSS Dark Theme Warning: Use [data-theme=dark] instead of .dark or .theme-dark selectors\n"
    WARNINGS+="  Found in: $FILE_PATH\n"
    if [[ -n "$FORBIDDEN_SELECTORS" ]]; then
        WARNINGS+="  $FORBIDDEN_SELECTORS\n"
    fi
    if [[ -n "$FORBIDDEN_SELECTORS2" ]]; then
        WARNINGS+="  $FORBIDDEN_SELECTORS2\n"
    fi
fi

# 2. Check for layout properties inside dark theme blocks
# Look for data-theme=dark blocks containing layout-changing properties
if grep -q '\[data-theme.*dark\]' "$FILE_PATH" 2>/dev/null; then
    LAYOUT_PROPS=$(grep -n -E '(width|height|display|position|margin|padding)\s*:' "$FILE_PATH" 2>/dev/null)
    if [[ -n "$LAYOUT_PROPS" ]]; then
        # Simple heuristic: check if layout props appear near dark theme selectors
        DARK_LINE=$(grep -n '\[data-theme.*dark\]' "$FILE_PATH" 2>/dev/null | head -1 | cut -d: -f1)
        if [[ -n "$DARK_LINE" ]]; then
            while IFS= read -r line; do
                LINE_NUM=$(echo "$line" | cut -d: -f1)
                DIFF=$((LINE_NUM - DARK_LINE))
                if [[ $DIFF -gt 0 ]] && [[ $DIFF -lt 50 ]]; then
                    WARNINGS+="⚠️ SCSS Dark Theme Warning: Layout property found inside dark theme block (line $LINE_NUM)\n"
                    WARNINGS+="  Dark theme should only change colors, not layout (width/height/display/position/margin/padding)\n"
                    WARNINGS+="  $line\n"
                    break
                fi
            done <<< "$LAYOUT_PROPS"
        fi
    fi
fi

# 3. Check for raw hex colors instead of SCSS variables in dark theme context
if grep -q '\[data-theme.*dark\]' "$FILE_PATH" 2>/dev/null; then
    HEX_COLORS=$(grep -n '#[0-9a-fA-F]\{3,8\}' "$FILE_PATH" 2>/dev/null | grep -v '^\s*//' | grep -v '^\s*\*' | grep -v '^\s*\$')
    if [[ -n "$HEX_COLORS" ]]; then
        WARNINGS+="⚠️ SCSS Dark Theme Warning: Consider using SCSS variables (\$dark-bg, \$dark-color-2, etc.) instead of raw hex colors\n"
        WARNINGS+="  Found in: $FILE_PATH\n"
    fi
fi

# 4. SCSS compile check (syntax validation)
SASS_BIN=$(which sass 2>/dev/null)
if [[ -n "$SASS_BIN" ]]; then
    COMPILE_OUTPUT=$("$SASS_BIN" --no-source-map --style=compressed "$FILE_PATH" 2>&1 >/dev/null)
    COMPILE_EXIT=$?
    if [[ $COMPILE_EXIT -ne 0 ]]; then
        WARNINGS+="🚨 SCSS Compile Error: $FILE_PATH 컴파일 실패!\n"
        WARNINGS+="  $COMPILE_OUTPUT\n"
        WARNINGS+="  ⚠️ 컴파일 오류를 수정하기 전까지 완료 보고하지 마세요.\n"
    fi
fi

# Output warnings (non-blocking)
if [[ -n "$WARNINGS" ]]; then
    echo -e "$WARNINGS"
    echo "📖 Reference: CLAUDE.md > Dark Theme Rules, Editing Rules"
fi

# Always exit 0 (non-blocking)
exit 0
