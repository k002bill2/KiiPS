/**
 * Deterministic Grader
 * 패턴 기반 결정적 채점기 - 일관성 있는 평가를 위한 확장 체크
 *
 * @version 2.0.0
 * @description 새로운 체크 타입 지원: output_contains_any, contains_any
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

class DeterministicGrader {
  constructor(config = {}) {
    this.config = config;
    this.basePath = config.basePath || process.cwd();
    this.output = config.output || '';
  }

  /**
   * 메인 채점 함수
   */
  async grade(outcome, graderConfig) {
    const results = {
      passed: true,
      checks: [],
      score: 0,
      maxScore: 0
    };

    const checks = graderConfig.checks || [];

    for (const check of checks) {
      const checkResult = await this.runCheck(check, outcome);
      results.checks.push(checkResult);
      results.maxScore += checkResult.weight || 1;
      if (checkResult.passed) {
        results.score += checkResult.weight || 1;
      } else {
        results.passed = false;
      }
    }

    results.percentage = results.maxScore > 0 ? (results.score / results.maxScore) * 100 : 0;
    return results;
  }

  /**
   * 개별 체크 실행
   */
  async runCheck(check, outcome) {
    // no_errors 체크
    if (check.no_errors !== undefined) {
      return this.checkNoErrors(outcome);
    }

    // file_exists 체크
    if (check.file_exists !== undefined) {
      return this.checkFileExists(check.file_exists);
    }

    // output_contains 체크 (단일 문자열)
    if (check.output_contains !== undefined) {
      return this.checkOutputContains(check.output_contains, outcome);
    }

    // output_contains_any 체크 (배열 - 하나라도 포함되면 Pass)
    if (check.output_contains_any !== undefined) {
      return this.checkOutputContainsAny(check.output_contains_any, outcome);
    }

    // contains 체크 (파일 패턴 + 검색어)
    if (check.contains !== undefined) {
      return this.checkContains(check.contains);
    }

    // not_contains 체크
    if (check.not_contains !== undefined) {
      return this.checkNotContains(check.not_contains);
    }

    // contains_any 체크 (여러 검색어 중 하나라도 있으면 Pass)
    if (check.contains_any !== undefined) {
      return this.checkContainsAny(check.contains_any);
    }

    // pattern_match 체크 (정규식)
    if (check.pattern_match !== undefined) {
      return this.checkPatternMatch(check.pattern_match, outcome);
    }

    return {
      type: 'unknown',
      passed: false,
      reason: `Unknown check type: ${JSON.stringify(check)}`
    };
  }

  /**
   * 에러 없음 체크
   */
  checkNoErrors(outcome) {
    const hasErrors = outcome && (
      outcome.error ||
      (outcome.stderr && outcome.stderr.length > 0) ||
      (outcome.exitCode && outcome.exitCode !== 0)
    );

    return {
      type: 'no_errors',
      passed: !hasErrors,
      reason: hasErrors ? 'Errors detected in output' : 'No errors'
    };
  }

  /**
   * 파일 존재 체크
   */
  checkFileExists(filePath) {
    const fullPath = path.join(this.basePath, filePath);
    const exists = fs.existsSync(fullPath);

    return {
      type: 'file_exists',
      passed: exists,
      file: filePath,
      reason: exists ? 'File exists' : 'File not found'
    };
  }

  /**
   * 출력에 문자열 포함 체크
   */
  checkOutputContains(searchStr, outcome) {
    const output = this.getOutputString(outcome);
    const found = output.toLowerCase().includes(searchStr.toLowerCase());

    return {
      type: 'output_contains',
      passed: found,
      search: searchStr,
      reason: found ? `Found "${searchStr}" in output` : `"${searchStr}" not found in output`
    };
  }

  /**
   * 출력에 여러 문자열 중 하나 이상 포함 체크
   */
  checkOutputContainsAny(searchStrings, outcome) {
    const output = this.getOutputString(outcome);
    const outputLower = output.toLowerCase();

    const foundItems = [];
    for (const str of searchStrings) {
      if (outputLower.includes(str.toLowerCase())) {
        foundItems.push(str);
      }
    }

    const passed = foundItems.length > 0;
    return {
      type: 'output_contains_any',
      passed,
      searchStrings,
      foundItems,
      reason: passed
        ? `Found: ${foundItems.join(', ')}`
        : `None of the keywords found in output`
    };
  }

  /**
   * 파일에 문자열 포함 체크
   */
  async checkContains(config) {
    const { pattern, search } = config;
    if (!pattern || !search) {
      return {
        type: 'contains',
        passed: false,
        reason: 'Missing pattern or search in contains check'
      };
    }

    try {
      const files = await glob(pattern, { cwd: this.basePath });

      for (const file of files) {
        const filePath = path.join(this.basePath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(search)) {
            return {
              type: 'contains',
              passed: true,
              pattern,
              search,
              foundIn: file,
              reason: `Found "${search}" in ${file}`
            };
          }
        }
      }

      return {
        type: 'contains',
        passed: false,
        pattern,
        search,
        reason: `"${search}" not found in files matching ${pattern}`
      };
    } catch (error) {
      return {
        type: 'contains',
        passed: false,
        reason: `Error: ${error.message}`
      };
    }
  }

  /**
   * 파일에 문자열 미포함 체크
   */
  async checkNotContains(config) {
    const { pattern, search } = config;
    if (!pattern || !search) {
      return {
        type: 'not_contains',
        passed: true, // 설정 오류 시 Pass 처리
        reason: 'Missing pattern or search in not_contains check'
      };
    }

    try {
      const files = await glob(pattern, { cwd: this.basePath });

      for (const file of files) {
        const filePath = path.join(this.basePath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          if (content.includes(search)) {
            return {
              type: 'not_contains',
              passed: false,
              pattern,
              search,
              foundIn: file,
              reason: `Found forbidden "${search}" in ${file}`
            };
          }
        }
      }

      return {
        type: 'not_contains',
        passed: true,
        pattern,
        search,
        reason: `"${search}" correctly not found in files`
      };
    } catch (error) {
      return {
        type: 'not_contains',
        passed: true, // 파일 없음 = 위험 패턴 없음
        reason: `No matching files: ${error.message}`
      };
    }
  }

  /**
   * 파일에 여러 문자열 중 하나 이상 포함 체크
   */
  async checkContainsAny(config) {
    const { pattern, searches } = config;
    if (!pattern || !searches || !Array.isArray(searches)) {
      return {
        type: 'contains_any',
        passed: false,
        reason: 'Missing pattern or searches array in contains_any check'
      };
    }

    try {
      const files = await glob(pattern, { cwd: this.basePath });
      const foundItems = [];
      const foundFiles = [];

      for (const file of files) {
        const filePath = path.join(this.basePath, file);
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf8');
          for (const search of searches) {
            if (content.includes(search) && !foundItems.includes(search)) {
              foundItems.push(search);
              foundFiles.push({ search, file });
            }
          }
        }
      }

      const passed = foundItems.length > 0;
      return {
        type: 'contains_any',
        passed,
        pattern,
        searches,
        foundItems,
        foundFiles,
        reason: passed
          ? `Found: ${foundItems.join(', ')}`
          : `None of the patterns found in files matching ${pattern}`
      };
    } catch (error) {
      return {
        type: 'contains_any',
        passed: false,
        reason: `Error: ${error.message}`
      };
    }
  }

  /**
   * 정규식 패턴 매칭 체크
   */
  checkPatternMatch(config, outcome) {
    const { pattern, flags = 'i' } = config;
    const output = this.getOutputString(outcome);

    try {
      const regex = new RegExp(pattern, flags);
      const matches = output.match(regex);
      const passed = matches !== null;

      return {
        type: 'pattern_match',
        passed,
        pattern,
        matches: matches ? matches.slice(0, 3) : [], // 최대 3개 매치 반환
        reason: passed ? `Pattern matched` : `Pattern not matched`
      };
    } catch (error) {
      return {
        type: 'pattern_match',
        passed: false,
        reason: `Invalid regex: ${error.message}`
      };
    }
  }

  /**
   * outcome에서 출력 문자열 추출
   */
  getOutputString(outcome) {
    if (!outcome) return '';
    if (typeof outcome === 'string') return outcome;
    if (outcome.stdout) return outcome.stdout;
    if (outcome.output) return outcome.output;
    if (outcome.transcript) {
      // 에이전트 트랜스크립트에서 텍스트 추출
      const turns = Array.isArray(outcome.transcript)
        ? outcome.transcript
        : (outcome.transcript.turns || []);
      return turns
        .filter(t => t.role === 'assistant')
        .map(t => t.content || '')
        .join('\n');
    }
    return JSON.stringify(outcome);
  }
}

module.exports = new DeterministicGrader();
module.exports.DeterministicGrader = DeterministicGrader;
