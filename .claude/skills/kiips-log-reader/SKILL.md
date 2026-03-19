---
name: kiips-log-reader
description: "KiiPS 구조화된 로그 조회/필터링 전용 스킬 - 시간/레벨/서비스별 로그 검색. Use when: 로그 보기, 로그 검색, 로그 필터, log search, log filter, 최근 로그"
user-invocable: false
---

# KiiPS Log Reader

KiiPS 서비스 로그를 구조화된 방식으로 조회하고 필터링하는 **읽기 전용** 스킬입니다.

## Purpose

### What This Skill Does
- **시간 범위 기반 필터링**: 특정 시간대 로그 검색
- **로그 레벨별 분류**: ERROR/WARN/INFO/DEBUG 레벨별 필터링
- **서비스별 로그 집계**: KiiPS 서비스별 로그 현황 조회
- **스택 트레이스 그루핑**: 동일 Exception 묶어서 표시
- **로그 패턴 통계**: Top-N 에러/경고 패턴 집계
- **구조화된 출력**: 테이블/JSON 형식 결과 반환

### What This Skill Does NOT Do
- 에러 원인 분석 또는 진단 (kiips-log-analyzer 사용)
- 로그 파일 생성/수정/삭제
- 서비스 제어 (kiips-service-deployer 사용)
- 실시간 모니터링 알림

### kiips-log-analyzer와의 차이

| 항목 | kiips-log-reader (이 스킬) | kiips-log-analyzer |
|------|---------------------------|-------------------|
| **목적** | 구조화된 로그 조회/필터링 | 에러 탐지, 문제 진단 |
| **출력** | 테이블/JSON 형식 데이터 | 분석 리포트, 진단 결과 |
| **트리거** | "로그 보기", "검색", "필터" | "에러", "분석", "디버그" |
| **위험도** | 최소 (읽기 전용) | 낮음 |
| **레이어** | Standalone Worker | Worker (deployment-manager) |

## When to Use

### User Prompt Keywords
```
"로그 보기", "로그 검색", "로그 필터", "로그 조회",
"최근 로그", "오늘 로그", "어제 로그",
"log search", "log filter", "show logs"
```

---

## Log Locations

```
KiiPS-{SERVICE}/logs/log.{YYYY-MM-DD}-{N}.log

서비스 목록:
├── KiiPS-FD/logs/         (펀드, Port:8601)
├── KiiPS-IL/logs/         (투자원장, Port:8401)
├── KiiPS-AC/logs/         (회계)
├── KiiPS-PG/logs/         (프로그램)
├── KiiPS-SY/logs/         (시스템)
├── KiiPS-LP/logs/         (LP관리)
├── KiiPS-EL/logs/         (전자원장)
├── KiiPS-COMMON/logs/     (공통, Port:8701)
├── KiiPS-LOGIN/logs/      (로그인, Port:8801)
├── KiiPS-UI/logs/         (UI, Port:8100)
└── KIIPS-APIGateway/logs/ (Gateway, Port:8088)
```

### Log Format

```
{YYYY-MM-DD HH:mm:ss.SSS} [{thread}] {LEVEL} {logger} - {message}
```

예시:
```
2026-03-13 10:15:23.456 [http-nio-8601-exec-1] INFO  c.l.k.fd.FD0101APIController - Fund list request
```

---

## Query Commands

### 1. 시간 범위 검색

```bash
# 특정 시간대 로그 (10시~11시)
awk '/^2026-03-13 10:/' KiiPS-FD/logs/log.2026-03-13-0.log

# 최근 30분 로그
awk -v start="$(date -v-30M '+%Y-%m-%d %H:%M')" '$0 >= start' \
    KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 특정 시각 이후 로그
sed -n '/^2026-03-13 14:30/,$p' KiiPS-FD/logs/log.2026-03-13-0.log
```

### 2. 레벨별 필터링

```bash
# ERROR만
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# WARN + ERROR
grep -E "(WARN|ERROR)" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# INFO 제외 (WARN, ERROR만)
grep -vE "^.{28}(INFO|DEBUG|TRACE)" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 레벨별 카운트
echo "=== Log Level Summary ==="
for level in ERROR WARN INFO DEBUG; do
    count=$(grep -c " $level " KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log 2>/dev/null || echo 0)
    echo "$level: $count"
done
```

### 3. 서비스별 로그 조회

```bash
# 전 서비스 ERROR 카운트
for svc in KiiPS-FD KiiPS-IL KiiPS-AC KiiPS-PG KiiPS-SY KiiPS-COMMON KiiPS-LOGIN; do
    logfile="$svc/logs/log.$(date '+%Y-%m-%d')-0.log"
    if [ -f "$logfile" ]; then
        count=$(grep -c "ERROR" "$logfile" 2>/dev/null || echo 0)
        echo "$svc: $count errors"
    fi
done
```

### 4. 스택 트레이스 그루핑

```bash
# Exception 유형별 그루핑
grep -oP '^\S+Exception' KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    sort | uniq -c | sort -rn

# 특정 Exception의 전체 스택 트레이스
grep -A 30 "NullPointerException" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | head -50
```

### 5. Top-N 에러 패턴

```bash
# 에러 메시지별 빈도 (Top 10)
grep "ERROR" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log | \
    sed -E 's/.*ERROR\s+\S+\s+-\s+//' | \
    sort | uniq -c | sort -rn | head -10
```

### 6. 키워드 검색

```bash
# 특정 사용자 활동 검색
grep "USER_ID=admin" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 특정 API 호출 검색
grep "/api/v1/fd/" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log

# 특정 펀드 코드 관련 로그
grep "FD001" KiiPS-FD/logs/log.$(date "+%Y-%m-%d")-0.log
```

---

## Output Formats

### 테이블 형식

```
Service        | Date       | ERROR | WARN  | INFO  | Total
───────────────┼────────────┼───────┼───────┼───────┼──────
KiiPS-FD       | 2026-03-13 |     2 |    15 |  1234 |  1251
KiiPS-IL       | 2026-03-13 |     0 |     8 |   987 |   995
KiiPS-COMMON   | 2026-03-13 |     1 |    12 |  2345 |  2358
```

### JSON 형식

```json
{
  "query": {
    "service": "KiiPS-FD",
    "date": "2026-03-13",
    "level": "ERROR",
    "timeRange": "10:00-11:00"
  },
  "results": [
    {
      "timestamp": "2026-03-13 10:15:23.456",
      "thread": "http-nio-8601-exec-1",
      "level": "ERROR",
      "logger": "c.l.k.fd.FD0101APIService",
      "message": "Fund not found: FD001",
      "stackTrace": "..."
    }
  ],
  "summary": {
    "totalMatches": 2,
    "uniquePatterns": 1
  }
}
```

---

## Constraints

### Read-Only Guarantee
- 로그 파일 읽기만 수행
- 파일 생성/수정/삭제 절대 금지
- 서비스 제어 기능 없음

### Performance Considerations
- 대용량 로그 파일 (100MB+) 시 `tail -n` 또는 `head -n` 제한
- `grep` 사용 시 `-m` 옵션으로 최대 매치 수 제한
- 전 서비스 동시 스캔 시 순차 처리 권장

---

## Integration

### With kiips-log-analyzer
- 이 스킬로 로그 데이터 수집 → kiips-log-analyzer로 분석 전달
- Read (이 스킬) → Analyze (kiips-log-analyzer) 파이프라인

### With Chain of Skills
- Build-Deploy-Verify 파이프라인의 배포 후 로그 수집 단계
- Incident Response 파이프라인의 Step 1 (로그 수집)

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
**Related**: kiips-log-analyzer, kiips-service-deployer, kiips-api-tester
