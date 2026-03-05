#!/bin/bash

#############################################
# Claude Config JSON Import Script
# JSON export 파일에서 설정 복원
#############################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/Users/younghwankang/WORK/WORKSPACE/KiiPS"
BACKUP_DIR="${PROJECT_ROOT}/.claude-backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

print_header() {
    echo -e "${GREEN}╔═══════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║  Claude Config JSON Import                ║${NC}"
    echo -e "${GREEN}╚═══════════════════════════════════════════╝${NC}"
    echo ""
}

list_exports() {
    echo -e "${YELLOW}Available export files:${NC}\n"

    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${RED}No backup directory found${NC}"
        return 1
    fi

    cd "$BACKUP_DIR"

    if ! ls claude-config-export-*.json 1> /dev/null 2>&1; then
        echo -e "${RED}No export files found${NC}"
        return 1
    fi

    ls -lht claude-config-export-*.json | awk '{print "  " $6" "$7" "$8" - "$9" ("$5")"}'
}

import_from_json() {
    local json_file="$1"

    if [ ! -f "$json_file" ]; then
        echo -e "${RED}✗ File not found: ${json_file}${NC}"
        return 1
    fi

    # Validate JSON
    if ! jq empty "$json_file" 2>/dev/null; then
        echo -e "${RED}✗ Invalid JSON file${NC}"
        return 1
    fi

    echo -e "${YELLOW}Import Summary:${NC}"
    echo "  Project: $(jq -r '.project' "$json_file")"
    echo "  Version: $(jq -r '.version' "$json_file")"
    echo "  Date: $(jq -r '.export_date' "$json_file")"
    echo "  Files: $(jq -r '.metadata.total_files' "$json_file")"
    echo ""

    # List files
    echo -e "${YELLOW}Files to import:${NC}"
    jq -r '.files | keys[]' "$json_file" | while read -r filename; do
        echo "  - $filename"
    done
    echo ""

    read -p "Proceed with import? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        echo -e "${YELLOW}Import cancelled${NC}"
        return
    fi

    # Create safety backup
    echo -e "${YELLOW}Creating safety backup...${NC}"
    SAFETY_BACKUP="${BACKUP_DIR}/pre-import-${TIMESTAMP}.tar.gz"
    cd "$PROJECT_ROOT"

    tar -czf "$SAFETY_BACKUP" \
        .claudecode.json \
        CLAUDE.md \
        architecture.md \
        api.md \
        deployment.md \
        troubleshooting.md \
        skill-rules.json \
        .claude/ \
        2>/dev/null || true

    echo -e "${GREEN}✓ Safety backup: ${SAFETY_BACKUP}${NC}"

    # Import files
    echo -e "${YELLOW}Importing files...${NC}"

    cd "$PROJECT_ROOT"

    # Import each file
    jq -r '.files | to_entries[] | @json' "$json_file" | while read -r entry; do
        filename=$(echo "$entry" | jq -r '.key')
        content=$(echo "$entry" | jq -r '.value')

        echo -n "  Importing $filename... "

        # Write file
        echo "$content" > "$filename"

        echo -e "${GREEN}✓${NC}"
    done

    echo ""
    echo -e "${GREEN}✓ Import complete!${NC}"
    echo -e "${GREEN}  Safety backup: ${SAFETY_BACKUP}${NC}"
}

interactive_import() {
    list_exports

    if [ $? -ne 0 ]; then
        exit 1
    fi

    echo ""
    read -p "Enter export filename (or 'cancel'): " filename

    if [ "$filename" = "cancel" ]; then
        echo -e "${YELLOW}Import cancelled${NC}"
        exit 0
    fi

    IMPORT_FILE="${BACKUP_DIR}/${filename}"
    import_from_json "$IMPORT_FILE"
}

selective_import() {
    local json_file="$1"

    if [ ! -f "$json_file" ]; then
        echo -e "${RED}✗ File not found: ${json_file}${NC}"
        return 1
    fi

    echo -e "${YELLOW}Available files in export:${NC}\n"

    jq -r '.files | keys[] | "  \(.)"' "$json_file" | nl

    echo ""
    read -p "Enter file numbers to import (space-separated, or 'all'): " selection

    if [ "$selection" = "all" ]; then
        import_from_json "$json_file"
        return
    fi

    # Create safety backup
    echo -e "${YELLOW}Creating safety backup...${NC}"
    SAFETY_BACKUP="${BACKUP_DIR}/pre-selective-import-${TIMESTAMP}.tar.gz"
    cd "$PROJECT_ROOT"
    tar -czf "$SAFETY_BACKUP" .claudecode.json .claude/ 2>/dev/null || true

    echo -e "${YELLOW}Importing selected files...${NC}"

    for num in $selection; do
        filename=$(jq -r '.files | keys[]' "$json_file" | sed -n "${num}p")
        content=$(jq -r ".files[\"$filename\"]" "$json_file")

        echo -n "  Importing $filename... "
        echo "$content" > "$PROJECT_ROOT/$filename"
        echo -e "${GREEN}✓${NC}"
    done

    echo ""
    echo -e "${GREEN}✓ Selective import complete!${NC}"
}

show_usage() {
    cat << EOF
Usage: $0 [COMMAND] [FILE]

Commands:
  import [file]     - Import from JSON export file (interactive if no file)
  list              - List available export files
  selective [file]  - Selectively import specific files
  help              - Show this help message

Examples:
  $0 import                                    # Interactive import
  $0 import claude-config-export-20251229.json # Direct import
  $0 selective claude-config-export-20251229.json
  $0 list                                      # List exports

EOF
}

#############################################
# Main
#############################################

print_header

case "${1:-}" in
    import)
        if [ -n "${2:-}" ]; then
            import_from_json "$2"
        else
            interactive_import
        fi
        ;;
    list)
        list_exports
        ;;
    selective)
        if [ -n "${2:-}" ]; then
            selective_import "$2"
        else
            echo -e "${RED}✗ File parameter required for selective import${NC}"
            show_usage
            exit 1
        fi
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
