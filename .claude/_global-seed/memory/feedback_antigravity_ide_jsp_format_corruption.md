---
name: feedback_antigravity_ide_jsp_format_corruption
description: Antigravity IDE format-on-save가 JSP 스크립틀릿/주석을 깨뜨림 — JSP는 자동 포맷 끄기
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 949209a0-d1af-427b-baea-4c32536e1f86
---

Antigravity IDE(또는 format-on-save)가 JSP 파일을 순수 HTML/JS로 간주하고 **전체 리포맷**하면 임베디드 Java가 깨진다. 2026-06-04 FD0201.jsp에서 발생, JSP 컴파일 실패(Whitelabel 500).

**구체적 손상 2종:**
- `<%--+ Number(lacAmt)--%>` (JSP 주석) → `<% --+ Number(lacAmt)-- %>` : `<%--`/`--%>`에 **공백 삽입**으로 주석이 깨진 스크립틀릿으로 변질
- `<% // 주석\n String X=... %>` : 포매터가 `//`주석 줄과 코드 줄을 **한 줄로 병합** → `//`가 선언을 통째로 주석 처리 → `cannot be resolved`

**Why:** JS/HTML 포매터는 `<% %>` 안이 Java라는 걸 모른다. `svn diff -w`(공백 무시)에도 691줄 변경 = 전체 리포맷 신호.

**How to apply:**
1. **JSP 편집 작업 시 Antigravity IDE의 format-on-save를 JSP에 대해 끌 것** (안 끄면 저장마다 재손상).
2. 증상(컴파일 에러)을 하나씩 땜질하지 말 것 — Jasper는 에러를 배치로 보고/중단하므로 표면화 안 된 손상이 남는다. **`svn revert` 후 의도 변경만 재적용**이 정석(승인 필수 → [[feedback_verify_before_answer]] 식 확인).
3. 진단법: `grep -cE "<% --|<% //"` 로 깨진 패턴 카운트, `svn diff -w` 라인 수로 리포맷 여부 판별, `svn cat -r BASE`로 원본 대조.
4. JS-only 재적용은 `base(컴파일됨) + JS = 컴파일 보장`(Spring Boot JSP는 런타임 컴파일이라 mvn으로 사전 검출 불가).

관련: [[project_antigravity_migration]] (Gemini→Antigravity 전환 중)
