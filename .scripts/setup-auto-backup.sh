#!/bin/bash

#############################################
# Claude Config Auto Backup Setup
# 자동 백업 설정 도우미
#############################################

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

PROJECT_ROOT="/Users/younghwankang/WORK/WORKSPACE/KiiPS"
SCRIPT_DIR="${PROJECT_ROOT}/.scripts"

print_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Claude Config Auto Backup Setup         ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
}

setup_claudecode_hook() {
    echo -e "${YELLOW}Setting up Claude Code Stop Hook...${NC}"

    CLAUDECODE_FILE="${PROJECT_ROOT}/.claudecode.json"

    if [ ! -f "$CLAUDECODE_FILE" ]; then
        echo -e "${RED}✗ .claudecode.json not found${NC}"
        return 1
    fi

    # Backup original
    cp "$CLAUDECODE_FILE" "${CLAUDECODE_FILE}.bak"

    # Check if hook already exists
    if grep -q "claude-config-backup.sh" "$CLAUDECODE_FILE"; then
        echo -e "${YELLOW}⚠ Hook already exists in .claudecode.json${NC}"
        return 0
    fi

    # Add hook using jq
    if command -v jq &> /dev/null; then
        # Use jq for clean JSON manipulation
        jq '.hooks.Stop += [{
            "type": "command",
            "command": "bash .scripts/claude-config-backup.sh backup-local",
            "description": "Auto-backup Claude config on session end"
        }]' "$CLAUDECODE_FILE" > "${CLAUDECODE_FILE}.tmp"

        mv "${CLAUDECODE_FILE}.tmp" "$CLAUDECODE_FILE"

        echo -e "${GREEN}✓ Stop hook added to .claudecode.json${NC}"
        echo -e "${GREEN}  Backup will run automatically when Claude session ends${NC}"
    else
        echo -e "${YELLOW}⚠ jq not installed. Manual setup required.${NC}"
        echo -e "${YELLOW}  Add this to .claudecode.json 'hooks.Stop' array:${NC}"
        cat << 'EOF'

{
  "type": "command",
  "command": "bash .scripts/claude-config-backup.sh backup-local",
  "description": "Auto-backup Claude config on session end"
}
EOF
    fi
}

setup_cron() {
    echo -e "${YELLOW}Setting up Cron Jobs...${NC}"

    CRON_ENTRY_DAILY="0 9 * * * cd ${PROJECT_ROOT} && bash .scripts/claude-config-backup.sh backup-local >/dev/null 2>&1"
    CRON_ENTRY_WEEKLY="0 9 * * 1 cd ${PROJECT_ROOT} && bash .scripts/claude-config-backup.sh backup >/dev/null 2>&1"

    # Check existing crontab
    if crontab -l 2>/dev/null | grep -q "claude-config-backup"; then
        echo -e "${YELLOW}⚠ Cron jobs already exist${NC}"
        echo ""
        echo "Current cron entries:"
        crontab -l 2>/dev/null | grep "claude-config-backup"
        return 0
    fi

    echo ""
    echo "Proposed cron jobs:"
    echo "  1. Daily backup at 09:00 (local only)"
    echo "  2. Weekly backup on Monday 09:00 (SVN + local)"
    echo ""
    read -p "Add these cron jobs? (yes/no): " confirm

    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Skipping cron setup${NC}"
        return 0
    fi

    # Add to crontab
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY_DAILY") | crontab -
    (crontab -l 2>/dev/null; echo "$CRON_ENTRY_WEEKLY") | crontab -

    echo -e "${GREEN}✓ Cron jobs added${NC}"
    echo ""
    echo "Verify with: crontab -l"
}

setup_git_hook() {
    echo -e "${YELLOW}Setting up Git Pre-commit Hook...${NC}"

    GIT_HOOKS_DIR="${PROJECT_ROOT}/.git/hooks"

    if [ ! -d ".git" ]; then
        echo -e "${YELLOW}⚠ Not a Git repository. Skipping git hook setup.${NC}"
        echo -e "${YELLOW}  (Project currently uses SVN)${NC}"
        return 0
    fi

    mkdir -p "$GIT_HOOKS_DIR"

    HOOK_FILE="${GIT_HOOKS_DIR}/pre-commit"

    if [ -f "$HOOK_FILE" ]; then
        echo -e "${YELLOW}⚠ pre-commit hook already exists${NC}"
        read -p "Append backup command to existing hook? (yes/no): " confirm

        if [ "$confirm" != "yes" ]; then
            return 0
        fi

        echo "" >> "$HOOK_FILE"
        echo "# Claude Config Auto Backup" >> "$HOOK_FILE"
        echo "bash .scripts/claude-config-backup.sh backup-local" >> "$HOOK_FILE"
    else
        cat > "$HOOK_FILE" << 'EOF'
#!/bin/bash

# Claude Config Auto Backup
# Runs before each git commit

bash .scripts/claude-config-backup.sh backup-local

EOF
        chmod +x "$HOOK_FILE"
    fi

    echo -e "${GREEN}✓ Git pre-commit hook configured${NC}"
    echo -e "${GREEN}  Backup will run before each commit${NC}"
}

create_backup_reminder() {
    echo -e "${YELLOW}Creating backup reminder script...${NC}"

    REMINDER_FILE="${SCRIPT_DIR}/backup-reminder.sh"

    cat > "$REMINDER_FILE" << 'EOF'
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
EOF

    chmod +x "$REMINDER_FILE"

    echo -e "${GREEN}✓ Backup reminder created${NC}"
    echo -e "${GREEN}  Run: .scripts/backup-reminder.sh${NC}"
}

setup_svn_ignore() {
    echo -e "${YELLOW}Configuring SVN ignore for backup files...${NC}"

    cd "$PROJECT_ROOT"

    if [ ! -d ".claude-backups" ]; then
        mkdir -p .claude-backups
    fi

    # Set SVN ignore property
    svn propset svn:ignore "*.tar.gz
*-export-*.json
pre-restore-*
pre-svn-restore-*
pre-import-*" .claude-backups 2>/dev/null || {
        echo -e "${YELLOW}⚠ SVN propset failed (may not be under version control)${NC}"
        return 0
    }

    echo -e "${GREEN}✓ SVN ignore configured for .claude-backups/${NC}"
}

show_summary() {
    echo ""
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Setup Summary                            ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
    echo "Available commands:"
    echo "  .scripts/claude-config-backup.sh backup       - Full backup (SVN + local)"
    echo "  .scripts/claude-config-backup.sh backup-local - Local backup only"
    echo "  .scripts/claude-config-backup.sh list         - List backups"
    echo "  .scripts/claude-config-backup.sh restore      - Restore from backup"
    echo "  .scripts/claude-config-backup.sh export       - Export to JSON"
    echo ""
    echo "Automation configured:"
    if grep -q "claude-config-backup.sh" .claudecode.json 2>/dev/null; then
        echo "  ✓ Claude Code Stop Hook"
    fi
    if crontab -l 2>/dev/null | grep -q "claude-config-backup"; then
        echo "  ✓ Cron Jobs (daily + weekly)"
    fi
    if [ -f ".git/hooks/pre-commit" ] && grep -q "claude-config-backup" .git/hooks/pre-commit 2>/dev/null; then
        echo "  ✓ Git Pre-commit Hook"
    fi
    echo ""
    echo "First backup location:"
    ls -lh .claude-backups/*.tar.gz 2>/dev/null | tail -1 || echo "  (No backups yet)"
    echo ""
}

#############################################
# Main
#############################################

print_header

echo "This script will set up automatic backups for Claude Code configuration."
echo "Choose automation options:"
echo ""
echo "1. Claude Code Stop Hook (recommended)"
echo "2. Cron Jobs (daily + weekly)"
echo "3. Git Pre-commit Hook"
echo "4. All of the above"
echo "5. Manual setup (skip automation)"
echo ""

read -p "Enter choice (1-5): " choice

case $choice in
    1)
        setup_claudecode_hook
        ;;
    2)
        setup_cron
        ;;
    3)
        setup_git_hook
        ;;
    4)
        setup_claudecode_hook
        setup_cron
        setup_git_hook
        ;;
    5)
        echo -e "${YELLOW}Skipping automation setup${NC}"
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

# Always do these
create_backup_reminder
setup_svn_ignore

# Create first backup
echo ""
read -p "Create first backup now? (yes/no): " create_backup

if [ "$create_backup" = "yes" ]; then
    bash "${SCRIPT_DIR}/claude-config-backup.sh" backup-local
fi

show_summary

echo -e "${GREEN}Setup complete!${NC}"
