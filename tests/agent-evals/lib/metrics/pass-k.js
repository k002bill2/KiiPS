/**
 * Pass^k Metric Calculator
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * Pass^k measures the probability that ALL k attempts succeed.
 *
 * Use case: When consistency is critical
 * Example: Customer-facing agents where every interaction must succeed
 *
 * Formula: pass^k = p^k
 * Where: p = individual success probability
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

/**
 * Calculate pass^k from trial results
 * @param {Array} results - Array of trial results with { passed: boolean }
 * @param {number} k - Number of samples
 * @returns {number} Pass^k probability (0 to 1)
 */
function passK(results, k) {
  if (results.length === 0 || k === 0) return 0;

  const successRate = results.filter(r => r.passed).length / results.length;
  return Math.pow(successRate, k);
}

/**
 * Calculate pass^k from success rate
 * @param {number} successRate - Individual trial success rate (0 to 1)
 * @param {number} k - Number of samples
 * @returns {number} Pass^k probability (0 to 1)
 */
function passKExact(successRate, k) {
  return Math.pow(successRate, k);
}

/**
 * Calculate pass^k for multiple k values
 * @param {Array} results - Array of trial results
 * @param {Array} kValues - Array of k values to calculate
 * @returns {Object} Map of k -> pass^k values
 */
function passKMultiple(results, kValues = [1, 3, 5, 10]) {
  const metrics = {};
  const successRate = results.length > 0
    ? results.filter(r => r.passed).length / results.length
    : 0;

  for (const k of kValues) {
    metrics[`pass^${k}`] = Math.pow(successRate, k);
  }

  return metrics;
}

/**
 * Calculate required success rate for target pass^k
 * @param {number} targetPassK - Desired pass^k rate
 * @param {number} k - Number of consecutive successes needed
 * @returns {number} Required individual success rate
 */
function requiredSuccessRate(targetPassK, k) {
  // p^k = target => p = target^(1/k)
  return Math.pow(targetPassK, 1 / k);
}

/**
 * Calculate confidence interval for pass^k
 * @param {Array} results - Array of trial results
 * @param {number} k - Number of samples
 * @param {number} confidence - Confidence level (default 0.95)
 * @returns {Object} { lower, estimate, upper }
 */
function passKWithConfidence(results, k, confidence = 0.95) {
  const n = results.length;
  if (n === 0) return { lower: 0, estimate: 0, upper: 0 };

  const successRate = results.filter(r => r.passed).length / n;
  const estimate = Math.pow(successRate, k);

  // Use delta method for variance
  // Var(p^k) ≈ k^2 * p^(2k-2) * Var(p)
  // Var(p) = p(1-p)/n
  const z = confidence === 0.95 ? 1.96 : (confidence === 0.99 ? 2.576 : 1.645);

  const varP = (successRate * (1 - successRate)) / n;
  const varPassK = k * k * Math.pow(successRate, 2 * k - 2) * varP;
  const stdPassK = Math.sqrt(varPassK);

  const lower = Math.max(0, estimate - z * stdPassK);
  const upper = Math.min(1, estimate + z * stdPassK);

  return {
    lower: Math.round(lower * 1000) / 1000,
    estimate: Math.round(estimate * 1000) / 1000,
    upper: Math.round(upper * 1000) / 1000
  };
}

/**
 * Compare pass@k vs pass^k to understand reliability
 * @param {Array} results - Array of trial results
 * @param {number} k - Number of samples
 * @returns {Object} Comparison metrics
 */
function comparePassMetrics(results, k) {
  const { passAtK } = require('./pass-at-k');

  const atK = passAtK(results, k);
  const powerK = passK(results, k);
  const successRate = results.length > 0
    ? results.filter(r => r.passed).length / results.length
    : 0;

  return {
    successRate: Math.round(successRate * 1000) / 1000,
    [`pass@${k}`]: Math.round(atK * 1000) / 1000,
    [`pass^${k}`]: Math.round(powerK * 1000) / 1000,
    consistencyGap: Math.round((atK - powerK) * 1000) / 1000,
    interpretation: interpretGap(atK, powerK)
  };
}

/**
 * Interpret the gap between pass@k and pass^k
 * @param {number} atK - Pass@k value
 * @param {number} powerK - Pass^k value
 * @returns {string} Interpretation
 */
function interpretGap(atK, powerK) {
  const gap = atK - powerK;

  if (gap < 0.1) {
    return 'Highly consistent - agent performs reliably';
  } else if (gap < 0.3) {
    return 'Moderately consistent - some variability in performance';
  } else if (gap < 0.5) {
    return 'Variable - agent can succeed but not consistently';
  } else {
    return 'Inconsistent - high variance in agent behavior';
  }
}

module.exports = {
  passK,
  passKExact,
  passKMultiple,
  passKWithConfidence,
  requiredSuccessRate,
  comparePassMetrics,
  interpretGap
};
