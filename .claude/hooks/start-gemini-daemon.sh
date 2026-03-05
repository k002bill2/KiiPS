#!/bin/bash
# Gemini Auto-Reviewer Daemon 시작/중지/상태 스크립트
#
# 사용법:
#   bash .claude/hooks/start-gemini-daemon.sh          # 시작
#   bash .claude/hooks/start-gemini-daemon.sh stop      # 중지
#   bash .claude/hooks/start-gemini-daemon.sh status    # 상태 확인
#   bash .claude/hooks/start-gemini-daemon.sh restart   # 재시작

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
BRIDGE_DIR="$PROJECT_ROOT/.claude/gemini-bridge"
PID_FILE="$BRIDGE_DIR/daemon.pid"
LOG_FILE="$BRIDGE_DIR/daemon.log"
DAEMON_JS="$SCRIPT_DIR/gemini-auto-reviewer.js"

mkdir -p "$BRIDGE_DIR"

is_running() {
  if [ ! -f "$PID_FILE" ]; then
    return 1
  fi
  local pid
  pid=$(cat "$PID_FILE" 2>/dev/null)
  if [ -z "$pid" ]; then
    return 1
  fi
  if kill -0 "$pid" 2>/dev/null; then
    return 0
  else
    rm -f "$PID_FILE"
    return 1
  fi
}

do_start() {
  if is_running; then
    local pid
    pid=$(cat "$PID_FILE")
    echo "Gemini auto-reviewer is already running (PID: $pid)"
    echo "Use 'stop' or 'restart' to manage."
    return 0
  fi

  echo "Starting Gemini Auto-Reviewer Daemon..."
  nohup node "$DAEMON_JS" >> "$LOG_FILE" 2>&1 &
  local new_pid=$!
  echo "$new_pid" > "$PID_FILE"

  sleep 1
  if kill -0 "$new_pid" 2>/dev/null; then
    echo "Gemini auto-reviewer started (PID: $new_pid)"
    echo "   Log: $LOG_FILE"
    echo "   PID file: $PID_FILE"
    echo ""
    echo "   Stop:    bash $0 stop"
    echo "   Status:  bash $0 status"
  else
    echo "Failed to start daemon. Check log:"
    tail -5 "$LOG_FILE" 2>/dev/null || echo "(no log)"
    return 1
  fi
}

do_stop() {
  if ! is_running; then
    echo "Gemini auto-reviewer is not running."
    return 0
  fi

  local pid
  pid=$(cat "$PID_FILE")
  echo "Stopping Gemini auto-reviewer (PID: $pid)..."
  kill "$pid" 2>/dev/null || true

  local count=0
  while kill -0 "$pid" 2>/dev/null && [ $count -lt 5 ]; do
    sleep 1
    count=$((count + 1))
  done

  if kill -0 "$pid" 2>/dev/null; then
    echo "Force killing..."
    kill -9 "$pid" 2>/dev/null || true
  fi

  rm -f "$PID_FILE"
  echo "Daemon stopped."
}

do_status() {
  if is_running; then
    local pid
    pid=$(cat "$PID_FILE")
    echo "Gemini auto-reviewer is running (PID: $pid)"

    if [ -f "$BRIDGE_DIR/gemini-state.json" ]; then
      echo ""
      echo "State:"
      python3 -m json.tool < "$BRIDGE_DIR/gemini-state.json" 2>/dev/null || cat "$BRIDGE_DIR/gemini-state.json"
    fi

    if [ -f "$BRIDGE_DIR/pending-files.txt" ]; then
      local pending_count
      pending_count=$(grep -c . "$BRIDGE_DIR/pending-files.txt" 2>/dev/null || echo "0")
      echo ""
      echo "Pending files: $pending_count"
    fi

    if [ -f "$LOG_FILE" ]; then
      echo ""
      echo "Recent log:"
      tail -5 "$LOG_FILE"
    fi
  else
    echo "Gemini auto-reviewer is NOT running."
    echo "   Start: bash $0"
  fi
}

do_restart() {
  do_stop
  sleep 1
  do_start
}

case "${1:-start}" in
  start)
    do_start
    ;;
  stop)
    do_stop
    ;;
  status)
    do_status
    ;;
  restart)
    do_restart
    ;;
  *)
    echo "Usage: $0 {start|stop|status|restart}"
    exit 1
    ;;
esac
