# KiiPS Checklist List Popup — API 네이밍 · 결재상태 매트릭스 · 유형 카탈로그

## 6. API 네이밍 규칙

| 기능 | URL 패턴 | Method | 예시 |
|------|----------|--------|------|
| 목록 조회 | `/ILAPI/IL0120/CHK/LIST` | POST | 공통 목록 엔드포인트 |
| 상세 조회 | `/ILAPI/IL0120/{DOMAIN}/VIEW` | POST | `/AF/VIEW`, `/DD/VIEW` |
| 등록 | `/ILAPI/IL0120/{DOMAIN}/SAVE` | POST | `/AF/SAVE` |
| 수정 | `/ILAPI/IL0120/{DOMAIN}/UPDATE` | POST | `/AF/UPDATE` |
| 삭제 | `/ILAPI/IL0120/{DOMAIN}/DEL` | POST | `/AF/DEL` |

{DOMAIN}은 체크리스트 약어(AF=인수금융, DD=Due Diligence, ESG, LAW, AA 등).

---

## 7. 결재상태코드 (APRV_STAT_TPCD) 처리 매트릭스

| 코드 | 의미 | 삭제 가능 | 결재 상신 가능 |
|------|------|----------|--------------|
| (null) | 미결재 | O | O |
| 2 | 진행 | X | X(진행 중) |
| 4 | 완료 | X | X(이미 완료) |
| 8 | 임시 | X | - |
| 10 | 수신 | X | - |

**필수 검증 로직** — 삭제 시 `2/4/8/10`은 `결재_삭제불가_INFO` 메시지로 차단, 결재 상신 시 `2/4`는 각각 `결재_진행_INFO`/`결재_완료_INFO`로 차단.

---

## 8. 체크리스트 유형별 카탈로그 (참고)

| 유형 코드 | 명칭 | 도메인 약어 | 샘플 파일 |
|----------|------|------------|----------|
| 40 | 인수금융 체크리스트 | AF | COMM_POPUP_CHECKLIST_AF_IMM.jsp |
| 43 | 투자계약서 점검 | IACHK | COMM_POPUP_CHECKLIST_IACHK.jsp |
| (그 외) | DD/ESG/LAW/AA | DD/ESG/LAW/AA | COMM_POPUP_CHECKLIST_*.jsp |

신규 체크리스트 목록 팝업을 만들 때는 본 스킬의 템플릿을 복사 → 유형 코드·도메인 약어만 치환하면 됩니다.
