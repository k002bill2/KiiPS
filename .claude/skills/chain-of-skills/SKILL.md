---
name: chain-of-skills
description: "ACE Framework 기반 스킬 체이닝 파이프라인 오케스트레이션"
user-invocable: false
---

# Chain of Skills

스킬 간 데이터 전달 및 순차/병렬 실행을 조율하는 파이프라인 오케스트레이션 스킬입니다.

## Purpose

### What This Skill Does
- **파이프라인 정의**: 스킬 체이닝 시나리오를 사전 정의
- **실행 조율**: 순차 게이트 (이전 단계 성공 시 다음 진행)
- **병렬 분기**: 독립 스킬은 동시 실행
- **롤백 트리거**: 임계 스킬 실패 시 파이프라인 중단
- **체크포인트**: 각 단계 완료 시 자동 저장

### What This Skill Does NOT Do
- 개별 스킬의 실제 작업 수행 (각 스킬에 위임)
- 파이프라인 외 단독 스킬 호출 관리

## When to Use

### User Prompt Keywords
```
"파이프라인", "pipeline", "워크플로우", "workflow",
"자동화", "automation", "체인", "chain",
"빌드부터 배포까지", "end-to-end"
```

---

## Available Pipelines

### 1. Build-Deploy-Verify

빌드부터 배포 후 검증까지의 전체 파이프라인입니다.

**트리거**: "빌드하고 배포해줘", "build and deploy"

```
Primary Coordinator
  Stage 1: Build (build-manager)
    ├─ kiips-maven-builder     -> BUILD_RESULT
    └─ kiips-test-runner       -> TEST_RESULT
  Stage 2: Deploy (WAIT FOR: BUILD_RESULT.success)
    ├─ kiips-service-deployer  -> DEPLOY_RESULT
    ├─ kiips-log-reader        -> LOG_RESULT
    └─ kiips-api-tester        -> API_RESULT
  Stage 3: Report
    └─ checklist-generator     -> FINAL_REPORT
```

상세: [pipelines/build-deploy-verify.md](pipelines/build-deploy-verify.md)

### 2. Feature Lifecycle

기능 개발의 전체 라이프사이클을 관리합니다.

**트리거**: "새 기능 개발", "feature development"

```
Primary Coordinator
  Phase 1: Design (feature-manager)
    ├─ kiips-architect
    └─ legacy-compliance-checker -> DESIGN_REVIEWED
  Phase 2: Implement (WAIT FOR: DESIGN_REVIEWED)
    ├─ kiips-developer (backend)
    └─ kiips-ui-designer (frontend, parallel)
  Phase 3: Test
    └─ kiips-test-runner         -> TEST_PASSED
  Phase 4: Review
    └─ code-simplifier           -> REVIEW_DONE
```

상세: [pipelines/feature-lifecycle.md](pipelines/feature-lifecycle.md)

### 3. Incident Response

장애 발생 시 로그 수집부터 수정까지의 대응 파이프라인입니다.

**트리거**: "에러 분석", "장애 대응", "incident response"

```
Primary Coordinator
  Step 1: Collect
    ├─ kiips-log-reader        -> ERROR_LOGS
    └─ kiips-db-inspector      -> DB_STATUS
  Step 2: Analyze
    └─ kiips-log-analyzer      -> ROOT_CAUSE
  Step 3: Verify
    └─ kiips-api-tester        -> API_STATUS
  Step 4: Fix (IF ROOT_CAUSE requires code change)
    ├─ kiips-developer
    └─ kiips-test-runner       -> REGRESSION_TEST
```

상세: [pipelines/incident-response.md](pipelines/incident-response.md)

---

## Skill Chaining Mechanism

### Data Flow

스킬 간 데이터 전달은 `proposals/` 디렉토리를 통해 이루어집니다:

```
1. Skill A 실행 -> proposals/skill-a-result.json 저장
2. Primary Coordinator가 결과 읽기
3. 결과 기반으로 다음 스킬 선택 및 입력 구성
4. Skill B 실행 (Skill A 결과를 컨텍스트로 전달)
```

### Execution Rules

| 규칙 | 설명 |
|------|------|
| Sequential Gate | 이전 단계 성공 시에만 다음 단계 진행 |
| Parallel Branch | 독립 스킬은 병렬 실행 가능 |
| Rollback Trigger | critical 스킬 실패 시 전체 파이프라인 중단 |
| Checkpoint | 각 단계 완료 시 자동 체크포인트 |
| Timeout | 단계별 최대 실행 시간 (기본 5분) |

### Stage Result Format

```json
{
  "stage": "build",
  "skill": "kiips-maven-builder",
  "status": "success|failure|skipped",
  "timestamp": "ISO8601",
  "output": { ... },
  "nextStage": "deploy",
  "condition": "status === 'success'"
}
```

---

## Pipeline Selection Logic

```
User Prompt -> Pattern Matching:

1. "(빌드|build).*(배포|deploy)"
   -> build-deploy-verify pipeline

2. "(기능|feature).*(개발|develop|구현|implement)"
   -> feature-lifecycle pipeline

3. "(에러|error|장애|incident).*(분석|analyze|조사|investigate)"
   -> incident-response pipeline

4. No match -> 개별 스킬 활성화 (기존 동작)
```

---

## Integration

### With ACE Framework
- Layer 4 (Primary Coordinator)가 파이프라인 전체 관리
- Layer 4.5 (Manager Agents)가 각 Stage 담당
- Layer 6 (Specialist Agents)가 개별 스킬 실행

### With parallel-coordinator
- 파이프라인 내 병렬 분기 실행 시 parallel-coordinator 활용
- 워크스페이스 격리 및 파일 잠금 프로토콜 준수

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
**Related**: parallel-coordinator, kiips-ace-essentials, kiips-build-deploy
