# KiiPS - Claude Code Configuration

> KiiPS (Korea Investment Information Processing System) Claude Code 설정 디렉토리

---

## Overview

| 항목 | 실측 수량 | 단일 진실원 |
|------|----------|------------|
| Agents | 13 (Specialist 7 + Manager 4 + System 2) | [`agents-registry.json`](./agents-registry.json) (수동 유지) |
| Shared 프로토콜 | 4 | `agents/shared/` |
| Skills | 27 (KiiPS 도메인 22 + 공통 3 + 디자인 2) | [`skills-registry.json`](./skills-registry.json) (자동 생성) + [`SKILLS.md`](./SKILLS.md) |
| Commands | 23 | [`commands-registry.json`](./commands-registry.json) (자동 생성) + [`COMMANDS.md`](./COMMANDS.md) |
| Hooks (유니크) | 23 | `hooks/` (.min.js 제외, .js/.sh 순수 훅 스크립트) |
| Hooks (settings 바인딩) | 14 across 9 events | [`settings.json`](./settings.json) |
| Permission Gates | 8 (2a PreToolUse) | [`docs/architecture.html`](./docs/architecture.html) |
| MCP Servers | context7, serena, playwright, pencil, claude-in-chrome | `mcp.json` |

> drift 감지: `bash tests/catalog-integrity.sh` — 문서 수량 vs 실측 파일 수량 대조.

---

## Directory Structure

```
.claude/
├── agents/                  # 13 에이전트 + 4 shared 프로토콜
│   ├── managers/            # build/deployment/feature/ui
│   ├── shared/              # delegation/effort/quality/kiips-evaluation
│   └── {specialist}.md      # kiips-architect/-developer/-ui-designer/...
├── commands/                # 23 커맨드 (/command-name)
├── skills/                  # 31 스킬 (SKILL.md entry point)
├── hooks/                   # 20 훅 (14 settings 바인딩 + 6 허브 위임)
├── checklists/              # 품질 체크리스트
├── docs/
│   ├── architecture.html    # 하네스 시각 구조
│   ├── harness-boundaries.md # AST·rollback 한계 문서 (v3.5.2 신규)
│   └── GLOBAL_LOCAL_FILES.md
├── rules/                   # CLAUDE.md에서 참조되는 rule 모듈
├── memory/                  # 영속 메모리 (common-patterns, quick-reference)
├── output-styles/
├── scripts/                 # 빌드/유틸 스크립트 (build-registries.js)
├── tests/                   # 회귀 테스트 (catalog-integrity, hook-regression, permission-gate, ...)
├── evals/                   # 에이전트 평가
├── state/                   # 훅 공용 상태 (빌드 카운터·scope·evidence)
├── learning/                # Instinct/observations 영속화
├── agents-registry.json     # 에이전트 레지스트리 (수동 유지)
├── skills-registry.json     # 스킬 레지스트리 (자동 생성: build-registries.js)
├── commands-registry.json   # 커맨드 레지스트리 (자동 생성: build-registries.js)
├── skill-rules.json         # 스킬 자동 트리거 규칙
├── settings.json            # 훅/권한/LSP 설정 (프로젝트 스코프)
├── settings.local.json      # 로컬 bash 허용 + MCP 설정
└── mcp.json                 # MCP 서버 정의
```

---

## Hook Events (settings.json 실측)

| Event | Matcher | Hook | Role |
|-------|---------|------|------|
| **PreToolUse** | `Bash\|Edit\|Write` | ethicalValidator.js | Tier A AST · rm/DROP/curl\|bash |
| **PreToolUse** | `Bash\|Edit\|Write` | permissionGate.js | Tier A AST · service control/pom.xml/SVN |
| **PreToolUse** | `Edit\|Write` | inline python | .env/app-*.properties 차단 |
| **PreToolUse** | `Edit\|Write` | mybatisBindingGuard.js | SQL `${}` 방지 |
| **PreToolUse** | `Edit\|Write` | multiFileGate.js | 3+ 파일 승인 |
| **PreToolUse** | `Edit\|Write` | jspXssGuard.js | JSP scriptlet XSS |
| **PreToolUse** | `Edit\|Write` | impactAnalyzer.js | COMMON/UTILS 의미 영향 |
| **UserPromptSubmit** | `*` | userPromptSubmit.js | 스킬 활성화 + specialist 라우팅 |
| **PostToolUse** | `Bash\|Edit\|Write` | postToolOrchestrator.js | **허브** — autoFormatter·buildChecker·scssValidator·themeCssVerGuard·pendingFiles·observe·agentStateManager·outputSecretFilter 순차 실행 |
| **Stop** | `*` | stopEvent.js | **허브** — backupGc.sh·observationsRoller.js 호출 + 세션 메트릭 |
| **PreCompact** | `*` | pre-compact-save.sh | 컨텍스트 자동 저장 |
| **Notification** | `*` | notificationHandler.js | macOS 알림 |
| **SessionStart** | `*` | update-reminder.sh → regressionGuard.sh | 업데이트 체크 + 회귀 가드 |

총 14 바인딩 + 허브 내부 위임(postToolOrchestrator·stopEvent 경유) = **23개 유니크 훅 스크립트** (`.min.js` 미니파이 사본은 별도).

---

## Permission Gate Tiers

| Tier | 특징 | 훅 |
|------|------|-----|
| **A — AST-filtered (Bash-only)** | shellContextTokenizer로 literal/comment/heredoc 내부 false-positive 제거 | ethicalValidator (v3.4.0), permissionGate (v3.5.1) |
| **B — Regex / path-based (Edit\|Write)** | 순수 정규식 또는 파일 경로 매칭. AST 미적용 | inline python, mybatisBindingGuard, multiFileGate, jspXssGuard, impactAnalyzer |

**알려진 경계**: [docs/harness-boundaries.md](./docs/harness-boundaries.md)

---

## Quick Reference

```bash
# 카탈로그 (단일 진실원)
cat .claude/agents-registry.json   # 13 에이전트 (수동 유지)
cat .claude/skills-registry.json   # 31 스킬 (자동 생성)
cat .claude/commands-registry.json # 24 커맨드 (자동 생성)

# 레지스트리 재생성 (스킬/커맨드 추가/삭제 시)
node .claude/scripts/build-registries.js

# 하네스 상태 검증
bash .claude/tests/hook-regression.sh            # 훅 회귀 테스트
node .claude/tests/permission-gate.test.js       # permissionGate 38 sub-tests
node .claude/tests/shell-context-tokenizer.test.js  # tokenizer 28 sub-tests
bash .claude/tests/catalog-integrity.sh          # 문서-실측 drift 검증

# 주요 커맨드
/plan                 # 5단계 구조화 계획
/verify               # Fresh-context 독립 검증
/commit-push-pr       # 검증 후 커밋 + PR
/check-health         # 프로젝트 종합 점검
```

---

## Tech Stack Reference

- **Backend**: Spring Boot 2.4.2, Java 8, MyBatis
- **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.6.3, ApexCharts
- **Build**: Maven Multi-Module (KiiPS-HUB)
- **VCS**: SVN (primary), Git (.claude/ 로컬 관리)
- **DB**: PostgreSQL
- **Ports**: Gateway 8088, UI 8100, FD 8601, IL 8401, Common 8701, Login 8801
  ([PORTS.md](./PORTS.md) 참조)

---

## Configuration Files

| File | Purpose |
|------|---------|
| `settings.json` | 훅 바인딩 (14건), 권한 규칙 (deny/allow), LSP (Java/jdtls) |
| `settings.local.json` | 로컬 bash 허용 패턴, MCP 서버 |
| `mcp.json` | MCP 서버 정의 |
| `agents-registry.json` | 에이전트 메타데이터 (수동 유지) |
| `skill-rules.json` | 스킬 자동 트리거 규칙 (keywords + intentPatterns + fileTriggers) |

---

## Version History

- **3.5.2** (2026-04-22) — Harness Boundaries 문서화 (Known 3건 해결) · catalog-integrity 도입
- **3.5.1** (2026-04-22) — permissionGate AST Filter
- **3.5.0** (2026-04-22) — Permission Gate 도입 · primary-coordinator 제거
- **3.4.0** — ethicalValidator AST Filter
- **3.0.0** — 5 게이트 하네스 체계 확립
- **2.0.0** — 초기 에이전트/스킬 체계 (deprecated)

---

**Last Updated**: 2026-04-22 (v3.5.2, harness boundaries documentation)
**Single Source of Truth**: `agents-registry.json` · `SKILLS.md` · `COMMANDS.md` · `settings.json`
