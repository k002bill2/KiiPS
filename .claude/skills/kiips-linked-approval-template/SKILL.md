---
name: kiips-linked-approval-template
description: KiiPS LinkedApproval 템플릿 생성 가이드 - 결재 연계 문서의 HTML 템플릿과 데이터 바인딩 로직 생성
Use when: 결재 상신, LinkedApproval, 결재 연계, 결재 템플릿, 상신 문서 생성
---

# KiiPS LinkedApproval 템플릿 생성 가이드

결재 연계 문서의 HTML 템플릿과 데이터 바인딩 로직을 생성합니다.

## 모듈별 파일 구조

LinkedApproval 파일은 **8개 모듈**별로 분리되어 있습니다.
작업 전 반드시 대상 모듈을 확인하세요.

| 모듈 | Code 파일 (HTML 템플릿) | Binding 파일 (데이터 바인딩) | 주요 문서 |
|------|------------------------|---------------------------|----------|
| **FD** | `LinkedApprovalCode_FD.js` | `LinkedApproval_FD.js` | 출자자명부, 확인서, 증서 |
| **AC** | `LinkedApprovalCode_AC.js` | `LinkedApproval_AC.js` | 일반전표, 지출결의서 |
| **IL** | `LinkedApprovalCode_IL.js` | `LinkedApproval_IL.js` | 투자금인출, Asset Allocation |
| **IV** | `LinkedApprovalCode_IV.js` | `LinkedApproval_IV.js` | 출자확인서 발행 |
| **PG** | `LinkedApprovalCode_PG.js` | `LinkedApproval_PG.js` | 의료비, 학자금, 경조금 |
| **RM** | `LinkedApprovalCode_RM.js` | `LinkedApproval_RM.js` | 고액현금거래, 의심거래 |
| **SY** | *(없음)* | `LinkedApproval_SY0213.js` | 거래처계좌관리 (특수: 화면번호 포함) |
| **DAOL** | `LinkedApprovalCode_daol.js` | *(없음)* | 실행품의 (특수: Code만 존재) |

**파일 경로**: `KiiPS-UI/src/main/resources/static/js/`

> **참고**: SY 모듈은 `LinkedApproval_SY0213.js`처럼 화면번호가 포함된 특수 네이밍을 사용합니다.
> DAOL 모듈은 Code 파일만 존재하며 Binding 로직은 별도 구조입니다.

## 새 템플릿 생성 절차

### Step 0: 사용자에게 확인할 정보

1. **대상 모듈** - FD/AC/IL/IV/PG/RM/SY/DAOL 중 어떤 모듈인지
2. **doc_id** - 결재 연계 문서 ID (예: `DOC9999XXX`)
3. **화면 레이아웃** - 스크린샷 또는 필드 목록
4. **데이터 접근 패턴** - API 응답 구조 (VIEW, LIST 등)
5. **특수 필드** - 그리드, 첨부파일, 이미지 등

### Step 1: doc_id 상수 등록

`LinkedApproval_{모듈}.js` 상단에 상수를 추가합니다.

```javascript
const 결재_연계_XXX신청 = "DOC9999XXX";
```

- 기존 상수 목록 확인 후 중복되지 않는 ID 사용

### Step 2: HTML 템플릿 작성

`LinkedApprovalCode_{모듈}.js` 끝에 템플릿을 추가합니다.

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

| 요소 | 스타일 |
|------|--------|
| **th (헤더)** | `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF; text-align:center; background-color:#F1F1F1` |
| **td (값)** | `padding: 4px 6px; border-right: 1px solid #BFBFBF; border-bottom: 1px solid #BFBFBF;` |
| **금액 td** | 위 스타일 + `text-align:right` |
| **colspan 행** | `colspan='3'` (4컬럼 테이블에서 값이 3칸 차지) |

#### 플레이스홀더 규칙

- `##VAL1##`, `##VAL2##`, ... 형식 사용
- 그리드 데이터는 `##VAL_GRID##` 등으로 tbody 내부에 배치

### Step 3: 데이터 바인딩 로직 작성

`LinkedApproval_{모듈}.js`의 `getApprvContent()` 함수 내에 분기를 추가합니다.

```javascript
else if (doc_id == 결재_연계_XXX신청) { //XXX신청
    let contents = XXX신청;
    let VIEW = data.VIEW;  // 또는 data.VIEW[0], data.PGxxxxVIEW 등

    // 시스템 코드값 필드 (XSS 위험 낮음)
    contents = contents.replace('##VAL1##', StringUtil.nvl(VIEW.FIELD_CD, ''));
    // 사용자 입력 필드는 반드시 escapeHtml 적용 (Step 4 참조)
    contents = contents.replace('##VAL2##', escapeHtml(StringUtil.nvl(VIEW.BIGO, '')));
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
| `.replaceAll("\n", "<br/>")` | 줄바꿈 → HTML | 비고 필드 (**escapeHtml 후 적용**) |

### Step 4: XSS 방어 (필수)

데이터 바인딩 시 사용자 입력 가능 필드는 반드시 이스케이프 처리합니다.

```javascript
// XSS 방어: 사용자 입력이 가능한 필드는 escapeHtml 적용
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// 적용 예시
contents = contents.replace('##VAL1##', escapeHtml(StringUtil.nvl(VIEW.BIGO, '')));
```

> **주의**: `StringUtil.nvl()`만으로는 XSS를 방어할 수 없습니다. 비고, 사유 등 사용자 자유입력 필드는 반드시 `escapeHtml()` 래핑이 필요합니다.

### Step 5: 검증 체크리스트

- [ ] JS 문자열 연결(`+=`) 구문 오류 없음
- [ ] `##VALx##` 플레이스홀더가 모두 replace에서 매핑됨
- [ ] 기존 테이블 인라인 스타일과 동일한 패턴 사용
- [ ] 사용자 입력 필드에 XSS 이스케이프 적용
- [ ] min.js 동기화 필요 여부 확인 (프로덕션 배포 시)
- [ ] 대상 모듈의 Code/Binding 파일에 정확히 추가되었는지 확인

## 예제: 자기개발비신청 (DOC9999844, PG 모듈)

- **대상 파일**: `LinkedApprovalCode_PG.js` (HTML), `LinkedApproval_PG.js` (바인딩)
- **HTML 구조**: 기본정보 테이블(4col: 15%/35%/15%/35%) + 첨부파일 테이블(2col: 15%/85%)
- **데이터 접근**: `data.VIEW` (객체 직접)
- **필드 매핑**: APLY_DT(날짜), APLY_EMP_CUST_NM, APLY_GBN_TPNM, APLY_AMT(금액), STLM_MTD_TPNM, COST_ACCT_NO, BIGO(줄바꿈), FILE_NM
