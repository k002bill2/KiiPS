---
id: realgrid-excel-export
trigger: "RealGrid Excel 내보내기 기능 구현 시"
confidence: 0.7
domain: "realgrid-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 8
---

# RealGrid Excel 내보내기 패턴

## Action
Excel 내보내기는 `gridExport()` 유틸 함수 사용:

```javascript
gridView.exportGrid({
  type: "excel",
  target: "local",
  fileName: "export_" + new Date().toISOString().slice(0,10) + ".xlsx",
  showProgress: true,
  // 헤더 설정
  header: "default",
  // 숨겨진 컬럼 제외
  hideColumns: hiddenColumns,
  // 다국어 헤더 사용 시
  headerCallback: function(grid, column, exportHeader) {
    return exportHeader;
  }
});
```

## Evidence
- RealGrid 2.6.3 exportGrid API
- KiiPS 표준 Excel 내보내기 패턴
