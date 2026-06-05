---
name: advisor 호출 시점 학습
description: advisor 호출이 substantive work 전/완료 선언 전 각각 다른 회귀를 발견한 실증
type: feedback
originSessionId: 78ed29e5-b7c9-4acd-899f-0149edb4aecd
---
advisor() 는 큰 리팩토링에서 반드시 2회 이상 호출할 것: (1) substantive work 전에 계획 검증, (2) 완료 선언 전에 회귀 검토.

**Why:** 2026-04-22 세션에서 validator AST 업그레이드 시 advisor 를 2번 호출, 매번 다른 회귀를 발견. 1차: Edit/Write 합성 문자열 false negative (unclosed quote). 2차: CHANGELOG 허위 주장 + fictional gate 문서 drift. 어느 것도 self-test 로는 못 잡음 — 설계한 케이스만 통과시키는 구조적 한계.

**How to apply:** "N/N 통과" 를 완료 신호로 쓰지 말 것. advisor 호출 전에 deliverable 을 디스크에 보존 (파일 쓰기 완료 상태) 후 호출. 결과는 "wrong" 이 아니라 "blind spot pointer" 로 처리하여 실증 페이로드로 고정.
