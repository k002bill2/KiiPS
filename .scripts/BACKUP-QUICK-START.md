# Claude Config Backup - Quick Start Guide

## 🚀 30초 시작하기

```bash
# 1. 첫 백업 생성
bash .scripts/claude-config-backup.sh backup-local

# 2. 자동화 설정 (선택)
bash .scripts/setup-auto-backup.sh

# 3. 완료! 이제 자동으로 백업됩니다
```

---

## 📖 핵심 명령어

### 백업하기

```bash
# SVN 커밋 + 로컬 아카이브 (권장)
bash .scripts/claude-config-backup.sh backup

# 로컬 아카이브만 (빠름)
bash .scripts/claude-config-backup.sh backup-local

# JSON으로 내보내기 (이전용)
bash .scripts/claude-config-backup.sh export
```

### 확인하기

```bash
# 백업 목록 보기
bash .scripts/claude-config-backup.sh list

# 백업 파일 직접 확인
ls -lh .claude-backups/
```

### 복원하기

```bash
# 로컬 백업에서 복원 (대화형)
bash .scripts/claude-config-backup.sh restore

# SVN 리비전에서 복원 (대화형)
bash .scripts/claude-config-backup.sh restore-svn

# JSON에서 복원
bash .scripts/claude-config-import.sh import
```

---

## 🎯 주요 시나리오

### 시나리오 1: 매일 작업 종료 시

```bash
# 간단한 로컬 백업
bash .scripts/claude-config-backup.sh backup-local
```

**자동화**: Stop Hook 설정 시 자동 실행

### 시나리오 2: 주요 설정 변경 후

```bash
# SVN 커밋 + 로컬 백업
bash .scripts/claude-config-backup.sh backup
# 커밋 메시지 입력: "Skills 업데이트 - feature planner 개선"
```

**포함 내용**:
- `.claudecode.json` 변경사항
- Skills, Agents, Commands 수정
- 문서 업데이트

### 시나리오 3: 실수로 설정 삭제

```bash
# 1. 백업 목록 확인
bash .scripts/claude-config-backup.sh list

# 2. 최신 백업으로 복원
bash .scripts/claude-config-backup.sh restore
# 파일명 입력: claude-config-20251229_102115.tar.gz
# 확인: yes

# 3. 복원 완료! (안전 백업 자동 생성됨)
```

### 시나리오 4: 다른 프로젝트로 설정 복사

```bash
# 원본 프로젝트:
bash .scripts/claude-config-backup.sh export
# 생성: .claude-backups/claude-config-export-XXXXXX.json

# 파일 복사 후 새 프로젝트:
bash .scripts/claude-config-import.sh import claude-config-export-XXXXXX.json
```

---

## ⚙️ 자동화 옵션

### Option 1: Claude Code Hook (추천)

**설정**: `.claudecode.json`에 자동 추가
```bash
bash .scripts/setup-auto-backup.sh
# 선택: 1 (Claude Code Stop Hook)
```

**작동**: Claude 세션 종료 시 자동 백업

### Option 2: Cron Job

**설정**: 매일/매주 자동 백업
```bash
bash .scripts/setup-auto-backup.sh
# 선택: 2 (Cron Jobs)
```

**스케줄**:
- 매일 09:00 - 로컬 백업
- 매주 월요일 09:00 - SVN 백업

### Option 3: 수동 관리

정기적으로 실행:
```bash
# 주말마다
bash .scripts/claude-config-backup.sh backup

# 또는 alias 추가 (~/.zshrc)
alias claude-backup='bash /path/to/KiiPS/.scripts/claude-config-backup.sh backup-local'
```

---

## 📊 백업 정책 권장

| 상황 | 방법 | 빈도 |
|------|------|------|
| 일일 작업 | `backup-local` | 매일 |
| 주요 변경 | `backup` (SVN) | 즉시 |
| 정기 백업 | Cron/Hook | 자동 |
| 마일스톤 | `export` (JSON) | 필요 시 |

---

## 🛡️ 안전 기능

✅ **복원 전 자동 백업**: 실수 방지
✅ **최대 10개 보관**: 디스크 공간 절약
✅ **SVN 버전 관리**: 무제한 이력
✅ **타임스탬프**: 백업 시점 명확

---

## 🔧 문제 해결

### "Permission denied"

```bash
chmod +x .scripts/claude-config-backup.sh
chmod +x .scripts/claude-config-import.sh
chmod +x .scripts/setup-auto-backup.sh
```

### 백업이 너무 크다

```bash
# 오래된 백업 정리 (자동)
bash .scripts/claude-config-backup.sh backup-local

# 수동 정리
cd .claude-backups
rm -f $(ls -t *.tar.gz | tail -n +6)
```

### SVN 커밋 실패

```bash
# 상태 확인
svn status

# 충돌 해결
svn resolve --accept working .claudecode.json

# 재시도
bash .scripts/claude-config-backup.sh backup
```

---

## 📁 파일 구조

```
KiiPS/
├── .scripts/
│   ├── claude-config-backup.sh      ← 메인 스크립트
│   ├── claude-config-import.sh      ← Import 도구
│   ├── setup-auto-backup.sh         ← 자동화 설정
│   ├── BACKUP-QUICK-START.md        ← 이 파일
│   └── README-BACKUP.md             ← 상세 가이드
│
└── .claude-backups/                 ← 백업 저장소
    ├── claude-config-YYYYMMDD_HHMMSS.tar.gz
    ├── claude-config-export-*.json
    └── pre-restore-*.tar.gz         (안전 백업)
```

---

## 🎓 추가 학습

- **상세 가이드**: `.scripts/README-BACKUP.md`
- **스크립트 도움말**: `bash .scripts/claude-config-backup.sh help`
- **Import 도움말**: `bash .scripts/claude-config-import.sh help`

---

## ✅ 체크리스트

**초기 설정**:
- [ ] 스크립트 실행 권한 확인
- [ ] 첫 백업 생성
- [ ] 자동화 옵션 선택
- [ ] 복원 테스트 (선택)

**정기 작업**:
- [ ] 주요 변경 후 백업
- [ ] 월 1회 복원 테스트
- [ ] 분기 1회 설정 정리

---

**Last Updated**: 2025-12-29
**Version**: 1.0
