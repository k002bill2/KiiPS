# LinkedApproval 예제

## 예제 1: 자기개발비신청 (DOC9999844, PG 모듈)

### 기본 정보

- **대상 파일**: `LinkedApprovalCode_PG.js` (HTML), `LinkedApproval_PG.js` (바인딩)
- **HTML 구조**: 기본정보 테이블(4col: 15%/35%/15%/35%) + 첨부파일 테이블(2col: 15%/85%)
- **데이터 접근**: `data.VIEW` (객체 직접)

### 필드 매핑

| 플레이스홀더 | DB 필드 | StringUtil | XSS |
|-------------|---------|-----------|-----|
| `##VAL1##` | `APLY_DT` | `toDate(val, "-")` | 불필요 |
| `##VAL2##` | `APLY_EMP_CUST_NM` | `nvl(val, '')` | 불필요 |
| `##VAL3##` | `APLY_GBN_TPNM` | `nvl(val, '')` | 불필요 |
| `##VAL4##` | `APLY_AMT` | `addComma(val)` | 불필요 |
| `##VAL5##` | `STLM_MTD_TPNM` | `nvl(val, '')` | 불필요 |
| `##VAL6##` | `COST_ACCT_NO` | `nvl(val, '')` | 불필요 |
| `##VAL7##` | `BIGO` | `nvl(val, '')` + 줄바꿈 | **escapeHtml 필수** |
| `##VAL8##` | `FILE_NM` | `nvl(val, '')` | **escapeHtml 권장** |

### 바인딩 코드

```javascript
else if (doc_id == 결재_연계_자기개발비신청) {
    let contents = 자기개발비신청;
    let VIEW = data.VIEW;

    contents = contents.replace('##VAL1##', StringUtil.toDate(VIEW.APLY_DT, "-"));
    contents = contents.replace('##VAL2##', StringUtil.nvl(VIEW.APLY_EMP_CUST_NM, ''));
    contents = contents.replace('##VAL3##', StringUtil.nvl(VIEW.APLY_GBN_TPNM, ''));
    contents = contents.replace('##VAL4##', StringUtil.addComma(VIEW.APLY_AMT));
    contents = contents.replace('##VAL5##', StringUtil.nvl(VIEW.STLM_MTD_TPNM, ''));
    contents = contents.replace('##VAL6##', StringUtil.nvl(VIEW.COST_ACCT_NO, ''));
    contents = contents.replace('##VAL7##', escapeHtml(StringUtil.nvl(VIEW.BIGO, '')).replaceAll("\n", "<br/>"));
    contents = contents.replace('##VAL8##', escapeHtml(StringUtil.nvl(VIEW.FILE_NM, '')));
    return contents;
}
```
