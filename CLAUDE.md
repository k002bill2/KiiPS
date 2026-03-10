# CLAUDE.md

> KiiPS (Korea Investment Information Processing System) - Claude Code 가이드

---

## Quick Reference

```bash
# Build (항상 KiiPS-HUB에서 실행)
# [빌드담당자] cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am

# Run
./start.sh && tail -f logs/log.$(date "+%Y-%m-%d")-0.log

# Stop
./stop.sh
```

---

## Key Rules

1. **Always build from KiiPS-HUB** - 의존성 해결 필수
2. **Read subdirectory CLAUDE.md first** - 하위 디렉토리 작업 전 해당 CLAUDE.md 확인
3. **Use SVN** (not Git) → [rules/svn-workflow.md](.claude/rules/svn-workflow.md)
4. **증거 기반 완료** - 실행 증거 없이 완료 선언 금지 → [rules/verification.md](.claude/rules/verification.md)
5. **Fresh-context 검증** - 구현 후 `/verify`로 독립 검증 (확인 편향 제거)
6. **반합리화** - 요청 범위만 수정, 범위 확장 금지 → [rules/anti-rationalization.md](.claude/rules/anti-rationalization.md)

---

## Rules (상세 규칙 파일)

| 규칙 | 요약 | 상세 |
|------|------|------|
| Dark Theme | `[data-theme=dark]` 셀렉터, 색상만 변경 | → [dark-theme.md](.claude/rules/dark-theme.md) |
| Editing & Revert | 범위 제한, 정확한 복원, 최소 편집 | → [editing.md](.claude/rules/editing.md) |
| Error Handling | 근본 원인 우선, 한 번에 하나 | → [error-handling.md](.claude/rules/error-handling.md) |
| SVN Workflow | SVN 명령어, 커밋 규칙 | → [svn-workflow.md](.claude/rules/svn-workflow.md) |
| Verification | 증거 기반 완료, 검증 게이트 | → [verification.md](.claude/rules/verification.md) |
| Anti-Rationalization | HARD-GATE, Ralph Loop 감지 | → [anti-rationalization.md](.claude/rules/anti-rationalization.md) |

---

## Project Structure (Monorepo)

- **Parent POM**: `KiiPS-HUB/` (항상 여기서 빌드)
- **빌드 순서**: COMMON → UTILS → 서비스 모듈
- **SCSS 위치**: `KiiPS-UI/src/main/resources/static/css/sass/`
- **JSP 위치**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`
- **모듈 검색**: API/공통 코드 추적 시 모든 모듈 검색 (루트만 보지 말 것)
- **주요 모듈**: KiiPS-FD(펀드), KiiPS-IL(투자원장), KiiPS-AC(회계), KiiPS-SY(시스템), KiiPS-LP(LP관리), KiiPS-EL(전자원장), KIIPS-BATCH, KIIPS-HELP

---

## Documentation

| 문서 | 내용 |
|------|------|
| [architecture.md](./architecture.md) | 시스템 구조, 모듈, 통신 패턴 |
| [api.md](./api.md) | API Gateway, 엔드포인트, 인증 |
| [deployment.md](./deployment.md) | 빌드, 배포, 환경 관리 |
| [troubleshooting.md](./troubleshooting.md) | 문제 해결, 디버깅 |
| [docs/REALGRID_GUIDE.md](./docs/REALGRID_GUIDE.md) | RealGrid 2.6.3 가이드 |
| [docs/SCSS_GUIDE.md](./docs/SCSS_GUIDE.md) | SCSS 테마 시스템 |
| [docs/AGENT_TEAMS_GUIDE.md](./docs/AGENT_TEAMS_GUIDE.md) | Agent Teams 팀 운영 가이드 |

---

## Service Ports

| Service | Port | Service | Port |
|---------|------|---------|------|
| Gateway | 8088 | Login | 8801 |
| Common | 8701 | UI | 8100 |
| FD | 8601 | IL | 8401 |

---

## Tech Stack

- **Backend**: Spring Boot 2.4.2, Java 8
- **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.6.3, ApexCharts
- **Build**: Maven Multi-Module
- **VCS**: SVN

---

## Active Skills

| Skill | 용도 |
|-------|------|
| `kiips-ace-essentials` | ACE 핵심 가드레일 (위험 차단, 보호 모듈, 빌드 순서, 에이전트 라우팅) |
| `kiips-page-pattern-guide` | JSP 페이지 표준 패턴 (레이아웃, Include, 연동) |
| `kiips-search-filter-guide` | 검색필터 (MainComponent, Constant, 필터바) |
| `kiips-button-guide` | 버튼 영역 (inc_main_button, 권한, 아이콘) |
| `kiips-realgrid-guide` | RealGrid 그리드 생성, 설정, Excel, 성능 |
| `kiips-ui-component-builder` | JSP 컴포넌트 템플릿 생성 |
| `kiips-scss-theme-manager` | SCSS 테마 및 디자인 토큰 |
| `kiips-responsive-validator` | 반응형 디자인 검증 |
| `kiips-darktheme-applier` | 다크테마 전용 적용 워크플로우 |
| `kiips-regist-modal-guide` | 등록/수정 모달 생성 (폼, 그리드, columnGroup) |
| `kiips-a11y-checker` | WCAG 2.1 AA 접근성 검증 |
| `kiips-api-tester` | API 엔드포인트 테스트, 헬스 체크 |
| `kiips-backend-guidelines` | Controller/Service/DAO 표준 패턴, API 설계 |
| `kiips-build-deploy` | 빌드+배포 통합 워크플로우 (빌드→테스트→배포→헬스체크) |
| `kiips-common-patterns` | KiiPS-COMMON/UTILS 공통 코드, 예외 처리 |
| `kiips-database-verification` | DB 변경 검증, MyBatis 안전 패턴, DBA 승인 |
| `kiips-detail-page-planner` | 상세페이지 개발 계획서 자동 생성 |
| `kiips-feature-planner` | Feature 개발 계획 수립 (마이크로서비스) |
| `kiips-frontend-guidelines` | JSP/jQuery/Bootstrap 표준 패턴, AJAX 규칙 |
| `kiips-log-analyzer` | 로그 분석, 에러 탐지, 모니터링 |
| `kiips-maven-builder` | Maven Multi-Module 빌드, 의존성 해결 |
| `kiips-mybatis-guide` | MyBatis mapper, 동적 SQL, SQL Injection 방지 |
| `kiips-security-guide` | Spring Security, XSS/CSRF 방어, 인증/인가 |
| `kiips-service-deployer` | 서비스 배포, 중지, 재시작 |
| `kiips-startup` | 서비스 시작 Pre-flight 체크 및 순차 기동 |
| `kiips-test-runner` | JUnit/Jest/Karma 테스트 실행 및 검증 |
| `parallel-coordinator` | 병렬 에이전트 실행 조정 (ACE Framework) *(글로벌 동일본 존재)* |
| `kiips-continuous-learning` | 연속 학습 시스템 (Instinct 생성, 패턴 감지, 진화) *(글로벌: continuous-learning)* |
| `kiips-session-wrap` | 세션 종료 정리 (변경 요약, 학습, 인수인계) *(글로벌: session-wrap)* |

---

## Active Commands (21개)

**Core** — 핵심 워크플로우

| Command | 용도 |
|---------|------|
| `/plan` | 구조화된 5단계 작업 계획 (CLARIFY→EXPLORE→PLAN→VALIDATE→EXECUTE) |
| `/session-wrap` | 세션 종료 정리 (COLLECT→SUMMARIZE→LEARN→HANDOFF) |
| `/verify` | Fresh-context 독립 검증 |
| `/learn` | 교훈 기록 + 자동화 제안 |
| `/evolve` | Instinct 클러스터링 → 스킬/커맨드 진화 |
| `/diagnose` | 진단 우선 디버깅 |
| `/scope-lock` | 파일 범위 제한 모드 |

**Utility** — 보조 도구

| Command | 용도 |
|---------|------|
| `/review` | 코드 리뷰 (보안, 성능, 품질) |
| `/check-health` | 프로젝트 종합 상태 점검 |
| `/commit-push-pr` | SVN 커밋 파이프라인 |
| `/deploy-with-tests` | 안전 배포 (Test→Build→Deploy→Health) |
| `/draft-commits` | 커밋 초안 생성 |
| `/simplify-code` | 코드 단순화 분석 |
| `/test-coverage` | JUnit 테스트 + JaCoCo 커버리지 |
| `/my-workflow` | 개발 워크플로우 |
| `/eval` | AI 에이전트 평가 |
| `/gemini-scan` | Gemini 보안 스캔 |
| `/service-status` | 서비스 상태 확인 |
| `/view-logs` | 로그 조회 |
| `/instinct-status` | 학습 패턴 조회 |
| `/kiips-linked-approval-template` | 연계승인 템플릿 |

---

## Core Modules

| 모듈 | 역할 |
|------|------|
| **KiiPS-HUB** | Parent POM |
| **KiiPS-COMMON** | 공통 서비스 |
| **KiiPS-UTILS** | 공통 DAO |
| **KiiPS-UI** | 웹 인터페이스 (WAR) |
| **KIIPS-APIGateway** | API 라우팅 |

---

## Environment Files

- `app-local.properties` - 로컬 개발
- `app-stg.properties` - 스테이징
- `app-kiips.properties` - 프로덕션

---

## Agent Teams (에이전트 팀)

> 상세 가이드: [docs/AGENT_TEAMS_GUIDE.md](./docs/AGENT_TEAMS_GUIDE.md)

---

## 글로벌 vs KiiPS 전용 파일 분리

범용 파일은 `~/.claude/`에 글로벌 버전이 존재하며, KiiPS 프로젝트에서는 KiiPS 도메인 지식이 포함된 로컬 버전을 유지합니다.

| 유형 | 글로벌 (`~/.claude/`) | KiiPS 로컬 (`.claude/`) | 비고 |
|------|----------------------|------------------------|------|
| **스킬** | `continuous-learning`, `session-wrap`, `parallel-coordinator` | `kiips-continuous-learning`, `kiips-session-wrap`, `parallel-coordinator` | KiiPS 도메인 패턴 포함 |
| **커맨드** | `learn`, `evolve`, `verify`, `plan`, `session-wrap`, `instinct-status`, `eval`, `scope-lock` | 동일 이름 (KiiPS 특화) | KiiPS 모듈/SVN 참조 |
| **훅** | `observe.js`, `outputSecretFilter.js`, `pre-compact-save.sh`, `update-reminder.sh` | 동일 이름 (KiiPS 도메인 패턴 포함) | `observe.js`는 `domain-config.json`으로 분리 |
| **에이전트** | `planner.md`, `verify-agent.md` | `kiips-planner.md`, `verify-agent.md` | KiiPS 검증 체크리스트 포함 |

**도메인 패턴 설정**: `.claude/learning/domain-config.json`에서 KiiPS 9개 도메인 패턴 정의 (글로벌 `observe.js`가 로드)

---

**상세 정보는 위 Documentation 링크 참조**
