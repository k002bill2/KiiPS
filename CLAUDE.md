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
7. **Context 90% Rule** - 컨텍스트 90% 초과 시 `/compact` 실행
8. **Boundary Validation** - Controller에서 입력 검증 → [rules/validation.md](.claude/rules/validation.md)

---

## Rules

| 규칙 | 요약 | 상세 |
|------|------|------|
| Dark Theme | `[data-theme=dark]` 셀렉터, 색상만 변경 | → [dark-theme.md](.claude/rules/dark-theme.md) |
| Editing & Revert | 범위 제한, 정확한 복원, 최소 편집 | → [editing.md](.claude/rules/editing.md) |
| Error Handling | 근본 원인 우선, 한 번에 하나 | → [error-handling.md](.claude/rules/error-handling.md) |
| SVN Workflow | SVN 명령어, 커밋 규칙 | → [svn-workflow.md](.claude/rules/svn-workflow.md) |
| Verification | 증거 기반 완료, 검증 게이트 | → [verification.md](.claude/rules/verification.md) |
| Anti-Rationalization | HARD-GATE, Ralph Loop 감지 | → [anti-rationalization.md](.claude/rules/anti-rationalization.md) |
| Validation | Controller 입력 검증, Boundary 원칙 | → [validation.md](.claude/rules/validation.md) |
| Power Stack | 4단계 프레임워크 파이프라인 | → [power-stack.md](.claude/rules/power-stack.md) |

---

## Project Structure

- **Parent POM**: `KiiPS-HUB/` (항상 여기서 빌드)
- **빌드 순서**: COMMON → UTILS → 서비스 모듈
- **SCSS**: `KiiPS-UI/src/main/resources/static/css/sass/`
- **JSP**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`
- **모듈 검색**: API/공통 코드 추적 시 모든 모듈 검색
- **주요 모듈**: KiiPS-FD, KiiPS-IL, KiiPS-AC, KiiPS-SY, KiiPS-LP, KiiPS-EL, KIIPS-BATCH, KIIPS-HELP
- **Core**: KiiPS-HUB(Parent POM), KiiPS-COMMON(공통), KiiPS-UTILS(DAO), KiiPS-UI(WAR), KIIPS-APIGateway

## Tech Stack

- **Backend**: Spring Boot 2.4.2, Java 8
- **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.6.3, ApexCharts
- **Build**: Maven Multi-Module | **VCS**: SVN

## Service Ports

| Gateway | UI | Common | FD | IL | Login |
|---------|-----|--------|-----|-----|-------|
| 8088 | 8100 | 8701 | 8601 | 8401 | 8801 |

## Environment

- `app-local.properties` / `app-stg.properties` / `app-kiips.properties`

---

## Catalogs & References

| 문서 | 내용 |
|------|------|
| [Active Skills](.claude/SKILLS.md) | 30+ 스킬 카탈로그 |
| [Active Commands](.claude/COMMANDS.md) | 24개 커맨드 카탈로그 |
| [글로벌/로컬 분리](.claude/docs/GLOBAL_LOCAL_FILES.md) | ~/.claude/ vs .claude/ 파일 관리 |
| [Agent Teams](./docs/AGENT_TEAMS_GUIDE.md) | 팀 운영 가이드 |
| [architecture.md](./architecture.md) | 시스템 구조, 모듈, 통신 |
| [api.md](./api.md) | API Gateway, 인증 |
| [deployment.md](./deployment.md) | 빌드, 배포, 환경 |
| [troubleshooting.md](./troubleshooting.md) | 문제 해결 |
| [RealGrid Guide](./docs/REALGRID_GUIDE.md) | RealGrid 2.6.3 |
| [SCSS Guide](./docs/SCSS_GUIDE.md) | 테마 시스템 |
