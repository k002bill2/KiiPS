---
name: kiips-log-analyzer
description: "KiiPS 로그 분석 전문 스킬. 로그 분석, 에러 탐지, 문제 진단, 모니터링"
disable-model-invocation: true
---

# KiiPS Log Analyzer Skill

KiiPS 서비스 로그 분석을 위한 전문 스킬입니다.

## Purpose

### What This Skill Does
- **에러 탐지**: ERROR, Exception 패턴 검색
- **로그 분석**: 시작 메시지, 경고, 스택 트레이스 분석
- **문제 진단**: 일반적인 에러 원인 파악
- **모니터링**: 실시간 로그 감시

### What This Skill Does NOT Do
- 로그 파일 생성/삭제
- 서비스 제어 (kiips-service-deployer 사용)
- 성능 분석 (별도 도구 필요)

## When to Use

### User Prompt Keywords
```
"로그", "log", "에러", "error", "예외", "exception",
"디버그", "debug", "문제", "오류", "분석"
```

---

## Log Architecture

### Log File Locations

```
KiiPS-{SERVICE}/
└── logs/
    ├── log.2026-02-03-0.log    # 오늘 로그 (첫 번째 파일)
    ├── log.2026-02-03-1.log    # 오늘 로그 (두 번째 파일, 롤오버)
    ├── log.2026-02-02-0.log    # 어제 로그
    └── ...
```

### Log File Naming Convention

```
log.{YYYY-MM-DD}-{N}.log

YYYY-MM-DD: 날짜
N: 파일 번호 (0부터 시작, 롤오버 시 증가)
```

### Log Format

```
2026-02-03 10:15:23.456 [main] INFO  c.l.k.Application - Starting Application...
{timestamp} [{thread}] {level} {logger} - {message}
```

**Log Levels**: TRACE < DEBUG < INFO < WARN < ERROR

---

## Log Analysis Commands

### 1. 오늘 로그 보기

```bash
# 최신 로그 파일
tail -f KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 마지막 100줄
tail -100 KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log
```

### 2. 에러 검색

```bash
# ERROR 레벨만 검색
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# ERROR 또는 Exception
grep -E "ERROR|Exception" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 에러 수 카운트
grep -c "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log
```

### 3. 시작 메시지 확인

```bash
# 서비스 시작 확인
grep "Started.*Application" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 시작 시간 확인
grep -E "Started|Starting" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | tail -5
```

### 4. 경고 메시지 확인

```bash
# WARN 레벨 검색
grep "WARN" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 최근 경고만
grep "WARN" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | tail -20
```

### 5. 스택 트레이스 추출

```bash
# Exception 이후 스택 트레이스 포함
grep -A 30 "Exception" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | head -50
```

---

## Common Error Patterns

### Error 1: Database Connection Failed

```
ERROR o.s.b.SpringApplication - Application run failed
Caused by: java.sql.SQLException: Cannot create PoolableConnectionFactory
```

**원인**: DB 서버 접속 불가

**확인**:
```bash
# DB 연결 테스트
ping db-server-ip
telnet db-server-ip 3306
```

**해결**:
- DB 서버 상태 확인
- 네트워크 연결 확인
- DB 계정/비밀번호 확인

### Error 2: OutOfMemoryError

```
ERROR java.lang.OutOfMemoryError: Java heap space
```

**원인**: JVM 메모리 부족

**확인**:
```bash
# 현재 메모리 사용량
ps aux | grep KiiPS-FD | awk '{print $6/1024 " MB"}'
```

**해결**:
```bash
# start.sh에서 힙 사이즈 증가
# -Xmx512m → -Xmx1g
```

### Error 3: Port Already in Use

```
ERROR o.s.b.d.LoggingFailureAnalysisReporter -
Web server failed to start. Port 8601 was already in use.
```

**원인**: 포트 충돌

**해결**:
```bash
# 포트 사용 프로세스 확인
lsof -i :8601

# 기존 프로세스 종료
kill -9 <PID>
```

### Error 4: Bean Creation Exception

```
ERROR o.s.b.SpringApplication - Application run failed
Caused by: org.springframework.beans.factory.BeanCreationException
```

**원인**: Spring Bean 초기화 실패

**확인**:
```bash
# 상세 스택 트레이스 확인
grep -A 50 "BeanCreationException" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log
```

**해결**:
- 의존성 주입 확인
- 설정 파일 확인
- 누락된 Bean 확인

### Error 5: JWT Authentication Error

```
ERROR c.l.k.s.JwtAuthenticationFilter - JWT token validation failed
```

**원인**: 토큰 만료 또는 무효

**해결**:
- 토큰 재발급
- 토큰 서명 키 확인

---

## Log Analysis Scripts

### 1. 배포 후 로그 검증

```bash
#!/bin/bash
SERVICE="KiiPS-FD"
LOG_FILE="$SERVICE/logs/log.$(date '+%Y-%m-%d')-0.log"

echo "=== Log Analysis: $SERVICE ==="

# 시작 확인
if grep -q "Started.*Application" "$LOG_FILE"; then
    echo "✅ Service started successfully"
else
    echo "❌ Service start message not found"
fi

# 에러 카운트
ERROR_COUNT=$(grep -c "ERROR" "$LOG_FILE" 2>/dev/null || echo "0")
if [ "$ERROR_COUNT" -eq "0" ]; then
    echo "✅ No errors found"
else
    echo "⚠️  Found $ERROR_COUNT errors"
    grep "ERROR" "$LOG_FILE" | tail -5
fi

# 경고 카운트
WARN_COUNT=$(grep -c "WARN" "$LOG_FILE" 2>/dev/null || echo "0")
echo "ℹ️  Warnings: $WARN_COUNT"

echo "=== Analysis Complete ==="
```

### 2. 에러 요약 리포트

```bash
#!/bin/bash
SERVICE="KiiPS-FD"
LOG_FILE="$SERVICE/logs/log.$(date '+%Y-%m-%d')-0.log"

echo "=== Error Summary Report ==="
echo "Service: $SERVICE"
echo "Date: $(date '+%Y-%m-%d')"
echo ""

# 에러 유형별 분류
echo "--- Error Types ---"
grep "ERROR" "$LOG_FILE" | \
    sed -E 's/.*ERROR\s+([^ ]+).*/\1/' | \
    sort | uniq -c | sort -rn | head -10

echo ""
echo "--- Recent Errors (Last 5) ---"
grep "ERROR" "$LOG_FILE" | tail -5

echo ""
echo "=== Report End ==="
```

### 3. 실시간 에러 모니터링

```bash
#!/bin/bash
SERVICE="KiiPS-FD"
LOG_FILE="$SERVICE/logs/log.$(date '+%Y-%m-%d')-0.log"

echo "Monitoring $LOG_FILE for errors..."
echo "Press Ctrl+C to stop"

tail -f "$LOG_FILE" | grep --line-buffered -E "ERROR|Exception|WARN"
```

---

## Log Analysis Checklist

### 배포 후 검증

- [ ] 서비스 시작 메시지 확인 ("Started.*Application")
- [ ] ERROR 레벨 로그 없음 (또는 허용 범위 내)
- [ ] WARN 레벨 로그 3개 이하
- [ ] DB 연결 성공 메시지 확인
- [ ] OutOfMemoryError 없음
- [ ] Exception 스택 트레이스 없음

### 문제 진단 시

- [ ] 에러 발생 시간 확인
- [ ] 에러 메시지 전체 확인
- [ ] 스택 트레이스 분석
- [ ] 관련 WARN 메시지 확인
- [ ] 이전 로그와 비교

---

## Best Practices

### Do's
- 배포 후 항상 로그 확인
- 에러 발생 시 스택 트레이스 전체 분석
- 로그 레벨별 필터링 활용
- 시간대별 패턴 분석

### Don'ts
- 로그 파일 직접 수정/삭제 ❌
- 민감한 정보 로그에서 외부 노출 ❌
- 에러 무시하고 진행 ❌

---

## Integration

### With Deployment Manager Agent
배포 파이프라인의 Stage 5 (Log Verification)에서 사용:
- Deployment Manager가 서비스 시작 후 요청
- 이 스킬이 로그 분석 수행

### With kiips-api-tester
API 테스트 실패 시:
- `kiips-api-tester`가 실패 보고
- 이 스킬이 관련 로그 분석

---

**Version**: 1.0.0
**Last Updated**: 2026-02-03
**Related**: deployment-manager, kiips-service-deployer, kiips-api-tester
