---
description: "학습된 패턴(Instinct) 조회 - 도메인별 필터링, 신뢰도 표시"
---

# /instinct-status — 학습된 패턴 조회

학습 시스템에 기록된 모든 instinct(학습 패턴)를 신뢰도와 함께 표시합니다.

## 사용법

```
/instinct-status                      # 전체 instinct 목록
/instinct-status --domain <domain>    # 특정 도메인만 필터
/instinct-status --low-confidence     # 신뢰도 0.5 미만만
/instinct-status --high-confidence    # 신뢰도 0.7 이상만
```

## 실행 절차

### 1단계: Instinct 파일 수집

```bash
ls .claude/learning/instincts/personal/ 2>/dev/null
ls .claude/learning/instincts/inherited/ 2>/dev/null
```

각 `.md` 파일의 YAML frontmatter를 파싱하여:
- id, trigger, confidence, domain, observations, updated 추출

### 2단계: 도메인별 그룹화

$ARGUMENTS에 `--domain`이 있으면 해당 도메인만 필터링.

### 3단계: 출력

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Instinct Status — 학습 패턴
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  ## {도메인} 패턴 (N개)

  ### {instinct-id}
  트리거: ...
  액션: ...
  신뢰도: ████████░░ 0.80 | 관찰: N회 | 최종: YYYY-MM-DD

  ---
  총: N개 instinct (personal: X, inherited: Y)
  관찰 로그: .claude/learning/observations.jsonl

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 신뢰도 바 표시

| 범위 | 바 | 의미 |
|------|---|------|
| 0.0~0.3 | ██░░░░░░░░ | 잠정적 |
| 0.3~0.5 | ████░░░░░░ | 보통 |
| 0.5~0.7 | ██████░░░░ | 강함 |
| 0.7~0.9 | ████████░░ | 매우 강함 |
| 0.9~1.0 | █████████░ | 핵심 행동 |
