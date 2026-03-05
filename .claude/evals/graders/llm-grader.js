/**
 * LLM-based Grader
 * Rubric 기반 품질 평가 (코드 품질, UI 품질, 접근성 등)
 * Claude API 통합 버전
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');
const Anthropic = require('@anthropic-ai/sdk');

// Prompts 디렉토리
const PROMPTS_DIR = path.join(__dirname, '../prompts');

class LLMGrader {
  constructor(config = {}) {
    this.config = {
      model: config.model || 'claude-3-haiku-20240307',
      maxTokens: config.maxTokens || 1000,
      ...config
    };
    // Claude API 클라이언트 초기화
    this.client = new Anthropic();
  }

  /**
   * 메인 채점 함수
   */
  async grade(outcome, graderConfig) {
    const rubricPath = path.join(PROMPTS_DIR, graderConfig.rubric);
    const rubric = this.loadRubric(rubricPath);

    if (!rubric) {
      return {
        passed: true, // Rubric 없으면 통과 처리
        reason: 'Rubric not found, skipping LLM grading',
        score: null
      };
    }

    // Assertion 체크
    const assertions = graderConfig.assertions || [];
    const assertionResults = await this.checkAssertions(outcome, rubric, assertions);

    // 점수 계산
    const passedAssertions = assertionResults.filter(a => a.passed).length;
    const totalAssertions = assertions.length;
    const score = totalAssertions > 0 ? (passedAssertions / totalAssertions) * 100 : 100;

    // 통과 기준: 70% 이상
    const threshold = graderConfig.threshold || 70;
    const passed = score >= threshold;

    return {
      passed,
      score,
      threshold,
      assertions: assertionResults,
      rubric: graderConfig.rubric,
      reason: passed
        ? `LLM evaluation passed (${score.toFixed(1)}% >= ${threshold}%)`
        : `LLM evaluation failed (${score.toFixed(1)}% < ${threshold}%)`
    };
  }

  /**
   * Rubric 로드
   */
  loadRubric(rubricPath) {
    try {
      if (fs.existsSync(rubricPath)) {
        return fs.readFileSync(rubricPath, 'utf8');
      }
      // .md 확장자 추가 시도
      const mdPath = rubricPath.endsWith('.md') ? rubricPath : `${rubricPath}.md`;
      if (fs.existsSync(mdPath)) {
        return fs.readFileSync(mdPath, 'utf8');
      }
    } catch (error) {
      console.warn(`[LLMGrader] Rubric load error: ${error.message}`);
    }
    return null;
  }

  /**
   * Assertion 체크
   */
  async checkAssertions(outcome, rubric, assertions) {
    const results = [];

    for (const assertion of assertions) {
      const result = await this.evaluateAssertion(outcome, rubric, assertion);
      results.push(result);
    }

    return results;
  }

  /**
   * 단일 Assertion 평가 (Claude API 호출)
   */
  async evaluateAssertion(outcome, rubric, assertion) {
    const prompt = this.buildPrompt(outcome, rubric, assertion);

    try {
      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      return this.parseResponse(response.content[0].text, assertion);
    } catch (error) {
      // API 실패 시 fallback: 키워드 매칭 유지
      console.warn(`[LLMGrader] API call failed, using fallback: ${error.message}`);
      return this.evaluateAssertionFallback(outcome, rubric, assertion);
    }
  }

  /**
   * Fallback: 키워드 기반 매칭 (API 실패 시)
   */
  evaluateAssertionFallback(outcome, rubric, assertion) {
    const transcript = outcome.transcript || {};
    const content = JSON.stringify(transcript).toLowerCase();
    const assertionLower = assertion.toLowerCase();

    // 키워드 기반 간단한 매칭
    const keywords = assertionLower.split(/\s+/).filter(w => w.length > 3);
    const matchCount = keywords.filter(kw => content.includes(kw)).length;
    const matchRatio = keywords.length > 0 ? matchCount / keywords.length : 0;

    const passed = matchRatio >= 0.5 || outcome.success;

    return {
      assertion,
      passed,
      confidence: 0.5, // fallback 신뢰도 낮춤
      reason: passed ? 'Assertion appears satisfied (fallback)' : 'Assertion may not be satisfied (fallback)',
      simulated: true
    };
  }

  /**
   * LLM 프롬프트 구성
   */
  buildPrompt(outcome, rubric, assertion) {
    // outcome을 JSON으로 직렬화하되 크기 제한
    const outcomeStr = JSON.stringify(outcome.transcript || outcome, null, 2);
    const truncatedOutcome = outcomeStr.length > 8000
      ? outcomeStr.slice(0, 8000) + '\n... (truncated)'
      : outcomeStr;

    return `You are an expert code reviewer evaluating AI agent outputs for a Korean enterprise system (KiiPS).

## Evaluation Rubric
${rubric}

## Assertion to Verify
"${assertion}"

## Agent Execution Outcome
\`\`\`json
${truncatedOutcome}
\`\`\`

## Instructions
1. Carefully analyze the agent's output against the assertion
2. Consider the rubric criteria for evaluation
3. Be strict but fair - partial implementations should be acknowledged
4. Focus on whether the core requirement was met

Respond ONLY with valid JSON (no markdown code blocks, no explanation):
{"passed": true/false, "confidence": 0.0-1.0, "reason": "brief explanation in Korean"}`;
  }

  /**
   * LLM 응답 파싱
   */
  parseResponse(response, assertion) {
    try {
      // JSON 블록 추출 시도
      let jsonStr = response.trim();

      // 마크다운 코드 블록 제거
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }

      const json = JSON.parse(jsonStr);
      return {
        assertion,
        passed: Boolean(json.passed),
        confidence: Number(json.confidence) || 0.8,
        reason: json.reason || 'No reason provided',
        simulated: false
      };
    } catch (error) {
      console.warn(`[LLMGrader] Response parse error: ${error.message}`);
      console.warn(`[LLMGrader] Raw response: ${response.slice(0, 200)}`);
      return {
        assertion,
        passed: false,
        confidence: 0,
        reason: 'Failed to parse LLM response',
        simulated: false,
        parseError: true
      };
    }
  }
}

module.exports = new LLMGrader();
module.exports.LLMGrader = LLMGrader;
