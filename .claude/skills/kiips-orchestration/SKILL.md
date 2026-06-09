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

| 복잡도 (점수/8) | 에이전트 수 | 예시 |
|----------------|-----------|------|
| SIMPLE (≤4) | 1 | 단일 파일 수정 |
| MODERATE (5-6) | 2-3 | 한 모듈 기능 추가 |
| COMPLEX (7-8) | 5+ | 멀티 모듈 / 아키텍처 변경 |

> **정본**: `hooks/userPromptSubmit.js` effort 스코어러(`score<=4?SIMPLE:score<=6?MODERATE:COMPLEX`).
> `agents/shared/effort-scaling.md`(Trivial/Simple/Moderate/Complex)는 Anthropic 일반 원칙 참고용 — 런타임 밴드와 별개.

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

## 라우팅/배선 정본 (Source of Truth)

> 2026-06-09 정리. 매니저 자동 라우팅의 실제 동작 위치를 명시.

- **매니저 선택 라우팅 = `hooks/userPromptSubmit.js`의 `detectManagerAgent()` 하드코딩 키워드.**
  이것이 유일한 런타임 정본이다. (build/feature/deployment/ui-manager 매핑)
- `skill-rules.json`의 `managerAgent`/`orchestrationSkill`/`autoActivationLevel`/`delegationRules`
  필드는 **어떤 훅도 읽지 않던 dead config 였으며 제거됨.** 매니저↔워커 위임 설명은 각 매니저 `.md` 문서가 정본.
- `skill-rules.json`의 `enforcement` 값 중 런타임 소비는 **`"block"`(blockRules 게이트)뿐**.
  `"require"`/`"suggest"`는 advisory 표기일 뿐 강제력 없음.
- 매니저 4종이 참조하던 per-manager orchestration 스킬(build/feature/deployment/ui-*-orchestration)은
  **존재한 적 없으며**, 통합 오케스트레이션은 본 스킬(`kiips-orchestration`)이 단독 수행한다.

---

**Merged from**: parallel-coordinator, chain-of-skills, kiips-ace-essentials
**Version**: 2.0.0
