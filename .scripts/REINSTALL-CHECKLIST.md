# Claude Code 재설치 빠른 체크리스트

> **인쇄하거나 화면에 띄워두고 사용하세요!**

---

## 🔴 재설치 전 (5분) - 필수!

```bash
# ✅ Step 1: 백업 생성
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh backup

# ✅ Step 2: 백업 확인
bash .scripts/claude-config-backup.sh list

# ✅ Step 3: 현재 버전 기록
claude --version
```

**체크리스트**:
- [ ] 백업 파일 생성됨 (57KB 이상)
- [ ] SVN 커밋 확인 (팀 프로젝트)
- [ ] .claude/ 디렉토리 존재 확인

---

## 🟡 재설치 실행 (2분)

### 방법 A: 일반 업데이트 ⭐ 권장

```bash
claude update
# 또는
bun update -g claude-code
```

### 방법 B: 재설치

```bash
bun remove -g claude-code
bun install -g claude-code
```

### 방법 C: 완전 재설치 ⚠️ 주의

```bash
bun remove -g claude-code
rm -rf ~/.claude
rm ~/.claude.json
bun install -g claude-code
```

**체크리스트**:
- [ ] 설치 완료 메시지 확인
- [ ] 에러 없이 완료

---

## 🟢 재설치 후 확인 (3분)

```bash
# ✅ Step 1: 버전 확인
claude --version

# ✅ Step 2: 프로젝트 이동
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS

# ✅ Step 3: 설정 파일 확인
ls -la .claude/
ls -la .claudecode.json

# ✅ Step 4: Claude 시작
claude

# ✅ Step 5: Skills 확인
# /help
# KiiPS Skills 표시되는지 확인
```

**체크리스트**:
- [ ] Claude 버전 업데이트됨
- [ ] .claude/ 존재
- [ ] .claudecode.json 존재
- [ ] /help에서 KiiPS Skills 보임
  - [ ] kiips-maven-builder
  - [ ] kiips-service-deployer
  - [ ] kiips-api-tester
  - [ ] kiips-log-analyzer
  - [ ] kiips-feature-planner

---

## 🔴 문제 발생 시 복원 (2분)

```bash
# 방법 1: 로컬 백업 복원
bash .scripts/claude-config-backup.sh restore
# 파일명 입력: claude-config-XXXXXXXX.tar.gz
# 확인: yes

# 방법 2: SVN 복원
bash .scripts/claude-config-backup.sh restore-svn
# 리비전 입력: 1234
# 확인: yes

# 방법 3: 최후 수단
svn revert -R .claude/
svn update
```

**체크리스트**:
- [ ] 복원 완료 메시지
- [ ] Claude 재시작
- [ ] /help에서 Skills 확인

---

## 📋 전체 플로우 요약

```
재설치 전
   ↓
백업 생성 ← 필수!
   ↓
재설치 실행
   ↓
설정 확인
   ↓
작동 테스트
   ↓
✅ 완료!

(문제 시)
   ↓
백업 복원
   ↓
재확인
```

---

## 🆘 긴급 복원 (30초)

```bash
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
bash .scripts/claude-config-backup.sh restore
# 최신 백업 선택
# yes 입력
# Claude 재시작
# ✅ 완료!
```

---

## 📞 도움말

- 상세 가이드: `cat .scripts/REINSTALL-GUIDE.md`
- 백업 도움말: `bash .scripts/claude-config-backup.sh help`
- 팀 리더 문의

---

**Quick Reference Card v1.0**
**Last Updated**: 2025-12-29
