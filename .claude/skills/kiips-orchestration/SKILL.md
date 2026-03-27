---
name: kiips-orchestration
description: "병렬 에이전트 실행 조정, ACE 가드레일, 스킬 체이닝 파이프라인. Use when: 병렬, parallel, 에이전트, agent, 조정, coordination, 파이프라인, pipeline, ACE"
disable-model-invocation: true
---

# KiiPS Orchestration (통합)

> parallel-coordinator + chain-of-skills + kiips-ace-essentials 통합

---

## ACE 가드레일 (핵심)

### 위험 차단
- DDL 파괴 명령: `DROP TABLE`, `TRUNCATE` → 차단
- WHERE 없는 DELETE → 차단
- 프로덕션 설정 직접 수정 → 차단

### 보호 모듈
KiiPS-COMMON, KiiPS-UTILS 수정 시 사용자 승인 필수

### 빌드 순서
COMMON → UTILS → 서비스 모듈 (순서 무시 시 빌드 실패)

---

## 병렬 에이전트 프로토콜

### 안전 규칙
1. **파일 잠금**: 동일 파일을 2+ 에이전트가 동시 수정 금지
2. **의존성 확인**: 독립 작업만 병렬화
3. **합류점**: 모든 에이전트 완료 후 통합 검증

### 에이전트 할당 기준 (effort-scaling)

| 복잡도 | 에이전트 수 | 예시 |
|--------|-----------|------|
| SIMPLE (1-3) | 1 | 단일 파일 수정 |
| MODERATE (4-5) | 2 | 한 모듈 기능 추가 |
| COMPLEX (6-7) | 3-4 | 멀티 모듈 기능 |
| CRITICAL (8+) | 5+ | 아키텍처 변경 |

---

## 스킬 체이닝 파이프라인

### 빌드-배포-검증
```
kiips-build → kiips-test-runner → kiips-build(deploy) → /check-health
```

### Feature 개발
```
kiips-feature-planner → kiips-backend → kiips-frontend-guidelines → /verify
```

### 인시던트 대응
```
kiips-logs → /diagnose → fix → /verify → kiips-build(deploy)
```

---

**Merged from**: parallel-coordinator, chain-of-skills, kiips-ace-essentials
**Version**: 2.0.0
