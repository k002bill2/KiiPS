---
name: KiiPS 모달 폼 — form-group new 패턴 우선
description: 모달 폼은 d-flex/flex-fill이 아닌 form-group new (+ row + col-sm-X) 패턴을 사용해야 디자인 시스템과 일치
type: feedback
originSessionId: 6632b6cf-cba6-443e-8aad-77f1ef76e76f
---
# 규칙

KiiPS 모달 내부의 폼 영역은 **무조건 `form-group new` 패턴**으로 작성한다. Bootstrap의 `d-flex` + `flex-fill`이나 직접 `<div class="form-group">`은 KiiPS 디자인 시스템 토큰을 적용받지 못한다.

## 결정 매트릭스

| 레이아웃 | 권장 패턴 | 설명 |
|----------|----------|------|
| **수직 스택** (위/아래 한 줄씩) | `<div class="form-group new">` 반복 | 가장 단순. label↔input 간격, 폼 폭이 디자인 시스템대로 |
| **가로 2분할** | `<div class="form-group new row">` + `<div class="col-sm-6">` × 2 | Bootstrap 그리드 사용. 모바일에서는 자동으로 세로 스택 |
| **가로 3분할** | `<div class="form-group new row">` + `<div class="col-sm-4">` × 3 | 동일 패턴, col 폭만 변경 |
| **혼합** (좌측 라벨 박스 + 우측 분할) | `<div class="form-group new row">` + `<div class="col-lg-2 grayBox">라벨</div>` + `<div class="col-lg-10 form-group row new">...</div>` | IL0920.jsp:245~260 참고 |

## 표준 마크업 — 가로 2분할

```html
<form id="...">
    <div class="form-group new row">
        <div class="col-sm-6">
            <label class="control-label" for="field1">기준연도</label>
            <input type="input" class="form-control flatpicker yearpicker nopickerTag" id="field1" data-id="STD_YYYY" name="STD_YYYY">
        </div>
        <div class="col-sm-6">
            <label class="control-label" for="field2">기준분기</label>
            <select class="selectpicker show-tick form-control" id="field2" ...>
                <option value="1">1Q</option>
            </select>
        </div>
    </div>
</form>
```

## ❌ 금지 패턴

```html
<!-- d-flex + flex-fill — KiiPS 디자인 시스템과 어긋남 -->
<div class="d-flex gap3x">
    <div class="form-group flex-fill">
        <label>...</label>
        <input class="form-control" ...>
    </div>
    <div class="form-group flex-fill">
        ...
    </div>
</div>
```

```html
<!-- new 없는 form-group — 구버전 마진/폰트 적용됨 -->
<div class="form-group">
    <label>...</label>
    <input class="form-control" ...>
</div>
```

## Why

- **디자인 시스템 일관성**: `form-group new`는 SCSS에서 라벨 위치, 입력 높이, 폼 간격, 다크테마 색상이 모두 토큰으로 묶여 있다. `d-flex`는 raw flexbox라 디자인 토큰 없이 픽셀이 어긋난다
- **반응형 자동 처리**: `col-sm-6`은 모바일에서 자동으로 세로 스택. `flex-fill`은 항상 가로 유지라 좁은 화면에서 깨진다
- **유지보수**: SCSS에서 `.form-group.new` 셀렉터로 일괄 스타일 변경 가능. 임시 d-flex 조합은 추적이 어렵다

## How to apply

1. 모달 내부 폼 작성 시작 전 — IL0920.jsp 라인 245~310 또는 IL0920_POPPRINT2 모달(라인 482~499)의 `form-group new` 마크업 먼저 참고
2. 가로 2분할이 필요하면 `form-group new row` + `col-sm-6` × 2 — 절대 `d-flex gap3x` + `flex-fill` 사용 금지
3. 새 모달 추가 시 자체 검증: `grep "d-flex.*flex-fill" 새모달.jsp` → 결과 0건이어야 함
4. 코드리뷰 시 `<div class="form-group">` 단독(without `new`) 발견하면 `new` 추가 제안

## 사례 — 2026-04-29

IL0920 벤처프로젝트 보고회 엑셀 다운로드 모달 작성 시 처음에 `<div class="d-flex gap3x">` + `<div class="form-group flex-fill">` 패턴으로 작성. 사용자가 "form-group new 스타일로 변경해야 해, 다른 모달 참고"라고 정정. 같은 파일 IL0920.jsp 라인 272~280의 IPO기한/우선주 한 쌍이 정확히 같은 가로 2분할 구조였음에도 참고 못함.

**교훈**: 모달 폼 작성 직전, 같은 화면의 다른 모달에서 `grep -n "form-group new" 화면.jsp` 먼저 실행하고 표준 패턴 확인.
