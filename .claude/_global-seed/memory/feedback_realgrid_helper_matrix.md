---
name: KiiPS RealGrid 헬퍼 선택 매트릭스
description: common_grid.js의 5개 헬퍼를 용도별로 분기 선택하는 원칙. setDataSource 직접 호출 금지
type: feedback
originSessionId: d9983b69-cd43-4721-94ad-06156432e5f6
---
KiiPS에서 RealGrid를 쓸 때는 반드시 `common_grid.js`의 공통 헬퍼 중 하나를 선택해야 한다. `gridView.setDataSource(dp) + dp.setFields(...) + gv.setColumns(...)`를 JSP에서 직접 호출하면 Excel 익스포트 스타일, fitLayoutWidth, 컨텍스트 메뉴 등 공통 상속이 빠져 화면 간 불일치가 발생한다.

**헬퍼 선택 매트릭스** (`KiiPS-UI/src/main/resources/static/js/common_grid.js`):

| 용도 | 헬퍼 | 내부 주요 세팅 |
|------|------|--------------|
| 페이지 본문 메인 조회 | `createMainGrid`(line 1626) | 그룹패널, Excel 풀세팅, rowHeight 36, sorting, lookupDisplay, commitByCell |
| 모달/팝업 편집 | `createSimpleEditGrid`(line 1269) | editable, insertable, appendable, 체크바, 높이 210px |
| 모달/팝업 읽기 전용 | `createSimpleGrid`(line 1480) | editable:false, rows 선택, 체크바 |
| 메인 내 서브 편집 | `createEditGrid`(line 1341) | 컨텍스트 메뉴, Paste 옵션, margin-bottom 20px |
| 트리 구조 | `createTreeGrid`(line 1431) | TreeProvider/TreeView |

**Why**: 다섯 개 헬퍼는 2022~2024년 오민석/은미/권우석이 누적 개선한 공통 기능(Excel border, fitLayoutWidth, selectsel-color, commitWhenLeave 등)을 상속하도록 설계됨. 직접 초기화하면 이 모든 자산을 잃는다. 또한 createSimpleEditGrid를 쓰면 KiiPS 내 다른 팝업/모달과 시각적 일관성이 자동 확보된다.

**How to apply**:
- 화면 유형 판별 → 위 표에서 헬퍼 선택 → `createXxxGrid(container, dp, gv, columns)` 호출
- `container` 인자는 **ID 문자열**(예: `"TB_AC1028_SETTING"`) — `#` 접두사 붙이지 말 것 (내부 `$(eval(container))`가 작동하는 방식)
- 헬퍼 호출 후 필요한 부분만 오버라이드. 관용구 (AC0201_POP.jsp:329-335):
  ```javascript
  createSimpleEditGrid("MY_GRID", dp, gv, columns);
  gv.setCheckBar({ visible: false });
  gv.setFooters({ visible: false });
  gv.editOptions.movable = true;
  ```
- 설정/개인화 모달에서 **편집이 체크박스 토글뿐**이면 `createSimpleEditGrid`를 쓰지 말고 **`createSimpleGrid` + `onCellClicked` 수동 토글** 패턴 사용. `createSimpleEditGrid`는 내부에서 `onCellClicked`에 `showEditor(true)`를 자동 바인딩(common_grid.js:1326)하므로 체크 셀에서도 텍스트 에디터가 열리는 회귀 발생. `createSimpleGrid`는 editable:false 기본이라 텍스트 에디터 원천 차단. `editOptions.movable = true`는 editable과 독립이라 드래그 이동 정상 작동.

**실수 이력 (2026-04-22)**: AC1028.jsp 대시보드 설정 모달 최초 구현 시 `setDataSource + setFields + setColumns`를 직접 호출해 공통 자산을 놓침. 사용자 피드백("common_grid.js 참조해서 분기") 후 createSimpleEditGrid + 오버라이드 패턴으로 리팩토링.

**참조 파일**:
- 호출 예: `AC0201_POP.jsp:329-335` (팝업), `AC1028.jsp:235-260` (모달 설정 그리드)
- 스킬 가이드: `.claude/skills/kiips-ui-component-builder/SKILL.md` 섹션 0
