# Detail Page Plan: [MODULE][SCREEN_ID] - [SCREEN_NAME]

**Status**: 🔄 진행 중
**Started**: [DATE]
**Last Updated**: [DATE]
**Estimated Time**: 2-4 hours
**Module**: KiiPS-[MODULE] (예: IL, FD, PG)
**Page ID**: [SCREEN_ID] (예: IL0501, FD0301)
**Developer**: [담당자명]

---

## ⚠️ 진행 규칙

**각 Phase 완료 후 반드시**:
1. ✅ Task 체크박스 완료 표시
2. 🔧 Quality Gate 검증 (브라우저 테스트)
3. 📅 "Last Updated" 날짜 업데이트
4. ➡️ 모든 검증 통과 후 다음 Phase 진행

---

## 📋 페이지 개요

### 기능 설명
[상세페이지의 목적과 주요 기능 설명]

**주요 표시 정보**:
- 헤더: [뒤로가기, 제목, 뱃지, 액션 버튼]
- 기본 정보 카드: [표시할 필드들]
- 상세 정보 카드: [표시할 필드들]
- 관련 데이터 그리드: [RealGrid 사용 여부]
- 차트: [ApexCharts 사용 여부]

### 완료 기준 (Success Criteria)
- [ ] 모든 데이터 정상 표시
- [ ] 반응형 레이아웃 동작 (768px, 480px)
- [ ] 뒤로가기 버튼 동작
- [ ] API 연동 완료
- [ ] 브라우저 콘솔 에러 없음

### 참조 페이지
- 기존 상세페이지: `IL0501.jsp`, `FD0301.jsp` 등
- 디자인 시스템: CSS Variables (`--cd-*`)

---

## 🚀 구현 Phase

### Phase 1: 레이아웃 설계 (30분)
**Goal**: 페이지 구조 및 HTML 뼈대 완성
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 1.1**: JSP 파일 생성
  - File: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/[MODULE]/[SCREEN_ID].jsp`
  - Details:
    - header.jsp include
    - CSS Variables 정의 (`:root`)
    - 기본 컨테이너 구조

- [ ] **Task 1.2**: 헤더 섹션 구현
  - Details:
    - `.cd-header` 컨테이너
    - 뒤로가기 버튼 (`.cd-back-btn`)
    - 제목 (`.cd-company-name`)
    - 뱃지 영역 (`.cd-badges`)
    - 액션 버튼 (`.cd-report-btn`)

- [ ] **Task 1.3**: 카드 레이아웃 구조
  - Details:
    - `.cd-grid` (2컬럼: 메인 + 사이드바)
    - `.cd-card` 컴포넌트
    - `.cd-card-header` (접기/펴기 지원)

#### Quality Gate ✋
- [ ] HTML 구조 렌더링 확인
- [ ] CSS Variables 적용 확인
- [ ] 기본 레이아웃 브라우저 확인

---

### Phase 2: 컴포넌트 구현 (1시간)
**Goal**: UI 컴포넌트 및 스타일 완성
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 2.1**: 정보 표시 컴포넌트
  - Details:
    - `.cd-info-list` (라벨-값 쌍)
    - `.cd-info-label`, `.cd-info-value`
    - 아이콘 표시 (FontAwesome)

- [ ] **Task 2.2**: 카드 접기/펴기 기능
  - Details:
    - `.cd-card-header` 클릭 이벤트
    - `.cd-card-body.collapsed` 토글
    - `.cd-chevron` 회전 애니메이션

- [ ] **Task 2.3**: RealGrid 그리드 (필요시)
  - Details:
    - GridView / DataProvider 초기화
    - 컬럼 정의
    - 금액 포맷팅 렌더러

- [ ] **Task 2.4**: ApexCharts 차트 (필요시)
  - Details:
    - 차트 타입 선택 (Pie, Bar, Line)
    - 반응형 옵션 설정

#### Quality Gate ✋
- [ ] 모든 컴포넌트 렌더링 확인
- [ ] 접기/펴기 동작 확인
- [ ] 그리드/차트 표시 확인 (해당시)

---

### Phase 3: API 연동 (1시간)
**Goal**: 백엔드 데이터 연동 완료
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 3.1**: API 호출 함수 작성
  - Details:
    ```javascript
    function loadDetailData(id) {
        $.ajax({
            url: '${KiiPS_[MODULE]}/[API_ENDPOINT]',
            type: 'POST',
            data: JSON.stringify({ id: id }),
            contentType: 'application/json',
            headers: { 'X-AUTH-TOKEN': token },
            success: function(response) {
                renderDetailData(response.body);
            },
            error: function(xhr) {
                console.error('API Error:', xhr);
            }
        });
    }
    ```

- [ ] **Task 3.2**: 데이터 렌더링 함수
  - Details:
    - 각 필드별 DOM 업데이트
    - 금액/날짜 포맷팅
    - Null 처리

- [ ] **Task 3.3**: 에러 처리
  - Details:
    - 로딩 인디케이터
    - 에러 메시지 표시
    - 재시도 버튼

#### Quality Gate ✋
- [ ] API 호출 성공 (Network 탭 확인)
- [ ] 데이터 정상 표시
- [ ] 에러 시나리오 테스트

---

### Phase 4: 반응형 + 접근성 검증 (30분)
**Goal**: 다양한 디바이스 및 접근성 지원
**Status**: ⏳ 대기

#### Tasks
- [ ] **Task 4.1**: 반응형 CSS 추가
  - Details:
    ```css
    @media (max-width: 768px) {
        .cd-header { height: auto; padding: 16px; }
        .cd-grid { grid-template-columns: 1fr; }
        .cd-company-name { font-size: 22px; }
    }
    @media (max-width: 480px) {
        .cd-header-inner { flex-direction: column; }
        .cd-report-btn { width: 100%; }
    }
    ```

- [ ] **Task 4.2**: 터치 타겟 검증
  - Details:
    - 버튼/링크 최소 44px
    - 적절한 gap 간격

- [ ] **Task 4.3**: 접근성 속성 추가
  - Details:
    - `aria-label` (버튼)
    - `aria-expanded` (접기/펴기)
    - 색상 대비 확인

#### Quality Gate ✋
- [ ] 768px 레이아웃 확인
- [ ] 480px 레이아웃 확인
- [ ] 키보드 네비게이션 테스트
- [ ] 브라우저 콘솔 에러 없음

---

## 📊 진행 상황 추적

| Phase | 예상 시간 | 실제 시간 | 상태 |
|-------|----------|----------|------|
| Phase 1: 레이아웃 설계 | 30분 | - | ⏳ |
| Phase 2: 컴포넌트 구현 | 1시간 | - | ⏳ |
| Phase 3: API 연동 | 1시간 | - | ⏳ |
| Phase 4: 반응형 + 접근성 | 30분 | - | ⏳ |
| **Total** | **3시간** | **-** | **0%** |

---

## 📝 Notes & Issues

### 구현 중 발견사항
- [날짜] [발견한 이슈]

### 해결된 문제
- **문제**: [문제 설명]
  - **해결**: [해결 방법]

---

## 📚 관련 Skills

이 Plan과 함께 사용되는 Skills:
- **kiips-ui-component-builder** - JSP 컴포넌트 생성
- **kiips-realgrid-guide** - RealGrid 설정 (필요시)
- **kiips-responsive-validator** - 반응형 검증
- **kiips-a11y-checker** - 접근성 검증

---

**Plan Status**: 🔄 진행 대기
**Next Action**: Phase 1 시작
