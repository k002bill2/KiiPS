# Pipeline: Build-Deploy-Verify

> 빌드부터 배포 후 검증까지의 전체 자동화 파이프라인

---

## Trigger

```
"빌드하고 배포해줘"
"build and deploy"
"(빌드|build).*(배포|deploy)"
```

## Stages

### Stage 1: Build

**Manager**: build-manager
**Skills**: kiips-maven-builder, kiips-test-runner

```
1. kiips-maven-builder:
   - cd KiiPS-HUB && mvn clean package -pl :{target} -am
   - 결과: BUILD_RESULT { success: boolean, artifacts: string[] }

2. kiips-test-runner (parallel):
   - mvn test -pl :{target}
   - 결과: TEST_RESULT { passed: number, failed: number, skipped: number }
```

**Gate**: BUILD_RESULT.success AND TEST_RESULT.failed === 0

### Stage 2: Deploy

**Manager**: deployment-manager
**Skills**: kiips-service-deployer

```
1. kiips-service-deployer:
   - ./stop.sh (if running)
   - ./start.sh
   - 결과: DEPLOY_RESULT { status: "running", port: number, pid: number }
```

**Gate**: DEPLOY_RESULT.status === "running"

### Stage 3: Verify

**Manager**: deployment-manager
**Skills**: kiips-log-reader, kiips-api-tester

```
1. kiips-log-reader (parallel):
   - ERROR 카운트 확인
   - 시작 메시지 확인
   - 결과: LOG_RESULT { errors: number, started: boolean }

2. kiips-api-tester (parallel):
   - Health check: GET /actuator/health
   - API 기본 테스트
   - 결과: API_RESULT { healthy: boolean, responseTime: number }
```

**Gate**: LOG_RESULT.errors === 0 AND API_RESULT.healthy

### Stage 4: Report

**Skills**: checklist-generator

```
1. checklist-generator:
   - 종합 결과 리포트 생성
   - 결과: FINAL_REPORT
```

---

## Rollback Conditions

| Condition | Action |
|-----------|--------|
| Build 실패 | 중단, 빌드 에러 리포트 |
| Test 실패 | 중단, 실패 테스트 목록 |
| Deploy 실패 | 이전 버전 복원 (stop + 이전 JAR 재시작) |
| Verify 실패 | 서비스 중지, 로그 분석 결과 제공 |

---

**Version**: 1.0.0
