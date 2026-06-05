# KiiPS Project Memory

## 글로벌 vs 로컬 파일 분리 (2026-03-10)

- **17건** 범용 파일이 `~/.claude/`에 글로벌 버전으로 존재
  - 커맨드 8: learn, evolve, verify, plan, session-wrap, instinct-status, eval, scope-lock
  - 스킬 3: continuous-learning, session-wrap, parallel-coordinator
  - 훅 4: observe.js, outputSecretFilter.js, pre-compact-save.sh, update-reminder.sh
  - 에이전트 2: planner.md, verify-agent.md
- KiiPS 프로젝트는 도메인 특화 버전을 로컬에 유지
- `observe.js`는 글로벌 버전이 `.claude/learning/domain-config.json`에서 도메인 패턴을 로드하는 구조
- KiiPS settings.json 훅 경로는 변경 없음 (로컬 버전 사용)

## 프로젝트 구조

- SVN 기반 소스 관리 + Git으로 .claude/ 설정 관리
- Java 8 + Spring Boot 2.4.2
- Maven Multi-Module (KiiPS-HUB에서 빌드)
- 주요 포트: Gateway:8088, UI:8100, FD:8601, IL:8401, Common:8701, Login:8801

## VCS 워크플로우
- [feedback_vcs_workflow.md](./feedback_vcs_workflow.md) - SVN(IntelliJ) + Git(.claude/) 이중 구조

## UI 컴포넌트 패턴
- [feedback_ui_patterns.md](./feedback_ui_patterns.md) — 체크박스(checkbox-custom), 날짜(flatpickr-basic) 표준 패턴
- [feedback_kiips_modal_close_button.md](./feedback_kiips_modal_close_button.md) — 모달 close는 `<a class="card-action card-action-dismiss modal-dismiss">` 패턴, Bootstrap btn-close/close 금지
- [feedback_realgrid_helper_matrix.md](./feedback_realgrid_helper_matrix.md) — common_grid.js 5개 헬퍼 용도별 선택, setDataSource 직접 호출 금지
- [feedback_dashboard_org_file_separation.md](./feedback_dashboard_org_file_separation.md) — 대시보드 기관별 차이는 `dashboard_{기관}.jsp/.js` 파일 분리 + index.jsp 서버 사이드 라우팅 (조건 분기 X)
- [feedback_kiips_button_outline_vs_filled.md](./feedback_kiips_button_outline_vs_filled.md) — main_gridRow 단일 액션은 `btn-outline-primary`, 드롭다운만 `btn-primary` + 아이콘 반전 (인쇄 dropdown 따라 했다가 outline-primary로 정정한 사례)
- [feedback_kiips_form_group_new.md](./feedback_kiips_form_group_new.md) — 모달 폼은 `form-group new` (+ `row` + `col-sm-X`) 표준. `d-flex gap3x` + `flex-fill` 금지

## 다크테마 피드백
- [feedback_dark_theme_inline_style.md](./feedback_dark_theme_inline_style.md) — 인라인 style 배경색 금지, CSS 클래스로 다크테마 오버라이드 보장

## RealGrid 피드백
- [feedback_realgrid_text_center.md](./feedback_realgrid_text_center.md) — 기본 중앙정렬이므로 text-center 사용 금지
- [feedback_verify_before_answer.md](./feedback_verify_before_answer.md) — 스크린샷 환경(로컬/운영) 추측 금지, 확인 후 답변
- [feedback_realgrid_row_move.md](./feedback_realgrid_row_move.md) — 행 이동은 `editOptions.movable` + `dp.onRowMoved` 조합, `rowMovable` 단독은 작동 안 함
- [feedback_realgrid_header_checkbox.md](./feedback_realgrid_header_checkbox.md) — 컬럼 헤더 체크박스는 `header.template`에 KiiPS `checkbox-custom` HTML 직접 주입 (`onColumnHeaderClicked`+`setColumnProperty` 텍스트 토글 금지)
- [feedback_realgrid_html_renderer_perf.md](./feedback_realgrid_html_renderer_perf.md) — HTML 렌더러 N×M 셀 적용 시 성능 함정, 셀 체크박스는 `type:"check"`+`onCellClicked`. 모달 그리드는 `shown.bs.modal` 후 setRows.

## advisor 호출 규칙
- [feedback_advisor_usage.md](./feedback_advisor_usage.md) — 큰 리팩토링에서 substantive work 전/완료 선언 전 2회 호출 권장

## Harness Engineering (5 게이트)
- [project_harness_engineering_status.md](./project_harness_engineering_status.md) — 2026-04-22 통합 상태 + 이월 과제 3건 (permissionGate + shellContextTokenizer 통합 최우선)

## 로컬 환경 접근
- [project_local_oci_access_pcassist.md](./project_local_oci_access_pcassist.md) — OCI 사설망(`10.0.0.7` 등) DB 도달성 확보를 위해 PCAssist 실행 필수. 로컬 DB 연결 실패 시 **코드/설정 의심 전 PCAssist 먼저 확인**.

## IDE 함정
- [feedback_antigravity_ide_jsp_format_corruption.md](./feedback_antigravity_ide_jsp_format_corruption.md) — Antigravity IDE format-on-save가 JSP `<%-- --%>`/`//`-주석 스크립틀릿을 깨뜨려 컴파일 실패. JSP 자동포맷 끄기 + 땜질 말고 `svn revert` 후 의도변경만 재적용.

## Gemini → Antigravity CLI 전환 (2026-06-18 sunset)
- [project_antigravity_migration.md](./project_antigravity_migration.md) — 5-Phase 마이그레이션 플랜. 상세 문서: `.claude/docs/antigravity-cli-migration-plan.md`. **Phase 1(인증 점검) 완료 (2026-05-29)** → 인증=oauth-personal, 대응 보류. 산출물: `.claude/gemini-bridge/.auth-mode.txt`.

## 백엔드 아키텍처
- [project_kiips_inline_sql_dao.md](./project_kiips_inline_sql_dao.md) — SQL은 mapper XML 없이 Java DAO 내 StringBuffer 인라인. 투자유형 마스터=TB_IL1014M(MAIN_LIB 공유), STK_GDS_TPCD '1'=주식/'3'=채권. grep --include 오작동→find+xargs.
- [project_login_componentscan_bean_conflict.md](./project_login_componentscan_bean_conflict.md) — IDE 로컬 실행 시 `databaseChainedTXMngConfig` bean 충돌. 원인=common fat jar(mvn엔 config 부재) vs IDE 모듈 클래스패스(config 노출). 해결=login `@ComponentScan` REGEX excludeFilter(ASSIGNABLE_TYPE은 mvn 컴파일 실패). mvn 재현 불가→IDE 검증 필요.

## 참조 문서

- [architecture.md](../../architecture.md)
- [CLAUDE.md](../../CLAUDE.md) - 마스터 가이드
