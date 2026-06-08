# CLAUDE.md

> KiiPS (Korea Investment Information Processing System) - Claude Code 가이드

## Quick Reference

```bash
# Build (반드시 KiiPS-HUB에서 실행)
cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am

# Run / Stop
./start.sh && tail -f logs/log.$(date "+%Y-%m-%d")-0.log
./stop.sh
```

## Key Rules (Top 5)

1. **Build from KiiPS-HUB** — 의존성 해결 필수
2. **모듈별 CLAUDE.md 우선** — 하위 디렉토리 작업 전 해당 모듈 CLAUDE.md 확인
3. **SVN, not Git** → [rules/svn-workflow.md](.claude/rules/svn-workflow.md)
4. **증거 기반 완료** — 실행 증거 없이 완료 선언 금지 → [rules/verification.md](.claude/rules/verification.md)
5. **반합리화** — 요청 범위만 수정 → [rules/anti-rationalization.md](.claude/rules/anti-rationalization.md)

## Rules 카탈로그

| 규칙 | 요약 | 상세 |
|------|------|------|
| Dark Theme | `[data-theme=dark]` 셀렉터, 색상만 변경 | [→](.claude/rules/dark-theme.md) |
| Editing | 범위 제한, 정확한 복원, 최소 편집 | [→](.claude/rules/editing.md) |
| Error Handling | 근본 원인 우선, 한 번에 하나 | [→](.claude/rules/error-handling.md) |
| Validation | Controller 입력 검증, Boundary 원칙 | [→](.claude/rules/validation.md) |
| Power Stack | 4단계 프레임워크 파이프라인 | [→](.claude/rules/power-stack.md) |

## Tech Stack & Structure

- **Backend**: Spring Boot 2.4.2 / Java 8 / Maven Multi-Module / SVN
- **Frontend**: JSP / jQuery / Bootstrap / RealGrid 2.6.3 / ApexCharts
- **Parent POM**: `KiiPS-HUB/` (빌드 시작점)
- **Core 모듈**: KiiPS-COMMON · KiiPS-UTILS · KiiPS-UI · KIIPS-APIGateway
- **도메인 모듈**: KiiPS-FD · KiiPS-IL · KiiPS-AC · KiiPS-SY · KiiPS-LP · KiiPS-EL · KIIPS-BATCH · KIIPS-HELP
- **SCSS**: `KiiPS-UI/src/main/resources/static/css/sass/`
- **JSP**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`

## 더 보기

- 포트/환경 → [.claude/PORTS.md](.claude/PORTS.md)
- 에이전트/스킬/훅 카탈로그 → [.claude/README.md](.claude/README.md)
- 시스템 아키텍처 → [architecture.md](./architecture.md) · [api.md](./api.md) · [deployment.md](./deployment.md) · [troubleshooting.md](./troubleshooting.md)
