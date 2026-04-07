---
description: Periodic garbage collection - scan and report code hygiene issues
---

# 주기적 코드 청소 (/periodic-cleanup)

하네스 엔지니어링 "가비지 컬렉션" 기둥 구현.
코드베이스의 위생 상태를 점검하고 정리 대상을 보고합니다.

## 사용법

```
/periodic-cleanup              # 전체 GC 스캔
/periodic-cleanup quick        # 빠른 스캔 (미사용 import + 빈 catch만)
/periodic-cleanup instincts    # Instinct 수명 관리만
/periodic-cleanup rules        # /check-rules 실행
```

## GC 스캔 항목

### Phase 1: 코드 위생 (Code Hygiene)

#### 1-1. 미사용 Import 검출 (Java)
```bash
# 사용되지 않는 import 문 탐지
grep -rn '^import ' --include='*.java' KiiPS-*/src/main/java/ | head -100
```
각 import에 대해 해당 클래스명이 파일 내에서 실제 사용되는지 Grep으로 확인.
- 심각도: 💡 Info
- 자동 수정: 가능 (사용자 확인 후)

#### 1-2. 빈 catch 블록 (Java)
```bash
# catch 블록이 비어있거나 주석만 있는 패턴
grep -rn -A 2 'catch\s*(' --include='*.java' KiiPS-*/src/ | grep -B 1 '^\s*}\s*$'
```
- 심각도: ⚠️ Warning
- 규칙: 최소 로깅 필수

#### 1-3. TODO/FIXME 방치 (30일 이상)
```bash
# TODO, FIXME, HACK, XXX 주석 검출
grep -rn 'TODO\|FIXME\|HACK\|XXX' --include='*.java' --include='*.jsp' --include='*.js' KiiPS-*/src/
```
- SVN blame으로 작성 일자 확인하여 30일 이상 방치된 항목 보고
- 심각도: 💡 Info

#### 1-4. 중복 코드 패턴
```bash
# 동일 메서드 시그니처가 여러 Service에 존재하는지 확인
grep -rn 'public.*Map.*select\|public.*List.*select\|public.*int.*insert\|public.*int.*update\|public.*int.*delete' --include='*Service.java' KiiPS-*/src/
```
- 심각도: 💡 Info (KiiPS-COMMON 이관 후보)

### Phase 2: 규칙 위반 스캔

`/check-rules` 커맨드를 실행합니다.
- MyBatis `${}` 사용
- 다크테마 셀렉터 위반
- Controller 입력 검증 누락
- 하드코딩된 비밀
- 보호 모듈 변경

### Phase 3: Instinct 수명 관리

#### 3-1. 저신뢰 Instinct 식별
```bash
# confidence < 0.3인 instinct 파일 검출
grep -l 'confidence:.*0\.[0-2]' .claude/learning/instincts/personal/*.md
```

#### 3-2. 장기 미사용 Instinct
- `updated` 필드가 30일 이상 이전인 instinct 검출
- 후보: 아카이빙 (.claude/learning/instincts/archived/)

#### 3-3. 중복 Instinct
- 동일 domain + 유사 trigger를 가진 instinct 쌍 검출
- 후보: `/evolve`로 병합

### Phase 4: Observation 수명 관리

#### 4-1. observations.jsonl 크기 확인
```bash
ls -lh .claude/learning/observations.jsonl
wc -l .claude/learning/observations.jsonl
```

#### 4-2. 90일 초과 관측 데이터 요약
- 90일 이전 데이터 → 도메인별 통계로 요약 후 아카이빙
- 요약 파일: `.claude/learning/observation-summary-{YYYY-MM}.json`

## 실행 절차

1. **SCAN**: Phase 1~4 순차 실행
2. **CLASSIFY**: 발견된 항목을 Critical/Warning/Info로 분류
3. **REPORT**: 리포트 출력
4. **SUGGEST**: 자동 수정 가능한 항목에 대해 수정 제안 (사용자 확인 필요)

## 출력 형식

```markdown
## 🧹 Periodic Cleanup Report

📅 실행 일시: {날짜}
⏱️ 마지막 실행: {이전 실행일} ({N}일 전)

### Phase 1: 코드 위생
| 항목 | 건수 | 심각도 | 자동 수정 |
|------|------|--------|----------|
| 미사용 Import | {N} | 💡 | ✅ |
| 빈 catch 블록 | {N} | ⚠️ | ❌ |
| TODO 방치 (30일+) | {N} | 💡 | ❌ |
| 중복 코드 후보 | {N} | 💡 | ❌ |

### Phase 2: 규칙 위반
(check-rules 결과 요약)

### Phase 3: Instinct 수명
| 항목 | 건수 | 조치 |
|------|------|------|
| 저신뢰 (<0.3) | {N} | 아카이빙 대상 |
| 장기 미사용 (30일+) | {N} | 아카이빙 대상 |
| 중복 후보 | {N} | /evolve 병합 대상 |

### Phase 4: Observation
| 항목 | 값 |
|------|-----|
| 파일 크기 | {N} MB |
| 총 관측 수 | {N}건 |
| 90일 초과 | {N}건 (요약 대상) |

### 📊 전체 요약
- 🔴 Critical: {N}건
- ⚠️ Warning: {N}건
- 💡 Info: {N}건
- 규칙 준수율: {N}%
- 추천 조치: {목록}
```

## 자동 실행 설정

주기적 실행을 원하면:
```
/loop 1d /periodic-cleanup quick
```
또는 `/schedule`로 원격 에이전트 설정.

## 주의사항

- **읽기 전용** — 코드를 수정하지 않음 (자동 수정은 사용자 확인 후)
- Quick 모드는 Phase 1의 1-1, 1-2만 실행
- 전체 스캔은 대규모 코드베이스에서 수분 소요 가능
