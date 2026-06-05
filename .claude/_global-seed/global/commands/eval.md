---
description: AI 에이전트 평가 실행 (Anthropic Evals 방법론 기반)
---

# /eval 명령어

AI 에이전트의 성능을 평가합니다.

## 사용법

```bash
/eval                    # 전체 테스트 스위트 실행 (dry run)
/eval --suite <name>     # 특정 스위트만 실행
/eval --trials 5         # 5번 시도 (Pass@5 계산)
/eval --live             # 실제 실행 (dry run 아님)
/eval --report           # 최신 결과 리포트 생성
/eval --trends 7         # 7일간 트렌드 분석
/eval --regression       # 회귀 감지
```

## 실행

먼저 사용 가능한 스위트를 확인합니다:

```bash
cat .claude/evals/eval-config.json | jq '.suites | keys'
```

선택한 스위트로 평가를 실행합니다:

```bash
node .claude/evals/eval-runner.js --suite $SUITE --trials $TRIALS $FLAGS
```

## 메트릭 설명

| 메트릭 | 설명 |
|--------|------|
| Pass@1 | 첫 시도 성공 확률 |
| Pass@3 | 3번 중 최소 1회 성공 확률 |
| Pass^3 | 3번 모두 성공 확률 (일관성) |

## 결과 저장 위치

- `.claude/evals/results/latest.json` - 최근 결과
- `.claude/evals/results/history.jsonl` - 히스토리

## 예시 출력

```
Running eval suite: <suite>
==================================================

Task: task-001
  "설명"
  Pass@1: 100.0%
  Pass@3: 100.0%

==================================================
EVAL SUMMARY
==================================================

Suite: <suite>
  Total Tasks: N
  Passed: N
  Failed: N
  Avg Pass@1: N%

Results saved to: .claude/evals/results/latest.json
```
