---
name: kiips-linked-approval-template
description: "Use when 결재 연계 문서(LinkedApproval)의 HTML 템플릿·데이터 바인딩을 추가/생성할 때: 결재, 상신, LinkedApproval, 결재 연계, 결재 템플릿, 상신 문서, LinkedApprovalCode_*.js, getApprvContent. NOT for: SQL/${} 바인딩(use kiips-mybatis-guide), 일반 인증·보안(use kiips-security-guide)"
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

### Step 6: HTML 미리보기 파일 생성 (필수 자동 실행)

작성한 결재 양식을 즉시 브라우저에서 리뷰할 수 있도록 **독립 HTML 파일을 자동 생성**한다. 이 단계는 스킬 종료 전 필수로 수행한다.

**출력 경로**

`KiiPS-UI/src/main/webapp/preview/{doc_id}_{sanitized_문서명}.html`

- `preview/` 폴더가 없으면 생성
- 문서명에서 공백·슬래시·특수문자 제거 후 사용
- 예: `KiiPS-UI/src/main/webapp/preview/DOC9999836_자기개발비신청.html`

**생성 절차**

1. Step 2에서 작성한 `{문서명} += ...` HTML 템플릿 문자열을 이어붙여 복원
2. Step 3의 `contents.replace('##VALx##', ...)` 매핑에서 DB 필드명 추출
3. 필드명 suffix 규칙으로 mock 값 결정 → `##VALx##` 치환 (XSS 필드는 `escapeHtml()` 결과로 치환)
4. 아래 독립 HTML 골격의 `{복원된 HTML 템플릿}` 위치에 치환 결과 삽입
5. 대상 경로에 파일 저장 (폴더 없으면 생성)
6. 사용자에게 파일 경로 및 `open file://...` 명령 안내

**Mock 데이터 규칙**

| 필드 suffix / 키워드 | Mock 값 |
|---------------------|---------|
| `_DT`, `_DATE`, `_YMD` | `2026-04-17` |
| `_AMT`, `_AMOUNT`, `금액` | `1,000,000` |
| `_NM`, `_NAME`, `명` | `홍길동` |
| `_CD`, `_CODE` | `001` |
| `_TPNM`, `구분` | `일반` |
| `_NO`, `_ACCT_NO` | `110-123-456789` |
| `BIGO`, `비고`, `SAUE`, `사유` | `샘플 비고 <script>alert(1)</script>\n두 번째 줄입니다.` |
| 기타 | `샘플값` |

> 비고/사유에 의도적으로 `<script>` 문자열을 포함시켜 Step 4의 `escapeHtml()`이 실제 동작하는지 미리보기로 검증한다. 생성된 HTML에서 `&lt;script&gt;`로 출력되어야 정상.

**독립 HTML 골격 (최소 래퍼)**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>{문서명} ({doc_id})</title>
</head>
<body>
<!-- doc_id: {doc_id} | 문서명: {문서명} | 생성: {YYYY-MM-DD HH:mm} -->
{복원된 HTML 템플릿 + mock 치환 결과}
</body>
</html>
```

**디자인 불변 원칙 (필수 준수)**

원본 `LinkedApprovalCode_*.js`의 HTML 문자열과 **완전히 동일한 렌더링 결과**를 목표로 한다. 미리보기용 디자인 요소를 일체 추가하지 않는다.

| 금지 항목 | 이유 |
|----------|------|
| 신규 CSS 클래스 추가 (`preview-wrap`, `preview-meta` 등) | 실 WAS 렌더링과 차이 발생 |
| `<style>` 블록 추가 (body margin, background, font-family 등) | 원본 템플릿은 모든 시각 속성을 인라인 style로만 표현 |
| 외부 `<link href>`, `<script src>` 참조 | 파일 단독 실행 불가, KiiPS CSS 의존 금지 |
| `<h1>`, `<header>`, 제목/메타 배너 등 리뷰용 UI 삽입 | 결재 양식 레이아웃 오염 |
| 폰트·색상·여백·배경 임의 변경 | 원본 인라인 style만 사용 |
| Dark theme, 반응형 미디어쿼리 등 추가 스타일 | 스코프 밖 |

**허용되는 요소 (이것만)**
- `<!DOCTYPE html>`, `<html lang="ko">`, `<head>`, `<meta charset>`, `<title>`, `<body>` — HTML 최소 골격
- `<body>` 직하위 **HTML 주석 1줄** (doc_id/문서명/생성일시 메타) — 시각 렌더링에 영향 없음
- `<body>` 직하위 **복원된 HTML 템플릿 그대로 삽입** (mock 값 치환만 수행)

> 작성 시 자문: "이 줄을 넣으면 실 WAS 렌더링과 pixel-diff가 발생하는가?" → yes면 넣지 않는다.

**완료 보고 형식**

```
✓ 미리보기 생성 완료
  파일: KiiPS-UI/src/main/webapp/preview/DOC9999836_자기개발비신청.html
  열기: open "file:///.../KiiPS-UI/src/main/webapp/preview/DOC9999836_자기개발비신청.html"
```

> **주의**: `preview/` 폴더는 리뷰용 산출물이므로 SVN 커밋 대상 아님. 최초 생성 시 `svn propset svn:ignore "*" KiiPS-UI/src/main/webapp/preview/` 권장.

## 추가 리소스

- 인라인 스타일 규칙, StringUtil 함수, 데이터 접근 패턴 상세: [reference.md](reference.md)
- 자기개발비신청 완성 예제: [examples.md](examples.md)
