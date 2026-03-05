/**
 * Trend Analyzer for AI Agent Evaluation
 *
 * Analyzes evaluation results over time to detect:
 * - Performance regressions
 * - Improvement trends
 * - Anomalies
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');

class TrendAnalyzer {
  /**
   * Create Trend Analyzer
   * @param {Object} config - Configuration
   */
  constructor(config = {}) {
    this.storePath = config.storePath || './results/trends/';
    this.retentionDays = config.retentionDays || 90;
    this.historyFile = config.historyFile || './results/history.jsonl';

    // Thresholds
    this.regressionThreshold = config.regressionThreshold || 0.05; // 5% drop
    this.significantChangeThreshold = config.significantChangeThreshold || 0.10;

    // Ensure store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  /**
   * Load history from file
   * @param {number} days - Number of days to load
   * @returns {Array} History entries
   */
  loadHistory(days = null) {
    const retentionDays = days || this.retentionDays;
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    if (!fs.existsSync(this.historyFile)) {
      return [];
    }

    const lines = fs.readFileSync(this.historyFile, 'utf8')
      .trim()
      .split('\n')
      .filter(line => line.length > 0);

    return lines
      .map(line => {
        try {
          return JSON.parse(line);
        } catch {
          return null;
        }
      })
      .filter(entry => {
        if (!entry) return false;
        const timestamp = new Date(entry.timestamp).getTime();
        return timestamp >= cutoff;
      });
  }

  /**
   * Detect regression in current results
   * @param {Object} current - Current evaluation results
   * @returns {Object} Regression analysis
   */
  detectRegression(current) {
    const history = this.loadHistory(30); // Last 30 days

    if (history.length === 0) {
      return { hasRegression: false, reason: 'No historical data' };
    }

    // Calculate recent average
    const recentAvg = this.calculateAverage(history.slice(-10));
    const currentPassRate = current.summary?.overallPassRate ||
      (current.passed / current.total);

    const change = currentPassRate - recentAvg.passRate;
    const percentChange = recentAvg.passRate > 0
      ? (change / recentAvg.passRate) * 100
      : 0;

    const analysis = {
      hasRegression: change < -this.regressionThreshold,
      currentPassRate: Math.round(currentPassRate * 1000) / 1000,
      recentAverage: Math.round(recentAvg.passRate * 1000) / 1000,
      change: Math.round(change * 1000) / 1000,
      percentChange: Math.round(percentChange * 10) / 10,
      severity: this.getSeverity(change),
      comparison: {
        period: '10 runs',
        samplesUsed: Math.min(history.length, 10)
      }
    };

    if (analysis.hasRegression) {
      analysis.recommendation = this.getRecommendation(analysis);
    }

    return analysis;
  }

  /**
   * Calculate average metrics from history
   * @param {Array} entries - History entries
   * @returns {Object} Averages
   */
  calculateAverage(entries) {
    if (entries.length === 0) {
      return { passRate: 0, duration: 0 };
    }

    const sum = entries.reduce((acc, entry) => ({
      passRate: acc.passRate + (entry.passRate || 0),
      duration: acc.duration + (entry.duration || 0),
      efficiencyScore: acc.efficiencyScore + (entry.metrics?.efficiencyScore || 0)
    }), { passRate: 0, duration: 0, efficiencyScore: 0 });

    return {
      passRate: sum.passRate / entries.length,
      duration: sum.duration / entries.length,
      efficiencyScore: sum.efficiencyScore / entries.length
    };
  }

  /**
   * Get severity level of regression
   * @param {number} change - Pass rate change
   * @returns {string} Severity level
   */
  getSeverity(change) {
    if (change >= 0) return 'none';
    if (change > -0.05) return 'minor';
    if (change > -0.10) return 'moderate';
    if (change > -0.20) return 'significant';
    return 'critical';
  }

  /**
   * Get recommendation based on analysis
   * @param {Object} analysis - Regression analysis
   * @returns {string} Recommendation
   */
  getRecommendation(analysis) {
    switch (analysis.severity) {
      case 'critical':
        return 'CRITICAL: Investigate immediately. Check recent changes and consider reverting.';
      case 'significant':
        return 'Significant regression detected. Review recent code changes and test coverage.';
      case 'moderate':
        return 'Moderate regression. Monitor closely and investigate if trend continues.';
      case 'minor':
        return 'Minor regression within normal variance. Continue monitoring.';
      default:
        return 'No action needed.';
    }
  }

  /**
   * Generate trend report
   * @param {number} days - Days to analyze
   * @returns {Object} Trend report
   */
  generateTrendReport(days = 30) {
    const history = this.loadHistory(days);

    if (history.length < 2) {
      return {
        status: 'insufficient_data',
        message: `Need at least 2 data points. Found: ${history.length}`,
        history: history
      };
    }

    // Split into periods
    const halfPoint = Math.floor(history.length / 2);
    const firstHalf = history.slice(0, halfPoint);
    const secondHalf = history.slice(halfPoint);

    const firstAvg = this.calculateAverage(firstHalf);
    const secondAvg = this.calculateAverage(secondHalf);

    // Calculate trend
    const passRateTrend = secondAvg.passRate - firstAvg.passRate;
    const durationTrend = secondAvg.duration - firstAvg.duration;

    // Find best and worst runs
    const sorted = [...history].sort((a, b) => b.passRate - a.passRate);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Calculate statistics
    const passRates = history.map(h => h.passRate);
    const stats = this.calculateStatistics(passRates);

    return {
      status: 'ok',
      period: {
        days,
        dataPoints: history.length,
        from: history[0]?.timestamp,
        to: history[history.length - 1]?.timestamp
      },
      current: {
        passRate: secondAvg.passRate,
        duration: secondAvg.duration
      },
      trend: {
        passRate: {
          direction: passRateTrend > 0.01 ? 'improving' :
            (passRateTrend < -0.01 ? 'declining' : 'stable'),
          change: Math.round(passRateTrend * 1000) / 1000,
          percentChange: firstAvg.passRate > 0
            ? Math.round((passRateTrend / firstAvg.passRate) * 1000) / 10
            : 0
        },
        duration: {
          direction: durationTrend < -100 ? 'improving' :
            (durationTrend > 100 ? 'declining' : 'stable'),
          change: Math.round(durationTrend)
        }
      },
      statistics: {
        mean: Math.round(stats.mean * 1000) / 1000,
        median: Math.round(stats.median * 1000) / 1000,
        stdDev: Math.round(stats.stdDev * 1000) / 1000,
        min: Math.round(stats.min * 1000) / 1000,
        max: Math.round(stats.max * 1000) / 1000
      },
      highlights: {
        best: {
          timestamp: best?.timestamp,
          passRate: best?.passRate
        },
        worst: {
          timestamp: worst?.timestamp,
          passRate: worst?.passRate
        }
      },
      rawHistory: history
    };
  }

  /**
   * Calculate basic statistics
   * @param {Array} values - Numeric values
   * @returns {Object} Statistics
   */
  calculateStatistics(values) {
    if (values.length === 0) {
      return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
    }

    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = sum / values.length;

    // Median
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // Standard deviation
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / values.length;
    const stdDev = Math.sqrt(avgSquaredDiff);

    return {
      mean,
      median,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1]
    };
  }

  /**
   * Compare two evaluation runs
   * @param {string} date1 - First date (ISO string or 'latest')
   * @param {string} date2 - Second date
   * @returns {Object} Comparison result
   */
  compareRuns(date1, date2) {
    const history = this.loadHistory();

    const findRun = (date) => {
      if (date === 'latest') {
        return history[history.length - 1];
      }
      return history.find(h => h.timestamp.startsWith(date));
    };

    const run1 = findRun(date1);
    const run2 = findRun(date2);

    if (!run1 || !run2) {
      return {
        status: 'error',
        message: 'One or both runs not found',
        found: { date1: !!run1, date2: !!run2 }
      };
    }

    const passRateDiff = run2.passRate - run1.passRate;
    const durationDiff = run2.duration - run1.duration;

    return {
      status: 'ok',
      run1: {
        timestamp: run1.timestamp,
        passRate: run1.passRate,
        duration: run1.duration
      },
      run2: {
        timestamp: run2.timestamp,
        passRate: run2.passRate,
        duration: run2.duration
      },
      comparison: {
        passRate: {
          diff: Math.round(passRateDiff * 1000) / 1000,
          percentChange: run1.passRate > 0
            ? Math.round((passRateDiff / run1.passRate) * 1000) / 10
            : 0,
          direction: passRateDiff > 0 ? 'improved' :
            (passRateDiff < 0 ? 'regressed' : 'unchanged')
        },
        duration: {
          diff: Math.round(durationDiff),
          percentChange: run1.duration > 0
            ? Math.round((durationDiff / run1.duration) * 1000) / 10
            : 0,
          direction: durationDiff < 0 ? 'faster' :
            (durationDiff > 0 ? 'slower' : 'unchanged')
        }
      }
    };
  }

  /**
   * Save trend report to file
   * @param {Object} report - Trend report
   * @returns {string} File path
   */
  saveReport(report) {
    const filename = `trend-report-${new Date().toISOString().slice(0, 10)}.json`;
    const filepath = path.join(this.storePath, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));

    return filepath;
  }

  /**
   * Clean up old trend data
   */
  cleanup() {
    const cutoff = Date.now() - (this.retentionDays * 24 * 60 * 60 * 1000);

    // Clean old reports
    if (fs.existsSync(this.storePath)) {
      const files = fs.readdirSync(this.storePath)
        .filter(f => f.startsWith('trend-report-'));

      for (const file of files) {
        const filepath = path.join(this.storePath, file);
        const stat = fs.statSync(filepath);
        if (stat.mtime.getTime() < cutoff) {
          fs.unlinkSync(filepath);
        }
      }
    }
  }
}

module.exports = TrendAnalyzer;
