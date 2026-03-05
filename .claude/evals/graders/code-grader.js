/**
 * Code-based Deterministic Grader
 * 파일 존재, 패턴 매칭, 에러 체크 등 결정론적 채점
 *
 * @version 2.0.0
 */

const fs = require('fs');
const path = require('path');

// glob 동적 로드 (ES Module 호환)
let globFn;
try {
  const globModule = require('glob');
  // glob v9+ uses named export, older versions use default
  globFn = globModule.glob || globModule;
} catch (e) {
  console.warn('[CodeGrader] glob not found, using simple fallback');
  // Simple fallback using fs
  globFn = async (pattern, opts) => {
    const baseDir = opts?.cwd || process.cwd();
    try {
      // Simple implementation for basic patterns
      if (pattern.includes('**')) {
        return []; // Complex patterns not supported in fallback
      }
      const files = fs.readdirSync(baseDir);
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return files.filter(f => regex.test(f));
    } catch {
      return [];
    }
  };
}

class CodeGrader {
  constructor(config = {}) {
    this.config = config;
    this.basePath = config.basePath || process.cwd();
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
      results.maxScore += 1;
      if (checkResult.passed) {
        results.score += 1;
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
    // 빈 객체 체크
    const entries = Object.entries(check);
    if (entries.length === 0) {
      return {
        type: 'unknown',
        passed: false,
        reason: 'Empty check configuration'
      };
    }

    // 체크 타입 파싱
    const [checkType, checkValue] = entries[0];

    switch (checkType) {
      case 'file_exists':
        return this.checkFileExists(checkValue);

      case 'file_not_exists':
        return this.checkFileNotExists(checkValue);

      case 'contains':
        // YAML 형식: - contains: { pattern: "...", search: "..." }
        if (typeof checkValue === 'object' && checkValue !== null) {
          return this.checkContains(checkValue.pattern || checkValue.file, checkValue.search);
        }
        return this.checkContains(check.pattern || check.file, checkValue);

      case 'not_contains':
        if (typeof checkValue === 'object' && checkValue !== null) {
          return this.checkNotContains(checkValue.pattern || checkValue.file, checkValue.search);
        }
        return this.checkNotContains(check.pattern || check.file, checkValue);

      case 'pattern_match':
        if (typeof checkValue === 'object' && checkValue !== null) {
          return this.checkPatternMatch(checkValue.file || checkValue.pattern, checkValue.regex);
        }
        return this.checkPatternMatch(check.file || check.pattern, checkValue);

      case 'no_errors':
        return this.checkNoErrors(outcome);

      case 'exit_code':
        return this.checkExitCode(outcome, checkValue);

      case 'output_contains':
        return this.checkOutputContains(outcome, checkValue);

      case 'file_count':
        return this.checkFileCount(check.pattern, checkValue);

      default:
        return {
          type: checkType,
          passed: false,
          reason: `Unknown check type: ${checkType}`
        };
    }
  }

  /**
   * 파일 존재 확인
   */
  async checkFileExists(pattern) {
    try {
      const files = await globFn(pattern, { cwd: this.basePath });
      const passed = files.length > 0;
      return {
        type: 'file_exists',
        pattern,
        passed,
        found: files,
        reason: passed ? `Found ${files.length} file(s)` : 'No files found'
      };
    } catch (error) {
      return {
        type: 'file_exists',
        pattern,
        passed: false,
        reason: `Error: ${error.message}`
      };
    }
  }

  /**
   * 파일 부재 확인
   */
  async checkFileNotExists(pattern) {
    const result = await this.checkFileExists(pattern);
    return {
      type: 'file_not_exists',
      pattern,
      passed: !result.passed,
      reason: result.passed ? 'File should not exist' : 'File correctly absent'
    };
  }

  /**
   * 파일 내용 포함 확인
   */
  async checkContains(filePattern, searchText) {
    try {
      if (!filePattern || !searchText) {
        return {
          type: 'contains',
          passed: false,
          reason: 'Missing pattern or search text'
        };
      }

      const files = await globFn(filePattern, { cwd: this.basePath });
      if (files.length === 0) {
        return {
          type: 'contains',
          pattern: filePattern,
          search: searchText,
          passed: false,
          reason: 'No files found to check'
        };
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.basePath, file), 'utf8');
          if (content.includes(searchText)) {
            return {
              type: 'contains',
              pattern: filePattern,
              search: searchText,
              passed: true,
              foundIn: file,
              reason: `Found "${searchText}" in ${file}`
            };
          }
        } catch (readError) {
          // Skip unreadable files
          continue;
        }
      }

      return {
        type: 'contains',
        pattern: filePattern,
        search: searchText,
        passed: false,
        reason: `"${searchText}" not found in any file`
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
   * 파일 내용 미포함 확인
   */
  async checkNotContains(filePattern, searchText) {
    const result = await this.checkContains(filePattern, searchText);
    return {
      type: 'not_contains',
      pattern: filePattern,
      search: searchText,
      passed: !result.passed,
      reason: result.passed ? `Should not contain "${searchText}"` : 'Content correctly absent'
    };
  }

  /**
   * 정규식 패턴 매칭
   */
  async checkPatternMatch(filePattern, regexPattern) {
    try {
      if (!filePattern || !regexPattern) {
        return {
          type: 'pattern_match',
          passed: false,
          reason: 'Missing file pattern or regex pattern'
        };
      }

      const files = await globFn(filePattern, { cwd: this.basePath });

      // Regex 생성 시 에러 처리
      let regex;
      try {
        regex = new RegExp(regexPattern);
      } catch (regexError) {
        return {
          type: 'pattern_match',
          passed: false,
          reason: `Invalid regex: ${regexError.message}`
        };
      }

      for (const file of files) {
        try {
          const content = fs.readFileSync(path.join(this.basePath, file), 'utf8');
          if (regex.test(content)) {
            return {
              type: 'pattern_match',
              file: filePattern,
              regex: regexPattern,
              passed: true,
              foundIn: file,
              reason: `Pattern matched in ${file}`
            };
          }
        } catch (readError) {
          continue;
        }
      }

      return {
        type: 'pattern_match',
        file: filePattern,
        regex: regexPattern,
        passed: false,
        reason: 'Pattern not matched in any file'
      };
    } catch (error) {
      return {
        type: 'pattern_match',
        passed: false,
        reason: `Error: ${error.message}`
      };
    }
  }

  /**
   * 에러 없음 확인
   */
  checkNoErrors(outcome) {
    const hasError = outcome?.error || outcome?.transcript?.error;
    return {
      type: 'no_errors',
      passed: !hasError,
      reason: hasError ? `Error: ${outcome.error || outcome.transcript?.error}` : 'No errors'
    };
  }

  /**
   * 종료 코드 확인
   */
  checkExitCode(outcome, expectedCode) {
    const actualCode = outcome?.exitCode ?? 0;
    return {
      type: 'exit_code',
      expected: expectedCode,
      actual: actualCode,
      passed: actualCode === expectedCode,
      reason: actualCode === expectedCode ? 'Exit code matches' : `Expected ${expectedCode}, got ${actualCode}`
    };
  }

  /**
   * 출력 포함 확인
   */
  checkOutputContains(outcome, searchText) {
    const output = outcome?.transcript?.output || outcome?.output || '';
    const passed = output.includes(searchText);
    return {
      type: 'output_contains',
      search: searchText,
      passed,
      reason: passed ? 'Output contains expected text' : 'Expected text not found in output'
    };
  }

  /**
   * 파일 개수 확인
   */
  async checkFileCount(pattern, expected) {
    try {
      const files = await globFn(pattern, { cwd: this.basePath });
      const passed = files.length === expected;
      return {
        type: 'file_count',
        pattern,
        expected,
        actual: files.length,
        passed,
        reason: passed ? `Found exactly ${expected} file(s)` : `Expected ${expected}, found ${files.length}`
      };
    } catch (error) {
      return {
        type: 'file_count',
        passed: false,
        reason: `Error: ${error.message}`
      };
    }
  }
}

module.exports = new CodeGrader();
module.exports.CodeGrader = CodeGrader;
