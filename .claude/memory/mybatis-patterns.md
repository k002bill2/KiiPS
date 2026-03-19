# MyBatis 패턴 메모리

> `/learn` 명령이 mybatis-pattern 도메인 교훈을 자동 기록합니다.

## 파라미터 바인딩

- `#{}` 필수, `${}` 금지 (동적 테이블명 예외)
- LIKE 검색: `CONCAT('%', #{value}, '%')` 또는 `'%' || #{value} || '%'`

## 동적 SQL

- `<where>` + `<if test="...">` 표준 패턴
- `<foreach>` 사용 시 IN 절 최적화

## 성능

<!-- /learn이 추가할 영역 -->

## 트러블슈팅

<!-- /learn이 추가할 영역 -->
