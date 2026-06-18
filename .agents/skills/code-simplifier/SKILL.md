---
name: code-simplifier
description: "구현 후 코드 복잡도 분석 및 단순화 (Boris Cherny principle). Use when: simplify, 단순화, refactor, 리팩토링, 개선, improve"
disable-model-invocation: true
---

# Code Simplifier

Boris Cherny 원칙에 따라 기능 구현 후 코드 복잡도를 분석하고 단순화를 제안합니다.

## 활성화 조건

- 기능 구현 완료 후 자동 제안
- `/review`에서 높은 복잡도 지적 시
- 사용자 명시 요청: "단순화해줘", "리팩토링", "코드 개선"

## 복잡도 임계값

| 메트릭 | 임계값 | 목표 |
|--------|--------|------|
| Cyclomatic Complexity | > 10 | ≤ 5 |
| Nesting Depth | > 3 | ≤ 2 |
| Method Length | > 50 lines | ≤ 20 lines |
| Code Duplication | > 5 lines | 0 |

## 리팩토링 전략

### 1. Extract Method (메서드 추출)
긴 메서드를 의미 있는 단위로 분리

### 2. Guard Clauses (조기 반환)
중첩 if를 평탄화하여 가독성 향상

### 3. Extract Conditional (조건 추출)
복잡한 조건식을 의미 있는 메서드명으로 추출

### 4. DRY (중복 제거)
반복 코드를 KiiPS-COMMON 유틸로 추출

## 안전 보장

- 동작 변경 없이 구조만 개선
- Before/After 비교 제시 후 사용자 승인
- 테스트 통과 확인 후 적용
- SVN을 통한 롤백 지원

## 연계

- `checklist-generator`: 코드 리뷰 체크리스트
- `kiips-feature-planner`: Feature 라이프사이클
- `/review`: 코드 품질 검사
- `/simplify-code`: 커맨드 인터페이스
