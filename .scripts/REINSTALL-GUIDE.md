# Claude Code 재설치 가이드

> **KiiPS 프로젝트 설정 보존을 위한 완전 가이드**

---

## 📚 목차

1. [설정 저장 위치 이해](#-설정-저장-위치-이해)
2. [재설치 시 영향 범위](#-재설치-시-영향-범위)
3. [재설치 방법별 가이드](#-재설치-방법별-가이드)
4. [안전한 재설치 절차](#-안전한-재설치-절차)
5. [복원 절차](#-복원-절차)
6. [트러블슈팅](#-트러블슈팅)
7. [체크리스트](#-체크리스트)

---

## 📂 설정 저장 위치 이해

### 1. 프로젝트 설정 (Project-Level)

**위치**: `/Users/younghwankang/WORK/WORKSPACE/KiiPS/`

```
KiiPS/
├── .claudecode.json              # 프로젝트 권한/훅 설정
├── CLAUDE.md                     # 프로젝트 가이드
├── architecture.md               # 아키텍처 문서
├── api.md                        # API 명세
├── deployment.md                 # 배포 가이드
├── troubleshooting.md            # 트러블슈팅
├── skill-rules.json              # Skill 활성화 규칙
│
└── .claude/                      # Claude 프로젝트 설정
    ├── agents/                   # 커스텀 에이전트
    │   ├── kiips-architect.md
    │   └── kiips-developer.md
    │
    ├── skills/                   # 커스텀 Skills
    │   ├── kiips-maven-builder/
    │   ├── kiips-service-deployer/
    │   ├── kiips-api-tester/
    │   ├── kiips-log-analyzer/
    │   └── kiips-feature-planner/
    │
    ├── commands/                 # 커스텀 명령어
    │   ├── build-service.md
    │   ├── deploy-service.md
    │   ├── service-status.md
    │   ├── view-logs.md
    │   ├── review.md
    │   ├── dev-docs.md
    │   └── update-dev-docs.md
    │
    ├── hooks/                    # Hook 스크립트
    │   ├── README.md
    │   └── update-reminder.sh
    │
    ├── memory/                   # 메모리 파일
    │   ├── kiips-quick-reference.md
    │   └── common-patterns.md
    │
    ├── output-styles/            # 출력 스타일
    │   └── efficient.md
    │
    ├── settings.json             # 프로젝트별 설정
    ├── settings.local.json       # 로컬 설정
    ├── mcp.json                  # MCP 서버 설정
    └── README.md                 # Claude 설정 README
```

**특징**:
- ✅ **SVN으로 버전 관리됨**
- ✅ **팀원들과 공유됨**
- ✅ **프로젝트와 함께 이동**
- ✅ **Claude Code 재설치와 무관하게 유지**

---

### 2. 전역 설정 (Global-Level)

**위치**: `/Users/younghwankang/`

```
~/
├── .claude.json                  # 전역 설정 파일 (61KB)
├── .claude.json.backup           # 자동 백업
│
└── .claude/                      # Claude 전역 디렉토리
    ├── debug/                    # 디버그 로그
    ├── file-history/             # 파일 변경 이력
    ├── history.jsonl             # 대화 히스토리 (52KB)
    ├── ide/                      # IDE 통합
    ├── plugins/                  # 설치된 플러그인
    │   ├── claude-code-plugins@anthropic/
    │   └── ...
    ├── projects/                 # 프로젝트 인덱스
    ├── session-env/              # 세션 환경 변수
    ├── settings.json             # 전역 세팅
    ├── shell-snapshots/          # 셸 스냅샷
    ├── stats-cache.json          # 통계 캐시
    ├── statsig/                  # 분석 데이터
    ├── statusline-command.sh     # 상태바 커맨드
    └── .mcp.json                 # 전역 MCP 설정
```

**특징**:
- ⚠️ **사용자별 설정** (팀 공유 안 됨)
- ⚠️ **Claude Code 앱이 관리**
- ⚠️ **재설치 방법에 따라 유지 여부 다름**

---

### 3. Claude Code 실행 파일

**위치**: `/Users/younghwankang/.bun/bin/`

```
~/.bun/bin/
└── claude                        # Claude Code CLI (2.0.76)
```

**특징**:
- ❌ **재설치 시 항상 교체됨**
- ❌ **설정 정보 포함 안 됨**

---

## 🔄 재설치 시 영향 범위

### 유지되는 항목 (✅ Safe)

| 항목 | 위치 | 유지 여부 | 이유 |
|------|------|-----------|------|
| `.claudecode.json` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `CLAUDE.md` 등 문서 | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `.claude/skills/` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `.claude/agents/` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `.claude/commands/` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `.claude/hooks/` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `.claude/memory/` | 프로젝트 | ✅ **100%** | 프로젝트 파일 |
| `~/.claude.json` | 전역 | ⚠️ **조건부** | 수동 삭제 않는 한 유지 |
| `~/.claude/` | 전역 | ⚠️ **조건부** | 수동 삭제 않는 한 유지 |

### 삭제되는 항목 (❌ Lost)

| 항목 | 위치 | 재설치 시 | 비고 |
|------|------|-----------|------|
| Claude CLI 실행파일 | `~/.bun/bin/` | ❌ **삭제 후 재설치** | 설정 무관 |
| 진행 중인 대화 | 메모리 | ❌ **종료** | 세션 재시작 필요 |

---

## 📋 재설치 방법별 가이드

### 방법 1: 일반 업데이트 (⭐⭐⭐⭐⭐ 가장 안전)

```bash
# Claude CLI 사용
claude update

# 또는 Bun 사용
bun update -g claude-code
```

**영향**:
- ✅ 모든 프로젝트 설정 유지
- ✅ 모든 전역 설정 유지
- ✅ 백업 불필요 (하지만 권장)

**권장 대상**:
- 정기 업데이트
- 버그 수정 적용
- 새 기능 사용

---

### 방법 2: 재설치 (기본) (⭐⭐⭐⭐ 안전)

```bash
# 1. 기존 제거
bun remove -g claude-code

# 2. 재설치
bun install -g claude-code

# 3. 확인
claude --version
```

**영향**:
- ✅ 모든 프로젝트 설정 유지
- ✅ 전역 설정 유지 (`~/.claude/` 건드리지 않음)
- ⚠️ 백업 권장

**권장 대상**:
- 심각한 버그 발생
- 클린 재설치 필요
- 업데이트 실패 시

---

### 방법 3: 완전 삭제 후 재설치 (⭐⭐⭐ 주의 필요)

```bash
# ⚠️ 주의: 전역 설정도 삭제됨!

# 1. Claude Code 제거
bun remove -g claude-code

# 2. 전역 설정 삭제 (신중하게!)
rm -rf ~/.claude
rm ~/.claude.json

# 3. 재설치
bun install -g claude-code
```

**영향**:
- ✅ 프로젝트 설정 유지
- ❌ 전역 설정 삭제
- ❌ 대화 히스토리 삭제
- ❌ 플러그인 설정 삭제
- ⚠️ **백업 필수!**

**권장 대상**:
- 전역 설정 문제 발생
- 완전히 새로 시작
- 설정 충돌 해결

---

### 방법 4: 시스템 이전/포맷 (⭐⭐ 백업 필수)

```bash
# 기존 시스템에서:
# 1. 백업 생성
bash .scripts/claude-config-backup.sh backup
bash .scripts/claude-config-backup.sh export

# 2. 백업 파일 외부 저장
cp -r .claude-backups/ /external/drive/
cp -r .claude/ /external/drive/

# 새 시스템에서:
# 1. Claude Code 설치
bun install -g claude-code

# 2. 프로젝트 복원 (SVN)
svn checkout https://svn.example.com/kiips

# 3. 백업 복원
bash .scripts/claude-config-backup.sh restore
```

**영향**:
- ❌ 모든 설정 초기화
- ✅ 백업으로 복원 가능
- ⚠️ **백업 + Export 필수!**

**권장 대상**:
- 새 컴퓨터로 이전
- OS 재설치
- 팀원 온보딩

---

## 🛡️ 안전한 재설치 절차

### Step-by-Step 가이드

#### 1단계: 재설치 전 준비 (5분)

```bash
# 1.1 현재 버전 확인
claude --version
# 출력: 2.0.76 (Claude Code)

# 1.2 프로젝트 디렉토리로 이동
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS

# 1.3 백업 생성 (필수!)
bash .scripts/claude-config-backup.sh backup

# 1.4 백업 확인
bash .scripts/claude-config-backup.sh list
# 출력 확인:
#   Local Backups:
#   Dec 29 10:21 - claude-config-20251229_102115.tar.gz (57K)
#
#   SVN History (last 5 commits):
#   r1234 | user | 2025-12-29 10:21

# 1.5 프로젝트 설정 존재 확인
ls -la .claude/
ls -la .claudecode.json
# ✅ 파일들이 모두 존재하는지 확인

# 1.6 (선택) JSON Export (다른 환경으로 이전 시)
bash .scripts/claude-config-backup.sh export
```

**체크포인트**:
- [ ] 백업 파일 생성 확인
- [ ] SVN 커밋 확인 (팀 프로젝트)
- [ ] 프로젝트 설정 파일 존재 확인

---

#### 2단계: Claude Code 재설치 (2분)

**옵션 A: 일반 업데이트 (권장)**

```bash
# 가장 안전한 방법
claude update

# 또는
bun update -g claude-code
```

**옵션 B: 재설치**

```bash
# 1. 제거
bun remove -g claude-code

# 2. 재설치
bun install -g claude-code

# 3. 버전 확인
claude --version
```

**옵션 C: 완전 재설치 (주의!)**

```bash
# ⚠️ 전역 설정도 삭제됨!
bun remove -g claude-code
rm -rf ~/.claude
rm ~/.claude.json
bun install -g claude-code
```

---

#### 3단계: 재설치 후 확인 (3분)

```bash
# 3.1 Claude 버전 확인
claude --version
# 예상 출력: 2.0.80 (또는 최신 버전)

# 3.2 프로젝트로 이동
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS

# 3.3 프로젝트 설정 확인
ls -la .claude/
# ✅ 모든 디렉토리 존재하는지 확인:
#    - agents/
#    - skills/
#    - commands/
#    - hooks/
#    - memory/

# 3.4 .claudecode.json 확인
cat .claudecode.json | jq '.version'
# 출력: "1.0"

# 3.5 Skills 작동 확인
claude
# Claude 프롬프트에서:
# /help
# ✅ KiiPS Skills 표시되는지 확인:
#    - kiips-maven-builder
#    - kiips-service-deployer
#    - kiips-api-tester
#    - kiips-log-analyzer
#    - kiips-feature-planner

# 3.6 테스트 명령어 실행
# 예: build-service 명령어 테스트
# /build-service --help

# 3.7 전역 설정 확인 (완전 재설치한 경우)
ls -la ~/.claude/
cat ~/.claude/settings.json
```

**체크포인트**:
- [ ] Claude 버전 업데이트 확인
- [ ] 프로젝트 설정 유지 확인
- [ ] Skills 작동 확인
- [ ] Commands 작동 확인
- [ ] Agents 로드 확인

---

#### 4단계: 문제 발생 시 복원 (2분)

```bash
# 4.1 백업 목록 확인
bash .scripts/claude-config-backup.sh list

# 4.2 복원 실행 (대화형)
bash .scripts/claude-config-backup.sh restore
# 프롬프트:
#   Enter backup filename to restore (or 'cancel'):
#   claude-config-20251229_102115.tar.gz
#
#   ⚠ This will overwrite current configuration!
#   Are you sure? (yes/no): yes
#
# ✅ Restore complete!

# 4.3 Claude 재시작
# (현재 세션 종료 후 다시 시작)

# 4.4 확인
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
claude
# /help
# ✅ 모든 설정 복원됨!
```

---

## 🔄 복원 절차

### 시나리오 1: 프로젝트 설정만 복원

```bash
# 로컬 백업에서 복원
bash .scripts/claude-config-backup.sh restore

# 또는 SVN에서 복원
bash .scripts/claude-config-backup.sh restore-svn
```

### 시나리오 2: JSON에서 선택적 복원

```bash
# 전체 복원
bash .scripts/claude-config-import.sh import

# 선택적 복원
bash .scripts/claude-config-import.sh selective claude-config-export-*.json
# 복원할 파일 선택:
#   1. CLAUDE.md
#   2. .claudecode.json
#   3. .claude/skills/...
# 입력: 1 2 3
```

### 시나리오 3: 팀원 설정 동기화

```bash
# 팀원 A (설정 변경 후)
bash .scripts/claude-config-backup.sh backup
# SVN 커밋 메시지: "Skills 업데이트 - feature planner 개선"

# 팀원 B (설정 동기화)
svn update
# ✅ 자동으로 최신 .claude/ 디렉토리 다운로드
# ✅ .claudecode.json 업데이트
# ✅ 모든 Skills, Agents, Commands 동기화
```

---

## 🔧 트러블슈팅

### 문제 1: 재설치 후 Skills가 작동하지 않음

**증상**:
```bash
claude
> /help
# KiiPS Skills가 표시되지 않음
```

**원인**:
- `.claudecode.json` 또는 `.claude/` 디렉토리 인식 안 됨

**해결**:

```bash
# 1. 현재 디렉토리 확인
pwd
# ✅ /Users/younghwankang/WORK/WORKSPACE/KiiPS 인지 확인

# 2. .claudecode.json 존재 확인
ls -la .claudecode.json

# 3. .claude/ 디렉토리 확인
ls -la .claude/

# 4. 권한 확인
chmod 644 .claudecode.json
chmod -R 755 .claude/

# 5. Claude 재시작
# (세션 종료 후 다시 시작)

# 6. 여전히 안 되면 복원
bash .scripts/claude-config-backup.sh restore
```

---

### 문제 2: 전역 설정이 초기화됨

**증상**:
```bash
ls ~/.claude/
# directory not found
```

**원인**:
- `~/.claude/` 디렉토리를 실수로 삭제

**해결**:

```bash
# 1. Claude Code 재시작 (자동 생성)
claude --version

# 2. 기본 설정 생성됨
ls ~/.claude/
# ✅ 디렉토리 생성됨

# 3. 프로젝트 설정은 그대로 유지
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
ls .claude/
# ✅ 프로젝트 설정은 영향 없음

# 4. 전역 설정이 백업에 있었다면 복원 가능
# (일반적으로 프로젝트 설정만으로 충분)
```

---

### 문제 3: SVN 커밋 충돌

**증상**:
```bash
svn commit -m "Update"
# svn: E155015: Commit failed (details follow):
# svn: E155015: Aborting commit: '/path/to/.claude' remains in conflict
```

**원인**:
- `.claude/` 파일이 SVN 충돌 상태

**해결**:

```bash
# 1. 충돌 상태 확인
svn status | grep ^C

# 2. 충돌 해결 (작업 버전 사용)
svn resolve --accept working .claude/

# 3. 또는 특정 파일만
svn resolve --accept working .claude/settings.json

# 4. 재커밋
svn commit -m "Resolve conflict"

# 5. 또는 백업에서 복원 후 재커밋
bash .scripts/claude-config-backup.sh restore
svn commit -m "Restore from backup"
```

---

### 문제 4: 백업 복원 후에도 문제 지속

**증상**:
- 복원했지만 여전히 설정이 이상함

**해결**:

```bash
# 1. 여러 백업 시도
bash .scripts/claude-config-backup.sh list
# 다른 시점의 백업 선택

# 2. SVN에서 특정 리비전으로 복원
bash .scripts/claude-config-backup.sh restore-svn
# 리비전 번호 입력

# 3. 안전 백업 활용
cd .claude-backups/
ls -lt pre-restore-*.tar.gz
# 가장 최근 pre-restore 백업으로 복원

# 4. 완전 초기화 (최후 수단)
# - .claude/ 디렉토리 삭제
# - SVN에서 최신 버전 체크아웃
svn revert -R .claude/
svn update

# 5. 백업에서 재복원
bash .scripts/claude-config-backup.sh restore
```

---

### 문제 5: JSON Import 실패

**증상**:
```bash
bash .scripts/claude-config-import.sh import
# ✗ Invalid JSON file
```

**원인**:
- JSON 파일 손상

**해결**:

```bash
# 1. JSON 유효성 검사
jq empty claude-config-export-*.json
# 에러 메시지 확인

# 2. 다른 Export 파일 시도
ls .claude-backups/claude-config-export-*.json
# 다른 파일로 시도

# 3. 로컬 tar.gz 백업 사용
bash .scripts/claude-config-backup.sh restore
# 더 안정적

# 4. SVN에서 직접 복원
svn update
# 가장 확실한 방법
```

---

## ✅ 체크리스트

### 재설치 전 체크리스트

#### 필수 작업

- [ ] **백업 생성**
  ```bash
  bash .scripts/claude-config-backup.sh backup
  ```

- [ ] **백업 확인**
  ```bash
  bash .scripts/claude-config-backup.sh list
  ```

- [ ] **현재 버전 기록**
  ```bash
  claude --version > ~/claude-version-before.txt
  ```

- [ ] **프로젝트 설정 존재 확인**
  ```bash
  ls .claude/ .claudecode.json
  ```

#### 권장 작업

- [ ] **SVN 커밋** (팀 프로젝트)
  ```bash
  svn commit -m "[Pre-reinstall] Backup current config"
  ```

- [ ] **JSON Export** (다른 환경 이전 시)
  ```bash
  bash .scripts/claude-config-backup.sh export
  ```

- [ ] **외부 백업 복사** (중요 시스템)
  ```bash
  cp -r .claude-backups/ /external/drive/
  ```

- [ ] **스크린샷 촬영** (현재 설정 화면)

---

### 재설치 후 체크리스트

#### 즉시 확인

- [ ] **Claude 버전**
  ```bash
  claude --version
  ```

- [ ] **프로젝트 디렉토리**
  ```bash
  cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
  ```

- [ ] **.claude/ 존재**
  ```bash
  ls -la .claude/
  ```

- [ ] **.claudecode.json 존재**
  ```bash
  cat .claudecode.json
  ```

#### 기능 확인

- [ ] **Skills 로드**
  ```bash
  # Claude에서:
  /help
  # KiiPS Skills 표시되는지 확인
  ```

- [ ] **Commands 작동**
  ```bash
  # 예: build-service
  /build-service --help
  ```

- [ ] **Agents 작동**
  ```bash
  # KiiPS Developer, KiiPS Architect 표시되는지 확인
  ```

- [ ] **Hooks 작동**
  ```bash
  # SessionStart hook 실행되는지 확인
  ```

#### 상세 확인

- [ ] **각 Skill 개별 테스트**
  - [ ] kiips-maven-builder
  - [ ] kiips-service-deployer
  - [ ] kiips-api-tester
  - [ ] kiips-log-analyzer
  - [ ] kiips-feature-planner

- [ ] **각 Command 테스트**
  - [ ] build-service
  - [ ] deploy-service
  - [ ] service-status
  - [ ] view-logs
  - [ ] review
  - [ ] dev-docs
  - [ ] update-dev-docs

- [ ] **MCP 서버 연결**
  ```bash
  cat .claude/mcp.json
  # serena, context7 등 확인
  ```

---

### 복원 시 체크리스트

#### 복원 전

- [ ] **현재 설정 자동 백업 확인**
  - [ ] `pre-restore-*.tar.gz` 생성됨

- [ ] **복원할 백업 선택**
  - [ ] 올바른 시점의 백업인지 확인

- [ ] **복원 방법 선택**
  - [ ] 로컬 백업 (빠름)
  - [ ] SVN (안정적)
  - [ ] JSON Import (선택적)

#### 복원 후

- [ ] **모든 파일 복원 확인**
  ```bash
  ls .claude/
  ls .claudecode.json
  ```

- [ ] **Claude 재시작**

- [ ] **기능 재확인**
  - [ ] Skills
  - [ ] Commands
  - [ ] Agents

- [ ] **문제 없으면 안전 백업 정리**
  ```bash
  # 선택적으로 pre-restore-* 삭제
  cd .claude-backups/
  ls pre-restore-*.tar.gz
  ```

---

## 📊 재설치 방법 비교표

| 방법 | 프로젝트 설정 | 전역 설정 | 백업 필요 | 복원 시간 | 위험도 | 권장도 |
|------|---------------|-----------|-----------|-----------|--------|--------|
| **claude update** | ✅ 유지 | ✅ 유지 | ❌ 불필요 | - | ⭐ 안전 | ⭐⭐⭐⭐⭐ |
| **bun update** | ✅ 유지 | ✅ 유지 | ❌ 불필요 | - | ⭐ 안전 | ⭐⭐⭐⭐⭐ |
| **재설치 (기본)** | ✅ 유지 | ✅ 유지 | ⚠️ 권장 | 2분 | ⭐⭐ 낮음 | ⭐⭐⭐⭐ |
| **완전 재설치** | ✅ 유지 | ❌ 삭제 | ✅ 필수 | 5분 | ⭐⭐⭐ 중간 | ⭐⭐⭐ |
| **시스템 이전** | ❌ 삭제 | ❌ 삭제 | ✅ 필수 | 10분 | ⭐⭐⭐⭐ 높음 | ⭐⭐ |

---

## 🎯 시나리오별 권장 방법

### 시나리오 1: 정기 업데이트

**상황**: 새 버전 출시, 정기 업데이트

**권장 방법**: `claude update`

```bash
# 백업 (선택)
bash .scripts/claude-config-backup.sh backup-local

# 업데이트
claude update

# 확인
claude --version
```

**특징**:
- ✅ 가장 안전
- ✅ 빠름 (1분)
- ✅ 백업 불필요

---

### 시나리오 2: 버그 수정

**상황**: Claude에서 이상 동작, 버그 발생

**권장 방법**: 재설치 (기본)

```bash
# 1. 백업 (권장)
bash .scripts/claude-config-backup.sh backup

# 2. 재설치
bun remove -g claude-code
bun install -g claude-code

# 3. 확인
claude --version
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
claude
/help
```

**특징**:
- ⚠️ 백업 권장
- ✅ 설정 유지
- ✅ 클린 설치

---

### 시나리오 3: 설정 초기화

**상황**: 설정이 꼬여서 완전 초기화 필요

**권장 방법**: 완전 재설치

```bash
# 1. 백업 (필수!)
bash .scripts/claude-config-backup.sh backup

# 2. 완전 삭제
bun remove -g claude-code
rm -rf ~/.claude
rm ~/.claude.json

# 3. 재설치
bun install -g claude-code

# 4. 프로젝트 설정 확인
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
ls .claude/  # ✅ 여전히 존재

# 5. 필요시 전역 설정 복원
# (일반적으로 불필요, 프로젝트 설정으로 충분)
```

**특징**:
- ✅ 완전 초기화
- ✅ 프로젝트 설정 유지
- ⚠️ 전역 설정 삭제 (대화 히스토리 등)

---

### 시나리오 4: 새 컴퓨터로 이전

**상황**: 새 맥북 구매, 개발 환경 이전

**권장 방법**: SVN + 백업 복원

```bash
# === 기존 컴퓨터 ===

# 1. 백업 생성
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh backup
bash .scripts/claude-config-backup.sh export

# 2. 백업 파일 외부 저장
cp -r .claude-backups/ /Volumes/USB/
# 또는 클라우드에 업로드

# === 새 컴퓨터 ===

# 1. Claude Code 설치
bun install -g claude-code

# 2. 프로젝트 체크아웃
svn checkout https://svn.example.com/kiips
cd KiiPS

# 3. 백업 스크립트 권한 설정
chmod +x .scripts/*.sh

# 4. 백업 복원 (필요시)
bash .scripts/claude-config-backup.sh restore
# 또는
bash .scripts/claude-config-import.sh import

# 5. 확인
claude
/help
# ✅ 모든 KiiPS Skills 로드됨!
```

**특징**:
- ✅ SVN으로 자동 동기화
- ✅ 백업으로 보험
- ✅ 팀 설정 일치

---

### 시나리오 5: 팀원 온보딩

**상황**: 새 개발자 합류, KiiPS 프로젝트 설정 필요

**권장 방법**: SVN Checkout

```bash
# === 새 팀원 ===

# 1. Claude Code 설치
bun install -g claude-code

# 2. 프로젝트 체크아웃
svn checkout https://svn.example.com/kiips
cd KiiPS

# 3. 스크립트 권한 설정
chmod +x .scripts/*.sh

# 4. 첫 백업 생성 (습관화)
bash .scripts/claude-config-backup.sh backup-local

# 5. 자동화 설정 (선택)
bash .scripts/setup-auto-backup.sh

# 6. 확인
claude
/help
# ✅ KiiPS Skills 즉시 사용 가능!
#    - kiips-maven-builder
#    - kiips-service-deployer
#    - kiips-api-tester
#    - kiips-log-analyzer
#    - kiips-feature-planner

# 7. 테스트 빌드
/build-service KiiPS-Common
# ✅ 바로 작동!
```

**특징**:
- ✅ SVN에 모든 설정 포함
- ✅ 별도 설정 불필요
- ✅ 즉시 사용 가능

---

## 📖 추가 참고 자료

### 관련 문서

- **백업/복원 상세 가이드**: `.scripts/README-BACKUP.md`
- **빠른 시작 가이드**: `.scripts/BACKUP-QUICK-START.md`
- **프로젝트 메인 가이드**: `CLAUDE.md`
- **아키텍처 문서**: `architecture.md`

### 스크립트 도움말

```bash
# 백업 스크립트
bash .scripts/claude-config-backup.sh help

# Import 스크립트
bash .scripts/claude-config-import.sh help

# 자동화 설정
bash .scripts/setup-auto-backup.sh
```

### 외부 리소스

- Claude Code 공식 문서: https://docs.claude.ai/code
- Bun 패키지 관리: https://bun.sh/docs/cli/install
- SVN 가이드: https://svnbook.red-bean.com/

---

## 🔐 보안 고려사항

### 백업 파일 관리

```bash
# .claude-backups/ SVN ignore 설정
svn propset svn:ignore "*.tar.gz
*-export-*.json
pre-restore-*
pre-svn-restore-*
pre-import-*" .claude-backups

# 확인
svn propget svn:ignore .claude-backups
```

### 민감 정보 확인

```bash
# API 키, 비밀번호 검색
grep -r "api_key\|password\|secret\|token" .claude/

# 발견 시 제거 후 백업
# (KiiPS 프로젝트는 현재 민감 정보 없음)
```

---

## 📝 변경 이력

| 날짜 | 버전 | 변경 내용 |
|------|------|-----------|
| 2025-12-29 | 1.0 | 초기 문서 작성 |

---

## 💬 도움말

문제가 발생하거나 질문이 있으면:

1. **트러블슈팅 섹션** 확인
2. **백업에서 복원** 시도
3. **팀 리더에게 문의**
4. **SVN 최신 버전으로 업데이트**

**긴급 복원 핫라인**:
```bash
# 무조건 작동하는 복원 방법
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh restore
```

---

**Last Updated**: 2025-12-29
**Document Version**: 1.0
**Author**: KiiPS Development Team
