---
id: realgrid-init-sequence
trigger: "RealGrid 그리드 초기화 코드 작성 시"
confidence: 0.8
domain: "realgrid-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 33
---

# RealGrid 초기화 순서

## Action
RealGrid 2.6.3 초기화 순서를 반드시 준수:

```javascript
// 1. DataProvider 생성
var dataProvider = new RealGrid.LocalDataProvider(false);

// 2. GridView 생성
var gridView = new RealGrid.GridView("gridContainer");

// 3. DataProvider 연결
gridView.setDataSource(dataProvider);

// 4. Fields 설정 (데이터 구조)
dataProvider.setFields(fields);

// 5. Columns 설정 (화면 표시)
gridView.setColumns(columns);

// 6. 옵션 설정
gridView.setOptions({ ... });
```

Fields → Columns 순서 역전 시 컬럼 매핑 오류 발생.

## Evidence
- 33회 realgrid-pattern 관찰
- KiiPS RealGrid 가이드 문서
