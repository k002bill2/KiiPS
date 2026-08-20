# KiiPS 툴바 버튼 정렬 순서 (정본)

> **출처(정본)**: Google Sheets — 버튼 정렬 순서 시트
> https://docs.google.com/spreadsheets/d/1waEiufy-g29rGf7bsJ7LUMxApIDbQoOpQ5p792AboCQ/edit?gid=1722090840#gid=1722090840
> 취득일: 2026-08-18 · 총 43행
>
> 툴바에 버튼을 추가·재배치할 때는 **이 순번 오름차순**으로 놓는다.
> 화면에 없는 순번은 건너뛴다(순번은 상대 순서만 규정하며, 연속일 필요 없음).

---

## 순서 정의 (43행 전문)

`Div` 는 시트의 그룹 열이다. 값이 비어 있는 행은 **바로 위 그룹에 이어진다**.

| # | title | icon_name | class name | Div |
|--:|-------|-----------|------------|-----|
| 1 | 어드민 | admin.svg | `icon_admin` | admin |
| 2 | 개인 현황보기 | user.svg | `icon_user` | Reload/View |
| 3 | 부서 현황보기 | userGroup.svg | `icon_userGroup` | ↑ |
| 4 | **조회** | reload.svg | `icon_reload` | ↑ |
| 5 | 초기화 | reset.svg | `icon_reset` | ↑ |
| 6 | 링크 바로가기 | newwindow.svg | `icon_newwindow` | ↑ |
| 7 | **등록** | plus.svg | `icon_plus` | Regist |
| 8 | 복사 | copy.svg | `icon_copy` | ↑ |
| 9 | 다중확정 | multiCheck.svg | `icon_multiCheck` | ↑ |
| 10 | 팝업등록 | addPop.svg | `icon_addPop` | ↑ |
| 11 | 일정등록 | addSchdule.svg | `icon_addSchdule` ⚠ | ↑ |
| 12 | 운용지시서 | bank.svg | `icon_bank` | ↑ |
| 13 | **결재상신** | approv.svg | `icon_approv` | ↑ |
| 14 | 전송 | send.svg | `icon_send` | Send |
| 15 | 수정 | writing.svg | `icon_writing` | Modify |
| 16 | 저장 | save.svg | `icon_save` | Save |
| 17 | 소계표시 | sum.svg | `icon_sum` | Function |
| 18 | 계산 | calculator.svg | `icon_calculator` | ↑ |
| 19 | 채팅 | chat.svg | `icon_chat` | ↑ |
| 20 | 예산편성내역 | hstryDOC.svg | `icon_hstryDOC` | ↑ |
| 21 | 가져오기(붙여넣기) | paste.svg | `icon_paste` | ↑ |
| 22 | 반영하기(가져오기) | apply.svg | `icon_apply` | ↑ |
| 23 | 반영하기(다른곳에) | arrowUpOnSquare.svg | `icon_arrowUpOnSquare` | ↑ |
| 24 | 양식 다운로드 | downDOC.svg | `icon_downDOC` | Document |
| 25 | 업로드 / 양식업로드 | cloudUpload.svg | `icon_cloudUpload` | ↑ |
| 26 | 동기화 | cloudSync.svg | `icon_cloudSync` ⚠ | ↑ |
| 27 | 위로이동 | arrowUp.svg | `icon_arrowUp` | Grid Array |
| 28 | 아래로이동 | arrowDown.svg | `icon_arrowDown` | ↑ |
| 29 | (제목 없음) | bars-arrow-up.svg | (없음) | ↑ |
| 30 | (제목 없음) | bars-arrow-down.svg | (없음) | ↑ |
| 31 | 행추가 | addRow.svg | `icon_addRow` | Grid Column/Row |
| 32 | 행삽입 | insertRow.svg | `icon_insertRow` ⚠ | ↑ |
| 33 | 행삭제 | delRow.svg | `icon_delRow` | ↑ |
| 34 | 빈행삭제 | delEmpty.svg | `icon_eraser` ⚠ | ↑ |
| 35 | 셀추가 | addCell.svg | `icon_addCell` | ↑ |
| 36 | 카드형 | gridBlock.svg | `icon_gridBlock` | Grid Type |
| 37 | 리스트형 | queueList.svg | `icon_queueList` | ↑ |
| 38 | 일정삭제 | delSchdule.svg | `icon_delSchdule` ⚠ | Delete |
| 39 | **삭제** | trash.svg | `icon_trash` | ↑ |
| 40 | **인쇄** | print.svg | `icon_print` | Print |
| 41 | 엑셀 업로드 | excelUP.svg | `icon_excelUP` | Export |
| 42 | **엑셀** | excel.svg | `icon_excel` | ↑ |
| 43 | **도움말** | question | `icon_question` | Help |

---

## 🚨 시트의 클래스명을 그대로 복사하지 말 것

시트에는 클래스명이 두 열(`class name`, `button 내 표현`)에 적혀 있는데 **5행에서 서로 다르고,
어느 쪽이 맞는지가 행마다 뒤바뀐다.** 위 표의 `class name` 열은 이미 CSS 실측으로 교정한 값이다.

`theme.css`(`css/sass/theme.css`) 대조 결과:

| # | 버튼 | 시트 `class name` | 시트 `button 내 표현` | 어느 열이 맞나 |
|--:|------|------------------|---------------------|--------------|
| 11 | 일정등록 | `icon_addSchdule` ✅ | `icon_addschdule` ❌ | class name 열 |
| 26 | 동기화 | `icon_cloudSync` ✅ | `icon_sync` ❌ | class name 열 |
| 32 | 행삽입 | `icon_insetRow` ❌ | `icon_insertRow` ✅ | 표현 열 |
| 34 | 빈행삭제 | `eraser` ❌ | `icon_eraser` ✅ | 표현 열 |
| 38 | 일정삭제 | `icon_delSchdule` ✅ | `icon_delschdule` ❌ | class name 열 |

검증 명령:

```bash
grep -c "\.icon_XXX\b" KiiPS-UI/src/main/resources/static/css/sass/theme.css
# 0 이면 그 클래스는 존재하지 않는다 → 아이콘이 에러 없이 "빈칸"으로 렌더된다
```

> ⚠️ 존재하지 않는 아이콘 클래스는 **콘솔 에러를 내지 않고 조용히 빈칸**이 된다.
> (폰트어썸 아이콘도 동일 — `project_kiips_fontawesome_icon_verification` 참조)
> ⚠️ CSS 셀렉터는 대소문자를 구분한다. `icon_delschdule` 과 `icon_delSchdule` 은 다른 클래스다.

---

## 실제 화면 대조 (정본이 코드와 맞는지 확인한 예)

| 화면 | 버튼 배열 | 정본 순번 |
|------|----------|----------|
| IL0436 | 조회 → 등록 → 결재상신 → 인쇄 → 엑셀 → 도움말 | 4 → 7 → 13 → 40 → 42 → 43 ✅ |
| IL2501 | 조회 → 등록 → 결재상신 → 전송 → 삭제 → 인쇄 → 엑셀 → 도움말 | 4 → 7 → 13 → 14 → 39 → 40 → 42 → 43 ✅ |
| IL0803 | 조회 → 등록 → 삭제 → 엑셀 → 도움말 | 4 → 7 → 39 → 42 → 43 ✅ |

**엑셀(42)이 도움말(43) 바로 앞**이라는 점이 실무에서 가장 자주 어긋난다.
엑셀은 `inc_excel_button.jsp` 가 강제로 `btn-primary`(채움 드롭다운)로 렌더하므로,
순서가 틀리면 **채워진 파란 버튼이 줄 가운데 박혀** 배열이 눈에 띄게 어색해진다.
채움/아웃라인 규칙은 SKILL.md Part 4 참조.
