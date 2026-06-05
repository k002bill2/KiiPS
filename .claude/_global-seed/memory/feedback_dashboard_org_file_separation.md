---
name: KiiPS 대시보드 기관별 분기는 파일 분리 + 공유 원본 불가침
description: KiiPS 기관(gGp_ident_no)별 대시보드 차이는 전용 JSP/JS 신설로 구현하되, 공유 fallback 파일(dashboard_KOLON 등)은 절대 수정하지 않는다
type: feedback
originSessionId: 402f15cf-e874-403b-80c9-96127053ce4d
---

KiiPS 대시보드에서 특정 기관에만 적용되는 위젯/레이아웃 차이는 **기관 전용 JSP/JS 파일을 신규 생성하고 `index.jsp`에서 서버 사이드 라우팅으로 분기**한다. **단, 다수 기관이 공유하는 fallback 파일(`dashboard_KOLON.jsp`/`.js`/`.min.js` 등)은 원본 그대로 유지하고 수정하지 않는다** — 전용 파일 쪽에서만 커스터마이징한다.

**Why:**
- 공유 fallback 파일은 LOGOS_DEV_LIB 외 다수 기관이 운영 중인 코드이므로, 위젯을 제거하거나 로직을 바꾸면 다른 기관에 회귀 리스크가 발생. 운영 안정성이 기능 분리의 이상론보다 우선.
- 운영 중 파일에 대한 "원본 정리(기능 제거)" 는 중복이 발생하더라도 별도 승인 없이 수행하지 않는 것이 사용자 의도. 기존 KOLON 사용자 경험 그대로 두고, LOGOS 는 별도 공간에서 자유롭게 진화시키는 방향.
- 기존 컨벤션: `dashboard_DAOL.jsp`, `dashboard_DCAMP.jsp`, `dashboard_NAVER.jsp`, `dashboard_FUTURESLAB.jsp` 모두 기관별 전용 JSP 신설 방식이며, 공유 fallback(KOLON)을 변경하는 사례는 없음.
- 2026-04-24 대화에서 "SLSRPT 위젯을 LOGOS_DEV_LIB 에만 노출" 요청에 대해, 처음 (1) 같은 JSP 내 `gGp_ident_no` JS 조건 분기를 제안 → 기각, (2) 파일 분리 + 공유 원본에서 SLSRPT 제거 접근 → "KOLON 3개 파일은 원복하라" 재지시.

**How to apply:**
- 특정 기관에만 위젯/레이아웃 차이가 필요하면 → `dashboard_{기관명}.jsp` / `dashboard_{기관명}.js` 를 공유 fallback 에서 복제하여 신규 생성 + `index.jsp` 에 `else if(sessionInfo.getGP_IDENT_NO().equals("..."))` 분기 추가.
- 공유 fallback(특히 `dashboard_KOLON.*`) 은 **읽기만** 하고 편집하지 않는다. 중복이 발생해도 허용.
- 공유 fallback 정리(중복 제거, 기능 이관 등)가 필요해 보이면 제안만 하고 사용자 명시적 지시가 있을 때만 수행.
- 전용 파일 쪽에서 나중에 LOGOS 전용 변경이 이루어지는 것이 정상 흐름 — 신설 후 바로 위젯 제거 등 동반 편집을 시도하지 말 것.
- 같은 JSP 내 한두 줄 수준의 사소한 차이는 조건 분기가 가능할 수 있으나, 공유 fallback 은 여전히 불가침.
