# KiiPS Code Review Checklist

## Java/Spring Boot 품질
- [ ] `@Autowired` 필드 주입 대신 생성자 주입 사용
- [ ] 적절한 예외 처리 및 로깅
- [ ] Service/Controller/Repository 레이어 분리
- [ ] DTO와 Entity 분리
- [ ] Null 체크 및 Optional 사용

## API 설계
- [ ] RESTful 규칙 준수 (HTTP 메서드, 상태 코드)
- [ ] 요청/응답 DTO 정의
- [ ] Swagger/OpenAPI 문서화
- [ ] 입력 값 검증 (@Valid, @NotNull 등)
- [ ] 페이징/정렬 지원 (필요시)

## 에러 처리
- [ ] GlobalExceptionHandler에서 처리
- [ ] 적절한 HTTP 상태 코드 반환
- [ ] Slack 에러 알림 연동 (ErrorNotificationService)
- [ ] 사용자 친화적 에러 메시지

## 코드 품질
- [ ] `System.out.println` 제거 (Logger 사용)
- [ ] 주석처리된 코드 제거
- [ ] 메서드 길이 50줄 이하
- [ ] 중복 코드 없음 (KiiPS-COMMON 활용)
- [ ] 상수는 static final로 정의

## 보안
- [ ] SQL Injection 방지 (PreparedStatement, MyBatis #{})
- [ ] XSS 방지 (Lucy XSS Filter)
- [ ] 민감 정보 로깅 금지
- [ ] JWT 토큰 검증

## UI (JSP/JavaScript)
- [ ] RealGrid 컬럼 정의 일관성
- [ ] AJAX 에러 처리
- [ ] 로딩 인디케이터 표시
- [ ] Bootstrap 그리드 사용

## 성능
- [ ] N+1 쿼리 문제 확인
- [ ] 불필요한 DB 호출 제거
- [ ] 적절한 캐싱 적용
- [ ] 인덱스 활용 확인

## 접근성 (WCAG 2.1 AA)
- [ ] 폼 요소에 label 연결
- [ ] 클릭 영역 최소 44x44px
- [ ] 색상 대비 4.5:1 이상
- [ ] 키보드 네비게이션 지원
