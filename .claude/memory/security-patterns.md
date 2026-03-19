# 보안 패턴 메모리

> `/learn` 명령이 security-pattern 도메인 교훈을 자동 기록합니다.

## XSS 방지

- JSP: `<c:out value="${...}" escapeXml="true"/>` 필수
- jQuery: `.text()` 사용, `.html(userInput)` 금지
- HTML 문자열 조립 시 이스케이프 함수 적용

## SQL Injection 방지

- MyBatis `#{}` 필수, `${}` 금지 (동적 테이블명 예외)
- 매퍼 XML 검증: `grep '${' *.xml` 결과 0건

## CSRF

- Spring Security CSRF 활성화 상태
- AJAX 요청 시 `X-CSRF-TOKEN` 헤더 필수

## 인증/인가

<!-- /learn이 추가할 영역 -->

## 민감정보 보호

<!-- /learn이 추가할 영역 -->
