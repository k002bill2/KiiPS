/**
 * Pass@k Metric Calculator
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * Pass@k measures the probability that at least ONE of k attempts succeeds.
 *
 * Use case: When finding a single working solution is sufficient
 * Example: Tool building, code generation where any valid solution works
 *
 * Formula: pass@k = 1 - C(n-c, k) / C(n, k)
 * Where: n = total samples, c = correct samples, k = samples to draw
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

/**
 * Calculate pass@k from trial results
 * @param {Array} results - Array of trial results with { passed: boolean }
 * @param {number} k - Number of samples
 * @returns {number} Pass@k probability (0 to 1)
 */
function passAtK(results, k) {
  const n = results.length;
  const c = results.filter(r => r.passed).length;

  // Handle edge cases
  if (n === 0 || k === 0) return 0;
  if (k > n) return passAtKExact(c / n, k); // Fall back to estimation
  if (c >= k) return 1; // If we have k or more correct, pass@k is 1

  // Calculate using combinatorial formula
  // pass@k = 1 - C(n-c, k) / C(n, k)
  return 1 - binomialCoefficient(n - c, k) / binomialCoefficient(n, k);
}

/**
 * Calculate pass@k from success rate (when exact results unavailable)
 * @param {number} successRate - Individual trial success rate (0 to 1)
 * @param {number} k - Number of samples
 * @returns {number} Pass@k probability (0 to 1)
 */
function passAtKExact(successRate, k) {
  // Probability of at least one success in k attempts
  // = 1 - P(all failures) = 1 - (1 - p)^k
  return 1 - Math.pow(1 - successRate, k);
}

/**
 * Calculate binomial coefficient C(n, k)
 * @param {number} n - Total items
 * @param {number} k - Items to choose
 * @returns {number} Binomial coefficient
 */
function binomialCoefficient(n, k) {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;

  // Optimize by using smaller k
  if (k > n - k) {
    k = n - k;
  }

  let result = 1;
  for (let i = 0; i < k; i++) {
    result = result * (n - i) / (i + 1);
  }

  return result;
}

/**
 * Calculate pass@k for multiple k values
 * @param {Array} results - Array of trial results
 * @param {Array} kValues - Array of k values to calculate
 * @returns {Object} Map of k -> pass@k values
 */
function passAtKMultiple(results, kValues = [1, 3, 5, 10]) {
  const metrics = {};

  for (const k of kValues) {
    metrics[`pass@${k}`] = passAtK(results, k);
  }

  return metrics;
}

/**
 * Estimate required samples for desired confidence
 * @param {number} targetPassAtK - Desired pass@k rate
 * @param {number} k - Number of samples per evaluation
 * @param {number} confidence - Confidence level (e.g., 0.95)
 * @returns {number} Minimum number of evaluations needed
 */
function estimateSampleSize(targetPassAtK, k, confidence = 0.95) {
  // Using Wilson score interval approximation
  const z = 1.96; // 95% confidence
  const p = targetPassAtK;
  const q = 1 - p;

  // Minimum samples for margin of error of 5%
  const marginOfError = 0.05;
  const n = Math.ceil((z * z * p * q) / (marginOfError * marginOfError));

  return Math.max(n, k * 3); // At least 3x k samples
}

/**
 * Calculate confidence interval for pass@k
 * @param {Array} results - Array of trial results
 * @param {number} k - Number of samples
 * @param {number} confidence - Confidence level (default 0.95)
 * @returns {Object} { lower, estimate, upper }
 */
function passAtKWithConfidence(results, k, confidence = 0.95) {
  const estimate = passAtK(results, k);
  const n = results.length;

  // Wilson score interval
  const z = confidence === 0.95 ? 1.96 : (confidence === 0.99 ? 2.576 : 1.645);
  const phat = estimate;

  const denominator = 1 + z * z / n;
  const center = phat + z * z / (2 * n);
  const spread = z * Math.sqrt((phat * (1 - phat) + z * z / (4 * n)) / n);

  const lower = Math.max(0, (center - spread) / denominator);
  const upper = Math.min(1, (center + spread) / denominator);

  return {
    lower: Math.round(lower * 1000) / 1000,
    estimate: Math.round(estimate * 1000) / 1000,
    upper: Math.round(upper * 1000) / 1000
  };
}

module.exports = {
  passAtK,
  passAtKExact,
  passAtKMultiple,
  passAtKWithConfidence,
  estimateSampleSize,
  binomialCoefficient
};
