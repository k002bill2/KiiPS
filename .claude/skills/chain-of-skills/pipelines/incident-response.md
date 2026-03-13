# Pipeline: Incident Response

> 장애 발생 시 로그 수집부터 수정까지의 대응 파이프라인

---

## Trigger

```
"에러 분석해줘"
"장애 대응"
"(에러|error|장애|incident).*(분석|analyze|조사|investigate)"
```

## Steps

### Step 1: Collect (Parallel)

**Manager**: deployment-manager

```
1. kiips-log-reader:
   - 최근 로그 수집 (ERROR/WARN)
   - 시간대별 에러 분포
   - 결과: ERROR_LOGS { entries: object[], patterns: object[] }

2. kiips-db-inspector:
   - 관련 테이블 구조 확인 (mapper 기반)
   - 결과: DB_STATUS { tables: string[], mappings: object[] }
```

### Step 2: Analyze

**Skills**: kiips-log-analyzer

```
1. kiips-log-analyzer:
   - 에러 원인 분석
   - 스택 트레이스 분석
   - 결과: ROOT_CAUSE { cause: string, severity: string, requiresFix: boolean }
```

**Gate**: ROOT_CAUSE 식별 완료

### Step 3: Verify

**Skills**: kiips-api-tester

```
1. kiips-api-tester:
   - 영향 받는 API 엔드포인트 테스트
   - 정상 동작 vs 오류 구분
   - 결과: API_STATUS { affected: string[], healthy: string[] }
```

### Step 4: Fix (Conditional)

**Condition**: ROOT_CAUSE.requiresFix === true
**Manager**: feature-manager

```
1. kiips-developer:
   - 수정 코드 작성
   - 결과: FIX { files: string[], changes: object[] }

2. kiips-test-runner:
   - 회귀 테스트 실행
   - 결과: REGRESSION { passed: boolean }
```

**Gate**: REGRESSION.passed === true

---

## Decision Tree

```
에러 발생
  ├─ 로그 수집 + DB 구조 확인
  ├─ 원인 분석
  │   ├─ 코드 버그 -> Step 4 (Fix)
  │   ├─ 설정 오류 -> 설정 수정 안내
  │   ├─ 외부 의존성 -> 모니터링 + 대기
  │   └─ 데이터 이슈 -> DBA 에스컬레이션
  └─ API 검증
      ├─ 정상 -> 모니터링 유지
      └─ 비정상 -> 롤백 또는 Fix
```

---

## Escalation Rules

| Severity | Response Time | Escalation |
|----------|--------------|------------|
| Critical | 즉시 | 사용자 알림 + 롤백 제안 |
| High | 5분 내 | 수정 파이프라인 자동 실행 |
| Medium | 15분 내 | 분석 리포트 제공 |
| Low | 다음 세션 | 로그에 기록 |

---

**Version**: 1.0.0
