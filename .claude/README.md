# KiiPS - Claude Code Configuration

> KiiPS (Korea Investment Information Processing System) Claude Code 설정 디렉토리

---

## Overview

| 항목 | 수량 |
|------|------|
| Agents | 11 (5 specialist + 4 manager + 2 coordinator) |
| Shared Protocols | 5 (ACE, parallel, delegation, effort, quality) |
| Skills | 21 (15 KiiPS + 6 meta/infra) |
| Commands | 15+ |
| Hooks | 8 (PreToolUse 2, PostToolUse 3, Stop 2, Others 4) |
| Checklists | 4 (code-review, deployment, testing, jsp-spring) |
| MCP Servers | context7, serena, playwright, pencil, claude-in-chrome |

---

## Directory Structure

```
.claude/
├── agents/                     # Sub-agent definitions
│   ├── kiips-architect.md      # System design expert
│   ├── kiips-developer.md      # Coding specialist
│   ├── kiips-ui-designer.md    # UI/UX expert (JSP, Bootstrap, RealGrid)
│   ├── kiips-realgrid-generator.md  # RealGrid code generator
│   ├── code-simplifier.md      # Refactoring specialist
│   ├── checklist-generator.md  # Checklist automation
│   ├── primary-coordinator.md  # Multi-agent orchestrator
│   ├── managers/
│   │   ├── deployment-manager.md
│   │   ├── build-manager.md
│   │   ├── feature-manager.md
│   │   └── ui-manager.md
│   └── shared/                 # Shared agent protocols
│       ├── ace-framework.md
│       ├── parallel-agents-protocol.md
│       ├── delegation-template.md
│       ├── effort-scaling.md
│       └── quality-gates.md
├── commands/                   # Slash commands (/command-name)
│   ├── build-service.md        # Maven build
│   ├── deploy-service.md       # Service deployment
│   ├── service-status.md       # Service health check
│   ├── view-logs.md            # Log viewer
│   ├── review.md               # Code review
│   ├── dev-docs.md             # Dev documentation
│   ├── save-and-compact.md     # Context save + compact
│   ├── resume.md               # Session restore
│   ├── config-backup.md        # Config backup/restore
│   ├── draft-commits.md        # Commit draft generator
│   └── ...
├── skills/                     # Active skills
│   ├── kiips-realgrid-guide/   # RealGrid 2.6.3 guide
│   ├── kiips-ui-component-builder/  # JSP component templates
│   ├── kiips-scss-theme-manager/    # SCSS theme management
│   ├── kiips-responsive-validator/  # Responsive design validation
│   ├── kiips-darktheme-applier/     # Dark theme workflow
│   ├── kiips-a11y-checker/     # WCAG 2.1 AA accessibility
│   ├── kiips-feature-planner/  # Feature planning
│   ├── kiips-detail-page-planner/   # Detail page planning
│   ├── kiips-test-runner/      # Test execution (JUnit)
│   ├── verification-loop/      # Boris Cherny verification
│   ├── parallel-coordinator/   # ACE parallel execution
│   ├── agent-improvement/      # Agent self-improvement
│   ├── agent-observability/    # Agent tracing/metrics
│   └── ...
├── hooks/                      # Event hooks
│   ├── ethicalValidator.js     # PreToolUse: dangerous operation blocker
│   ├── autoFormatter.js        # PostToolUse: auto formatting
│   ├── buildChecker.js         # PostToolUse: build validation
│   ├── scssValidator.sh        # PostToolUse: SCSS rule enforcement
│   ├── agentTracer.js          # PostToolUse:Task: agent spawn tracing
│   ├── stopEvent.js            # Stop: code analysis + session metrics
│   ├── contextMonitor.js       # Stop: interaction counter + save reminder
│   ├── userPromptSubmit.js     # UserPromptSubmit: pattern detection
│   ├── parallelCoordinator.js  # Pre/Post Task coordination
│   └── update-reminder.sh      # SessionStart: update check
├── coordination/               # Multi-agent coordination
│   ├── feedback-loop.js        # Execution metrics + learning events
│   ├── checkpoint-manager.js   # Checkpoint create/restore
│   ├── task-allocator.js       # Task allocation
│   ├── file-lock-manager.js    # File locking
│   └── manager-coordinator.js  # Manager coordination
├── ace-framework/              # ACE 6-layer architecture
│   ├── ace-framework-guide.md
│   ├── layer1-aspirational.md
│   ├── layer3-agent-model.json
│   ├── layer4-executive.md
│   ├── layer45-orchestration.md
│   └── ace-config.json
├── checklists/                 # Quality checklists
│   ├── code-review.md
│   ├── deployment.md
│   ├── testing.md
│   └── jsp-spring-specific.md  # KiiPS-specific (JSP/Spring/SCSS/RealGrid)
├── output-styles/
│   └── efficient.md            # Concise output mode
├── memory/                     # Persistent memory
│   ├── common-patterns.md
│   └── kiips-quick-reference.md
├── agents-registry.json        # Auto-generated agent registry
├── skill-rules.json            # Skill trigger rules
├── settings.json               # Hooks, permissions, LSP config
├── settings.local.json         # Local permissions, MCP servers
└── mcp.json                    # MCP server configuration
```

---

## Hook Events

| Event | Hook | Purpose |
|-------|------|---------|
| **PreToolUse** | ethicalValidator.js | DB DROP/TRUNCATE, 파일 삭제, 인증 정보 차단 |
| **PreToolUse** | (inline python) | .env, secrets, app-kiips.properties 파일 보호 |
| **PostToolUse:Edit\|Write** | autoFormatter.js | 코드 자동 포맷팅 |
| **PostToolUse:Edit\|Write** | buildChecker.js | 빌드 검증 |
| **PostToolUse:Edit\|Write** | scssValidator.sh | SCSS 다크테마 규칙 검증 |
| **PostToolUse:Task** | agentTracer.js | 에이전트 스폰 추적 (JSONL) |
| **Stop** | stopEvent.js | Java/JSP/SCSS 패턴 분석 + 세션 메트릭 |
| **Stop** | contextMonitor.js | 인터랙션 카운터 (15/25 임계값) |
| **UserPromptSubmit** | userPromptSubmit.js | 패턴 감지 + 스킬 활성화 |
| **Notification** | osascript | macOS 알림 (Claude Code - KiiPS) |
| **SessionStart** | update-reminder.sh | 업데이트 확인 |
| **PreCompact** | pre-compact-save.sh | 컨텍스트 자동 저장 |

---

## Key Skills

### KiiPS 도메인 스킬

| Skill | 용도 | Trigger Keywords |
|-------|------|-----------------|
| kiips-realgrid-guide | RealGrid 그리드 생성/설정/Excel | realgrid, grid, 그리드 |
| kiips-ui-component-builder | JSP 컴포넌트 템플릿 | component, 컴포넌트, 폼 |
| kiips-scss-theme-manager | SCSS 테마 + 디자인 토큰 | scss, theme, 테마 |
| kiips-darktheme-applier | 다크테마 적용 워크플로우 | dark, 다크테마, 다크모드 |
| kiips-responsive-validator | 반응형 디자인 검증 | responsive, 반응형 |
| kiips-a11y-checker | WCAG 2.1 AA 접근성 | accessibility, 접근성 |
| kiips-feature-planner | 기능 개발 계획 | plan, feature, 계획 |
| kiips-test-runner | JUnit/Jest/Karma 테스트 | test, 테스트, 커버리지 |

### 인프라 스킬

| Skill | 용도 |
|-------|------|
| verification-loop | Boris Cherny 검증 피드백 루프 |
| parallel-coordinator | ACE Framework 병렬 에이전트 실행 |
| agent-improvement | 에이전트 자기 개선 루프 |
| agent-observability | 에이전트 추적 + 메트릭 |

---

## Quick Commands

```bash
/build-service          # Maven 빌드
/deploy-service         # 서비스 배포
/service-status         # 서비스 상태 확인
/view-logs              # 로그 조회
/review                 # 코드 리뷰
/verify-app             # 앱 종합 검증
/draft-commits          # SVN/Git 커밋 초안
/save-and-compact       # 컨텍스트 저장 + compact
/resume                 # 세션 복원
/config-backup          # 설정 백업/복원
/dev-docs               # 개발 문서 생성
/my-workflow            # 워크플로우 가이드
```

---

## Tech Stack Reference

- **Backend**: Spring Boot 2.4.2, Java 8, MyBatis
- **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.6.3, ApexCharts
- **Build**: Maven Multi-Module (KiiPS-HUB)
- **VCS**: SVN (primary), Git (secondary)
- **DB**: PostgreSQL
- **Ports**: Gateway 8088, UI 8100, FD 8601, IL 8401, Common 8701, Login 8801

---

## Configuration Files

| File | Purpose |
|------|---------|
| `settings.json` | Hooks, permissions, LSP (Java/jdtls) |
| `settings.local.json` | Local bash permissions, MCP config |
| `mcp.json` | MCP server definitions |
| `agents-registry.json` | Agent metadata registry |
| `skill-rules.json` | Skill auto-trigger rules |

---

**Version**: 2.0.0-KiiPS
**Last Updated**: 2026-02-06
