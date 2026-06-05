---
name: RealGrid 행 이동 표준 패턴 (KiiPS 검증됨)
description: KiiPS에서 RealGrid 2.6.3 행 드래그 이동 구현 시 반드시 써야 하는 API 조합. 잘못된 조합은 작동하지 않음
type: feedback
originSessionId: d9983b69-cd43-4721-94ad-06156432e5f6
---
KiiPS에서 RealGrid 행 드래그 이동을 구현할 때는 반드시 다음 조합을 사용해야 한다.

**올바른 패턴 (12+ 파일 검증됨)**:
```javascript
gridView.setEditOptions({ movable: true });
dataProvider.onRowMoved = function(provider, row, newRow) {
    // ORD 같은 순서 필드 재계산
    for (var i = 0; i < provider.getRowCount(); i++) {
        provider.setValue(i, "ORD", i + 1);
    }
    gridView.setCurrent({ dataRow: newRow });
};
```

**작동하지 않는 패턴(절대 금지)**:
```javascript
// ❌ rowMovable 단독은 드래그 자체가 안 됨
gridView.setDisplayOptions({ rowMovable: true });

// ❌ gridView.onRowsMoved는 존재하지 않는 API (복수형)
gridView.onRowsMoved = function() {...};
```

**Why**: KiiPS RealGrid 2.6.3에서 실제 드래그 이동을 활성화하는 옵션은 `editOptions.movable`이다. `displayOptions.rowMovable`은 일부 화면(AC0513, AC0201_POP, AC0103, AC02012)에서 보조 설정으로 쓰이지만 단독으로는 드래그가 작동하지 않는다. 이벤트도 `dataProvider`에 `onRowMoved`(단수)로 바인딩해야 하며, 시그니처는 `(provider, row, newRow)` 3개 인자.

**How to apply**:
- 행 이동 요구가 나오면 이 패턴을 즉시 적용
- 참조 파일: `SY0205.jsp:157-166`, `AC0104.jsp:115+179`, `SY0211.jsp`, `SY0221.jsp`, `AC0521.jsp`, `AC0522.jsp`, `AC0101.jsp`, `AC0102.jsp`
- 모달 내 RealGrid라면 `shown.bs.modal` 이벤트에 `resetSize()`도 필수
- 탐색 에이전트가 "rowMovable 사용"이라고 요약 보고하면 `editOptions.movable`이 함께 있는지 **직접 소스 확인**해야 함 (에이전트 요약 ≠ 증거)

**실수 이력 (2026-04-22)**: AC1028.jsp 대시보드 설정 모달 구현 시 `setDisplayOptions({rowMovable:true}) + onRowsMoved` 조합으로 작성해 드래그 미작동. 사용자 피드백 후 SY0205.jsp 실제 패턴을 직접 확인하고 교정.
