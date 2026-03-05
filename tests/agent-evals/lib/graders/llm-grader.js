/**
 * LLM-based Grader for AI Agent Evaluation
 *
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide:
 * - Uses natural language rubrics for evaluation
 * - Provides flexible, nuanced grading
 * - Requires calibration with human judgments
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');

class LLMGrader {
  /**
   * Create LLM Grader
   * @param {Object} config - Configuration
   */
  constructor(config = {}) {
    this.model = config.model || 'claude-sonnet-4';
    this.rubricPath = config.rubricPath || './rubrics/';
    this.timeout = config.timeout || 60000;
    this.maxRetries = config.maxRetries || 2;
    this.enabled = config.enabled !== false;

    // Cache for loaded rubrics
    this.rubricCache = new Map();

    // Calibration data
    this.calibrationData = [];
  }

  /**
   * Grade an outcome using LLM
   * @param {Object} outcome - Task execution outcome
   * @param {Object} graderConfig - Grader configuration
   * @param {Object} transcript - Transcript instance (optional)
   * @returns {Object} Grading result
   */
  async grade(outcome, graderConfig, transcript = null) {
    if (!this.enabled) {
      return {
        passed: true,
        score: 1.0,
        skipped: true,
        reason: 'LLM grader disabled'
      };
    }

    try {
      // Load rubric
      const rubric = await this.loadRubric(graderConfig.rubric || 'default');

      // Build grading prompt
      const prompt = this.buildGradingPrompt(outcome, rubric, transcript, graderConfig);

      // Call LLM for grading
      const response = await this.callLLM(prompt);

      // Parse response
      const result = this.parseGradingResponse(response);

      return {
        passed: result.passed,
        score: result.score,
        feedback: result.feedback,
        details: result.details,
        confidence: result.confidence,
        rubricUsed: graderConfig.rubric || 'default'
      };

    } catch (error) {
      return {
        passed: false,
        score: 0,
        error: error.message,
        feedback: `LLM grading failed: ${error.message}`
      };
    }
  }

  /**
   * Grade with a specific rubric
   * @param {Object} transcript - Transcript to grade
   * @param {string} rubricPath - Path to rubric file
   * @returns {Object} Grading result
   */
  async gradeWithRubric(transcript, rubricPath) {
    const rubric = await this.loadRubric(rubricPath);
    return this.grade({ transcript: transcript.toJSON() }, { rubric: rubricPath }, transcript);
  }

  /**
   * Load rubric from file
   * @param {string} rubricName - Rubric name or path
   * @returns {Object} Rubric content
   */
  async loadRubric(rubricName) {
    // Check cache
    if (this.rubricCache.has(rubricName)) {
      return this.rubricCache.get(rubricName);
    }

    // Determine file path
    let rubricPath;
    if (rubricName.endsWith('.md') || rubricName.endsWith('.json')) {
      rubricPath = rubricName;
    } else {
      rubricPath = path.join(this.rubricPath, `${rubricName}.md`);
    }

    // Check if file exists
    if (!fs.existsSync(rubricPath)) {
      // Use default rubric
      return this.getDefaultRubric();
    }

    // Load and parse rubric
    const content = fs.readFileSync(rubricPath, 'utf8');
    const rubric = this.parseRubric(content);

    // Cache it
    this.rubricCache.set(rubricName, rubric);

    return rubric;
  }

  /**
   * Parse rubric markdown content
   * @param {string} content - Rubric markdown
   * @returns {Object} Parsed rubric
   */
  parseRubric(content) {
    const rubric = {
      title: '',
      description: '',
      criteria: [],
      passingScore: 0.7,
      weights: {}
    };

    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    if (titleMatch) {
      rubric.title = titleMatch[1];
    }

    // Extract description (content before first ##)
    const descMatch = content.match(/^#\s+.+\n\n([\s\S]*?)(?=\n##|$)/);
    if (descMatch) {
      rubric.description = descMatch[1].trim();
    }

    // Extract criteria (## Criteria sections)
    const criteriaRegex = /##\s+Criteria:\s*(.+)\n([\s\S]*?)(?=\n##|$)/g;
    let match;
    while ((match = criteriaRegex.exec(content)) !== null) {
      rubric.criteria.push({
        name: match[1].trim(),
        description: match[2].trim()
      });
    }

    // Extract passing score if specified
    const scoreMatch = content.match(/Passing Score:\s*([\d.]+)/i);
    if (scoreMatch) {
      rubric.passingScore = parseFloat(scoreMatch[1]);
    }

    // If no criteria found, use the whole content as description
    if (rubric.criteria.length === 0) {
      rubric.criteria.push({
        name: 'General',
        description: content
      });
    }

    return rubric;
  }

  /**
   * Get default rubric
   * @returns {Object} Default rubric
   */
  getDefaultRubric() {
    return {
      title: 'Default Evaluation Rubric',
      description: 'General purpose evaluation criteria',
      criteria: [
        {
          name: 'Correctness',
          description: 'Does the output correctly address the task requirements?'
        },
        {
          name: 'Completeness',
          description: 'Does the output fully complete the requested task?'
        },
        {
          name: 'Quality',
          description: 'Is the output well-formed and follows best practices?'
        }
      ],
      passingScore: 0.7
    };
  }

  /**
   * Build grading prompt for LLM
   * @param {Object} outcome - Task outcome
   * @param {Object} rubric - Rubric to use
   * @param {Object} transcript - Transcript (optional)
   * @param {Object} config - Additional config
   * @returns {string} Prompt for LLM
   */
  buildGradingPrompt(outcome, rubric, transcript, config) {
    let prompt = `You are an AI evaluation judge. Grade the following agent output according to the rubric.

## Rubric: ${rubric.title}
${rubric.description}

### Criteria:
${rubric.criteria.map((c, i) => `${i + 1}. **${c.name}**: ${c.description}`).join('\n')}

### Passing Score: ${rubric.passingScore * 100}%

---

## Agent Output to Evaluate:
`;

    // Add outcome
    if (outcome.output) {
      prompt += `\n### Output:\n${truncateForPrompt(outcome.output)}\n`;
    }

    // Add transcript summary if available
    if (transcript) {
      const summary = typeof transcript.getSummary === 'function'
        ? transcript.getSummary()
        : transcript;

      prompt += `
### Execution Summary:
- Tool Calls: ${summary.toolCalls || 0}
- Turns: ${summary.turns || 0}
- Duration: ${summary.duration || 'N/A'}ms
`;
    }

    // Add specific assertions if configured
    if (config.assertions && config.assertions.length > 0) {
      prompt += `
### Specific Assertions to Check:
${config.assertions.map((a, i) => `${i + 1}. ${a}`).join('\n')}
`;
    }

    prompt += `
---

## Instructions:
1. Evaluate the agent output against each criterion
2. Provide a score from 0.0 to 1.0 for each criterion
3. Calculate an overall weighted score
4. Determine if the output passes (>= ${rubric.passingScore * 100}%)
5. Provide brief feedback

## Response Format (JSON):
{
  "criteria_scores": {
    "<criterion_name>": { "score": <0.0-1.0>, "feedback": "<brief note>" }
  },
  "overall_score": <0.0-1.0>,
  "passed": <true/false>,
  "confidence": <0.0-1.0>,
  "feedback": "<overall assessment>"
}
`;

    return prompt;
  }

  /**
   * Call LLM for grading (mock implementation)
   * @param {string} prompt - Grading prompt
   * @returns {string} LLM response
   */
  async callLLM(prompt) {
    // In production, this would call the actual Claude API
    // For now, return a mock response

    // Check if we have an API client configured
    if (this.apiClient) {
      return await this.apiClient.complete(prompt, {
        model: this.model,
        timeout: this.timeout,
        maxRetries: this.maxRetries
      });
    }

    // Mock response for testing
    return JSON.stringify({
      criteria_scores: {
        'Correctness': { score: 0.85, feedback: 'Output addresses requirements' },
        'Completeness': { score: 0.90, feedback: 'Task fully completed' },
        'Quality': { score: 0.80, feedback: 'Good overall quality' }
      },
      overall_score: 0.85,
      passed: true,
      confidence: 0.9,
      feedback: 'The agent output meets the evaluation criteria.'
    });
  }

  /**
   * Set API client for LLM calls
   * @param {Object} client - API client instance
   */
  setAPIClient(client) {
    this.apiClient = client;
  }

  /**
   * Parse LLM grading response
   * @param {string} response - LLM response
   * @returns {Object} Parsed result
   */
  parseGradingResponse(response) {
    try {
      // Try to parse as JSON
      const parsed = typeof response === 'string' ? JSON.parse(response) : response;

      return {
        passed: parsed.passed === true,
        score: parseFloat(parsed.overall_score) || 0,
        feedback: parsed.feedback || '',
        details: parsed.criteria_scores || {},
        confidence: parseFloat(parsed.confidence) || 0.5
      };

    } catch (error) {
      // If JSON parsing fails, try to extract from text
      const passedMatch = response.match(/passed['":\s]*(true|false)/i);
      const scoreMatch = response.match(/overall_score['":\s]*([\d.]+)/i);

      return {
        passed: passedMatch ? passedMatch[1].toLowerCase() === 'true' : false,
        score: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
        feedback: 'Failed to parse structured response',
        details: { raw: response },
        confidence: 0.3
      };
    }
  }

  /**
   * Calibrate grader with human judgments
   * @param {Array} judgments - Array of { outcome, humanPassed, humanScore }
   */
  calibrate(judgments) {
    this.calibrationData = judgments;

    // Calculate agreement rate
    let agreements = 0;
    for (const judgment of judgments) {
      // Grade with current settings
      // Compare to human judgment
      // Adjust thresholds if needed
    }

    console.log(`Calibration complete with ${judgments.length} samples`);
  }

  /**
   * Get calibration statistics
   * @returns {Object} Calibration stats
   */
  getCalibrationStats() {
    if (this.calibrationData.length === 0) {
      return { calibrated: false, samples: 0 };
    }

    return {
      calibrated: true,
      samples: this.calibrationData.length,
      // Add more stats as needed
    };
  }
}

/**
 * Rubric Loader utility
 */
class RubricLoader {
  constructor(basePath = './rubrics/') {
    this.basePath = basePath;
    this.cache = new Map();
  }

  /**
   * List available rubrics
   * @returns {Array} Rubric names
   */
  listRubrics() {
    if (!fs.existsSync(this.basePath)) {
      return [];
    }

    return fs.readdirSync(this.basePath)
      .filter(f => f.endsWith('.md'))
      .map(f => f.replace('.md', ''));
  }

  /**
   * Load a rubric by name
   * @param {string} name - Rubric name
   * @returns {Object} Rubric content
   */
  load(name) {
    if (this.cache.has(name)) {
      return this.cache.get(name);
    }

    const filePath = path.join(this.basePath, `${name}.md`);
    if (!fs.existsSync(filePath)) {
      throw new Error(`Rubric not found: ${name}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const rubric = this.parseMarkdown(content);
    this.cache.set(name, rubric);

    return rubric;
  }

  /**
   * Parse markdown rubric
   * @param {string} content - Markdown content
   * @returns {Object} Parsed rubric
   */
  parseMarkdown(content) {
    // Same as LLMGrader.parseRubric
    const grader = new LLMGrader();
    return grader.parseRubric(content);
  }
}

/**
 * Truncate content for prompt
 * @param {string} content - Content to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated content
 */
function truncateForPrompt(content, maxLength = 5000) {
  if (!content) return '';
  const str = typeof content === 'string' ? content : JSON.stringify(content);
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '\n... [TRUNCATED]';
}

module.exports = { LLMGrader, RubricLoader };
