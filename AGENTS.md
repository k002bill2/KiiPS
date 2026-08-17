# AGENTS.md

> KiiPS (Korea Investment Information Processing System) - Codex 가이드

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
2. **모듈별 AGENTS.md 우선** — 하위 디렉토리 작업 전 해당 모듈 AGENTS.md 확인
3. **SVN, not Git** → [rules/svn-workflow.md](.Codex/rules/svn-workflow.md)
4. **증거 기반 완료** — 실행 증거 없이 완료 선언 금지 → [rules/verification.md](.Codex/rules/verification.md)
5. **반합리화** — 요청 범위만 수정 → [rules/anti-rationalization.md](.Codex/rules/anti-rationalization.md)

## Rules 카탈로그

| 규칙 | 요약 | 상세 |
|------|------|------|
| Editing | 범위 제한, 정확한 복원, 최소 편집 | [→](.Codex/rules/editing.md) |

> 도메인 한정 규칙은 always-on 대신 **조건부**(작업 시 해당 스킬/커맨드가 참조)로 전환:
> Dark Theme→`kiips-scss`, Validation→`legacy-compliance-checker`, Error Handling→`/diagnose`, Power Stack→아카이브(구버전 obsolete, `.claude/archive/power-stack.md`).
> 전체 규칙 위반 스캔은 `/check-rules`(`.Codex/rules/` 직접 읽음 — 파일은 보존).

## 더 보기

- 포트/환경 → [.Codex/PORTS.md](.Codex/PORTS.md)
- 에이전트/스킬/훅 카탈로그 → [.Codex/README.md](.Codex/README.md)
- 시스템 아키텍처 → [architecture.md](./architecture.md) · [api.md](./api.md) · [deployment.md](./deployment.md) · [troubleshooting.md](./troubleshooting.md)
