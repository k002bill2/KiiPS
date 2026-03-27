---
name: kiips-logs
description: "KiiPS 로그 조회/분석 통합 스킬. 로그 검색, 에러 탐지, 실시간 모니터링. Use when: 로그, log, error, 에러, exception, 분석, 로그 보기, 로그 검색"
disable-model-invocation: true
---

# KiiPS Logs (통합)

> kiips-log-analyzer + kiips-log-reader 통합

---

## Quick Reference

```bash
# 최근 로그 (서비스 디렉토리에서)
tail -100 logs/log.$(date "+%Y-%m-%d")-0.log

# 에러만 필터링
grep -E "ERROR|WARN" logs/log.$(date "+%Y-%m-%d")-0.log

# 실시간 모니터링
tail -f logs/log.$(date "+%Y-%m-%d")-0.log | grep --line-buffered -E "ERROR|Exception"

# 특정 시간대
grep "2026-03-27 14:" logs/log.$(date "+%Y-%m-%d")-0.log
```

---

## 로그 파일 위치

```
KiiPS-{SERVICE}/logs/log.YYYY-MM-DD-{N}.log
```

| 서비스 | 디렉토리 |
|--------|----------|
| FD | KiiPS-FD/logs/ |
| IL | KiiPS-IL/logs/ |
| Common | KiiPS-COMMON-SERVICE/logs/ |
| UI | KiiPS-UI/logs/ |
| Gateway | KiiPS-APIGateway/logs/ |

---

## 에러 분석 프로토콜

1. **에러 식별**: `grep -c ERROR` 로 에러 수 확인
2. **패턴 분류**: 스택 트레이스에서 root cause 추출
3. **시간대 분석**: 에러 발생 시점 확인
4. **연관 분석**: 동일 시간대 다른 서비스 로그 교차 확인

---

## 주요 에러 패턴

| 패턴 | 의미 | 조치 |
|------|------|------|
| `NullPointerException` | null 참조 | 스택 트레이스에서 라인 확인 |
| `ConnectionException` | DB 연결 실패 | DB 상태, 설정 확인 |
| `TimeoutException` | 응답 지연 | 네트워크, 쿼리 성능 확인 |
| `OutOfMemoryError` | 메모리 부족 | JVM 힙 설정 확인 |

---

**Merged from**: kiips-log-analyzer, kiips-log-reader
**Version**: 2.0.0
