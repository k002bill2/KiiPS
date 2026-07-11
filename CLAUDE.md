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
| Editing | 범위 제한, 정확한 복원, 최소 편집 | [→](.claude/rules/editing.md) |

> 도메인 한정 규칙은 always-on 대신 **조건부**(작업 시 해당 스킬/커맨드가 참조)로 전환:
> Dark Theme→`kiips-scss`, Validation→`legacy-compliance-checker`, Error Handling→`/diagnose`, Power Stack→보류(`.gstack/.gsd/.superpowers` 미존재).
> 전체 규칙 위반 스캔은 `/check-rules`(`.claude/rules/` 직접 읽음 — 파일은 보존).

## Tech Stack & Structure

- **Backend**: Spring Boot 2.4.2 / Java 8 / Maven Multi-Module / SVN
- **Frontend**: JSP / jQuery / Bootstrap / RealGrid 2.6.3 / ApexCharts
- **Parent POM**: `KiiPS-HUB/` (빌드 시작점)
- **Core 모듈**: KiiPS-COMMON · KiiPS-UTILS · KiiPS-UI · KIIPS-APIGateway
- **도메인 모듈**: KiiPS-FD · KiiPS-IL · KiiPS-AC · KiiPS-SY · KiiPS-LP · KiiPS-EL · KIIPS-BATCH · KIIPS-HELP
- **SCSS**: `KiiPS-UI/src/main/resources/static/css/sass/`
- **JSP**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`

## 하네스 (Harness)

> 도메인 작업을 전문 에이전트 + 스킬로 분담해 일관·검증 가능하게 수행하는 체계.
> 에이전트/스킬/훅 자산 목록은 [.claude/README.md](.claude/README.md) 카탈로그가 단일 진실원 (여기서 재나열 금지).

**트리거:**
- 신규 JSP 페이지 자동 생성(기획→생성→평가 파이프라인) → `kiips-page-harness` (자동 트리거)
- 병렬 에이전트 조정 · ACE 가드레일 · 스킬 체이닝 → `kiips-orchestration` (수동 참조 — `disable-model-invocation`)
- 하네스 점검 · 확장 · 동기화 → `harness:harness` 플러그인 (user 스코프, [revfactory/harness](https://github.com/revfactory/harness))
- 단순 질문은 직접 응답 가능.

**변경 이력:**
| 날짜 | 변경 내용 | 대상 | 사유 |
|------|----------|------|------|
| 2026-06-20 | 하네스 포인터 최초 등록 | CLAUDE.md | 외부 harness 플러그인 규약(Phase 5-4) 적용 |

## 더 보기

- 포트/환경 → [.claude/PORTS.md](.claude/PORTS.md)
- 에이전트/스킬/훅 카탈로그 → [.claude/README.md](.claude/README.md)
- 시스템 아키텍처 → [architecture.md](./architecture.md) · [api.md](./api.md) · [deployment.md](./deployment.md) · [troubleshooting.md](./troubleshooting.md)
- Figma 디자인 연동(디자인 시스템 규칙) → [docs/figma-design-system-rules.md](docs/figma-design-system-rules.md)
