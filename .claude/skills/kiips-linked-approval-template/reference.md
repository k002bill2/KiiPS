# LinkedApproval 상세 레퍼런스

## 인라인 스타일 규칙

| 요소 | 스타일 |
|------|--------|
| **th (헤더)** | `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1` |
| **td (값)** | `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;` |
| **금액 td** | 위 스타일 + `text-align:right` |
| **colspan 행** | `colspan='3'` (4컬럼 테이블에서 값이 3칸 차지) |

### 테이블 행 패턴 (th + td)

```javascript
XXX신청 +="    <tr>";
XXX신청 +="        <th style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1'>항목명</th>";
XXX신청 +="        <td style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;'>##VAL1##</td>";
XXX신청 +="        <th style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1'>항목명2</th>";
XXX신청 +="        <td style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;'>##VAL2##</td>";
XXX신청 +="    </tr>";
```

### colspan 행 패턴 (값이 3칸 차지)

```javascript
XXX신청 +="    <tr>";
XXX신청 +="        <th style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1'>비고</th>";
XXX신청 +="        <td colspan='3' style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;'>##VAL_BIGO##</td>";
XXX신청 +="    </tr>";
```

### 금액 행 패턴 (우측 정렬)

```javascript
XXX신청 +="        <td style='padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:right'>##VAL_AMT##</td>";
```

## 플레이스홀더 규칙

- 단일 값: `##VAL1##`, `##VAL2##`, ... 형식
- 그리드 데이터: `##VAL_GRID##` 등으로 tbody 내부에 배치
- 첨부파일: `##VAL_FILE##`

## 데이터 접근 패턴

| 패턴 | 사용 예시 | 설명 |
|------|----------|------|
| `data.VIEW` | 자기개발비, 출입카드 | 객체 직접 접근 |
| `data.VIEW[0]` | 선물신청2 | 배열의 첫 번째 |
| `data.LIST[0]` | 명함신청 | 리스트 조회 |
| `data.PGxxxxVIEW.body.body.LIST[0]` | 복리후생 | API 응답 래핑 구조 |

## StringUtil 함수

| 함수 | 용도 | 예시 |
|------|------|------|
| `StringUtil.nvl(val, '')` | null/undefined 대체 | 대부분의 텍스트 필드 |
| `StringUtil.toDate(val, "-")` | 날짜 포맷 (YYYYMMDD → YYYY-MM-DD) | 신청일, 사용일 |
| `StringUtil.addComma(val)` | 천단위 콤마 | 금액 필드 |
| `StringUtil.phoneFomatter(val)` | 전화번호 포맷 | 전화/핸드폰 |
| `.replaceAll("\n", "<br/>")` | 줄바꿈 → HTML | 비고 필드 (**escapeHtml 후 적용**) |

## XSS 방어 분류

| 필드 유형 | XSS 위험도 | 처리 |
|----------|-----------|------|
| 시스템 코드값 (TPCD, GBN_CD) | 낮음 | `StringUtil.nvl()` |
| 이름, 코드명 (NM, TPNM) | 낮음 | `StringUtil.nvl()` |
| 날짜 (DT, YMD) | 낮음 | `StringUtil.toDate()` |
| 금액 (AMT, PRICE) | 낮음 | `StringUtil.addComma()` |
| **사용자 자유입력 (BIGO, REASON)** | **높음** | **`escapeHtml()` 필수** |
| **파일명 (FILE_NM)** | **중간** | **`escapeHtml()` 권장** |
