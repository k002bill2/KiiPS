# Skills Guide 업데이트 로그

**업데이트 날짜**: 2025-12-28 (수정)

## 📝 업데이트된 파일

### 1. Claude Code 완벽 가이드북 2025.md
- **작성일**: 2025-12-12 → 2025-12-28 (최종 수정)
- **CLI 버전**: v2.0.67 → v2.0.76 (LSP 도구, 다양한 터미널 지원 추가)
- **Opus 4.5 출시일**: **2025.11.01** (오류 수정: 이전 2024.11.24 → 정정)
- **추가된 정보**:
  - Claude 3.5 Sonnet 출시 이력 (2024.06.20 첫 출시, 2024.10.22 업그레이드)
  - Claude Haiku 4.5 출시일 (2025.10.15)
  - Programmatic Tool Calling 기능 추가 (2025.11)
  - KiiPS 프로젝트 특화 내용 추가 (마이크로서비스 아키텍처, Spring Boot 워크플로우)

### 2. Quick Reference.md
- **CLI 버전**: v2.0.67 → v2.0.76
- **Opus 4.5 출시일**: **2025.11.01** (오류 수정: 이전 2024.11 → 정정)
- **Haiku 4.5 출시일**: - → 2025.10.15
- **마지막 업데이트**: 2025-12-12 → 2025-12-28

## ✅ 검증된 최신 정보

### CLI 버전
- **Current**: v2.0.76 (2025년 12월 22일 기준)
- **이전 버전들**:
  - v2.0.74: LSP (Language Server Protocol) 도구 추가
  - v2.0.73: 클릭 가능한 이미지 링크, 개선된 검색 필터
  - v2.0.70: MCP 도구 권한용 와일드카드 구문

### 모델 버전 (정확한 출시일)
| 모델 | 모델 ID | 출시일 | 특징 |
|------|---------|--------|------|
| **Claude 3.5 Sonnet** | claude-3-5-sonnet-20240620 | 2024.06.20 | 첫 출시 |
| **Claude 3.5 Sonnet (New)** | claude-3-5-sonnet-20241022 | 2024.10.22 | 업그레이드 버전 |
| **Claude Sonnet 4.5** | claude-sonnet-4-5-20250929 | 2025.09.29 | 코딩, 에이전트 최적화 |
| **Claude Haiku 4.5** | claude-haiku-4-5-20251015 | 2025.10.15 | 저지연, 비용 효율적 |
| **Claude Opus 4.5** | claude-opus-4-5-20251101 | **2025.11.01** | 가장 지능적인 플래그십 |

### 새로운 기능 (2025)
1. **Programmatic Tool Calling** (2025.11):
   - 코드 기반 도구 오케스트레이션
   - Python 스크립트로 복잡한 로직 처리
   - 토큰 사용량 최적화

2. **LSP Tool** (2025.12):
   - 코드 인텔리전스 기능
   - 여러 터미널 타입 지원 (Kitty, Alacritty, Zed, Warp)

## 📚 KiiPS 특화 업데이트 대상 파일

다음 파일들에 KiiPS 프로젝트 특화 내용을 추가합니다:

### 11월 작성 파일 (7개)
- **Agent Skills 예시 모음.md** - KiiPS 마이크로서비스 Skills 예시 추가
- **CLAUDE.md 템플릿.md** - KiiPS 아키텍처 반영 템플릿
- **Dev Docs 시스템.md** - KiiPS 대규모 작업 예시
- **PM2 백엔드 디버깅.md** - KiiPS 서비스 디버깅 가이드
- **Skills 자동 활성화 시스템.md** - KiiPS 워크플로우 Hook 예시
- **실전 예제.md** (12월) - KiiPS 빌드/배포 예시
- **프로젝트별 템플릿.md** (12월) - KiiPS 엔터프라이즈 템플릿

### KiiPS 특화 추가 내용
1. **아키텍처**: Spring Boot 2.4.2, Java 8, Maven Multi-Module
2. **서비스**: 20+ 마이크로서비스, API Gateway, 공통 모듈
3. **빌드**: KiiPS-HUB 중심 빌드, SVN 통합
4. **배포**: 환경별 프로퍼티, start.sh/stop.sh 스크립트

## 🎯 다음 업데이트 예정

향후 다음 내용이 발표되면 업데이트할 예정:
- Claude Code CLI v2.1.x 주요 업데이트
- 새로운 Agent Skills 기능
- MCP 서버 통합 개선사항
- 새로운 모델 출시 (Opus 4.6, Sonnet 4.6 등)
- KiiPS 프로젝트 실전 사례 확장

## 📋 업데이트 체크리스트 (2025-12-28)

### 버전 정보 (완료)
- [x] CLI 최신 버전 확인 (v2.0.76)
- [x] 모델 출시일 정보 수정 (Opus 4.5: 2025.11.01)
- [x] 모델 ID 추가 (claude-opus-4-5-20251101 등)
- [x] 새로운 기능 추가 (LSP, Programmatic Tool Calling)
- [x] 업데이트 날짜 갱신 (2025-12-28)
- [x] 테이블 형식 일관성 확인

### KiiPS 특화 (완료)
- [x] KiiPS 프로젝트 태그 추가
- [x] KiiPS Skills 예시 추가 (4개: maven-builder, service-deployer, api-tester, log-analyzer)
- [x] KiiPS 빌드/배포 워크플로우 문서화 (CLAUDE.md, deployment.md)
- [x] KiiPS 마이크로서비스 아키텍처 가이드 (architecture.md, 9.3KB)
- [x] KiiPS 환경 설정 예시 (deployment.md, app-*.properties 가이드)
- [x] KiiPS Hooks 시스템 구축 (.claudecode.json - 빌드/배포 자동화)

### 향후 계획
- [x] 세션 시작 시 업데이트 체크 시스템 구축 완료 (SessionStart hook 활용)
  - `.claude/hooks/update-reminder.sh` - 15일마다 자동 알림
  - `.claudecode.json` - SessionStart hook 등록
  - `.claude/.last-update-check` - 타임스탬프 추적
- [ ] ~~분기별 정기 업데이트 예약~~ → SessionStart hook으로 대체 완료 (15일 주기)
- [ ] KiiPS 실전 사례 수집 및 문서화 (진행 중)

---

## 🔄 2025-12-29: KiiPS Frontend 리소스 표준화

**업데이트 날짜**: 2025-12-29
**작업 내용**: 전체 시스템의 Frontend 리소스 참조를 KiiPS 표준에 맞춰 정리

### 📊 분석 결과

**KiiPS-UI 실제 사용 현황 조사**:
```
ApexCharts: 38개 JSP 파일에서 사용 (주력)
AnyChart:   25개 JSP 파일에서 사용 (보조)
AmCharts:    0개 JSP 파일에서 사용 (❌ 사용 안 함)
```

**결론**: AmCharts는 KiiPS 프로젝트에서 전혀 사용되지 않음을 확인

### 📝 수정된 파일

#### 1. `.claude/skills/kiips-feature-planner/SKILL.md`
```diff
- **Grids**: DataTables, RealGrid, AmCharts
+ **Grids**: RealGrid 2.8.8 (주력, 라이선스 필요), DataTables (보조)
+ **Charts**: ApexCharts (주력), AnyChart (보조)
```

#### 2. `.claude/skills/kiips-feature-planner/plan-template-kiips.md`
```diff
- **Task 4.3**: DataTables/RealGrid/AmCharts 적용 (필요 시)
+ **Task 4.3**: RealGrid/ApexCharts/AnyChart 적용 (필요 시)
+   Details: 그리드는 RealGrid 2.8.8 (라이선스 필요), 차트는 ApexCharts 또는 AnyChart 사용
```

#### 3. `CLAUDE.md` (프로젝트 루트)
```diff
- **Frontend**: JSP, jQuery, Bootstrap, DataTables, AmCharts, RealGrid
+ **Frontend**: JSP, jQuery, Bootstrap, RealGrid 2.8.8 (주력), ApexCharts (주력), AnyChart (보조)
```

#### 4. `KiiPS-UI/CLAUDE.md`
```diff
### Frontend Libraries
- jQuery and jQuery UI
- Bootstrap and custom CSS frameworks
- DataTables for data grids
- AmCharts for visualization
- RealGrid for advanced grids
+ RealGrid 2.8.8 for advanced grids (주력, 라이선스 필요)
+ ApexCharts for data visualization (주력)
+ AnyChart for charts (보조)
+ DataTables for simple grids (보조)
```

#### 5. `docs/plans/PLAN_investment-portfolio-dashboard.md`
- Line 33: AmCharts → ApexCharts
- Line 34: DataTables → RealGrid 2.8.8
- Line 40: AmCharts → ApexCharts - Pie & Bar
- Line 41: DataTables → RealGrid
- Line 317: SVN 커밋 메시지 업데이트
- Line 454-456: 기술적 결정 사항 (ApexCharts 근거 추가)
- Line 469: 위험 요소 대응 방안 업데이트
- Line 555-556: 외부 참고자료 링크 수정

### 📚 신규 생성 문서

#### `docs/RESOURCES.md` (신규 생성)
**목적**: KiiPS 프로젝트 Frontend 리소스 표준 가이드

**주요 섹션**:
1. 차트 라이브러리 (ApexCharts, AnyChart)
2. 그리드 라이브러리 (RealGrid 2.8.8, RealPivot, DataTables)
3. UI Framework (Bootstrap, jQuery)
4. JavaScript 유틸리티
5. 리소스 경로 규칙
6. 사용 금지 라이브러리 (AmCharts, Chart.js, Highcharts 등)

**특징**:
- 실제 사용 코드 예제 포함
- 참고 JSP 파일 경로 제공
- 라이선스 정보 명시
- 개발 체크리스트 제공

### ✅ 검증된 정보

**리소스 경로** (`/Users/younghwankang/WORK/WORKSPACE/KiiPS/KiiPS-UI/src/main/resources/static/vendor/`):
```
✅ /vendor/apexcharts/                  (ApexCharts, MIT 라이선스)
✅ /vendor/AnyChart/                    (AnyChart, Commercial)
✅ /vendor/realgrid.2.6.3/             (RealGrid 2.6.3, 이전 버전)
✅ /vendor/realpivot/, realpivot-1.0.11/ (RealPivot)
⚠️ /vendor/datatables/                 (DataTables, 보조 사용)
❌ AmCharts 디렉토리 없음
```

### 🎯 표준화 결과

| 항목 | 변경 전 | 변경 후 |
|------|---------|---------|
| **주력 차트** | AmCharts (잘못됨) | ApexCharts (실제 사용) |
| **주력 그리드** | DataTables | RealGrid 2.8.8 |
| **라이선스** | 명시 안 됨 | 환경 변수 관리 방법 문서화 |
| **리소스 가이드** | 없음 | docs/RESOURCES.md 신규 생성 |

### 📖 참고 JSP 파일

- **ApexCharts 사용 예제**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/AC/AC1004.jsp`
- **RealGrid 사용 예제**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/SY/SY0202.jsp`

### ⚡ 향후 조치

- [x] 모든 Skill 파일 리소스 참조 수정
- [x] 프로젝트 CLAUDE.md 업데이트
- [x] Feature Plan 문서 수정
- [x] 리소스 가이드 문서 생성 (RESOURCES.md)
- [ ] 기존 개발자들에게 변경 사항 공유
- [ ] 새로운 Feature Plan 템플릿 적용 확인

---

## 🎨 2025-12-29: SCSS 스타일 가이드 생성 (토큰 효율화)

**업데이트 날짜**: 2025-12-29 (오후)
**작업 내용**: 스타일 작업 시 토큰 사용량을 줄이기 위한 SCSS 가이드 문서 생성

### 📝 문제점

**기존 워크플로우**:
- 매번 `theme.scss` (137줄) 전체를 읽어서 분석
- Config 파일들 (`_variables.scss`, `_mixins.scss` 등) 반복 분석
- 토큰 사용량 과다 (매 스타일 작업마다 수천 토큰 소비)

### ✅ 해결 방법

**새로운 워크플로우**:
- `docs/SCSS_GUIDE.md` 단일 참조 문서 생성
- Quick Reference 섹션으로 빠른 변수/믹스인 조회
- 실제 사용 예제 포함으로 즉시 적용 가능

### 📚 신규 생성 문서

#### `docs/SCSS_GUIDE.md` (신규 생성)
**목적**: KiiPS SCSS 스타일링 통합 가이드

**주요 섹션**:
1. **Quick Reference** - 자주 사용하는 변수/믹스인 즉시 참조
2. **Colors** - 색상 변수 팔레트 ($theme-color, $color-primary 등)
3. **Typography** - 폰트 변수 ($font-primary, font-weight 등)
4. **Spacing** - 간격 변수 ($spacement-xs ~ xlg, 5px 단위)
5. **Mixins** - flex, font-size, media-breakpoint-up 등
6. **Functions** - rem(), rem-calc(), str-replace() 등
7. **Structure** - SCSS 파일 구조 및 조직화
8. **Best Practices** - 변수 사용, 믹스인 활용, rem 단위

**특징**:
- 모든 주요 변수를 테이블로 정리
- 각 믹스인/함수의 사용 예제 포함
- 색상 팔레트, 간격 스케일, 폰트 굵기 빠른 참조표
- 토큰 사용량 최소화 (전체 theme.scss 대신 이 문서 참조)

### 📝 수정된 파일

#### 1. `docs/RESOURCES.md`
**추가 내용**: SCSS 스타일 시스템 섹션
- Table of Contents에 "SCSS 스타일 시스템" 추가
- Quick Reference (주요 변수/믹스인)
- 사용 예제
- SCSS_GUIDE.md 링크

```scss
// 추가된 Quick Reference 예제
$theme-color: #007bff;
$spacement-md: 15px;
@include flex(center, center);
@include font-size(16);
```

#### 2. `KiiPS-UI/CLAUDE.md`
**추가 내용**: SCSS Styling System 섹션
- Main File, Variables, Mixins, Custom Styles 경로
- SCSS_GUIDE.md 링크
- Quick Tips (자주 쓰는 변수/믹스인)

### 🎯 주요 추출 내용

**분석한 파일**:
- `theme.scss` (137줄) - 메인 엔트리, 모든 partial import
- `config/_variables.scss` (9,985 bytes) - 모든 SCSS 변수
- `config/_mixins.scss` (1,363 bytes) - 7개 주요 믹스인
- `config/_functions.scss` (652 bytes) - 4개 유틸리티 함수
- `config/_helpers.scss` (485 bytes) - rem 변환 헬퍼

**주요 변수 (추출 완료)**:
```scss
// 색상 (13개)
$theme-color: #007bff;
$color-primary, success, danger, warning, info, secondary 등

// 간격 (6개, 5px 단위)
$spacement-xs: 5px ~ $spacement-xlg: 30px;

// 타이포그래피
$font-primary: "NexonLv2Gothic", ...;
$font-weight-light: 300 ~ $font-weight-black: 700;

// 테두리
$border-thin: 1px, normal: 2px, thick: 3px;
```

**주요 믹스인 (7개)**:
1. `flex($justify, $align)` - 플렉스박스 중앙 정렬
2. `flexbox($grow, $shrink, $basis)` - 플렉스 아이템
3. `font-size($size)` - px → rem 자동 변환
4. `line-height($size)` - px → rem 자동 변환
5. `media-breakpoint-up($name)` - 반응형 미디어 쿼리
6. `clearfix` - float 해제
7. `placeholder-color($color)` - placeholder 색상
8. `cal-color($bg, $fg)` - 캘린더 이벤트 색상

**주요 함수 (4개)**:
1. `rem($px, $base)` - px를 rem으로 변환
2. `rem-calc($pixel)` - rem 계산 (기준: 14px)
3. `breakpoint-min($name)` - 브레이크포인트 최소값
4. `str-replace($str, $search, $replace)` - 문자열 치환

### 💡 토큰 효율화 효과

**Before** (기존 방식):
```
1. theme.scss 읽기: ~400 토큰
2. _variables.scss 읽기: ~2,500 토큰
3. _mixins.scss 읽기: ~400 토큰
4. 분석 및 응답: ~1,000 토큰
총: ~4,300 토큰/회
```

**After** (새 방식):
```
1. SCSS_GUIDE.md Quick Reference 참조: ~200 토큰
2. 필요 시 상세 섹션 확인: ~500 토큰
총: ~700 토큰/회 (83% 절감!)
```

### 📖 사용 방법

**스타일 작업 전**:
```
1. docs/SCSS_GUIDE.md의 "Quick Reference" 확인
2. Ctrl+F로 필요한 변수/믹스인 검색
3. 사용 예제 복사하여 custom.scss에 적용
```

**일반적인 질문**:
- "primary 색상은?" → SCSS_GUIDE.md#Colors
- "중앙 정렬은?" → SCSS_GUIDE.md#Mixins (flex)
- "간격 변수는?" → SCSS_GUIDE.md#Spacing

### ⚡ 향후 조치

- [x] SCSS_GUIDE.md 생성
- [x] RESOURCES.md에 SCSS 섹션 추가
- [x] KiiPS-UI/CLAUDE.md에 Quick Tips 추가
- [ ] 개발자들에게 새 워크플로우 공유
- [ ] 스타일 작업 시 실제 토큰 절감 효과 검증

---

## 🚀 2026-01-08: ACE Framework 최적화 + 개발 워크플로우 구성

**업데이트 날짜**: 2026-01-08
**작업 내용**: ACE Framework 에이전트 모델 최적화 및 커스텀 워크플로우 구성

### 📊 ACE Framework 변경사항

#### 1. 에이전트 모델 최적화
```diff
- kiips-architect: opus-4.5 (비용 높음)
+ kiips-architect: sonnet-4.5 (비용 ~80% 절감)
```

**변경 이유**:
- Strategic Advisor 역할은 복잡한 추론 불필요
- 아키텍처 자문 및 설계 검토에 Sonnet 충분

**수정된 파일**:
- `.claude/ace-framework/ace-config.json`
- `.claude/ace-framework/layer3-agent-model.json`
- `.claude/agents/kiips-architect.md`

#### 2. task_types 중복 제거
```diff
# 빌드 관련
- service_build, multi_service_build, maven_build (3개)
+ service_build (통합, description 추가)

# 배포 관련
- service_deploy, multi_service_deploy, service_deployment (3개)
+ service_deploy (통합, description 추가)
```

**변경 이유**: 기능 중복으로 설정 복잡도 증가

### 🔧 커스텀 워크플로우 구성

#### `/my-workflow` 신규 생성
**위치**: `.claude/commands/my-workflow.md`
**용도**: KiiPS 개발 사이클 자동화

**워크플로우 흐름**:
```
Start → 작업 유형 선택 →
  ├─ 신규 Feature → 계획 수립 → Dev Docs 생성
  ├─ 버그 수정 → 버그 분석 → Dev Docs 생성
  └─ 기존 작업 계속 → Dev Docs 로드
                    ↓
                코드 구현
                    ↓
                Maven 빌드 ←────┐
                    ↓           │
              빌드 결과 확인 ──(실패)─┘
                    ↓ (성공)
              배포 여부 선택
                    ↓
                코드 리뷰
                    ↓
              Dev Docs 저장
                    ↓
              커밋 여부 선택 → End
```

**통합된 Skills**:
| 단계 | Skill/Command |
|------|---------------|
| 계획 | /dev-docs |
| 빌드 | /build-service |
| 배포 | /deploy-service |
| 로그 | /view-logs |
| 리뷰 | /review |
| 저장 | /save-and-compact |

### 📝 기타 수정사항

#### Dev Docs 경로 수정
```diff
- dev/plan.md, dev/context.md, dev/tasks.md
+ dev/active/{project-name}/{project-name}-plan.md
+ dev/active/{project-name}/{project-name}-context.md
+ dev/active/{project-name}/{project-name}-tasks.md
```

#### 모델 명명 일관성 수정
```diff
# ace-config.json
- "model": "opus"
+ "model": "opus-4.5"
```

### ✅ 검증 완료

- [x] ACE Framework 설정 일관성 검증
- [x] 워크플로우 실행 테스트 완료
- [x] 코드 리뷰 Warning 수정
- [x] Dev Docs 업데이트 완료

### 🎯 예상 효과

| 항목 | 효과 |
|------|------|
| **비용 절감** | kiips-architect 호출 비용 ~80% 감소 |
| **설정 간소화** | task_types 7개 → 3개 통합 |
| **워크플로우 자동화** | /my-workflow로 개발 사이클 표준화 |
| **경로 정확성** | Dev Docs 경로 실제 구조와 일치 |

---

## 🎨 2026-01-08: SCSS 빌드 완료

**업데이트 날짜**: 2026-01-08 (오후)
**작업 내용**: theme.css 재생성 및 다크모드 스타일 적용

### 📦 빌드 결과

| 파일 | 크기 | 상태 |
|------|------|------|
| `sass/theme.css` | 1.37 MB | ✅ 신규 빌드 |
| `sass/theme.min.css` | 1.18 MB | ✅ 신규 빌드 |
| `css/theme.css` | 1.37 MB | ✅ 복사됨 |

### ⚠️ Deprecation 경고

**문제**: Dart Sass 2.0에서 `/` 연산자 제거 예정
**위치**:
- `config/_helpers.scss:7` - `$pixel / $root-font-size`
- `gui/_notifications.scss:547` - `6px / 2`
- `gui/_progress-bars.scss:92,120,148` - `floor(Xpx / 3)`

**권장 조치**:
```diff
- $rem: $pixel / $root-font-size;
+ $rem: math.div($pixel, $root-font-size);
```

**우선순위**: 낮음 (현재 동작에 영향 없음, 향후 마이그레이션 필요)

### 🎯 적용된 스타일

- 다크모드 메뉴 폰트 컬러: `#FFFFFF`
- 다크모드 hover 배경: `#3d8ef4`
- FuturesLap 전용 드롭다운 스타일

---

*이 로그는 Skills Guide 폴더의 문서 동기화를 추적합니다.*
