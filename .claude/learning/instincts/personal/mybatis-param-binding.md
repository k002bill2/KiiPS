---
id: mybatis-param-binding
trigger: "MyBatis mapper XML에서 파라미터 바인딩 작성 시"
confidence: 0.8
domain: "mybatis-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 39
---

# MyBatis 파라미터 바인딩: #{} 필수 사용

## Action
SQL 파라미터 바인딩 시 항상 `#{}` 사용. `${}`는 SQL Injection 취약점을 유발하므로 동적 테이블명/컬럼명 외에는 절대 사용 금지.

## Evidence
- 39회 mybatis-pattern 도메인 관찰
- FD0101.xml에서 `${param}` → `#{param}` 수정 이력
- KiiPS 보안 가이드라인에서 명시적으로 금지

## Exception
- 동적 테이블명: `${tableName}` (PreparedStatement로 바인딩 불가)
- ORDER BY 절: `${orderColumn}` (단, 화이트리스트 검증 필수)
