# Pipeline: Feature Lifecycle

> 기능 개발의 전체 라이프사이클 관리 파이프라인

---

## Trigger

```
"새 기능 개발"
"feature development"
"(기능|feature).*(개발|develop|구현|implement)"
```

## Phases

### Phase 1: Design

**Manager**: feature-manager
**Skills**: kiips-architect, legacy-compliance-checker

```
1. kiips-architect:
   - 아키텍처 설계 검토
   - 모듈 구조 결정 (Controller/Service/DAO/Mapper/JSP)
   - 결과: DESIGN { modules: string[], files: string[], architecture: object }

2. legacy-compliance-checker:
   - Java 8 호환성 사전 검증
   - 기술 스택 제약 확인
   - 결과: COMPLIANCE { violations: object[], approved: boolean }
```

**Gate**: COMPLIANCE.approved === true

### Phase 2: Backend Implementation

**Manager**: feature-manager
**Skills**: kiips-developer, kiips-backend-guidelines

```
1. kiips-developer:
   - Controller/Service/DAO 구현
   - MyBatis mapper XML 작성
   - 결과: BACKEND { files: string[], compileSuccess: boolean }
```

**Gate**: BACKEND.compileSuccess

### Phase 3: Frontend Implementation (Parallel with Phase 2)

**Manager**: ui-manager
**Skills**: kiips-ui-designer, kiips-frontend-guidelines

```
1. kiips-ui-designer:
   - JSP 페이지 생성
   - RealGrid 설정
   - SCSS 스타일 작성
   - 결과: FRONTEND { files: string[], scssCompiled: boolean }
```

**Gate**: FRONTEND.scssCompiled

### Phase 4: Testing

**Skills**: kiips-test-runner

```
1. kiips-test-runner:
   - 단위 테스트 실행
   - 통합 테스트 실행
   - 결과: TEST { passed: number, failed: number, coverage: number }
```

**Gate**: TEST.failed === 0

### Phase 5: Code Review

**Skills**: code-simplifier

```
1. code-simplifier:
   - 복잡도 분석
   - 리팩토링 제안
   - 결과: REVIEW { complexity: object, suggestions: string[] }
```

---

## Quality Gates Summary

| Phase | Gate Condition | On Failure |
|-------|---------------|------------|
| Design | compliance.approved | 설계 재검토 |
| Backend | compile success | 컴파일 에러 수정 |
| Frontend | SCSS compiled | 스타일 수정 |
| Test | 0 failures | 테스트 수정 |
| Review | complexity < threshold | 리팩토링 |

---

**Version**: 1.0.0
