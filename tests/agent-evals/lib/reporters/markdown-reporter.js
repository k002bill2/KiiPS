/**
 * KiiPS Markdown Reporter
 *
 * Generates detailed markdown reports for evaluation results.
 * Suitable for documentation, PR reviews, and historical tracking.
 */

const fs = require('fs');
const path = require('path');

class MarkdownReporter {
  constructor(options = {}) {
    this.name = 'markdown';
    this.outputDir = options.outputDir || 'results/';
    this.includeTranscripts = options.includeTranscripts || false;
    this.includeConfig = options.includeConfig !== false;
  }

  /**
   * Generate markdown report from evaluation results
   */
  async report(results) {
    const markdown = this.generateMarkdown(results);
    const filename = this.generateFilename();
    const filepath = path.join(this.outputDir, filename);

    // Ensure directory exists
    fs.mkdirSync(path.dirname(filepath), { recursive: true });

    // Write report
    fs.writeFileSync(filepath, markdown, 'utf8');

    console.log(`📄 Markdown report saved: ${filepath}`);

    return filepath;
  }

  generateFilename() {
    const date = new Date().toISOString().split('T')[0];
    const time = new Date().toISOString().split('T')[1].slice(0, 5).replace(':', '');
    return `agent-eval-report-${date}-${time}.md`;
  }

  generateMarkdown(results) {
    const sections = [
      this.generateHeader(results),
      this.generateQuickSummary(results),
      this.generateMetricsSection(results),
      this.generateSuiteDetails(results.suites),
      this.generateFailedTasksSection(results.suites),
      this.includeConfig ? this.generateConfigSection(results.config) : '',
      this.generateFooter(results)
    ];

    return sections.filter(Boolean).join('\n\n');
  }

  generateHeader(results) {
    const date = new Date(results.startTime).toISOString();
    const passRate = (results.summary.overallPassRate * 100).toFixed(1);
    const status = results.summary.overallPassRate >= results.config.metrics.passRateThreshold
      ? '✅ PASSED'
      : '❌ FAILED';

    return `# KiiPS AI Agent Evaluation Report

**Date**: ${date}
**Status**: ${status}
**Pass Rate**: ${passRate}%

---`;
  }

  generateQuickSummary(results) {
    const { summary } = results;
    const passRate = (summary.overallPassRate * 100).toFixed(1);
    const threshold = (results.config.metrics.passRateThreshold * 100).toFixed(0);

    // Generate progress bar
    const barWidth = 20;
    const filled = Math.round(summary.overallPassRate * barWidth);
    const progressBar = '█'.repeat(filled) + '░'.repeat(barWidth - filled);

    return `## 📊 Quick Summary

| Metric | Value |
|--------|-------|
| **Total Suites** | ${summary.totalSuites} |
| **Total Tasks** | ${summary.totalTasks} |
| **Passed** | ${summary.totalPassed} |
| **Failed** | ${summary.totalFailed} |
| **Pass Rate** | ${passRate}% |
| **Threshold** | ${threshold}% |

\`\`\`
Pass Rate: [${progressBar}] ${passRate}%
\`\`\``;
  }

  generateMetricsSection(results) {
    const { summary } = results;
    const avgLatency = this.calculateAverageLatency(results.suites);
    const duration = results.endTime - results.startTime;

    const passAt1 = (summary.overallPassRate * 100).toFixed(1);
    const passAt3 = (this.passAtK(summary.overallPassRate, 3) * 100).toFixed(1);
    const passPow3 = (this.passPowerK(summary.overallPassRate, 3) * 100).toFixed(1);

    return `## 📈 Metrics

### Pass Metrics

| Metric | Value | Description |
|--------|-------|-------------|
| **pass@1** | ${passAt1}% | Single trial success rate |
| **pass@3** | ${passAt3}% | At least 1 success in 3 trials |
| **pass^3** | ${passPow3}% | All 3 trials succeed |

### Performance

| Metric | Value |
|--------|-------|
| **Average Latency** | ${avgLatency.toFixed(0)}ms |
| **Total Duration** | ${this.formatDuration(duration)} |`;
  }

  generateSuiteDetails(suites) {
    const sections = ['## 📦 Suite Details'];

    for (const suite of suites) {
      const passRate = (suite.summary.passRate * 100).toFixed(1);
      const statusIcon = suite.summary.passRate >= 0.85 ? '✅' : '⚠️';

      sections.push(`### ${statusIcon} ${suite.name}

**Pass Rate**: ${passRate}% (${suite.summary.passed}/${suite.summary.total})

| Task | Status | Latency | Details |
|------|--------|---------|---------|`);

      for (const trial of suite.trials) {
        const status = trial.passed ? '✅ Pass' : '❌ Fail';
        const latency = trial.metrics.latency ? `${trial.metrics.latency}ms` : 'N/A';
        const details = trial.passed
          ? '-'
          : this.getFailureReason(trial);

        sections.push(`| ${trial.taskId} | ${status} | ${latency} | ${details} |`);
      }
    }

    return sections.join('\n');
  }

  generateFailedTasksSection(suites) {
    const failedTrials = [];

    for (const suite of suites) {
      for (const trial of suite.trials) {
        if (!trial.passed) {
          failedTrials.push({
            suite: suite.name,
            ...trial
          });
        }
      }
    }

    if (failedTrials.length === 0) {
      return `## ❌ Failed Tasks

🎉 No failed tasks!`;
    }

    const sections = ['## ❌ Failed Tasks'];

    for (const trial of failedTrials) {
      sections.push(`### ${trial.taskId}

**Suite**: ${trial.suite}
**Error**: ${trial.error?.message || 'See grading results'}

**Grading Results**:
\`\`\`json
${JSON.stringify(trial.grades.filter(g => !g.passed), null, 2)}
\`\`\``);
    }

    return sections.join('\n\n');
  }

  generateConfigSection(config) {
    return `## ⚙️ Configuration

<details>
<summary>Click to expand configuration</summary>

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\`

</details>`;
  }

  generateFooter(results) {
    const duration = results.endTime - results.startTime;

    return `---

## 📝 Notes

- **Environment**: ${results.config.environment.mode}
- **Grader**: ${results.config.graders.default}
- **Duration**: ${this.formatDuration(duration)}

---

*Generated by KiiPS AI Agent Evaluation System*
*Based on [Anthropic's Eval Guide](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents)*`;
  }

  // Helper methods
  getFailureReason(trial) {
    if (trial.error) {
      return trial.error.message.slice(0, 50) + '...';
    }

    const failedGrade = trial.grades.find(g => !g.passed);
    if (failedGrade) {
      return failedGrade.reason?.slice(0, 50) || failedGrade.type;
    }

    return 'Unknown';
  }

  calculateAverageLatency(suites) {
    let total = 0;
    let count = 0;

    for (const suite of suites) {
      for (const trial of suite.trials) {
        if (trial.metrics.latency) {
          total += trial.metrics.latency;
          count++;
        }
      }
    }

    return count > 0 ? total / count : 0;
  }

  formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  passAtK(rate, k) {
    return 1 - Math.pow(1 - rate, k);
  }

  passPowerK(rate, k) {
    return Math.pow(rate, k);
  }
}

module.exports = MarkdownReporter;
