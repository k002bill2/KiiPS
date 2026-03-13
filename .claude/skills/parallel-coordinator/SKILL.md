---
name: parallel-coordinator
description: "Coordinate parallel agent execution using ACE Framework for KiiPS development. Use when implementing features with 3+ independent subtasks."
---

# Parallel Agent Coordinator

## Purpose

Coordinate parallel execution of specialist agents using the **ACE (Autonomous Cognitive Entity) Framework** for safe, efficient multi-agent development.

## When to Use

### Use When:
- Feature implementation with 3+ independent subtasks
- Multi-layer work (Controller + Service + JSP + SCSS)
- Performance optimization across multiple modules
- Different modules that can be developed simultaneously

### Don't Use When:
- Sequential dependencies (task B requires task A's output)
- Same file modifications
- Single, focused task (one component/function)
- Simple refactoring

---

## Effort Scaling (Anthropic Pattern)

**Critical Decision**: Determine appropriate resource allocation BEFORE spawning agents.

See [parallel-agents-protocol.md](../../agents/shared/parallel-agents-protocol.md) for the complete safety protocol including:
- ACE Layer Architecture (7 layers)
- Agent Roles & Permissions (Primary / Manager / Secondary)
- Module Isolation & File Lock Protocol
- Error Handling & Rollback Procedure

See [effort-scaling.md](../../agents/shared/effort-scaling.md) for complete guide including:
- Complexity matrix (Trivial -> Complex)
- Decision flowchart
- Token economics
- Agent selection guide

**Quick Reference**:
| Complexity | Agents | When to Use |
|------------|--------|-------------|
| Trivial | 0 | Typo, single line |
| Simple | 1 | One component/function |
| Moderate | 2-3 | Controller + Service + JSP |
| Complex | 5+ | System-wide changes |

---

## Task Delegation Template

**Critical**: Every subagent MUST receive all four elements to prevent duplicated work and gaps.

### Delegation Format

```markdown
## Task: {task_name}

### Objective
{Clear, specific goal statement}
- What success looks like
- Measurable outcome

### Output Format
{Expected deliverable structure}
- File paths and naming: `KiiPS-FD/src/main/java/kr/co/logossystem/kiips/fd/{Feature}Controller.java`
- Code style: Java 8, Spring Boot conventions
- Documentation: Javadoc for public APIs

### Tools & Sources
{Resources to use}
- Skills to invoke: `kiips-feature-planner`
- Reference files: `KiiPS-FD/src/main/java/.../ExistingController.java`
- Mapper: MyBatis XML mapper

### Task Boundaries (DO NOT)
{Explicit exclusions to prevent overlap}
- DO NOT modify files in: `KiiPS-COMMON/`
- DO NOT implement: JSP pages (UI agent handles)
- DO NOT test: (test agent handles)
- WAIT FOR: `kiips-architect` review before starting
```

---

## Best Practices

### 1. Clear Task Boundaries
- **Do**: Assign distinct file outputs to each agent
- **Don't**: Have multiple agents modify the same file

### 2. Explicit Dependencies
- **Do**: Define clear dependency order (architect -> developer -> UI)
- **Don't**: Create circular dependencies

### 3. Regular Progress Updates
- **Do**: Agents update metadata.json every 30s
- **Don't**: Long silent periods

### 4. Skill Invocation
- **Do**: Invoke appropriate skill before starting work
- **Don't**: Skip skill guidelines

### 5. Workspace Discipline
- **Do**: Write only to assigned workspace
- **Don't**: Attempt to write directly to src/

---

## Quick Reference

### Directory Structure
```
.temp/
├── agent_workspaces/
│   ├── architect/
│   │   ├── drafts/
│   │   ├── proposals/
│   │   └── metadata.json
│   ├── developer/
│   ├── ui-designer/
│   └── checklist/
├── coordination/
│   ├── locks/
│   ├── tasks/
│   └── status/
└── integration/
    ├── checkpoints/
    └── conflicts/
```

### Validation Commands
```bash
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am  # Must pass
cd KiiPS-HUB && mvn test -pl :KiiPS-FD          # Must pass
```

### Available Agents

| Agent | Role | Model |
|-------|------|-------|
| `primary-coordinator` | Coordination, effort scaling | opus |
| `kiips-architect` | Architecture design, review | sonnet |
| `kiips-developer` | Coding, debugging, build | sonnet |
| `kiips-ui-designer` | JSP, RealGrid, SCSS | sonnet |
| `checklist-generator` | Quality checklist | haiku |
| `code-simplifier` | Refactoring, simplification | sonnet |

### Related Skills

| Skill | Purpose |
|-------|---------|
| `kiips-feature-planner` | Feature development planning |
| `agent-observability` | Decision tracing |
| `agent-improvement` | Self-improvement loop |

---

## Summary

This skill enables:
- Coordinate 2-5 specialist agents in parallel
- Apply effort scaling (Trivial -> Complex)
- Use structured delegation templates
- Iterate until all gaps closed
- Maintain code quality (Maven compile, MyBatis #{} binding)
- Prevent conflicts through workspace isolation

**Remember**:
- **Scale Appropriately**: Don't spawn 5 agents for a typo fix
- **Delegate Clearly**: Use the 4-part template every time
- **Iterate**: One round rarely catches everything
- Multi-agent uses ~15x more tokens than single-agent

## Reference Documentation

For detailed procedures, see [references/operations-guide.md](references/operations-guide.md):
- Validation Gates (pre/mid/post execution)
- Emergency Abort Procedure
- Integration Workflow
- Monitoring & Debugging commands
- Complete Example walkthrough

External Reference:
- [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

## Chain of Skills Pipeline Support

### Pipeline 실행 시 병렬 조율

`chain-of-skills` 파이프라인 내에서 병렬 분기가 필요한 경우 이 스킬이 조율합니다:

| Pipeline | 병렬 구간 | 스킬 |
|----------|----------|------|
| Build-Deploy-Verify | Stage 1 (Build) | maven-builder + test-runner |
| Build-Deploy-Verify | Stage 3 (Verify) | log-reader + api-tester |
| Feature Lifecycle | Phase 2-3 | developer (backend) + ui-designer (frontend) |
| Incident Response | Step 1 (Collect) | log-reader + db-inspector |

### Pipeline 상태 추적

파이프라인 실행 중 `metadata.json`에 추가 필드:

```json
{
  "pipeline": "build-deploy-verify",
  "currentStage": "deploy",
  "stageResults": {
    "build": { "status": "success", "timestamp": "ISO8601" },
    "test": { "status": "success", "timestamp": "ISO8601" }
  },
  "nextStage": "verify"
}
```

### 순차/병렬 판단 기준

```
IF skills share output files -> SEQUENTIAL
IF skills depend on each other's results -> SEQUENTIAL
IF skills operate on different modules/files -> PARALLEL
IF skills are in different ACE layers -> check dependency first
```

상세: [chain-of-skills SKILL.md](../chain-of-skills/SKILL.md) 참조

---

## 추가 참조
- 상세 레퍼런스: [reference.md](reference.md)
