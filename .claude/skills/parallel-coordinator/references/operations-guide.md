# Parallel Coordinator Operations Guide

## Validation Gates

### Pre-Execution Validation

**Before starting parallel execution**:
```bash
# 1. Verify no uncommitted changes in main codebase
svn status | grep '^[ACDMR]' && echo "ABORT: Uncommitted changes" && exit 1

# 2. Verify .temp/ directory structure exists
[ -d ".temp/agent_workspaces" ] || mkdir -p .temp/agent_workspaces/{architect,developer,ui-designer,checklist}/{drafts,proposals}

# 3. Verify no active file locks from previous execution
rm -f .temp/coordination/locks/*.lock

# 4. Verify agent metadata files are valid
for metadata in .temp/agent_workspaces/*/metadata.json; do
  jq empty "$metadata" || echo "ERROR: Invalid JSON in $metadata"
done
```

**Checklist**:
- [ ] Task decomposition reviewed (Layer 4)
- [ ] Agent capabilities match tasks (Layer 3)
- [ ] No overlapping file assignments
- [ ] Ethical clearance obtained (Layer 1)
- [ ] Rollback checkpoints defined
- [ ] All required skills identified

### Mid-Execution Validation

**During parallel execution (every 30s)**:
```python
def monitor_parallel_execution():
    while execution_in_progress:
        for agent in active_agents:
            # 1. Check progress update
            metadata = read_agent_metadata(agent)
            if metadata.last_updated > 30_seconds_ago:
                log_warning(f"{agent}: No progress update")

            # 2. Check for deadlocks
            if detect_circular_wait(all_locks):
                abort_youngest_lock()

            # 3. Check for ethical concerns
            if metadata.ethical_concerns:
                escalate_to_user(metadata.ethical_concerns)

        sleep(30)
```

**Checklist**:
- [ ] Progress updates received from all agents
- [ ] No deadlocks detected
- [ ] File locks properly acquired/released
- [ ] No ethical concerns raised
- [ ] Agent self-monitoring active

### Post-Execution Validation

**After parallel execution completes**:
```bash
# 1. Collect all proposals
find .temp/agent_workspaces/*/proposals/ -type f

# 2. Run Maven compile
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am
# MUST PASS (zero errors)

# 3. Run tests
cd KiiPS-HUB && mvn test -pl :KiiPS-FD
# MUST PASS (all tests)

# 4. Check MyBatis binding
grep -r '\$\{' KiiPS-FD/src/main/resources/mapper/ && echo "FAIL: ${} found" || echo "PASS: #{} only"

# 5. Clean up locks and temp files
rm -f .temp/coordination/locks/*.lock
```

**Checklist**:
- [ ] All subtasks completed successfully
- [ ] Maven compile passed
- [ ] All tests passed
- [ ] MyBatis #{} binding verified
- [ ] SCSS dark theme rules followed ([data-theme=dark])
- [ ] No orphaned lock files remain

---

## Emergency Abort Procedure

### Abort Conditions

**Immediate abort if**:
- Ethical constraint violation detected (Layer 1)
- Data corruption detected
- Circular dependency (deadlock cannot be resolved)
- User cancellation request
- Critical tool failure

### Abort Procedure

```python
def emergency_abort(reason, severity):
    # 1. Broadcast abort signal
    write_file(".temp/coordination/status/abort_signal", {
        "reason": reason,
        "severity": severity,
        "timestamp": now(),
        "initiated_by": current_agent
    })

    # 2. All agents freeze current state
    for agent in all_agents:
        agent.freeze()
        agent.release_all_locks()

    # 3. Rollback to last validated checkpoint
    latest_checkpoint = find_latest_checkpoint(".temp/integration/checkpoints/")
    if latest_checkpoint:
        restore_from_checkpoint(latest_checkpoint)
    else:
        # No checkpoint → No changes applied to src/
        log_info("No checkpoint found. No rollback needed.")

    # 4. Notify user with incident report
    notify_user({
        "type": "emergency_abort",
        "severity": severity,
        "reason": reason,
        "actions_taken": "Rolled back to last validated state",
        "next_steps": "Please review the reason and provide guidance"
    })
```

---

## Integration Workflow

### Collecting Agent Proposals

```bash
# 1. List all proposals
find .temp/agent_workspaces/*/proposals/ -type f -name "*.java" -o -name "*.jsp" -o -name "*.xml" -o -name "*.scss"

# Output:
# .temp/agent_workspaces/developer/proposals/FdReturnController.java
# .temp/agent_workspaces/developer/proposals/FdReturnService.java
# .temp/agent_workspaces/ui-designer/proposals/fdReturn.jsp
# .temp/agent_workspaces/developer/proposals/FdReturnMapper.xml
```

### Reviewing Proposals

```python
def review_proposals():
    for agent_workspace in glob(".temp/agent_workspaces/*/"):
        proposals = glob(f"{agent_workspace}/proposals/*")

        for proposal_file in proposals:
            # 1. Read proposal
            content = read_file(proposal_file)

            # 2. Determine target location in src/
            target = map_proposal_to_target(proposal_file)

            # 3. Check for conflicts with other proposals
            if conflicts_exist(target):
                move_to_conflict_resolution(proposal_file, target)
                continue

            # 4. Preview changes
            if file_exists(target):
                show_diff(target, proposal_file)

            # 5. Apply proposal (after validation gates pass)
            copy_file(proposal_file, target)
```

### Creating Checkpoints

```bash
# Before applying proposals to src/
mkdir -p .temp/integration/checkpoints/$(date +%Y%m%d_%H%M%S)

# After validation gates pass
echo "Checkpoint created: $(date +%Y%m%d_%H%M%S)" >> .temp/integration/checkpoints/log.txt
```

---

## Monitoring & Debugging

### View Agent Status
```bash
cat .temp/agent_workspaces/developer/metadata.json | jq '.status, .progress'
cat .temp/agent_workspaces/ui-designer/metadata.json | jq '.status, .workload'
```

### View Active Locks
```bash
ls -la .temp/coordination/locks/
```

### View Task Assignments
```bash
cat .temp/coordination/tasks/*.json | jq '.'
```

### Debug Conflicts
```bash
# List files in conflict resolution
ls -la .temp/integration/conflicts/

# View diff
diff .temp/integration/conflicts/file_agent-a.java \
     .temp/integration/conflicts/file_agent-b.java
```

---

## Complete Example: Fund Return Rate Feature

### Task Decomposition
```json
{
  "subtasks": [
    {
      "id": "architecture_review",
      "agent": "kiips-architect",
      "task": "API design and DB table review for fund return rate",
      "skill": "kiips-feature-planner",
      "output": "architecture-review.md",
      "dependencies": []
    },
    {
      "id": "backend_impl",
      "agent": "kiips-developer",
      "task": "Controller + Service + Mapper for fund return rate",
      "skill": "kiips-feature-planner",
      "output": "KiiPS-FD/src/main/java/.../controller/FdReturnController.java",
      "dependencies": ["architecture_review"]
    },
    {
      "id": "ui_impl",
      "agent": "kiips-ui-designer",
      "task": "JSP page with RealGrid for fund return rate display",
      "skill": "kiips-ui-component-builder",
      "output": "KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/fd/fdReturn.jsp",
      "dependencies": ["architecture_review"]
    },
    {
      "id": "checklist",
      "agent": "checklist-generator",
      "task": "Code review checklist for fund return rate feature",
      "output": "checklist-review.md",
      "dependencies": ["backend_impl", "ui_impl"]
    }
  ]
}
```

### Execution Timeline
```
T0:00 - Primary: Invokes kiips-architect
T0:10 - architect: Completes architecture review
        → Writes to .temp/agent_workspaces/architect/proposals/

T0:11 - Primary: Invokes kiips-developer + kiips-ui-designer in parallel
        → Both can proceed (architecture review available)

T0:25 - developer: Completes Controller + Service + Mapper
T0:30 - ui-designer: Completes JSP + RealGrid configuration
T0:31 - Primary: Invokes checklist-generator
T0:35 - checklist: Completes review checklist

Feature completed in 35 minutes vs ~60 minutes sequential = 1.7x speedup
```

### Integration
```bash
cp .temp/agent_workspaces/developer/proposals/FdReturnController.java KiiPS-FD/src/main/java/.../controller/
cp .temp/agent_workspaces/developer/proposals/FdReturnService.java KiiPS-FD/src/main/java/.../service/
cp .temp/agent_workspaces/developer/proposals/FdReturnMapper.xml KiiPS-FD/src/main/resources/mapper/fd/
cp .temp/agent_workspaces/ui-designer/proposals/fdReturn.jsp KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/fd/
```

### Validation Results
```
cd KiiPS-HUB && mvn compile -pl :KiiPS-FD -am  # No errors
cd KiiPS-HUB && mvn test -pl :KiiPS-FD          # All tests pass
cd KiiPS-HUB && mvn package -pl :KiiPS-FD -am   # BUILD SUCCESS
```
