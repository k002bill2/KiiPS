# Boundary Validation Rules (Golden Principle #6)

> Controller 계층에서의 입력 검증 원칙

## 핵심 규칙

모든 외부 입력은 Controller에서 검증 후 Service로 전달. Service/DAO 계층은 이미 검증된 데이터를 신뢰.

## 검증 체크리스트

| 검증 항목 | 검증 위치 | 방법 |
|-----------|----------|------|
| null/빈값 | Controller | `StringUtils.isNotBlank()` |
| 길이 제한 | Controller | `param.length() <= MAX` |
| 타입 검증 | Controller | `NumberUtils.isDigits()` |
| 범위 검증 | Controller | `min <= value <= max` |
| XSS 필터링 | Spring Filter | `HTMLCharacterEscapes` |
| SQL Injection | MyBatis | `#{}` 바인딩 (검증이 아닌 예방) |

## KiiPS 패턴

```java
@PostMapping("/save")
public ResponseEntity<Map<String, Object>> save(
        @RequestBody Map<String, Object> param) {

    // 필수 파라미터 검증
    if (StringUtils.isBlank((String) param.get("TITLE"))) {
        throw new BusinessException("제목은 필수입니다.");
    }

    // 길이 제한
    String title = (String) param.get("TITLE");
    if (title.length() > 200) {
        throw new BusinessException("제목은 200자 이하입니다.");
    }

    return ResponseEntity.ok(xxxService.save(param));
}
```

## 금지 패턴

1. Service에서 Controller의 검증을 재수행 (중복)
2. DAO/Mapper에서 비즈니스 검증 (책임 위반)
3. 검증 없이 `${}` 바인딩 사용 (SQL Injection)
4. 클라이언트 검증만 의존 (서버 검증 누락)
