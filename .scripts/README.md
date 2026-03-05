# KiiPS Scripts & Documentation Index

## 📚 문서 구조

### 백업/복원 시스템

#### 1. 빠른 참조
- **[BACKUP-QUICK-START.md](./BACKUP-QUICK-START.md)** - 5분 만에 시작하는 백업 시스템
  - 핵심 명령어
  - 주요 시나리오
  - 30초 퀵 가이드

#### 2. 상세 가이드
- **[README-BACKUP.md](./README-BACKUP.md)** - 백업/복원 완전 가이드
  - 모든 기능 상세 설명
  - 자동화 설정
  - 트러블슈팅
  - 보안 고려사항

#### 3. 재설치 가이드
- **[REINSTALL-GUIDE.md](./REINSTALL-GUIDE.md)** - Claude Code 재설치 완전 가이드
  - 설정 저장 위치 이해
  - 재설치 방법별 영향 범위
  - 안전한 재설치 절차
  - 복원 방법
  - 시나리오별 권장 방법

- **[REINSTALL-CHECKLIST.md](./REINSTALL-CHECKLIST.md)** - 재설치 빠른 체크리스트
  - 인쇄용 체크리스트
  - 단계별 명령어
  - 긴급 복원 가이드

---

## 🛠️ 스크립트 도구

### 백업 관리
- **[claude-config-backup.sh](./claude-config-backup.sh)** - 메인 백업/복원 스크립트
  ```bash
  bash .scripts/claude-config-backup.sh [COMMAND]

  Commands:
    backup        - SVN 커밋 + 로컬 백업
    backup-local  - 로컬 백업만
    list          - 백업 목록 보기
    restore       - 로컬 백업에서 복원
    restore-svn   - SVN 리비전에서 복원
    export        - JSON으로 내보내기
    help          - 도움말
  ```

### Import 도구
- **[claude-config-import.sh](./claude-config-import.sh)** - JSON Import 스크립트
  ```bash
  bash .scripts/claude-config-import.sh [COMMAND] [FILE]

  Commands:
    import [file]     - JSON에서 복원
    selective [file]  - 선택적 복원
    list              - Export 파일 목록
    help              - 도움말
  ```

### 자동화 설정
- **[setup-auto-backup.sh](./setup-auto-backup.sh)** - 자동 백업 설정 도우미
  ```bash
  bash .scripts/setup-auto-backup.sh

  Options:
    1. Claude Code Stop Hook
    2. Cron Jobs (daily + weekly)
    3. Git Pre-commit Hook
    4. All of the above
  ```

---

## 🚀 빠른 시작

### 첫 백업 생성 (30초)
```bash
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh backup-local
```

### 자동화 설정 (5분)
```bash
bash .scripts/setup-auto-backup.sh
# 옵션 1 선택: Claude Code Stop Hook (권장)
```

### Claude Code 재설치 전
```bash
# 1. 백업
bash .scripts/claude-config-backup.sh backup

# 2. 재설치 가이드 참조
cat .scripts/REINSTALL-GUIDE.md

# 3. 체크리스트 사용
cat .scripts/REINSTALL-CHECKLIST.md
```

---

## 📖 사용 시나리오

### 시나리오 1: 일일 작업 종료
```bash
bash .scripts/claude-config-backup.sh backup-local
```

### 시나리오 2: 주요 설정 변경 후
```bash
bash .scripts/claude-config-backup.sh backup
# 커밋 메시지 입력
```

### 시나리오 3: Claude Code 업데이트 전
```bash
# 1. 백업
bash .scripts/claude-config-backup.sh backup

# 2. 재설치 체크리스트 참조
cat .scripts/REINSTALL-CHECKLIST.md

# 3. 업데이트
claude update

# 4. 확인
claude --version
claude
/help
```

### 시나리오 4: 설정 복원
```bash
bash .scripts/claude-config-backup.sh restore
# 또는
bash .scripts/claude-config-backup.sh restore-svn
```

### 시나리오 5: 다른 프로젝트로 복사
```bash
# Export
bash .scripts/claude-config-backup.sh export

# Import (새 프로젝트)
bash .scripts/claude-config-import.sh import
```

---

## 🔍 문서 선택 가이드

### "어떤 문서를 봐야 하나요?"

| 상황 | 문서 | 예상 시간 |
|------|------|-----------|
| **백업 처음 시작** | BACKUP-QUICK-START.md | 5분 |
| **백업 상세 이해** | README-BACKUP.md | 20분 |
| **Claude 재설치 예정** | REINSTALL-GUIDE.md | 15분 |
| **재설치 진행 중** | REINSTALL-CHECKLIST.md | 3분 |
| **스크립트 사용법** | 각 스크립트의 --help | 2분 |

---

## 📁 파일 구조

```
.scripts/
├── README.md                         ← 이 파일 (인덱스)
│
├── 📖 백업 문서
│   ├── BACKUP-QUICK-START.md         ← 빠른 시작 (5분)
│   └── README-BACKUP.md              ← 상세 가이드 (20분)
│
├── 📖 재설치 문서
│   ├── REINSTALL-GUIDE.md            ← 완전 가이드 (15분)
│   └── REINSTALL-CHECKLIST.md        ← 체크리스트 (3분)
│
├── 📖 LSP 설정
│   └── LSP-SETUP-GUIDE.md            ← Java LSP 설정 가이드
│
└── 🛠️ 실행 스크립트
    ├── claude-config-backup.sh       ← 백업/복원
    ├── claude-config-import.sh       ← JSON Import
    └── setup-auto-backup.sh          ← 자동화 설정
```

---

## 💡 권장 워크플로우

### 초기 설정 (한 번만)
```bash
# 1. 첫 백업 생성
bash .scripts/claude-config-backup.sh backup-local

# 2. 자동화 설정
bash .scripts/setup-auto-backup.sh

# 3. 문서 읽기
cat .scripts/BACKUP-QUICK-START.md
```

### 일상 작업
```bash
# 작업 시작
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS

# 작업...

# 작업 종료 (자동 백업 설정 시 불필요)
bash .scripts/claude-config-backup.sh backup-local
```

### 주요 변경 시
```bash
# 중요한 설정 변경 후
bash .scripts/claude-config-backup.sh backup
# 커밋 메시지: "Skills 업데이트 - ..."
```

### Claude 재설치 시
```bash
# 1. 체크리스트 참조
cat .scripts/REINSTALL-CHECKLIST.md

# 2. 백업
bash .scripts/claude-config-backup.sh backup

# 3. 재설치
claude update

# 4. 확인
claude --version
```

---

## 🆘 긴급 상황

### 설정이 날아갔어요!
```bash
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh restore
# 최신 백업 선택 → yes
```

### 백업이 없어요!
```bash
# SVN에서 복원
svn update
# 또는
bash .scripts/claude-config-backup.sh restore-svn
```

### 스크립트가 작동 안 해요!
```bash
# 권한 설정
chmod +x .scripts/*.sh

# 줄바꿈 문자 수정
sed -i '' 's/\r$//' .scripts/*.sh
```

---

## 📞 추가 도움말

### 명령어 도움말
```bash
# 백업 스크립트
bash .scripts/claude-config-backup.sh help

# Import 스크립트
bash .scripts/claude-config-import.sh help
```

### 관련 프로젝트 문서
- [CLAUDE.md](../CLAUDE.md) - KiiPS Claude Code 메인 가이드
- [architecture.md](../architecture.md) - 시스템 아키텍처
- [deployment.md](../deployment.md) - 배포 가이드

---

## ✅ 체크리스트

### 초기 설정 완료
- [ ] 첫 백업 생성
- [ ] 자동화 설정
- [ ] 백업 목록 확인
- [ ] 복원 테스트 (선택)

### 정기 확인
- [ ] 백업 정상 생성 중
- [ ] 최근 10개 유지
- [ ] SVN 커밋 이력 확인

---

**Last Updated**: 2025-12-29
**Version**: 1.0
**Maintained by**: KiiPS Development Team
