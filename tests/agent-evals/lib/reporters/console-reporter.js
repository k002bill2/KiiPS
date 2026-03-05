/**
 * KiiPS Console Reporter
 *
 * Real-time console output for evaluation progress and results.
 * Supports colors and progress indicators.
 */

class ConsoleReporter {
  constructor(options = {}) {
    this.name = 'console';
    this.verbose = options.verbose || false;
    this.colors = options.colors !== false;
    this.showTranscripts = options.showTranscripts || false;
  }

  // Color codes
  get c() {
    if (!this.colors) {
      return {
        reset: '', bold: '', dim: '',
        red: '', green: '', yellow: '', blue: '', cyan: '', gray: ''
      };
    }
    return {
      reset: '\x1b[0m',
      bold: '\x1b[1m',
      dim: '\x1b[2m',
      red: '\x1b[31m',
      green: '\x1b[32m',
      yellow: '\x1b[33m',
      blue: '\x1b[34m',
      cyan: '\x1b[36m',
      gray: '\x1b[90m'
    };
  }

  /**
   * Generate report from evaluation results
   */
  async report(results) {
    this.printHeader();
    this.printConfig(results.config);
    this.printSuites(results.suites);
    this.printSummary(results.summary, results);
    this.printFooter(results);
  }

  printHeader() {
    const { c } = this;
    console.log('');
    console.log(`${c.bold}${c.cyan}╔═══════════════════════════════════════════════════════════════╗${c.reset}`);
    console.log(`${c.bold}${c.cyan}║${c.reset}       ${c.bold}KiiPS AI Agent Evaluation Results${c.reset}       ${c.bold}${c.cyan}║${c.reset}`);
    console.log(`${c.bold}${c.cyan}╚═══════════════════════════════════════════════════════════════╝${c.reset}`);
    console.log('');
  }

  printConfig(config) {
    const { c } = this;
    console.log(`${c.dim}Environment: ${config.environment.mode} | Grader: ${config.graders.default}${c.reset}`);
    console.log('');
  }

  printSuites(suites) {
    const { c } = this;

    for (const suite of suites) {
      this.printSuiteHeader(suite);
      this.printTrials(suite.trials);
      this.printSuiteSummary(suite);
      console.log('');
    }
  }

  printSuiteHeader(suite) {
    const { c } = this;
    const passRate = (suite.summary.passRate * 100).toFixed(1);
    const statusColor = suite.summary.passRate >= 0.85 ? c.green : c.yellow;

    console.log(`${c.bold}📦 ${suite.name}${c.reset} ${c.dim}(${passRate}% pass rate)${c.reset}`);
    console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`);
  }

  printTrials(trials) {
    const { c } = this;

    for (const trial of trials) {
      const icon = trial.passed ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
      const latency = trial.metrics.latency ? `${trial.metrics.latency}ms` : 'N/A';

      console.log(`  ${icon} ${trial.taskId} ${c.dim}(${latency})${c.reset}`);

      // Show failed grades
      if (!trial.passed && this.verbose) {
        const failedGrades = trial.grades.filter(g => !g.passed);
        for (const grade of failedGrades) {
          console.log(`    ${c.red}└─ ${grade.type}: ${grade.reason}${c.reset}`);
        }
      }

      // Show error if any
      if (trial.error) {
        console.log(`    ${c.red}└─ Error: ${trial.error.message}${c.reset}`);
      }
    }
  }

  printSuiteSummary(suite) {
    const { c } = this;
    const { passed, failed, total } = suite.summary;

    console.log(`${c.dim}${'─'.repeat(60)}${c.reset}`);
    console.log(`  ${c.green}Passed: ${passed}${c.reset} | ${c.red}Failed: ${failed}${c.reset} | Total: ${total}`);
  }

  printSummary(summary, results) {
    const { c } = this;
    const passRatePercent = (summary.overallPassRate * 100).toFixed(1);
    const threshold = (results.config.metrics.passRateThreshold * 100).toFixed(0);
    const passedThreshold = summary.overallPassRate >= results.config.metrics.passRateThreshold;

    console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log(`${c.bold}                        OVERALL SUMMARY${c.reset}`);
    console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log('');

    // Pass rate with visual bar
    const barWidth = 40;
    const filledWidth = Math.round(summary.overallPassRate * barWidth);
    const emptyWidth = barWidth - filledWidth;
    const barColor = passedThreshold ? c.green : c.red;

    console.log(`  Pass Rate: ${barColor}${passRatePercent}%${c.reset} ${c.dim}(threshold: ${threshold}%)${c.reset}`);
    console.log(`  [${barColor}${'█'.repeat(filledWidth)}${c.gray}${'░'.repeat(emptyWidth)}${c.reset}]`);
    console.log('');

    // Statistics
    console.log(`  ${c.bold}Statistics:${c.reset}`);
    console.log(`    Total Suites:  ${summary.totalSuites}`);
    console.log(`    Total Tasks:   ${summary.totalTasks}`);
    console.log(`    ${c.green}Passed:${c.reset}        ${summary.totalPassed}`);
    console.log(`    ${c.red}Failed:${c.reset}        ${summary.totalFailed}`);
    console.log('');

    // Metrics
    if (results.config.metrics.trackLatency) {
      const avgLatency = this.calculateAverageLatency(results.suites);
      console.log(`  ${c.bold}Metrics:${c.reset}`);
      console.log(`    Avg Latency:   ${avgLatency.toFixed(0)}ms`);
    }

    // Pass@k calculations
    console.log('');
    console.log(`  ${c.bold}Pass Metrics:${c.reset}`);
    console.log(`    pass@1:        ${passRatePercent}%`);
    console.log(`    pass@3:        ${(this.passAtK(summary.overallPassRate, 3) * 100).toFixed(1)}%`);
    console.log(`    pass^3:        ${(this.passPowerK(summary.overallPassRate, 3) * 100).toFixed(1)}%`);
  }

  printFooter(results) {
    const { c } = this;
    const duration = results.endTime - results.startTime;
    const passedThreshold = results.summary.overallPassRate >= results.config.metrics.passRateThreshold;

    console.log('');
    console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);

    if (passedThreshold) {
      console.log(`${c.bold}${c.green}✓ EVALUATION PASSED${c.reset} ${c.dim}(${this.formatDuration(duration)})${c.reset}`);
    } else {
      console.log(`${c.bold}${c.red}✗ EVALUATION FAILED${c.reset} ${c.dim}(${this.formatDuration(duration)})${c.reset}`);
    }

    console.log(`${c.bold}${c.cyan}═══════════════════════════════════════════════════════════════${c.reset}`);
    console.log('');
  }

  // Helper methods
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

  /**
   * Attach to harness for real-time updates
   */
  attachToHarness(harness) {
    const { c } = this;

    harness.on('evalStart', ({ totalSuites }) => {
      console.log(`${c.dim}Starting evaluation with ${totalSuites} suites...${c.reset}`);
    });

    harness.on('suiteStart', ({ name }) => {
      console.log(`${c.cyan}▶${c.reset} Running suite: ${name}`);
    });

    harness.on('taskStart', ({ taskId }) => {
      if (this.verbose) {
        process.stdout.write(`  ${c.dim}⧗ ${taskId}...${c.reset}`);
      }
    });

    harness.on('taskEnd', ({ taskId, passed }) => {
      if (this.verbose) {
        const icon = passed ? `${c.green}✓${c.reset}` : `${c.red}✗${c.reset}`;
        console.log(`\r  ${icon} ${taskId}`);
      }
    });

    harness.on('suiteEnd', ({ name, passRate }) => {
      const percent = (passRate * 100).toFixed(0);
      console.log(`${c.cyan}◼${c.reset} Completed: ${name} ${c.dim}(${percent}%)${c.reset}`);
    });
  }
}

module.exports = ConsoleReporter;
