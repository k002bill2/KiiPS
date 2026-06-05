---
name: KiiPS UI 컴포넌트 표준 패턴
description: 체크박스, 날짜 입력 등 KiiPS UI 컴포넌트 작성 시 따라야 할 표준 패턴
type: feedback
originSessionId: 1e5632c8-73b9-4e10-b273-d9a074c423af
---
## 체크박스 패턴

Bootstrap 4 `custom-control custom-checkbox` 사용 금지. KiiPS 프로젝트 표준 패턴 사용:

```html
<div class="form-check-inline">
    <div class="checkbox-custom checkbox-default mb-2">
        <input type="checkbox" data-id="FIELD_ID" data-gbn="checkbox" id="FIELD_ID"> <label for="FIELD_ID">&nbsp;라벨</label>
    </div>
</div>
```

**Why:** `custom-control` 방식은 KiiPS 프로젝트의 기존 CSS/JS와 스타일이 맞지 않음. IL0110_1.jsp, PG0304.jsp 등 전체 프로젝트에서 `checkbox-custom checkbox-default` 패턴 사용.

**How to apply:** 모달, 폼 등에서 체크박스 추가 시 항상 위 패턴 사용.

## 라디오 버튼 패턴

`custom-control custom-radio` 사용. `custom-control-input`/`custom-control-label` 클래스 + `id`/`for` 연결 필수:

```html
<div class="custom-control custom-radio">
    <input type="radio" name="FIELD_NAME" id="FIELD_ID_1" data-gbn="radio" data-id="FIELD_NAME" value="1" class="custom-control-input" checked>
    <label class="custom-control-label" for="FIELD_ID_1"> 라벨1</label>
</div>
<div class="custom-control custom-radio">
    <input type="radio" name="FIELD_NAME" id="FIELD_ID_2" data-gbn="radio" data-id="FIELD_NAME" value="2" class="custom-control-input">
    <label class="custom-control-label" for="FIELD_ID_2"> 라벨2</label>
</div>
```

**Why:** `header_function.jsp`의 공통 라디오 생성 함수, SY0225, AC0611 등 전체 프로젝트에서 `custom-control custom-radio` 패턴 사용. `radio-inline`이나 `radio-custom`은 비표준.

**How to apply:** 라디오 버튼 추가 시 `custom-control custom-radio` + `custom-control-input` + `custom-control-label` + `data-gbn="radio"` 적용.

## 날짜 입력 패턴

`datepicker` 클래스 사용 금지. KiiPS는 flatpickr 사용:

```html
<input type="text" class="form-control flatpickr-basic" data-id="FIELD_ID" data-gbn="date" name="FIELD_ID" placeholder="YYYY-MM-DD">
```

**Why:** KiiPS는 flatpickr 라이브러리를 사용하며, `flatpickr-basic` 클래스 + `data-gbn="date"`로 자동 초기화됨. `datepicker`는 동작하지 않음.

**How to apply:** 날짜 필드 추가 시 항상 `flatpickr-basic` + `data-gbn="date"` + `placeholder="YYYY-MM-DD"` 적용.

## 연도 입력 패턴 (yearpicker)

전체 날짜가 아닌 연도(YYYY)만 입력받을 때:

```html
<input type="text" class="form-control yearpicker nopickerTag" id="FIELD_ID" data-id="FIELD_ID" data-gbn="date" placeholder="YYYY" maxlength="4">
```

**Why:** KiiPS는 `vendor/jquery-year-picker/yearpicker.min.js`로 연도 전용 피커 사용. `nopickerTag` 클래스가 flatpickr 자동 초기화를 차단하고 yearpicker가 처리. AC0608, AC0611, MI1208, FD0108 등에서 사용.

**How to apply:** 연도만 입력받는 필드에 `yearpicker nopickerTag` + `data-gbn="date"` + `maxlength="4"` 적용.

## 셀렉트박스 패턴 (selectpicker)

일반 `<select class="form-control">` 사용 금지. KiiPS는 Bootstrap-Select 사용:

```html
<select class="selectpicker show-tick form-control" data-hide-disabled="true" data-gbn="select" id="FIELD_ID" data-id="FIELD_ID" title="선택해주세요" multiple data-max-options="1">
    <option value="A">옵션A</option>
    <option value="B">옵션B</option>
</select>
```

JS 값 변경 후 시각 동기화:
```javascript
$('#FIELD_ID').val('A').selectpicker('refresh');
```

**Why:** KiiPS는 Bootstrap-Select(`selectpicker`)를 표준으로 사용. 일반 `<select>`는 화면 일관성을 깨고 `data-gbn="select"` 자동 매핑이 작동하지 않음. 단일선택이라도 `multiple data-max-options="1"` 조합이 표준(체크 표시 등 풍부한 인터랙션). placeholder는 `title` 속성으로(빈 option 사용 금지). `.val()`만 호출하면 hidden select만 갱신되고 보이는 버튼 라벨은 안 바뀌므로 `selectpicker('refresh')` 필수.

**How to apply:** 모든 select 추가 시 `selectpicker show-tick form-control` + `data-hide-disabled="true"` + `data-gbn="select"` + `multiple data-max-options="1"` + `title="..."` 적용. JS에서 값 설정 시 `.selectpicker('refresh')` 체이닝.
