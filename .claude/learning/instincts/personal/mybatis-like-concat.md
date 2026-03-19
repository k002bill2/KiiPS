---
id: mybatis-like-concat
trigger: "MyBatis LIKE 검색 쿼리 작성 시"
confidence: 0.7
domain: "mybatis-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 5
---

# MyBatis LIKE 검색: CONCAT 패턴

## Action
LIKE 검색 시 `#{value}` 안에 `%`를 직접 넣지 말고 DB 함수로 조합:

```xml
<!-- Oracle -->
AND COLUMN LIKE '%' || #{value} || '%'

<!-- MySQL -->
AND COLUMN LIKE CONCAT('%', #{value}, '%')
```

## Evidence
- learn 커맨드 직접 입력 교훈
- MyBatis #{} 내부에 % 직접 삽입 시 바인딩 오류 발생 경험
