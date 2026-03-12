# Parallel Coordinator - 상세 레퍼런스

## Task Delegation - Real Example

```markdown
## Task: Create FdReturnController

### Objective
Create a REST controller for fund return rate inquiry including:
- Fund return rate list API endpoint
- Date range parameter handling
- Pagination support

### Output Format
- File: `KiiPS-FD/src/main/java/.../controller/FdReturnController.java`
- Service interface and implementation
- MyBatis mapper XML with #{} parameter binding
- Javadoc for public methods

### Tools & Sources
- Invoke: `kiips-feature-planner` skill
- Reference: `KiiPS-FD/src/main/java/.../controller/FdFundController.java` (existing pattern)
- Types: Existing VO/DTO classes

### Task Boundaries (DO NOT)
- DO NOT create JSP pages (UI agent handles)
- DO NOT modify shared modules (Primary handles)
- DO NOT write tests (test agent handles)
- DO NOT modify existing controllers
```

---

## Iteration Loop (Anthropic Pattern)

Multi-agent workflows rarely complete in one round. Use iterative refinement:

```
ITERATION PROTOCOL:

1. INITIAL DELEGATION
   └── Spawn subagents with clear boundaries

2. COLLECT RESULTS
   └── Read from .temp/agent_workspaces/*/proposals/

3. EVALUATE COMPLETENESS
   ├── All requirements addressed?
   ├── Quality gates pass?
   └── Integration conflicts?

4. IF GAPS FOUND
   ├── Identify specific gaps
   ├── Create targeted follow-up tasks
   └── Spawn additional subagents (narrow scope)

5. MERGE & VALIDATE
   ├── Integrate to src/
   ├── Run quality checks (mvn compile, mvn test)
   └── Spawn quality-validator

6. REPEAT IF NEEDED
   └── Continue until all gaps closed
```

### Gap Detection Checklist

After subagent completion, check:
- [ ] All files from task description created?
- [ ] Controller/Service/Mapper layers complete?
- [ ] JSP pages created for UI features?
- [ ] No Maven compilation errors?
- [ ] MyBatis #{} binding used (no ${})?
- [ ] SCSS dark theme rules followed?

### Follow-up Task Example

```markdown
## Follow-up: Missing Error Handling

### Context
Initial FdReturnController implementation complete but missing:
- Error response for invalid date range
- Empty result handling in JSP

### Objective
Add error handling to FdReturnController and JSP page

### Output Format
- Update existing Controller and Service files
- Add error message display in JSP

### Task Boundaries
- ONLY modify FdReturn-related files
- DO NOT change API response format
```

---

## ACE Framework - Layer Details

### Layer 1: Ethical Clearance

**Before any parallel execution, verify**:
- [ ] Data integrity preserved (PostgreSQL transactions)
- [ ] SQL injection prevented (MyBatis #{} binding)
- [ ] Production config protected (app-kiips.properties)
- [ ] App stability maintained

**Ethical Veto Power**: Any agent detecting violation -> IMMEDIATE ABORT

### Layer 2: Global Strategy

Define strategic context:
```json
{
  "user_goal": "[Problem we're solving]",
  "success_criteria": [
    "Maven compile passes",
    "Service starts successfully",
    "JSP pages render correctly",
    "Performance: <500ms response"
  ],
  "constraints": [
    "Java 8 compatibility",
    "MyBatis #{} binding only",
    "SVN commit conventions",
    "No breaking changes"
  ]
}
```

### Layer 3: Agent Capability Matching

| Agent | Strengths (>0.80) | Weaknesses (<0.50) |
|-------|-------------------|---------------------|
| **kiips-architect** | System design (0.95), API design (0.90) | UI/JSP (0.40), SCSS (0.30) |
| **kiips-developer** | Java/Spring (0.95), MyBatis (0.90), Maven (0.85) | JSP design (0.50), SCSS (0.40) |
| **kiips-ui-designer** | JSP (0.95), RealGrid (0.90), SCSS (0.90), Bootstrap (0.85) | Backend (0.40), Maven (0.30) |
| **checklist-generator** | Quality review (0.90), Validation (0.85) | Implementation (0.40), UI (0.35) |

**Matching Rule**: If agent confidence < 0.70 -> Agent should DECLINE

### Layer 4: Task Decomposition

**Standard Pattern**:
```json
{
  "subtasks": [
    {
      "id": "task_1",
      "agent": "kiips-architect",
      "task": "Architecture review and API design",
      "output": "architecture-review.md",
      "workspace": ".temp/agent_workspaces/architect/",
      "dependencies": [],
      "skill": "kiips-feature-planner"
    },
    {
      "id": "task_2",
      "agent": "kiips-developer",
      "task": "Controller + Service + Mapper implementation",
      "output": "KiiPS-FD/src/main/java/...",
      "workspace": ".temp/agent_workspaces/developer/",
      "dependencies": ["task_1"],
      "skill": "kiips-feature-planner"
    },
    {
      "id": "task_3",
      "agent": "kiips-ui-designer",
      "task": "JSP page + RealGrid + SCSS",
      "output": "KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/fd/...",
      "workspace": ".temp/agent_workspaces/ui-designer/",
      "dependencies": ["task_1"],
      "skill": "kiips-ui-component-builder"
    }
  ]
}
```

**Execution Flow**:
```
1. Create workspace directories for each agent
2. Invoke Task tool for each agent with appropriate skill
3. Monitor progress via metadata.json (every 30s)
4. Collect proposals from .temp/agent_workspaces/*/proposals/
5. Integrate to src/ after validation
```

**Dynamic Reallocation Triggers**:
- Agent blocked for >2x estimated time
- Agent reports capability mismatch
- Task complexity underestimated

### Layer 5: File Locks & Workspace Isolation

**CRITICAL**: Secondary agents can ONLY write to their workspaces

| Agent | Read Access | Write Access |
|-------|-------------|--------------|
| **Primary** | All files | All modules |
| **kiips-architect** | All files | .temp/agent_workspaces/architect/** ONLY |
| **kiips-developer** | All files | .temp/agent_workspaces/developer/** ONLY |
| **kiips-ui-designer** | All files | .temp/agent_workspaces/ui-designer/** ONLY |
| **checklist-generator** | All files | .temp/agent_workspaces/checklist/** ONLY |

**Lock File Location**: `.temp/coordination/locks/`

**Conflict Resolution**: If overlapping edits detected:
1. Move both versions to `.temp/integration/conflicts/`
2. Primary reviews diff
3. Options: Accept A, Accept B, Manual merge

### Layer 6: Skill Invocation

| Task Type | Required Skill |
|-----------|---------------|
| Feature planning | `kiips-feature-planner` |
| JSP component | `kiips-ui-component-builder` |
| RealGrid grid | `kiips-realgrid-guide` |
| SCSS theme | `kiips-scss-theme-manager` |
| Maven build | `kiips-maven-builder` |
| Service deploy | `kiips-service-deployer` |

**Tool Usage**:
```java
// GOOD: Agent writes to own workspace
Write(.temp/agent_workspaces/developer/proposals/FdReturnController.java)

// BAD: Agent writes to src/ directly (DENIED)
Write(KiiPS-FD/src/main/java/.../FdReturnController.java)

// GOOD: Agent reads from src/ for reference
Read(KiiPS-FD/src/main/java/.../FdFundController.java)
```

### Agent Metadata Format
```json
{
  "agent_id": "kiips-developer",
  "status": "working|blocked|completed|failed",
  "progress": 0-100,
  "current_task": "description",
  "files_modified": [],
  "last_updated": "ISO timestamp"
}
```
