# Build Error Fix - Tasks

**Progress**: 30/31 완료 (97%)
**Last Updated**: 2026-03-03 23:30

## KiiPS-FD 모듈

- [x] FDDashAPIService.java - spring-security import 주석
- [x] WebSecurityConfiguration.java - 전체 주석

## KiiPS-PG 모듈

- [x] PG0348APIService.java - apache-poi import 주석
- [x] PG1001APIService.java - commons-collections4 주석 + 대체코드
- [x] PG0426APIDao.java - checkerframework import 주석
- [x] PG0439APIService.java - apache-poi import 주석
- [x] PG0209APIService.java - apache-poi import 주석
- [x] WebSecurityConfiguration.java - 전체 주석
- [x] KiiPS-PG 빌드 성공 확인 (JDK 1.8 사용)

## ACE Framework 검증

- [x] ACE Framework 전체 테스트 (103/103 통과)
- [x] feature-manager.md role 필드 추가

## UI 컴포넌트 개발

- [x] COMM_POPUP_BEFOREREGISTIR.jsp 스텝 인디케이터 추가
- [x] "필수 입력 보기" 버튼 - 라벨 체크마크 표시 (초록색)
- [x] "수집 정보 보기" 버튼 - 라벨 체크마크 + 섹션 하이라이트 (청록색)
- [x] RealGrid 셀 레벨 하이라이트 (자본금, 주소, 인증이력 그리드)
- [x] 버튼 중첩 해제 (필수입력보기 ↔ 수집정보보기 상호 배타적)
- [x] UI 컴포넌트 버튼 추가 (toggleRequiredInputs, toggleCollectInfo)

## ACE Framework 이론→구현 (2026-02-26)

### Phase 1: 이론만 존재 → Hook으로 구현
- [x] Quality Gates 자동 검증 → qualityGateChecker.js (PostToolUse:Task)
- [x] Effort Scaling 자동 판단 → userPromptSubmit.js에 assessEffortScaling() 추가
- [x] Agent Improvement 루프 → improvementCollector.js (Stop) + improvement-analyzer.js CLI
- [x] Agent Observability → agentTracer.js v2.0 + observability-dashboard.js CLI

### Phase 2: 애매한 것 → 실제 동작하도록 강화
- [x] Parallel Coordinator 충돌 경고 → stderr 출력 + exit(2) 차단

### Phase 3: ACE 원칙을 Hook 파이프라인으로 강제
- [x] ACE 원칙 주입 → parallelCoordinator가 `<ace-principles>` 태그로 에이전트에 주입
- [x] 에이전트 가용성 체크 → parallelCoordinator.pre → task-allocator.checkAgentAvailability()
- [x] Feedback Loop 메트릭 기록 → agentTracer → feedback-loop.recordExecutionMetrics()
- [x] 윤리적 차단 학습 → ethicalValidator → feedback-loop.recordLearningEvent()
- [x] 세션 종료 요약 → stopEvent → feedback-loop.generateSummaryReport()
- [x] 자동 체크포인트 → stopEvent → checkpoint-manager.createCheckpoint()
- [x] 성능 기반 추천 → task-allocator.recommendAgent() ← feedback-loop 데이터

### Claude Code 시스템 종합 수정 (2026-03-03)
- [x] settings.json 아카이브 hook 참조 제거 + CLI 인자 제거 + 블록리스트 추가
- [x] 보안 취약점 6건 수정 (ethicalValidator, notificationHandler, gemini-auto-reviewer, gemini-bridge, autoFormatter)
- [x] 로직 버그 3건 수정 (scssValidator, gemini-bridge sanitizePath, gemini-collector)
- [x] Dead code 3건 정리 (ethicalValidator ACE, crossToolReader, daily limit)
- [x] Stop hook MODULE_NOT_FOUND 에러 수정

### skill-rules ↔ skills 연동 점검 (2026-03-03)
- [x] SKILL.md 5건 생성 (backend-guidelines, frontend-guidelines, database-verification, common-patterns, build-deploy)
- [x] skill-rules.json 이름 수정 + 팬텀 제거 + 누락 스킬 추가
- [x] CLAUDE.md Active Skills 테이블 업데이트 (22→27개)
- [x] primary-coordinator.md 아카이브 이동
- [x] 전체 검증 통과 (29키 = 27 SKILL.md + 2 agents)

### 잔여 작업
- [ ] KiiPS 애플리케이션 보안 이슈 대응 (SQL Injection 4건, 인증 우회, CSRF 비활성화)

## Notes

모든 주석에는 TODO와 날짜(2026-01-09) 포함됨.
원복 시 해당 주석 검색하여 해제하면 됨.

### RealGrid 셀 하이라이트 기술 노트
- `setCellStyleCallback` 패턴 사용
- `dataCell.index.column.fieldName` 으로 컬럼명 추출
- `highlightedColumns` 객체로 그리드별 상태 관리
- CSS 클래스: `.collect-cell-highlight`

### UI 버튼 토글 기술 노트
- `collectViewState` 객체로 현재 활성 상태 관리
- `toggleRequiredInputs()`, `toggleCollectInfo()` 래퍼 함수로 상호 배타적 토글
- 버튼 active 클래스: `#btnShowRequired.active`, `#btnShowCollect.active`
- CSS: `.collect-toggle-btn`, 각 버튼별 active 색상 (danger/info)
