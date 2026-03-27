---
name: kiips-backend
description: "KiiPS 백엔드 개발 통합 가이드. Controller/Service/DAO 패턴, 공통 코드(COMMON/UTILS), API 설계, 예외 처리. Use when: controller, service, dao, API, endpoint, REST, COMMON, UTILS, 공통, GlobalExceptionHandler"
disable-model-invocation: true
---

# KiiPS Backend (통합)

> kiips-backend-guidelines + kiips-common-patterns 통합

---

## 계층 구조

```
Controller → Service → DAO → MyBatis Mapper
   검증        로직      데이터   SQL
```

---

## Controller 표준 패턴

```java
@RestController
@RequestMapping("/api/fd")
public class FundController {

    @Autowired
    private FundService fundService;

    @PostMapping("/list")
    public ResponseEntity<Map<String, Object>> getList(
            @RequestBody Map<String, Object> param) {
        // 입력 검증 (Controller 책임)
        if (StringUtils.isBlank((String) param.get("FUND_CD"))) {
            throw new BusinessException("펀드코드는 필수입니다.");
        }
        return ResponseEntity.ok(fundService.getList(param));
    }
}
```

---

## Service 표준 패턴

```java
@Service
public class FundService {

    @Autowired
    private FundDAO fundDAO;

    @Transactional(readOnly = true)
    public Map<String, Object> getList(Map<String, Object> param) {
        // 비즈니스 로직만 (검증은 Controller에서 완료)
        return fundDAO.selectFundList(param);
    }

    @Transactional
    public Map<String, Object> save(Map<String, Object> param) {
        // CUD 작업은 @Transactional
        return fundDAO.insertFund(param);
    }
}
```

---

## 공통 코드 (KiiPS-COMMON / KiiPS-UTILS)

### 예외 처리
- `GlobalExceptionHandler`: 전역 예외 → HTTP 응답 매핑
- `BusinessException`: 비즈니스 규칙 위반 (400)
- `ErrorNotificationService`: 에러 알림 발송

### 공통 유틸
- `StringUtils`: 문자열 처리
- `DateUtils`: 날짜 변환
- `NumberUtils`: 숫자 포맷팅
- `logosAjax`: AJAX 공통 처리 (프론트엔드)

### 주의사항
- KiiPS-COMMON/UTILS 수정 시 **사용자 승인 필수** (영향 범위 넓음)
- 새 유틸 메서드는 기존 클래스 수정보다 **새 클래스 생성** 선호
- 수정 후 **전체 빌드** 필수 (COMMON → UTILS → 서비스)

---

## API 설계 규칙

| 규칙 | 내용 |
|------|------|
| URL 패턴 | `/api/{도메인}/{기능}` |
| HTTP 메서드 | 조회: POST, 저장: POST, 삭제: POST |
| 응답 형식 | `ResponseEntity<Map<String, Object>>` |
| 에러 응답 | `BusinessException` → GlobalExceptionHandler |
| 인증 | JWT 토큰 (Gateway에서 검증) |

---

**Merged from**: kiips-backend-guidelines, kiips-common-patterns
**Version**: 2.0.0
