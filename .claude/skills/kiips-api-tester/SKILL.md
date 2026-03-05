---
name: KiiPS API Tester
description: |
  KiiPS API 테스트 전문 스킬.
  Use when: API 엔드포인트 테스트, 헬스 체크, 스모크 테스트
version: 1.0.0
priority: high
enforcement: suggest
category: testing
tags:
  - api
  - test
  - health
  - smoke
  - endpoint
author: KiiPS Development Team
lastUpdated: 2026-02-03
---

# KiiPS API Tester Skill

KiiPS API 테스트를 위한 전문 스킬입니다.

## Purpose

### What This Skill Does
- **헬스 체크**: Actuator 엔드포인트 확인
- **API 스모크 테스트**: 주요 엔드포인트 호출
- **인증 테스트**: JWT 토큰 검증
- **응답 검증**: 상태 코드, 응답 형식 확인

### What This Skill Does NOT Do
- 부하 테스트 (별도 도구 필요)
- 단위 테스트 (JUnit 사용)
- 로그 분석 (kiips-log-analyzer 사용)

## When to Use

### User Prompt Keywords
```
"API 테스트", "헬스 체크", "health check", "엔드포인트 확인",
"스모크 테스트", "smoke test", "API 호출", "응답 확인"
```

---

## API Architecture

### Service Endpoints

| 서비스 | Base URL | 헬스 체크 |
|--------|----------|-----------|
| Gateway | http://localhost:8088 | /actuator/health |
| Login | http://localhost:8801 | /actuator/health |
| Common | http://localhost:8701 | /actuator/health |
| FD | http://localhost:8601 | /actuator/health |
| IL | http://localhost:8401 | /actuator/health |
| PG | http://localhost:8301 | /actuator/health |

### API Gateway 라우팅

```
Gateway (8088) → /FD/**   → FD Service (8601)
               → /IL/**   → IL Service (8401)
               → /PG/**   → PG Service (8301)
               → /LOGIN/* → Login Service (8801)
```

---

## Health Check Commands

### 1. 단일 서비스 헬스 체크

```bash
# Spring Boot Actuator
curl -s http://localhost:8601/actuator/health | jq

# 기대 결과:
# {
#   "status": "UP",
#   "components": {
#     "db": { "status": "UP" },
#     "diskSpace": { "status": "UP" }
#   }
# }
```

### 2. 전체 서비스 헬스 체크

```bash
#!/bin/bash
SERVICES=(
    "Gateway:8088"
    "Login:8801"
    "Common:8701"
    "FD:8601"
    "IL:8401"
    "PG:8301"
)

for SERVICE in "${SERVICES[@]}"; do
    NAME=$(echo $SERVICE | cut -d: -f1)
    PORT=$(echo $SERVICE | cut -d: -f2)

    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/actuator/health)

    if [ "$STATUS" = "200" ]; then
        echo "✅ $NAME ($PORT): UP"
    else
        echo "❌ $NAME ($PORT): DOWN (HTTP $STATUS)"
    fi
done
```

### 3. 상세 헬스 정보

```bash
# 상세 정보 포함
curl -s http://localhost:8601/actuator/health | jq '.components'

# 메트릭 확인
curl -s http://localhost:8601/actuator/metrics | jq '.names'
```

---

## API Smoke Tests

### 1. 인증 테스트

```bash
# 로그인 API
curl -X POST http://localhost:8801/api/login \
    -H "Content-Type: application/json" \
    -d '{"userId": "admin", "password": "password"}'

# 기대 결과: JWT 토큰 반환
```

### 2. 인증된 API 호출

```bash
# JWT 토큰 사용
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl http://localhost:8601/FDAPI/FD0101/LIST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
```

### 3. Gateway 경유 호출

```bash
# Gateway를 통한 API 호출
curl http://localhost:8088/FD/FDAPI/FD0101/LIST \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json"
```

---

## Response Validation

### 1. 상태 코드 확인

```bash
# HTTP 상태 코드만 확인
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8601/actuator/health)

if [ "$HTTP_CODE" = "200" ]; then
    echo "SUCCESS: HTTP 200"
elif [ "$HTTP_CODE" = "503" ]; then
    echo "ERROR: Service Unavailable"
else
    echo "ERROR: HTTP $HTTP_CODE"
fi
```

### 2. 응답 형식 검증

```bash
# JSON 응답 검증
curl -s http://localhost:8601/FDAPI/FD0101/LIST | jq -e '.body.list' > /dev/null

if [ $? -eq 0 ]; then
    echo "SUCCESS: Valid response format"
else
    echo "ERROR: Invalid response format"
fi
```

### 3. 응답 시간 측정

```bash
# 응답 시간 확인
curl -s -w "\n%{time_total}s\n" http://localhost:8601/actuator/health

# 성능 임계값 (1초 이내)
TIME=$(curl -s -o /dev/null -w "%{time_total}" http://localhost:8601/actuator/health)
if (( $(echo "$TIME < 1" | bc -l) )); then
    echo "PASS: Response time ${TIME}s"
else
    echo "WARN: Slow response ${TIME}s"
fi
```

---

## Test Scenarios

### Scenario 1: 배포 후 검증

```bash
#!/bin/bash
SERVICE_PORT=8601
MAX_RETRIES=6
RETRY_INTERVAL=10

echo "=== Post-Deployment API Test ==="

# 헬스 체크 (재시도 포함)
for i in $(seq 1 $MAX_RETRIES); do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$SERVICE_PORT/actuator/health)

    if [ "$STATUS" = "200" ]; then
        echo "✅ Health check passed"
        break
    fi

    echo "⏳ Waiting for service... ($i/$MAX_RETRIES)"
    sleep $RETRY_INTERVAL
done

# API 스모크 테스트
echo "Running smoke tests..."
curl -s http://localhost:$SERVICE_PORT/actuator/info | jq

echo "=== Test Complete ==="
```

### Scenario 2: 전체 시스템 검증

```bash
#!/bin/bash
echo "=== Full System Test ==="

# 1. Gateway 확인
echo "1. Gateway Health..."
curl -s http://localhost:8088/actuator/health | jq '.status'

# 2. 인증 테스트
echo "2. Login Test..."
TOKEN=$(curl -s -X POST http://localhost:8801/api/login \
    -H "Content-Type: application/json" \
    -d '{"userId":"test","password":"test"}' | jq -r '.token')

if [ -n "$TOKEN" ] && [ "$TOKEN" != "null" ]; then
    echo "✅ Login successful"
else
    echo "❌ Login failed"
    exit 1
fi

# 3. API 호출 테스트
echo "3. API Call Test..."
RESPONSE=$(curl -s http://localhost:8088/FD/FDAPI/FD0101/LIST \
    -H "Authorization: Bearer $TOKEN")

if echo "$RESPONSE" | jq -e '.body' > /dev/null; then
    echo "✅ API call successful"
else
    echo "❌ API call failed"
fi

echo "=== All Tests Complete ==="
```

---

## Troubleshooting

### Error 1: Connection refused

**원인**: 서비스가 실행되지 않음

**해결**:
```bash
# 서비스 상태 확인
ps aux | grep KiiPS

# 서비스 시작
cd KiiPS-FD && ./start.sh
```

### Error 2: 401 Unauthorized

**원인**: 토큰 만료 또는 무효

**해결**:
```bash
# 새 토큰 발급
TOKEN=$(curl -s -X POST http://localhost:8801/api/login \
    -d '{"userId":"admin","password":"password"}' | jq -r '.token')
```

### Error 3: 503 Service Unavailable

**원인**: 서비스 시작 중 또는 의존성 문제

**해결**:
```bash
# 로그 확인
tail -f KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# DB 연결 확인
curl -s http://localhost:8601/actuator/health | jq '.components.db'
```

---

## Best Practices

### Do's
- 배포 후 항상 헬스 체크 실행
- 재시도 로직 포함 (서비스 시작 시간 고려)
- 응답 형식과 상태 코드 모두 검증
- 타임아웃 설정

### Don'ts
- 프로덕션 데이터 수정하는 API 테스트 ❌
- 민감한 정보 로그 출력 ❌
- 무한 재시도 ❌

---

## Integration

### With Deployment Manager Agent
배포 파이프라인의 Stage 4 (Health Check)에서 사용:
- Deployment Manager가 배포 완료 후 요청
- 이 스킬이 헬스 체크 및 API 테스트 수행

### With kiips-log-analyzer
API 테스트 실패 시:
- 이 스킬이 실패 보고
- `kiips-log-analyzer`가 로그 분석

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Related**: deployment-manager, kiips-service-deployer, kiips-log-analyzer
