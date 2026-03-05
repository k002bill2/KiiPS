/**
 * KiiPS Code-based Grader
 *
 * Deterministic grading for AI Agent evaluations.
 * Based on Anthropic's guide - Code-based graders are:
 * - Fast, cheap, objective, reproducible, debuggable
 * - Best for: exact matching, binary tests, static analysis, state checks
 */

const fs = require('fs');
const path = require('path');
const { execSync, exec } = require('child_process');

class CodeGrader {
  constructor(options = {}) {
    this.strictMode = options.strictMode || false;
    this.tolerateWhitespace = options.tolerateWhitespace !== false;
    this.name = 'code';
  }

  /**
   * Grade an outcome based on grader configuration
   * @param {Object} outcome - Execution outcome
   * @param {Object} config - Grader configuration
   * @returns {Object} Grade result
   */
  async grade(outcome, config) {
    const gradeMethod = this.getGradeMethod(config.method || config.type);

    if (!gradeMethod) {
      return {
        passed: false,
        score: 0,
        reason: `Unknown grading method: ${config.method || config.type}`
      };
    }

    try {
      return await gradeMethod.call(this, outcome, config);
    } catch (error) {
      return {
        passed: false,
        score: 0,
        reason: `Grading error: ${error.message}`
      };
    }
  }

  /**
   * Get grading method by name
   */
  getGradeMethod(method) {
    const methods = {
      'activation': this.gradeSkillActivation,
      'pattern': this.gradePattern,
      'exact': this.gradeExact,
      'artifact': this.gradeArtifact,
      'structure': this.gradeStructure,
      'command': this.gradeCommand,
      'state': this.gradeState,
      'toolCall': this.gradeToolCall,
      'decomposition': this.gradeDecomposition,
      'workerAssignment': this.gradeWorkerAssignment
    };
    return methods[method];
  }

  // ============================================
  // Grading Methods
  // ============================================

  /**
   * Grade skill activation
   * Verifies expected skills were activated in transcript
   */
  async gradeSkillActivation(outcome, config) {
    const expectedSkills = config.expect || [];
    const activatedSkills = this.extractActivatedSkills(outcome);

    const allActivated = expectedSkills.every(skill =>
      activatedSkills.includes(skill)
    );

    const missing = expectedSkills.filter(skill =>
      !activatedSkills.includes(skill)
    );

    return {
      passed: allActivated,
      score: allActivated ? 1 : (expectedSkills.length - missing.length) / expectedSkills.length,
      expected: expectedSkills,
      actual: activatedSkills,
      missing: missing,
      reason: allActivated
        ? 'All expected skills activated'
        : `Missing skills: ${missing.join(', ')}`
    };
  }

  /**
   * Grade output against regex pattern
   */
  async gradePattern(outcome, config) {
    const output = this.normalizeOutput(outcome.output);
    const pattern = new RegExp(config.pattern, config.flags || 'i');
    const matched = pattern.test(output);

    return {
      passed: matched,
      score: matched ? 1 : 0,
      pattern: config.pattern,
      reason: matched ? 'Pattern matched' : 'Pattern not found in output'
    };
  }

  /**
   * Grade exact string match
   */
  async gradeExact(outcome, config) {
    let output = outcome.output;
    let expected = config.expect;

    if (this.tolerateWhitespace) {
      output = this.normalizeWhitespace(output);
      expected = this.normalizeWhitespace(expected);
    }

    const matched = output === expected;

    return {
      passed: matched,
      score: matched ? 1 : 0,
      expected: config.expect,
      actual: outcome.output,
      reason: matched ? 'Exact match' : 'Output does not match expected'
    };
  }

  /**
   * Grade artifact existence (files/directories)
   */
  async gradeArtifact(outcome, config) {
    const paths = Array.isArray(config.path) ? config.path : [config.path];
    const results = [];

    for (const artifactPath of paths) {
      const resolved = this.resolvePath(artifactPath, outcome.state?.workDir);
      const exists = this.checkPathExists(resolved);
      results.push({ path: artifactPath, exists });
    }

    const allExist = results.every(r => r.exists);
    const missing = results.filter(r => !r.exists).map(r => r.path);

    return {
      passed: allExist,
      score: results.filter(r => r.exists).length / results.length,
      artifacts: results,
      missing: missing,
      reason: allExist
        ? 'All artifacts exist'
        : `Missing artifacts: ${missing.join(', ')}`
    };
  }

  /**
   * Grade JSON structure against schema
   */
  async gradeStructure(outcome, config) {
    const obj = typeof outcome.output === 'string'
      ? JSON.parse(outcome.output)
      : outcome.output;

    const schema = config.schema;
    const errors = this.validateSchema(obj, schema);

    return {
      passed: errors.length === 0,
      score: errors.length === 0 ? 1 : 0,
      errors: errors,
      reason: errors.length === 0
        ? 'Structure valid'
        : `Validation errors: ${errors.join('; ')}`
    };
  }

  /**
   * Grade command execution result
   */
  async gradeCommand(outcome, config) {
    const result = outcome.output;
    const expectations = config.expect || {};

    const checks = [];

    // Check exit code
    if (expectations.exitCode !== undefined) {
      checks.push({
        name: 'exitCode',
        passed: result.exitCode === expectations.exitCode,
        expected: expectations.exitCode,
        actual: result.exitCode
      });
    }

    // Check stdout contains patterns
    if (expectations.stdout) {
      const patterns = Array.isArray(expectations.stdout)
        ? expectations.stdout
        : [expectations.stdout];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        checks.push({
          name: `stdout: ${pattern}`,
          passed: regex.test(result.stdout || ''),
          pattern: pattern
        });
      }
    }

    // Check stderr patterns (for errors we expect)
    if (expectations.stderr) {
      const patterns = Array.isArray(expectations.stderr)
        ? expectations.stderr
        : [expectations.stderr];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        checks.push({
          name: `stderr: ${pattern}`,
          passed: regex.test(result.stderr || ''),
          pattern: pattern
        });
      }
    }

    // Check no error patterns (things that should NOT appear)
    if (expectations.noError) {
      const patterns = Array.isArray(expectations.noError)
        ? expectations.noError
        : [expectations.noError];

      for (const pattern of patterns) {
        const regex = new RegExp(pattern, 'i');
        checks.push({
          name: `noError: ${pattern}`,
          passed: !regex.test(result.stderr || '') && !regex.test(result.stdout || ''),
          pattern: pattern
        });
      }
    }

    const allPassed = checks.every(c => c.passed);
    const failedChecks = checks.filter(c => !c.passed);

    return {
      passed: allPassed,
      score: checks.length > 0 ? checks.filter(c => c.passed).length / checks.length : 1,
      checks: checks,
      failed: failedChecks,
      reason: allPassed
        ? 'All command checks passed'
        : `Failed checks: ${failedChecks.map(c => c.name).join(', ')}`
    };
  }

  /**
   * Grade state changes (database, files, etc.)
   */
  async gradeState(outcome, config) {
    const state = outcome.state || {};
    const expectations = config.expect || {};
    const checks = [];

    for (const [key, expected] of Object.entries(expectations)) {
      const actual = this.getNestedValue(state, key);
      const passed = this.deepEqual(actual, expected);
      checks.push({
        key: key,
        passed: passed,
        expected: expected,
        actual: actual
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      score: checks.length > 0 ? checks.filter(c => c.passed).length / checks.length : 1,
      checks: checks,
      reason: allPassed
        ? 'All state checks passed'
        : `State mismatch on: ${checks.filter(c => !c.passed).map(c => c.key).join(', ')}`
    };
  }

  /**
   * Grade tool call sequence
   */
  async gradeToolCall(outcome, config) {
    const transcript = outcome.transcript || [];
    const toolCalls = transcript.filter(t => t.type === 'tool_call');

    const expectations = config.expect || {};
    const checks = [];

    // Check required tools were called
    if (expectations.required) {
      for (const tool of expectations.required) {
        const called = toolCalls.some(tc => tc.tool === tool);
        checks.push({
          name: `required: ${tool}`,
          passed: called
        });
      }
    }

    // Check forbidden tools were NOT called
    if (expectations.forbidden) {
      for (const tool of expectations.forbidden) {
        const called = toolCalls.some(tc => tc.tool === tool);
        checks.push({
          name: `forbidden: ${tool}`,
          passed: !called
        });
      }
    }

    // Check tool call order
    if (expectations.order) {
      const actualOrder = toolCalls.map(tc => tc.tool);
      const orderValid = this.checkOrder(actualOrder, expectations.order);
      checks.push({
        name: 'order',
        passed: orderValid,
        expected: expectations.order,
        actual: actualOrder
      });
    }

    // Check call count
    if (expectations.maxCalls !== undefined) {
      checks.push({
        name: 'maxCalls',
        passed: toolCalls.length <= expectations.maxCalls,
        expected: expectations.maxCalls,
        actual: toolCalls.length
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      score: checks.length > 0 ? checks.filter(c => c.passed).length / checks.length : 1,
      totalToolCalls: toolCalls.length,
      checks: checks,
      reason: allPassed
        ? 'All tool call checks passed'
        : `Failed: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`
    };
  }

  /**
   * Grade task decomposition (for Manager agents)
   */
  async gradeDecomposition(outcome, config) {
    const decomposition = outcome.output?.decomposition || outcome.output;
    const subtasks = decomposition?.subtasks || [];

    const checks = [];

    // Check minimum subtask count
    if (config.minSubtasks !== undefined) {
      checks.push({
        name: 'minSubtasks',
        passed: subtasks.length >= config.minSubtasks,
        expected: config.minSubtasks,
        actual: subtasks.length
      });
    }

    // Check maximum subtask count
    if (config.maxSubtasks !== undefined) {
      checks.push({
        name: 'maxSubtasks',
        passed: subtasks.length <= config.maxSubtasks,
        expected: config.maxSubtasks,
        actual: subtasks.length
      });
    }

    // Check each subtask has required fields
    if (config.requiredFields) {
      const allHaveFields = subtasks.every(st =>
        config.requiredFields.every(field => st[field] !== undefined)
      );
      checks.push({
        name: 'requiredFields',
        passed: allHaveFields,
        expected: config.requiredFields
      });
    }

    // Check dependency graph exists
    if (config.expectGraph) {
      const hasGraph = decomposition?.dependencies !== undefined;
      checks.push({
        name: 'dependencyGraph',
        passed: hasGraph
      });
    }

    const allPassed = checks.every(c => c.passed);

    return {
      passed: allPassed,
      score: checks.length > 0 ? checks.filter(c => c.passed).length / checks.length : 1,
      subtaskCount: subtasks.length,
      checks: checks,
      reason: allPassed
        ? 'Task decomposition valid'
        : `Failed: ${checks.filter(c => !c.passed).map(c => c.name).join(', ')}`
    };
  }

  /**
   * Grade worker assignment (for Manager agents)
   */
  async gradeWorkerAssignment(outcome, config) {
    const assignments = outcome.output?.assignments || [];
    const expectedWorkers = config.expectWorkers || [];

    const assignedWorkers = [...new Set(assignments.map(a => a.worker))];
    const allAssigned = expectedWorkers.every(w => assignedWorkers.includes(w));
    const missing = expectedWorkers.filter(w => !assignedWorkers.includes(w));

    return {
      passed: allAssigned,
      score: expectedWorkers.length > 0
        ? (expectedWorkers.length - missing.length) / expectedWorkers.length
        : 1,
      expected: expectedWorkers,
      actual: assignedWorkers,
      missing: missing,
      reason: allAssigned
        ? 'All expected workers assigned'
        : `Missing workers: ${missing.join(', ')}`
    };
  }

  // ============================================
  // Helper Methods
  // ============================================

  extractActivatedSkills(outcome) {
    const transcript = outcome.transcript || [];
    const skills = [];

    // Check transcript entries for skill_activation type
    for (const entry of transcript) {
      if (entry.type === 'skill_activation') {
        skills.push(entry.skill);
      }
      // Also check for skill mentions in context
      if (entry.context?.activatedSkills) {
        skills.push(...entry.context.activatedSkills);
      }
      // Check assistant message content for activatedSkills
      if (entry.content?.activatedSkills) {
        skills.push(...entry.content.activatedSkills);
      }
    }

    // Also check output directly (sandbox mock returns activatedSkills in output)
    if (outcome.output?.activatedSkills) {
      skills.push(...outcome.output.activatedSkills);
    }

    // Check state for output.activatedSkills
    if (outcome.state?.output?.activatedSkills) {
      skills.push(...outcome.state.output.activatedSkills);
    }

    return [...new Set(skills)];
  }

  normalizeOutput(output) {
    if (typeof output !== 'string') {
      return JSON.stringify(output);
    }
    return this.tolerateWhitespace ? this.normalizeWhitespace(output) : output;
  }

  normalizeWhitespace(str) {
    return str.replace(/\s+/g, ' ').trim();
  }

  resolvePath(artifactPath, workDir) {
    if (path.isAbsolute(artifactPath)) {
      return artifactPath;
    }
    const base = workDir || process.cwd();
    return path.resolve(base, artifactPath);
  }

  checkPathExists(filePath) {
    try {
      // Handle glob patterns
      if (filePath.includes('*')) {
        const glob = require('glob');
        const matches = glob.sync(filePath);
        return matches.length > 0;
      }
      return fs.existsSync(filePath);
    } catch {
      return false;
    }
  }

  validateSchema(obj, schema, prefix = '') {
    const errors = [];

    if (!schema) return errors;

    for (const [key, rule] of Object.entries(schema)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      const value = obj?.[key];

      if (rule.required && value === undefined) {
        errors.push(`${fullKey} is required`);
        continue;
      }

      if (value === undefined) continue;

      if (rule.type && typeof value !== rule.type) {
        errors.push(`${fullKey} should be ${rule.type}, got ${typeof value}`);
      }

      if (rule.enum && !rule.enum.includes(value)) {
        errors.push(`${fullKey} should be one of: ${rule.enum.join(', ')}`);
      }

      if (rule.min !== undefined && value < rule.min) {
        errors.push(`${fullKey} should be >= ${rule.min}`);
      }

      if (rule.max !== undefined && value > rule.max) {
        errors.push(`${fullKey} should be <= ${rule.max}`);
      }

      if (rule.pattern && !new RegExp(rule.pattern).test(value)) {
        errors.push(`${fullKey} should match pattern ${rule.pattern}`);
      }

      if (rule.properties && typeof value === 'object') {
        errors.push(...this.validateSchema(value, rule.properties, fullKey));
      }
    }

    return errors;
  }

  getNestedValue(obj, path) {
    return path.split('.').reduce((curr, key) => curr?.[key], obj);
  }

  deepEqual(a, b) {
    if (a === b) return true;
    if (typeof a !== typeof b) return false;
    if (typeof a !== 'object' || a === null || b === null) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    if (keysA.length !== keysB.length) return false;

    return keysA.every(key => this.deepEqual(a[key], b[key]));
  }

  checkOrder(actual, expected) {
    let lastIndex = -1;
    for (const item of expected) {
      const index = actual.indexOf(item, lastIndex + 1);
      if (index === -1 || index <= lastIndex) return false;
      lastIndex = index;
    }
    return true;
  }
}

module.exports = CodeGrader;
