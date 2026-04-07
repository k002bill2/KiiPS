# 글로벌 vs KiiPS 전용 파일 분리

> CLAUDE.md에서 분리된 설정 관리 참조 문서

범용 파일은 `~/.claude/`에 글로벌 버전이 존재하며, KiiPS 프로젝트에서는 KiiPS 도메인 지식이 포함된 로컬 버전을 유지합니다.

| 유형 | 글로벌 (`~/.claude/`) | KiiPS 로컬 (`.claude/`) | 비고 |
|------|----------------------|------------------------|------|
| **스킬** | `continuous-learning`, `session-wrap`, `parallel-coordinator` | `kiips-continuous-learning`, `kiips-session-wrap`, `parallel-coordinator` | KiiPS 도메인 패턴 포함 |
| **커맨드** | `learn`, `evolve`, `verify`, `plan`, `session-wrap`, `instinct-status`, `eval`, `scope-lock` | 동일 이름 (KiiPS 특화) | KiiPS 모듈/SVN 참조 |
| **훅** | `observe.js`, `outputSecretFilter.js`, `pre-compact-save.sh`, `update-reminder.sh` | 동일 이름 (KiiPS 도메인 패턴 포함) | `observe.js`는 `domain-config.json`으로 분리 |
| **에이전트** | `planner.md`, `verify-agent.md` | `kiips-planner.md`, `verify-agent.md` | KiiPS 검증 체크리스트 포함 |

**도메인 패턴 설정**: `.claude/learning/domain-config.json`에서 KiiPS 9개 도메인 패턴 정의 (글로벌 `observe.js`가 로드)
