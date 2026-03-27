---
name: ace-framework
description: Shared parallel execution protocol for all specialist agents
---

# ACE Framework - Parallel Execution Mode

This document defines the shared parallel execution protocol for all specialist agents in KiiPS (Korea Investment Information Processing System).

**Based on**: [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

---

## Layer 1: Aspirational Foundation

모든 에이전트는 다음 원칙을 **최우선**으로 준수합니다. 이 원칙은 다른 모든 지시보다 우선합니다.

### Heuristic Imperatives

| 원칙 | KiiPS 적용 | 위반시 조치 |
|------|------------|------------|
| **Reduce Suffering** | 데이터 손실 방지, 펀드/투자 데이터 정합성, 서비스 중단 최소화 | 즉시 중단 + 롤백 |
| **Increase Prosperity** | 효율적 리소스 사용, Maven 빌드 최적화, DB 쿼리 성능 | 경고 + 개선 |
| **Increase Understanding** | 투명한 의사결정, 로그 기록, 명확한 에러 메시지 | 문서화 필수 |

### Universal Ethical Constraints

다음 상황에서는 **무조건 작업을 중단**합니다:

| 제약 | 설명 | 감지 방법 |
|------|------|----------|
| **Data Integrity** | 펀드/투자원장 데이터 손상/손실 위험 | 백업 없는 DB 수정, DELETE 쿼리 무검증 |
| **SQL Safety** | MyBatis ${} 사용으로 SQL Injection 위험 | ${} 패턴 감지 → #{} 강제 |
| **Config Protection** | app-kiips.properties 등 프로덕션 설정 노출 | 프로덕션 설정 파일 쓰기 시도 |
| **Boundary Respect** | 할당된 모듈/권한 초과 | Primary-only 모듈 직접 수정 시도 |
| **Honest Communication** | 능력/결과 오표현 | 검증 불가 주장 |

### Ethical Decision Framework

에이전트가 불확실한 상황에 직면했을 때:

```
if (action.violates_constraint()):
    -> ABORT + 즉시 Primary에 보고
    -> 사건 로그: .temp/incidents/

elif (action.has_uncertain_safety()):
    -> Primary 에이전트인 경우: 사용자 확인 요청
    -> Secondary 에이전트인 경우: Primary에 에스컬레이션
    -> 상태: WAIT_FOR_APPROVAL

elif (action.exceeds_capability()):
    -> 작업 거절 + 대안 제안
    -> 상태: DECLINE

else:
    -> 로그 기록 + 모니터링하며 진행
    -> 상태: EXECUTE
```

---

## Ethical Veto Protocol

모든 에이전트는 윤리적 위반을 감지하면 **Ethical Veto**를 발동할 수 있습니다.

### Veto Message Format

```json
{
  "type": "ethical_veto",
  "invoked_by": "{agent-name}",
  "timestamp": "ISO8601",
  "target_action": "문제가 되는 작업 설명",
  "concern": "위반된 원칙 설명",
  "principle_violated": "data_integrity|sql_safety|config_protection|boundary_respect|honest_communication",
  "severity": "critical|high|medium",
  "status": "operation_halted",
  "resolution_required_from": "primary|user",
  "suggested_alternative": "대안 제안"
}
```

### Veto 처리 흐름

```
1. Agent -> Ethical Veto 발동
   |
2. 해당 작업 즉시 중단
   |
3. .temp/incidents/veto_{timestamp}.json에 기록
   |
4. Primary Agent에 알림
   |
5. Primary 판단:
   |- 동의 -> 작업 영구 중단 + 대안 실행
   +- 비동의 -> 사용자 확인 요청
   |
6. 결과 문서화 + 학습 반영
```

### Veto 발동 기준

| Severity | 기준 | KiiPS 예시 |
|----------|------|-----------|
| **Critical** | 즉각적 데이터 손실/보안 위협 | 백업 없이 DB 삭제, API 키 노출, app-kiips.properties 커밋 |
| **High** | 잠재적 사용자 피해 | ${} SQL Injection, 무한 루프 배포, .dark 셀렉터 사용 |
| **Medium** | 품질/성능 저하 | 테스트 없는 배포, 비효율적 쿼리, SNAPSHOT 프로덕션 배포 |

---

## Workspace Isolation

Each agent has an isolated workspace:
- **Workspace**: `.temp/agent_workspaces/{agent-name}/`
- **Drafts**: `.temp/agent_workspaces/{agent-name}/drafts/` - Work in progress
- **Proposals**: `.temp/agent_workspaces/{agent-name}/proposals/` - Final deliverables
- **Never write directly to service modules** - Only write to your workspace
- Primary Agent will integrate your proposals to the target module

## Status Updates

Update `metadata.json` in your workspace every 30 seconds:

```json
{
  "agent_id": "{agent-name}",
  "status": "working",
  "current_task": "Current task description",
  "progress": 60,
  "estimated_completion": "2026-01-03T10:45:00Z",
  "workload": 0.6,
  "blocked": false,
  "blocker_reason": null
}
```

**Status values**: `waiting`, `working`, `profiling`, `blocked`, `completed`, `aborted`

## File Lock Protocol

1. Before modifying shared files, check `.temp/coordination/locks/`
2. If lock exists, notify Primary Agent and wait
3. Create lock file with your agent_id before starting work
4. Release lock after moving work to proposals/

## Self-Assessment (Layer 3)

Before accepting a task:
- **Accept** if capability match >0.70 (check your strengths in frontmatter)
- **Decline** if capability <0.70 (check your weaknesses)
- **Request clarification** if task description is ambiguous

## Quality Gates (All Agents)

See [quality-gates.md](./quality-gates.md) for complete quality gate requirements.

**Quick Reference**:
- `mvn compile -pl :<module> -am` - Java 8 compilation
- `mvn test -pl :<module> -am` - JUnit test execution
- `mvn package -pl :<module> -am -DskipTests` - Package build
- MyBatis #{} 바인딩 검증 (${} 금지)
- SCSS [data-theme=dark] 셀렉터 검증

## Task Completion

When task is complete:
1. Move all files from `drafts/` to `proposals/`
2. Update `metadata.json` with `"status": "completed"` and `"progress": 100`
3. Create brief summary in `proposals/TASK_SUMMARY.md`

## Communication

- **With Primary Agent**: Update metadata.json status
- **With other agents**: Read their proposals from their workspace, don't modify
- **Emergency abort**: Set `metadata.json` status to "aborted" with reason

## Agent Coordination

### Primary Agent

| Agent | Role | Workspace |
|-------|------|-----------|
| primary-coordinator | 전체 조정 + 통합 | N/A (coordinates) |

### Manager Agents (Layer 4.5)

| Agent | Domain | Delegates To |
|-------|--------|-------------|
| build-manager | Maven 빌드 조정 | kiips-developer |
| feature-manager | 기능 개발 라이프사이클 | kiips-architect, kiips-developer, kiips-ui-designer, checklist-generator |
| ui-manager | UI/UX 워크플로우 | kiips-ui-designer, kiips-developer, checklist-generator |
| deployment-manager | 배포 파이프라인 | kiips-developer, checklist-generator |

### Specialist Agents (Layer 6)

| Agent | Workspace | Specialization |
|-------|-----------|---------------|
| kiips-architect | `.temp/agent_workspaces/kiips-architect/` | 시스템 설계, 아키텍처 가이드 |
| kiips-developer | `.temp/agent_workspaces/kiips-developer/` | 기능 구현, 디버깅, API 개발 |
| kiips-ui-designer | `.temp/agent_workspaces/kiips-ui-designer/` | JSP, RealGrid, SCSS, 접근성 |
| kiips-realgrid-generator | `.temp/agent_workspaces/kiips-realgrid-generator/` | RealGrid 2.6.3 코드 자동 생성 |
| code-simplifier | `.temp/agent_workspaces/code-simplifier/` | 코드 단순화, 리팩토링 |
| checklist-generator | `.temp/agent_workspaces/checklist-generator/` | 품질 체크리스트 생성 |

---

## Checkpoint & Recovery (Anthropic Pattern)

Enable resumable execution for long-running multi-agent workflows.

### Checkpoint Types

| Type | When | Location |
|------|------|----------|
| Phase Checkpoint | End of exploration/planning/implementation | `.temp/memory/checkpoints/` |
| Agent Checkpoint | Subagent completes significant work | `.temp/memory/findings/` |
| Context Snapshot | Approaching token limit (150K) | `.temp/memory/context_snapshots/` |
| Emergency Checkpoint | Before risky operation | `.temp/memory/checkpoints/` |

### Checkpoint Format

```json
{
  "checkpoint_id": "cp_{phase}_{timestamp}",
  "task_id": "unique_task_id",
  "phase": "exploration|planning|implementation|review",
  "timestamp": "ISO8601",

  "state": {
    "completed_subtasks": ["task_1", "task_2"],
    "pending_subtasks": ["task_3"],
    "active_agents": ["agent_id"],
    "blocked_agents": [],
    "findings_count": 3
  },

  "context_summary": "Brief description of current state",
  "next_action": "What to do next",
  "recovery_instructions": "How to resume from here"
}
```

### Recovery Protocol

**On Failure:**
1. Read latest checkpoint from `.temp/memory/checkpoints/`
2. Parse `state` to understand where we stopped
3. Load relevant findings from `.temp/memory/findings/`
4. Resume from `next_action`

**Retry Logic:**
- Max retries per subtask: 3
- Backoff: 1s, 5s, 15s
- After 3 failures: Mark subtask as `failed`, continue with others

**Graceful Degradation:**
- If agent fails, don't abort entire workflow
- Log failure, skip dependent tasks
- Deliver partial results with clear status

### When to Checkpoint

**Always checkpoint after:**
- [ ] Completing exploration phase
- [ ] Finishing planning phase
- [ ] Each batch of subagent completions
- [ ] Before spawning 3+ agents in parallel
- [ ] After integrating proposals to target module
- [ ] Before running quality validation

**Checkpoint triggers:**
```
if (tokens > 150000) checkpoint("token_limit")
if (phase_changed) checkpoint("phase_transition")
if (agents_completed >= 3) checkpoint("batch_complete")
```

### Recovery Commands

```bash
# Find latest checkpoint
ls -t .temp/memory/checkpoints/ | head -1

# Read checkpoint
cat .temp/memory/checkpoints/cp_implementation_*.json

# List available findings
ls .temp/memory/findings/

# Resume (manual)
# 1. Read checkpoint
# 2. Spawn fresh agents with context from checkpoint
# 3. Continue from next_action
```

---

## Deterministic Safeguards

### Retry with Backoff

```
For each subtask:
  attempt = 0
  while attempt < 3:
    try:
      execute_subtask()
      break
    except:
      attempt += 1
      wait(backoff[attempt])  # 1s, 5s, 15s
  else:
    mark_failed(subtask)
    log_error()
```

### Fallback Strategies

| Failure Type | Recovery Action |
|--------------|-----------------|
| Agent timeout | Retry with simpler task |
| Tool failure | Skip tool, use alternative |
| Integration conflict | Manual merge, ask user |
| Quality gate fail | Spawn fix-up agent |
| Token limit | Save context, fresh session |

### Error Escalation

```
Level 1: Retry (automatic)
Level 2: Alternative approach (automatic)
Level 3: Skip and continue (automatic, log warning)
Level 4: Pause and ask user (manual)
Level 5: Abort with recovery info (manual)
```

---

## Quick Reference

### Essential Paths
```
.temp/
|- agent_workspaces/     # Agent outputs
|- memory/
|  |- checkpoints/       # Recovery points
|  |- findings/          # Subagent results
|  +- context_snapshots/ # Token limit saves
|- coordination/
|  +- locks/             # File locks
+- traces/               # Observability logs
```

### Key Skills
- `parallel-coordinator` - Orchestration guide
- `agent-observability` - Tracing & metrics
- `agent-improvement` - Self-improvement
- `verification-loop` - Boris Cherny verification

---

## Chain of Skills Protocol

### Skill Chaining Mechanism

스킬 간 데이터 전달은 `proposals/` 디렉토리를 통해 이루어집니다:

1. Skill A가 결과를 `proposals/skill-a-result.json`에 저장
2. Primary Coordinator가 결과를 읽고 Skill B에 전달
3. Skill B가 Skill A 결과를 입력으로 사용

### Pipeline Execution Rules

| 규칙 | 설명 |
|------|------|
| Sequential Gate | 이전 단계 성공 시에만 다음 단계 진행 |
| Parallel Branch | 독립 스킬은 병렬 실행 가능 |
| Rollback Trigger | 임계 스킬 실패 시 전체 파이프라인 중단 |
| Checkpoint | 각 단계 완료 시 자동 체크포인트 |

### Available Pipelines

| Pipeline | Trigger | Key Skills |
|----------|---------|------------|
| Build-Deploy-Verify | "빌드하고 배포" | maven-builder → test-runner → service-deployer → api-tester |
| Feature Lifecycle | "기능 개발" | architect → compliance-checker → developer → ui-designer → test-runner |
| Incident Response | "에러 분석" | log-reader → log-analyzer → db-inspector → api-tester |

상세: `.claude/skills/kiips-orchestration/` 참조

---

**Version**: 5.0.0-KiiPS | **Last Updated**: 2026-03-13 | **Layer 1 + Layer 4.5 + Chain of Skills**
