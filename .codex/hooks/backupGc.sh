#!/usr/bin/env bash
# Backup Garbage Collector for KiiPS Claude Code Harness
#
# 30일 경과 .claude.backup-* 디렉토리 및 *.pom.xml.bak 파일 후보 식별
# 자동 삭제는 수행하지 않으며, 사용자 알림만 출력 (안전 우선)
#
# 호출 위치: stopEvent.js의 gcBackups() 또는 SessionStart에서 직접
# 출력: stderr에 후보 목록 + 정리 명령 안내

set -u

PROJECT_ROOT="${PROJECT_ROOT:-$(cd "$(dirname "$0")/../.." && pwd)}"
DAYS_OLD="${BACKUP_GC_DAYS:-30}"
LAST_NOTIFY_FILE="$PROJECT_ROOT/.claude/.last-backup-gc-notify"
NOTIFY_INTERVAL_DAYS=7

# 7일에 한 번만 알림 (스팸 방지)
if [ -f "$LAST_NOTIFY_FILE" ]; then
  last_epoch=$(stat -f %m "$LAST_NOTIFY_FILE" 2>/dev/null || stat -c %Y "$LAST_NOTIFY_FILE" 2>/dev/null || echo 0)
  now_epoch=$(date +%s)
  diff_days=$(( (now_epoch - last_epoch) / 86400 ))
  if [ "$diff_days" -lt "$NOTIFY_INTERVAL_DAYS" ]; then
    exit 0
  fi
fi

# 후보 식별 (find 결과를 변수에 저장)
backup_dirs=$(find "$PROJECT_ROOT" -maxdepth 2 -type d -name ".claude.backup-*" -mtime +$DAYS_OLD 2>/dev/null || true)
bak_files=$(find "$PROJECT_ROOT" -type f -name "*.pom.xml.bak" -mtime +$DAYS_OLD 2>/dev/null || true)
temp_dirs=$(find "$PROJECT_ROOT" -maxdepth 2 -type d -name ".temp" -mtime +$DAYS_OLD 2>/dev/null || true)

# 아무것도 없으면 조용히 종료 (fail-open)
if [ -z "$backup_dirs" ] && [ -z "$bak_files" ] && [ -z "$temp_dirs" ]; then
  touch "$LAST_NOTIFY_FILE" 2>/dev/null || true
  exit 0
fi

# 알림 출력 (stderr)
{
  echo ""
  echo "┌─── BACKUP GARBAGE COLLECTION ALERT ─────────────────┐"
  echo "│ ${DAYS_OLD}일 이상 경과한 백업/임시 파일이 발견됐습니다.       │"
  echo "│ 자동 삭제하지 않습니다 - 검토 후 수동 정리 권장.       │"
  echo "└─────────────────────────────────────────────────────┘"

  if [ -n "$backup_dirs" ]; then
    echo ""
    echo "[Backup directories - ${DAYS_OLD}d+ old]:"
    echo "$backup_dirs" | while read -r d; do
      size=$(du -sh "$d" 2>/dev/null | awk '{print $1}')
      echo "  - $d ($size)"
    done
  fi

  if [ -n "$bak_files" ]; then
    echo ""
    echo "[*.pom.xml.bak files - ${DAYS_OLD}d+ old]:"
    echo "$bak_files" | while read -r f; do echo "  - $f"; done
  fi

  if [ -n "$temp_dirs" ]; then
    echo ""
    echo "[.temp directories - ${DAYS_OLD}d+ old]:"
    echo "$temp_dirs" | while read -r d; do echo "  - $d"; done
  fi

  echo ""
  echo "Cleanup commands (review before running):"
  if [ -n "$backup_dirs" ]; then
    echo "  rm -rf <backup-dir>    # 디렉토리별 개별 검토 후"
  fi
  if [ -n "$bak_files" ]; then
    echo "  find . -name '*.pom.xml.bak' -mtime +$DAYS_OLD -delete"
  fi
  echo ""
} >&2

# 알림 시각 갱신
touch "$LAST_NOTIFY_FILE" 2>/dev/null || true
exit 0
