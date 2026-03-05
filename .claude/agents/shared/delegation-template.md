---
name: delegation-template
description: Structured template for delegating tasks to subagents with clear boundaries
---

# Task Delegation Template

Structured format for delegating tasks to subagents to prevent duplicated work and gaps.

**Source**: [Anthropic Multi-Agent Research System](https://www.anthropic.com/engineering/multi-agent-research-system)

> "Early versions suffered from agents duplicating work, leaving gaps, emphasizing the importance of detailed task descriptions for effective delegation."

## Required Elements

Every task delegation MUST include all four elements:

### 1. Objective
Clear, specific goal statement
- What success looks like
- Measurable outcome
- Acceptance criteria

### 2. Output Format
Expected deliverable structure
- File paths and naming conventions
- Code style requirements
- Documentation expectations

### 3. Tools & Sources
Resources to use
- Skills to invoke
- Reference files to consult
- APIs or services to use

### 4. Task Boundaries
Explicit exclusions to prevent overlap
- Files to NOT modify
- Actions to NOT take
- Dependencies to wait for

---

## Template

```markdown
## Task: {descriptive_task_name}

### Objective
{Clear statement of what needs to be accomplished}

Success Criteria:
- [ ] {criterion_1}
- [ ] {criterion_2}
- [ ] {criterion_3}

### Output Format
**Location**: `.temp/agent_workspaces/{agent}/proposals/`

**Files to create:**
- `{FileName}.java` - {description}
- `{FileName}Mapper.xml` - {description}

**Code Requirements:**
- Java 8 compatibility
- Follow existing patterns in {reference_file}
- MyBatis #{} parameter binding only

### Tools & Sources
**Invoke skill**: `{skill_name}`

**Reference files:**
- `{path_to_reference_1}` - {why to reference}
- `{path_to_reference_2}` - {why to reference}

**APIs/Services:**
- {api_name} - {how to use}

### Task Boundaries

**DO NOT:**
- Modify files in: `{excluded_paths}`
- Implement: `{excluded_features}` (other agent handles)
- Write: `{excluded_outputs}` (other agent handles)

**WAIT FOR:**
- `{dependency_agent}` to complete: `{what to wait for}`

**STOP IF:**
- You need to modify excluded files
- Task scope exceeds defined boundaries
- Blocking dependency not yet complete
```

---

## Real Examples

### Example 1: Controller + Service

```markdown
## Task: Create FundReturnController and Service

### Objective
Create REST API endpoint for fund return rate queries.

Success Criteria:
- [ ] GET /FDAPI/fund/return/{fundId} responds with return data
- [ ] @Valid parameter validation on fundId
- [ ] @Transactional(rollbackFor = Exception.class) on service
- [ ] GlobalExceptionHandler covers custom exceptions

### Output Format
**Location**: `.temp/agent_workspaces/kiips-developer/proposals/`

**Files to create:**
- `FundReturnController.java` - REST Controller with @Valid
- `FundReturnService.java` - Business logic with @Transactional
- `FundReturnServiceImpl.java` - Service implementation

**Code Requirements:**
- Java 8 compatibility
- ResponseEntity return type
- Follow patterns in existing KiiPS-FD controllers

### Tools & Sources
**Invoke skill**: `kiips-feature-planner`

**Reference files:**
- `KiiPS-FD/src/main/java/kr/co/logossystem/kiips/fd/controller/` - Existing controller pattern
- `KiiPS-FD/src/main/java/kr/co/logossystem/kiips/fd/service/` - Service pattern
- `KiiPS-COMMON/` - Common_API_Service 사용법

**APIs/Services:**
- Common_API_Service - 서비스 간 호출 시 사용

### Task Boundaries

**DO NOT:**
- Modify files in: `KiiPS-COMMON/`, `KiiPS-UTILS/`, `KiiPS-HUB/`
- Implement: JSP UI (kiips-ui-designer handles)
- Write: MyBatis mapper XML (별도 태스크)

**WAIT FOR:**
- None (first in dependency chain)

**STOP IF:**
- Need to add new COMMON dependency
- Need to modify Gateway routing
```

### Example 2: MyBatis Mapper

```markdown
## Task: Create FundReturnMapper

### Objective
Create MyBatis mapper for fund return rate DB queries.

Success Criteria:
- [ ] SELECT query with #{} parameter binding (NO ${})
- [ ] Dynamic SQL with proper <if> conditions
- [ ] Pagination support for large datasets
- [ ] DELETE/UPDATE queries have WHERE conditions

### Output Format
**Location**: `.temp/agent_workspaces/kiips-developer/proposals/`

**Files to create:**
- `FundReturnMapper.java` - Mapper interface
- `FundReturnMapper.xml` - SQL mapper XML

**Code Requirements:**
- MyBatis #{} binding only
- SqlSession usage pattern
- Follow existing mapper conventions

### Tools & Sources
**Invoke skill**: `kiips-feature-planner`

**Reference files:**
- `KiiPS-FD/src/main/resources/mapper/` - Existing mapper patterns
- `KiiPS-UTILS/src/main/java/kr/co/logossystem/kiips/utils/` - DAO patterns

### Task Boundaries

**DO NOT:**
- Use ${} parameter binding (SQL Injection risk)
- Modify existing mapper files
- Modify shared UTILS module

**WAIT FOR:**
- `kiips-architect` to confirm: DB table schema

**STOP IF:**
- Need to create new DB tables
- Need to modify existing queries
```

### Example 3: JSP + RealGrid Page

```markdown
## Task: Create Fund Return Rate Grid Page

### Objective
Create JSP page with RealGrid 2.6.3 table for fund return data.

Success Criteria:
- [ ] RealGrid GridView + DataProvider initialized
- [ ] Columns: 펀드코드, 펀드명, 수익률, 기준일자
- [ ] Excel export button functional
- [ ] AJAX .fail() error handler included
- [ ] [data-theme=dark] SCSS support

### Output Format
**Location**: `.temp/agent_workspaces/kiips-ui-designer/proposals/`

**Files to create:**
- `fundReturn.jsp` - JSP page with RealGrid grid
- `_fundReturn.scss` - Component SCSS (dark theme included)

**Code Requirements:**
- JSTL/EL tags for data binding
- Loading spinner pattern
- Bootstrap responsive layout
- RealGrid 2.6.3 API only

### Tools & Sources
**Invoke skill**: `kiips-realgrid-guide`

**Reference files:**
- `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/fd/` - Existing JSP pattern
- `KiiPS-UI/src/main/resources/static/css/sass/themes/default/_dark.scss` - Dark theme variables
- `KiiPS-UI/src/main/resources/static/css/sass/layouts/_dark.scss` - Component dark styles

### Task Boundaries

**DO NOT:**
- Modify Java files (kiips-developer handles)
- Use .dark or .theme-dark selectors
- Change layout properties in SCSS (width/height/display/position/margin/padding)
- Modify existing JSP pages

**WAIT FOR:**
- `kiips-developer` to complete: FundReturnController (API endpoint)

**STOP IF:**
- API endpoint not ready
- Need new RealGrid license/configuration
```

---

## Anti-Patterns

### Bad: Vague Objective
```markdown
### Objective
Create a page for fund data.
```

### Good: Clear Objective
```markdown
### Objective
Create Fund Return Rate JSP page with RealGrid 2.6.3 grid displaying
fund code, fund name, return rate, and base date with Excel export.

Success Criteria:
- [ ] GridView + DataProvider properly initialized
- [ ] 4 columns with correct data types and formatters
- [ ] Excel export via toolbar button
- [ ] AJAX error handling with .fail()
```

### Bad: Missing Boundaries
```markdown
(No task boundaries section)
```

### Good: Explicit Boundaries
```markdown
### Task Boundaries
**DO NOT:**
- Modify Java source (kiips-developer handles)
- Edit existing SCSS files (create new _component.scss)
- Use ${} in MyBatis mappers

**WAIT FOR:**
- REST API endpoint to be available
```

### Bad: Implicit Dependencies
```markdown
### Tools & Sources
Check the mapper somewhere in the codebase
```

### Good: Explicit Dependencies
```markdown
### Tools & Sources
**Reference files:**
- `KiiPS-FD/src/main/resources/mapper/FundMapper.xml` - Existing mapper pattern
- `KiiPS-UTILS/src/main/java/.../BaseDao.java` - DAO base class

**WAIT FOR:**
- `kiips-architect` schema design in proposals/
```

---

## Quick Reference

### Checklist Before Delegation

- [ ] Objective has measurable success criteria?
- [ ] Output location and format specified?
- [ ] Skills and reference files listed?
- [ ] Boundaries clearly state DO NOT?
- [ ] Dependencies with WAIT FOR noted?
- [ ] STOP conditions for edge cases?

### Common Boundaries by Agent

| Agent | Typical DO NOT |
|-------|---------------|
| kiips-architect | code implementation, UI work, builds |
| kiips-developer | shared modules (COMMON/UTILS/HUB), JSP/SCSS, deployment |
| kiips-ui-designer | Java files, pom.xml, builds, deployment |
| kiips-realgrid-generator | Java files, pom.xml, non-RealGrid JSP |
| code-simplifier | new features, API contracts, deployment |
| checklist-generator | code modification, builds, deployment |

---

**Version**: 2.0.0-KiiPS | **Last Updated**: 2026-02-06
