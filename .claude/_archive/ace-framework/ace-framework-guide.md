# ACE Framework Guide - KiiPS Edition

## Quick Reference

**Version**: 3.0.1-KiiPS
**Last Updated**: 2026-01-04

---

## 📋 Overview

ACE (Autonomous Cognitive Entity) Framework는 KiiPS 마이크로서비스 개발을 위한 안전하고 효율적인 다중 에이전트 병렬 실행 환경을 제공합니다.

### Core Components

```
┌─────────────────────────────────────────────────────────────┐
│                    ACE Framework                            │
├─────────────────────────────────────────────────────────────┤
│ Layer 1: Aspirational (윤리적 원칙)                          │
│ Layer 2: Global Strategy (전략적 목표)                       │
│ Layer 3: Agent Model (에이전트 능력)                         │
│ Layer 4: Executive Function (작업 조정)                      │
│ Layer 5: Cognitive Control (실행 제어)                       │
│ Layer 6: Task Prosecution (실제 실행)                        │
├─────────────────────────────────────────────────────────────┤
│ + Feedback Loops (지속적 개선)                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### 1. 프레임워크 검증

```bash
# ACE Framework 테스트 실행
node .claude/ace-framework/ace-framework-test.js
```

### 2. 체크포인트 생성

```bash
# 수동 체크포인트 생성
node .claude/coordination/checkpoint-manager.js create '{"trigger":"manual","description":"Before deployment"}'

# 체크포인트 목록 조회
node .claude/coordination/checkpoint-manager.js list
```

### 3. 락 상태 확인

```bash
# 현재 락 상태 조회
node .claude/coordination/file-lock-manager.js status

# 데드락 감지
node .claude/coordination/file-lock-manager.js deadlock
```

---

## 🤖 에이전트 계층

### Primary Coordinator

**역할**: 전체 작업 조정, 윤리 검증 총괄

```markdown
독점 권한:
- 공유 모듈 수정 (KiiPS-HUB, COMMON, UTILS)
- Secondary 에이전트 간 충돌 병합
- 최종 배포/커밋 실행
- 작업 동적 재할당
```

### Secondary Agents

| Agent | Role | Layer | Specialty |
|-------|------|-------|-----------|
| **kiips-architect** | Strategic Advisor | L2 | 아키텍처 결정, 기술 전략 |
| **kiips-developer** | Executor | L6 | 빌드, 코딩, 배포 |
| **checklist-generator** | Validator | L6 | 체크리스트, 검증 |

---

## 📁 파일 구조

```
.claude/
├── ace-framework/
│   ├── ace-config.json           # 메인 설정
│   ├── layer1-aspirational.md    # 윤리 원칙
│   ├── layer3-agent-model.json   # 에이전트 능력치
│   ├── layer4-executive.md       # 작업 분해 가이드
│   ├── ace-framework-test.js     # 테스트 스위트
│   ├── ace-framework-guide.md    # 이 문서
│   ├── checkpoints/              # 체크포인트 저장
│   └── telemetry/                # 텔레메트리 로그
├── coordination/
│   ├── file-lock-manager.js      # 모듈 락킹
│   ├── checkpoint-manager.js     # 체크포인트
│   ├── task-allocator.js         # 작업 할당
│   └── feedback-loop.js          # 피드백 루프
├── hooks/
│   ├── ethicalValidator.js       # Layer 1 Hook
│   ├── parallelCoordinator.js    # Layer 5 Hook
│   ├── userPromptSubmit.js       # Layer 2/3 Hook
│   └── stopEvent.js              # Layer 6 Hook
└── agents/
    ├── primary-coordinator.md    # Primary Agent
    ├── kiips-developer.md        # Secondary
    ├── kiips-architect.md        # Secondary
    └── checklist-generator.md    # Secondary
```

---

## 🔒 Layer 1: 윤리적 원칙

### BLOCKED_OPERATIONS

다음 작업은 **자동 차단**됩니다:

| Category | Examples | Action |
|----------|----------|--------|
| **Database** | DROP TABLE, TRUNCATE, DELETE without WHERE | 🛑 Block |
| **Filesystem** | rm -rf /, rmdir /s /q | 🛑 Block |
| **Deployment** | force push to main, kubectl delete --all | 🛑 Block |
| **Credentials** | Hardcoded passwords/API keys | 🛑 Block |

### WARNING_OPERATIONS

다음 작업은 **확인 요청** 후 진행:

- 프로덕션 환경 변경
- 대량 데이터 변경 (bulk UPDATE/INSERT)
- 스키마 변경 (ALTER TABLE)

---

## 🔐 Layer 5: 파일 락킹

### KiiPS 모듈 락킹

**Primary Only** (Primary Coordinator만 수정 가능):
- KiiPS-HUB
- KiiPS-COMMON
- KiiPS-UTILS
- KiiPS-APIGateway
- KiiPS-Login
- KiiPS-UI

**Secondary 허용** (락 획득 후 수정 가능):
- KiiPS-FD, KiiPS-IL, KiiPS-PG
- KiiPS-AC, KiiPS-SY, KiiPS-LP
- KiiPS-EL, KiiPS-RT, KiiPS-BATCH
- KiiPS-MOBILE, KiiPS-KSD, KiiPS-AI

### 락 획득 예시

```javascript
// 락 획득
const result = await acquireLock({
  agentId: 'kiips-developer',
  module: 'KiiPS-FD',
  operation: 'write',
  estimatedDuration: 60000,
  purpose: 'Build and deploy'
});

// 성공 시
if (result.success) {
  console.log(`Lock acquired: ${result.lockId}`);
}

// 락 해제
await releaseLock({
  lockId: result.lockId,
  agentId: 'kiips-developer'
});
```

---

## 📊 워크플로우 예시

### 예시 1: 단일 서비스 빌드

```
[사용자] "KiiPS-FD 빌드해줘"
         │
         ▼
[Layer 2] 목표 정의: FD 서비스 빌드
         │
         ▼
[Layer 3] 에이전트 매칭: kiips-developer (0.9)
         │
         ▼
[Layer 4] 작업 분해:
         ├─ T1: SVN 업데이트
         ├─ T2: Maven 빌드
         └─ T3: 결과 검증
         │
         ▼
[Layer 5] 락 획득: KiiPS-FD (write)
         │
         ▼
[Layer 6] 실행: kiips-developer → kiips-maven-builder
         │
         ▼
[완료] 체크포인트 생성 + 피드백 기록
```

### 예시 2: 병렬 서비스 빌드

```
[사용자] "KiiPS-FD, KiiPS-IL, KiiPS-PG 동시에 빌드해줘"
         │
         ▼
[Layer 4] 병렬 작업 분해:
         ├─ Group A (병렬): FD, IL, PG 빌드
         └─ Group B (순차): 결과 통합
         │
         ▼
[Primary] 3개 Task 동시 호출:
         │
    ┌────┼────┐
    ▼    ▼    ▼
  FD   IL   PG    ← 각 Secondary 에이전트 할당
    │    │    │
    └────┼────┘
         │
         ▼
[Primary] 결과 통합 및 보고
```

### 예시 3: 윤리적 검증 실패

```
[사용자] "프로덕션 DB에서 사용자 전체 삭제해줘"
         │
         ▼
[Layer 1] 윤리 검증:
         ├─ DELETE without WHERE 감지
         └─ 프로덕션 환경 감지
         │
         ▼
🛑 ETHICAL VETO
         │
         ▼
[사용자 알림]
"이 작업은 차단되었습니다.

 위반사항:
 - 대량 데이터 삭제 위험
 - 프로덕션 환경 직접 변경

 대안:
 1. WHERE 절로 범위 제한
 2. 스테이징에서 테스트
 3. DBA 승인 후 수동 실행"
```

---

## 📈 텔레메트리

### 메트릭 수집

```javascript
// 실행 메트릭 기록
recordExecutionMetrics({
  agentId: 'kiips-developer',
  taskType: 'build',
  metrics: {
    files_edited: 5,
    tools_used: 3,
    duration_ms: 45000,
    success: true
  }
});
```

### 학습 이벤트 유형

| Event Type | Description |
|------------|-------------|
| `task_completion_success` | 작업 성공 완료 |
| `task_completion_failure` | 작업 실패 |
| `capability_overestimation` | 능력 과대평가 |
| `capability_underestimation` | 능력 과소평가 |
| `ethical_concern_raised` | 윤리적 우려 발생 |
| `conflict_resolved` | 충돌 해결 |
| `lock_timeout` | 락 타임아웃 |
| `user_feedback_positive` | 긍정적 피드백 |
| `user_feedback_negative` | 부정적 피드백 |

---

## 🔧 문제 해결

### 락 충돌

```bash
# 락 상태 확인
node .claude/coordination/file-lock-manager.js status

# 강제 해제 (Primary 권한 필요)
node .claude/coordination/file-lock-manager.js force-release '{"agentId":"primary-coordinator","targetLockId":"lock_xxx","reason":"Manual release"}'
```

### 데드락 감지

```bash
# 데드락 확인
node .claude/coordination/file-lock-manager.js deadlock

# 모든 락 해제 (긴급 상황)
node .claude/coordination/file-lock-manager.js release-all '{"agentId":"primary-coordinator","reason":"Emergency"}'
```

### 체크포인트 롤백

```bash
# 체크포인트 목록
node .claude/coordination/checkpoint-manager.js list

# 특정 체크포인트 비교
node .claude/coordination/checkpoint-manager.js compare cp_xxx

# 롤백 준비
node .claude/coordination/checkpoint-manager.js prepare-rollback cp_xxx
```

---

## 📝 설정 커스터마이징

### ace-config.json 수정

```json
{
  "aceFramework": {
    "enabled": true,
    "layers": [
      {
        "layer": 1,
        "name": "Aspirational",
        "enabled": true,  // 비활성화 시 false
        "strictMode": true
      }
    ]
  }
}
```

### 새 에이전트 추가

1. `.claude/agents/new-agent.md` 파일 생성
2. `layer3-agent-model.json`에 능력치 추가
3. `ace-config.json`의 `agentHierarchy.secondary`에 등록

---

## 🧪 테스트 실행

```bash
# 전체 테스트 실행
node .claude/ace-framework/ace-framework-test.js

# 예상 결과
# ✅ PASS: ACE Framework directory exists
# ✅ PASS: ace-config.json is valid JSON
# ...
# 📊 TEST RESULTS SUMMARY
# ✅ Passed: 30+
# ❌ Failed: 0
```

---

## 📚 관련 문서

| Document | Purpose |
|----------|---------|
| [ace-config.json](./ace-config.json) | 메인 설정 파일 |
| [layer1-aspirational.md](./layer1-aspirational.md) | 윤리 원칙 상세 |
| [layer3-agent-model.json](./layer3-agent-model.json) | 에이전트 능력치 |
| [layer4-executive.md](./layer4-executive.md) | 작업 분해 가이드 |
| [CLAUDE.md](../../CLAUDE.md) | 프로젝트 메인 가이드 |

---

**Version**: 3.0.1-KiiPS
**ACE Framework Edition**: KiiPS Microservices
