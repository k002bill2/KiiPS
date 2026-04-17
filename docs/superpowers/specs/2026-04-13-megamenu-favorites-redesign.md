# Megamenu 즐겨찾기 분리 + 높이 축소

## Problem

현재 megamenu가 화면의 ~85%를 차지하며, 즐겨찾기 버튼이 맨 아래에 위치하여 접근성이 낮다.
사용자 피드백: "즐겨찾기가 왜 맨 아래에 있지?", "메뉴가 너무 많아서 한눈에 안 들어와"

## Solution

즐겨찾기 빠른 접근을 헤더 ★ 아이콘으로 분리하고, megamenu 높이를 max-height로 제한한다.

## Design Decisions

| 결정 | 선택 | 대안 (기각) |
|------|------|------------|
| 즐겨찾기 위치 | 헤더 우측 아이콘 영역 | 메뉴 탭 옆, 로고 옆 칩 |
| megamenu 레이아웃 | 현재 그리드 유지 + max-height | 2-Panel 사이드바 |
| megamenu 내 ☆ 버튼 | 유지 | 제거 |
| megamenu 하단 바 | 제거 | 유지 |
| 접근 방식 | 크기 축소 + 즐겨찾기 분리 동시 | 한쪽만 먼저 |

## Changes

### 1. 헤더에 ★ 아이콘 추가

**위치**: 우측 아이콘 영역 (검색 아이콘과 알림 아이콘 사이)

**구성**:
- ★ 아이콘 (color: #f59e0b)
- 배지: 즐겨찾기 수 표시 (background: #f44336, 원형)
- 클릭 시 드롭다운 토글

### 2. ★ 드롭다운

**크기**: width 240px, 위치는 ★ 아이콘 아래 우측 정렬

**구성**:
- 헤더: 파란색 그라데이션 (#007bff → #0056b3), "★ 즐겨찾기" 타이틀 + F8 표시
- 항목 목록: 즐겨찾기 항목명 + 소속 카테고리 (우측 회색 텍스트)
- 항목 클릭 시 해당 페이지로 이동
- 항목 hover 시 배경색 변경 (#f8f9fa)
- 푸터: "편집 및 순서 변경" 링크 → 기존 즐겨찾기 모달 열기

**동작**:
- ★ 클릭으로 토글 (열기/닫기)
- 외부 클릭 시 닫기
- F8 단축키로 토글
- ESC 키로 닫기

### 3. Megamenu 높이 제한

**변경**: `.mega-dropdown` 또는 `.mega-panel`에 max-height 적용

**구체적 수치**:
- max-height: 60vh (현재 calc(100vh - 100px)에서 축소)
- overflow-y: auto (기존 스크롤바 스타일 재사용)

### 4. Megamenu 하단 바 제거

**제거 대상**: `.submenu-favorite-footer` 요소
- `position: absolute; bottom: 0`으로 고정된 "즐겨찾기 목록(단축키 F8)" 링크
- `.favorite-link` 버튼

**여유 공간 확보**: `.mega-panel`의 padding-bottom을 88px → 32px로 축소

### 5. Megamenu 내 ☆ 토글 버튼 유지

`.content-card-favorite-btn`은 그대로 유지. 메뉴에서 바로 즐겨찾기 추가/삭제 가능.
☆ 토글 시 헤더 ★ 배지 숫자도 동기화.

### 6. F8 단축키 변경

**현재**: 하단 바 → 즐겨찾기 모달 열기
**변경**: 헤더 ★ 드롭다운 토글 (드롭다운 내 "편집" 링크로 모달 접근)

## Files to Modify

| 파일 | 변경 내용 |
|------|----------|
| `KiiPS-UI/.../include/Menu/sidemenu_menutop_line_mega.jsp` | 헤더에 ★ 아이콘 + 드롭다운 HTML 추가, 하단 바 제거 |
| `KiiPS-UI/.../css/sass/base/_header-nav.scss` | 드롭다운 스타일, max-height, 하단 바 스타일 제거 |
| `KiiPS-UI/.../include/Menu/sidemenu_menutop_line_mega.jsp` (JS) | 드롭다운 토글/닫기 로직, F8 바인딩 변경, 배지 동기화 |

## Behavior Spec

### ★ 드롭다운 토글
- 클릭: 열려있으면 닫기, 닫혀있으면 열기
- 외부 클릭: 닫기
- F8: 토글
- ESC: 닫기
- megamenu가 열려있을 때 ★ 클릭: megamenu 닫고 드롭다운 열기

### 즐겨찾기 동기화
- megamenu에서 ☆ 토글 → 헤더 ★ 배지 숫자 갱신 + 드롭다운 목록 갱신
- 드롭다운 "편집" → 기존 모달에서 편집 → 닫을 때 배지 + megamenu ☆ 상태 동기화

### 다크 테마
- 드롭다운 배경: `[data-theme=dark]` 시 #2a2e35
- 텍스트, 배지, 호버 색상 다크 테마 대응

## Not In Scope

- Megamenu 그리드 레이아웃 자체 변경 (컬럼 수, 순서 등)
- 2-Panel 사이드바 전환
- 모바일 메뉴 변경 (모바일은 이미 별도 아코디언 메뉴)
- 즐겨찾기 모달 디자인 변경
- 검색 기능 추가
