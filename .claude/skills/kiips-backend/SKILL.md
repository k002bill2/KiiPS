---
name: kiips-backend
description: "KiiPS 백엔드(Controller/Service/DAO 인라인 SQL) 개발·예외처리·API 설계 가이드. Use when: controller, service, dao, API, endpoint, REST, COMMON, UTILS, 공통, GlobalExceptionHandler, AppException, ApiResultBean 작성/수정. NOT for: 테이블·컬럼 구조 조회(use kiips-db-inspector), SQL 바인딩 안전(use kiips-mybatis-guide), 인증/JWT(use kiips-security-guide), Java8 레거시 준수(use legacy-compliance-checker)"
disable-model-invocation: true
---

# KiiPS Backend (통합)

> kiips-backend-guidelines + kiips-common-patterns 통합

---

## 계층 구조

```
Controller → Service → DAO (inline SQL)
   검증        로직      StringBuffer + JdbcTemplate
```

> ⚠️ 이 프로젝트는 **MyBatis mapper XML을 쓰지 않는다.** DAO는 `extends DBSelecter`로
> `StringBuffer sb`에 SQL을 인라인 조립하고 `getTemplate(lib).queryForList(sb.toString(), values.toArray())`
> (JdbcTemplate)로 실행한다. 사용자 값은 위치 `?` + `values.add(...)` 바인딩. 상세 → `kiips-db-inspector`.

---

## Controller 표준 패턴

```java
@RestController
@RequestMapping("/api/fd")
public class FD0101APIController {

    private final FD0101APIService svr;          // 생성자 주입 (필드 @Autowired 아님)

    public FD0101APIController(FD0101APIService svr) {
        this.svr = svr;
    }

    @PostMapping("/list")
    public ResponseEntity<ApiResultBean<Object>> fundList(
            HttpServletRequest req, @RequestBody Map<String, String> param) throws Exception {
        ApiResultBean<Object> rtnBean = new ApiResultBean<>();
        // 입력 검증 (Controller 책임)
        if (StringUtils.isBlank(param.get("FUND_CD"))) {
            throw new AppException("error.required.fund_cd");   // i18n 코드 or 메시지
        }
        rtnBean.setBody(svr.fundList(param));
        return new ResponseEntity<>(rtnBean, HttpStatus.OK);
    }
}
```

> 저장(CUD)은 `@RequestBody {도메인}VO vo, BindingResult bindingResult`로 **typed VO + 검증**을
> 받는다(예: `FD0101VO`). 삭제는 `@RequestBody TB_XXXXM[] models` 배열. 반환은 항상
> `ResponseEntity<ApiResultBean<Object>>`. (`BusinessException`은 이 코드베이스에 **존재하지 않는다** — `AppException` 사용.)

> **입력 검증 규칙** → `.claude/rules/validation.md` (Boundary Validation): null/길이/타입/범위 검증은 **Controller 책임**, Service/DAO는 검증된 데이터를 신뢰. `${}` 바인딩 금지. (always-on 아님 — Controller 작업 시 이 스킬에서 참조)

---

## Service 표준 패턴

```java
@Service
public class FD0101APIService {

    private final FD0101APIDao dao;          // 생성자 주입

    public FD0101APIService(FD0101APIDao dao) {
        this.dao = dao;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> fundList(Map<String, String> param) throws Exception {
        // 비즈니스 로직만 (검증은 Controller에서 완료)
        return dao.getLIST(lib, param);      // lib = 운용사 스키마(멀티테넌트)
    }

    @Transactional
    public int save(String lib, Map<String, String> param) throws Exception {
        // CUD 작업은 @Transactional
        return dao.save(lib, param);
    }
}
```

---

## 공통 코드 (KiiPS-COMMON / KiiPS-UTILS)

### 예외 처리
- `GlobalExceptionHandler` (KiiPS-COMMON) / `ExceptionControllerAdvice` (KiiPS-UTILS): 전역 예외 → HTTP 응답 매핑
- `AppException(String chkCode[, ...])`: 비즈니스 규칙 위반 — `extends RuntimeException`. chkCode는 i18n 메시지 코드 또는 메시지. 변형: `(chkCode, List<String> keys)`, `(chkCode, lib)`, `(chkCode, Exception)`
- 기타: `ValidationException`, `UIException`, `AuthException`/`AuthTokenException`/`AuthSessionException` (인증 계열). **`BusinessException`은 없음**
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
| 응답 형식 | `ResponseEntity<ApiResultBean<Object>>` (`rtnBean.setBody(...)`) |
| 에러 응답 | `AppException` → GlobalExceptionHandler/ExceptionControllerAdvice |
| 인증 | JWT 토큰 (Gateway에서 검증) |

---

**Merged from**: kiips-backend-guidelines, kiips-common-patterns
**Version**: 2.0.0
