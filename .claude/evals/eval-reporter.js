/**
 * KiiPS Agent Eval Reporter
 * 평가 결과 리포트 생성, 트렌드 분석, 회귀 감지
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

// 경로 설정
const CONFIG_PATH = path.join(__dirname, 'eval-config.json');
const RESULTS_DIR = path.join(__dirname, 'results');

class EvalReporter {
  constructor(options = {}) {
    this.config = this.loadConfig();
    this.options = {
      format: options.format || 'markdown',
      trendWindow: options.trendWindow || 7,
      ...options
    };
  }

  /**
   * 설정 로드
   */
  loadConfig() {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (error) {
      return { reporting: { trendWindow: 7, regressionThreshold: 0.1 } };
    }
  }

  /**
   * 최신 결과 로드
   */
  loadLatestResults() {
    const latestPath = path.join(RESULTS_DIR, 'latest.json');
    if (fs.existsSync(latestPath)) {
      return JSON.parse(fs.readFileSync(latestPath, 'utf8'));
    }
    return null;
  }

  /**
   * 히스토리 로드
   */
  loadHistory(days = 30) {
    const historyPath = path.join(RESULTS_DIR, 'history.jsonl');
    if (!fs.existsSync(historyPath)) {
      return [];
    }

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const lines = fs.readFileSync(historyPath, 'utf8').split('\n').filter(Boolean);
    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(entry => entry && new Date(entry.timestamp) > cutoff);
  }

  /**
   * Markdown 리포트 생성
   */
  generateMarkdownReport(results) {
    const timestamp = new Date().toISOString();
    let report = `# KiiPS Agent Eval Report\n\n`;
    report += `> Generated: ${timestamp}\n\n`;

    for (const suiteResult of results) {
      report += `## Suite: ${suiteResult.suite}\n\n`;
      report += `| Metric | Value |\n`;
      report += `|--------|-------|\n`;
      report += `| Total Tasks | ${suiteResult.summary.total} |\n`;
      report += `| Passed | ${suiteResult.summary.passed} |\n`;
      report += `| Failed | ${suiteResult.summary.failed} |\n`;
      report += `| Pass@1 | ${(suiteResult.summary.passAt1 * 100).toFixed(1)}% |\n`;
      report += `| Pass@3 | ${(suiteResult.summary.passAt3 * 100).toFixed(1)}% |\n`;
      report += `| Pass^3 (Consistency) | ${(suiteResult.summary.passExp3 * 100).toFixed(1)}% |\n\n`;

      // 개별 작업 결과
      report += `### Task Results\n\n`;
      report += `| Task ID | Description | Pass@1 | Pass@3 | Status |\n`;
      report += `|---------|-------------|--------|--------|--------|\n`;

      for (const task of suiteResult.tasks) {
        const status = task.expectFailure
          ? (task.actualPassed ? '✅ (Expected Fail)' : '❌ (Should Fail)')
          : (task.successes > 0 ? '✅' : '❌');
        report += `| ${task.id} | ${task.desc.substring(0, 30)}... | ${(task.passAt1 * 100).toFixed(0)}% | ${(task.passAt3 * 100).toFixed(0)}% | ${status} |\n`;
      }

      report += '\n';
    }

    return report;
  }

  /**
   * JSON 리포트 생성
   */
  generateJSONReport(results) {
    return {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      results,
      summary: this.calculateOverallSummary(results)
    };
  }

  /**
   * 전체 요약 계산
   */
  calculateOverallSummary(results) {
    let totalTasks = 0;
    let totalPassed = 0;
    let passAt1Sum = 0;
    let passAt3Sum = 0;
    let passExp3Sum = 0;

    for (const suiteResult of results) {
      totalTasks += suiteResult.summary.total;
      totalPassed += suiteResult.summary.passed;
      passAt1Sum += suiteResult.summary.passAt1 * suiteResult.summary.total;
      passAt3Sum += suiteResult.summary.passAt3 * suiteResult.summary.total;
      passExp3Sum += suiteResult.summary.passExp3 * suiteResult.summary.total;
    }

    return {
      totalTasks,
      totalPassed,
      totalFailed: totalTasks - totalPassed,
      overallPassRate: totalTasks > 0 ? (totalPassed / totalTasks) * 100 : 0,
      avgPassAt1: totalTasks > 0 ? (passAt1Sum / totalTasks) * 100 : 0,
      avgPassAt3: totalTasks > 0 ? (passAt3Sum / totalTasks) * 100 : 0,
      avgPassExp3: totalTasks > 0 ? (passExp3Sum / totalTasks) * 100 : 0
    };
  }

  /**
   * 트렌드 분석
   */
  analyzeTrends(days = 7) {
    const history = this.loadHistory(days);
    if (history.length < 2) {
      return { status: 'insufficient_data', message: 'Need at least 2 data points for trend analysis' };
    }

    const metrics = {
      passAt1: [],
      passAt3: [],
      passExp3: [],
      timestamps: []
    };

    for (const entry of history) {
      const summary = this.calculateOverallSummary(entry.results);
      metrics.passAt1.push(summary.avgPassAt1);
      metrics.passAt3.push(summary.avgPassAt3);
      metrics.passExp3.push(summary.avgPassExp3);
      metrics.timestamps.push(entry.timestamp);
    }

    return {
      status: 'ok',
      dataPoints: history.length,
      period: `${days} days`,
      trends: {
        passAt1: this.calculateTrend(metrics.passAt1),
        passAt3: this.calculateTrend(metrics.passAt3),
        passExp3: this.calculateTrend(metrics.passExp3)
      },
      latest: {
        passAt1: metrics.passAt1[metrics.passAt1.length - 1],
        passAt3: metrics.passAt3[metrics.passAt3.length - 1],
        passExp3: metrics.passExp3[metrics.passExp3.length - 1]
      },
      history: metrics
    };
  }

  /**
   * 트렌드 계산 (선형 회귀)
   */
  calculateTrend(values) {
    if (values.length < 2) return { direction: 'stable', change: 0 };

    const first = values.slice(0, Math.ceil(values.length / 2));
    const second = values.slice(Math.ceil(values.length / 2));

    const avgFirst = first.reduce((a, b) => a + b, 0) / first.length;
    const avgSecond = second.reduce((a, b) => a + b, 0) / second.length;

    const change = avgSecond - avgFirst;
    const changePercent = avgFirst !== 0 ? (change / avgFirst) * 100 : 0;

    let direction = 'stable';
    if (changePercent > 5) direction = 'improving';
    else if (changePercent < -5) direction = 'declining';

    return {
      direction,
      change: change.toFixed(2),
      changePercent: changePercent.toFixed(2),
      avgFirst: avgFirst.toFixed(2),
      avgSecond: avgSecond.toFixed(2)
    };
  }

  /**
   * 회귀 감지
   */
  detectRegression() {
    const history = this.loadHistory(30);
    if (history.length < 2) {
      return { detected: false, message: 'Insufficient history for regression detection' };
    }

    const latest = history[history.length - 1];
    const previous = history[history.length - 2];

    const latestSummary = this.calculateOverallSummary(latest.results);
    const previousSummary = this.calculateOverallSummary(previous.results);

    const threshold = this.config.reporting?.regressionThreshold || 0.1;
    const regressions = [];

    // Pass@1 회귀 체크
    if (latestSummary.avgPassAt1 < previousSummary.avgPassAt1 * (1 - threshold)) {
      regressions.push({
        metric: 'Pass@1',
        previous: previousSummary.avgPassAt1.toFixed(2),
        current: latestSummary.avgPassAt1.toFixed(2),
        drop: (previousSummary.avgPassAt1 - latestSummary.avgPassAt1).toFixed(2)
      });
    }

    // Pass@3 회귀 체크
    if (latestSummary.avgPassAt3 < previousSummary.avgPassAt3 * (1 - threshold)) {
      regressions.push({
        metric: 'Pass@3',
        previous: previousSummary.avgPassAt3.toFixed(2),
        current: latestSummary.avgPassAt3.toFixed(2),
        drop: (previousSummary.avgPassAt3 - latestSummary.avgPassAt3).toFixed(2)
      });
    }

    return {
      detected: regressions.length > 0,
      regressions,
      threshold: `${threshold * 100}%`,
      comparison: {
        latest: latestSummary,
        previous: previousSummary
      }
    };
  }

  /**
   * 두 실행 비교
   */
  compareRuns(run1, run2) {
    const summary1 = this.calculateOverallSummary(run1.results);
    const summary2 = this.calculateOverallSummary(run2.results);

    return {
      run1: {
        timestamp: run1.timestamp,
        summary: summary1
      },
      run2: {
        timestamp: run2.timestamp,
        summary: summary2
      },
      diff: {
        passAt1: (summary2.avgPassAt1 - summary1.avgPassAt1).toFixed(2),
        passAt3: (summary2.avgPassAt3 - summary1.avgPassAt3).toFixed(2),
        passExp3: (summary2.avgPassExp3 - summary1.avgPassExp3).toFixed(2),
        passRate: (summary2.overallPassRate - summary1.overallPassRate).toFixed(2)
      }
    };
  }

  /**
   * 리포트 저장
   */
  saveReport(report, format = 'markdown') {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = format === 'json' ? 'json' : 'md';
    const filename = `report-${timestamp}.${extension}`;
    const filepath = path.join(RESULTS_DIR, filename);

    const content = format === 'json' ? JSON.stringify(report, null, 2) : report;
    fs.writeFileSync(filepath, content, 'utf8');

    return filepath;
  }

  /**
   * 메인 리포트 생성
   */
  generate(options = {}) {
    const results = this.loadLatestResults();
    if (!results) {
      return { error: 'No results found. Run eval first.' };
    }

    const format = options.format || this.options.format;

    const report = format === 'json'
      ? this.generateJSONReport(results)
      : this.generateMarkdownReport(results);

    if (options.save) {
      const filepath = this.saveReport(report, format);
      console.log(`Report saved to: ${filepath}`);
    }

    return report;
  }
}

/**
 * CLI 실행
 */
if (require.main === module) {
  const args = process.argv.slice(2);
  const options = {
    format: 'markdown',
    save: false
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--json':
        options.format = 'json';
        break;
      case '--save':
        options.save = true;
        break;
      case '--trends':
        options.trends = true;
        options.trendDays = parseInt(args[++i], 10) || 7;
        break;
      case '--regression':
        options.regression = true;
        break;
      case '--help':
        console.log(`
KiiPS Agent Eval Reporter

Usage: node eval-reporter.js [options]

Options:
  --json          Output JSON format
  --save          Save report to file
  --trends <n>    Show trends for last n days
  --regression    Detect regressions
  --help          Show this help
        `);
        process.exit(0);
    }
  }

  const reporter = new EvalReporter(options);

  if (options.trends) {
    console.log('\n📈 Trend Analysis');
    console.log(JSON.stringify(reporter.analyzeTrends(options.trendDays), null, 2));
  } else if (options.regression) {
    console.log('\n🔍 Regression Detection');
    console.log(JSON.stringify(reporter.detectRegression(), null, 2));
  } else {
    const report = reporter.generate(options);
    console.log(report);
  }
}

module.exports = { EvalReporter };
