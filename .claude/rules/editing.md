# Editing Rules + Revert & Change Management

> CLAUDE.md에서 분리된 편집 및 변경 관리 상세 규칙

## Editing Rules

1. **범위 제한** - 요청된 내용만 수정, 기능/레이아웃/로직 변경 금지
2. **대상 파일 확인** - JSP 편집 시 유사 파일이 있으면 사용자에게 먼저 확인
3. **점진적 적용** - 벌크 편집(10+ 파일) 시 2-3개 먼저 적용 후 사용자 확인
4. **주석 검색 포함** - 파일 참조 검색 시 주석 처리된 코드도 포함
5. **컴파일 검증** - SCSS 편집 후 컴파일 성공 확인 전 완료 보고 금지
6. **회귀 즉시 복원** - 변경이 컴파일/기능을 깨뜨리면 즉시 되돌리고 보고
7. **KiiPS-MES 제외** - KiiPS-UI 공통 자산 변경은 MES로 전파하지 않는다 (아래 모듈 경계 참조)

## 모듈 경계 — KiiPS-MES 제외 (2026-09-10 사용자 결정)

KiiPS-UI 공통 자산을 고쳐도 **KiiPS-MES에는 전파하지 않는다.** MES는 자체 사본으로 독립 운영한다.

| 공통 자산 | KiiPS-UI (작업 대상) | KiiPS-MES (건드리지 않음) |
|-----------|---------------------|--------------------------|
| 그리드 헬퍼 | `KiiPS-UI/src/main/resources/static/js/common_grid.js` | `KiiPS-MES/src/main/resources/static/js/common_grid.js` (별도 사본) |
| RealGrid 스타일 | `KiiPS-UI/.../vendor/realgrid.{2.6.3,2.8.8}/*.scss` | MES 자체 벤더 디렉터리 |
| 공통 컴포넌트/JSP include | `KiiPS-UI/.../include/` | `KiiPS-MES/.../MES/include/` (동명 파일 다수) |

- 동명 파일이 많아 검색 결과에 MES가 섞여 들어온다 — **경로로 모듈을 먼저 확인**하고 KiiPS-UI 것만 수정한다.
- MES 적용이 필요하면 **사용자가 명시적으로 요청할 때만** 별건으로 진행한다. "일관성을 위해"는 사유가 되지 않는다.
- KIIPS-SECURL, KIIPS-LAB 도 각자 사본을 가지므로 동일하게 취급한다.

## Revert & Change Management

1. **체크포인트** - 다중 파일 편집 전 변경 대상 파일 목록 확인
2. **정확한 복원** - '되돌리기' 시 원본 그대로 복원 (부분 되돌리기/재해석 금지)
3. **최소 편집** - 광범위한 리팩토링보다 정밀 수정 선호
4. **관심사 분리** - 버그 수정과 리팩토링을 혼합하지 말 것
5. **즉시 응답** - 사용자가 "되돌려"라고 하면 논쟁 없이 즉시 실행

## Golden Principles

### #1 Immutability (불변성 원칙)
- 공유 코드(KiiPS-COMMON, KiiPS-UTILS) 수정보다 **새 파일/메서드 생성** 선호
- 기존 인터페이스 변경 시 하위 호환성 유지 필수
- 공유 모듈 변경은 영향 범위 분석 후 사용자 승인 필요

### #2 Secrets in Environment Variables
- 하드코딩된 비밀번호/키/토큰 절대 금지
- 환경변수 또는 `app-*.properties` 통해 주입
- 예외: 테스트 코드의 목 데이터 (단, "test"/"dummy" 접두사 필수)

## 파일 유형별 주의사항

| 파일 유형 | 편집 전 확인 |
|-----------|-------------|
| JSP | 유사 파일명 존재 여부 (예: _P.jsp, _V.jsp) |
| SCSS | 컴파일 테스트 |
| Java | 빌드 영향 범위 |
| XML (MyBatis) | #{} vs ${} 바인딩 |
| pom.xml | 모듈 의존성 체인 |
