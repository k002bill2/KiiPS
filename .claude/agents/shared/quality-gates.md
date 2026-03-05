---
name: quality-gates
description: Shared quality gates for all specialist agents
---

# Quality Gates

All agents MUST pass these quality gates before marking work as complete.

## Automated Checks

```bash
# Run all quality checks (from KiiPS-HUB)
mvn compile -pl :<module> -am          # Java 8 compilation
mvn test -pl :<module> -am             # JUnit test execution
mvn package -pl :<module> -am          # Full package build
```

## 0. Ethical Quality Gate (Layer 1) - FIRST

기술적 품질 검사 **전에** 윤리적 검증을 먼저 수행합니다. 이 게이트를 통과하지 못하면 다른 검사를 진행하지 않습니다.

### Pre-Execution Ethical Checklist

| 체크 항목 | 검증 방법 | 실패시 |
|----------|----------|--------|
| 펀드/투자 데이터 처리 | 데이터 정합성 + 트랜잭션 보장 확인 | **BLOCK** |
| SQL Injection 방지 | MyBatis #{} 사용 검증 (${} 금지) | **BLOCK** |
| 리소스 사용 | DB 커넥션 풀, 메모리 임계값 미초과 | WARN |
| 권한 범위 | 할당된 모듈 내 작업만 | **BLOCK** |
| 롤백 가능성 | @Transactional(rollbackFor) 설정 확인 | **BLOCK** |
| 투명성 | 모든 에러/경고 로깅 (Sentry 통합) | **BLOCK** |

### Ethical Compliance Score

```
Score = (통과한 윤리 체크 / 전체 윤리 체크) x 100

- 100%: 진행 가능
- 80-99%: 경고 후 진행 (로그 필수)
- <80%: BLOCK + Primary 검토 필요
```

### Ethical Veto Trigger

다음 상황 감지시 **즉시 작업 중단**:
- [ ] 백업 없이 프로덕션 데이터 수정 시도
- [ ] API 키/비밀번호 하드코딩 시도
- [ ] MyBatis ${} 파라미터 바인딩 사용
- [ ] app-kiips.properties / app-stg.properties 커밋 시도
- [ ] Primary-only 모듈 (HUB, COMMON, UTILS) 무단 수정

-> [ace-framework.md](./ace-framework.md)의 Ethical Veto Protocol 참조

---

## Quality Gate Requirements

### 1. Java 8 Compilation

- [ ] `mvn compile -pl :<module> -am` passes with zero errors
- [ ] No deprecated API usage without @SuppressWarnings 주석
- [ ] Explicit type declarations on public methods
- [ ] Proper null handling with Optional or null checks

### 2. Maven Build Compliance

- [ ] `mvn package -pl :<module> -am` passes
- [ ] No SNAPSHOT versions for production deployment
- [ ] Build order respected: COMMON -> UTILS -> services
- [ ] Always build from KiiPS-HUB root

### 3. Test Coverage Thresholds

| Metric | Minimum |
|--------|---------|
| JUnit Statements | 70% |
| Functions | 65% |
| Branches | 55% |
| Lines | 70% |

### 4. Security

- [ ] No hardcoded API keys or passwords
- [ ] No hardcoded DB credentials
- [ ] Sensitive data uses app-local.properties (not committed)
- [ ] MyBatis #{} parameter binding only (${} prohibited)
- [ ] XSS prevention: $.text() preferred over $.html()
- [ ] CSRF token validation on form submissions

### 5. Spring Boot / MyBatis Specific

- [ ] @Transactional(rollbackFor = Exception.class) on service methods
- [ ] @Valid annotation on controller request parameters
- [ ] GlobalExceptionHandler coverage for exception types
- [ ] ResponseEntity with appropriate HTTP status codes
- [ ] DELETE/UPDATE queries have WHERE conditions

### 6. JSP / Frontend Specific

- [ ] JSTL/EL tags for data binding (scriptlets discouraged)
- [ ] AJAX .fail() error handler on all $.ajax calls
- [ ] Loading spinner show/hide pattern
- [ ] Duplicate request prevention (button disable)
- [ ] UTF-8 encoding confirmed

### 7. RealGrid 2.6.3 Specific

- [ ] GridView + DataProvider properly initialized
- [ ] Event handler cleanup (memory leak prevention)
- [ ] Excel export functionality verified
- [ ] Pagination for large datasets

### 8. SCSS Dark Theme Rules

- [ ] `[data-theme=dark]` selector only (`.dark`, `.theme-dark` prohibited)
- [ ] No layout property changes (width/height/display/position/margin/padding)
- [ ] SCSS variables used ($dark-bg, $dark-color-2)
- [ ] Only SCSS files modified (no direct CSS edits)
- [ ] `!important` only for inline style overrides

## Validation Commands

```bash
# Quick validation (from KiiPS-HUB)
mvn compile -pl :<module> -am

# Full validation (before deployment)
mvn clean package -pl :<module> -am

# Single module test
mvn test -pl :<module> -am

# MyBatis SQL safety check
grep -r '${' KiiPS-*/src/main/resources/mapper/ --include="*.xml" | grep -v '#{'

# SCSS dark theme check
grep -rn '\.dark\s' KiiPS-UI/src/main/resources/static/css/sass/ --include="*.scss"
grep -rn '\.theme-dark' KiiPS-UI/src/main/resources/static/css/sass/ --include="*.scss"
```

## Agent-Specific Gates

| Agent | Additional Requirements |
|-------|------------------------|
| kiips-architect | 아키텍처 일관성, 마이크로서비스 간 통신 패턴, API Gateway 라우팅 |
| kiips-developer | @Transactional, MyBatis #{}, JUnit 커버리지, REST API 규격 |
| kiips-ui-designer | WCAG 2.1 AA 접근성, 반응형 Bootstrap, RealGrid 이벤트 정리, [data-theme=dark] |
| kiips-realgrid-generator | GridView/DataProvider 초기화, Excel export, 페이징, 메모리 누수 방지 |
| code-simplifier | 리팩토링 후 기존 테스트 통과, 동작 변경 없음, 복잡도 감소 검증 |
| checklist-generator | 체크리스트 완전성, KiiPS 컨벤션 준수, 누락 항목 없음 |
| build-manager | 빌드 순서 (COMMON->UTILS->services), SNAPSHOT 검증, 의존성 해결 |
| feature-manager | 기능 완전성, 아키텍트-개발자-QA 순차 검증, dev docs 업데이트 |
| ui-manager | 반응형 검증 파이프라인, SCSS 규칙 강제, UI-백엔드 통합 |
| deployment-manager | 헬스 체크 통과, 포트 충돌 없음, 롤백 계획 확인 |

---

**Version**: 3.0.0-KiiPS | **Last Updated**: 2026-02-06 | **Layer 1 Ethical Gate + KiiPS Stack**
