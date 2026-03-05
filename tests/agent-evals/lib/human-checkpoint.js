/**
 * Human Checkpoint System for AI Agent Evaluation
 *
 * Enables human-in-the-loop review for:
 * - Critical decisions
 * - Ambiguous grading results
 * - Calibration data collection
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class HumanCheckpoint {
  /**
   * Create Human Checkpoint handler
   * @param {Object} config - Configuration
   */
  constructor(config = {}) {
    this.enabled = config.enabled !== false;
    this.triggerOn = config.triggerOn || ['critical', 'ambiguous'];
    this.timeout = config.timeout || 300000; // 5 minutes default
    this.decisionsPath = config.decisionsPath || './results/human-decisions.jsonl';
    this.interactive = config.interactive !== false;

    // Decision queue for batch processing
    this.pendingDecisions = [];
    this.decisions = [];

    // Ensure decisions directory exists
    const dir = path.dirname(this.decisionsPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Request human review for a result
   * @param {Object} context - Review context
   * @returns {Object|null} Human decision or null if skipped
   */
  async requestReview(context) {
    if (!this.enabled) {
      return null;
    }

    const request = {
      id: this.generateId(),
      timestamp: new Date().toISOString(),
      taskId: context.task?.id,
      trialNumber: context.trial?.trialNumber,
      grades: context.trial?.grades,
      transcript: context.transcript,
      status: 'pending'
    };

    // Add to pending
    this.pendingDecisions.push(request);

    // If interactive mode, wait for decision
    if (this.interactive) {
      return this.waitForDecision(request);
    }

    // Non-interactive: queue for later batch review
    return null;
  }

  /**
   * Wait for human decision (interactive mode)
   * @param {Object} request - Review request
   * @returns {Object} Human decision
   */
  async waitForDecision(request) {
    return new Promise((resolve) => {
      const timeoutId = setTimeout(() => {
        console.log(`\nHuman review timeout for ${request.taskId}. Auto-accepting.`);
        resolve({
          passed: true,
          reason: 'Timeout - auto-accepted',
          reviewedAt: new Date().toISOString()
        });
      }, this.timeout);

      // Display review request
      console.log('\n' + '═'.repeat(60));
      console.log('🔍 HUMAN REVIEW REQUIRED');
      console.log('═'.repeat(60));
      console.log(`Task ID: ${request.taskId}`);
      console.log(`Trial: ${request.trialNumber || 1}`);

      if (request.grades && request.grades.length > 0) {
        console.log('\nGrades:');
        for (const grade of request.grades) {
          console.log(`  - ${grade.type}: ${grade.passed ? '✓' : '✗'} (score: ${grade.score || 'N/A'})`);
        }
      }

      console.log('\n─'.repeat(60));
      console.log('Options:');
      console.log('  [p] Pass - Accept the result');
      console.log('  [f] Fail - Reject the result');
      console.log('  [s] Skip - No decision (use automated result)');
      console.log('─'.repeat(60));

      // Read input
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });

      rl.question('Your decision [p/f/s]: ', (answer) => {
        clearTimeout(timeoutId);
        rl.close();

        const decision = this.parseDecision(answer, request);
        this.recordDecision(decision);

        resolve(decision.passed === null ? null : decision);
      });
    });
  }

  /**
   * Parse human decision input
   * @param {string} input - User input
   * @param {Object} request - Original request
   * @returns {Object} Parsed decision
   */
  parseDecision(input, request) {
    const normalized = (input || '').trim().toLowerCase();

    let passed = null;
    let reason = 'Unknown';

    switch (normalized) {
      case 'p':
      case 'pass':
      case 'y':
      case 'yes':
        passed = true;
        reason = 'Human approved';
        break;
      case 'f':
      case 'fail':
      case 'n':
      case 'no':
        passed = false;
        reason = 'Human rejected';
        break;
      case 's':
      case 'skip':
      case '':
        passed = null;
        reason = 'Human skipped - using automated result';
        break;
      default:
        passed = null;
        reason = `Unknown input: ${input}`;
    }

    return {
      requestId: request.id,
      taskId: request.taskId,
      trialNumber: request.trialNumber,
      passed,
      reason,
      reviewedAt: new Date().toISOString(),
      originalGrades: request.grades
    };
  }

  /**
   * Record decision for future calibration
   * @param {Object} decision - Human decision
   */
  recordDecision(decision) {
    this.decisions.push(decision);

    // Append to decisions file
    fs.appendFileSync(
      this.decisionsPath,
      JSON.stringify(decision) + '\n'
    );
  }

  /**
   * Load historical decisions
   * @param {number} limit - Maximum to load
   * @returns {Array} Decisions
   */
  loadDecisions(limit = 100) {
    if (!fs.existsSync(this.decisionsPath)) {
      return [];
    }

    const lines = fs.readFileSync(this.decisionsPath, 'utf8')
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
   * Get calibration data for LLM grader
   * @returns {Array} Calibration samples
   */
  getCalibrationData() {
    return this.loadDecisions()
      .filter(d => d.passed !== null)
      .map(d => ({
        taskId: d.taskId,
        humanPassed: d.passed,
        originalGrades: d.originalGrades,
        timestamp: d.reviewedAt
      }));
  }

  /**
   * Calculate agreement rate with automated grading
   * @returns {Object} Agreement statistics
   */
  calculateAgreement() {
    const decisions = this.loadDecisions()
      .filter(d => d.passed !== null && d.originalGrades);

    if (decisions.length === 0) {
      return { samples: 0, agreement: null };
    }

    let agreements = 0;
    let total = 0;

    for (const decision of decisions) {
      const automatedPassed = decision.originalGrades.every(g => g.passed);
      if (decision.passed === automatedPassed) {
        agreements++;
      }
      total++;
    }

    return {
      samples: total,
      agreements,
      agreement: Math.round((agreements / total) * 1000) / 1000,
      disagreements: total - agreements
    };
  }

  /**
   * Process batch reviews (non-interactive)
   * @param {Array} requests - Review requests
   * @param {Function} processor - Batch processor function
   * @returns {Array} Decisions
   */
  async processBatch(requests, processor) {
    const results = [];

    for (const request of requests) {
      const decision = await processor(request);
      this.recordDecision(decision);
      results.push(decision);
    }

    return results;
  }

  /**
   * Generate unique ID
   * @returns {string} Unique ID
   */
  generateId() {
    return `hc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get statistics
   * @returns {Object} Statistics
   */
  getStatistics() {
    const decisions = this.loadDecisions();

    const stats = {
      total: decisions.length,
      passed: decisions.filter(d => d.passed === true).length,
      failed: decisions.filter(d => d.passed === false).length,
      skipped: decisions.filter(d => d.passed === null).length,
      pending: this.pendingDecisions.length
    };

    stats.reviewRate = stats.total > 0
      ? Math.round(((stats.passed + stats.failed) / stats.total) * 1000) / 1000
      : 0;

    return stats;
  }
}

/**
 * Factory function for creating checkpoint handlers
 * @param {Object} config - Configuration
 * @returns {HumanCheckpoint} Checkpoint handler
 */
function createCheckpoint(config = {}) {
  return new HumanCheckpoint(config);
}

module.exports = { HumanCheckpoint, createCheckpoint };
