---
name: simplify-code
description: Java 코드 복잡도 분석 및 단순화 제안 (Boris Cherny code-simplifier 스타일)
---

# 코드 단순화 워크플로우

이 커맨드는 Java/Spring Boot 코드 복잡도를 분석하고 단순화 방안을 제안합니다.
Boris Cherny가 사용하는 code-simplifier 서브에이전트와 동일한 기능을 제공합니다.

## 분석 대상

### 파일 지정 시
```
/simplify-code KiiPS-FD/src/main/java/.../FundService.java
```

### 디렉토리 지정 시
```
/simplify-code KiiPS-COMMON/src/main/java/.../service/
```

### 최근 변경된 파일
```
/simplify-code --recent
```

## 분석 항목

### 1. 메서드 복잡도
- **긴 메서드**: 50줄 이상 메서드 식별
- **깊은 중첩**: 3단계 이상 들여쓰기
- **많은 매개변수**: 4개 이상 파라미터

### 2. 중복 코드
- 유사한 코드 블록 탐지
- 추출 가능한 공통 로직 식별
- 중복 DTO/Entity 정의 확인

### 3. 복잡한 조건문
- 복잡한 조건 표현식
- 중첩된 if-else 문
- 긴 switch/case 문

### 4. Spring Boot 특화 분석
- Service 레이어 분리 필요성
- 불필요한 의존성 주입
- 트랜잭션 경계 최적화
- Exception 처리 통합 기회

## 리포트 형식

```markdown
## 코드 복잡도 분석 결과

### 요약
| 지표 | 값 | 상태 |
|------|-----|------|
| 평균 메서드 길이 | X줄 | Pass/Warn |
| 최대 중첩 깊이 | X단계 | Pass/Warn |
| 중복 코드 | X개 블록 | Pass/Warn |

### High Priority (즉시 개선 필요)
1. `methodName` (Class.java:라인) - 문제 설명
   - 제안: 구체적인 리팩토링 방안

### Medium Priority (개선 권장)
1. ...

### Low Priority (시간 있을 때)
1. ...
```

## 단순화 전략

### 긴 메서드 분리
```java
// Before: 100줄 메서드
public void processData() {
    // 데이터 로드
    // 변환
    // 저장
}

// After: 작은 메서드들로 분리
private Data loadData() { ... }
private Data transformData(Data data) { ... }
private void saveData(Data data) { ... }

public void processData() {
    Data data = loadData();
    Data transformed = transformData(data);
    saveData(transformed);
}
```

### 조건문 단순화 (Early Return)
```java
// Before: 깊은 중첩
public Result process(Request req) {
    if (req != null) {
        if (req.isValid()) {
            if (req.hasPermission()) {
                return doProcess(req);
            }
        }
    }
    return Result.error();
}

// After: Early Return 패턴
public Result process(Request req) {
    if (req == null) return Result.error();
    if (!req.isValid()) return Result.error();
    if (!req.hasPermission()) return Result.error();

    return doProcess(req);
}
```

### 파라미터 객체 패턴
```java
// Before: 많은 파라미터
public void createFund(String name, String type, BigDecimal amount,
                       LocalDate startDate, LocalDate endDate, String manager) {
    ...
}

// After: DTO 사용
public void createFund(FundCreateRequest request) {
    ...
}
```

### Builder 패턴
```java
// Before: 생성자 지옥
new Fund(name, type, amount, startDate, endDate, manager, status);

// After: Builder
Fund.builder()
    .name(name)
    .type(type)
    .amount(amount)
    .build();
```

### Exception 처리 통합
```java
// Before: 중복된 예외 처리
try { ... } catch (Exception e) {
    log.error("Error in methodA", e);
    throw new ServiceException(e);
}
try { ... } catch (Exception e) {
    log.error("Error in methodB", e);
    throw new ServiceException(e);
}

// After: GlobalExceptionHandler 활용
// @ControllerAdvice에서 중앙 처리
```

## Spring Boot 리팩토링 패턴

### Service 레이어 분리
```java
// Before: 하나의 거대한 Service
@Service
public class FundService {
    // 1000줄의 코드
}

// After: 도메인별 분리
@Service
public class FundQueryService { }  // 조회 로직

@Service
public class FundCommandService { }  // CUD 로직

@Service
public class FundValidationService { }  // 검증 로직
```

### Repository 패턴 개선
```java
// Before: Service에서 직접 쿼리
@Autowired
private JdbcTemplate jdbcTemplate;

// After: Repository 추상화
@Autowired
private FundRepository fundRepository;
```

## 자동 적용 옵션

분석 결과에 동의하면 자동 적용을 요청할 수 있습니다:
```
/simplify-code KiiPS-FD/ --apply
```

**주의**: 자동 적용 후 반드시 `/verify-app`을 실행하세요.

## 예시 실행

```
사용자: /simplify-code FundService.java

Claude:
📊 코드 복잡도 분석 중...

## FundService.java 분석 결과

### High Priority
1. `calculateFundReturn` (128-228줄) - 메서드가 100줄 초과
   - 제안: `loadHistoricalData`, `calculateYield`, `applyFees` 메서드로 분리

2. `validateFundData` (334-420줄) - 중첩 깊이 5단계
   - 제안: Early Return 패턴 적용, 검증 로직 별도 클래스로 추출

### Medium Priority
1. `processBatchTransfer` - 6개 파라미터
   - 제안: TransferRequest DTO 생성

리팩토링을 적용하시겠습니까? (y/n)
```

---

*Use this command to improve code quality and maintainability.*
