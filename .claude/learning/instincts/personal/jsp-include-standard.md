---
id: jsp-include-standard
trigger: "새 JSP 페이지 생성 시"
confidence: 0.8
domain: "jsp-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 31
---

# JSP 페이지 표준 Include 패턴

## Action
KiiPS JSP 페이지는 반드시 다음 include 구조를 따름:

```
페이지명.jsp
  ├── inc_filter_main.jsp (검색 필터)
  ├── inc_main_button.jsp (버튼 영역)
  └── inc_grid.jsp (그리드 영역, 필요 시)
```

새 페이지 생성 시 기존 유사 페이지를 참조하여 include 패턴 복제.

## Evidence
- 31회 jsp-pattern 관찰
- KiiPS JSP 경로: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/{도메인}/`
- 유사 파일명 주의: _P.jsp (팝업), _V.jsp (조회)
