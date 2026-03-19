---
id: error-diagnose-first
trigger: "에러 발생 시 수정 시도 전"
confidence: 0.85
domain: "error-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 45
---

# 에러 처리: 진단 우선, 수정 후순

## Action
에러 발생 시 즉시 코드 변경하지 말고:
1. 에러 메시지 정확히 읽기
2. 최소 2개 가설 제시
3. 가장 가능성 높은 가설부터 검증
4. 한 번에 하나의 변경만 적용
5. 변경 후 즉시 검증

**3회 연속 실패 시** → Ralph Loop 감지 → 즉시 중단 → 사용자에게 보고

## Evidence
- 45회 error-pattern 관찰
- `.claude/rules/error-handling.md` 디버깅 프로토콜
- `.claude/rules/anti-rationalization.md` Ralph Loop 감지
