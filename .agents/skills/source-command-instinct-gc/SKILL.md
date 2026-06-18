---
name: "source-command-instinct-gc"
description: "Instinct garbage collection - archive stale/low-confidence instincts"
---

# source-command-instinct-gc

Use this skill when the user asks to run the migrated source command `instinct-gc`.

## Command Template

# Instinct GC (/instinct-gc)

학습된 패턴(Instinct)의 수명을 관리합니다.
저신뢰, 장기 미사용, 중복 instinct를 자동으로 식별하고 아카이빙합니다.

## 사용법

```
/instinct-gc              # 전체 분석 + 아카이빙 제안
/instinct-gc --dry-run    # 미리보기만 (이동 없음)
/instinct-gc --execute    # 실제 아카이빙 실행
/instinct-gc --stats      # 통계만 표시
```

## 아카이빙 규칙

### Rule 1: 저신뢰 + 장기 미갱신
```
조건: confidence < 0.3 AND updated가 30일 이상 이전
조치: .Codex/learning/instincts/archived/ 로 이동
```

### Rule 2: 초저신뢰
```
조건: confidence < 0.2 (기간 무관)
조치: 삭제 후보로 표시 (사용자 확인 필요)
```

### Rule 3: 장기 미사용
```
조건: observations < 3 AND updated가 60일 이상 이전
조치: 아카이빙 후보로 표시
```

### Rule 4: 중복 감지
```
조건: 동일 domain + 유사 trigger (편집거리 ≤ 30%)
조치: /evolve로 병합 권장
```

## 실행 절차

### 1단계: Instinct 수집

```bash
# 모든 personal instinct 읽기
ls .Codex/learning/instincts/personal/*.md
```

각 파일의 YAML frontmatter에서 추출:
- `id`: 고유 식별자
- `confidence`: 신뢰도 (0.0 ~ 1.0)
- `domain`: 도메인 분류
- `updated`: 마지막 갱신일
- `observations`: 관찰 횟수
- `created`: 생성일

### 2단계: 분류

각 instinct를 다음 버킷으로 분류:

| 버킷 | 조건 | 조치 |
|------|------|------|
| **HEALTHY** | confidence >= 0.5 AND recent | 유지 |
| **AGING** | confidence >= 0.3 AND 30일+ 미갱신 | 모니터링 |
| **ARCHIVE** | confidence < 0.3 AND 30일+ 미갱신 | 아카이빙 |
| **DELETE** | confidence < 0.2 | 삭제 후보 |
| **DORMANT** | observations < 3 AND 60일+ | 아카이빙 후보 |
| **DUPLICATE** | 동일 domain + 유사 trigger | 병합 후보 |

### 3단계: 아카이빙 실행 (--execute 시)

```bash
# archived 디렉토리 생성
mkdir -p .Codex/learning/instincts/archived/

# 아카이빙 대상 이동
mv .Codex/learning/instincts/personal/{id}.md .Codex/learning/instincts/archived/
```

아카이빙 시 frontmatter에 추가:
```yaml
archived: "2026-04-07"
archive_reason: "low-confidence (0.25) + stale (45 days)"
```

### 4단계: 리포트

## 출력 형식

```markdown
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Instinct GC Report
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  총 Instinct: {N}개 (personal: {N}, inherited: {N})

  ## 상태 분포
  | 상태 | 건수 | 비율 |
  |------|------|------|
  | HEALTHY | {N} | {N}% |
  | AGING | {N} | {N}% |
  | ARCHIVE | {N} | {N}% |
  | DELETE | {N} | {N}% |
  | DORMANT | {N} | {N}% |
  | DUPLICATE | {N} | {N}% |

  ## 도메인별 건강도
  | 도메인 | 총 | 건강 | 노후 | 평균 신뢰도 |
  |--------|-----|------|------|------------|
  | mybatis-pattern | {N} | {N} | {N} | {N} |
  | security-pattern | {N} | {N} | {N} | {N} |

  ## 아카이빙 대상 ({N}건)
  | ID | 신뢰도 | 마지막 갱신 | 사유 |
  |----|--------|-----------|------|
  | {id} | {confidence} | {updated} | {reason} |

  ## 삭제 후보 ({N}건)
  | ID | 신뢰도 | 관찰 | 사유 |
  |----|--------|------|------|
  | {id} | {confidence} | {observations} | {reason} |

  ## 병합 후보 ({N}건)
  | Instinct A | Instinct B | 유사도 |
  |-----------|-----------|--------|
  | {id_a} | {id_b} | {similarity}% |

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  다음 단계:
  - /instinct-gc --execute  → 아카이빙 실행
  - /evolve                 → 중복 병합 + 진화
  - 삭제 후보는 수동 확인 필요

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Observation 수명 관리

`/instinct-gc`는 Observation 로그도 함께 관리합니다:

### observations.jsonl 관리
```bash
# 파일 크기 확인
ls -lh .Codex/learning/observations.jsonl
wc -l .Codex/learning/observations.jsonl
```

### 90일 초과 데이터 요약
- 90일 이전 관측 → 도메인별 카운트로 요약
- 요약 파일: `.Codex/learning/observation-summary-{YYYY-MM}.json`
- 원본에서 90일 이전 라인 제거

### 요약 파일 형식
```json
{
  "period": "2026-01",
  "total_observations": 450,
  "by_domain": {
    "mybatis-pattern": 120,
    "realgrid-pattern": 85,
    "build-pattern": 60
  },
  "by_tool": {
    "Edit": 200,
    "Bash": 150,
    "Write": 100
  },
  "archived_at": "2026-04-07"
}
```

## 주의사항

- `--execute` 없이는 읽기 전용
- 아카이빙은 삭제가 아님 — `archived/`에서 복원 가능
- 삭제 후보(confidence < 0.2)는 자동 삭제하지 않음 (사용자 확인 필수)
- `/evolve`와 연계: GC 후 `/evolve`로 남은 instinct 진화 권장
