/**
 * KiiPS AI Agent Transcript System
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * - Records complete execution history for analysis
 * - Tracks tool calls, messages, thinking, and metrics
 * - Supports JSON serialization for storage and LLM grading
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');

class Transcript {
  /**
   * Create a new transcript for a task
   * @param {string} taskId - Unique task identifier
   * @param {Object} options - Configuration options
   */
  constructor(taskId, options = {}) {
    this.taskId = taskId;
    this.startTime = Date.now();
    this.endTime = null;

    // Execution records
    this.entries = [];
    this.toolCalls = [];
    this.messages = [];
    this.thinking = [];

    // Metrics
    this.metrics = {
      tokenCount: 0,
      inputTokens: 0,
      outputTokens: 0,
      turns: 0,
      toolCallCount: 0,
      latency: null
    };

    // Metadata
    this.metadata = {
      taskId,
      trialNumber: options.trialNumber || 1,
      graders: options.graders || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Add a tool call to the transcript
   * @param {string} tool - Tool name
   * @param {Object} params - Tool parameters
   * @param {*} result - Tool execution result
   * @param {Object} meta - Additional metadata
   */
  addToolCall(tool, params, result, meta = {}) {
    const entry = {
      type: 'tool_call',
      timestamp: Date.now(),
      tool,
      params: this._sanitizeParams(params),
      result: this._truncateResult(result),
      duration: meta.duration || null,
      success: meta.success !== false,
      error: meta.error || null
    };

    this.entries.push(entry);
    this.toolCalls.push(entry);
    this.metrics.toolCallCount++;

    // Estimate tokens (rough approximation)
    this.metrics.inputTokens += this._estimateTokens(JSON.stringify(params));
    this.metrics.outputTokens += this._estimateTokens(JSON.stringify(result));

    return entry;
  }

  /**
   * Add a message to the transcript
   * @param {string} role - Message role (user, assistant, system)
   * @param {string} content - Message content
   */
  addMessage(role, content) {
    const entry = {
      type: 'message',
      timestamp: Date.now(),
      role,
      content: this._truncateContent(content)
    };

    this.entries.push(entry);
    this.messages.push(entry);

    if (role === 'user' || role === 'assistant') {
      this.metrics.turns++;
    }

    this.metrics.outputTokens += this._estimateTokens(content);

    return entry;
  }

  /**
   * Add thinking/reasoning to the transcript
   * @param {string} content - Thinking content
   */
  addThinking(content) {
    const entry = {
      type: 'thinking',
      timestamp: Date.now(),
      content: this._truncateContent(content)
    };

    this.entries.push(entry);
    this.thinking.push(entry);

    return entry;
  }

  /**
   * Add a state change record
   * @param {string} description - Description of state change
   * @param {Object} before - State before change
   * @param {Object} after - State after change
   */
  addStateChange(description, before, after) {
    const entry = {
      type: 'state_change',
      timestamp: Date.now(),
      description,
      before: this._sanitizeState(before),
      after: this._sanitizeState(after)
    };

    this.entries.push(entry);

    return entry;
  }

  /**
   * Add a grader result
   * @param {string} graderType - Type of grader
   * @param {Object} result - Grading result
   */
  addGraderResult(graderType, result) {
    const entry = {
      type: 'grader_result',
      timestamp: Date.now(),
      graderType,
      passed: result.passed,
      score: result.score,
      feedback: result.feedback,
      details: result.details
    };

    this.entries.push(entry);

    return entry;
  }

  /**
   * Mark transcript as complete
   * @param {Object} outcome - Final outcome
   */
  complete(outcome = {}) {
    this.endTime = Date.now();
    this.metrics.latency = this.endTime - this.startTime;
    this.metrics.tokenCount = this.metrics.inputTokens + this.metrics.outputTokens;
    this.outcome = outcome;
  }

  /**
   * Get full transcript log
   * @returns {Array} All entries in chronological order
   */
  getFullLog() {
    return this.entries.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Get only tool calls
   * @returns {Array} Tool call entries
   */
  getToolCalls() {
    return this.toolCalls;
  }

  /**
   * Get only messages
   * @returns {Array} Message entries
   */
  getMessages() {
    return this.messages;
  }

  /**
   * Get token count
   * @returns {number} Total estimated tokens
   */
  getTokenCount() {
    return this.metrics.tokenCount;
  }

  /**
   * Get execution duration
   * @returns {number|null} Duration in milliseconds
   */
  getDuration() {
    return this.metrics.latency;
  }

  /**
   * Get summary for reporting
   * @returns {Object} Transcript summary
   */
  getSummary() {
    return {
      taskId: this.taskId,
      trialNumber: this.metadata.trialNumber,
      duration: this.metrics.latency,
      turns: this.metrics.turns,
      toolCalls: this.metrics.toolCallCount,
      tokens: this.metrics.tokenCount,
      entryCount: this.entries.length,
      passed: this.outcome?.passed
    };
  }

  /**
   * Convert to JSON for storage
   * @returns {Object} JSON representation
   */
  toJSON() {
    return {
      taskId: this.taskId,
      metadata: this.metadata,
      startTime: this.startTime,
      endTime: this.endTime,
      metrics: this.metrics,
      entries: this.entries,
      outcome: this.outcome
    };
  }

  /**
   * Save transcript to file
   * @param {string} outputDir - Output directory
   * @returns {string} File path
   */
  save(outputDir) {
    const filename = `${this.taskId}_${this.metadata.trialNumber}_${Date.now()}.json`;
    const filepath = path.join(outputDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(this.toJSON(), null, 2));

    return filepath;
  }

  /**
   * Create transcript from JSON
   * @param {Object} json - JSON data
   * @returns {Transcript} Transcript instance
   */
  static fromJSON(json) {
    const transcript = new Transcript(json.taskId, {
      trialNumber: json.metadata?.trialNumber
    });

    transcript.startTime = json.startTime;
    transcript.endTime = json.endTime;
    transcript.metadata = json.metadata;
    transcript.metrics = json.metrics;
    transcript.entries = json.entries || [];
    transcript.outcome = json.outcome;

    // Rebuild indexes
    transcript.toolCalls = transcript.entries.filter(e => e.type === 'tool_call');
    transcript.messages = transcript.entries.filter(e => e.type === 'message');
    transcript.thinking = transcript.entries.filter(e => e.type === 'thinking');

    return transcript;
  }

  /**
   * Load transcript from file
   * @param {string} filepath - File path
   * @returns {Transcript} Transcript instance
   */
  static load(filepath) {
    const json = JSON.parse(fs.readFileSync(filepath, 'utf8'));
    return Transcript.fromJSON(json);
  }

  // Private helper methods

  _sanitizeParams(params) {
    // Remove sensitive data from params
    const sanitized = { ...params };
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'credential'];

    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(s => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  _truncateResult(result) {
    const maxLength = 10000;
    const str = typeof result === 'string' ? result : JSON.stringify(result);

    if (str.length > maxLength) {
      return str.substring(0, maxLength) + '... [TRUNCATED]';
    }

    return result;
  }

  _truncateContent(content) {
    const maxLength = 5000;

    if (content && content.length > maxLength) {
      return content.substring(0, maxLength) + '... [TRUNCATED]';
    }

    return content;
  }

  _sanitizeState(state) {
    // Deep clone and sanitize state
    if (!state) return null;

    try {
      const sanitized = JSON.parse(JSON.stringify(state));
      return this._truncateResult(sanitized);
    } catch {
      return '[UNSERIALIZABLE]';
    }
  }

  _estimateTokens(text) {
    // Rough token estimation (approximately 4 chars per token)
    if (!text) return 0;
    const str = typeof text === 'string' ? text : JSON.stringify(text);
    return Math.ceil(str.length / 4);
  }
}

/**
 * Transcript Manager for handling multiple transcripts
 */
class TranscriptManager {
  constructor(config = {}) {
    this.outputDir = config.storePath || './results/transcripts/';
    this.retention = config.retention || '30d';
    this.transcripts = new Map();

    // Ensure output directory exists
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Create a new transcript
   * @param {string} taskId - Task identifier
   * @param {Object} options - Transcript options
   * @returns {Transcript} New transcript
   */
  create(taskId, options = {}) {
    const transcript = new Transcript(taskId, options);
    this.transcripts.set(`${taskId}_${options.trialNumber || 1}`, transcript);
    return transcript;
  }

  /**
   * Get a transcript by task ID
   * @param {string} taskId - Task identifier
   * @param {number} trialNumber - Trial number
   * @returns {Transcript|null} Transcript or null
   */
  get(taskId, trialNumber = 1) {
    return this.transcripts.get(`${taskId}_${trialNumber}`) || null;
  }

  /**
   * Save all transcripts
   * @returns {Array} File paths
   */
  saveAll() {
    const paths = [];

    for (const transcript of this.transcripts.values()) {
      const filepath = transcript.save(this.outputDir);
      paths.push(filepath);
    }

    return paths;
  }

  /**
   * List recent transcripts
   * @param {number} limit - Maximum number to return
   * @returns {Array} Recent transcript files
   */
  listRecent(limit = 10) {
    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.endsWith('.json'))
      .map(f => ({
        name: f,
        path: path.join(this.outputDir, f),
        mtime: fs.statSync(path.join(this.outputDir, f)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime)
      .slice(0, limit);

    return files;
  }

  /**
   * Clean up old transcripts based on retention policy
   */
  cleanup() {
    const retentionDays = parseInt(this.retention) || 30;
    const cutoff = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);

    const files = fs.readdirSync(this.outputDir)
      .filter(f => f.endsWith('.json'));

    let deleted = 0;

    for (const file of files) {
      const filepath = path.join(this.outputDir, file);
      const stat = fs.statSync(filepath);

      if (stat.mtime.getTime() < cutoff) {
        fs.unlinkSync(filepath);
        deleted++;
      }
    }

    return deleted;
  }
}

module.exports = { Transcript, TranscriptManager };
