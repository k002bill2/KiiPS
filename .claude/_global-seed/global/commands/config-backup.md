---
description: Claude Code 설정 백업/복원 시스템 - backup, restore, verify, diff, list 지원
argument-hint: backup [name] | restore [name] | verify [name] | diff [b1] [b2] | list
---

# Claude Code Config Backup System

KiiPS 프로젝트의 Claude Code 설정 백업/복원/검증/비교 시스템입니다.

**저장 위치**: `.claude/backups/` (프로젝트 내)

## 서브커맨드 분기

인자 `$ARGUMENTS`를 파싱하여 서브커맨드를 결정합니다:

| 인자 | 동작 |
|------|------|
| `backup [name]` | 백업 생성 |
| `restore <name>` | 백업 복원 |
| `verify <name>` | 백업 검증 |
| `diff [b1] [b2]` | 백업 비교 |
| `list` | 백업 목록 |
| (없음) | 도움말 표시 |

---

## 1. backup [custom-name]

### 1.1 환경 준비

```bash
# 백업 디렉토리 생성
mkdir -p .claude/backups
```

### 1.2 백업명 생성

포맷: `{YYYYMMDD}_{HHMMSS}_KiiPS[_custom-name]`

### 1.3 Manifest 생성

`.claude/` 디렉토리를 스캔하여 메타데이터를 수집합니다:

```bash
COMMANDS_COUNT=$(find .claude/commands -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
SKILLS_COUNT=$(find .claude/skills -maxdepth 1 -type d 2>/dev/null | wc -l | tr -d ' ')
AGENTS_COUNT=$(find .claude/agents -maxdepth 1 -name "*.md" 2>/dev/null | wc -l | tr -d ' ')
HOOKS_COUNT=$(find .claude/hooks -name "*.js" -o -name "*.sh" 2>/dev/null | wc -l | tr -d ' ')
TOTAL_FILES=$(find .claude -type f 2>/dev/null | wc -l | tr -d ' ')
TOTAL_SIZE=$(du -sh .claude 2>/dev/null | cut -f1)
SVN_REV=$(svn info --show-item revision 2>/dev/null || echo "N/A")
```

Write `backup-manifest.json` with all stats.

### 1.4 아카이브 생성

```bash
tar -czf "${BACKUP_DIR}/claude-config.tar.gz" \
  --exclude='.claude/backups' \
  --exclude='.claude/telemetry' \
  --exclude='.claude/.context-state.json' \
  -C "$(pwd)" .claude/
```

### 1.5 체크섬 생성

```bash
cd .claude && find . -type f -not -path './backups/*' -exec shasum -a 256 {} \; > "${BACKUP_DIR}/checksums.sha256" && cd ..
```

---

## 2. restore <backup-name>

### 2.1 안전 백업 생성 (현재 설정)

```bash
cp -r .claude ".claude.bak.$(date +%Y%m%d_%H%M%S)"
```

### 2.2 settings.local.json 보존

```bash
cp .claude/settings.local.json /tmp/claude/settings.local.json.bak
tar -xzf "${BACKUP_DIR}/claude-config.tar.gz" -C "$(pwd)"
cp /tmp/claude/settings.local.json.bak .claude/settings.local.json
```

---

## 3. list

```bash
ls -lt .claude/backups/ 2>/dev/null || echo "No backups found"
```

---

## 도움말

```
Claude Code Config Backup System (KiiPS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Usage: /config-backup <command> [options]

Commands:
  backup [name]     Create a new backup (optional custom name)
  restore <name>    Restore from a backup
  verify <name>     Verify backup integrity
  diff [b1] [b2]    Compare backups or backup vs current
  list              List all available backups

Examples:
  /config-backup backup pre-refactor
  /config-backup list
  /config-backup restore 20260206_143022_KiiPS
```

$ARGUMENTS
