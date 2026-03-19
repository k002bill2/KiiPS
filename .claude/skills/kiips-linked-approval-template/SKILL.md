---
name: kiips-linked-approval-template
description: "결재 연계 문서(LinkedApproval)의 HTML 템플릿과 데이터 바인딩 로직을 생성합니다. Use when: 결재, 상신, LinkedApproval, 결재 연계, 결재 템플릿, 상신 문서"
argument-hint: "[모듈코드] [doc_id] [문서명]"
allowed-tools: Read, Grep, Glob, Edit, Write
---

# KiiPS LinkedApproval 템플릿 생성

결재 연계 문서의 HTML 템플릿 + 데이터 바인딩 로직을 생성합니다.

## 현재 LinkedApproval 파일 현황

!`ls KiiPS-UI/src/main/resources/static/js/LinkedApproval*.js 2>/dev/null | sort`

## 인자 처리

- **모듈코드**: $ARGUMENTS[0] (FD/AC/IL/IV/PG/RM/SY/DAOL)
- **doc_id**: $ARGUMENTS[1] (예: DOC9999XXX)
- **문서명**: $ARGUMENTS[2] (예: 자기개발비신청)

인자가 없으면 사용자에게 확인하세요:
1. 대상 모듈 (FD/AC/IL/IV/PG/RM/SY/DAOL)
2. doc_id (결재 연계 문서 ID)
3. 화면 레이아웃 (스크린샷 또는 필드 목록)
4. 데이터 접근 패턴 (VIEW, LIST 등)

## 모듈별 파일 구조

| 모듈 | Code 파일 (HTML) | Binding 파일 (바인딩) | 비고 |
|------|-----------------|---------------------|------|
| **FD** | `LinkedApprovalCode_FD.js` | `LinkedApproval_FD.js` | 출자자명부, 확인서 |
| **AC** | `LinkedApprovalCode_AC.js` | `LinkedApproval_AC.js` | 일반전표, 지출결의서 |
| **IL** | `LinkedApprovalCode_IL.js` | `LinkedApproval_IL.js` | 투자금인출 |
| **IV** | `LinkedApprovalCode_IV.js` | `LinkedApproval_IV.js` | 출자확인서 |
| **PG** | `LinkedApprovalCode_PG.js` | `LinkedApproval_PG.js` | 의료비, 학자금, 경조금 |
| **RM** | `LinkedApprovalCode_RM.js` | `LinkedApproval_RM.js` | 고액현금거래 |
| **SY** | *(없음)* | `LinkedApproval_SY0213.js` | 화면번호 포함 네이밍 |
| **DAOL** | `LinkedApprovalCode_daol.js` | *(없음)* | Code만 존재 |

**파일 경로**: `KiiPS-UI/src/main/resources/static/js/`

## 생성 절차 (5단계)

### Step 1: doc_id 상수 등록

`LinkedApproval_{모듈}.js` 상단에 추가:

```javascript
const 결재_연계_XXX신청 = "DOC9999XXX";
```

### Step 2: HTML 템플릿 작성

`LinkedApprovalCode_{모듈}.js` 끝에 추가. 상세 스타일 규칙은 [reference.md](reference.md) 참조.

> **개행 금지 규칙**: `변수명 +="문자열";`은 반드시 **한 줄**로 작성. `+=`와 문자열을 별도 줄로 분리하지 않는다.
> ```javascript
> // ✅ 올바름 — 한 줄
> XXX신청 +="    <table width='100%' border='0' align='center' cellpadding='0' cellspacing='0' style='margin-top:6px; margin-bottom:10px; border-collapse: collapse; border: 1px solid #BFBFBF; font-size:10pt'>";
>
> // ❌ 금지 — += 와 문자열이 분리됨
> XXX신청 +=
> "    <table width='100%' border='0' ...>";
> ```

```javascript
//===================
//XXX신청 템플릿
//===================
XXX신청 ="";
XXX신청 +="<table width='100%' border='0' align='center' cellpadding='0' cellspacing='0' style='margin-top:6px; margin-bottom:20px; border-collapse: collapse; border: 1px solid #BFBFBF; font-size: 10pt'>";
XXX신청 +="    <col width='15%' /><col width='35%' /><col width='15%' /><col width='35%' />";
XXX신청 +="    <tbody>";
// ... rows (th/td 패턴은 reference.md 참조) ...
XXX신청 +="    </tbody>";
XXX신청 +="</table>";
```

### Step 3: 데이터 바인딩 작성

`LinkedApproval_{모듈}.js`의 `getApprvContent()` 내 분기 추가:

```javascript
else if (doc_id == 결재_연계_XXX신청) {
    let contents = XXX신청;
    let VIEW = data.VIEW;
    // 시스템 코드값 (XSS 위험 낮음)
    contents = contents.replace('##VAL1##', StringUtil.nvl(VIEW.FIELD_CD, ''));
    // 사용자 입력 필드는 반드시 escapeHtml 적용
    contents = contents.replace('##VAL2##', escapeHtml(StringUtil.nvl(VIEW.BIGO, '')));
    return contents;
}
```

StringUtil 함수, 데이터 접근 패턴 상세는 [reference.md](reference.md) 참조.

### Step 4: XSS 방어 (필수)

사용자 자유입력 필드(비고, 사유 등)는 반드시 `escapeHtml()` 래핑:

```javascript
function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;')
        .replace(/>/g, '&gt;').replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
```

> `StringUtil.nvl()`만으로는 XSS 방어 불가. 줄바꿈 변환(`.replaceAll("\n", "<br/>")`)은 escapeHtml 후 적용.

### Step 5: 검증 체크리스트

- [ ] JS 문자열 연결(`+=`) 구문 오류 없음
- [ ] `##VALx##` 플레이스홀더가 모두 replace에서 매핑됨
- [ ] 기존 인라인 스타일 패턴과 동일
- [ ] 사용자 입력 필드에 XSS 이스케이프 적용
- [ ] min.js 동기화 필요 여부 확인
- [ ] 대상 모듈의 Code/Binding 파일에 정확히 추가 확인

## 추가 리소스

- 인라인 스타일 규칙, StringUtil 함수, 데이터 접근 패턴 상세: [reference.md](reference.md)
- 자기개발비신청 완성 예제: [examples.md](examples.md)
