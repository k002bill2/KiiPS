# KiiPS Log Reader — Reference

> 로그 조회/필터링 상세 가이드

---

## Quick Reference — 자주 사용하는 명령어

### 오늘 로그 빠른 확인

```bash
# 서비스 오늘 로그 경로
LOG=$(ls -t KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-*.log 2>/dev/null | head -1)

# 마지막 50줄
tail -50 "$LOG"

# ERROR 확인
grep "ERROR" "$LOG" | tail -10

# 실시간 추적
tail -f "$LOG"
```

### 날짜별 로그 파일 찾기

```bash
# 어제 로그
ls KiiPS-FD/logs/log.$(date -v-1d "+%Y-%m-%d")-*.log

# 특정 날짜 로그
ls KiiPS-FD/logs/log.2026-03-10-*.log

# 최근 7일 로그
ls -la KiiPS-FD/logs/log.2026-03-{07..13}-*.log 2>/dev/null
```

---

## 고급 필터링

### 복합 조건 검색

```bash
# ERROR + 특정 시간대 + 특정 클래스
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    grep "10:1[0-9]:" | \
    grep "FD0101"

# WARN 이상 + 특정 스레드
grep -E "(WARN|ERROR)" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    grep "http-nio-8601-exec"
```

### 로그 롤오버 대응

KiiPS 로그는 파일 크기 또는 날짜 기준으로 롤오버됩니다:

```bash
# 같은 날짜의 모든 로그 파일에서 검색
cat KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-*.log | grep "ERROR"

# 파일 번호순 정렬 검색
for f in $(ls KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-*.log | sort -t- -k4 -n); do
    echo "=== $f ==="
    grep -c "ERROR" "$f"
done
```

### 시간대별 로그 분포

```bash
# 시간대별 ERROR 분포
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    grep -oP '^\d{4}-\d{2}-\d{2} \d{2}' | \
    sort | uniq -c

# 분 단위 분포 (특정 시간)
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    grep "^$(date '+%Y-%m-%d') 10:" | \
    grep -oP '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' | \
    sort | uniq -c
```

---

## 전 서비스 일괄 조회 스크립트

### 헬스 대시보드

```bash
#!/bin/bash
DATE=$(date "+%Y-%m-%d")
echo "╔═══════════════════════════════════════════════╗"
echo "║  KiiPS Log Dashboard - $DATE            ║"
echo "╠════════════════╦═══════╦═══════╦═════════════╣"
echo "║ Service        ║ ERROR ║ WARN  ║ Last Entry  ║"
echo "╠════════════════╬═══════╬═══════╬═════════════╣"

for svc in KiiPS-FD KiiPS-IL KiiPS-AC KiiPS-PG KiiPS-SY KiiPS-COMMON KiiPS-LOGIN KiiPS-UI KIIPS-APIGateway; do
    logfile="$svc/logs/log.$DATE-0.log"
    if [ -f "$logfile" ]; then
        errors=$(grep -c "ERROR" "$logfile" 2>/dev/null || echo 0)
        warns=$(grep -c "WARN" "$logfile" 2>/dev/null || echo 0)
        last=$(tail -1 "$logfile" | grep -oP '^\d{4}-\d{2}-\d{2} \d{2}:\d{2}' || echo "N/A")
        printf "║ %-14s ║ %5s ║ %5s ║ %-11s ║\n" "$svc" "$errors" "$warns" "$last"
    else
        printf "║ %-14s ║   N/A ║   N/A ║ No log file ║\n" "$svc"
    fi
done

echo "╚════════════════╩═══════╩═══════╩═════════════╝"
```

### 크로스-서비스 에러 추적

```bash
# 동일 시간대 전 서비스 에러 (연쇄 장애 탐지)
TIMESTAMP="2026-03-13 10:15"
for svc in KiiPS-FD KiiPS-IL KiiPS-COMMON KIIPS-APIGateway; do
    logfile="$svc/logs/log.$(date '+%Y-%m-%d')-0.log"
    if [ -f "$logfile" ]; then
        matches=$(grep "$TIMESTAMP" "$logfile" | grep "ERROR" | wc -l)
        if [ "$matches" -gt 0 ]; then
            echo "=== $svc ($matches errors at $TIMESTAMP) ==="
            grep "$TIMESTAMP" "$logfile" | grep "ERROR"
        fi
    fi
done
```

---

## 스택 트레이스 처리

### 전체 스택 트레이스 추출

```bash
# Exception 발생 위치 + 30줄 스택 트레이스
grep -A 30 "Exception" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    head -50

# 첫 번째 at 라인만 (발생 위치)
grep -A 1 "Exception" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    grep "at kr.co.logossystem"
```

### Exception 유형 분류

```bash
# Unique Exception 유형
grep -oP '\w+Exception' KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    sort -u

# Exception 유형별 빈도
grep -oP '\w+Exception' KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    sort | uniq -c | sort -rn
```

---

## KiiPS 로그 패턴 가이드

### 서비스 시작 패턴

```
Started Application in X.XXX seconds (JVM running for X.XXX)
```

### API 호출 패턴

```
[http-nio-{port}-exec-{n}] INFO ... - /api/v1/{domain}/{action}
```

### DB 관련 패턴

```
ERROR ... - SqlSession ... threw exception
ERROR ... - Cannot create PoolableConnectionFactory
```

### JWT 패턴

```
ERROR ... - JWT token validation failed
WARN  ... - JWT token expired
```

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
