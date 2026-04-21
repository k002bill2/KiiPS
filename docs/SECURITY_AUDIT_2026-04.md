# KiiPS 보안 감사 기록 (2026-04)

> **본 문서는 기록 전용입니다.** 현재 서비스 운영 중인 시스템이므로 본 문서 작성 시점에는 코드 변경을 수행하지 않습니다.
> 향후 보안 전용 스프린트 편성 시 본 문서를 기반으로 수정 계획을 수립합니다.

| 항목 | 값 |
|------|-----|
| 감사일 | 2026-04-20 |
| 원 보고서 | `.temp/coordination/cross-tool/responses/gemini-security-1772463708913.json` (2026-03-02 생성) |
| 검증자 | Claude Code (fresh-context 재검증) |
| 검증 방법 | 원 보고서 지적 파일/라인 직접 확인 + blast radius 확장 스캔 |
| 결정 | **코드 변경 없음** — 운영 시스템 안정성 우선, 별도 보안 스프린트에서 처리 |

---

## 1. 검증 요약

원 보고서는 8개 이슈(Critical 5, Warning 2, Info 1)를 지적했으나, fresh-context 검증 결과 모든 이슈가 현재도 존재하며 **실제 blast radius는 보고서보다 10~70배 넓습니다**.

| ID | 심각도 | 위치 | 보고서 범위 | 실제 범위 |
|----|--------|------|-------------|-----------|
| C1 | Critical | `KiiPS-UI/.../WebSecurityConfiguration.java:12` | UI 1개 | **21개 모듈 전부** |
| C2 | Critical | `KiiPS-UI/.../WebSecurityConfiguration.java:13` | UI 1개 | **21개 모듈 전부** |
| C3 | Critical | `KIIPS-BATCH/.../DIVA_API_Dao.java:41` | 1건 | 다수 (202건 concat 패턴 중) |
| C4 | Critical | `KiiPS-PG/.../PG0356APIDao.java:148` | 1건 | 다수 |
| C5 | Critical | `KiiPS-PG/.../PG0303APIDao.java:1110` | 1건 | 다수 |
| W1 | Warning | `KiiPS-UI/.../POPUP_RT0409_P2_print.jsp:232` | 1건 | JSP 전반 |
| W2 | Warning | `KiiPS-PG/app-tibero.properties:42` | 1건 | properties 전반 추정 |
| I1 | Info | `KIIPS-BATCH/.../WebMvcConfiguration.java:147-154` | 1건 | BATCH 모듈 |

### Blast Radius 확장 수치

```
WebSecurityConfiguration.java 21개 모듈 전부 permitAll() + csrf().disable() 적용
 → 프로젝트 전체 서비스가 Spring Security 레벨에서 인증 없음

SQL concat 패턴 (param.get() + sb.append() 결합)
 → KiiPS-PG + KIIPS-BATCH DAO에서 202건 적발
 → 원 보고서의 3건은 샘플링
```

---

## 2. 이슈별 상세

### [C1] Authentication Bypass — `anyRequest().permitAll()`

**파일**: `KiiPS-UI/src/main/java/com/kiips/ui/config/WebSecurityConfiguration.java:12`

```java
@Override
protected void configure(HttpSecurity http) throws Exception{
    http.authorizeRequests().anyRequest().permitAll()
            .and().csrf().disable().headers()
            ...
}
```

**증거**: 21/21 개 `WebSecurityConfiguration.java`가 동일한 `permitAll()` 패턴을 포함.

**리스크**:
- Spring Security 레벨에서 모든 엔드포인트가 인증 없이 접근 가능
- 단, KiiPS 환경에서는 **API Gateway(`KIIPS-APIGateway`, 포트 8088)** 또는 별도 인증 레이어가 백엔드 앞단에 존재할 가능성이 높음 (내부망 설계)

**해석 주의**: `permitAll()` 자체가 "의도적인 내부망 설계"일 수 있음. 섣불리 `authenticated()`로 변경 시 **전체 서비스 401 장애** 발생 가능.

**권장 대응 (미실행)**:
1. Gateway 레이어 인증 실태 조사 (선결)
2. 파일럿 모듈 1개(UI)에서 `authenticated()` 전환 실험
3. 로그인/세션/토큰 흐름 end-to-end 테스트
4. 전 모듈 적용 전 회귀 테스트

---

### [C2] CSRF Protection Disabled — `.csrf().disable()`

**파일**: 동일 (WebSecurityConfiguration.java:13)

**리스크**:
- 사용자 세션이 존재하는 상태에서 타 사이트의 악성 HTML이 KiiPS API를 호출할 수 있음
- CSRF 토큰 없는 POST/PUT/DELETE 요청이 허용됨

**전파**: 21/21 모듈

**권장 대응 (미실행)**:
- CSRF 활성화 시 모든 프런트엔드 AJAX 요청에 `X-CSRF-TOKEN` 헤더 추가 필요 → JSP 전반 수정
- 단계적 접근: Gateway 단에서 CSRF 토큰 검증 통합 검토

---

### [C3] SQL Injection — DIVA MERGE 쿼리

**파일**: `KIIPS-BATCH/src/main/java/com/kiips/batch/dao/DIVA_API_Dao.java:37-84`

```java
sb.append("\n MERGE INTO "+ kiips_out_schema +".REGUL_VILT_MTR T");
sb.append("\n USING (SELECT '"+ param.get("ILT_MTR_ID") +"' AS ILT_MTR_ID FROM DUAL) S");
...
sb.append("\n UPDATE SET T.GP_NM ='"+ param.get("GP_NM") +"'");
...
jdbctmp.update(sb.toString());
```

**리스크**:
- `param.get()`의 모든 값이 SQL 문자열에 직접 concat
- 악의적 SQL 페이로드 주입 가능 (문자열 이스케이프 + 메타문자 통한 쿼리 조작)

**완화 요인**:
- BATCH 모듈 → 내부 배치에서만 호출, 외부 사용자 입력 직결 여부 확인 필요
- 호출자 추적 필요: 해당 메서드가 HTTP 엔드포인트에서 직접 호출되는지 검증

**권장 대응 (미실행)**:
- PreparedStatement 바인딩(`?`) + `args` 배열로 변환
- 스키마명 등 바인딩 불가 식별자는 whitelist 검증

---

### [C4] SQL Injection — PIVOT Dynamic Column

**파일**: `KiiPS-PG/src/main/java/com/kiips/pg/dao/PG0356APIDao.java:148`

```java
sb.append("\n FOR ITEM IN ("+param.get("pivotStr")+")   --TB_PG3023M에서 조회한 항목으로..");
```

**특이점**: PIVOT 절의 `IN (...)` 목록은 SQL 바인딩(`?`)으로 처리 불가능한 문법. **Whitelist 방식 필수**.

**권장 대응 (미실행)**:
```java
// TB_PG3023M에서 허용 값만 조회
List<String> allowedItems = dao.selectAllowedPivotItems();

// 입력 검증
String[] inputItems = param.get("pivotStr").split(",");
for (String item : inputItems) {
    if (!allowedItems.contains(item.trim())) {
        throw new BusinessException("허용되지 않은 PIVOT 항목");
    }
}
// 검증 통과 시에만 concat (단, Constant enum으로 한정)
```

---

### [C5] SQL Injection — Dynamic Column Name

**파일**: `KiiPS-PG/src/main/java/com/kiips/pg/dao/PG0303APIDao.java:1110`

```java
sb.append("\n AND "+param.get("type")+" = ?"); values.add(param.get("value"));
```

**특이점**: 컬럼명은 SQL 바인딩 불가. **Enum 기반 whitelist 필수**.

**권장 대응 (미실행)**:
```java
enum AllowedColumn {
    CUST_NM, CUST_NO, DOC_NO;
    public static AllowedColumn of(String s) {
        try { return valueOf(s.toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new BusinessException("허용되지 않은 컬럼");
        }
    }
}
// Controller에서 검증 후 Service로 전달
```

---

### [W1] XSS — JSP EL Unescaped Output

**파일**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/COM/POPUP_RT0409_P2_print.jsp:232` 주변

```jsp
<td>${datas.J_CUST_NM}</td>
<td class="rgt">${datas.CONTRACTAMT}억원</td>
```

**리스크**: 사용자 입력이 데이터에 포함된 경우 JavaScript 실행 가능.

**완화**: Spring Boot의 `HTMLCharacterEscapes` 전역 필터가 적용되어 있다면 완화됨. 확인 필요.

**권장 대응 (미실행)**:
```jsp
<td><c:out value="${datas.J_CUST_NM}"/></td>
<!-- 또는 -->
<td>${fn:escapeXml(datas.J_CUST_NM)}</td>
```

---

### [W2] Hardcoded Database Password

**파일**: `KiiPS-PG/app-tibero.properties:42`

```properties
spring.datasource.dev.hikari.password=<평문 비밀번호>
```

**리스크**:
- Git/SVN 저장소에 평문 저장
- 로컬 파일 열람 가능한 모든 사람에게 노출

**권장 대응 (미실행)**:
```properties
# 환경변수 치환
spring.datasource.dev.hikari.password=${DB_PASSWORD:defaultForDev}
```
+ 배포 스크립트에서 `export DB_PASSWORD=...`
+ 기존 비밀번호 **즉시 교체** 필요 (이미 유출된 것으로 간주)

---

### [I1] XSS Filter Disabled — lucy-xss-filter

**파일**: `KIIPS-BATCH/src/main/java/com/kiips/batch/config/WebMvcConfiguration.java:143-154`

```java
/*
 * lucy-xss-filter
 *
 * */
//    @Bean
//    public FilterRegistrationBean getFilterRegistrationBean(){
//        FilterRegistrationBean registrationBean = new FilterRegistrationBean();
//        registrationBean.setFilter(new XssEscapeServletFilter());
//        ...
//    }
```

**영향**: W1(JSP XSS)의 전역 방어망이 비활성화 상태.

**권장 대응 (미실행)**:
- 의존성 추가 확인: `lucy-xss-servlet-filter`
- 활성화 시 **의도적으로 HTML을 허용하는 필드**(예: WYSIWYG 에디터)가 깨질 수 있음 → 사전 회귀 테스트 필수

---

## 3. 수정 미실행 근거

| 사유 | 설명 |
|------|------|
| 운영 중 서비스 | 변경 시 서비스 중단 리스크 |
| 블러스트 반경 과대 | 21개 모듈 × 수백 개 파일 → 다중 스프린트 필요 |
| 회귀 테스트 부재 | 인증/CSRF 활성화 시 모든 기능 재검증 필요 |
| 아키텍처 선결 조사 | Gateway 인증 실태 파악 없이 Spring Security만 변경 시 장애 위험 |

**CLAUDE.md HARD-GATE 규칙 준수**: `KiiPS-COMMON`/`KiiPS-UTILS`/`pom.xml`/`app-*.properties`/`MyBatis mapper XML` 변경은 사용자 명시 승인 필수.

---

## 4. 권장 후속 조치 (별도 스프린트)

### Phase 1 — 조사 (변경 없음)
- [ ] `KIIPS-APIGateway` 인증 실태 분석
- [ ] 호출 경로 매핑: C3/C4/C5 DAO의 호출자가 외부 입력을 수용하는지 확인
- [ ] `HTMLCharacterEscapes` / `lucy-xss-filter` 현재 적용 상태 확인

### Phase 2 — 저위험 수정
- [ ] W2: 하드코딩 비밀번호 → 환경변수 (+ 비밀번호 교체)
- [ ] I1: lucy-xss-filter 활성화 (회귀 테스트 후)

### Phase 3 — SQL Injection 점진적 패치
- [ ] C3: DIVA DAO PreparedStatement 변환
- [ ] C4: PG0356 whitelist 도입
- [ ] C5: PG0303 Enum whitelist 도입
- [ ] 나머지 ~199건 concat 패턴 전수 조사 → 티켓화

### Phase 4 — 인증/CSRF (최대 리스크)
- [ ] 파일럿 모듈 1개 `authenticated()` 전환
- [ ] e2e 회귀 테스트
- [ ] 점진적 전체 모듈 확대
- [ ] CSRF 토큰 통합 (Gateway 레이어 또는 Spring Security)

---

## 5. 참고 자료

- 원 Gemini 보고서: `.temp/coordination/cross-tool/responses/gemini-security-1772463708913.json`
- KiiPS 보안 스킬: `.claude/skills/kiips-security-guide/`
- Validation 규칙: `.claude/rules/validation.md`
- CLAUDE.md Golden Principle #6 (Boundary Validation)
- CLAUDE.md Golden Principle #2 (Secrets in Environment Variables)

---

## 6. 변경 이력

| 일자 | 변경 | 담당 |
|------|------|------|
| 2026-04-20 | 초안 작성 (fresh-context 검증 + blast radius 확장) | Claude Code |
