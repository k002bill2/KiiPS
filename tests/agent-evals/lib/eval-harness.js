/**
 * KiiPS AI Agent Evaluation Harness
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 *
 * Core responsibilities:
 * - Run evaluations end-to-end
 * - Provide instructions and tools to agents
 * - Execute tasks concurrently (with multi-trial support)
 * - Log every step with full transcripts
 * - Grade outputs (code-based and LLM-based)
 * - Aggregate results with Pass@k and Pass^k metrics
 *
 * Enhanced features (v2.0):
 * - Multi-trial execution (k-shot evaluation)
 * - Full transcript recording
 * - Pass@k / Pass^k metrics
 * - Efficiency metrics
 * - LLM grader support
 * - Human checkpoint integration
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');
const { Transcript, TranscriptManager } = require('./transcript');
const { passAtK, passAtKMultiple, passAtKWithConfidence } = require('./metrics/pass-at-k');
const { passK, passKMultiple, comparePassMetrics } = require('./metrics/pass-k');
const { calculateEfficiency, calculateEfficiencyScore, getEfficiencyTier } = require('./metrics/efficiency');

class EvalHarness extends EventEmitter {
  constructor(config) {
    super();
    this.config = config;
    this.results = [];
    this.startTime = null;
    this.graders = new Map();
    this.reporters = [];

    // Initialize transcript manager
    this.transcriptManager = new TranscriptManager({
      storePath: config.transcript?.storePath || './results/transcripts/',
      retention: config.transcript?.retention || '30d'
    });

    // Multi-trial settings
    this.defaultK = config.trials?.defaultK || 3;
    this.passAtKThreshold = config.trials?.passAtKThreshold || 0.8;
    this.passKThreshold = config.trials?.passKThreshold || 0.6;

    // Human checkpoint handler (optional)
    this.humanCheckpoint = null;
  }

  /**
   * Register a grader for evaluating outputs
   * @param {string} name - Grader identifier
   * @param {Object} grader - Grader instance
   */
  registerGrader(name, grader) {
    this.graders.set(name, grader);
  }

  /**
   * Register a reporter for output formatting
   * @param {Object} reporter - Reporter instance
   */
  registerReporter(reporter) {
    this.reporters.push(reporter);
  }

  /**
   * Set human checkpoint handler
   * @param {Object} handler - Human checkpoint handler instance
   */
  setHumanCheckpoint(handler) {
    this.humanCheckpoint = handler;
  }

  /**
   * Run a single evaluation task
   * @param {Object} task - Task definition
   * @param {number} trialNumber - Trial number for multi-trial runs
   * @returns {Object} Trial result
   */
  async runTask(task, trialNumber = 1) {
    // Create transcript for this trial
    const transcript = this.transcriptManager.create(task.id, {
      trialNumber,
      graders: (task.graders || []).map(g => g.type)
    });

    const trial = {
      taskId: task.id,
      trialNumber,
      startTime: Date.now(),
      endTime: null,
      outcome: null,
      transcript: null,
      grades: [],
      metrics: {
        latency: null,
        turns: 0,
        toolCalls: 0,
        tokenCount: 0
      },
      error: null
    };

    this.emit('taskStart', { taskId: task.id, trialNumber });

    try {
      // Record input
      transcript.addMessage('user', task.input?.prompt || JSON.stringify(task.input));

      // Execute task in isolated environment
      const outcome = await this.executeInSandbox(task, transcript);
      trial.outcome = outcome;
      trial.metrics.turns = outcome.turns || 0;
      trial.metrics.toolCalls = outcome.toolCalls || 0;

      // Grade the outcome
      for (const graderConfig of task.graders || []) {
        const grader = this.graders.get(graderConfig.type);
        if (grader) {
          const grade = await grader.grade(outcome, graderConfig, transcript);
          trial.grades.push({
            type: graderConfig.type,
            ...grade
          });
          transcript.addGraderResult(graderConfig.type, grade);
        }
      }

      // Determine overall pass/fail
      trial.passed = trial.grades.every(g => g.passed);

      // Human checkpoint for ambiguous cases
      if (this.humanCheckpoint && this.needsHumanReview(trial)) {
        const humanDecision = await this.humanCheckpoint.requestReview({
          task,
          trial,
          transcript: transcript.getSummary()
        });
        if (humanDecision) {
          trial.humanReview = humanDecision;
          trial.passed = humanDecision.passed;
        }
      }

    } catch (error) {
      trial.error = {
        message: error.message,
        stack: error.stack
      };
      trial.passed = false;
      transcript.addMessage('system', `Error: ${error.message}`);
    }

    trial.endTime = Date.now();
    trial.metrics.latency = trial.endTime - trial.startTime;
    trial.metrics.tokenCount = transcript.getTokenCount();

    // Complete transcript
    transcript.complete({
      passed: trial.passed,
      grades: trial.grades
    });

    // Store transcript reference
    trial.transcript = transcript.getSummary();

    // Save transcript if enabled
    if (this.config.transcript?.enabled !== false) {
      transcript.save(this.transcriptManager.outputDir);
    }

    this.emit('taskEnd', { taskId: task.id, trialNumber, passed: trial.passed });

    return trial;
  }

  /**
   * Run multiple trials of a task (multi-trial evaluation)
   * @param {Object} task - Task definition
   * @param {number} k - Number of trials to run
   * @returns {Object} Multi-trial results with Pass@k and Pass^k
   */
  async runTrials(task, k = null) {
    const numTrials = k || this.defaultK;
    const trials = [];

    this.emit('trialsStart', { taskId: task.id, k: numTrials });

    for (let i = 1; i <= numTrials; i++) {
      const trial = await this.runTask(task, i);
      trials.push(trial);
    }

    // Calculate metrics
    const passMetrics = comparePassMetrics(trials, numTrials);
    const efficiency = calculateEfficiency(trials);
    const efficiencyScore = calculateEfficiencyScore(efficiency);

    const result = {
      taskId: task.id,
      k: numTrials,
      trials,
      metrics: {
        ...passMetrics,
        efficiency,
        efficiencyScore,
        efficiencyTier: getEfficiencyTier(efficiencyScore)
      },
      passed: passMetrics[`pass@${numTrials}`] >= this.passAtKThreshold
    };

    this.emit('trialsEnd', {
      taskId: task.id,
      k: numTrials,
      passAtK: passMetrics[`pass@${numTrials}`],
      passK: passMetrics[`pass^${numTrials}`]
    });

    return result;
  }

  /**
   * Check if a trial needs human review
   * @param {Object} trial - Trial result
   * @returns {boolean} Whether human review is needed
   */
  needsHumanReview(trial) {
    if (!this.config.humanCheckpoint?.enabled) return false;

    const triggers = this.config.humanCheckpoint.triggerOn || [];

    // Check for ambiguous grading (scores close to threshold)
    for (const grade of trial.grades) {
      if (grade.score !== undefined && grade.score >= 0.4 && grade.score <= 0.6) {
        if (triggers.includes('ambiguous')) return true;
      }
      if (grade.confidence !== undefined && grade.confidence < 0.7) {
        if (triggers.includes('ambiguous')) return true;
      }
    }

    // Check for critical tasks
    if (trial.taskId?.includes('security') || trial.taskId?.includes('production')) {
      if (triggers.includes('critical')) return true;
    }

    return false;
  }

  /**
   * Execute task in sandbox environment
   * @param {Object} task - Task definition
   * @param {Transcript} transcript - Transcript instance for recording
   * @returns {Object} Execution outcome
   */
  async executeInSandbox(task, transcript) {
    const sandbox = this.createSandbox(task);

    try {
      const result = await sandbox.execute(task.input, transcript);

      // Record tool calls to transcript if sandbox provided them
      if (result.toolCalls && Array.isArray(result.toolCallLog)) {
        for (const call of result.toolCallLog) {
          transcript.addToolCall(call.tool, call.params, call.result, {
            duration: call.duration,
            success: call.success
          });
        }
      }

      // Record assistant response
      if (result.output) {
        transcript.addMessage('assistant', result.output);
      }

      return {
        success: true,
        output: result.output,
        turns: result.turns,
        toolCalls: result.toolCalls,
        state: result.state,
        transcript: result.transcript || []  // Include sandbox transcript for skill activation grading
      };
    } finally {
      await sandbox.cleanup();
    }
  }

  /**
   * Create isolated sandbox for task execution
   * @param {Object} task - Task definition
   * @returns {Object} Sandbox instance
   */
  createSandbox(task) {
    const Sandbox = require('./utils/sandbox');
    return new Sandbox({
      mode: this.config.environment.mode,
      mockByDefault: this.config.environment.mockByDefault,
      timeout: task.timeout || this.config.environment.timeout.default
    });
  }

  /**
   * Run a suite of evaluation tasks
   * @param {Object} suite - Suite definition with tasks
   * @param {Object} options - Run options
   * @returns {Object} Suite results
   */
  async runSuite(suite, options = {}) {
    const k = options.k || (suite.multiTrial ? this.defaultK : 1);
    const isMultiTrial = k > 1;

    const suiteResult = {
      name: suite.name,
      startTime: Date.now(),
      endTime: null,
      trials: [],
      k,
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        passRate: 0
      },
      metrics: null
    };

    this.emit('suiteStart', { name: suite.name, k });

    const tasks = suite.tasks || [];
    suiteResult.summary.total = tasks.length;

    // Run tasks (parallel or sequential based on config)
    if (suite.parallel !== false && this.config.suites?.[suite.type]?.parallel) {
      if (isMultiTrial) {
        // Multi-trial: run k trials per task
        const multiTrialResults = await Promise.all(
          tasks.map(task => this.runTrials(task, k))
        );
        suiteResult.trials = multiTrialResults;
      } else {
        // Single trial: run once per task
        const trials = await Promise.all(tasks.map(task => this.runTask(task)));
        suiteResult.trials = trials;
      }
    } else {
      for (const task of tasks) {
        if (isMultiTrial) {
          const multiTrialResult = await this.runTrials(task, k);
          suiteResult.trials.push(multiTrialResult);
        } else {
          const trial = await this.runTask(task);
          suiteResult.trials.push(trial);
        }
      }
    }

    // Calculate summary
    if (isMultiTrial) {
      // Multi-trial: use pass@k for pass/fail determination
      suiteResult.summary.passed = suiteResult.trials.filter(t => t.passed).length;
      suiteResult.summary.failed = suiteResult.trials.filter(t => !t.passed).length;

      // Calculate aggregate metrics
      const allTrials = suiteResult.trials.flatMap(t => t.trials || []);
      const efficiency = calculateEfficiency(allTrials);
      const efficiencyScore = calculateEfficiencyScore(efficiency);

      suiteResult.metrics = {
        ...passAtKMultiple(allTrials, [1, k]),
        ...passKMultiple(allTrials, [1, k]),
        efficiency,
        efficiencyScore,
        efficiencyTier: getEfficiencyTier(efficiencyScore)
      };
    } else {
      // Single trial: simple pass/fail count
      suiteResult.summary.passed = suiteResult.trials.filter(t => t.passed).length;
      suiteResult.summary.failed = suiteResult.trials.filter(t => !t.passed).length;

      // Calculate efficiency
      const efficiency = calculateEfficiency(suiteResult.trials);
      const efficiencyScore = calculateEfficiencyScore(efficiency);

      suiteResult.metrics = {
        efficiency,
        efficiencyScore,
        efficiencyTier: getEfficiencyTier(efficiencyScore)
      };
    }

    suiteResult.summary.passRate = suiteResult.summary.total > 0
      ? suiteResult.summary.passed / suiteResult.summary.total
      : 0;

    suiteResult.endTime = Date.now();

    this.emit('suiteEnd', {
      name: suite.name,
      passRate: suiteResult.summary.passRate,
      metrics: suiteResult.metrics
    });

    return suiteResult;
  }

  /**
   * Run all evaluation suites
   * @param {Array} suites - Array of suite definitions
   * @param {Object} options - Run options (k, graderType, etc.)
   * @returns {Object} Complete evaluation results
   */
  async runAll(suites, options = {}) {
    this.startTime = Date.now();
    const k = options.k || this.defaultK;

    const results = {
      version: '2.0',
      startTime: this.startTime,
      endTime: null,
      k,
      suites: [],
      summary: {
        totalSuites: suites.length,
        totalTasks: 0,
        totalPassed: 0,
        totalFailed: 0,
        overallPassRate: 0
      },
      metrics: null,
      config: this.config
    };

    this.emit('evalStart', { totalSuites: suites.length, k });

    for (const suite of suites) {
      const suiteResult = await this.runSuite(suite, { k: options.k });
      results.suites.push(suiteResult);
      results.summary.totalTasks += suiteResult.summary.total;
      results.summary.totalPassed += suiteResult.summary.passed;
      results.summary.totalFailed += suiteResult.summary.failed;
    }

    results.summary.overallPassRate = results.summary.totalTasks > 0
      ? results.summary.totalPassed / results.summary.totalTasks
      : 0;

    // Calculate aggregate metrics across all suites
    const allTrials = results.suites.flatMap(s =>
      s.trials.flatMap(t => t.trials || [t])
    );

    if (allTrials.length > 0) {
      const efficiency = calculateEfficiency(allTrials);
      const efficiencyScore = calculateEfficiencyScore(efficiency);

      results.metrics = {
        ...passAtKMultiple(allTrials, [1, k]),
        ...passKMultiple(allTrials, [1, k]),
        passComparison: comparePassMetrics(allTrials, k),
        efficiency,
        efficiencyScore,
        efficiencyTier: getEfficiencyTier(efficiencyScore)
      };
    }

    results.endTime = Date.now();
    results.duration = results.endTime - results.startTime;

    this.emit('evalEnd', {
      passRate: results.summary.overallPassRate,
      duration: results.duration,
      metrics: results.metrics
    });

    // Save transcripts
    if (this.config.transcript?.enabled !== false) {
      this.transcriptManager.saveAll();
    }

    // Generate reports
    await this.generateReports(results);

    return results;
  }

  /**
   * Generate reports using registered reporters
   * @param {Object} results - Evaluation results
   */
  async generateReports(results) {
    for (const reporter of this.reporters) {
      try {
        await reporter.report(results);
      } catch (error) {
        console.error(`Reporter ${reporter.name} failed:`, error.message);
      }
    }
  }

  /**
   * Calculate pass@k metric
   * k번의 시도 중 최소 1개가 성공할 확률
   * @param {number} successRate - Individual trial success rate
   * @param {number} k - Number of trials
   * @returns {number} pass@k probability
   */
  static passAtK(successRate, k) {
    return 1 - Math.pow(1 - successRate, k);
  }

  /**
   * Calculate pass^k metric
   * k번 모두 성공할 확률
   * @param {number} successRate - Individual trial success rate
   * @param {number} k - Number of trials
   * @returns {number} pass^k probability
   */
  static passPowerK(successRate, k) {
    return Math.pow(successRate, k);
  }
}

module.exports = EvalHarness;
