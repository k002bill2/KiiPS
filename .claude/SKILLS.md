# KiiPS Active Skills (26개)

> CLAUDE.md에서 분리된 스킬 카탈로그. 스킬은 자동 발견되므로 이 파일은 참조용입니다.
> 마지막 실측 동기화: 2026-05-11. `tests/skills-integrity.test.js` 로 drift 자동 검증.
>
> 구성: KiiPS 도메인 21 + 공통 3 + 디자인 2 = **26개**

## KiiPS 도메인 스킬

| Skill | 용도 |
|-------|------|
| `kiips-build` | 빌드/배포/기동 통합 (Maven, 배포, Pre-flight, 헬스체크) |
| `kiips-backend` | 백엔드 통합 (Controller/Service/DAO 패턴, 공통 코드, API 설계) |
| `kiips-frontend-guidelines` | JSP/jQuery/Bootstrap 표준 패턴, AJAX 규칙 |
| `kiips-mybatis-guide` | MyBatis mapper, 동적 SQL, DB 검증, SQL Injection 방지 |
| `kiips-security-guide` | Spring Security, XSS/CSRF 방어, 인증/인가 |
| `kiips-realgrid-guide` | RealGrid 2.6.3 그리드 생성, 설정, Excel, 성능 |
| `kiips-ui-component-builder` | JSP 컴포넌트 템플릿 생성 |
| `kiips-page-pattern-guide` | JSP 페이지 표준 패턴 (레이아웃, Include, 연동, 상세페이지) |
| `kiips-search-filter-guide` | 검색필터 (MainComponent, Constant, 필터바) |
| `kiips-button-guide` | 버튼 영역 (inc_main_button, 권한, 아이콘) |
| `kiips-regist-modal-guide` | 등록/수정 모달 (폼, 그리드, columnGroup) |
| `kiips-checklist-list-popup` | 체크리스트 목록 팝업 표준 패턴 (아이콘 버튼 바, 결재 연동) |
| `kiips-linked-approval-template` | 결재 연계 문서 HTML 템플릿 + 데이터 바인딩 |
| `kiips-scss` | SCSS 테마 + 다크테마 통합 (디자인 토큰, [data-theme=dark]) |
| `kiips-quality` | 웹 접근성(WCAG) + 반응형 디자인 검증 통합 |
| `kiips-logs` | 로그 조회/분석 통합 (에러 탐지, 모니터링) |
| `kiips-db-inspector` | DB 구조 조회 (MyBatis mapper 분석, 읽기 전용) |
| `kiips-feature-planner` | Feature 개발 계획 수립 (마이크로서비스) |
| `kiips-test-runner` | JUnit/Jest/Karma 테스트 실행 및 검증 |
| `kiips-orchestration` | 병렬 에이전트, ACE 가드레일, 스킬 체이닝 통합 |
| `kiips-learning` | 학습 시스템 통합 (Instinct 생성, 패턴 감지, 스킬 팩토리) |

## 공통 스킬

| Skill | 용도 |
|-------|------|
| `legacy-compliance-checker` | 레거시 준수 검증 (Java 8, Spring Boot 2.4.x) |
| `checklist-generator` | 코드 리뷰, 배포, 테스트 체크리스트 생성 |
| `code-simplifier` | 구현 후 코드 단순화 (Boris Cherny principle) |

## 디자인 스킬

| Skill | 용도 |
|-------|------|
| `kiips-stitch-bridge` | Stitch 디자인 → KiiPS JSP 변환 브리지 |
| `kiips-page-harness` | 페이지 자동 생성 하네스 (Plan→Generate→Evaluate 파이프라인) |
