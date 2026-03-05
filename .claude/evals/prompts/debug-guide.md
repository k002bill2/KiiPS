# Debug Guide Rubric

KiiPS 디버깅 태스크 평가 기준 및 가이드

## 목적

디버깅 태스크의 완성도와 품질을 평가합니다.
에이전트가 올바른 디버깅 패턴을 적용하는지 검증합니다.

---

## SQL Injection 수정 가이드

### 취약 패턴 (반드시 수정)

```java
// ❌ 취약한 코드 - 절대 사용 금지
String sql = "SELECT * FROM users WHERE id = " + userId;
String sql = "SELECT * FROM funds WHERE name = '" + request.getParameter("name") + "'";
String sql = "DELETE FROM " + tableName + " WHERE id = " + id;
```

### 안전한 패턴 (필수 적용)

```java
// ✅ PreparedStatement 사용 (권장)
String sql = "SELECT * FROM users WHERE id = ?";
PreparedStatement pstmt = conn.prepareStatement(sql);
pstmt.setLong(1, userId);

// ✅ MyBatis #{} 바인딩 사용
<select id="getUser" parameterType="long" resultType="User">
    SELECT * FROM users WHERE id = #{userId}
</select>

// ✅ JPA Named Parameters
@Query("SELECT u FROM User u WHERE u.id = :userId")
User findByUserId(@Param("userId") Long userId);
```

### 추가 방어책

```java
// 입력값 검증
if (!userId.matches("^[0-9]+$")) {
    throw new IllegalArgumentException("Invalid user ID format");
}

// 화이트리스트 검증 (테이블명, 컬럼명)
private static final Set<String> ALLOWED_TABLES = Set.of("users", "funds", "investments");
if (!ALLOWED_TABLES.contains(tableName)) {
    throw new SecurityException("Table not allowed: " + tableName);
}
```

### 평가 기준

| 항목 | 필수 | 배점 |
|------|------|------|
| PreparedStatement 또는 #{} 사용 | O | 40점 |
| 문자열 연결 제거 | O | 30점 |
| 입력값 검증 추가 | △ | 20점 |
| 에러 로깅 (SQL 노출 방지) | △ | 10점 |

---

## API 타임아웃 수정 가이드

### 문제 패턴

```java
// ❌ 타임아웃 미설정 - 무한 대기 가능
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
InputStream is = conn.getInputStream();

// ❌ RestTemplate 기본 설정 - 무한 대기
RestTemplate restTemplate = new RestTemplate();
```

### 해결 패턴

```java
// ✅ HttpURLConnection 타임아웃 설정
HttpURLConnection conn = (HttpURLConnection) url.openConnection();
conn.setConnectTimeout(5000);  // 연결 타임아웃 5초
conn.setReadTimeout(10000);    // 읽기 타임아웃 10초

// ✅ RestTemplate 타임아웃 설정
@Bean
public RestTemplate restTemplate() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(5000);
    factory.setReadTimeout(10000);
    return new RestTemplate(factory);
}

// ✅ WebClient 타임아웃 설정 (권장)
@Bean
public WebClient webClient() {
    HttpClient httpClient = HttpClient.create()
        .option(ChannelOption.CONNECT_TIMEOUT_MILLIS, 5000)
        .responseTimeout(Duration.ofSeconds(10));

    return WebClient.builder()
        .clientConnector(new ReactorClientHttpConnector(httpClient))
        .build();
}

// ✅ Feign Client 타임아웃
feign:
  client:
    config:
      default:
        connectTimeout: 5000
        readTimeout: 10000
```

### 재시도 및 서킷 브레이커

```java
// ✅ Retry 패턴
@Retryable(value = {TimeoutException.class}, maxAttempts = 3, backoff = @Backoff(delay = 1000))
public Response callExternalApi() {
    // API 호출
}

// ✅ Circuit Breaker (Resilience4j)
@CircuitBreaker(name = "externalApi", fallbackMethod = "fallback")
public Response callExternalApi() {
    // API 호출
}

public Response fallback(Exception ex) {
    log.warn("Fallback triggered: {}", ex.getMessage());
    return Response.empty();
}
```

### KiiPS 표준 설정

```properties
# app-local.properties
api.connect.timeout=5000
api.read.timeout=30000
api.retry.max-attempts=3
api.retry.delay=1000
```

### 평가 기준

| 항목 | 필수 | 배점 |
|------|------|------|
| connectTimeout 설정 | O | 30점 |
| readTimeout 설정 | O | 30점 |
| 예외 처리 추가 | O | 20점 |
| 재시도/폴백 구현 | △ | 20점 |

---

## NullPointerException 수정 가이드

### 취약 패턴

```java
// ❌ NPE 위험
String name = user.getName().toUpperCase();
int size = list.size();
```

### 안전한 패턴

```java
// ✅ Null 체크
if (user != null && user.getName() != null) {
    String name = user.getName().toUpperCase();
}

// ✅ Optional 사용 (권장)
String name = Optional.ofNullable(user)
    .map(User::getName)
    .map(String::toUpperCase)
    .orElse("Unknown");

// ✅ Objects.requireNonNull (파라미터 검증)
public void setUser(User user) {
    this.user = Objects.requireNonNull(user, "User cannot be null");
}

// ✅ CollectionUtils 활용
if (CollectionUtils.isNotEmpty(list)) {
    int size = list.size();
}
```

### 평가 기준

| 항목 | 필수 | 배점 |
|------|------|------|
| Null 체크 추가 | O | 40점 |
| Optional 또는 방어적 코딩 | △ | 30점 |
| 의미 있는 기본값 | △ | 20점 |
| 로깅 추가 | △ | 10점 |

---

## RealGrid 렌더링 오류 수정 가이드

### 일반적인 오류 원인

1. **DataProvider 미연결**
```javascript
// ❌ 오류: GridView만 생성
let gridView = new RealGrid.GridView("gridContainer");

// ✅ 수정: DataProvider 연결
let dataProvider = new RealGrid.LocalDataProvider();
let gridView = new RealGrid.GridView("gridContainer");
gridView.setDataSource(dataProvider);
```

2. **필드-컬럼 매핑 불일치**
```javascript
// ❌ 오류: 필드명과 컬럼 fieldName 불일치
dataProvider.setFields([{ fieldName: "userName" }]);
gridView.setColumns([{ fieldName: "user_name" }]);  // 불일치!

// ✅ 수정: 일치시킴
dataProvider.setFields([{ fieldName: "userName" }]);
gridView.setColumns([{ fieldName: "userName", name: "userName" }]);
```

3. **DOM 요소 미존재**
```javascript
// ❌ 오류: DOM 로드 전 초기화
let gridView = new RealGrid.GridView("gridContainer");

// ✅ 수정: DOM 로드 후 초기화
$(document).ready(function() {
    let gridView = new RealGrid.GridView("gridContainer");
});
```

4. **KiiPS 표준 함수 사용**
```javascript
// ✅ KiiPS 표준 조회 그리드
const { gridView, dataProvider } = createMainGrid("gridContainer", columns, fields);

// ✅ KiiPS 표준 편집 그리드
const { gridView, dataProvider } = createEditGrid("gridContainer", columns, fields);
```

### 평가 기준

| 항목 | 필수 | 배점 |
|------|------|------|
| DataProvider 연결 확인 | O | 30점 |
| 필드-컬럼 매핑 정확성 | O | 30점 |
| DOM 로드 타이밍 | O | 20점 |
| KiiPS 표준 함수 사용 | △ | 20점 |

---

## 공통 평가 원칙

### 1. 근본 원인 해결
- 증상만 숨기지 않고 원인 해결
- 유사 문제 재발 방지

### 2. 테스트 가능성
- 수정 후 테스트 가능한 구조
- 에지 케이스 고려

### 3. 문서화
- 수정 내용 주석 또는 커밋 메시지
- 향후 참조 가능

### 4. 성능 영향
- 수정으로 인한 성능 저하 없음
- 필요시 최적화

## 점수 기준

| 점수 | 설명 |
|------|------|
| 90-100 | 우수: 근본 원인 해결, 방어적 코딩, 테스트 포함 |
| 70-89 | 양호: 문제 해결, 부분적 방어책 |
| 50-69 | 보통: 기본 수정만, 개선 여지 |
| 0-49 | 미흡: 미해결 또는 새로운 문제 유발 |
