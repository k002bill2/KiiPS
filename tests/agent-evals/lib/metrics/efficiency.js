/**
 * Efficiency Metrics Calculator
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * Beyond pass/fail, track resource usage to optimize agent performance.
 *
 * Tracked metrics:
 * - Token usage (input/output)
 * - Tool call count
 * - Execution time
 * - Turn count
 * - Cost estimation
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

/**
 * Calculate efficiency metrics from trial results
 * @param {Array} trials - Array of trial results with metrics
 * @returns {Object} Aggregated efficiency metrics
 */
function calculateEfficiency(trials) {
  if (trials.length === 0) {
    return {
      avgTokens: 0,
      avgToolCalls: 0,
      avgDuration: 0,
      avgTurns: 0,
      totalTokens: 0,
      totalToolCalls: 0,
      totalDuration: 0,
      costEstimate: 0
    };
  }

  const totals = trials.reduce((acc, trial) => {
    const metrics = trial.metrics || {};
    return {
      tokens: acc.tokens + (metrics.tokenCount || metrics.tokens || 0),
      inputTokens: acc.inputTokens + (metrics.inputTokens || 0),
      outputTokens: acc.outputTokens + (metrics.outputTokens || 0),
      toolCalls: acc.toolCalls + (metrics.toolCallCount || metrics.toolCalls || 0),
      duration: acc.duration + (metrics.latency || metrics.duration || 0),
      turns: acc.turns + (metrics.turns || 0)
    };
  }, { tokens: 0, inputTokens: 0, outputTokens: 0, toolCalls: 0, duration: 0, turns: 0 });

  const count = trials.length;

  return {
    avgTokens: Math.round(totals.tokens / count),
    avgInputTokens: Math.round(totals.inputTokens / count),
    avgOutputTokens: Math.round(totals.outputTokens / count),
    avgToolCalls: Math.round(totals.toolCalls / count * 10) / 10,
    avgDuration: Math.round(totals.duration / count),
    avgTurns: Math.round(totals.turns / count * 10) / 10,
    totalTokens: totals.tokens,
    totalToolCalls: totals.toolCalls,
    totalDuration: totals.duration,
    costEstimate: estimateCost(totals.inputTokens, totals.outputTokens)
  };
}

/**
 * Estimate cost based on token usage
 * @param {number} inputTokens - Input token count
 * @param {number} outputTokens - Output token count
 * @param {string} model - Model name (default: claude-sonnet-4)
 * @returns {number} Estimated cost in USD
 */
function estimateCost(inputTokens, outputTokens, model = 'claude-sonnet-4') {
  // Pricing per 1M tokens (as of 2026)
  const pricing = {
    'claude-opus-4-5': { input: 15.00, output: 75.00 },
    'claude-sonnet-4': { input: 3.00, output: 15.00 },
    'claude-haiku-4': { input: 0.25, output: 1.25 }
  };

  const prices = pricing[model] || pricing['claude-sonnet-4'];

  const inputCost = (inputTokens / 1_000_000) * prices.input;
  const outputCost = (outputTokens / 1_000_000) * prices.output;

  return Math.round((inputCost + outputCost) * 10000) / 10000;
}

/**
 * Calculate efficiency score (0-100)
 * @param {Object} metrics - Efficiency metrics
 * @param {Object} baselines - Baseline metrics for comparison
 * @returns {number} Efficiency score
 */
function calculateEfficiencyScore(metrics, baselines = {}) {
  const defaults = {
    maxTokens: 10000,
    maxToolCalls: 20,
    maxDuration: 60000,
    maxTurns: 10
  };

  const limits = { ...defaults, ...baselines };

  // Calculate individual scores (0-1, lower is better for these metrics)
  const tokenScore = 1 - Math.min(metrics.avgTokens / limits.maxTokens, 1);
  const toolCallScore = 1 - Math.min(metrics.avgToolCalls / limits.maxToolCalls, 1);
  const durationScore = 1 - Math.min(metrics.avgDuration / limits.maxDuration, 1);
  const turnScore = 1 - Math.min(metrics.avgTurns / limits.maxTurns, 1);

  // Weighted average (tokens and duration matter more)
  const weights = { token: 0.3, toolCall: 0.2, duration: 0.3, turn: 0.2 };
  const score = (
    tokenScore * weights.token +
    toolCallScore * weights.toolCall +
    durationScore * weights.duration +
    turnScore * weights.turn
  ) * 100;

  return Math.round(score);
}

/**
 * Get efficiency tier based on score
 * @param {number} score - Efficiency score (0-100)
 * @returns {Object} Tier information
 */
function getEfficiencyTier(score) {
  if (score >= 90) {
    return { tier: 'Excellent', emoji: '🏆', description: 'Highly optimized agent behavior' };
  } else if (score >= 75) {
    return { tier: 'Good', emoji: '✅', description: 'Efficient with room for improvement' };
  } else if (score >= 60) {
    return { tier: 'Moderate', emoji: '📊', description: 'Average efficiency, consider optimization' };
  } else if (score >= 40) {
    return { tier: 'Below Average', emoji: '⚠️', description: 'Significant optimization needed' };
  } else {
    return { tier: 'Poor', emoji: '❌', description: 'Critical efficiency issues' };
  }
}

/**
 * Compare efficiency between two evaluation runs
 * @param {Object} current - Current run metrics
 * @param {Object} previous - Previous run metrics
 * @returns {Object} Comparison results
 */
function compareEfficiency(current, previous) {
  const changes = {};

  const metrics = ['avgTokens', 'avgToolCalls', 'avgDuration', 'avgTurns'];

  for (const metric of metrics) {
    const curr = current[metric] || 0;
    const prev = previous[metric] || 0;

    if (prev === 0) {
      changes[metric] = { change: 0, percent: 0, improved: null };
    } else {
      const change = curr - prev;
      const percent = Math.round((change / prev) * 100);
      const improved = change < 0; // Lower is better for these metrics

      changes[metric] = {
        current: curr,
        previous: prev,
        change,
        percent,
        improved
      };
    }
  }

  // Overall improvement assessment
  const improvements = Object.values(changes).filter(c => c.improved === true).length;
  const regressions = Object.values(changes).filter(c => c.improved === false).length;

  return {
    metrics: changes,
    summary: {
      improvements,
      regressions,
      verdict: improvements > regressions ? 'improved' : (improvements < regressions ? 'regressed' : 'stable')
    }
  };
}

/**
 * Format efficiency metrics for display
 * @param {Object} metrics - Efficiency metrics
 * @returns {string} Formatted string
 */
function formatEfficiency(metrics) {
  const lines = [
    `Tokens: ${metrics.avgTokens.toLocaleString()} avg (${metrics.totalTokens.toLocaleString()} total)`,
    `Tool Calls: ${metrics.avgToolCalls} avg`,
    `Duration: ${formatDuration(metrics.avgDuration)}`,
    `Turns: ${metrics.avgTurns} avg`,
    `Est. Cost: $${metrics.costEstimate.toFixed(4)}`
  ];

  return lines.join('\n');
}

/**
 * Format duration in human-readable format
 * @param {number} ms - Duration in milliseconds
 * @returns {string} Formatted duration
 */
function formatDuration(ms) {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

module.exports = {
  calculateEfficiency,
  estimateCost,
  calculateEfficiencyScore,
  getEfficiencyTier,
  compareEfficiency,
  formatEfficiency,
  formatDuration
};
