#!/bin/bash
# themeCssVerGuard.sh - PostToolUse hook
# theme.css 의존성 SCSS 편집 후 header.jsp:85의 ?ver=YYMMDD 캐시 버스터 갱신 누락 감지
# Non-blocking: 경고만 출력, 편집 차단 안 함
# Reference: .claude/skills/kiips-scss/SKILL.md v3.2.0

set -u

STDIN_INPUT=$(cat)
FILE_PATH=$(echo "$STDIN_INPUT" | grep -oE '"file_path"\s*:\s*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"/\1/')

# file_path 없으면 종료
[[ -z "$FILE_PATH" ]] && exit 0

# theme.css 영향 범위: KiiPS-UI/.../css/sass/ 하위의 모든 .scss
# (theme.scss가 base/, config/, custom, gui/, index/, layouts/, partials/, themes/ 를 광범위 import)
SASS_ROOT="KiiPS-UI/src/main/resources/static/css/sass"
case "$FILE_PATH" in
  *"$SASS_ROOT"/*.scss) ;;
  *) exit 0 ;;
esac

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-$(pwd)}"
HEADER_JSP="$PROJECT_DIR/KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/header.jsp"

# header.jsp 없으면 종료 (모듈 미설치 환경)
[[ ! -f "$HEADER_JSP" ]] && exit 0

# header.jsp:85에서 theme.css?ver= 값 추출 (6자리 YYMMDD 컨벤션)
CURRENT_VER=$(grep -oE 'theme\.css\?ver=[0-9]{6}' "$HEADER_JSP" | head -1 | sed 's/theme\.css?ver=//')
[[ -z "$CURRENT_VER" ]] && exit 0

CURRENT_DATE="$CURRENT_VER"
TODAY=$(date +%y%m%d)

# 오늘 날짜와 일치하면 갱신 불필요
[[ "$CURRENT_DATE" == "$TODAY" ]] && exit 0

# 세션당 1회만 경고 (마커 파일)
MARKER_DIR="$PROJECT_DIR/.claude"
MARKER="$MARKER_DIR/.theme-ver-warned-$TODAY"
[[ -f "$MARKER" ]] && exit 0
mkdir -p "$MARKER_DIR" 2>/dev/null
touch "$MARKER" 2>/dev/null

# 다음 ver 계산: 오늘 날짜 6자리 (라이브 컨벤션, _N 미사용)
NEXT_VER="${TODAY}"

cat <<EOF
⚠️  theme.css 캐시 버스터 갱신 누락 감지
   편집 파일: $FILE_PATH
   현재 ver:  $CURRENT_VER  (오래된 날짜)
   권장 ver:  $NEXT_VER

   다음 한 줄을 갱신하세요:
     파일: KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/header.jsp (line 85)
     변경: theme.css?ver=$CURRENT_VER  →  theme.css?ver=$NEXT_VER

   ver 는 6자리 날짜(YYMMDD)만 사용합니다 (_N 시퀀스 미사용 — 라이브 컨벤션).
📖 Reference: .claude/skills/kiips-scss/SKILL.md > theme.css 변경 시 header 캐시 버전 갱신
EOF

exit 0
