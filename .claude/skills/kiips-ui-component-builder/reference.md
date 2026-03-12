# KiiPS UI Component Builder - Reference

## ApexCharts - 선 차트 (투자 추이)

**User Request**: "월별 투자 추이 차트 추가해줘"

**Template**: [templates/apexcharts-line.jsp](./templates/apexcharts-line.jsp)

```html
<div class="chart-container card mb-3">
    <div class="card-header">
        <h5>월별 투자 추이</h5>
    </div>
    <div class="card-body">
        <div id="investmentTrendChart"></div>
    </div>
</div>

<script>
const chartOptions = {
    chart: {
        type: 'line',
        height: 350,
        toolbar: {
            show: true,
            tools: {
                download: true,
                selection: true,
                zoom: true,
                zoomin: true,
                zoomout: true,
                pan: true,
                reset: true
            }
        }
    },
    series: [{
        name: '투자금액',
        data: [] // AJAX로 데이터 로드
    }, {
        name: '수익금액',
        data: []
    }],
    xaxis: {
        categories: [], // ['2026-01', '2026-02', ...]
        title: { text: '월' }
    },
    yaxis: {
        title: { text: '금액 (백만원)' },
        labels: {
            formatter: function(value) {
                return value.toLocaleString();
            }
        }
    },
    stroke: {
        curve: 'smooth',
        width: 3
    },
    markers: {
        size: 5,
        hover: {
            size: 7
        }
    },
    tooltip: {
        shared: true,
        intersect: false,
        y: {
            formatter: function(value) {
                return value.toLocaleString() + ' 백만원';
            }
        }
    },
    responsive: [{
        breakpoint: 768,
        options: {
            chart: { height: 250 },
            legend: { position: 'bottom' }
        }
    }]
};

const chart = new ApexCharts(
    document.querySelector("#investmentTrendChart"),
    chartOptions
);
chart.render();

// 데이터 로드
loadChartData();
</script>
```

---

## ApexCharts - 도넛 차트 (펀드 분류)

**User Request**: "펀드 유형별 비율 차트"

**Template**: [templates/apexcharts-donut.jsp](./templates/apexcharts-donut.jsp)

```javascript
{
    chart: {
        type: 'donut',
        height: 300
    },
    series: [35, 45, 20], // 데이터
    labels: ['주식형', '채권형', '혼합형'],
    colors: ['#008FFB', '#00E396', '#FEB019'],
    legend: {
        position: 'bottom'
    },
    plotOptions: {
        pie: {
            donut: {
                size: '70%',
                labels: {
                    show: true,
                    total: {
                        show: true,
                        label: '총 펀드 수',
                        formatter: function(w) {
                            return w.globals.seriesTotals.reduce((a, b) => a + b, 0);
                        }
                    }
                }
            }
        }
    }
}
```

---

## Bootstrap 검색 폼

**Template**: [templates/bootstrap-search-form.jsp](./templates/bootstrap-search-form.jsp)

```html
<div class="search-area card mb-3">
    <div class="card-body">
        <form id="searchForm" class="row g-3" role="search" aria-label="검색 폼">
            <div class="col-md-3">
                <label for="keyword" class="form-label">검색어</label>
                <input type="text" class="form-control" id="keyword" name="keyword"
                       placeholder="펀드명 또는 코드 입력" aria-describedby="keywordHelp">
                <small id="keywordHelp" class="form-text text-muted">
                    펀드명 또는 펀드코드를 입력하세요
                </small>
            </div>

            <div class="col-md-3">
                <label for="fundType" class="form-label">펀드유형</label>
                <select class="form-select" id="fundType" name="fundType">
                    <option value="">전체</option>
                    <option value="EQUITY">주식형</option>
                    <option value="BOND">채권형</option>
                    <option value="MIXED">혼합형</option>
                </select>
            </div>

            <div class="col-md-3">
                <label for="dateFrom" class="form-label">기간 (시작)</label>
                <input type="date" class="form-control" id="dateFrom" name="dateFrom">
            </div>

            <div class="col-md-3">
                <label for="dateTo" class="form-label">기간 (종료)</label>
                <input type="date" class="form-control" id="dateTo" name="dateTo">
            </div>

            <div class="col-12">
                <button type="button" class="btn btn-primary" onclick="search()">
                    <i class="bi bi-search"></i> 조회
                </button>
                <button type="button" class="btn btn-secondary" onclick="reset()">
                    <i class="bi bi-arrow-clockwise"></i> 초기화
                </button>
            </div>
        </form>
    </div>
</div>
```

---

## Popup Templates

### 팝업 유형별 상세

| 유형 | 용도 | 기준 파일 |
|------|------|-----------|
| **일반 팝업** | 데이터 입력/조회 | `COMM_POPUP_*.jsp` |
| **인쇄용 팝업** | 문서 인쇄 | `POPUP_AC0522_print.jsp` |
| **그리드 팝업** | RealGrid 데이터 표시 | `COMM_POPUP_OPINION.jsp` |
| **Bootstrap Modal** | 페이지 내 오버레이 | data-backdrop="static" |

### 인쇄용 팝업 템플릿

```jsp
<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8" %>
<%@ include file="../include/header_popup.jsp" %>
<link rel="stylesheet" type="text/css" href="/css/print.css" />

<style>
    @page { size: A4 landscape; margin: 10mm 0; }
    .sum-row { background: #e7e7e7; font-weight: bold; }
</style>

<div class="card">
    <div class="px-5 py-4">
        <!-- 섹션들 -->
        <div class="sectionBox">
            <h2 class="modalH2">1. 섹션 제목</h2>
            <table class="print">...</table>
        </div>

        <!-- 버튼 (인쇄 시 숨김) -->
        <div class="bottom-btn no-print">
            <button class="btn btn-primary" onclick="return window.print()">출력하기</button>
            <button class="btn btn-outline-secondary" onclick="window.close()">닫기</button>
        </div>
    </div>
</div>
```

### 핵심 CSS 클래스

| 클래스 | 용도 |
|--------|------|
| `no-print` | 인쇄 시 숨김 |
| `print` | 인쇄용 테이블 |
| `page-break-always` | 페이지 나눔 |
| `sum-row` | 합계 행 |
| `bottom-btn` | 버튼 영역 |

---

## Design Reference

스타일 작업 시 필수 참조: [SCSS & Theme Design Guide](../../../docs/SCSS_GUIDE.md)

| 토큰 | 값 | 용도 |
|------|-----|------|
| `$color-primary` | `#007bff` | 버튼, 링크, 강조 |
| `$spacement-md` | `15px` | 기본 간격 |
| `$font-weight-bold` | `600` | 굵은 텍스트 |

---

## File Organization

```
KiiPS-UI/src/main/webapp/
├── WEB-INF/jsp/
│   ├── fund/
│   │   ├── fund-list.jsp
│   │   ├── fund-detail.jsp
│   │   └── fund-register.jsp
│   └── investment/
│       ├── investment-list.jsp
│       └── investment-dashboard.jsp
├── resources/
│   ├── css/
│   │   ├── common.css
│   │   └── fund-list.scss → fund-list.css
│   ├── js/
│   │   ├── fund-list.js
│   │   └── common.js
│   └── lib/
│       ├── realgrid/
│       └── apexcharts/
```

---

## Code Comments 표준

```javascript
/**
 * 펀드 목록 조회
 *
 * @description 검색 조건에 따라 펀드 목록을 조회하고 RealGrid에 표시
 * @param {Object} searchParams - 검색 조건 (fundName, fundType, dateFrom, dateTo)
 * @returns {Promise<void>}
 */
function searchFundList(searchParams = {}) {
    // ...
}
```
