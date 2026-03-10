# KiiPS LinkedApproval 템플릿 생성 가이드

결재 연계 문서의 HTML 템플릿과 데이터 바인딩 로직을 생성하는 스킬입니다.

## 파일 구조

| 파일 | 역할 | 경로 |
|------|------|------|
| **LinkedApprovalCode_PG.js** | HTML 템플릿 (인라인 스타일 테이블) | `KiiPS-UI/src/main/resources/static/js/LinkedApprovalCode_PG.js` |
| **LinkedApproval_PG.js** | 상수 정의 + `getApprvContent()` 데이터 바인딩 | `KiiPS-UI/src/main/resources/static/js/LinkedApproval_PG.js` |

## 새 템플릿 생성 체크리스트

### 1. doc_id 상수 등록 (LinkedApproval_PG.js 상단)
```javascript
const 결재_연계_XXX신청 = "DOC9999XXX";
```
- 기존 상수 목록 확인 후 중복되지 않는 ID 사용

### 2. HTML 템플릿 작성 (LinkedApprovalCode_PG.js 끝)
```javascript
//===================
//XXX신청 템플릿
//===================

XXX신청 ="";

XXX신청 +="<table width='100%' border='0' align='center' cellpadding='0' cellspacing='0' style='margin-top:6px; margin-bottom:20px; border-collapse: collapse; border: 1px solid #BFBFBF; font-size: 10pt'>";
XXX신청 +="    <col width='15%' />";
XXX신청 +="    <col width='35%' />";
XXX신청 +="    <col width='15%' />";
XXX신청 +="    <col width='35%' />";
XXX신청 +="    <tbody>";
// ... rows ...
XXX신청 +="    </tbody>";
XXX신청 +="</table>";
```

#### 인라인 스타일 규칙
- **th (헤더)**: `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1`
- **td (값)**: `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;`
- **금액 td**: `text-align:right` 추가
- **colspan 행**: `colspan='3'` (4컬럼 테이블에서 값이 3칸 차지)

#### 플레이스홀더
- `##VAL1##`, `##VAL2##`, ... 형식 사용
- 그리드 데이터는 `##VAL_GRID##` 등으로 tbody 내부에 배치

### 3. 데이터 바인딩 로직 (LinkedApproval_PG.js - getApprvContent())
```javascript
else if (doc_id == 결재_연계_XXX신청) { //XXX신청
    let contents = XXX신청;
    let VIEW = data.VIEW;  // 또는 data.VIEW[0], data.PGxxxxVIEW 등

    contents = contents.replace('##VAL1##', ...);
    // ...
    return contents;
}
```

#### 데이터 접근 패턴
| 패턴 | 사용 예시 |
|------|----------|
| `data.VIEW` | 자기개발비, 출입카드 등 (객체 직접) |
| `data.VIEW[0]` | 선물신청2 등 (배열의 첫 번째) |
| `data.LIST[0]` | 명함신청 등 (리스트 조회) |
| `data.PGxxxxVIEW.body.body.LIST[0]` | 복리후생 등 (API 응답 래핑) |

#### StringUtil 함수
| 함수 | 용도 | 예시 |
|------|------|------|
| `StringUtil.nvl(val, '')` | null/undefined 대체 | 대부분의 텍스트 필드 |
| `StringUtil.toDate(val, "-")` | 날짜 포맷 (YYYYMMDD → YYYY-MM-DD) | 신청일, 사용일 |
| `StringUtil.addComma(val)` | 천단위 콤마 | 금액 필드 |
| `StringUtil.phoneFomatter(val)` | 전화번호 포맷 | 전화/핸드폰 |
| `.replaceAll("\n", "<br/>")` | 줄바꿈 → HTML | 비고 필드 |

### 4. 검증
- [ ] JS 문자열 연결(`+=`) 구문 오류 없음
- [ ] ##VALx## 플레이스홀더가 모두 replace에서 매핑됨
- [ ] 기존 테이블 인라인 스타일과 동일한 패턴 사용
- [ ] min.js 동기화 필요 여부 확인 (프로덕션 배포 시)

## 예제: 자기개발비신청 (DOC9999844)

**HTML 구조**: 기본정보 테이블(4col: 15%/35%/15%/35%) + 첨부파일 테이블(2col: 15%/85%)
**데이터 접근**: `data.VIEW` (객체 직접)
**필드 매핑**: APLY_DT(날짜), APLY_EMP_CUST_NM, APLY_GBN_TPNM, APLY_AMT(금액), STLM_MTD_TPNM, COST_ACCT_NO, BIGO(줄바꿈), FILE_NM

## 사용법

사용자에게 다음 정보를 확인:
1. **doc_id** - 결재 연계 문서 ID
2. **화면 레이아웃** - 스크린샷 또는 필드 목록
3. **데이터 접근 패턴** - API 응답 구조 (VIEW, LIST 등)
4. **특수 필드** - 그리드, 첨부파일, 이미지 등
