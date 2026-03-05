#!/bin/bash

# Backup Reminder
# Shows reminder if last backup is older than 7 days

BACKUP_DIR="/Users/younghwankang/WORK/WORKSPACE/KiiPS/.claude-backups"
LAST_BACKUP=$(ls -t "$BACKUP_DIR"/claude-config-*.tar.gz 2>/dev/null | head -1)

if [ -z "$LAST_BACKUP" ]; then
    echo "⚠️  No backups found. Run: .scripts/claude-config-backup.sh backup"
    exit 0
fi

LAST_MODIFIED=$(stat -f %m "$LAST_BACKUP" 2>/dev/null || stat -c %Y "$LAST_BACKUP" 2>/dev/null)
CURRENT_TIME=$(date +%s)
DAYS_OLD=$(( ($CURRENT_TIME - $LAST_MODIFIED) / 86400 ))

if [ $DAYS_OLD -gt 7 ]; then
    echo "⚠️  Last Claude config backup is ${DAYS_OLD} days old"
    echo "   Consider running: .scripts/claude-config-backup.sh backup"
fi
