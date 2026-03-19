---
name: kiips-common-patterns
description: "KiiPS-COMMON/UTILS 공통 코드 사용법, GlobalExceptionHandler, ErrorNotificationService. Use when: COMMON, UTILS, GlobalExceptionHandler, ErrorNotificationService, 공통"
---

# KiiPS Common Patterns

> KiiPS-COMMON / KiiPS-UTILS 공통 코드 활용 가이드

---

## Quick Reference

| 모듈 | 역할 | 빌드 순서 |
|------|------|----------|
| KiiPS-COMMON | 공통 서비스, 예외 처리, 인증 | 1순위 |
| KiiPS-UTILS | 공통 DAO, 유틸리티 | 2순위 |
| 서비스 모듈 | 비즈니스 로직 | 3순위 |

---

## 의존성 체인

```
KiiPS-COMMON (독립)
     ↓
KiiPS-UTILS (COMMON 의존)
     ↓
KiiPS-FD, KiiPS-IL, KiiPS-AC, ... (UTILS 의존)
     ↓
KiiPS-UI (WAR, 모든 모듈 의존)
```

### 규칙
- **COMMON 변경 시**: 모든 의존 모듈 재빌드 필요
- **UTILS 변경 시**: 서비스 모듈 재빌드 필요
- **빌드 항상 KiiPS-HUB에서 실행**: `cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am`

---

## GlobalExceptionHandler

```java
// KiiPS-COMMON에 정의
@ControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleException(Exception e) {
        // 통합 에러 응답
    }
}
```

- 모든 서비스 모듈에서 자동 적용
- 커스텀 예외: `GlobalExceptionHandler`에서 처리하는 타입 확인 후 추가

---

## ErrorNotificationService

- 에러 발생 시 알림 전송
- Sentry 연동 (설정된 경우)

---

## Common_API_Service

```java
// 서비스 간 API 호출 (Gateway 경유)
Common_API_Service.callApi(targetService, endpoint, param);
```

- **서비스 간 직접 DAO 호출 금지**
- Gateway(8088) 경유 호출 필수
- `x-api-key` 헤더 자동 포함

---

## 공통 유틸리티 (KiiPS-UTILS)

| 클래스 | 용도 |
|--------|------|
| `DAO` | SqlSession 기반 공통 DAO |
| `DateUtil` | 날짜 처리 |
| `StringUtil` | 문자열 처리 |
| `FileUtil` | 파일 업로드/다운로드 |

---

## 모듈 간 코드 검색 팁

- API/공통 코드 추적 시 **모든 모듈** 검색 (루트만 보지 말 것)
- `grep -r "클래스명" KiiPS-*/src/` 패턴 활용
- CLAUDE.md 규칙: "모듈 검색: API/공통 코드 추적 시 모든 모듈 검색"
