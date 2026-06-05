---
name: KiiPS 버튼 스타일 — outline vs filled
description: main_gridRow 단일 액션 버튼은 btn-outline-primary, 드롭다운/관리자 강조 버튼만 btn-primary + 아이콘 반전 사용
type: feedback
originSessionId: 6632b6cf-cba6-443e-8aad-77f1ef76e76f
---
# 규칙

`main_gridRow`(메인 그리드 상단 버튼 영역)의 아이콘 버튼은 두 종류의 스타일로 나뉜다.

| 버튼 유형 | class | 아이콘 처리 | 예시 |
|-----------|-------|-------------|------|
| **단일 액션** (모달 직접 오픈, 단일 핸들러 호출) | `btn btn-only-icon btn-xl btn-outline-primary` | 그대로 (필터 없음) | `btn_reload`(조회), `btn_help`(도움말), IL0920 단일 엑셀 버튼, 단일 인쇄 버튼 |
| **드롭다운** (`data-toggle="dropdown"`) 또는 **관리자 강조** | `btn btn-only-icon btn-xl btn-primary` | `style="filter: brightness(0) invert(1);"` (흰색 반전) | `btn_setAdmin`(관리자), IL0914 엑셀 dropdown, IL0920 인쇄 dropdown, 등록 dropdown |

**Why:** 2026-04-29 IL0920 엑셀 버튼 작업 시, 인쇄 dropdown(`btn-primary`)을 보고 동일 스타일로 추가했다가 사용자가 "드롭다운이 아니면 `btn-outline-primary`일 거야"라고 지적. 같은 줄의 `btn_help`/`btn_reload`가 모두 outline 스타일이라는 걸 확인 못 했음. KiiPS UI에서는 강조 색의 채워진 배경은 "추가 메뉴가 펼쳐진다"는 시각적 신호로만 사용한다.

**How to apply:**
1. main_gridRow에 새 버튼을 추가하기 전, **드롭다운인지 단일 액션인지 먼저 분류** — `data-toggle="dropdown"` 유무가 결정 기준
2. 단일 액션 → 무조건 `btn-outline-primary`, `<span class="icon_xxx">` 그대로 (filter 없음)
3. 드롭다운 → `btn-primary` + `style="filter: brightness(0) invert(1);"` (관리자 `btn_setAdmin`은 dropdown 아니어도 `btn-primary` 강조 — 권한 메뉴라는 강조 의미)
4. 새 버튼 추가 시 **같은 그리드 영역의 기존 단일 버튼**(`btn_reload`, `btn_help`)을 참고 — 인쇄/엑셀 dropdown만 보고 따라 하면 안 됨
5. `kiips-button-guide` 스킬 Part 3 — 표준 컴포넌트의 기본값이 outline-primary인 이유가 이 원칙

## 잘못된 예 (이번 작업의 실수)

```html
<!-- ❌ 단일 엑셀 버튼인데 dropdown 스타일 채용 -->
<button id="btn_excel" class="btn btn-only-icon btn-xl btn-primary"
    onClick="callExcelDown()">
    <span class="icon_excel" style="filter: brightness(0) invert(1);"></span>
</button>
```

## 올바른 예

```html
<!-- ✅ 단일 액션은 outline + 아이콘 원본 색 -->
<button id="btn_excel" class="btn btn-only-icon btn-xl btn-outline-primary"
    data-toggle="tooltip" title="엑셀 다운로드"
    onClick="callExcelDown()">
    <span class="icon_excel"></span>
</button>
```

## 자기 검증 체크리스트

새 버튼 작성 후, 같은 file의 `btn_reload`/`btn_help` 라인을 grep으로 확인:

```bash
grep -n 'id="btn_reload"\|id="btn_help"' inc_xx_button.jsp
```

내가 추가한 버튼의 class와 비교 — `btn-outline-primary`로 끝나면 OK. `btn-primary`이면 dropdown인지 다시 확인.
