---
name: KiiPS Service Deployer
description: |
  KiiPS 서비스 배포 전문 스킬.
  Use when: 서비스 시작, 중지, 재시작, 배포 관련 작업
version: 1.0.0
priority: high
enforcement: require
category: deployment
tags:
  - deploy
  - start
  - stop
  - restart
  - service
author: KiiPS Development Team
lastUpdated: 2026-02-03
---

# KiiPS Service Deployer Skill

KiiPS 마이크로서비스 배포를 위한 전문 스킬입니다.

## Purpose

### What This Skill Does
- **서비스 시작/중지**: start.sh, stop.sh 스크립트 실행
- **배포 파이프라인**: 빌드 → 중지 → 시작 → 검증
- **롤백 지원**: 이전 버전 복원
- **헬스 체크**: 서비스 상태 확인

### What This Skill Does NOT Do
- Maven 빌드 (kiips-maven-builder 사용)
- API 테스트 (kiips-api-tester 사용)
- 로그 분석 (kiips-log-analyzer 사용)

## When to Use

### User Prompt Keywords
```
"배포", "deploy", "시작", "start", "중지", "stop",
"재시작", "restart", "서비스", "service"
```

---

## Service Architecture

### Service Locations

```
KiiPS/
├── KiiPS-FD/          # 펀드 서비스 (8601)
│   ├── start.sh
│   ├── stop.sh
│   └── logs/
├── KiiPS-IL/          # 투자 서비스 (8401)
├── KiiPS-PG/          # 포트폴리오 서비스 (8301)
├── KiiPS-LOGIN/       # 로그인 서비스 (8801)
├── KiiPS-COMMON-SERVICE/  # 공통 서비스 (8701)
├── KiiPS-UI/          # UI 서비스 (8100)
└── KiiPS-APIGateway/  # API Gateway (8088)
```

### Service Ports

| 서비스 | 포트 | 헬스 체크 URL |
|--------|------|---------------|
| Gateway | 8088 | /actuator/health |
| Login | 8801 | /actuator/health |
| Common | 8701 | /actuator/health |
| UI | 8100 | / |
| FD | 8601 | /actuator/health |
| IL | 8401 | /actuator/health |
| PG | 8301 | /actuator/health |

---

## Deployment Commands

### 1. 서비스 시작

```bash
# 서비스 디렉토리로 이동 후 시작
cd KiiPS-FD && ./start.sh

# 로그 확인
tail -f logs/log.$(date "+%Y-%m-%d")-0.log
```

### 2. 서비스 중지

```bash
cd KiiPS-FD && ./stop.sh
```

### 3. 서비스 재시작

```bash
cd KiiPS-FD && ./stop.sh && ./start.sh
```

### 4. 헬스 체크

```bash
# Spring Boot Actuator
curl -s http://localhost:8601/actuator/health

# 기대 결과: {"status":"UP"}
```

### 5. 프로세스 확인

```bash
# PID 확인
ps aux | grep KiiPS-FD

# 포트 확인
lsof -i :8601
```

---

## Deployment Pipeline

### 표준 6단계 파이프라인

```
Stage 1: Pre-Deployment Check
   ↓ [빌드 결과물 확인, 설정 검증]
Stage 2: Service Stop
   ↓ [./stop.sh 실행]
Stage 3: Service Start
   ↓ [./start.sh 실행]
Stage 4: Health Check
   ↓ [/actuator/health 호출]
Stage 5: Log Verification
   ↓ [에러 로그 확인]
Stage 6: Post-Deployment Check
   ↓ [최종 검증]
```

### 배포 스크립트 예시

```bash
#!/bin/bash
SERVICE_DIR="KiiPS-FD"
PORT=8601

echo "=== Deploying $SERVICE_DIR ==="

# Stage 1: Pre-check
if [ ! -f "$SERVICE_DIR/target/*.jar" ]; then
    echo "ERROR: Build artifact not found"
    exit 1
fi

# Stage 2: Stop
cd $SERVICE_DIR && ./stop.sh
sleep 5

# Stage 3: Start
./start.sh
sleep 10

# Stage 4: Health Check
for i in {1..6}; do
    HEALTH=$(curl -s http://localhost:$PORT/actuator/health | jq -r '.status')
    if [ "$HEALTH" = "UP" ]; then
        echo "Service is UP"
        break
    fi
    echo "Waiting for service... ($i/6)"
    sleep 10
done

# Stage 5: Log Verification
ERROR_COUNT=$(grep -c "ERROR" logs/log.$(date "+%Y-%m-%d")-0.log 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -gt 0 ]; then
    echo "WARNING: $ERROR_COUNT errors in log"
fi

echo "=== Deployment Complete ==="
```

---

## Troubleshooting

### Error 1: "Address already in use"

**원인**: 이전 프로세스가 종료되지 않음

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :8601

# 강제 종료
kill -9 <PID>

# 재시작
./start.sh
```

### Error 2: Service doesn't start

**원인**: Java 설정 또는 의존성 문제

**해결**:
```bash
# 로그 확인
tail -100 logs/log.$(date "+%Y-%m-%d")-0.log | grep -E "ERROR|Exception"

# 일반적인 원인:
# - DB 연결 실패
# - 설정 파일 누락
# - 메모리 부족
```

### Error 3: Health check timeout

**원인**: 서비스 시작 중

**해결**:
```bash
# 더 오래 대기 (최대 120초)
for i in {1..12}; do
    curl -s http://localhost:8601/actuator/health
    sleep 10
done
```

---

## Rollback Procedure

### 1. 현재 버전 백업

```bash
# 배포 전 백업
cp KiiPS-FD/target/KiiPS-FD-1.0.jar KiiPS-FD/backup/KiiPS-FD-1.0.jar.$(date +%Y%m%d_%H%M%S)
```

### 2. 롤백 실행

```bash
# 서비스 중지
cd KiiPS-FD && ./stop.sh

# 이전 버전 복원
cp backup/KiiPS-FD-1.0.jar.20260203_100000 target/KiiPS-FD-1.0.jar

# 서비스 시작
./start.sh
```

---

## Best Practices

### Do's
- 배포 전 빌드 결과물 확인
- 서비스 중지 후 충분히 대기 (5-10초)
- 헬스 체크로 서비스 상태 확인
- 로그에서 에러 확인
- 롤백 계획 준비

### Don'ts
- 빌드 없이 배포 시도 ❌
- 헬스 체크 없이 배포 완료 선언 ❌
- 강제 종료(kill -9) 남용 ❌
- 멀티 서비스 동시 재시작 (순차적으로!) ❌

---

## Integration

### With Deployment Manager Agent
이 스킬은 `deployment-manager` 에이전트와 연동됩니다:
- Deployment Manager가 파이프라인 조율
- 이 스킬이 실제 배포 명령 실행

### With Build Manager Agent
배포 전 빌드 필요 시:
1. `build-manager`가 빌드 수행
2. 빌드 성공 후 `deployment-manager`가 배포 진행

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Related**: deployment-manager, kiips-maven-builder, kiips-api-tester
