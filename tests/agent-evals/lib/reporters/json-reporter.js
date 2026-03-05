/**
 * JSON Reporter for AI Agent Evaluation
 *
 * Generates JSON output for CI/CD integration and programmatic analysis.
 * Maintains history in JSONL format for trend analysis.
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');

class JSONReporter {
  /**
   * Create JSON Reporter
   * @param {Object} config - Configuration
   */
  constructor(config = {}) {
    this.name = 'json';
    this.outputDir = config.outputDir || './results/';
    this.historyFile = config.historyFile || 'history.jsonl';
    this.includeConfig = config.includeConfig !== false;
    this.includeTranscripts = config.includeTranscripts || false;
    this.prettyPrint = config.prettyPrint !== false;

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate JSON report
   * @param {Object} results - Evaluation results
   * @returns {string} Output file path
   */
  async report(results) {
    // Build JSON output
    const output = this.buildOutput(results);

    // Write main results file
    const mainFilename = `eval-results-${this.formatDate(results.startTime)}.json`;
    const mainPath = path.join(this.outputDir, mainFilename);
    fs.writeFileSync(
      mainPath,
      this.prettyPrint ? JSON.stringify(output, null, 2) : JSON.stringify(output)
    );

    // Also write latest.json for easy access
    const latestPath = path.join(this.outputDir, 'latest.json');
    fs.writeFileSync(
      latestPath,
      this.prettyPrint ? JSON.stringify(output, null, 2) : JSON.stringify(output)
    );

    // Append to history
    this.appendToHistory(output);

    return mainPath;
  }

  /**
   * Build JSON output structure
   * @param {Object} results - Raw results
   * @returns {Object} Formatted output
   */
  buildOutput(results) {
    const output = {
      version: results.version || '2.0',
      timestamp: new Date(results.startTime).toISOString(),
      duration: results.duration || (results.endTime - results.startTime),

      summary: {
        totalSuites: results.summary.totalSuites,
        totalTasks: results.summary.totalTasks,
        passed: results.summary.totalPassed,
        failed: results.summary.totalFailed,
        passRate: Math.round(results.summary.overallPassRate * 1000) / 1000,
        k: results.k || 1
      },

      metrics: this.formatMetrics(results.metrics),

      suites: results.suites.map(suite => ({
        name: suite.name,
        tasks: suite.summary.total,
        passed: suite.summary.passed,
        failed: suite.summary.failed,
        passRate: Math.round(suite.summary.passRate * 1000) / 1000,
        metrics: this.formatMetrics(suite.metrics),
        trials: this.formatTrials(suite.trials)
      }))
    };

    // Include config if enabled
    if (this.includeConfig) {
      output.config = {
        environment: results.config?.environment?.mode,
        trials: results.config?.trials,
        graders: Object.keys(results.config?.graders?.types || {})
      };
    }

    return output;
  }

  /**
   * Format metrics for output
   * @param {Object} metrics - Raw metrics
   * @returns {Object} Formatted metrics
   */
  formatMetrics(metrics) {
    if (!metrics) return null;

    const formatted = {};

    // Pass@k metrics
    for (const key of Object.keys(metrics)) {
      if (key.startsWith('pass@') || key.startsWith('pass^')) {
        formatted[key] = Math.round(metrics[key] * 1000) / 1000;
      }
    }

    // Efficiency metrics
    if (metrics.efficiency) {
      formatted.efficiency = {
        avgTokens: metrics.efficiency.avgTokens,
        avgToolCalls: metrics.efficiency.avgToolCalls,
        avgDuration: metrics.efficiency.avgDuration,
        costEstimate: metrics.efficiency.costEstimate
      };
    }

    // Efficiency score
    if (metrics.efficiencyScore !== undefined) {
      formatted.efficiencyScore = metrics.efficiencyScore;
      formatted.efficiencyTier = metrics.efficiencyTier?.tier;
    }

    return Object.keys(formatted).length > 0 ? formatted : null;
  }

  /**
   * Format trials for output
   * @param {Array} trials - Raw trials
   * @returns {Array} Formatted trials
   */
  formatTrials(trials) {
    if (!trials || !Array.isArray(trials)) return [];

    return trials.map(trial => {
      // Handle multi-trial results
      if (trial.trials) {
        return {
          taskId: trial.taskId,
          k: trial.k,
          passed: trial.passed,
          passAtK: trial.metrics?.[`pass@${trial.k}`],
          passK: trial.metrics?.[`pass^${trial.k}`],
          trials: trial.trials.map(t => ({
            trialNumber: t.trialNumber,
            passed: t.passed,
            latency: t.metrics?.latency
          }))
        };
      }

      // Single trial
      return {
        taskId: trial.taskId,
        passed: trial.passed,
        latency: trial.metrics?.latency,
        error: trial.error?.message
      };
    });
  }

  /**
   * Append result to history file
   * @param {Object} output - Result to append
   */
  appendToHistory(output) {
    const historyPath = path.join(this.outputDir, this.historyFile);

    // Create minimal history entry
    const historyEntry = {
      timestamp: output.timestamp,
      passRate: output.summary.passRate,
      passed: output.summary.passed,
      failed: output.summary.failed,
      total: output.summary.totalTasks,
      k: output.summary.k,
      duration: output.duration,
      metrics: {
        passAt1: output.metrics?.['pass@1'],
        passAtK: output.metrics?.[`pass@${output.summary.k}`],
        passK: output.metrics?.[`pass^${output.summary.k}`],
        efficiencyScore: output.metrics?.efficiencyScore
      }
    };

    // Append as JSONL
    fs.appendFileSync(historyPath, JSON.stringify(historyEntry) + '\n');
  }

  /**
   * Load history from file
   * @param {number} limit - Maximum entries to load
   * @returns {Array} History entries
   */
  loadHistory(limit = 100) {
    const historyPath = path.join(this.outputDir, this.historyFile);

    if (!fs.existsSync(historyPath)) {
      return [];
    }

    const lines = fs.readFileSync(historyPath, 'utf8')
      .trim()
      .split('\n')
      .filter(line => line.length > 0);

    return lines
      .slice(-limit)
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }

  /**
   * Format date for filename
   * @param {number} timestamp - Unix timestamp
   * @returns {string} Formatted date
   */
  formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
  }

  /**
   * Get CI/CD compatible exit code
   * @param {Object} results - Evaluation results
   * @param {number} threshold - Pass rate threshold (0-1)
   * @returns {number} Exit code (0 = success, 1 = failure)
   */
  static getExitCode(results, threshold = 0.85) {
    return results.summary.overallPassRate >= threshold ? 0 : 1;
  }

  /**
   * Generate GitHub Actions annotation format
   * @param {Object} results - Evaluation results
   * @returns {Array} Annotation strings
   */
  static getGitHubAnnotations(results) {
    const annotations = [];

    for (const suite of results.suites) {
      for (const trial of suite.trials) {
        // Handle multi-trial
        const trials = trial.trials || [trial];

        for (const t of trials) {
          if (!t.passed && t.error) {
            annotations.push(
              `::error title=${t.taskId}::${t.error.message || 'Test failed'}`
            );
          }
        }
      }
    }

    return annotations;
  }
}

module.exports = JSONReporter;
