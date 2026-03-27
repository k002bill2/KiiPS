---
name: kiips-learning
description: "KiiPS 학습 시스템 통합 스킬. Instinct 생성, 패턴 감지, 스킬/커맨드 자동 생성, 진화. Use when: 학습, 패턴, instinct, skill factory, 스킬 생성, 자동화 제안"
disable-model-invocation: true
---

# KiiPS Learning System (통합)

> kiips-continuous-learning + kiips-skill-factory 통합

---

## 학습 파이프라인

```
[관찰] → [패턴감지] → [Instinct 생성] → [진화]
observe.js   /learn     .md files     /evolve
  JSONL       분석        규칙화        스킬/커맨드
```

---

## Instinct (학습된 패턴)

### 저장 위치
`.claude/learning/instincts/personal/*.md`

### Instinct 구조
```yaml
---
id: instinct-xxx
domain: [build|mybatis|realgrid|security|...]
confidence: [0.0-1.0]
source: observation | user-feedback
---
패턴 설명과 적용 규칙
```

### 현재 Instinct (13개)
- build: build-hub-first, build-module-dependency
- mybatis: mybatis-param-binding, mybatis-dynamic-sql, mybatis-like-concat
- realgrid: realgrid-init-sequence, realgrid-excel-export
- security: security-csrf-check, security-xss-prevention
- ui: jsp-include-standard, scss-dark-theme-selector
- error: error-diagnose-first
- api: api-controller-standard

---

## Skill Factory

세션 활동 분석 → 반복 패턴 감지 → 스킬/커맨드 자동 생성

### 생성 프로세스
1. `/learn` — 세션에서 교훈 추출
2. `/instinct-status` — 현재 패턴 확인
3. `/evolve` — Instinct 클러스터링 → 스킬/커맨드 생성

### 중복 검사
생성 전 기존 스킬과 유사도 검사 수행. 80% 이상 유사 시 기존 스킬 업데이트 권장.

---

**Merged from**: kiips-continuous-learning, kiips-skill-factory
**Version**: 2.0.0
