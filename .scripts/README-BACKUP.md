# Claude Code 설정 백업/복원 가이드

## 📋 개요

KiiPS 프로젝트의 Claude Code 설정을 안전하게 백업하고 복원하는 시스템입니다.

### 🔗 관련 문서

- **[재설치 가이드](./REINSTALL-GUIDE.md)** - Claude Code 재설치 시 설정 보존 방법
- **[재설치 체크리스트](./REINSTALL-CHECKLIST.md)** - 재설치 시 빠른 참조 카드
- **[빠른 시작](./BACKUP-QUICK-START.md)** - 백업/복원 빠른 가이드

### 백업 대상 파일

```
프로젝트 문서 (5개):
├── CLAUDE.md              # 메인 가이드
├── architecture.md        # 아키텍처 문서
├── api.md                 # API 명세
├── deployment.md          # 배포 가이드
└── troubleshooting.md     # 트러블슈팅

설정 파일 (2개):
├── .claudecode.json       # Claude Code 메인 설정
└── skill-rules.json       # Skill 활성화 규칙

Claude 디렉토리:
└── .claude/
    ├── agents/            # 커스텀 agents (2개)
    ├── commands/          # 커스텀 명령어 (7개)
    ├── skills/            # Skills (5개)
    ├── hooks/             # Hook 스크립트
    ├── memory/            # 메모리 파일
    ├── output-styles/     # 출력 스타일
    ├── settings.json      # Claude 설정
    ├── settings.local.json
    └── mcp.json           # MCP 서버 설정
```

---

## 🚀 빠른 시작

### 1. 백업 생성

```bash
# SVN 커밋 + 로컬 아카이브 생성 (권장)
./.scripts/claude-config-backup.sh backup

# 로컬 아카이브만 생성
./.scripts/claude-config-backup.sh backup-local
```

### 2. 백업 목록 확인

```bash
./.scripts/claude-config-backup.sh list
```

### 3. 복원

```bash
# 로컬 백업에서 복원 (대화형)
./.scripts/claude-config-backup.sh restore

# SVN 리비전에서 복원 (대화형)
./.scripts/claude-config-backup.sh restore-svn
```

### 4. JSON으로 내보내기

```bash
./.scripts/claude-config-backup.sh export
```

---

## 📚 상세 사용법

### 백업 전략

#### Primary: SVN 버전 관리
- **장점**: 팀 공유, 변경 이력 추적, 자동 버전 관리
- **사용 시기**: 주요 설정 변경 후, 정기 백업

```bash
# 백업 생성 (커밋 메시지 입력 가능)
./.scripts/claude-config-backup.sh backup

# 예시 출력:
# [1/4] Checking SVN status...
# [2/4] Checking for changes...
#    M .claudecode.json
#    M .claude/skills/kiips-feature-planner/SKILL.md
# [3/4] Committing to SVN...
# Enter commit message: Skills 업데이트 - feature planner 개선
# ✓ SVN commit successful!
# [4/4] Creating safety backup...
# ✓ Backup created: .claude-backups/claude-config-20251229_150530.tar.gz
```

#### Secondary: 로컬 아카이브
- **장점**: 빠른 복원, 오프라인 작업, SVN 없이도 가능
- **보관 정책**: 최근 10개 자동 유지

```bash
# 로컬 백업만 생성
./.scripts/claude-config-backup.sh backup-local
```

---

### 백업 목록 조회

```bash
./.scripts/claude-config-backup.sh list

# 출력 예시:
# Available backups:
#
# Local Backups:
#   Dec 29 15:05 - claude-config-20251229_150530.tar.gz (52K)
#   Dec 28 10:30 - claude-config-20251228_103045.tar.gz (51K)
#   Dec 27 18:20 - claude-config-20251227_182015.tar.gz (50K)
#
# SVN History (last 5 commits):
#   r1234 | user | 2025-12-29 15:05
#      [Claude Config] Skills 업데이트 - feature planner 개선
#   r1220 | user | 2025-12-28 10:30
#      [Claude Config] Auto-backup - 20251228_103045
```

---

### 복원 방법

#### 방법 1: 로컬 백업에서 복원

```bash
./.scripts/claude-config-backup.sh restore

# 대화형 프로세스:
# 1. 백업 목록 표시
# 2. 복원할 파일명 입력
# 3. 확인 (yes/no)
# 4. 현재 설정 안전 백업 생성
# 5. 복원 실행
```

**안전 기능**:
- 복원 전 자동으로 현재 설정 백업 (`pre-restore-XXXXXX.tar.gz`)
- 실수로 덮어쓰기 방지

#### 방법 2: SVN에서 복원

```bash
./.scripts/claude-config-backup.sh restore-svn

# 대화형 프로세스:
# 1. SVN 이력 표시 (최근 10개 커밋)
# 2. 리비전 번호 입력 (예: 1234)
# 3. 확인 (yes/no)
# 4. 현재 설정 안전 백업 생성
# 5. SVN revert 실행
```

---

### JSON Export/Import

#### Export (내보내기)

```bash
./.scripts/claude-config-backup.sh export

# 생성 파일: .claude-backups/claude-config-export-XXXXXX.json
```

**구조화된 JSON 형식**:
```json
{
  "export_date": "2025-12-29T15:05:30+09:00",
  "project": "KiiPS",
  "version": "2.0",
  "files": {
    "CLAUDE.md": "# CLAUDE.md\n\n...",
    ".claudecode.json": "{\n  \"version\": \"1.0\",\n...",
    ...
  },
  "metadata": {
    "total_files": 8,
    "backup_method": "export"
  }
}
```

**사용 사례**:
- 다른 프로젝트로 설정 이전
- 설정 템플릿 생성
- 프로그래밍 방식으로 설정 분석

#### Import (가져오기)

JSON export는 수동 복원 또는 커스텀 스크립트로 처리:

```bash
# 간단한 방법: jq 사용
cat claude-config-export-XXXXXX.json | jq -r '.files["CLAUDE.md"]' > CLAUDE.md
cat claude-config-export-XXXXXX.json | jq -r '.files[".claudecode.json"]' > .claudecode.json
```

---

## 🔄 자동화 설정

### 방법 1: Git Hooks (프로젝트 전환 시)

프로젝트를 Git으로 전환한다면:

```bash
# .git/hooks/pre-commit
#!/bin/bash
./.scripts/claude-config-backup.sh backup-local
```

### 방법 2: Cron Job (정기 백업)

```bash
# crontab -e
# 매일 오전 9시 자동 백업
0 9 * * * cd /Users/younghwankang/WORK/WORKSPACE/KiiPS && ./.scripts/claude-config-backup.sh backup-local

# 매주 월요일 오전 9시 SVN 백업
0 9 * * 1 cd /Users/younghwankang/WORK/WORKSPACE/KiiPS && ./.scripts/claude-config-backup.sh backup
```

### 방법 3: Claude Code Hook (자동 백업)

`.claudecode.json`에 추가:

```json
{
  "hooks": {
    "Stop": [
      {
        "type": "command",
        "command": "./.scripts/claude-config-backup.sh backup-local"
      }
    ]
  }
}
```

---

## 🛡️ 보안 고려사항

### 1. 민감 정보 제외

백업에 민감 정보가 포함되지 않도록 확인:

```bash
# .claude-backups/.gitignore (Git 사용 시)
*.tar.gz
*-export-*.json
pre-restore-*
pre-svn-restore-*
```

### 2. SVN Ignore 설정

```bash
svn propset svn:ignore "*.tar.gz
*-export-*.json" .claude-backups
```

### 3. 암호화 백업 (선택사항)

민감한 환경에서는 암호화 추가:

```bash
# 암호화 백업
tar -czf - .claudecode.json .claude/ | openssl enc -aes-256-cbc -salt -out backup-encrypted.tar.gz.enc

# 복호화
openssl enc -d -aes-256-cbc -in backup-encrypted.tar.gz.enc | tar -xzf -
```

---

## 📊 백업 정책 권장사항

### 빈도

| 상황 | 백업 방법 | 빈도 |
|------|-----------|------|
| **주요 설정 변경** | SVN 백업 | 즉시 |
| **일일 작업 종료** | 로컬 백업 | 매일 |
| **마일스톤 완료** | SVN + Export | 주요 시점 |
| **정기 백업** | 자동 로컬 백업 | 매일 09:00 |

### 보관 기간

- **로컬 백업**: 최근 10개 (스크립트 자동 관리)
- **SVN**: 무제한 (버전 관리 시스템)
- **Export JSON**: 수동 관리 (중요 마일스톤만)

---

## 🔧 트러블슈팅

### 문제 1: "permission denied" 오류

```bash
chmod +x ./.scripts/claude-config-backup.sh
```

### 문제 2: SVN 커밋 실패

```bash
# SVN 상태 확인
svn status

# 충돌 해결
svn resolve --accept working .claudecode.json

# 재시도
./.scripts/claude-config-backup.sh backup
```

### 문제 3: 백업 파일 용량 증가

```bash
# 오래된 백업 수동 정리
cd .claude-backups
ls -lt *.tar.gz | tail -n +6 | awk '{print $9}' | xargs rm -f

# 또는 전체 정리
rm -f claude-config-*.tar.gz
```

### 문제 4: 복원 후 설정 불일치

```bash
# 안전 백업에서 재복원
cd .claude-backups
ls -lt pre-restore-*.tar.gz | head -1

# 해당 파일로 다시 복원
./.scripts/claude-config-backup.sh restore
```

---

## 🎯 사용 시나리오

### 시나리오 1: 실험적 설정 테스트

```bash
# 1. 현재 설정 백업
./.scripts/claude-config-backup.sh backup

# 2. 실험적 변경 수행
# (Skills, Agents, Hooks 수정)

# 3. 문제 발생 시 복원
./.scripts/claude-config-backup.sh restore-svn
```

### 시나리오 2: 팀원과 설정 공유

```bash
# 1. 설정 백업 및 커밋
./.scripts/claude-config-backup.sh backup

# 2. 팀원은 최신 리비전으로 업데이트
svn update

# 3. 설정 적용 확인
cat .claudecode.json
```

### 시나리오 3: 새 환경으로 이전

```bash
# 원본 시스템:
./.scripts/claude-config-backup.sh export

# 새 시스템:
# 1. Export JSON 복사
# 2. 수동 복원 또는 Import 스크립트 사용
# 3. 권한 설정
chmod +x .scripts/*.sh
```

---

## 📖 추가 리소스

### 관련 문서
- [CLAUDE.md](../CLAUDE.md) - Claude Code 메인 가이드
- [architecture.md](../architecture.md) - KiiPS 아키텍처
- [deployment.md](../deployment.md) - 배포 가이드

### 스크립트 파일
- `claude-config-backup.sh` - 메인 백업/복원 스크립트
- `claude-config-restore.sh` - Import 스크립트 (선택)

### 백업 위치
- **SVN**: 프로젝트 저장소 내 버전 관리
- **로컬**: `.claude-backups/` 디렉토리
- **Export**: `.claude-backups/claude-config-export-*.json`

---

## ✅ 체크리스트

### 초기 설정
- [ ] 백업 스크립트 실행 권한 확인 (`chmod +x`)
- [ ] `.claude-backups/` 디렉토리 생성 확인
- [ ] SVN ignore 설정 완료
- [ ] 첫 백업 생성 및 테스트

### 정기 작업
- [ ] 주요 변경 후 즉시 백업
- [ ] 주간 SVN 백업 확인
- [ ] 백업 목록 정기 확인
- [ ] 복원 테스트 (월 1회)

### 긴급 복원
- [ ] 최신 백업 위치 확인
- [ ] 안전 백업 자동 생성 확인
- [ ] 복원 완료 후 동작 확인
- [ ] 팀원에게 복원 사실 공유

---

**Last Updated**: 2025-12-29
**Script Version**: 1.0
**Author**: KiiPS Development Team
