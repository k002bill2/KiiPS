# KiiPS Frontend Resources Guide

> **Last Updated**: 2025-12-29
> **Purpose**: KiiPS 프로젝트에서 사용하는 표준 Frontend 리소스 목록 및 사용 가이드

---

## 📚 Table of Contents

1. [차트 라이브러리](#-차트-라이브러리)
2. [그리드 라이브러리](#-그리드-라이브러리)
3. [UI Framework](#-ui-framework)
4. [SCSS 스타일 시스템](#-scss-스타일-시스템)
5. [JavaScript 유틸리티](#-javascript-유틸리티)
6. [리소스 경로 규칙](#-리소스-경로-규칙)
7. [사용 금지 라이브러리](#-사용-금지-라이브러리)

---

## 📊 차트 라이브러리

### ✅ ApexCharts (주력)

**사용 현황**: 38개 JSP 파일에서 사용
**경로**: `/vendor/apexcharts/`
**버전**: Latest
**라이선스**: MIT (무료)

**리소스 임포트**:
```jsp
<!-- CSS -->
<link rel="stylesheet" href="/vendor/apexcharts/apexcharts.css" />

<!-- JavaScript -->
<script src="/vendor/apexcharts/apexcharts.min.js"></script>
```

**사용 예제**:
```javascript
// Pie Chart
var options = {
    series: [44, 55, 13, 33],
    chart: {
        type: 'pie',
        height: 350
    },
    labels: ['Team A', 'Team B', 'Team C', 'Team D'],
    legend: {
        position: 'bottom'
    }
};
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();

// Bar Chart
var options = {
    series: [{
        name: 'Sales',
        data: [30, 40, 35, 50, 49, 60, 70]
    }],
    chart: {
        type: 'bar',
        height: 350
    },
    xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']
    }
};
var chart = new ApexCharts(document.querySelector("#chart"), options);
chart.render();
```

**참고 JSP**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/AC/AC1004.jsp`
**문서**: [ApexCharts Documentation](https://apexcharts.com/docs/)

---

### ✅ AnyChart (보조)

**사용 현황**: 25개 JSP 파일에서 사용
**경로**: `/vendor/AnyChart/`
**버전**: Latest
**라이선스**: Commercial (라이선스 필요)

**리소스 임포트**:
```jsp
<script src="/vendor/AnyChart/anychart-bundle.min.js"></script>
```

**사용 예제**:
```javascript
var chart = anychart.column([
    ['January', 10000],
    ['February', 12000],
    ['March', 18000]
]);
chart.container('container');
chart.draw();
```

**문서**: [AnyChart Documentation](https://docs.anychart.com/)

---

### ❌ AmCharts (사용 금지)

**상태**: KiiPS 프로젝트에서 **사용하지 않음** (0건)
**대체**: ApexCharts 또는 AnyChart 사용
**사유**: 프로젝트 표준에 포함되지 않음

---

## 📋 그리드 라이브러리

### ✅ RealGrid 2.6.3 (주력)

**사용 목적**: 고급 데이터 그리드 (대량 데이터, 복잡한 포맷팅)
**경로**: `/vendor/realgrid.2.6.3/`
**버전**: 2.6.3
**라이선스**: Commercial (환경 변수로 관리)

**리소스 임포트**:
```jsp
<!-- CSS -->
<link rel="stylesheet" href="/vendor/realgrid.2.6.3/realgrid-style.css" />

<!-- JavaScript -->
<script src="/vendor/realgrid.2.6.3/realgrid.2.6.3.min.js"></script>
<script src="/vendor/realgrid.2.6.3/libs/realgrid-locale.min.js"></script>

<!-- Spring EL로 라이선스 주입 -->
<spring:eval expression="@environment.getProperty('web.realgrid.lic')" var="KiiPS_GRID" />
```

**초기화 예제**:
```javascript
// RealGrid 루트 컨텍스트 설정
RealGrid.setRootContext("/vendor/realgrid.2.6.3");

// 라이선스 설정 (Spring EL 변수 사용)
RealGrid.setLicense('${KiiPS_GRID}');

// DataProvider 및 GridView 생성
var dataProvider = new RealGrid.LocalDataProvider(false);
var gridView = new RealGrid.GridView("realgrid-container");
gridView.setDataSource(dataProvider);

// 컬럼 정의
var columns = [
    {
        name: "company_name",
        fieldName: "company_name",
        header: { text: "회사명" },
        width: 200
    },
    {
        name: "invest_amount",
        fieldName: "invest_amount",
        header: { text: "투자금액" },
        width: 150,
        renderer: {
            type: "html",
            callback: function(grid, cell) {
                var billion = (cell.value / 100000000).toFixed(1);
                return billion + '억 원';
            }
        }
    }
];

gridView.setColumns(columns);

// 데이터 로딩
dataProvider.setRows(data);
```

**참고 JSP**: `KiiPS-UI/src/main/webapp/WEB-INF/jsp/kiips/SY/SY0202.jsp`
**문서**: [RealGrid 2.6.3 Documentation](http://help.realgrid.com/)

---

### ✅ RealPivot (피벗 테이블)

**사용 목적**: 피벗 테이블, 집계 데이터 분석
**경로**: `/vendor/realpivot/`, `/vendor/realpivot-1.0.11/`
**버전**: 1.0.11 (최신)
**라이선스**: Commercial

**리소스 임포트**:
```jsp
<script src="/vendor/realpivot-1.0.11/realpivot.min.js"></script>
<link rel="stylesheet" href="/vendor/realpivot-1.0.11/realpivot.css" />
```

**문서**: [RealPivot Documentation](http://help.realgrid.com/pivot/)

---

### ⚠️ DataTables (보조, 제한적 사용)

**사용 목적**: 간단한 테이블 페이징/정렬 (RealGrid 불필요한 경우)
**경로**: `/vendor/datatables/`
**권장 사항**: **RealGrid 우선 사용**, 단순 테이블만 DataTables

**리소스 임포트**:
```jsp
<link rel="stylesheet" href="/vendor/datatables/media/css/jquery.dataTables.min.css" />
<script src="/vendor/datatables/media/js/jquery.dataTables.min.js"></script>
```

**사용 예제**:
```javascript
$('#myTable').DataTable({
    paging: true,
    searching: true,
    ordering: true,
    pageLength: 10
});
```

---

## 🎨 UI Framework

### Bootstrap

**경로**: `/vendor/bootstrap/`
**버전**: 4.x

**리소스 임포트**:
```jsp
<link rel="stylesheet" href="/vendor/bootstrap/css/bootstrap.min.css" />
<script src="/vendor/bootstrap/js/bootstrap.bundle.min.js"></script>
```

### jQuery & jQuery UI

**경로**: `/vendor/jquery/`, `/vendor/jquery-ui/`
**버전**: jQuery 3.x, jQuery UI 1.12.x

**리소스 임포트**:
```jsp
<script src="/vendor/jquery/jquery.min.js"></script>
<script src="/vendor/jquery-ui/jquery-ui.min.js"></script>
<link rel="stylesheet" href="/vendor/jquery-ui/themes/base/jquery-ui.min.css" />
```

---

## 🎨 SCSS 스타일 시스템

**⭐ 중요**: 스타일 작업 시 매번 theme.scss를 분석하는 대신 **[SCSS_GUIDE.md](./SCSS_GUIDE.md)**를 참조하세요.

### 메인 파일

**경로**: `/KiiPS-UI/src/main/resources/static/css/sass/theme.scss`
**용도**: 모든 SCSS partial 파일을 import하는 엔트리 포인트

### 주요 설정 파일

| 파일 | 경로 | 용도 |
|------|------|------|
| **변수** | `config/_variables.scss` | 색상, 폰트, 간격 등 모든 SCSS 변수 |
| **믹스인** | `config/_mixins.scss` | flex, font-size, 반응형 등 재사용 믹스인 |
| **함수** | `config/_functions.scss` | rem 변환, 문자열 처리 함수 |
| **커스텀** | `custom.scss` | 프로젝트별 커스텀 스타일 |

### Quick Reference

**자주 사용하는 변수**:
```scss
// 색상
$theme-color: #007bff;
$color-primary: #007bff;
$color-success: #47a447;
$color-danger: #d2322d;

// 간격 (5px 단위)
$spacement-xs: 5px;
$spacement-sm: 10px;
$spacement-md: 15px;
$spacement-lg: 20px;

// 폰트
$font-primary: "NexonLv2Gothic", ...;
$font-weight-normal: 500;
$font-weight-bold: 600;
```

**자주 사용하는 믹스인**:
```scss
@include flex(center, center);           // 중앙 정렬
@include font-size(16);                  // font-size: 1.143rem
@include media-breakpoint-up(md) { ... } // 반응형
@include clearfix;                       // float 해제
```

### 사용 예제

```scss
// custom.scss에 추가
.my-component {
    background-color: $theme-color-bg;
    padding: $spacement-md;
    @include flex(space-between, center);

    .title {
        @include font-size(16);
        font-weight: $font-weight-bold;
        color: $color-primary;
    }

    // 반응형
    @include media-breakpoint-up(md) {
        padding: $spacement-lg;
    }
}
```

### 스타일 작업 워크플로우

1. **변수 확인**: [SCSS_GUIDE.md - Quick Reference](./SCSS_GUIDE.md#-quick-reference)
2. **믹스인 활용**: [SCSS_GUIDE.md - Mixins](./SCSS_GUIDE.md#%EF%B8%8F-mixins)
3. **커스텀 스타일**: `custom.scss`에 작성
4. **빌드**: Maven 빌드 시 자동 컴파일

### 상세 가이드

**📘 전체 문서**: [SCSS_GUIDE.md](./SCSS_GUIDE.md)
- 모든 색상 변수 목록
- 믹스인/함수 사용법
- 파일 구조
- Best Practices

---

## 🔧 JavaScript 유틸리티

### Font Awesome (아이콘)

**경로**: `/vendor/font-awesome/`

```jsp
<link rel="stylesheet" href="/vendor/font-awesome/css/all.min.css" />
```

### Moment.js (날짜 처리)

**경로**: `/vendor/moment/`

```jsp
<script src="/vendor/moment/moment.min.js"></script>
```

### CodeMirror (코드 에디터)

**경로**: `/vendor/codemirror/`

```jsp
<link rel="stylesheet" href="/vendor/codemirror/lib/codemirror.css" />
<script src="/vendor/codemirror/lib/codemirror.js"></script>
```

---

## 📂 리소스 경로 규칙

### 1. 절대 경로 사용 (권장)

```jsp
<!-- ✅ 올바른 방법 -->
<script src="/vendor/apexcharts/apexcharts.min.js"></script>
<link rel="stylesheet" href="/vendor/realgrid.2.6.3/realgrid-style.css" />

<!-- ❌ 잘못된 방법 -->
<script src="../vendor/apexcharts/apexcharts.min.js"></script>
<script src="vendor/apexcharts/apexcharts.min.js"></script>
```

### 2. Spring EL for Environment Variables

```jsp
<!-- RealGrid 라이선스 주입 -->
<spring:eval expression="@environment.getProperty('web.realgrid.lic')" var="KiiPS_GRID" />

<script>
    RealGrid.setLicense('${KiiPS_GRID}');
</script>
```

### 3. 버전 관리

- **명시적 버전 경로 사용**: `/vendor/realgrid.2.6.3/` (버전 포함)
- **최신 버전 우선**: 동일 라이브러리의 여러 버전 존재 시 최신 사용

---

## 🚫 사용 금지 라이브러리

다음 라이브러리는 KiiPS 프로젝트에서 사용하지 않습니다:

| 라이브러리 | 상태 | 대체 라이브러리 |
|-----------|------|----------------|
| **AmCharts** | ❌ 사용 안 함 (0건) | ✅ ApexCharts |
| **Chart.js** | ❌ 사용 안 함 | ✅ ApexCharts |
| **Highcharts** | ❌ 사용 안 함 | ✅ ApexCharts |
| **ag-Grid** | ❌ 사용 안 함 | ✅ RealGrid 2.6.3 |
| **Handsontable** | ❌ 사용 안 함 | ✅ RealGrid 2.6.3 |

**중요**: 새로운 라이브러리 도입 전 반드시 팀 리뷰 필요

---

## 📝 개발 체크리스트

새로운 JSP 페이지 개발 시:

- [ ] **차트 필요?** → ApexCharts (주력) 또는 AnyChart (보조) 사용
- [ ] **그리드 필요?** → RealGrid 2.6.3 사용 (단순 테이블만 DataTables)
- [ ] **리소스 경로 확인**: `/vendor/` 절대 경로 사용
- [ ] **라이선스 확인**: RealGrid, AnyChart는 환경 변수로 라이선스 주입
- [ ] **브라우저 호환성**: 모던 브라우저 권장 (IE 11 이상)
- [ ] **성능 최적화**: 필요한 리소스만 로딩 (CDN 사용 금지)

---

## 🔗 참고 문서

- **프로젝트 구조**: [CLAUDE.md](../CLAUDE.md)
- **아키텍처**: [architecture.md](./architecture.md)
- **API 가이드**: [api.md](./api.md)
- **배포 가이드**: [deployment.md](./deployment.md)

---

## 📞 문의

리소스 관련 질문이나 새로운 라이브러리 도입 제안:
- **팀 리뷰 필요**: Skill 파일 및 문서 업데이트 후 적용
- **표준 준수**: 이 문서의 가이드라인 준수

---

**Version**: 1.0
**Maintained By**: KiiPS Development Team
**Next Review**: 2026-01-01
