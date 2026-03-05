# KiiPS Deployment Checklist

## 사전 검증
- [ ] Maven 빌드 성공 (`mvn clean package`)
- [ ] 단위 테스트 통과 (활성화된 경우)
- [ ] 의존성 충돌 없음
- [ ] 코드 리뷰 완료

## 환경 설정
- [ ] `app-*.properties` 환경별 설정 확인
  - [ ] `app-local.properties` (로컬)
  - [ ] `app-stg.properties` (스테이징)
  - [ ] `app-kiips.properties` (프로덕션)
- [ ] DB 연결 정보 확인
- [ ] API Gateway 라우팅 설정 확인

## 빌드 (KiiPS-HUB에서)
```bash
# 전체 프로젝트 빌드
cd KiiPS-HUB/
mvn clean package

# 특정 모듈 빌드 (의존성 포함)
mvn clean package -pl :KiiPS-FD -am
mvn clean package -pl :KiiPS-IL -am
```

## 배포 전 확인
- [ ] SVN 최신 상태 (`svn up`)
- [ ] 빌드 아티팩트 생성 확인 (`target/*.jar` 또는 `target/*.war`)
- [ ] 포트 충돌 확인 (`lsof -i :포트번호`)
- [ ] 이전 프로세스 종료 (`./stop.sh`)

## 서비스 배포
```bash
# 서비스 디렉토리로 이동
cd KiiPS-{서비스명}/

# 서비스 중지
./stop.sh

# 서비스 시작
./start.sh

# 로그 확인
tail -f logs/log.$(date "+%Y-%m-%d")-0.log
```

## 배포 후 확인
- [ ] 서비스 정상 기동 (로그 확인)
- [ ] Health Check API 응답
- [ ] 주요 API 동작 확인
- [ ] UI 페이지 접근 확인
- [ ] 에러 로그 없음

## 롤백 계획
- [ ] 이전 빌드 아티팩트 백업
- [ ] 롤백 절차 문서화
  1. 서비스 중지 (`./stop.sh`)
  2. 이전 아티팩트 복원
  3. 서비스 재시작 (`./start.sh`)
- [ ] 긴급 연락처 확보

## 서비스 포트 참조
| Service | Port | Service | Port |
|---------|------|---------|------|
| Gateway | 8088 | Login | 8801 |
| Common | 8701 | UI | 8100 |
| FD | 8601 | IL | 8401 |
| PG | 8501 | (Others) | 8xxx |
