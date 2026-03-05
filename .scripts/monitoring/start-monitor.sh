#!/bin/bash
#
# KiiPS Log Monitor Starter Script
#
# Usage:
#   bash start-monitor.sh              # Start daemon in foreground
#   bash start-monitor.sh --background # Start daemon in background
#   bash start-monitor.sh --stop       # Stop background daemon
#   bash start-monitor.sh --status     # Check daemon status
#

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DAEMON_SCRIPT="$SCRIPT_DIR/log-watcher-daemon.js"
PID_FILE="$SCRIPT_DIR/monitor.pid"
LOG_FILE="$SCRIPT_DIR/monitor.log"

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0;m'

# Functions
start_foreground() {
    echo -e "${GREEN}🚀 Starting KiiPS Log Monitor (foreground)...${NC}"
    echo ""

    # Check if daemon script exists
    if [ ! -f "$DAEMON_SCRIPT" ]; then
        echo -e "${RED}❌ Daemon script not found: $DAEMON_SCRIPT${NC}"
        exit 1
    fi

    # Run daemon
    node "$DAEMON_SCRIPT"
}

start_background() {
    echo -e "${GREEN}🚀 Starting KiiPS Log Monitor (background)...${NC}"

    # Check if already running
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")

        if ps -p "$PID" > /dev/null 2>&1; then
            echo -e "${YELLOW}⚠️  Daemon already running (PID: $PID)${NC}"
            exit 1
        else
            echo -e "${YELLOW}⚠️  Removing stale PID file${NC}"
            rm "$PID_FILE"
        fi
    fi

    # Start daemon in background
    nohup node "$DAEMON_SCRIPT" > "$LOG_FILE" 2>&1 &
    PID=$!

    # Save PID
    echo "$PID" > "$PID_FILE"

    sleep 2

    # Verify daemon is running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Daemon started successfully${NC}"
        echo -e "   PID: $PID"
        echo -e "   Log: $LOG_FILE"
        echo ""
        echo -e "💡 Commands:"
        echo -e "   • View logs: tail -f $LOG_FILE"
        echo -e "   • Check status: bash $0 --status"
        echo -e "   • Stop daemon: bash $0 --stop"
    else
        echo -e "${RED}❌ Failed to start daemon${NC}"
        rm "$PID_FILE"
        exit 1
    fi
}

stop_daemon() {
    echo -e "${YELLOW}🛑 Stopping KiiPS Log Monitor...${NC}"

    if [ ! -f "$PID_FILE" ]; then
        echo -e "${YELLOW}⚠️  Daemon not running (no PID file)${NC}"
        exit 0
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Daemon not running (stale PID)${NC}"
        rm "$PID_FILE"
        exit 0
    fi

    # Send SIGTERM
    kill "$PID"

    # Wait for process to exit
    for i in {1..10}; do
        if ! ps -p "$PID" > /dev/null 2>&1; then
            break
        fi
        sleep 1
    done

    # Force kill if still running
    if ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Force killing daemon...${NC}"
        kill -9 "$PID"
    fi

    rm "$PID_FILE"
    echo -e "${GREEN}✅ Daemon stopped${NC}"
}

check_status() {
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📊 KiiPS Log Monitor Status"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    if [ ! -f "$PID_FILE" ]; then
        echo -e "${RED}❌ Daemon not running${NC}"
        echo ""
        echo "💡 Start with: bash $0 --background"
        return 1
    fi

    PID=$(cat "$PID_FILE")

    if ! ps -p "$PID" > /dev/null 2>&1; then
        echo -e "${RED}❌ Daemon not running (stale PID: $PID)${NC}"
        rm "$PID_FILE"
        return 1
    fi

    echo -e "${GREEN}✅ Daemon running${NC}"
    echo ""
    echo "PID: $PID"

    # Process info
    ps -p "$PID" -o pid,ppid,user,%cpu,%mem,etime,command | tail -n +2

    echo ""
    echo "Log file: $LOG_FILE"

    if [ -f "$LOG_FILE" ]; then
        echo ""
        echo "━━━ Last 10 log lines ━━━"
        tail -10 "$LOG_FILE"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

show_help() {
    cat <<EOF
KiiPS Log Monitor - Management Script

Usage:
    bash $0 [OPTION]

Options:
    (no option)      Start daemon in foreground
    --background     Start daemon in background
    --stop           Stop background daemon
    --status         Check daemon status
    --help           Show this help message

Examples:
    # Start in foreground (Ctrl+C to stop)
    bash $0

    # Start in background
    bash $0 --background

    # View logs
    tail -f $LOG_FILE

    # Stop daemon
    bash $0 --stop

Files:
    Daemon: $DAEMON_SCRIPT
    PID:    $PID_FILE
    Log:    $LOG_FILE

EOF
}

# Main
case "${1:-}" in
    --background)
        start_background
        ;;
    --stop)
        stop_daemon
        ;;
    --status)
        check_status
        ;;
    --help)
        show_help
        ;;
    "")
        start_foreground
        ;;
    *)
        echo -e "${RED}❌ Unknown option: $1${NC}"
        echo ""
        show_help
        exit 1
        ;;
esac
