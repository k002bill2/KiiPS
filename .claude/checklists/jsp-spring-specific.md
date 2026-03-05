# JSP + Spring Boot Specific Checklist (KiiPS)

## Java / Spring Boot

### Controller
- [ ] @Valid 어노테이션으로 요청 파라미터 검증
- [ ] GlobalExceptionHandler에서 커버하는 예외 타입 확인
- [ ] ResponseEntity로 적절한 HTTP 상태 코드 반환
- [ ] API Gateway 라우팅 설정 확인 (Gateway 8088)
- [ ] x-api-key 헤더 검증 (서비스 간 통신)

### Service
- [ ] @Transactional 범위 적절성 확인
- [ ] 롤백 조건 설정 (@Transactional(rollbackFor = Exception.class))
- [ ] 비즈니스 예외 로깅 (Sentry 전송)
- [ ] 서비스 간 호출 시 Common_API_Service 사용

### Repository / DAO
- [ ] MyBatis #{} 파라미터 바인딩 사용 (${} SQL Injection 방지)
- [ ] DELETE/UPDATE 쿼리에 WHERE 조건 확인
- [ ] Dynamic SQL 분기 테스트
- [ ] 대량 데이터 처리 시 페이지네이션 확인

### pom.xml
- [ ] SNAPSHOT 버전 프로덕션 배포 금지
- [ ] 의존성 라이선스 호환성 확인
- [ ] KiiPS-HUB에서 빌드 순서 확인 (COMMON -> UTILS -> 서비스)

## JSP (KiiPS-UI)

### 기본 구조
- [ ] JSTL/EL 태그로 데이터 바인딩 (스크립틀릿 지양)
- [ ] 인코딩 설정 확인 (UTF-8)
- [ ] 공통 레이아웃 타일즈 적용
- [ ] JSP 경로: `WEB-INF/jsp/kiips/{도메인}/`

### JavaScript / jQuery
- [ ] AJAX 에러 핸들러 추가 (.fail() 또는 error callback)
- [ ] Loading 스피너 표시/숨기기
- [ ] Cross-Site Scripting (XSS) 방지 ($.text() vs $.html())
- [ ] 중복 요청 방지 (버튼 비활성화)

### RealGrid 2.6.3
- [ ] GridView, DataProvider 초기화 확인
- [ ] 컬럼 설정 (너비, 정렬, 편집기)
- [ ] Excel Export 기능 확인
- [ ] 페이징 설정 (대용량 데이터)
- [ ] 이벤트 핸들러 정리 (메모리 누수 방지)

### ApexCharts
- [ ] 차트 초기화 및 데이터 바인딩
- [ ] 반응형 옵션 설정
- [ ] 차트 destroy 호출 (페이지 이탈 시)

## SCSS / 스타일

### 다크테마 규칙
- [ ] `[data-theme=dark]` 셀렉터만 사용
- [ ] `.dark`, `.theme-dark` 사용 금지
- [ ] `!important`는 인라인 오버라이드 시에만
- [ ] SCSS 파일만 수정 (CSS 직접 수정 금지)
- [ ] 레이아웃 속성 변경 금지 (width/height/display/position/margin/padding)
- [ ] 기존 SCSS 변수 활용 ($dark-bg, $dark-color-2)

### 참조 파일
- [ ] 변수: `themes/default/_dark.scss`
- [ ] 컴포넌트: `layouts/_dark.scss`
- [ ] SCSS 위치: `KiiPS-UI/src/main/resources/static/css/sass/`

## 배포

### 빌드
- [ ] KiiPS-HUB에서 빌드 실행
- [ ] `mvn clean package -pl :<모듈명> -am`
- [ ] 테스트 성공 확인
- [ ] Java 8 환경 확인 (`java -version` -> 1.8.x)

### 서비스 시작
- [ ] DB 접속 가능 (PostgreSQL)
- [ ] `app-local.properties` 설정 확인
- [ ] 포트 충돌 없음 (8088, 8100, 8601, 8401, 8701, 8801)
- [ ] 의존 서비스 실행 중 (Gateway, Common, Login)

### 검증
- [ ] API 응답 확인
- [ ] 로그 확인: `tail -f logs/log.$(date "+%Y-%m-%d")-0.log`
- [ ] 브라우저에서 UI 동작 확인

## 보안

- [ ] 프로덕션 설정 파일 커밋 금지 (app-kiips.properties)
- [ ] API 키/비밀번호 하드코딩 금지
- [ ] SQL Injection 방지 (#{} 사용)
- [ ] XSS 방지 (입력값 이스케이프)
- [ ] CSRF 토큰 확인
