# KiiPS Testing Checklist

## 단위 테스트 (JUnit)
- [ ] Service 클래스 테스트
- [ ] Controller 클래스 테스트
- [ ] Utility 클래스 테스트
- [ ] DAO 쿼리 테스트 (필요시)

## 커버리지 목표
- [ ] Statements ≥ 80%
- [ ] Functions ≥ 70%
- [ ] Branches ≥ 60%

## 모킹
- [ ] 외부 API 호출 모킹
- [ ] DB 연결 모킹 (필요시)
- [ ] Service-to-Service 호출 모킹

## 엣지 케이스
- [ ] 빈 데이터 처리
- [ ] Null 값 처리
- [ ] 잘못된 입력 값 처리
- [ ] 권한 없는 접근 처리

## API 테스트
- [ ] 정상 요청 응답 확인
- [ ] 잘못된 요청 에러 응답
- [ ] 인증/인가 테스트
- [ ] 페이징/정렬 테스트

## UI 테스트 (Jest/Karma)
- [ ] 컴포넌트 렌더링 테스트
- [ ] 이벤트 핸들러 테스트
- [ ] RealGrid 초기화 테스트
- [ ] AJAX 호출 모킹

## 통합 테스트
- [ ] API Gateway → Service 연동
- [ ] Service → DB 연동
- [ ] 서비스 간 통신 (Common_API_Service)

## 테스트 명령어

### Maven (Java)
```bash
# 전체 테스트
cd KiiPS-HUB/
mvn test

# 특정 모듈 테스트
mvn test -pl :KiiPS-FD

# 테스트 건너뛰기 (빌드만)
mvn package -DskipTests
```

### Jest (JavaScript)
```bash
# 전체 테스트
npm test

# 커버리지 포함
npm test -- --coverage

# 특정 파일
npm test -- MyComponent.test.js
```

### Karma (Angular/UI)
```bash
# 전체 UI 테스트
npm run test:ui

# 감시 모드
npm run test:ui -- --watch
```

## 테스트 결과 확인
- [ ] 모든 테스트 통과
- [ ] 커버리지 리포트 확인
- [ ] 실패한 테스트 수정
- [ ] 새 기능에 대한 테스트 추가
