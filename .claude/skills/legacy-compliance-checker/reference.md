# Legacy Compliance Checker — Reference

> 상세 룰 레퍼런스 문서

---

## Java 8 Compatibility — Detailed Patterns

### Blocked Syntax (Java 9+)

```java
// ❌ Java 10: Local Variable Type Inference
var list = new ArrayList<String>();
// ✅ Java 8: Explicit type
List<String> list = new ArrayList<String>();

// ❌ Java 14: Record
public record FundInfo(String fundCd, String fundNm) {}
// ✅ Java 8: Class with getters
public class FundInfo {
    private final String fundCd;
    private final String fundNm;
    public FundInfo(String fundCd, String fundNm) {
        this.fundCd = fundCd;
        this.fundNm = fundNm;
    }
    public String getFundCd() { return fundCd; }
    public String getFundNm() { return fundNm; }
}

// ❌ Java 17: Sealed class
public sealed class Shape permits Circle, Square {}
// ✅ Java 8: Abstract class
public abstract class Shape {}

// ❌ Java 14: Switch Expression (arrow)
String result = switch (status) {
    case "A" -> "Active";
    case "I" -> "Inactive";
    default -> "Unknown";
};
// ✅ Java 8: Traditional switch
String result;
switch (status) {
    case "A": result = "Active"; break;
    case "I": result = "Inactive"; break;
    default: result = "Unknown";
}

// ❌ Java 13: Text Block
String sql = """
    SELECT *
    FROM TB_FUND
    WHERE FUND_CD = #{fundCd}
    """;
// ✅ Java 8: String concatenation
String sql = "SELECT * " +
    "FROM TB_FUND " +
    "WHERE FUND_CD = #{fundCd}";

// ❌ Java 16: Pattern Matching instanceof
if (obj instanceof String s) {
    System.out.println(s.length());
}
// ✅ Java 8: Explicit cast
if (obj instanceof String) {
    String s = (String) obj;
    System.out.println(s.length());
}

// ❌ Java 16: Stream.toList()
List<String> names = stream.toList();
// ✅ Java 8: Collectors.toList()
List<String> names = stream.collect(Collectors.toList());

// ❌ Java 9: Collection Factory Methods
List<String> list = List.of("a", "b", "c");
Map<String, Integer> map = Map.of("key", 1);
Set<String> set = Set.of("a", "b");
// ✅ Java 8: Arrays.asList / Collections
List<String> list = Arrays.asList("a", "b", "c");
List<String> list = Collections.unmodifiableList(Arrays.asList("a", "b", "c"));

// ❌ Java 9: Optional.ifPresentOrElse
optional.ifPresentOrElse(v -> use(v), () -> fallback());
// ✅ Java 8: if/else
if (optional.isPresent()) {
    use(optional.get());
} else {
    fallback();
}

// ❌ Java 11: String methods
str.isBlank();
str.strip();
str.lines();
str.repeat(3);
// ✅ Java 8: Utility methods
StringUtils.isBlank(str);  // Apache Commons or custom
str.trim();
```

---

## Spring Boot 2.4.x Compatibility

### Allowed Annotations & Patterns

```java
// ✅ Standard annotations (2.4.x compatible)
@SpringBootApplication
@RestController
@RequestMapping
@Service
@Repository
@Autowired
@Value("${property.name}")
@ConfigurationProperties(prefix = "app")
@ConditionalOnProperty
@Profile("local")
```

### Blocked or Cautionary Patterns

```java
// ⚠️ @ConstructorBinding on class level (2.6+ behavior change)
@ConstructorBinding  // on class — behavior changed in 2.6
@ConfigurationProperties(prefix = "app")
public class AppProperties {
    // ✅ Use on constructor instead
}

// ⚠️ spring.config.import (works in 2.4+ but prefer legacy approach)
// In application.properties:
// spring.config.import=optional:file:./custom.properties  ← 비권장
// spring.profiles.include=local  ← 권장
```

### KiiPS-Specific Spring Patterns

```java
// ✅ KiiPS 표준 Controller 패턴
@RestController
@RequestMapping("/api/v1/fd")
public class FD0101APIController {
    @Autowired
    private FD0101APIService service;

    @PostMapping("/list")
    public Map<String, Object> getList(@RequestBody Map<String, Object> param) {
        return service.getList(param);
    }
}

// ✅ KiiPS 표준 Service 패턴
@Service
public class FD0101APIService {
    @Autowired
    private FD0101APIDao dao;
}

// ✅ KiiPS 표준 DAO 패턴
@Repository
public class FD0101APIDao extends DAO {
    public List<Map<String, Object>> getList(Map<String, Object> param) {
        return selectList("FD0101.getList", param);
    }
}
```

---

## Frontend Compliance

### JSP Standard Patterns

```jsp
<%-- ✅ KiiPS 표준 JSP 헤더 --%>
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core"%>
<%@ taglib prefix="spring" uri="http://www.springframework.org/tags"%>

<%-- ✅ jQuery 사용 --%>
<script>
$(document).ready(function() {
    initGrid();
    loadData();
});

function loadData() {
    logosAjax.requestTokenGrid('/api/v1/fd/list', param, function(data) {
        gridView.setData(data);
    });
}
</script>
```

### Blocked Frontend Patterns

```html
<!-- ❌ React -->
<script src="https://unpkg.com/react/umd/react.production.min.js"></script>
<div id="root"></div>

<!-- ❌ Vue -->
<script src="https://cdn.jsdelivr.net/npm/vue"></script>

<!-- ❌ ES Module -->
<script type="module">
import { createApp } from 'vue';
</script>

<!-- ❌ fetch API in JSP -->
<script>
fetch('/api/v1/fd/list')  // ← 금지: logosAjax 사용
    .then(r => r.json())
    .then(data => console.log(data));
</script>
```

---

## MyBatis Safety Patterns

### Allowed Exception List

```xml
<!-- ✅ ORDER BY 동적 정렬 (예외 허용) -->
<select id="getList" resultType="map">
    SELECT * FROM TB_FUND
    ORDER BY ${sortColumn} ${sortDirection}
</select>

<!-- ✅ 동적 테이블명 (예외 허용, 제한적) -->
<select id="getByTable" resultType="map">
    SELECT * FROM ${tableName}
    WHERE USE_YN = 'Y'
</select>
```

### Blocked Patterns

```xml
<!-- ❌ WHERE 절 직접 삽입 (SQL Injection) -->
<select id="searchFund" resultType="map">
    SELECT * FROM TB_FUND
    WHERE FUND_NM LIKE '%${keyword}%'
</select>

<!-- ✅ 올바른 방법 -->
<select id="searchFund" resultType="map">
    SELECT * FROM TB_FUND
    WHERE FUND_NM LIKE '%' || #{keyword} || '%'
</select>
```

---

## SCSS Theme Compliance

### Correct Pattern

```scss
// ✅ KiiPS 표준 다크테마
[data-theme=dark] {
    .card {
        background-color: $dark-bg;
        color: $dark-color-2;
        border-color: $dark-border;
    }
}
```

### Blocked Patterns

```scss
// ❌ 클래스 셀렉터
.dark {
    background-color: #1a1a2e;
}

// ❌ 복합 클래스 셀렉터
.theme-dark {
    color: #ffffff;
}

// ❌ 미디어 쿼리 기반
@media (prefers-color-scheme: dark) {
    body { background: #000; }
}
```

---

## Dependency Compatibility

### Java 9+ Only Libraries (Blocked)

| Library | Min Java | Alternative |
|---------|----------|-------------|
| `jakarta.servlet` | Java 11+ | `javax.servlet` |
| `jakarta.persistence` | Java 11+ | `javax.persistence` |
| `spring-boot 3.x` | Java 17+ | Spring Boot 2.4.x |
| `junit-jupiter 5.8+` | Java 8 OK, but KiiPS uses 4.x | JUnit 4 + Spring Test |
| `records-builder` | Java 14+ | Lombok or manual |

### Safe Libraries (Allowed)

| Library | Notes |
|---------|-------|
| `commons-lang3` | Java 8 compatible |
| `commons-collections4` | Java 8 compatible |
| `jackson-databind 2.x` | Java 8 compatible |
| `mybatis 3.5.x` | Java 8 compatible |
| `poi 4.x / 5.x` | Java 8 compatible |

---

## Detection Regex Patterns

blockRules에 사용되는 정규식 패턴:

```
java8-syntax:     \bvar\s+\w+\s*=|\brecord\s+\w+|\bsealed\s+(class|interface)
java8-api:        \b(List|Set|Map)\.(of|copyOf)\s*\(|\bStream\b.*\.toList\(\)
dark-selector:    \.(dark|theme-dark)\s*\{
mybatis-injection: \$\{(?!sortColumn|sortDirection|orderBy|tableName)
es-module:        \b(import|export)\s+(default|const|function|class|\{)
spa-framework:    import\s+(React|Vue|Angular|{.*}\s+from)
```

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
