---
name: kiips-build-deploy
description: "빌드+배포 통합 가이드, kiips-maven-builder와 kiips-service-deployer 연계 워크플로우"
disable-model-invocation: true
---

# KiiPS Build & Deploy

> 빌드 → 테스트 → 배포 → 헬스체크 통합 워크플로우

---

## Quick Reference

```bash
# 1. 빌드 (항상 KiiPS-HUB에서)
cd KiiPS-HUB && mvn clean package -pl :KiiPS-SERVICE -am

# 2. 서비스 중지
./stop.sh

# 3. 서비스 시작
./start.sh

# 4. 로그 확인
tail -f logs/log.$(date "+%Y-%m-%d")-0.log

# 5. 헬스체크
curl -s http://localhost:{port}/actuator/health
```

---

## 전체 파이프라인

```
[빌드] → [테스트] → [배포] → [헬스체크]
  ↓         ↓         ↓         ↓
 maven    JUnit    start.sh   curl
 compile  verify   stop.sh    /health
 package           포트확인    로그확인
```

### 단계별 체크포인트

| 단계 | 성공 기준 | 실패 시 |
|------|----------|---------|
| 빌드 | `BUILD SUCCESS` | 컴파일 에러 해결 |
| 테스트 | 전체 통과 | 실패 테스트 수정 |
| 배포 | 포트 응답 | 로그 에러 확인 |
| 헬스체크 | HTTP 200 | 롤백 고려 |

---

## 빌드 규칙

- **항상 KiiPS-HUB에서 빌드** (의존성 해결 필수)
- **빌드 순서**: COMMON → UTILS → 서비스 모듈
- **SNAPSHOT 버전**: 프로덕션 배포 금지

---

## 배포 전 체크리스트

1. DB 접속 가능? (PostgreSQL 연결 테스트)
2. `app-local.properties` 설정 확인?
3. Java 8 활성? (`java -version` → 1.8.x)
4. 포트 충돌 없음? (`lsof -i :8088 :8100 :8601 :8401 :8701 :8801`)
5. 의존 서비스 실행 중? (Gateway 8088, Common 8701, Login 8801)

---

## 서비스 포트

| Service | Port | Service | Port |
|---------|------|---------|------|
| Gateway | 8088 | Login | 8801 |
| Common | 8701 | UI | 8100 |
| FD | 8601 | IL | 8401 |

---

## 관련 스킬
- `kiips-maven-builder`: Maven 빌드 전문
- `kiips-service-deployer`: 서비스 배포 전문
- `kiips-api-tester`: API 테스트
- `kiips-log-analyzer`: 로그 분석
- `kiips-startup`: Pre-flight 체크
