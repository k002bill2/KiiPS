---
name: kiips-operator-onboarding
description: "Use when 신규 운용사 추가, 운용사 코드 등록, 로그인 페이지 분기, 신규 LIB 추가, LibConfiguration에 운용사 추가, operator onboarding, new tenant login — KiiPS 운용사별 로그인 페이지(LibConfiguration PRD/STG put 매핑, signup SCSS, 로고/배경 이미지, ?ver= 캐시버스팅) 구성. NOT for: 일반 SCSS/다크테마 편집(use kiips-scss), 신규 업무 화면 생성(use kiips-page-harness), 인증/로그인 보안 로직(use kiips-security-guide)"
---

# KiiPS 신규 운용사 로그인 페이지 온보딩 스킬

> 운용사 코드 한 단어(예: `HANWHA`)를 입력받아 신규 운용사의 로그인 페이지 분기를 자동으로 구성합니다.

## 1. 트리거 조건

다음 표현이 사용자 입력에 나타나면 활성화:
- "신규 운용사 추가", "운용사 등록", "{CODE} 운용사 추가해줘"
- "신규 LIB 추가", "LibConfiguration에 운용사 추가"
- "로그인 페이지 분기 만들어줘", "운용사별 로그인 화면 추가"
- "operator onboarding", "new tenant login"

## 2. 데이터 모델 (LibConfiguration 4-튜플)

```
put("{CODE}", "sign-{class}|logo_{file}|{LIB_NAME}|{signup_jsp}");
                 ↑           ↑            ↑          ↑
                 SCSS 클래스  로고 파일명  LIB DB명   JSP 파일명
```

| 필드 | PRD 예시 | STG 예시 | 비고 |
|------|---------|---------|------|
| CODE | `QUANTUM` | `QUANTUM` | 운용사 코드 (대문자) |
| sign-class | `sign-bg3` | `sign-bg3` | 동일 |
| logo_file | `logo_quantum` | `logo_quantum` | 동일 |
| LIB_NAME | `LIB_QNT` | `LIB_QNT_DEV` | **STG는 `_DEV` 접미사** |
| signup_jsp | `signup` 또는 `signup_quantum` | 동일 | 표준형=`signup`, 커스텀=`signup_{code}` |

**데모형 예외:** `LIB_{CODE}_DEMO` 사용 (예: `LIB_HANAFN_DEMO`)

## 3. 입력값 수집 (인터랙티브)

스킬 활성화시 사용자에게 질문 (이미 제공된 값은 건너뜀):

1. **운용사 코드** (대문자 영문, 예: `HANWHA`) — 필수
2. **운용사 한글명** (주석용, 예: `한화벤처스(주)`) — 필수
3. **유형 선택**:
   - `표준형` → `signup` JSP 재사용, `LIB_{CODE}` 명명
   - `데모형` → `signup` JSP 재사용, `LIB_{CODE}_DEMO` 명명
   - `커스텀형` → `signup_{code}.jsp` 신규 생성, `LIB_{CODE}` 명명
4. **SCSS sign 클래스 접미사** (예: `HANWHA`) — 기본값: 운용사 코드. 표준형이면 `sign-bg` 재사용 가능
5. **로고 파일명** (예: `logo_hanwha`) — 기본값: `logo_{code_lower}`
6. **DB LIB 명** (예: `LIB_HANWHA`) — 기본값: `LIB_{CODE}` (PRD), `LIB_{CODE}_DEV` (STG)

## 4. 파일 수정 매트릭스

스킬이 수정하는 파일 (정확한 라인 위치는 실행 시 grep으로 확정):

| # | 파일 | 작업 | HARD-GATE |
|---|------|------|-----------|
| 1 | `KiiPS-UTILS/.../LibConfiguration.java` `LIBList` (PRD) | `put()` 라인 추가 | ⚠️ KiiPS-UTILS는 고위험 모듈 |
| 2 | `KiiPS-UTILS/.../LibConfiguration.java` `LIB_STG_List` (STG) | `put()` 라인 추가 | ⚠️ 동일 |
| 3 | `KiiPS-UI/.../static/css/signup.scss` | `.sign-{CODE} { background... }` 추가 | 없음 (단, scss 컴파일 검증 필수) |
| 4 | `KiiPS-UI/.../jsp/kiips/signup/signup_{code}.jsp` (커스텀형만) | `signup.jsp` 기반 신규 생성 | 없음 |
| 5 | `KiiPS-UI/.../static/img/login/login_img_{code}.png` | **사람이 추가** (스킬은 placeholder 경로 안내만) | 디자이너 산출물 |
| 6 | `KiiPS-UI/.../static/img/logo_{code}.svg` | **사람이 추가** (placeholder 안내) | 디자이너 산출물 |
| 7 | `KiiPS-UI/.../jsp/kiips/signup/signup.jsp` 또는 `signup_{code}.jsp` | CSS/JS `?ver=` 캐시버스팅 갱신 | 없음 |
| 8 | `KiiPS-UI/.../sass/gui/_logos.scss` | **헤더 로고 `.logo_{CODE}` 클래스 정의 추가** (width/height/margin/background-url) | 없음 (단, scss 컴파일 검증 필수) |
| 9 | `KiiPS-UI/.../jsp/kiips/include/header.jsp:85` | `theme.css?ver=YYMMDD_N` 캐시버스팅 갱신 (_logos.scss 변경 동반) | 없음 |

## 5. 자동 생성 파이프라인 (4단계)

### Phase 1: 사전 검증 (READ-ONLY)

```bash
# 운용사 코드 중복 검사
grep -n "put(\"{CODE}\"," KiiPS-UTILS/src/main/java/com/kiips/util/LibConfiguration.java
# 결과 있으면 중단 + 사용자에게 보고

# SCSS 클래스 중복 검사
grep -n "\.sign-{CODE}\s*{" KiiPS-UI/src/main/resources/static/css/signup.scss

# 헤더 로고 클래스 중복 검사 (_logos.scss)
grep -n "\.logo_{CODE}\s*{" KiiPS-UI/src/main/resources/static/css/sass/gui/_logos.scss

# 이미지 파일 존재 확인 (로그인 배경 + 헤더 로고 SVG)
ls KiiPS-UI/src/main/resources/static/img/login/login_img_{code}.png 2>/dev/null
ls KiiPS-UI/src/main/resources/static/img/logo_{code}.svg 2>/dev/null
```

**중단 조건 (STOP IF):**
- 운용사 코드가 이미 PRD/STG 둘 중 한 곳에 존재 (주석 처리된 폐쇄 항목 제외)
- SCSS `.sign-{CODE}` 가 이미 정의됨
- 필수 입력값(코드/한글명/유형) 누락

### Phase 2: 변경 미리보기 + 사용자 승인 게이트

생성될 변경을 unified diff 형식으로 사용자에게 제시:

```
═══ 변경 미리보기 ═══
[1/4] KiiPS-UTILS/.../LibConfiguration.java  (PRD - LIBList)
  + put("HANWHA",  "sign-HANWHA|logo_hanwha|LIB_HANWHA|signup");  //한화벤처스(주)

[2/4] KiiPS-UTILS/.../LibConfiguration.java  (STG - LIB_STG_List)
  + put("HANWHA",  "sign-HANWHA|logo_hanwha|LIB_HANWHA_DEV|signup");  //한화벤처스(주)

[3/4] KiiPS-UI/.../static/css/signup.scss
  + .sign-HANWHA {
  +   background:transparent url(../img/login/login_img_hanwha.png) no-repeat 0 0 ;
  + }

[4/4] (커스텀형인 경우) signup_hanwha.jsp 신규 생성

⚠️ HARD-GATE: KiiPS-UTILS 모듈 수정. 진행하시겠습니까? [y/N]
```

**승인 없이 진행 금지.** 이는 `anti-rationalization.md` 의 다중 파일/고위험 게이트 정책 준수.

### Phase 3: 적용 (Edit 도구 사용)

승인 후 순차 적용:

1. **LibConfiguration.java 수정**
   - `LIBList` 의 마지막 `put(...)` 라인 직후에 신규 라인 삽입 (들여쓰기는 24 spaces 또는 기존 라인 패턴 그대로)
   - `LIB_STG_List` 도 동일 방식으로 신규 라인 삽입
   - 이미 폐쇄 처리된(`//` 주석) 라인 사이에 끼우지 말 것 — 활성 그룹 말미에 추가

2. **signup.scss 수정** (로그인 페이지 배경)
   - `sign-{기존마지막}` 블록 뒤에 신규 `.sign-{CODE}` 블록 추가 (들여쓰기 탭 기준 - 기존 패턴 따름)

3. **gui/_logos.scss 수정** (헤더 로고 — 🆕 누락 방지 step)
   - `.logo_{기존마지막}` 블록 뒤에 `.logo_{CODE}` 블록 추가
   - 표준 패턴:
     ```scss
     .logo_{CODE} {
       width: 140px;       /* 디자인에 맞게 조정 (60~180px 범위) */
       height: 60px;
       margin: 0 0 0 24px;
       background:url(../../img/logo_{code}.svg) no-repeat 0 center/contain;
     }
     ```
   - 디자이너 SVG 자산 미도착 시 **placeholder 패턴**: `background:url(...)` 부분을 CSS 주석 `/* ... */` 처리 + `/* TODO: 자산 도착 후 주석 해제 */` 헤더 코멘트 추가
   - 다크모드: 광역 필터 `[data-theme=dark] .header [class*="logo_"] { filter: brightness(0) invert(1); }` 가 자동 적용됨 → 별도 처리 불필요. 단색 로고만 `_wh.svg` 자산 별도 + 파일 하단 다크 오버라이드 블록에 추가

4. **(커스텀형만) signup_{code}.jsp 생성**
   - 가장 유사한 기존 파일(`signup_quantum.jsp` 등)을 base로 복사
   - `LIB_INDEX_IMG`, `LIB_LOGO` 변수는 그대로 (런타임 주입)
   - 운용사별 분기 로직만 코드에 맞춰 치환

5. **CSS/JS `?ver=` 캐시버스팅 갱신 (2종)**
   - **signup.jsp** line 50-51 (`?ver=YYYYMMDD` 패턴) — signup.scss 변경분 반영
   - **header.jsp:85** (`theme.css?ver=YYMMDD_N` 패턴) — _logos.scss 변경분 반영 🆕
   - 같은 운용사의 signup_{code}.jsp 도 동일 갱신

### Phase 4: 검증 (Evidence-based)

각 단계마다 검증 명령 실행. 실패시 즉시 보고 + 롤백 제안.

```bash
# 1. LibConfiguration 컴파일 가능성
grep -c "put(\"{CODE}\"," KiiPS-UTILS/src/main/java/com/kiips/util/LibConfiguration.java
# 기대값: 2 (PRD + STG)

# 2. SCSS 구문 검증 (scssValidator.sh 호출)
ls KiiPS-UI/src/main/resources/static/css/sass/  # 변환 경로 확인
# 또는 sass --check 또는 KiiPS-UI/CLAUDE.md 명시된 scssValidator.sh

# 3. JSP의 ?ver= 패턴 갱신 확인 (signup + header 둘 다)
grep -n "?ver=" KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/signup/signup.jsp
grep -n "theme.css?ver=" KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/include/header.jsp
# 오늘 날짜로 갱신됐는지 확인

# 3-b. Java↔SCSS 헤더 로고 일관성 (🆕 잠재 누락 자동 감지)
J=$(mktemp); S=$(mktemp)
grep -oE 'logo_[A-Za-z]+' KiiPS-UTILS/src/main/java/com/kiips/util/LibConfiguration.java | sort -u > "$J"
grep -oE '\.logo_[A-Za-z]+\s*\{' KiiPS-UI/src/main/resources/static/css/sass/gui/_logos.scss | sed 's/\.\(logo_[A-Za-z]*\).*/\1/' | sort -u > "$S"
comm -23 "$J" "$S"   # 기대: 빈 출력 (모든 LibConfiguration logo_* 가 _logos.scss에 정의됨)

# 4. 빌드 검증 (KiiPS-UTILS 변경)
cd KiiPS-HUB && mvn clean install -pl :KiiPS-UTILS -am
# 기대: BUILD SUCCESS

# 5. 이미지 placeholder 안내
echo "다음 이미지를 디자이너에게 요청하세요:"
echo "  - KiiPS-UI/src/main/resources/static/img/login/login_img_{code}.png (1140x664 권장)"
echo "  - KiiPS-UI/src/main/resources/static/img/logo_{code}.svg"
```

**완료 조건:** 5개 검증 모두 통과 + 사용자에게 이미지 추가 안내 완료.

## 6. 절대 금지 (DO NOT)

1. **인증 로직 수정 금지** — `LoginAPIController`, `LoginService`, Spring Security 설정은 손대지 말 것
2. **기존 운용사 매핑 변경 금지** — 신규 `put()` 추가만 허용, 기존 라인 수정 금지
3. **폐쇄(`//`) 처리된 라인 임의 부활 금지** — 비즈니스 의사결정 흔적
4. **DB 스키마 변경 금지** — 신규 LIB DB 생성/권한은 별도 DBA 작업 (스킬 범위 외)
5. **외부 CDN 링크 변경 금지** — Bootstrap/jQuery 버전 임의 변경 금지
6. **3개 파일 이상 변경시 사용자 승인 없이 진행 금지** — `multiFileGate.js` 자동 강제 (anti-rationalization.md)

## 7. 버전 캐시버스팅 (`?ver=`) 규칙

신규 SCSS 추가로 인한 캐시 갱신은 **반드시** 동반:

| JSP 파일 | 갱신 라인 패턴 | 트리거 |
|---------|--------------|---------|
| `signup.jsp` | `<link ... href="...signup.css?ver=YYYYMMDD">` | `signup.scss` 변경 |
| `signup_{code}.jsp` | (커스텀형 신규 생성시 자동 적용) | 신규 생성 |
| `include/header.jsp:85` 🆕 | `<link ... href="...theme.css?ver=YYMMDD_N">` | `_logos.scss` 또는 다른 theme 의존 SCSS 변경 |

**값 형식 (2종 공존):**
- `signup.jsp` 패턴: `YYYYMMDD` (예: `20260518`, 8자리)
- `header.jsp` 패턴: `YYMMDD_N` (예: `260518_0`, 6자리 + 시퀀스) — `kiips-scss` v3.2.0 의 `themeCssVerGuard.sh` 훅과 동일 규칙

`themeCssVerGuard.sh`가 PostToolUse로 SCSS 편집을 감지하면, 동일 SCSS의 버전이 갱신되지 않은 경우 경고합니다 — 이 스킬은 그 경고를 사전에 차단하기 위해 같은 트랜잭션에서 `?ver=` 도 갱신합니다.

## 8. 의존 스킬 & 훅

| 의존 | 용도 |
|------|------|
| `kiips-scss` 스킬 | SCSS 편집 표준 패턴 + 다크테마 색상 규칙 |
| `legacy-compliance-checker` 스킬 | Java 8 호환성 검증 (LibConfiguration 수정 후) |
| `themeCssVerGuard.sh` 훅 | `?ver=` 누락 자동 감지 (PostToolUse) |
| `multiFileGate.js` 훅 | 3+ 파일 변경 게이트 (자동) |
| `mybatisBindingGuard.js` 훅 | 이 스킬은 mapper.xml 미수정으로 무관 |

## 9. 실행 예시 (이상적 흐름)

```
User: HANWHA 운용사 신규 추가해줘. 표준형이고 한글명은 한화벤처스(주).
스킬 활성화 → kiips-operator-onboarding

[Phase 1] 검증
  ✓ HANWHA 코드 중복 없음
  ✓ .sign-HANWHA 미정의
  ⚠ 이미지 파일 없음 (placeholder 안내 예정)

[Phase 2] 미리보기
  +2 LibConfiguration.java (PRD + STG)
  +1 signup.scss
  버전갱신: signup.jsp ?ver=20250318 → ?ver=20260518
  [총 변경 파일: 3개]
  진행하시겠습니까? [y/N]

User: y

[Phase 3] 적용
  Edit: LibConfiguration.java (PRD list)
  Edit: LibConfiguration.java (STG list)
  Edit: signup.scss            (.sign-HANWHA 추가)
  Edit: gui/_logos.scss        (.logo_hanwha 추가 — 자산 미도착 시 background-url 주석)
  Edit: signup.jsp (?ver= 갱신)
  Edit: header.jsp:85 (theme.css?ver= 갱신)

[Phase 4] 검증
  ✓ put("HANWHA", ...) 2회 확인
  ✓ .sign-HANWHA 블록 1개 추가됨
  ✓ .logo_hanwha 블록 1개 추가됨
  ✓ Java↔SCSS logo 일관성: comm -23 빈 출력 (누락 0건)
  ✓ signup.jsp ?ver=20260518 갱신 확인
  ✓ header.jsp theme.css?ver=260518_0 갱신 확인
  ⏳ mvn install -pl :KiiPS-UTILS 실행 중... BUILD SUCCESS
  📌 다음 이미지를 디자이너에게 요청하세요:
     - login_img_hanwha.png (1140x664)
     - logo_hanwha.svg  (도착 후 _logos.scss의 background-url 주석 해제)
```

## 10. 보안 / 외부 의존성 고려

- **security_sensitive:** 인증 로직(`LoginAPIController`, `LoginService`)은 절대 미수정. 이 스킬은 **표현 계층(presentation layer)** 만 다룸.
- **external_dependency:** 외부 CDN 링크, 외부 도메인 매핑(`LoginDao.getLIB`) 은 별도 요청시에만 수정 — 기본 흐름에서 제외.
- **PHI/PII 없음:** 운용사 코드/한글명은 공개 메타데이터. 비밀번호/토큰 노출 위험 없음.

## 11. 트러블슈팅

| 증상 | 원인 | 조치 |
|------|------|------|
| 신규 운용사 URL 접근시 `main_intro.jsp` 로 폴백 | `LibConfiguration.put()` 누락 또는 코드 오타(대소문자) | 두 HashMap 모두 대문자 코드 확인 |
| 로그인 페이지 배경 흰 화면 | `.sign-{CODE}` 클래스 누락 또는 이미지 파일 없음 | SCSS 컴파일 + 이미지 파일 경로 확인 |
| 로고 X자(broken image) | `logo_{file}.svg/png` 파일 미배치 | `/img/` 직하 경로 확인 |
| **헤더 로고 영역이 아예 안 보임 (빈 공간)** 🆕 | `_logos.scss`에 `.logo_{CODE}` 클래스 정의 누락 (SVG 파일은 있어도 CSS 셀렉터 매칭 안 됨) | `grep "\.logo_{CODE}" sass/gui/_logos.scss` 로 확인 후 누락이면 표준 블록 추가 + header.jsp ver 갱신 |
| 캐시된 옛 스타일 표시 | `?ver=` 갱신 누락 (signup.jsp 또는 header.jsp) | `themeCssVerGuard.sh` 훅 알림 확인 후 수동 갱신 |
| `mvn install` 실패: 중복 키 | 동일 운용사 코드 이중 등록 | 새로 추가한 `put()` 제거 후 재시도 |

## 12. 변경 이력 추적

신규 운용사 추가시 SVN 커밋 메시지 표준:
```
[KiiPS-UTILS][KiiPS-UI] feat: {운용사 한글명}({CODE}) 로그인 페이지 추가

- LibConfiguration: PRD/STG 매핑 추가
- signup.scss: .sign-{CODE} 배경 클래스 추가
- 이미지 별도 커밋 예정 (디자이너 산출물)
```

## 13. 스킬 한계

- 이 스킬은 **로그인 페이지 표현 계층 자동화**만 담당합니다.
- 신규 운용사 DB 사용자 생성, 권한 설정, 데이터 마이그레이션은 **별도 DBA/Ops 작업** 입니다.
- 도메인 매핑(`LoginDao.getLIB`) 수정이 필요한 경우, 사용자가 명시적으로 요청해야 합니다.
- 이미지 산출물(PNG/SVG)은 디자이너 협업 산출물이므로 스킬은 placeholder 경로만 안내합니다.
