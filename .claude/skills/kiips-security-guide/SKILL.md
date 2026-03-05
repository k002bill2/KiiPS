---
name: KiiPS Security Guide
description: |
  KiiPS 보안 가이드 - Spring Security, XSS 방어, CSRF, 인증/인가, 민감정보 보호.
  Use when: 보안 설정, 인증 처리, XSS 방어, 민감정보 보호, 보안 코드 리뷰
version: 1.0.0
priority: critical
enforcement: require
category: security
disclosure:
  summary: true
  expanded: true
  full: true
  default: expanded
tags:
  - security
  - spring-security
  - xss
  - csrf
  - authentication
  - authorization
  - encryption
  - sql-injection
author: KiiPS Development Team
lastUpdated: 2026-02-27
---

# KiiPS Security Guide

> KiiPS 프로젝트 보안 표준 가이드

---

## Quick Reference

| 위협 | 방어 | KiiPS 적용 |
|------|------|------------|
| SQL Injection | MyBatis `#{}` 바인딩 | mapper.xml 필수 |
| XSS | `<c:out>`, `fn:escapeXml()` | JSP 출력 필수 |
| CSRF | Spring Security CSRF 토큰 | 폼 전송 시 필수 |
| 인증 우회 | WebSecurityConfiguration | 비활성화 금지 |
| 민감정보 노출 | jasypt 암호화 | properties 필수 |

---

## Part 1: Spring Security 설정

### WebSecurityConfiguration 표준 패턴

```java
@Configuration
@EnableWebSecurity
public class WebSecurityConfiguration extends WebSecurityConfigurerAdapter {

    @Override
    protected void configure(HttpSecurity http) throws Exception {
        http
            .csrf()
                .ignoringAntMatchers("/api/**")
                .csrfTokenRepository(CookieCsrfTokenRepository.withHttpOnlyFalse())
            .and()
            .authorizeRequests()
                .antMatchers("/login", "/health", "/css/**", "/js/**").permitAll()
                .antMatchers("/admin/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            .and()
            .sessionManagement()
                .maximumSessions(1)
                .expiredUrl("/login?expired")
            .and().and()
            .formLogin()
                .loginPage("/login")
                .defaultSuccessUrl("/main")
            .and()
            .logout()
                .logoutSuccessUrl("/login")
                .invalidateHttpSession(true)
                .deleteCookies("JSESSIONID");
    }
}
```

### 중요 규칙

1. **WebSecurityConfiguration 비활성화 절대 금지**
   - `@Configuration` 주석처리 금지
   - `http.authorizeRequests().anyRequest().permitAll()` 금지
   - 빌드 에러 해결을 위한 Security 비활성화 금지

2. **의존성 누락 시 대처**
   ```xml
   <dependency>
       <groupId>org.springframework.boot</groupId>
       <artifactId>spring-boot-starter-security</artifactId>
   </dependency>
   ```

---

## Part 2: XSS 방어

### JSP 출력 이스케이프

```jsp
<%@ taglib prefix="c" uri="http://java.sun.com/jsp/jstl/core" %>
<%@ taglib prefix="fn" uri="http://java.sun.com/jsp/jstl/functions" %>

<!-- 안전: c:out 사용 -->
<td><c:out value="${item.userName}"/></td>

<!-- 안전: fn:escapeXml 사용 -->
<input type="text" value="${fn:escapeXml(item.userName)}">

<!-- 위험: 직접 출력 금지 -->
<!-- <td>${item.userName}</td> -->
```

### JavaScript에서 안전한 DOM 조작

```javascript
// 위험: innerHTML 사용 금지
// 안전: textContent 또는 jQuery .text() 사용
element.textContent = serverData;
$(element).text(serverData);
```

### Content Security Policy (CSP)

```java
@Configuration
public class SecurityHeaderConfig implements WebMvcConfigurer {
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(new HandlerInterceptor() {
            @Override
            public boolean preHandle(HttpServletRequest req,
                                     HttpServletResponse res,
                                     Object handler) {
                res.setHeader("X-Content-Type-Options", "nosniff");
                res.setHeader("X-Frame-Options", "SAMEORIGIN");
                res.setHeader("X-XSS-Protection", "1; mode=block");
                return true;
            }
        });
    }
}
```

---

## Part 3: CSRF 보호

### 폼 전송 시 CSRF 토큰

```jsp
<form method="POST" action="/api/save">
    <input type="hidden" name="${_csrf.parameterName}" value="${_csrf.token}"/>
</form>
```

### AJAX 요청 시 CSRF 토큰

```javascript
var csrfToken = $("meta[name='_csrf']").attr("content");
var csrfHeader = $("meta[name='_csrf_header']").attr("content");

$.ajaxSetup({
    beforeSend: function(xhr) {
        if (csrfHeader && csrfToken) {
            xhr.setRequestHeader(csrfHeader, csrfToken);
        }
    }
});
```

---

## Part 4: 인증/인가

### Controller 레벨 권한 검증

```java
@RestController
@RequestMapping("/api/fd")
public class FundController {

    @PreAuthorize("hasRole('FUND_ADMIN')")
    @PostMapping("/delete")
    public ResponseEntity<?> deleteFund(@RequestBody Map<String, Object> param) {
        // 역할 기반 접근 제어
    }

    @PostMapping("/save")
    public ResponseEntity<?> saveFund(
            @RequestBody Map<String, Object> param,
            HttpServletRequest request) {
        String userId = (String) request.getSession().getAttribute("USER_ID");
        if (userId == null) {
            return ResponseEntity.status(401).body("인증 필요");
        }
        if (!authService.hasPermission(userId, "FD1001", "SAVE")) {
            return ResponseEntity.status(403).body("권한 없음");
        }
        return fundService.save(param);
    }
}
```

### 세션 관리

- 세션 타임아웃: `server.servlet.session.timeout=1800` (30분)
- 세션 무효화: `request.getSession().invalidate()`
- 세션 고정 방지: `sessionFixation().migrateSession()` (Spring Security 기본)

---

## Part 5: 민감정보 보호

### 핵심 규칙

1. **properties 파일**: jasypt `ENC()` 사용하여 암호화 필수
2. **로깅**: 개인정보/자격증명 로깅 절대 금지, userId만 허용
3. **하드코딩 금지**: `@Value` 또는 환경변수로 주입
4. **Git/SVN**: `.gitignore`에 `*.properties` (로컬용) 등록

### jasypt 암호화 패턴

```properties
# jasypt로 암호화된 값 사용
spring.datasource.url=jdbc:postgresql://localhost:5432/kiips
# ENC() 감싸기로 암호화 값 사용
spring.datasource.username=ENC(encrypted_username)
```

### @Value 주입 패턴

```java
// 설정 파일 또는 환경변수에서 주입 (하드코딩 금지)
@Value("${spring.datasource.username}")
private String dbUsername;

@Value("${external.service.endpoint}")
private String serviceEndpoint;
```

---

## Part 6: 보안 코드 리뷰 체크리스트

### CRITICAL (즉시 수정)

- [ ] MyBatis `${}` 사용처에 화이트리스트 검증 있는가?
- [ ] JSP에서 `${param}` 직접 출력하는 곳 없는가?
- [ ] WebSecurityConfiguration이 활성화되어 있는가?
- [ ] 하드코딩된 자격증명이 없는가?

### HIGH (1주 내 수정)

- [ ] 모든 POST 요청에 CSRF 토큰 포함되는가?
- [ ] 에러 응답에 스택트레이스가 노출되지 않는가?
- [ ] 파일 업로드 시 확장자/크기 검증하는가?
- [ ] 민감정보 로깅이 마스킹되어 있는가?

### MEDIUM (계획적 수정)

- [ ] Content-Type, X-Frame-Options 헤더 설정되어 있는가?
- [ ] 세션 타임아웃이 적절하게 설정되어 있는가?
- [ ] 로그인 시도 횟수 제한이 있는가?

---

## Part 7: KiiPS 특화 보안 규칙

### API Gateway 인증

```
클라이언트 → API Gateway (8088) → JWT 검증 → 서비스 모듈
```

- Gateway에서 JWT 토큰 검증 필수
- 서비스 간 통신은 내부 네트워크로 제한
- 각 서비스 모듈의 WebSecurityConfiguration 유지

### 파일 업로드 보안

```java
// 허용 확장자 화이트리스트
private static final Set<String> ALLOWED_EXT = Set.of(
    "xlsx", "xls", "pdf", "jpg", "png", "gif"
);
// 파일 크기 제한: 10MB
private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;
// 저장 경로: 웹 루트 외부
private static final String UPLOAD_DIR = "/data/kiips/upload/";
```

### SQL 실행 권한

```
애플리케이션 DB 계정: SELECT, INSERT, UPDATE, DELETE만 허용
DDL (CREATE, DROP, ALTER): DBA 전용
```
