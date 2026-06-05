---
name: project_login_componentscan_bean_conflict
description: login 등 IDE 로컬 실행 시 DatabaseChainedTXMngConfig bean 충돌 - common fat jar vs IDE 모듈 클래스패스 차이
metadata: 
  node_type: memory
  type: project
  originSessionId: 01a5451a-a1e0-4c60-9910-76437b9c2641
---

KiiPS-Login(및 동일 구조의 도메인 모듈)이 **IDE(IntelliJ/Antigravity) 로컬 실행** 시 `ConflictingBeanDefinitionException: 'databaseChainedTXMngConfig'`로 부팅 실패하는 근본 메커니즘.

## 원인
- 각 모듈은 자체 `com.kiips.{도메인}.config.DatabaseChainedTXMngConfig`를 가지면서 `@ComponentScan({"com.kiips", ...})`로 `com.kiips` **전체**를 스캔한다.
- KiiPS-COMMON에도 `com.kiips.common.config.DatabaseChainedTXMngConfig`가 있어 두 클래스의 simple name이 같아 bean name(`databaseChainedTXMngConfig`)이 충돌한다. (두 클래스는 `dsKiips`/`jdbcKiiPS`/`KiipsTxMng`/`transactionManager` @Bean 이름까지 공유 → 클래스명만 rename하면 메서드 레벨에서 또 충돌, rename 불가.)

## 왜 mvn은 정상, IDE만 실패하나 (핵심)
- **KiiPS-COMMON은 `spring-boot-maven-plugin`으로 fat jar(`BOOT-INF/classes/...`)로 install**된다. 그 jar에는 `DatabaseChainedTXMngConfig`가 없어, mvn 빌드/실행 클래스패스엔 충돌 클래스가 **부재** → 충돌 불가능.
- **IDE는 KiiPS-COMMON을 모듈로 참조해 `target/classes`를 직접 클래스패스에 노출**(config 포함) → 충돌 발생. ⇒ 이 충돌은 **IDE 전용 현상이며 mvn으로는 재현/검증 불가**.

## 해결 (login에 적용, 2026-06-05) — login도 다건 충돌, 포괄 제외 필요
처음엔 단일 제외(DatabaseChainedTXMngConfig)로 끝난 줄 알았으나 **재실행 시 TransactionAspect 등 순차 충돌**이 터졌다(두더지잡기). login도 IL처럼 자체 config/controller/dao가 common과 동일 단순명 다수.
- 전수 교집합(`com.kiips.login` ↔ `com.kiips.common` 단순명 11개): config 6(DatabaseChainedTXMngConfig/TransactionAspect/WebMvcConfiguration/WebSecurityConfiguration/LoggerInterceptor/MessageUtil) + 컨트롤러 3(BackUp/LogSave/TestAPIController) + LoginDao + testRequestVO(VO=비빈, 무해).
- **login은 common 을 코드에서 0건 import** — 원하는 건 ErrorNotificationService(독립, RestTemplate만)·GlobalExceptionHandler(@RestControllerAdvice + @ConditionalOnBean(ErrorNotificationService))뿐.
- **LoginDao 함정**: login.dao.LoginDao(로그인 로직)와 common.dao.LoginDao(common Login_API_Service가 `@Autowired LoginDao` 타입 의존) 둘 다 필요해 단순 제외 불가 → common 쪽 LoginDao **+ 유일 의존자 Login_API_Service**를 함께 제외(login은 Login_API_Service 안 씀).

`KiiPsLoginApplication.java` excludeFilters(REGEX 배열, 한 파일만):
```java
@ComponentScan(value = {"com.kiips","kr.co.kiips.dao"},
    excludeFilters = @ComponentScan.Filter(type = FilterType.REGEX, pattern = {
        "com\\.kiips\\.common\\.KiiPSApplication",
        "com\\.kiips\\.common\\.controll\\..*",
        "com\\.kiips\\.common\\.config\\.(DatabaseChainedTXMngConfig|TransactionAspect|WebMvcConfiguration|WebSecurityConfiguration|LoggerInterceptor|MessageUtil)",
        "com\\.kiips\\.common\\.dao\\.LoginDao",
        "com\\.kiips\\.common\\.service\\.Login_API_Service"}))
```
- 반드시 REGEX: ASSIGNABLE_TYPE(클래스 직접 참조)은 common fat jar 에 클래스 부재로 mvn 컴파일 실패. `@ComponentScan.Filter.pattern`은 String[] → 한 필터에 다중 패턴.
- **DB 체인 안전**: common DatabaseChainedTXMngConfig 제외해도 login 자체 것이 동일 bean(`dsKiips`/`jdbcKiiPS`/`KiipsTxMng`)으로 대체 제공. 스캔되는 common service/dao(SMS/Bank/PUSH 등)는 `@Qualifier("jdbcKiiPS") JdbcTemplate`을 login의 plain JdbcTemplate로 충족(`KiiPSJdbcTemplate extends JdbcTemplate`).
- 보존: ErrorNotificationService, GlobalExceptionHandler, 기타 무해 common 빈.

## 검증
- mvn clean install BUILD SUCCESS로 빌드 무결성 확인. **실제 충돌 해소는 IDE 재실행으로만 확인 가능** (mvn 재현 불가). 추가 충돌이 또 뜨면 그 클래스를 패턴에 추가. DB 연결 에러가 새로 뜨면 코드가 아니라 [[project_local_oci_access_pcassist]] 확인.

## IL 적용 (2026-06-04) — 단일 제외로 불충분, 포괄 제외 필요
- IL은 충돌이 **순차로 여러 건** 터졌다(DatabaseChainedTXMngConfig → TransactionAspect → …). login은 1건만 겹쳐 단일 제외로 끝났지만, **IL은 자체 config 6종이 common과 동일명**(DatabaseChainedTXMngConfig/TransactionAspect/WebMvcConfiguration/WebSecurityConfiguration/LoggerInterceptor/MessageUtil)이라 단일 제외로는 두더지잡기가 된다.
- `com.kiips.common` ↔ `com.kiips.il` 전체 단순명 충돌 = 위 config 6 + 컨트롤러 2(BackUpAPIController/LogSaveAPIController) + KiiPSApplication(@SpringBootApplication) + testRequestVO(VO=비빈, 무해).
- IL `KiiPSApplication.java` excludeFilters 3개 REGEX로 포괄 제외:
  - `com\.kiips\.common\.KiiPSApplication`
  - `com\.kiips\.common\.controll\..*`  (common 서비스 REST 엔드포인트 전체 — IL은 import 안 함)
  - `com\.kiips\.common\.config\.(DatabaseChainedTXMngConfig|TransactionAspect|WebMvcConfiguration|WebSecurityConfiguration|LoggerInterceptor|MessageUtil)`
- 보존: IL이 실제 import하는 `com.kiips.common.{trnx,model,dao}` + IL에 없는 공유 config(`AmazoneS3Config`/`POPBillConfig`/`BodyCachingFilter`). common `service`도 미제외(IL이 SMS_API_Service 등 사용).
- **함정**: 처음에 common이 라이브러리인 줄 알고 common의 DatabaseChainedTXMngConfig.java를 삭제했다가, common이 **8701 실행 서비스**(자체 KiiPSApplication+컨트롤러 다수)임을 확인하고 `svn revert`로 복구. common 쪽은 절대 건드리지 말 것 — **도메인 모듈의 @ComponentScan만** 수정.
- mvn 빌드: COMMON은 `-am` 필수(kiips-util→commons-io 전이의존). IL `mvn clean install -pl :KiiPS-IL -am` BUILD SUCCESS. 충돌 해소는 IDE 재실행 검증.

## 별도 이슈 (보고만)
- common이 fat jar로 install되는 점은 mvn 실제 배포에서 login이 common 빈을 못 받을 수 있는 구조 문제. FD/AC/SY/LP/EL/BATCH 등 동일 구조 모듈도 같은 IDE 충돌 잠재(전부 `@ComponentScan({"com.kiips",...})`). 관련: [[project_kiips_inline_sql_dao]]
