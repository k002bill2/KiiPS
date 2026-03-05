---
name: parallel-agents-protocol
description: Parallel Agents Safety Protocol with ACE Framework for KiiPS multi-agent execution
---

# Parallel Agents Safety Protocol v4.0.0
## ACE Framework Integration - KiiPS Project

## Document Information
- **Version**: 4.0.0
- **Last Updated**: 2026-02-06
- **Status**: Active - ACE Framework Integrated for KiiPS
- **Scope**: Multi-agent parallel execution for KiiPS Microservices (Spring Boot + JSP + Maven)
- **Framework**: Based on Autonomous Cognitive Entity (ACE) Framework
- **Project**: KiiPS - Korea Investment Information Processing System

---

## 1. ACE Framework Foundation

### 1.1 ACE Layer Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: ASPIRATIONAL LAYER                                 │
│ Purpose: Define ethical principles and universal constraints │
│ Scope: All agents, all operations                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: GLOBAL STRATEGY LAYER                              │
│ Purpose: Maintain overall mission and long-term goals       │
│ Scope: Primary Agent (with user input)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: AGENT MODEL LAYER                                  │
│ Purpose: Self-awareness of capabilities and limitations     │
│ Scope: All agents (individual self-assessment)              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: EXECUTIVE FUNCTION LAYER                           │
│ Purpose: Task decomposition and resource allocation         │
│ Scope: Primary Agent (coordination)                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 4.5: DOMAIN ORCHESTRATION LAYER                       │
│ Purpose: Manager Agents - domain-specific coordination      │
│ Scope: Build, Feature, UI, Deployment Managers              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: COGNITIVE CONTROL LAYER                            │
│ Purpose: Task selection and conflict prevention             │
│ Scope: All agents (local execution control)                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Layer 6: TASK PROSECUTION LAYER                             │
│ Purpose: Actual execution with tools and skills             │
│ Scope: All agents (parallel operation)                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ FEEDBACK LOOPS (Cross-Layer)                                │
│ Purpose: Continuous learning and protocol evolution          │
│ Scope: All layers (bidirectional feedback)                  │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Core Principles - KiiPS

### 2.1 Aspirational Layer: Ethical Principles

#### 2.1.1 Core Mission (Heuristic Imperatives)

**1. Reduce Suffering**
- 데이터 무결성 보장 (PostgreSQL 트랜잭션)
- SQL Injection 방지 (MyBatis #{} 바인딩)
- 프로덕션 설정 파일 보호 (app-kiips.properties)

**2. Increase Prosperity**
- 병렬 처리로 빌드 효율 극대화
- Maven Multi-Module 의존성 최적화
- 모듈별 독립 배포 가능

**3. Increase Understanding**
- SVN 커밋 히스토리 보존
- 명확한 로그 기록 (Sentry 전송)
- CLAUDE.md / Dev Docs 문서화

#### 2.1.2 Universal Ethical Constraints

| Constraint | Description | KiiPS Context |
|------------|-------------|---------------|
| **Data Integrity** | DB 데이터 손실/손상 방지 | @Transactional(rollbackFor) 필수 |
| **Transparency** | 에러/충돌 숨기지 않음 | 로깅 철저히 (Sentry) |
| **Harm Prevention** | 시스템 손상 작업 금지 | ethicalValidator.js 차단 |
| **Respect Boundaries** | 권한 범위 초과 금지 | 모듈별 락킹, primaryOnly 규칙 |

---

## 3. Agent Roles - KiiPS

### 3.1 Primary Agent (Primary Coordinator)

**Core Responsibilities:**
- 작업 분해 및 서브에이전트 할당
- 공유 모듈 수정 (KiiPS-HUB, COMMON, UTILS)
- 충돌 해결 및 통합
- 사용자 커뮤니케이션

**Exclusive Permissions:**
- 공유 모듈 수정 (KiiPS-HUB, KiiPS-COMMON, KiiPS-UTILS, KiiPS-APIGateway, KiiPS-Login)
- Secondary 에이전트 간 충돌 병합
- 최종 배포/커밋 실행
- 작업 동적 재할당

### 3.2 Manager Agents (Layer 4.5)

| Manager | Domain | Managed Skills | Delegates To |
|---------|--------|---------------|-------------|
| `build-manager` | Maven 빌드 | kiips-maven-builder | kiips-developer |
| `feature-manager` | 기능 개발 | kiips-feature-planner, checklist-generator | kiips-architect, kiips-developer, kiips-ui-designer |
| `ui-manager` | UI/UX | kiips-ui-component-builder, kiips-realgrid-guide, kiips-responsive-validator, kiips-a11y-checker, kiips-scss-theme-manager | kiips-ui-designer, kiips-developer |
| `deployment-manager` | 배포 | kiips-service-deployer, kiips-api-tester, kiips-log-analyzer | kiips-developer |

### 3.3 Secondary Agents (Specialists)

| Agent | Domain | Workspace | Tools |
|-------|--------|-----------|-------|
| `kiips-architect` | 아키텍처 설계 | 전체 모듈 (Read only) | Read, Grep, Glob, Bash |
| `kiips-developer` | 코딩/디버깅 | 할당된 서비스 모듈 | Read, Edit, Write, Grep, Glob, Bash, LSP |
| `kiips-ui-designer` | JSP/SCSS/RealGrid | KiiPS-UI (JSP/SCSS/JS only) | Read, Edit, Write, Grep, Glob |
| `kiips-realgrid-generator` | RealGrid 코드 생성 | KiiPS-UI | Read, Write, Edit, Grep, Glob |
| `checklist-generator` | 체크리스트/검증 | 전체 (Read only) | Read, Write, TodoWrite |
| `code-simplifier` | 리팩토링 | 할당된 모듈 | Read, Write, Edit, Grep, Glob, Bash |

**Restrictions:**
- 다른 에이전트가 락한 모듈 수정 불가
- 공유 모듈 직접 수정 불가 (Primary 전용)
- 범위 변경 시 Primary 승인 필요

---

## 4. Resource Management

### 4.1 KiiPS Module Isolation

```
KiiPS/ (Monorepo)
├── KiiPS-HUB/          # Primary Only - Parent POM
├── KiiPS-COMMON/       # Primary Only - 공통 서비스
├── KiiPS-UTILS/        # Primary Only - 공통 DAO
├── KiiPS-APIGateway/   # Primary Only - API 라우팅
├── KiiPS-Login/        # Primary Only - 인증
├── KiiPS-UI/           # Primary Only (UI Designer: JSP/SCSS/JS만 허용)
│   └── src/main/
│       ├── webapp/WEB-INF/jsp/kiips/  # JSP 파일
│       └── resources/static/css/sass/ # SCSS 파일
├── KiiPS-FD/           # Secondary 허용 - 펀드
├── KiiPS-IL/           # Secondary 허용 - 투자원장
├── KiiPS-AC/           # Secondary 허용 - 회계
├── KiiPS-SY/           # Secondary 허용 - 시스템
├── KiiPS-LP/           # Secondary 허용 - LP관리
├── KiiPS-EL/           # Secondary 허용 - 전자원장
├── KiiPS-BATCH/        # Secondary 허용 - 배치
└── KiiPS-AI/           # Secondary 허용 - AI
```

### 4.2 Tool Access Matrix

| Tool | Primary | Manager | Secondary | Notes |
|------|---------|---------|-----------|-------|
| Bash | Full | Restricted | Restricted | 시스템 변경 금지 |
| Edit | Full | N/A | 할당 모듈만 | 락 필요 |
| Read | Full | Full | Full | 읽기는 안전 |
| Write | Full | N/A | 할당 모듈만 | 락 필요 |
| Grep/Glob | Full | Full | Full | 병렬 안전 |
| Task (agents) | Full | Full | Restricted | Manager는 Worker 위임 가능 |

### 4.3 File Lock Protocol

```json
{
  "operation": "file_lock_request",
  "agent": "kiips-developer",
  "module": "KiiPS-FD",
  "operation_type": "write",
  "estimated_duration": "60s",
  "timestamp": "2026-02-06T14:30:00Z"
}
```

**Lock States:**
- `Available`: 모듈 사용 가능
- `Locked`: 에이전트가 독점 접근 중
- `Queued`: 여러 에이전트 대기 중 (FIFO)
- `Released`: 작업 완료, 락 해제

---

## 5. Skill Auto-Invocation Protocol

### 5.1 KiiPS Skill Mapping

| File Operation | Required Skill | Timing |
|----------------|---------------|--------|
| Controller 생성 | `kiips-feature-planner` | 기능 설계 전 |
| Service 구현 | `kiips-feature-planner` | 구현 전 |
| Mapper XML 작성 | - | MyBatis #{} 규칙 준수 |
| JSP 화면 생성 | `kiips-ui-component-builder` | 컴포넌트 생성 전 |
| RealGrid 설정 | `kiips-realgrid-guide` | 그리드 설정 전 |
| SCSS 테마 수정 | `kiips-scss-theme-manager` | [data-theme=dark] 규칙 확인 |
| 다크테마 적용 | `kiips-darktheme-applier` | 다크테마 작업 전 |
| Maven 빌드 | `kiips-maven-builder` | 빌드 실행 전 |
| 서비스 배포 | `kiips-service-deployer` | 배포 전 |
| API 테스트 | `kiips-api-tester` | 테스트 전 |
| 로그 분석 | `kiips-log-analyzer` | 분석 전 |

### 5.2 Skill Selection Logic

```javascript
function selectSkill(taskType) {
  const skillMap = {
    'controller': 'kiips-feature-planner',
    'service': 'kiips-feature-planner',
    'jsp_page': 'kiips-ui-component-builder',
    'realgrid': 'kiips-realgrid-guide',
    'scss_theme': 'kiips-scss-theme-manager',
    'dark_theme': 'kiips-darktheme-applier',
    'maven_build': 'kiips-maven-builder',
    'deploy': 'kiips-service-deployer',
    'api_test': 'kiips-api-tester',
    'log_analysis': 'kiips-log-analyzer',
    'responsive': 'kiips-responsive-validator',
    'accessibility': 'kiips-a11y-checker'
  };
  return skillMap[taskType] || 'general';
}
```

---

## 6. Parallel Execution Patterns

### 6.1 Pattern: Fan-Out / Fan-In

```
Primary Coordinator
  ↓ [Fan-Out: 독립 서브태스크 분배]
┌─────────────────────────────────────────┐
│ kiips-architect (아키텍처 리뷰)          │
│ kiips-developer (기능 구현)              │
│ kiips-ui-designer (화면 개발)            │
│ checklist-generator (체크리스트 생성)    │
└─────────────────────────────────────────┘
  ↓ [Fan-In: 결과 수집 및 통합]
Primary Coordinator (통합 및 검증)
```

### 6.2 Example: 새 기능 구현

**User Request:** "KiiPS-FD에 펀드 수익률 조회 기능 추가"

**Layer 4 (Executive Function) - Task Decomposition:**

```json
{
  "primary_task": "펀드 수익률 조회 기능 구현",
  "manager": "feature-manager",
  "subtasks": [
    {
      "agent": "kiips-architect",
      "task": "아키텍처 리뷰 - API 설계, 테이블 구조 확인",
      "output": "architecture-review.md"
    },
    {
      "agent": "kiips-developer",
      "task": "Controller + Service + Mapper 구현",
      "skill": "kiips-feature-planner",
      "output": "KiiPS-FD/src/main/java/..."
    },
    {
      "agent": "kiips-ui-designer",
      "task": "JSP 화면 + RealGrid 그리드 구현",
      "skill": "kiips-ui-component-builder",
      "output": "KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/fd/"
    },
    {
      "agent": "checklist-generator",
      "task": "코드 리뷰 체크리스트 생성",
      "output": "checklist-review.md"
    }
  ]
}
```

---

## 7. Error Handling and Recovery

### 7.1 Checkpoint Strategy

```json
{
  "checkpoints": [
    {
      "id": "cp_001",
      "state": "Initial state",
      "files_snapshot": [],
      "validation": "passed"
    },
    {
      "id": "cp_002",
      "state": "Backend API complete",
      "files_snapshot": ["KiiPS-FD/src/main/java/.../FdReturnController.java"],
      "validation": "mvn compile passed"
    }
  ]
}
```

### 7.2 Rollback Procedure

1. **Emergency halt** - 모든 에이전트 정지
2. **Lock release** - 모든 모듈 락 해제
3. **Checkpoint restore** - 마지막 유효 체크포인트로 복원
4. **SVN revert** - 필요 시 `svn revert` (Primary만)

---

## 8. Quality Gates

### 8.1 Pre-Execution Validation

- [ ] 작업 분해 검토 완료
- [ ] 모듈 충돌 없음 확인 (파일 락)
- [ ] 모든 에이전트 자기 평가 완료
- [ ] 롤백 체크포인트 정의됨
- [ ] 윤리적 검토 통과 (ethicalValidator)

### 8.2 Post-Execution Validation

- [ ] 모든 서브태스크 완료
- [ ] Maven 컴파일 통과 (`mvn compile`)
- [ ] 테스트 통과 (`mvn test`)
- [ ] 패키지 빌드 성공 (`mvn package`)
- [ ] MyBatis #{} 바인딩 확인 (${} 미사용)
- [ ] SCSS 다크테마 규칙 준수 ([data-theme=dark])

---

## 9. Quick Reference

### Agent Decision Matrix

| Situation | Primary | Manager | Secondary |
|-----------|---------|---------|-----------|
| Ethical concern | Invoke veto | Escalate | Escalate |
| Task exceeds capability | Reassign | Delegate differently | Decline |
| Module locked | Wait/abort | Queue workers | Wait |
| Tool failure | Retry | Reassign worker | Report |
| Shared module change needed | Handle directly | Escalate to Primary | Escalate |

### Skill Invocation Cheat Sheet

```bash
# KiiPS Skills
kiips-feature-planner          # 기능 개발 계획
kiips-ui-component-builder     # JSP 컴포넌트 생성
kiips-realgrid-guide           # RealGrid 2.6.3 설정
kiips-scss-theme-manager       # SCSS 테마 관리
kiips-darktheme-applier        # 다크테마 적용
kiips-maven-builder            # Maven 빌드
kiips-service-deployer         # 서비스 배포
kiips-api-tester               # API 테스트
kiips-log-analyzer             # 로그 분석
kiips-responsive-validator     # 반응형 검증
kiips-a11y-checker             # 접근성 검증

# Verification
/verify-app                    # 앱 종합 검증
/check-health                  # 헬스 체크
/review                        # 코드 리뷰
```

---

## Document Control

| Version | Date | Changes |
|---------|------|---------|
| 3.0 | 2025-01-03 | ACE Framework Integration |
| 3.1.0 | 2025-01-26 | Multi-project Adaptation |
| 4.0.0 | 2026-02-06 | **KiiPS Adaptation**: Spring Boot + JSP + Maven + SVN, Manager Layer 4.5, KiiPS 스킬 매핑 |
