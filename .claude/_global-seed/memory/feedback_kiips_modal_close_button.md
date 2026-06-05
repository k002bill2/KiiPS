---
name: KiiPS 모달 Close 버튼은 커스텀 테마 패턴 (Bootstrap 아님)
description: 모달 닫기 버튼은 Bootstrap의 btn-close/button.close가 아닌 KiiPS 커스텀 a 태그 패턴. 반드시 SY0217/SY0210 패턴 복제
type: feedback
originSessionId: d9983b69-cd43-4721-94ad-06156432e5f6
---
KiiPS 모달의 우측 상단 닫기(×) 버튼은 **Bootstrap 표준이 아닌 KiiPS 커스텀 테마 패턴**을 사용한다. Bootstrap `btn-close`(BS5)나 `button.close`(BS4)를 쓰면 검정 네모 박스로 깨져서 보인다.

**표준 패턴 (Always use this)**:
```html
<div class="modal-header">
    <h2 class="card-title py-2" id="xxxTitle">제목<span class="card-actions mt-2 mr-2"><a href="#" class="card-action card-action-dismiss modal-dismiss" data-dismiss="modal"></a></span></h2>
</div>
```

**핵심 규칙**:
- `<a>` 태그 (버튼이 아님)
- 클래스 3개 조합: `card-action card-action-dismiss modal-dismiss`
- `card-actions` 래퍼는 **`h2.card-title` 내부 인라인**에 위치 (header 플렉스 자식 아님)
- `data-dismiss="modal"`로 Bootstrap dismiss 동작은 사용 (이것만 BS)
- 아이콘은 `card-action-dismiss` 클래스가 CSS 배경으로 그려줌 → `<span>&times;</span>` 같은 텍스트 노드 불필요

**Why**: KiiPS UI는 SB Admin 계열 커스텀 테마 기반이라 `card-action-dismiss` CSS 클래스가 프레임워크 전역에 정의되어 있고, Bootstrap의 `btn-close`/`close` 스타일과 충돌한다. `h2.card-title` 내부에 액션을 넣는 것도 테마 CSS의 포지셔닝 규칙 때문.

**How to apply**:
- 새 모달 만들 때 `SY0217.jsp:121` 또는 `SY0210.jsp:52`를 복제 시작점으로 사용
- 닫기 버튼에 텍스트("✕", "&times;")를 넣거나 `<span>` 자식을 넣지 말 것
- 여백은 `py-2`(제목) + `mt-2 mr-2`(actions) 표준 유지

**실수 이력 (2026-04-22)**: AC1028.jsp 대시보드 설정 모달을 Bootstrap 5 `btn-close`, 이후 Bootstrap 4 `button.close`로 두 번 잘못 작성. 스크린샷에서 "검정 네모 박스" 지적받은 후 SY0217/SY0210 실제 마크업 확인하고 `card-action-dismiss` 패턴으로 교체.

**참조 파일**:
- `SY0217.jsp:121` — 위젯 정보 모달 (표준)
- `SY0210.jsp:52, 120` — 펀드등록/LP보고설정 모달 (동일 패턴)
- `AC1028.jsp:87-89` — 대시보드 설정 모달 (수정 완료본)
- 스킬 가이드: `.claude/skills/kiips-ui-component-builder/SKILL.md` 섹션 0 "모달 Close 버튼"
