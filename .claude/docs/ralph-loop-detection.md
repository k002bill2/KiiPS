# Ralph Loop Detection (반복 편집 감지)

> anti-rationalization.md 에서 분리된 Ralph Loop 감지 로직 상세
> 자동 강제: `buildChecker.js` (errorSignatureHistory 카운터)

## 감지 트리거 3종

### 1. 파일 반복 편집 (⚠️ 행위 가이드라인 — 자동 훅 아님)
- **임계값**: 동일 파일 3회 이상 Edit
- **행동**: 즉시 중단, 진단 모드 전환, 근본 원인 분석 보고
- **감지 주체**: **에이전트 자기 감지** — 전용 자동 카운터(`.file-edit-counter.json`)는 **미구현**.
  `multiFileGate.js`는 *서로 다른* 3+ 파일을 감지하므로 *동일* 파일 반복과는 별개다.
  (트리거 2·3 만 자동 강제: `buildChecker.js` + `.pending-build.json`)

### 2. 빌드 실패 반복
- **임계값**: 연속 3회 BUILD FAILURE
- **자동 행동**: 자동 롤백 프로토콜 실행
- **카운터 위치**: `.claude/.pending-build.json` (`MAX_AUTO_FIX_ATTEMPTS=3`)

### 3. 에러 악순환 (시그니처 변경)
- **임계값**: 수정 A → 새 에러 B → 수정 B → 새 에러 C → 중단
- **감지 방법**: `errorSignatureHistory[]` 배열에서 시그니처 변경 횟수 ≥ 3
- **자동 행동**: 최초 변경 지점으로 되돌리기 후 재설계

## 자동 롤백 프로토콜 (5단계)

| 단계 | 행동 | 사용자 개입 |
|------|------|------------|
| 1. HALT | 즉시 모든 편집 중단 | - |
| 2. REPORT | 반복 편집 파일/에러/의도 요약 보고 | 검토 |
| 3. REVERT | `svn revert` 후보 제시, 승인 후 실행 | **승인 필수** |
| 4. DIAGNOSE | `/diagnose` 활용 근본 원인 분석 + 대안 제안 | 검토 |
| 5. RESTART | 새로운 접근법 제안, 승인 후 재시작 | **승인 필수** |

## 트리거 조건 매트릭스

| 조건 | 임계값 | 롤백 범위 |
|------|--------|----------|
| 동일 파일 반복 편집 | 3회 | 해당 파일만 |
| 연속 빌드 실패 | 3회 | 이번 세션 변경 파일 전체 |
| 에러 시그니처 변경 (A→B→C) | 3단계 | 최초 변경 시점까지 |

## 절대 금지

- 사용자 승인 없이 `svn revert` 실행 금지
- 되돌리기 범위 임의 축소 금지 (제시한 전체 파일을 되돌릴 것)
- 롤백 후 동일한 접근법으로 재시도 금지 (반드시 새 접근법)
- "한 번만 더 시도"는 합리화 — Ralph Loop 감지의 목적은 시간 낭비 차단

## 자동 강제 훅

- `buildChecker.js` — 빌드 실패 카운터 + 에러 시그니처 추적
- `multiFileGate.js` — 3+ 파일 변경 시 게이트 (예방적)
- `postToolOrchestrator.js` — 통합 진입점

## 참조

- 핵심 규칙 → [anti-rationalization.md](./anti-rationalization.md)
- 반합리화 표현 목록 → [anti-rationalization.md](./anti-rationalization.md)
