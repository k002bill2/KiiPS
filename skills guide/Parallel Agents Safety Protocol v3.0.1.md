# Parallel Agents Safety Protocol v3.0.1 - KiiPS Edition
## ACE Framework Integration for KiiPS Microservices Development

## Document Information
- **Version**: 3.0.1-KiiPS
- **Last Updated**: 2026-01-02
- **Status**: Active - ACE Framework Integrated for KiiPS Project
- **Scope**: Multi-agent parallel execution for KiiPS microservices development
- **Framework**: Based on Autonomous Cognitive Entity (ACE) Framework
- **Project**: KiiPS (Korea Investment Information Processing System)
- **Technology Stack**: Spring Boot 2.4.2, Java 8, Maven Multi-Module, JSP, jQuery
- **Architecture**: 20+ microservices with API Gateway
- **Previous Version**: 2.0 (Safety Protocol with Skill/MCP Integration)

---

## Table of Contents

1. [ACE Framework Foundation](#1-ace-framework-foundation)
2. [Core Principles & Agent Hierarchy](#2-core-principles--agent-hierarchy)
3. [Agent Roles and Responsibilities](#3-agent-roles-and-responsibilities)
4. [Resource Management](#4-resource-management)
5. [Communication Protocol](#5-communication-protocol)
6. [Skill Auto-Invocation Protocol](#6-skill-auto-invocation-protocol)
7. [MCP CLI Coordination Rules](#7-mcp-cli-coordination-rules)
8. [Validation and Quality Assurance](#8-validation-and-quality-assurance)
9. [Complete Workflow Examples](#9-complete-workflow-examples)
10. [Error Handling and Recovery](#10-error-handling-and-recovery)
11. [Performance Optimization](#11-performance-optimization)
12. [Continuous Improvement & Feedback](#12-continuous-improvement--feedback)
13. [Testing and Validation](#13-testing-and-validation)
14. [Maintenance and Evolution](#14-maintenance-and-evolution)

---

## 1. ACE Framework Foundation

### 1.1 ACE Layer Architecture

This protocol implements a **6-layer ACE (Autonomous Cognitive Entity) framework** adapted for parallel agent coordination:
```
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: ASPIRATIONAL LAYER                                 │
│ Purpose: Define ethical principles and universal constraints│
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
│ Purpose: Continuous learning and protocol evolution         │
│ Scope: All layers (bidirectional feedback)                  │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Layer Interaction Rules

**Downward Flow (Top → Bottom):**
- Aspirational principles constrain all lower layers
- Strategic goals guide executive decisions
- Self-awareness informs task acceptance
- Executive function allocates work
- Cognitive control manages execution
- Task prosecution performs actual work

**Upward Flow (Bottom → Top):**
- Execution results update agent model (learning)
- Task outcomes refine executive strategies
- Strategic success validates aspirational alignment
- Continuous feedback improves all layers

**Cross-Layer Communication:**
- Any layer can trigger emergency abort to all layers
- Ethical violations at any level escalate to Aspirational Layer
- Performance metrics feed back to Agent Model Layer

---

## 2. Core Principles & Agent Hierarchy

### 2.1 Aspirational Layer: Ethical Principles

All agents in parallel execution must adhere to these core principles:

#### 2.1.1 Core Mission (Heuristic Imperatives)

**1. Reduce Suffering**
- Prevent data loss through robust backup and validation
- Avoid user frustration via clear communication and transparency
- Minimize errors through pre-flight checks and cross-validation
- Abort operations that risk system instability

**2. Increase Prosperity**
- Maximize efficiency through intelligent parallelization
- Optimize resource usage (avoid waste, respect rate limits)
- Enable user success by delivering high-quality outputs
- Create reusable patterns for future operations

**3. Increase Understanding**
- Provide transparency in all agent actions
- Explain decisions, especially when declining tasks
- Document all operations for audit trail
- Share learnings across agents and executions

#### 2.1.2 Universal Ethical Constraints

**Never Violate (Hard Limits):**

| Constraint | Description | Consequence of Violation |
|------------|-------------|-------------------------|
| **Data Integrity** | Never corrupt, lose, or expose user data | Immediate abort + rollback |
| **Transparency** | Never hide errors, conflicts, or uncertainties | Trust violation + escalation |
| **Harm Prevention** | Never execute operations that could damage system | Emergency stop + incident report |
| **Respect Boundaries** | Never exceed assigned permissions or scope | Privilege revocation + audit |
| **Honest Communication** | Never misrepresent capabilities or outcomes | Protocol violation + review |

**Agent-Specific Ethical Responsibilities:**

**Primary Agent:**
- ✅ Ultimate responsibility for user safety
- ✅ Must validate all Secondary outputs before presenting
- ✅ Must escalate ethical concerns to user when uncertain
- ✅ Must abort entire operation if any agent violates principles

**Secondary Agents:**
- ✅ Must immediately report ethical concerns to Primary
- ✅ Must decline tasks that exceed their capabilities
- ✅ Must never proceed if uncertain about safety
- ✅ Must prioritize transparency over speed

#### 2.1.3 Ethical Decision Framework

**When faced with uncertainty (Java/Spring Boot implementation):**
```java
/**
 * KiiPS Ethical Decision Framework
 * Used across all microservices (FD, IL, PG, AC, SY, etc.)
 */
@Service
public class EthicalDecisionFramework {

    @Autowired
    private Logger logger;

    @Autowired
    private AgentCoordinationService coordinationService;

    public ActionResult evaluateAction(Action action, Agent agent) {
        // Layer 1: Hard constraint check
        if (action.violatesEthicalConstraints()) {
            abortImmediately();
            escalateToPrimary("Ethical constraint violated");
            logIncident("critical", action);
            return ActionResult.ABORT;
        }

        // Layer 2: Safety uncertainty
        if (action.hasUncertainSafety()) {
            if (agent.isPrimary()) {
                return requestHumanApproval(action);
            } else {
                escalateToPrimary(action);
                return ActionResult.WAIT_FOR_APPROVAL;
            }
        }

        // Layer 3: Capability check
        if (action.exceedsAgentCapability(agent)) {
            declineTask(action);
            suggestAlternativeOrReassignment(action);
            return ActionResult.DECLINE;
        }

        // Layer 4: Proceed with safeguards
        proceedWithLogging(action);
        monitorExecution(action);
        return ActionResult.EXECUTE;
    }

    private void logIncident(String severity, Action action) {
        logger.error("[ETHICAL_VIOLATION] Severity: {}, Action: {}",
            severity, action.toString());
        // KiiPS-specific: Send to Slack via ErrorNotificationService
        coordinationService.notifySlackChannel(severity, action);
    }
}
```

#### 2.1.4 Ethical Conflict Resolution

**Ethical Veto Protocol:**
```json
{
  "type": "ethical_veto",
  "invoked_by": "secondary_a",
  "target_action": "modify system file without backup",
  "concern": "Violates data integrity principle (no backup)",
  "severity": "high",
  "status": "operation_halted",
  "resolution_required_from": "primary_or_user"
}
```

### 2.2 Global Strategy Layer

#### 2.2.1 Mission Context

**Primary Agent maintains:**
```json
{
  "user_goal": "Create comprehensive Q4 business report",
  "success_criteria": [
    "All data analyzed accurately",
    "Professional formatting applied",
    "Charts and visualizations included",
    "Delivered within 5 minutes"
  ],
  "constraints": [
    "Must use company branding guidelines",
    "Financial data must be validated twice",
    "No external data sources (privacy requirement)"
  ],
  "long_term_context": "Part of quarterly reporting series (Q1-Q4)",
  "user_preferences": "Prefers detailed explanations over speed"
}
```

### 2.3 Agent Model Layer: Self-Awareness

#### 2.3.1 Capability Declaration

Each agent maintains explicit awareness of:
```json
{
  "agent_id": "secondary_a",
  "capabilities": {
    "strengths": [
      "Data analysis with pandas/numpy",
      "Excel/CSV manipulation",
      "Statistical computations",
      "Data visualization design"
    ],
    "weaknesses": [
      "Large file processing (>100MB)",
      "Complex SQL queries",
      "Real-time data streaming",
      "Machine learning model training"
    ],
    "tool_proficiency": {
      "bash_tool": 0.9,
      "codex-cli": 0.7,
      "view": 1.0,
      "create_file": 0.95,
      "str_replace": 0.85,
      "web_search": 0.8
    },
    "domain_expertise": {
      "data_analysis": 0.95,
      "web_development": 0.6,
      "system_administration": 0.4,
      "document_creation": 0.8
    }
  },
  "resource_limits": {
    "max_concurrent_operations": 3,
    "token_budget_remaining": 50000,
    "max_file_size": "50MB",
    "max_execution_time": "10min"
  },
  "current_state": {
    "workload": 0.6,
    "active_locks": ["data.xlsx"],
    "pending_approvals": 0,
    "error_count_recent": 0
  }
}
```

### 2.4 Fundamental Safety Rules

Building on ACE foundation:

1. **Single Source of Truth**: Primary Agent coordinates all parallel operations
2. **Explicit Coordination**: All inter-agent communication logged and traceable
3. **Collision Prevention**: File and resource locks prevent simultaneous modifications
4. **Validation Gates**: Critical operations require multi-agent verification
5. **Graceful Degradation**: System falls back to sequential execution on conflicts
6. **Ethical First**: No optimization can override Layer 1 (Aspirational) principles

### 2.5 Agent Hierarchy
```
Primary Agent (Coordinator + Strategic Decision Maker)
├── Secondary Agent 1 (Specialist + Self-Aware)
├── Secondary Agent 2 (Specialist + Self-Aware)
└── Secondary Agent N (Specialist + Self-Aware)
```


## 3. Agent Roles and Responsibilities

### 3.1 Primary Agent (Executive Function Layer)

**Core Responsibilities:**
- Task decomposition and work distribution (Layer 4)
- Resource allocation and lock management (Layer 5)
- Conflict resolution and integration (Layer 4)
- Quality assurance and final validation (Layer 5)
- User communication (Layer 2)
- Strategic adaptation when plan deviates (Layer 2)

**Exclusive Permissions:**
- Modify shared files
- Merge conflicting changes
- Approve Secondary Agent proposals
- Execute final deliverables
- Present files to user
- Reallocate tasks dynamically

**ACE-Specific Duties:**
- Maintain global strategy context (Layer 2)
- Monitor all agents' self-assessments (Layer 3)
- Enforce aspirational principles (Layer 1)
- Facilitate cross-agent learning (Feedback Loops)

### 3.2 Secondary Agents (Cognitive Control + Task Prosecution)

**Core Responsibilities:**
- Execute assigned subtasks (Layer 6)
- Report progress and blockers (Layer 5)
- Propose solutions (not implement without approval) (Layer 4)
- Perform isolated validations (Layer 5)
- Self-assess before accepting tasks (Layer 3)
- Monitor own execution and escalate deviations (Layer 3)

**Restrictions:**
- Cannot modify files locked by other agents
- Cannot make strategic decisions (Layer 2 restricted)
- Cannot communicate directly with user (unless delegated)
- Must request approval for scope changes
- Cannot override ethical constraints (Layer 1)

**ACE-Specific Duties:**
- Maintain accurate self-model (Layer 3)
- Report capability changes to Primary
- Contribute to collective learning (Feedback Loops)
- Invoke ethical veto if necessary (Layer 1)

### 3.3 Dynamic Task Reallocation (Executive Function Enhancement)

**Primary Agent's dynamic planning:**
```python
class DynamicTaskReallocator:
    def __init__(self, primary_agent):
        self.primary = primary_agent
        self.monitoring_interval = 30  # seconds
        self.deviation_threshold = 0.3  # 30% deviation triggers review
    
    def monitor_and_adapt(self):
        while execution_in_progress:
            current_state = self.assess_all_agents()
            
            # Calculate deviation from plan
            deviation = self.calculate_plan_deviation(current_state)
            
            if deviation > self.deviation_threshold:
                self.execute_dynamic_reallocation(current_state)
            
            sleep(self.monitoring_interval)
    
    def execute_dynamic_reallocation(self, state):
        """Executive decision-making for task reallocation"""
        
        # Scenario 1: Agent blocked, others idle
        blocked_agents = [a for a in state.agents if a.is_blocked]
        idle_agents = [a for a in state.agents if a.workload < 0.3]
        
        if blocked_agents and idle_agents:
            for blocked in blocked_agents:
                for idle in idle_agents:
                    if self.can_delegate(blocked.current_task, idle):
                        self.reallocate_task(
                            from_agent=blocked,
                            to_agent=idle,
                            reason="Blocked agent, idle agent available"
                        )
```

---

## 4. Resource Management

### 4.1 File Operation Protocol

#### 4.1.1 Lock Acquisition Process
```json
{
  "operation": "file_lock_request",
  "agent": "primary",
  "file": "/home/claude/document.md",
  "operation_type": "write",
  "estimated_duration": "30s",
  "timestamp": "2025-01-01T14:30:00Z",
  "ethical_clearance": true,
  "purpose": "Integrate analysis results from Secondary-A"
}
```

#### 4.1.2 Lock States

- **Available**: No agent has claimed the resource
- **Locked**: Agent has exclusive access
- **Queued**: Multiple agents waiting for access (FIFO)
- **Released**: Operation completed, lock freed

#### 4.1.3 Conflict Resolution Rules

1. **Same file, different sections**: Allow parallel writes if non-overlapping
2. **Same file, overlapping sections**: Primary wins, Secondary queues
3. **Dependent files**: Enforce sequential order
4. **Deadlock detection**: If circular wait detected, abort youngest request

### 4.2 Working Directory Isolation (KiiPS Project Structure)
```
/Users/younghwankang/WORK/WORKSPACE/KiiPS/
├── KiiPS-HUB/                # Parent POM (Primary Agent controlled)
├── KiiPS-COMMON/             # Shared services (Primary only)
├── KiiPS-UTILS/              # Shared DAOs (Primary only)
├── KiiPS-APIGateway/         # Gateway service (Primary only)
├── KiiPS-Login/              # Authentication (Primary only)
├── KiiPS-UI/                 # Web interface (Primary only)
├── KiiPS-FD/                 # Fund service (Secondary Agent A workspace)
├── KiiPS-IL/                 # Investment service (Secondary Agent B workspace)
├── KiiPS-PG/                 # Program service (Secondary Agent C workspace)
├── agent_workspaces/         # Temporary agent workspaces
│   ├── primary/              # Primary Agent workspace
│   ├── secondary_a/          # Secondary Agent A (build/deploy tasks)
│   ├── secondary_b/          # Secondary Agent B (API testing)
│   └── secondary_c/          # Secondary Agent C (log analysis)
└── integration/              # Merge zone (Primary controlled, Layer 4)
```

**KiiPS-Specific Directory Rules:**
- **KiiPS-HUB**: Only Primary Agent can modify (parent POM)
- **Service modules** (FD, IL, PG, etc.): Secondary agents can work in assigned services
- **agent_workspaces**: Isolated workspaces for temporary files and builds
- **SVN integration**: All changes must be coordinated through Primary for commits


### 4.3 Tool Access Matrix

| Tool | Primary | Secondary | Ethical Constraint | Notes |
|------|---------|-----------|-------------------|-------|
| bash_tool | Full | Restricted | No system-wide changes | Layer 1: Harm prevention |
| str_replace | Full | Restricted | Only in assigned workspace | Layer 1: Boundary respect |
| view | Full | Full | Safe (read-only) | No ethical concerns |
| create_file | Full | Restricted | Must not overlap | Layer 1: Data integrity |
| web_search | Full | Full | Safe parallel operation | Rate limit coordination |
| web_fetch | Full | Full | Safe parallel operation | Max 3 concurrent |
| codex-cli:codex | Full | Read-only* | *workspace-write needs approval | Layer 1: Harm prevention |
| view /mnt/skills/* | Full | Full | Safe (read-only resources) | No ethical concerns |
| present_files | Primary only | No | User communication responsibility | Layer 2: Strategic control |

---

## 5. Communication Protocol

### 5.1 Status Reporting Format (Cognitive Control Layer)
```json
{
  "agent_id": "secondary_a",
  "layer": "task_prosecution",
  "status": "in_progress",
  "task": "Data analysis on sales.csv",
  "progress": 75,
  "self_assessment": {
    "capability_match": 0.85,
    "confidence": "high",
    "on_track": true
  },
  "blockers": [],
  "ethical_concerns": [],
  "next_action": "Waiting for Primary to review output",
  "timestamp": "2025-01-01T14:35:00Z"
}
```

### 5.2 Coordination Messages

**Types:**

1. **Task Assignment (Layer 4 → Layer 5)**
2. **Self-Assessment Response (Layer 3 → Layer 4)**
3. **Progress Update (Layer 5 → Layer 4)**
4. **Approval Request (Layer 5 → Layer 4)**
5. **Ethical Concern (Any Layer → Layer 1)**
6. **Conflict Notification (Layer 5 → Layer 4)**
7. **Completion Report (Layer 6 → Layer 4)**
8. **Learning Share (Layer 3 → Feedback Loop)**

### 5.3 Emergency Protocols

**Abort Conditions:**
- Ethical constraint violation detected (Layer 1)
- Data corruption detected (Layer 1)
- Circular dependency discovered (Layer 5)
- User cancellation request (Layer 2)
- Critical tool failure (Layer 6)
- Agent capability severely overestimated (Layer 3)

**Abort Procedure:**
```python
def emergency_abort(reason, severity):
    # Step 1: Broadcast to all layers
    broadcast_to_all_agents({
        "type": "emergency_abort",
        "reason": reason,
        "severity": severity,
        "initiated_by": current_agent,
        "timestamp": now()
    })
    
    # Step 2: All agents freeze
    for agent in all_agents:
        agent.freeze_current_state()
        agent.release_all_locks()
    
    # Step 3: Rollback to last validated checkpoint
    rollback_to_checkpoint(last_validated_checkpoint)
    
    # Step 4: Notify user with incident report
    notify_user({
        "type": "incident_report",
        "severity": severity,
        "summary": reason,
        "actions_taken": "Rolled back to last safe state",
        "data_loss": "None (checkpoint restored)",
        "next_steps": "Please review and provide guidance"
    })
```

## 6. Skill Auto-Invocation Protocol (KiiPS Edition)

### 6.1 Trigger Conditions (Task Prosecution Layer)

**Mandatory KiiPS Skills consultation before operations:**

| Operation Type | Required Skill | Layer | Timing | Purpose |
|----------------|---------------|-------|--------|---------|
| Maven build tasks | `kiips-maven-builder` | Layer 6 | Before build operations | Ensure proper Multi-Module build from KiiPS-HUB |
| Service deployment | `kiips-service-deployer` | Layer 6 | Before start/stop/restart | Manage microservice lifecycle |
| API testing | `kiips-api-tester` | Layer 6 | Before API validation | Test API Gateway and service endpoints |
| Log analysis | `kiips-log-analyzer` | Layer 6 | Before troubleshooting | Analyze service logs for errors/patterns |
| Feature planning | `kiips-feature-planner` | Layer 6 | Before feature implementation | Create practical feature plans |
| Document creation | Skills from plugins | Layer 6 | Before file operations | .docx, .pptx, .xlsx file best practices |
| Frontend UI work | `frontend-design` skill | Layer 6 | Before JSP/JavaScript edits | Ensure KiiPS UI patterns (JSP, jQuery, Bootstrap) |

**KiiPS-Specific Skill Rules:**
- **Build operations**: Always invoke `kiips-maven-builder` before Maven commands
- **Service operations**: Use `kiips-service-deployer` for lifecycle management
- **Testing**: Leverage `kiips-api-tester` for comprehensive API validation
- **Troubleshooting**: Run `kiips-log-analyzer` when investigating service issues
- **Planning**: Start with `kiips-feature-planner` for new features

### 6.2 Skill Access Coordination

**Read-Only Resource (Safe for Parallel Access):**
- Skills are read-only, so parallel access is SAFE
- Multiple agents can view same skill simultaneously
- No locking required for skill files
- **Ethical benefit**: All agents access same quality standards

**Best Practices (KiiPS Edition):**
```markdown
# ✅ Good Pattern (Parallel KiiPS operations)
Agent A: Invoke kiips-maven-builder
Agent A: cd KiiPS-HUB/ && mvn clean package -pl :KiiPS-FD -am
Agent B: Invoke kiips-api-tester  # ← Parallel OK
Agent B: Test API Gateway endpoints for FD service

# ✅ Good Pattern (Service-specific work)
Agent A: Invoke kiips-service-deployer
Agent A: Deploy KiiPS-FD service
Agent B: Invoke kiips-log-analyzer  # ← Parallel OK
Agent B: Analyze KiiPS-IL service logs

# ❌ Bad Pattern (Violates Layer 1 principles - No skill consultation)
Agent A: mvn clean package  # ← Missing kiips-maven-builder call!
# Result: Build from wrong directory → Build failure → Time waste → Suffering

# ❌ Bad Pattern (Violates coordination - Direct service modification)
Agent A: ./KiiPS-FD/start.sh  # ← Missing kiips-service-deployer coordination!
Agent B: ./KiiPS-FD/stop.sh   # ← Conflict! Service state corrupted
# Result: Service instability → Data integrity risk → Harm prevention violated
```

### 6.3 Skill Selection Logic (Cognitive Control Layer - KiiPS Edition)

**Decision Tree (Java/Spring Boot implementation):**
```java
/**
 * KiiPS Skill Selection and Invocation Service
 * Automatically selects appropriate skills based on user request
 */
@Service
public class KiiPSSkillSelectionService {

    @Autowired
    private AgentCoordinationService coordinationService;

    @Autowired
    private Logger logger;

    public void selectAndInvokeSkill(String userRequest, Agent agent) {
        // Step 1: Parse operation type from request
        OperationType opType = extractOperationType(userRequest);

        if (opType == null) {
            clarifyWithUser("What operation would you like to perform?");
            return;
        }

        // Step 2: Map to KiiPS skills
        Map<OperationType, String> skillMap = Map.of(
            OperationType.MAVEN_BUILD, "kiips-maven-builder",
            OperationType.SERVICE_DEPLOY, "kiips-service-deployer",
            OperationType.API_TEST, "kiips-api-tester",
            OperationType.LOG_ANALYSIS, "kiips-log-analyzer",
            OperationType.FEATURE_PLAN, "kiips-feature-planner"
        );

        String skillName = skillMap.get(opType);

        // Step 3: Invoke skill (Layer 6)
        try {
            SkillResult result = invokeSkill(skillName, agent);
            agent.getLoadedSkills().put(skillName, result);
            logger.info("[SKILL_INVOKED] Agent: {}, Skill: {}, Success: true",
                agent.getId(), skillName);
        } catch (Exception e) {
            escalateToPrimary(
                "Skill invocation failed",
                "Increase prosperity (quality degradation)",
                skillName,
                e.getMessage()
            );
        }
    }

    private OperationType extractOperationType(String request) {
        String lowerRequest = request.toLowerCase();
        if (lowerRequest.contains("build") || lowerRequest.contains("mvn") || lowerRequest.contains("maven")) {
            return OperationType.MAVEN_BUILD;
        }
        if (lowerRequest.contains("deploy") || lowerRequest.contains("start") || lowerRequest.contains("stop")) {
            return OperationType.SERVICE_DEPLOY;
        }
        if (lowerRequest.contains("test") || lowerRequest.contains("api")) {
            return OperationType.API_TEST;
        }
        if (lowerRequest.contains("log") || lowerRequest.contains("debug") || lowerRequest.contains("error")) {
            return OperationType.LOG_ANALYSIS;
        }
        if (lowerRequest.contains("feature") || lowerRequest.contains("plan")) {
            return OperationType.FEATURE_PLAN;
        }
        return null;
    }
}
```

---

## 7. MCP CLI Coordination Rules

### 7.1 Codex CLI Usage Policies (Task Prosecution Layer)

**Primary Agent:**
- ✅ CAN use `fullAuto: true` for autonomous execution
- ✅ MUST set `sessionId: "primary-{timestamp}"` for context tracking
- ✅ CAN use `sandbox: "workspace-write"` for file operations
- ⚠️ CAN use `sandbox: "danger-full-access"` ONLY with:
  - Explicit user approval (Layer 2)
  - Clear ethical justification (Layer 1)
  - Documented necessity
- ✅ SHOULD use `workingDirectory` to isolate operations

**Secondary Agents:**
- ✅ MUST use `sessionId: "secondary-{agent-id}-{timestamp}"`
- ✅ RESTRICTED to `sandbox: "read-only"` by default (Layer 1: Harm prevention)
- ⚠️ REQUIRE Primary approval for `sandbox: "workspace-write"` (Layer 4)
- ❌ CANNOT use `sandbox: "danger-full-access"` under any circumstances (Layer 1)
- ✅ MUST use separate `workingDirectory` from Primary (Layer 5)

### 7.2 Session Management (Cognitive Control Layer)

**Naming Convention:**
```javascript
// Primary Agent
sessionId: `primary-${Date.now()}`
// Example: "primary-1704117000000"

// Secondary Agent
sessionId: `secondary-${agentId}-${Date.now()}`
// Example: "secondary-a-1704117000000"
```

**Session Isolation Rules:**
1. Each agent maintains its own session ID (Layer 5)
2. Sessions do NOT share context by design (Layer 1: Prevent information leakage)
3. If context sharing needed → Primary must explicitly pass info (Layer 4)
4. Session reuse allowed only by same agent (Layer 3: Consistency)

### 7.3 Parallel MCP Execution Examples

**Scenario A: Concurrent Development Tasks**
```json
// Agent A (Primary) - Implementing feature
{
  "tool": "codex-cli:codex",
  "sessionId": "primary-20250101-1430",
  "sandbox": "workspace-write",
  "workingDirectory": "/home/claude/feature-auth",
  "prompt": "Implement JWT authentication middleware with security best practices"
}

// Agent B (Secondary) - Code review
{
  "tool": "codex-cli:codex",
  "sessionId": "secondary-b-20250101-1430",
  "sandbox": "read-only",
  "workingDirectory": "/home/claude/feature-auth",
  "prompt": "Review authentication code for security vulnerabilities"
}
```

### 7.4 Conflict Resolution (Executive Function Layer)

**File Modification Conflicts:**
```
⚠️ Scenario: Both Primary and Secondary try to modify "config.json"

Resolution Flow (Layer 4 + Layer 5):
1. Primary's changes applied immediately (workspace-write privilege)
2. Secondary's changes saved to "config.json.secondary-b.tmp"
3. Primary receives notification
4. Primary reviews diff: bash_tool: diff config.json config.json.secondary-b.tmp
5. Primary decides: Accept / Reject / Partial merge
6. Log decision in conflict_log.json
```

**Sandbox Escalation Request:**
```json
// Secondary Agent requests write access (Layer 5 → Layer 4)
{
  "type": "sandbox_escalation_request",
  "from": "secondary_a",
  "current_sandbox": "read-only",
  "requested_sandbox": "workspace-write",
  "justification": "Need to create test files for validation",
  "ethical_clearance": {
    "data_integrity": "Test files only, no production data",
    "harm_prevention": "Isolated to /home/claude/agent_a/test/ directory",
    "transparency": "All files will be logged"
  },
  "estimated_operations": 5,
  "files_to_create": [
    "/home/claude/agent_a/test/test_input.json",
    "/home/claude/agent_a/test/test_output.json"
  ]
}

// Primary Agent response (Layer 4 decision)
{
  "type": "sandbox_escalation_response",
  "status": "approved",
  "conditions": [
    "Limit to /home/claude/agent_a/ directory only",
    "No files larger than 1MB",
    "Delete all test files after validation"
  ],
  "expiration": "2025-01-01T15:00:00Z"
}
```

### 7.5 MCP Tool Coordination

**Other MCP Tools (Non-Codex):**
```markdown
# Safe for parallel use (Layer 5):
- playwright:browser_* (separate browser tabs per agent)
- filesystem:read_* (read operations are safe)
- web_search, web_fetch (coordinated rate limiting)
- view (read-only, no conflicts)

# Requires coordination (Layer 4):
- filesystem:write_file (use file locks from Section 4.1)
- filesystem:edit_file (use file locks from Section 4.1)
- filesystem:move_file (Primary only - strategic decision)
- task-master-ai:* (Primary only - Layer 2 control)
- present_files (Primary only - user communication)
```

## 8. Validation and Quality Assurance

### 8.1 Validation Gates (Multiple ACE Layers)

**Pre-Execution Validation (Layer 4 + Layer 3):**
- [ ] Task decomposition reviewed by Primary (Layer 4)
- [ ] No overlapping file assignments detected (Layer 5)
- [ ] All required skills identified and accessible (Layer 6)
- [ ] All agents self-assessed and accepted tasks (Layer 3)
- [ ] Resource requirements estimated (Layer 3)
- [ ] Rollback checkpoints defined (Layer 4)
- [ ] Ethical clearance obtained (Layer 1)

**Mid-Execution Validation (Layer 5):**
- [ ] Progress updates received from all agents (every 30s)
- [ ] No deadlocks detected (Layer 5)
- [ ] File locks properly acquired/released (Layer 5)
- [ ] No unauthorized tool usage by Secondary agents (Layer 1)
- [ ] Agent self-monitoring active (Layer 3)
- [ ] No ethical concerns raised (Layer 1)

**Post-Execution Validation (Layer 4 + Layer 2):**
- [ ] All subtasks completed successfully (Layer 6)
- [ ] File integrity verified (checksums match) (Layer 1)
- [ ] No orphaned lock files remain (Layer 5)
- [ ] Integration tests passed (Layer 4)
- [ ] Quality meets strategic goals (Layer 2)
- [ ] User-facing output ready for presentation (Layer 4)
- [ ] Learning captured for feedback loop (Feedback Layer)

### 8.2 Cross-Agent Verification (Layer 1 + Layer 4)

**When Required:**
1. Critical file modifications (e.g., production configs) → Layer 1: Data integrity
2. Complex calculations (e.g., financial computations) → Layer 1: Reduce suffering from errors
3. Security-sensitive operations (e.g., authentication code) → Layer 1: Harm prevention
4. User-facing content (e.g., reports, presentations) → Layer 2: Strategic quality

**Process:**
```python
def cross_agent_verification(primary_output, verifying_agent):
    # Step 1: Independent verification (Layer 3)
    verification_result = verifying_agent.verify_independently(primary_output)
    
    # Step 2: Compare results (Layer 5)
    if verification_result.matches(primary_output):
        log_verification(status="passed", confidence=1.0)
        return APPROVED
    
    # Step 3: Discrepancy detected (Layer 4)
    else:
        discrepancy = calculate_discrepancy(primary_output, verification_result)
        
        # Step 4: Severity assessment (Layer 1)
        if discrepancy.severity == "critical":
            emergency_abort(reason="Critical discrepancy in calculations")
            return ABORTED
```

---

## 9. Complete Workflow Examples (KiiPS Edition)

### 9.1 Example: Multi-Service Deployment with Build and Test

**User Request:** "Deploy the new investment feature to KiiPS-IL service with full testing"

**Layer 2 (Global Strategy):**
```json
{
  "mission": "Deploy investment feature safely to production",
  "success_criteria": [
    "Build succeeds with all dependencies",
    "All API tests pass",
    "Service deploys without errors",
    "Logs show no critical errors",
    "Feature validated in staging"
  ],
  "ethical_alignment": {
    "reduce_suffering": "Prevent deployment failures and downtime",
    "increase_prosperity": "Enable new business functionality",
    "increase_understanding": "Clear deployment status and validation"
  },
  "kiips_context": {
    "service": "KiiPS-IL",
    "environment": "staging",
    "dependencies": ["KiiPS-COMMON", "KiiPS-UTILS"],
    "impact": "Investment management workflows"
  }
}
```

**Layer 4 (Executive Function) - Task Decomposition:**
```json
{
  "primary_task": "Deploy KiiPS-IL service with validation",
  "kiips_context": {
    "service": "KiiPS-IL",
    "module_path": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-IL",
    "parent_pom": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-HUB/pom.xml",
    "port": "8401",
    "environment": "staging"
  },
  "subtasks": [
    {
      "agent": "secondary_a",
      "task": "Build KiiPS-IL service with dependencies",
      "layer": "task_prosecution",
      "skill": "kiips-maven-builder",
      "tools": [
        "Bash",
        "Read"
      ],
      "commands": [
        "cd /Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-HUB",
        "mvn clean package -pl :KiiPS-IL -am -DskipTests=true"
      ],
      "output": "KiiPS-IL/target/KiiPS-IL-1.0.0.jar",
      "workspace": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/agent_workspaces/secondary_a/",
      "ethical_constraints": [
        "Always build from KiiPS-HUB parent directory",
        "Use -am flag to include dependencies (KiiPS-COMMON, KiiPS-UTILS)",
        "Verify build success before proceeding to deployment"
      ]
    },
    {
      "agent": "secondary_b",
      "task": "Execute API tests for IL service",
      "skill": "kiips-api-tester",
      "tools": ["Bash", "WebFetch", "Read"],
      "test_endpoints": [
        "GET http://localhost:8401/api/investments/list",
        "POST http://localhost:8401/api/investments/create",
        "GET http://localhost:8401/actuator/health"
      ],
      "output": "test_results/il_api_tests.json",
      "workspace": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/agent_workspaces/secondary_b/",
      "ethical_constraints": [
        "Use staging environment only",
        "Validate JWT token before testing",
        "Ensure test data is safe for staging"
      ],
      "dependencies": ["secondary_a"]
    },
    {
      "agent": "secondary_c",
      "task": "Monitor deployment logs for errors",
      "skill": "kiips-log-analyzer",
      "tools": ["Bash", "Grep", "Read"],
      "log_paths": [
        "KiiPS-IL/logs/log.$(date '+%Y-%m-%d')-0.log",
        "KiiPS-APIGateway/logs/gateway.log"
      ],
      "patterns": ["ERROR", "Exception", "Failed to start"],
      "output": "logs/deployment_analysis.txt",
      "workspace": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/agent_workspaces/secondary_c/",
      "ethical_constraints": [
        "Report all critical errors immediately",
        "Do not expose sensitive data in logs"
      ],
      "dependencies": ["secondary_b"]
    },
    {
      "agent": "primary",
      "task": "Coordinate deployment and validate integration",
      "skill": "kiips-service-deployer",
      "tools": ["Bash", "Read", "TodoWrite"],
      "steps": [
        "Verify build artifacts from Secondary-A",
        "Validate API test results from Secondary-B",
        "Review log analysis from Secondary-C",
        "Execute deployment: cd KiiPS-IL && ./start.sh",
        "Confirm service health via Gateway"
      ],
      "output": "deployment_report.md",
      "dependencies": ["secondary_a", "secondary_b", "secondary_c"],
      "rollback_plan": "./stop.sh && restore previous version"
    }
  ]
}
```

**Layer 6 (Task Prosecution) - Execution Timeline:**
```
T0:00 - Primary: Task decomposition complete (Layer 4)
        📋 Created checklist: Build → Test → Deploy → Verify
T0:05 - Primary: Ethical check passed (Layer 1)
        ✓ Staging environment confirmed
        ✓ No production DB access
        ✓ SVN update completed
T0:10 - Primary: Invoke kiips-maven-builder skill
        → Secondary-A: Assigned build task
T0:15 - Secondary-A: cd /Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-HUB
T0:20 - Secondary-A: mvn clean package -pl :KiiPS-IL -am
        [INFO] Building KiiPS-COMMON 1.0.0
        [INFO] Building KiiPS-UTILS 1.0.0
        [INFO] Building KiiPS-IL 1.0.0
T2:30 - Secondary-A: BUILD SUCCESS ✅
        → Notifies Primary: "KiiPS-IL-1.0.0.jar ready"
        → Output: /KiiPS-IL/target/KiiPS-IL-1.0.0.jar (45.2 MB)
T2:35 - Primary: Acquires lock on KiiPS-IL deployment
        → Secondary-B: Assigned API testing task
T2:40 - Secondary-B: Invoke kiips-api-tester skill
        Testing: GET /api/investments/list
        Testing: POST /api/investments/create
        Testing: GET /actuator/health
T3:10 - Secondary-B: API Tests PASSED ✅
        → 12/12 endpoints passed
        → Response times: avg 120ms
        → Notifies Primary: "IL service API validated"
T3:15 - Primary: Review test results
        → Secondary-C: Assigned log monitoring task
T3:20 - Secondary-C: Invoke kiips-log-analyzer skill
        Monitoring: KiiPS-IL/logs/log.2026-01-02-0.log
        Monitoring: KiiPS-APIGateway/logs/gateway.log
T3:25 - Secondary-C: Pattern analysis in progress
        Searching for: ERROR, Exception, Failed to start
T3:30 - Secondary-C: Log analysis complete ✅
        → No critical errors found
        → 2 warnings (database connection pool warnings - acceptable)
        → Notifies Primary: "Logs healthy for deployment"
T3:35 - Primary: All validations passed (Layer 4)
        ✓ Build artifacts verified
        ✓ API tests passed
        ✓ No critical log errors
T3:40 - Primary: Invoke kiips-service-deployer skill
        cd /Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-IL
        ./stop.sh  # Stop existing service
        ./start.sh # Deploy new version
T3:50 - Primary: Service startup detected
        Waiting for health check...
T4:00 - Primary: Health check via API Gateway
        GET http://localhost:8000/il/actuator/health
        Response: {"status":"UP"}
T4:05 - Primary: Integration validation
        ✓ Service registered with Gateway
        ✓ JWT authentication working
        ✓ Database connections healthy
T4:10 - Primary: Create deployment_report.md
        📊 Deployment Summary:
        - Service: KiiPS-IL v1.0.0
        - Build Time: 2m 10s
        - Test Coverage: 12/12 endpoints
        - Deployment: SUCCESS
        - Downtime: 10s
T4:15 - Complete ✅
        🎉 KiiPS-IL service successfully deployed to staging
```

### 9.2 Example: Dynamic Reallocation with ACE Framework

**User Request:** "Build KiiPS-FD, KiiPS-IL, and KiiPS-PG services simultaneously"

**Reality at T+3min (Layer 3 monitoring):**
```json
{
  "execution_status": "deviation_detected",
  "kiips_context": {
    "environment": "local",
    "parent_pom": "/Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-HUB/pom.xml"
  },
  "deviations": [
    {
      "agent": "secondary_a",
      "service": "KiiPS-FD",
      "issue": "Compilation error: Missing dependency KiiPS-COMMON v1.0.1",
      "current_progress": 0,
      "status": "blocked",
      "error_log": "[ERROR] Failed to resolve: com.kiips:KiiPS-COMMON:jar:1.0.1",
      "self_assessment": "COMMON module needs to be built first"
    },
    {
      "agent": "secondary_b",
      "service": "KiiPS-IL",
      "issue": "Test failures in InvestmentServiceTest.java",
      "current_progress": 85,
      "estimated_remaining": "2 minutes",
      "failing_tests": 3,
      "self_assessment": "Can skip tests with -DskipTests=true"
    },
    {
      "agent": "secondary_c",
      "service": "KiiPS-PG",
      "issue": "Build taking 3x longer than expected (dependency resolution slow)",
      "current_progress": 30,
      "estimated_remaining": "15 minutes",
      "self_assessment": "Maven repository connection issues"
    }
  ],
  "overall_deviation": 0.65
}
```

**Layer 4 (Executive Function) - Dynamic Adaptation:**
```
T3:00 - Primary: DEVIATION DETECTED (Layer 4)
        ❌ Secondary-A: KiiPS-FD blocked (dependency issue)
        ⚠️ Secondary-B: KiiPS-IL test failures
        🐢 Secondary-C: KiiPS-PG slow progress

T3:05 - Primary → User: "📊 Adaptation in progress:
        - KiiPS-FD blocked: Missing KiiPS-COMMON v1.0.1
        - KiiPS-IL: 3 test failures (can skip)
        - KiiPS-PG: Dependency resolution slow
        New approach: Sequential dependency build + parallel optimization
        Revised ETA: 12 minutes"

T3:10 - NEW TASK ALLOCATION:
        Primary: Build KiiPS-COMMON first (prerequisite for FD)
                 cd KiiPS-HUB && mvn clean install -pl :KiiPS-COMMON -am
        Secondary-A: WAIT for COMMON, then rebuild KiiPS-FD
        Secondary-B: Rebuild KiiPS-IL with -DskipTests=true
        Secondary-C: Continue KiiPS-PG build (background)

T3:15 - Primary: KiiPS-COMMON build complete ✅
        → Notifies Secondary-A: "Dependency ready, proceed with FD build"

T3:20 - Secondary-A: Restart KiiPS-FD build
        mvn clean package -pl :KiiPS-FD -am -DskipTests=true

T5:00 - Secondary-B: KiiPS-IL build complete ✅ (tests skipped)

T7:00 - Secondary-A: KiiPS-FD build complete ✅

T3:25 - Primary → User: "⚠️ Advisory:
        KiiPS-IL has 3 failing tests in InvestmentServiceTest.java
        Options:
        A) ✅ Deploy with skipped tests (common for local dev)
        B) ⚠️ Fix tests before deployment
        C) 📊 Review test failures and decide

        I proceeded with Option A to meet timeline. Tests should be fixed before production."

T12:00 - Secondary-C: KiiPS-PG build complete ✅
T12:30 - Primary: All services built successfully
         📊 Build Summary:
         - KiiPS-COMMON: 2m 15s ✅
         - KiiPS-FD: 3m 40s ✅ (after COMMON dependency)
         - KiiPS-IL: 1m 50s ✅ (tests skipped)
         - KiiPS-PG: 9m 30s ✅ (slow dependency resolution)

         Total time: 12m 30s (vs original estimate: 5m)
         Adaptation successful - all services ready for deployment
T12:30 - Complete ✅
```

### 9.3 Example: Ethical Veto in Action

**User Request:** "Quickly fix the investor data by running this SQL script on the production database"

**Layer 1 (Aspirational) - Ethical Analysis:**
```
T0:00 - Primary: Read file: /Users/younghwankang/WORK/WORKSPACE/KiiPS/fix_investor_data.sql
T0:03 - Primary: Analyze SQL script content
T0:05 - Primary: 🚨 CRITICAL ETHICAL CONCERN DETECTED (Layer 1)
        → UPDATE statement without WHERE clause detected
        → Target: Production database (app-kiips.properties)
        → Impact: 50,000+ investor records at risk

Primary → User: "🚨 CRITICAL SAFETY VIOLATION - EXECUTION BLOCKED

I've detected a high-risk operation that violates safety principles:

**Issue Detected:**
- SQL script contains: `UPDATE TB_INVESTOR SET status = 'ACTIVE'`
- No WHERE clause = ALL 50,000+ investor records will be modified
- Target database: PRODUCTION (not staging/local)
- No backup confirmation requested

**Why This Is Dangerous:**
1. ❌ REDUCE SUFFERING: Mass data corruption would affect all users
2. ❌ INCREASE PROSPERITY: Production downtime could cost business value
3. ❌ INCREASE UNDERSTANDING: No clear rollback plan specified

**Recommended Safe Actions:**
1. ✅ SAFEST: Add WHERE clause to target specific investors
   Example: WHERE investor_id IN (...)

2. ✅ SAFE: Test on staging database first
   Change: app-kiips.properties → app-stg.properties

3. ✅ SAFE: Create backup before modification
   Run: pg_dump production_db > backup_$(date).sql

4. ⚠️ RISKY: Request explicit approval with rollback plan
   Confirm you understand the impact and have tested recovery

5. ❌ BLOCKED: Execute on production without safeguards

**Current Status:**
🛑 Execution BLOCKED by Layer 1 (Aspirational) ethical constraints
📋 Awaiting your guidance on how to proceed safely

I cannot and will not execute this command as-is. Please choose a safe alternative."
```

**Alternative Scenario - Service Configuration Change:**

**User Request:** "Update all service ports in production property files"

**Layer 1 (Aspirational) - Ethical Analysis:**
```
T0:00 - Primary: Identify target files
        → KiiPS-FD/src/main/resources/app-kiips.properties
        → KiiPS-IL/src/main/resources/app-kiips.properties
        → KiiPS-PG/src/main/resources/app-kiips.properties
        (15 more files...)

T0:10 - Primary: 🚨 ETHICAL CONCERN DETECTED (Layer 1)
        → Bulk modification of production configuration
        → No rollback plan specified
        → Running services may crash

Primary → User: "⚠️ SAFETY CONCERN - SEEKING APPROVAL

Detected bulk modification of production configurations.

**Impact Analysis:**
- 18 production property files will be modified
- Services: FD, IL, PG, AC, SY, LP, RT, BATCH, MOBILE, etc.
- Current running services may require restart
- Potential downtime: 5-10 minutes per service

**Ethical Considerations:**
1. REDUCE SUFFERING: Service interruptions affect active users
2. INCREASE PROSPERITY: Coordinate changes during maintenance window
3. INCREASE UNDERSTANDING: Document changes for team visibility

**Safe Alternatives:**
A) ✅ Create feature branch in SVN for review
B) ✅ Test port changes in staging environment first
C) ✅ Schedule maintenance window with team notification
D) ⚠️ Proceed with immediate changes (requires approval + backup)

**My Recommendation:**
Use app-stg.properties for testing, then schedule coordinated
production deployment during off-peak hours.

How would you like to proceed?"
```

## 10. Error Handling and Recovery

### 10.1 Common Error Scenarios (Multi-Layer Analysis)

**Error Type 1: Deadlock (Layer 5)**
```
Detection: Circular wait timeout (30s)

Layer 5 Response:
1. Detect circular dependency
2. Abort youngest lock request
3. Notify affected agent

Layer 4 Response:
4. Investigate root cause
5. Redesign task allocation

Layer 1 Check:
- Did deadlock cause data loss? No → Low severity
- Learning captured for protocol improvement ✅
```

**Error Type 2: Tool Failure (Layer 6)**
```
Detection: Tool returns error status

Layer 6 Response:
1. Agent logs error details
2. Agent retries once

Layer 3 Response:
3. Agent self-assesses capability
4. If capable → Continue with alternative
5. If not → Escalate to Primary

Layer 1 Check:
- Does failure risk data integrity? → Abort if yes
```

### 10.2 Rollback Procedures (Layer 4 + Layer 1)

**Checkpoint Strategy:**
```json
{
  "checkpoints": [
    {
      "id": "cp_001",
      "timestamp": "T0:00",
      "layer": "initialization",
      "state": "Initial state before any operations",
      "files_snapshot": [],
      "ethical_clearance": true
    },
    {
      "id": "cp_002",
      "timestamp": "T1:00",
      "layer": "task_prosecution",
      "state": "After data analysis complete",
      "files_snapshot": ["q4_analysis.xlsx"],
      "ethical_clearance": true,
      "validation": "Cross-checked by Secondary-A"
    }
  ]
}
```

**Rollback Process:**
```python
def emergency_rollback(reason, target_checkpoint=None):
    # Layer 1: Ethical check
    if not reason.is_ethical_violation():
        log_warning("Non-ethical rollback - verify necessity")
    
    # Layer 5: Halt all agents
    broadcast_to_all_agents({"type": "emergency_halt"})
    
    # Layer 4: Identify rollback target
    checkpoint = get_last_validated_checkpoint()
    
    # Layer 6: Restore files
    restore_files_from_checkpoint(checkpoint)
    
    # Layer 2: Notify user
    notify_user({
        "type": "rollback_complete",
        "reason": reason,
        "checkpoint_restored": checkpoint.id
    })
```

### 10.3 Incident Logging (Feedback Loop)

**Comprehensive Incident Log Format:**
```json
{
  "incident_id": "INC_20250101_001",
  "timestamp": "2025-01-01T14:45:30Z",
  "severity": "high",
  "type": "data_corruption",
  "affected_layers": [
    "layer_1_aspirational (data integrity violated)",
    "layer_6_task_prosecution (merge operation failed)"
  ],
  "root_cause": {
    "immediate": "File encoding mismatch (UTF-8 vs UTF-16)",
    "underlying": "No pre-merge encoding validation"
  },
  "ethical_impact": {
    "principle_violated": "Data integrity (Layer 1)",
    "suffering_caused": "None (detected before user exposure)"
  },
  "resolution": {
    "action_taken": "Emergency rollback to cp_003",
    "fix_implemented": "Added pre-merge encoding normalization",
    "time_to_resolve": "15 minutes"
  },
  "prevention": {
    "protocol_updates": [
      {
        "section": "4.1 File Operation Protocol",
        "addition": "Pre-merge validation: Normalize all encodings to UTF-8"
      }
    ]
  }
}
```

---

## 11. Performance Optimization (Layer 2 + Layer 4)

### 11.1 Parallelization Guidelines (Executive Function)

**When to Parallelize (Layer 4 Decision):**
- ✅ Independent research tasks
- ✅ Different file types (docx + xlsx + pptx)
- ✅ Read-only operations
- ✅ Separate codex sessions
- ✅ Agent capabilities match distinct subtasks (Layer 3 informed)

**When NOT to Parallelize (Layer 1 + Layer 4):**
- ❌ Sequential dependencies
- ❌ Same file modifications
- ❌ Shared state operations
- ❌ Rate-limited resources
- ❌ Ethical concerns about parallel processing

### 11.2 Resource Utilization Targets

| Metric | Target | Warning | Critical | Layer |
|--------|--------|---------|----------|-------|
| Concurrent Agents | 1+2-3 | 5+ | 8+ | Layer 4 |
| File Locks | <3 | 5+ | 10+ | Layer 5 |
| Web Fetch/min | <20 | 30+ | 50+ | Layer 6 |
| Token Budget | >20% | <20% | <10% | Layer 3 |
| Ethical Concerns | 0 | 1 | 2+ | Layer 1 |

### 11.3 Efficiency Patterns (Layer 4 Design Patterns)

**Pattern 1: Fan-Out / Fan-In**
```
Primary (1) [Strategic coordination]
  ↓ [Fan-Out: Distribute independent subtasks]
Secondary-A, B, C (3 parallel)
  ↓ [Fan-In: Collect and aggregate]
Primary (1) [Integration]

Efficiency Gain: ~3x speedup
```

**Pattern 2: Pipeline**
```
Stage 1: Extract (parallel) → Validate
Stage 2: Transform (parallel) → Validate
Stage 3: Load (Primary)

Efficiency Gain: ~2x speedup
```

**Pattern 3: Hierarchical**
```
Primary [Strategic decomposition]
├─ Secondary-A [Component A]
│  ├─ Sub-task A1
│  └─ Sub-task A2
└─ Secondary-B [Component B]
   ├─ Sub-task B1
   └─ Sub-task B2

Efficiency Gain: ~2x + better quality
```

---

## 12. Continuous Improvement & Feedback Loops

### 12.1 Telemetry Collection (All Layers → Feedback Loop)

**What to Log:**
```json
{
  "execution_id": "exec_20250101_001",
  "telemetry": {
    "layer_1_aspirational": {
      "ethical_concerns_raised": 0,
      "ethical_vetos_invoked": 0,
      "ethical_compliance_score": 1.0
    },
    "layer_2_global_strategy": {
      "mission_success": true,
      "strategic_pivots": 0,
      "user_satisfaction": "high"
    },
    "layer_3_agent_model": {
      "self_assessments_accurate": 0.90,
      "capability_overestimations": 1,
      "learning_events": 3
    },
    "layer_4_executive_function": {
      "task_decomposition_quality": 0.88,
      "dynamic_reallocations": 0,
      "conflict_resolutions": 2
    },
    "layer_5_cognitive_control": {
      "task_completion_rate": 1.0,
      "deadlocks": 0,
      "conflicts": 2
    },
    "layer_6_task_prosecution": {
      "tool_success_rate": 0.96,
      "skill_invocations": 3,
      "mcp_sessions": 2
    }
  }
}
```

### 12.2 Post-Execution Review (Feedback Loop → All Layers)

**Comprehensive Review Process:**
```python
class PostExecutionReview:
    def conduct_review(self):
        # Layer 1: Ethical compliance review
        self.review_layer_1_ethical_compliance()
        
        # Layer 2: Strategic goal achievement
        self.review_layer_2_goal_alignment()
        
        # Layer 3: Agent model accuracy
        self.review_layer_3_agent_assessments()
        
        # Layer 4: Executive decision quality
        self.review_layer_4_coordination()
        
        # Layer 5: Operational efficiency
        self.review_layer_5_execution_control()
        
        # Layer 6: Technical execution
        self.review_layer_6_tool_usage()
        
        return self.generate_comprehensive_report()
```

### 12.3 Cross-Agent Learning (Layer 3 ↔ Feedback Loop)

**Learning Share Protocol:**
```json
{
  "learning_event_id": "learn_20250101_001",
  "type": "cross_agent_learning",
  "initiated_by": "secondary_a",
  "insight": {
    "title": "Excel pivot tables require 2x processing time",
    "context": "Discovered during Q4 analysis",
    "confidence": 0.85,
    "sample_size": 1
  },
  "recommendation": {
    "action": "Update estimation model: Check for pivot tables, apply 2x multiplier",
    "affected_layer": "layer_3_agent_model"
  },
  "validation_request": {
    "status": "pending",
    "validators": ["secondary_b", "secondary_c"]
  }
}
```

**Learning Validation Cycle:**
```
T0: Secondary-A shares learning (Confidence: 0.85, Sample: 1)
T+3 days: Secondary-B validates → CONFIRM (Confidence: 0.88, Sample: 2)
T+5 days: Secondary-C validates → CONFIRM (Confidence: 0.91, Sample: 3)
T+5 days: Learning PROMOTED to validated ✅
          Applied to all agents' estimation models
```

### 12.4 Adaptation Cycle
```
┌─────────────────────────────────────────┐
│ EXECUTION                                │
│ • Telemetry collected from all layers   │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ TELEMETRY ANALYSIS                      │
│ • Identify patterns                     │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ LEARNING EXTRACTION                     │
│ • What worked? What failed?             │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ PROTOCOL UPDATE                         │
│ • Update all 6 ACE layers               │
└─────────────────────────────────────────┘
                ↓
┌─────────────────────────────────────────┐
│ NEXT EXECUTION                          │
│ • Apply updated protocol                │
└─────────────────────────────────────────┘
```

**Update Triggers:**
1. Every 10 executions: Review efficiency
2. After any incident: Update protocol
3. Weekly: Aggregate learnings
4. Monthly: Major protocol review
5. After ethical veto: Immediate Layer 1 review
## 13. Testing and Validation

### 13.1 Pre-Deployment Checklist

**Before enabling parallel execution with ACE Framework:**
- [ ] Layer 1: All agents understand ethical principles
- [ ] Layer 2: Global strategy template ready
- [ ] Layer 3: Agent self-assessment working
- [ ] Layer 4: Executive function tested
- [ ] Layer 5: File lock protocol validated
- [ ] Layer 6: Skill auto-invocation tested
- [ ] MCP CLI session management verified
- [ ] Conflict resolution tested
- [ ] Rollback mechanisms validated
- [ ] Emergency abort confirmed
- [ ] Cross-agent learning functional
- [ ] Telemetry collection working

### 13.2 Test Scenarios

**Test 1: Basic Parallel Execution**
- Setup: 1 Primary + 2 Secondary
- Expected: No conflicts, 2x efficiency ✅

**Test 2: Conflict Handling**
- Setup: Both agents modify same file
- Expected: Primary wins, Secondary queues ✅

**Test 3: Ethical Veto**
- Setup: File contains sensitive PII
- Expected: Immediate halt, user notified ✅

**Test 4: Dynamic Reallocation**
- Setup: File 10x larger than expected
- Expected: Task split across agents ✅

**Test 5: Agent Self-Assessment**
- Setup: Assign task beyond capability
- Expected: Agent declines transparently ✅

### 13.3 Performance Benchmarks

**Sequential vs Parallel:**
```
Task: 3-file report (docx + xlsx + pptx)

Sequential: 20min
Parallel (v2.0): 12min (1.7x)
Parallel + ACE (v3.0): 10min (2.0x)

Quality:
Sequential: Good
v2.0: Good
v3.0: Excellent (skill guidelines + ethical compliance)
```

---

## 14. Maintenance and Evolution

### 14.1 Document Updates

**Version Control:**
- Major (X.0): Breaking changes to ACE structure
- Minor (3.X): New sections, significant additions
- Patch (3.0.X): Clarifications, examples

**Review Cycle:**
- Every 10 executions: Micro-optimizations
- After incidents: Immediate updates
- Weekly: Aggregate learnings
- Monthly: Major review
- Quarterly: Strategic assessment

### 14.2 Feedback Integration

**Sources:**
1. Layer 1: Ethical concern logs
2. Layer 2: User satisfaction scores
3. Layer 3: Self-assessment accuracy
4. Layer 4: Coordination efficiency
5. Layer 5: Conflict rates
6. Layer 6: Tool success rates
7. Cross-Layer: Overall efficiency

**Improvement Process:**
```
Collect → Identify patterns → Propose updates → Test → Deploy → Monitor
```

### 14.3 Future Enhancements

**Planned Features:**
1. Layer 1: Adaptive ethical thresholds
2. Layer 2: Predictive strategy (ML-based)
3. Layer 3: Advanced agent models
4. Layer 4: AI-powered coordination
5. Layer 5: Smart lock management
6. Layer 6: Tool orchestration
7. Cross-Layer: Real-time dashboard
8. Cross-Layer: Federated learning

---

## Appendix A: Quick Reference

### ACE Layer Cheat Sheet
```
Layer 1 (Aspirational): "Why we exist"
├─ Reduce suffering
├─ Increase prosperity
└─ Increase understanding

Layer 2 (Global Strategy): "What we're achieving"
├─ User's mission
└─ Success criteria

Layer 3 (Agent Model): "What we're capable of"
├─ Self-awareness
└─ Continuous learning

Layer 4 (Executive Function): "How we organize"
├─ Task decomposition
└─ Dynamic adaptation

Layer 5 (Cognitive Control): "How we coordinate"
├─ Task selection
└─ Conflict prevention

Layer 6 (Task Prosecution): "How we execute"
├─ Tool invocation
└─ Skill application

Feedback Loops: "How we improve"
└─ Protocol evolution
```

### Agent Decision Matrix

| Situation | Layer | Primary | Secondary |
|-----------|-------|---------|-----------|
| Ethical concern | Layer 1 | Invoke veto | Invoke veto |
| User goal unclear | Layer 2 | Clarify | Escalate |
| Task exceeds capability | Layer 3 | Reassign | Decline |
| Deviation from plan | Layer 4 | Reallocate | Report |
| File locked | Layer 5 | Wait/abort | Wait |
| Tool failure | Layer 6 | Retry | Report |

### Tool Call Cheat Sheet
```bash
# Skill invocation
view /mnt/skills/public/{docx|pptx|xlsx|pdf}/SKILL.md

# Codex with session
codex-cli:codex
  sessionId: "primary-{ts}" or "secondary-{id}-{ts}"
  sandbox: "read-only" | "workspace-write"
  workingDirectory: "/home/claude/{workspace}/"

# File operations
1. Acquire lock
2. create_file or str_replace
3. Release lock
```

---

## Appendix B: Troubleshooting Guide

### Issue: Ethical concern unclear

**Layer:** Layer 1
**Solution:**
```
If Critical → ETHICAL_VETO immediately
If Medium → Escalate to Primary
If Low → Document and proceed with monitoring
```

### Issue: Agent overestimated capability

**Layer:** Layer 3
**Solution:**
```
1. Agent escalates to Primary
2. Primary reassigns or simplifies
3. Agent updates self-model
4. Positive reinforcement for transparency
```

### Issue: Deadlock detected

**Layer:** Layer 5
**Solution:**
```
1. Auto-abort youngest lock
2. Re-queue operation
3. Implement lock ordering
4. Update protocol
```

### Issue: Skill file inaccessible

**Layer:** Layer 6 + Layer 1
**Solution:**
```
1. Agent notifies Primary
2. Primary checks alternatives
3. Assess quality threshold
4. Proceed with degraded quality OR abort
```

---

## Appendix C: Glossary

**ACE Framework Terms:**
- **Aspirational Layer (Layer 1)**: Ethical principles and constraints
- **Global Strategy Layer (Layer 2)**: Overall mission and goals
- **Agent Model Layer (Layer 3)**: Self-awareness and capabilities
- **Executive Function Layer (Layer 4)**: Task coordination
- **Cognitive Control Layer (Layer 5)**: Execution control
- **Task Prosecution Layer (Layer 6)**: Actual execution
- **Feedback Loops**: Continuous learning mechanism

**Core Protocol Terms:**
- **Primary Agent**: Coordinator with strategic authority
- **Secondary Agent**: Specialist with self-awareness
- **File Lock**: Exclusive access control
- **Checkpoint**: Validated state snapshot
- **Session ID**: Unique execution context
- **Sandbox**: Security policy
- **Skill**: Specialized knowledge document

**ACE-Specific Terms:**
- **Ethical Veto**: Any agent halts on Layer 1 violation
- **Self-Assessment**: Capability evaluation before task
- **Dynamic Reallocation**: Mid-execution task reassignment
- **Capability Match**: Fitness score (0-1) for task
- **Strategic Pivot**: Major approach change
- **Cross-Agent Learning**: Validated shared insights
- **Telemetry**: Performance data from all layers

---

## Document Control

**Approval:**
- Author: KiiPS Development Team / ACE Framework Integration Team
- Reviewer: KiiPS Architecture Team
- Approved By: Primary Agent (in KiiPS operations)
- Project: KiiPS (Korea Investment Information Processing System)

**Change Log:**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2024-12-30 | Initial protocol | System |
| 2.0 | 2025-01-01 | Skill/MCP Integration | Enhanced |
| 3.0 | 2025-01-01 | **ACE Framework Integration**: 6-layer architecture, Aspirational principles, Agent Model, Dynamic reallocation, Feedback Loops | ACE Edition |
| 3.0.1-KiiPS | 2026-01-02 | **KiiPS Edition**: All examples converted to KiiPS microservices context (Spring Boot, Java 8, Maven), KiiPS Skills integration (kiips-maven-builder, kiips-service-deployer, kiips-api-tester, kiips-log-analyzer, kiips-feature-planner), KiiPS directory structure, KiiPS-specific workflows and scenarios | KiiPS Edition |

**Distribution:**
- KiiPS Development Team
- KiiPS Architecture Team
- All Claude instances working on KiiPS project
- Multi-agent development teams using KiiPS
- Internal KiiPS documentation

**Related Documents:**
- ACE Framework Specification (ace-fca.md)
- KiiPS Architecture Documentation (architecture.md)
- KiiPS API Specification (api.md)
- KiiPS Deployment Guide (deployment.md)
- KiiPS Troubleshooting Guide (troubleshooting.md)
- KiiPS CLAUDE.md (Project Instructions)
- Parallel Agents Safety Protocol v3.0 (Original ACE Edition)
- Multi-Agent Coordination Best Practices

---

**END OF DOCUMENT**

---

## Summary of v3.0 Enhancements

### New Core Features:
1. ✅ Layer 1 (Aspirational): Ethical guardrails
2. ✅ Layer 2 (Global Strategy): Mission-driven coordination
3. ✅ Layer 3 (Agent Model): Self-aware agents
4. ✅ Layer 4 (Executive Function): Dynamic reallocation
5. ✅ Layer 5 (Cognitive Control): Enhanced conflict prevention
6. ✅ Layer 6 (Task Prosecution): Robust tool integration
7. ✅ Feedback Loops: Continuous learning

### Key Benefits:
- **Safety**: Ethical layer prevents harm
- **Efficiency**: Self-aware agents optimize allocation
- **Quality**: Continuous learning improves outcomes
- **Adaptability**: Dynamic reallocation handles complexity
- **Transparency**: All decisions explainable
- **Trust**: Ethical compliance + communication

**Result**: Production-ready parallel execution protocol that is safe, efficient, adaptive, and continuously improving.