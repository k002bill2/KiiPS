#!/bin/bash

#############################################
# KiiPS Claude Code Configuration Backup
# 로컬 백업 스크립트
#############################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="/Users/younghwankang/WORK/WORKSPACE/KiiPS"
BACKUP_DIR="${PROJECT_ROOT}/.claude-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="claude-config-${TIMESTAMP}"

# Files and directories to backup
BACKUP_ITEMS=(
    ".claudecode.json"
    "CLAUDE.md"
    "architecture.md"
    "api.md"
    "deployment.md"
    "troubleshooting.md"
    "skill-rules.json"
    ".claude/"
)

#############################################
# Functions
#############################################

print_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  KiiPS Claude Config Backup Manager      ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
}

backup_to_local() {
    echo -e "${YELLOW}Creating local backup archive...${NC}"

    # Create backup directory if not exists
    mkdir -p "$BACKUP_DIR"

    # Create backup archive
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

    cd "$PROJECT_ROOT"
    tar -czf "$BACKUP_PATH" "${BACKUP_ITEMS[@]}" 2>/dev/null || true

    # Get file size
    SIZE=$(du -h "$BACKUP_PATH" | cut -f1)

    echo -e "${GREEN}✓ Backup created: ${BACKUP_PATH}${NC}"
    echo -e "${GREEN}  Size: ${SIZE}${NC}"

    # Keep only last 10 backups
    cleanup_old_backups
}

cleanup_old_backups() {
    echo -e "${YELLOW}Cleaning up old backups (keeping last 10)...${NC}"

    cd "$BACKUP_DIR"
    ls -t claude-config-*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f 2>/dev/null || true

    REMAINING=$(ls -1 claude-config-*.tar.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}✓ ${REMAINING} backups retained${NC}"
}

list_backups() {
    echo -e "${YELLOW}Available backups:${NC}\n"

    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}No backups found${NC}"
        return
    fi

    cd "$BACKUP_DIR"

    echo -e "${GREEN}Local Backups:${NC}"
    ls -lht claude-config-*.tar.gz 2>/dev/null | awk '{print "  " $6" "$7" "$8" - "$9" ("$5")"}' || echo "  None"
}

restore_from_backup() {
    list_backups
    echo ""
    read -p "Enter backup filename to restore (or 'cancel'): " backup_file

    if [ "$backup_file" = "cancel" ]; then
        echo -e "${YELLOW}Restore cancelled${NC}"
        return
    fi

    RESTORE_PATH="${BACKUP_DIR}/${backup_file}"

    if [ ! -f "$RESTORE_PATH" ]; then
        echo -e "${RED}✗ Backup file not found: ${RESTORE_PATH}${NC}"
        return 1
    fi

    echo -e "${YELLOW}⚠ This will overwrite current configuration!${NC}"
    read -p "Are you sure? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Restore cancelled${NC}"
        return
    fi

    # Create safety backup before restore
    echo -e "${YELLOW}Creating safety backup of current config...${NC}"
    SAFETY_BACKUP="${BACKUP_DIR}/pre-restore-${TIMESTAMP}.tar.gz"
    cd "$PROJECT_ROOT"
    tar -czf "$SAFETY_BACKUP" "${BACKUP_ITEMS[@]}" 2>/dev/null || true

    # Restore
    echo -e "${YELLOW}Restoring from backup...${NC}"
    tar -xzf "$RESTORE_PATH" -C "$PROJECT_ROOT"

    echo -e "${GREEN}✓ Restore complete!${NC}"
    echo -e "${GREEN}  Safety backup: ${SAFETY_BACKUP}${NC}"
}

export_config() {
    echo -e "${YELLOW}Exporting configuration to JSON...${NC}"

    EXPORT_FILE="${BACKUP_DIR}/claude-config-export-${TIMESTAMP}.json"

    cd "$PROJECT_ROOT"

    # Create structured JSON export
    cat > "$EXPORT_FILE" << EOF
{
  "export_date": "$(date -Iseconds)",
  "project": "KiiPS",
  "version": "2.0",
  "files": {
EOF

    # Add file contents
    first=true
    for item in "${BACKUP_ITEMS[@]}"; do
        if [ -f "$item" ]; then
            if [ "$first" = false ]; then
                echo "," >> "$EXPORT_FILE"
            fi
            first=false

            filename=$(basename "$item")
            echo -n "    \"$filename\": " >> "$EXPORT_FILE"
            jq -Rs . "$item" >> "$EXPORT_FILE"
        fi
    done

    cat >> "$EXPORT_FILE" << EOF

  },
  "metadata": {
    "total_files": $(echo "${BACKUP_ITEMS[@]}" | wc -w),
    "backup_method": "export"
  }
}
EOF

    SIZE=$(du -h "$EXPORT_FILE" | cut -f1)
    echo -e "${GREEN}✓ Export complete: ${EXPORT_FILE}${NC}"
    echo -e "${GREEN}  Size: ${SIZE}${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [COMMAND]

Commands:
  backup        - Create local backup archive
  list          - List available backups
  restore       - Restore from local backup
  export        - Export configuration to JSON
  help          - Show this help message

Examples:
  $0 backup           # Create new backup
  $0 list             # Show all backups
  $0 restore          # Interactive restore from local backup

Configuration files backed up:
EOF
    for item in "${BACKUP_ITEMS[@]}"; do
        echo "  - $item"
    done
}

#############################################
# Main
#############################################

print_header

case "${1:-}" in
    backup)
        backup_to_local
        ;;
    list)
        list_backups
        ;;
    restore)
        restore_from_backup
        ;;
    export)
        export_config
        ;;
    help|--help|-h)
        show_usage
        ;;
    *)
        echo -e "${YELLOW}No command specified. Use 'help' for usage.${NC}\n"
        show_usage
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}Done!${NC}"
