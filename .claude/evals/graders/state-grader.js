/**
 * State-based Grader
 * 환경 상태, 파일 상태, 프로세스 상태 확인
 *
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class StateGrader {
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

    const expect = graderConfig.expect || {};

    for (const [stateType, expectedValue] of Object.entries(expect)) {
      const checkResult = await this.checkState(stateType, expectedValue, outcome);
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
   * 상태 확인 라우터
   */
  async checkState(stateType, expectedValue, outcome) {
    switch (stateType) {
      case 'file_state':
        return this.checkFileState(expectedValue);

      case 'env_state':
        return this.checkEnvState(expectedValue);

      case 'process_state':
        return this.checkProcessState(expectedValue);

      case 'git_state':
        return this.checkGitState(expectedValue);

      case 'build_state':
        return this.checkBuildState(expectedValue);

      case 'service_state':
        return this.checkServiceState(expectedValue);

      case 'db_state':
        return this.checkDbState(expectedValue);

      default:
        return {
          type: stateType,
          passed: false,
          reason: `Unknown state type: ${stateType}`
        };
    }
  }

  /**
   * 파일 상태 확인
   */
  checkFileState(expected) {
    const results = [];

    for (const [filePath, expectedState] of Object.entries(expected)) {
      const fullPath = path.join(this.basePath, filePath);
      const exists = fs.existsSync(fullPath);

      if (expectedState.exists !== undefined) {
        results.push({
          file: filePath,
          check: 'exists',
          passed: exists === expectedState.exists,
          expected: expectedState.exists,
          actual: exists
        });
      }

      if (exists && expectedState.size !== undefined) {
        const stats = fs.statSync(fullPath);
        const sizeMatch = this.compareSize(stats.size, expectedState.size);
        results.push({
          file: filePath,
          check: 'size',
          passed: sizeMatch,
          expected: expectedState.size,
          actual: stats.size
        });
      }

      if (exists && expectedState.modified_after !== undefined) {
        const stats = fs.statSync(fullPath);
        const modTime = stats.mtime.getTime();
        const threshold = new Date(expectedState.modified_after).getTime();
        results.push({
          file: filePath,
          check: 'modified_after',
          passed: modTime > threshold,
          expected: expectedState.modified_after,
          actual: stats.mtime.toISOString()
        });
      }
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'file_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'All file states match' : 'Some file states do not match'
    };
  }

  /**
   * 환경 변수 상태 확인
   */
  checkEnvState(expected) {
    const results = [];

    for (const [envVar, expectedValue] of Object.entries(expected)) {
      const actual = process.env[envVar];
      const passed = expectedValue === '*' ? actual !== undefined : actual === expectedValue;

      results.push({
        env: envVar,
        passed,
        expected: expectedValue,
        actual: actual || '(not set)'
      });
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'env_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'All env vars match' : 'Some env vars do not match'
    };
  }

  /**
   * 프로세스 상태 확인
   */
  checkProcessState(expected) {
    const results = [];

    for (const [processName, expectedState] of Object.entries(expected)) {
      try {
        const output = execSync(`pgrep -f "${processName}"`, { encoding: 'utf8' }).trim();
        const isRunning = output.length > 0;

        const shouldRun = expectedState.running !== undefined ? expectedState.running : true;
        results.push({
          process: processName,
          check: 'running',
          passed: isRunning === shouldRun,
          expected: shouldRun,
          actual: isRunning
        });
      } catch (error) {
        // pgrep returns non-zero if no process found
        const shouldRun = expectedState.running !== undefined ? expectedState.running : true;
        results.push({
          process: processName,
          check: 'running',
          passed: !shouldRun,
          expected: shouldRun,
          actual: false
        });
      }
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'process_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'All process states match' : 'Some process states do not match'
    };
  }

  /**
   * Git 상태 확인
   */
  checkGitState(expected) {
    const results = [];

    try {
      // Clean working directory
      if (expected.clean !== undefined) {
        const status = execSync('git status --porcelain', { cwd: this.basePath, encoding: 'utf8' }).trim();
        const isClean = status.length === 0;
        results.push({
          check: 'clean',
          passed: isClean === expected.clean,
          expected: expected.clean,
          actual: isClean
        });
      }

      // Branch name
      if (expected.branch !== undefined) {
        const branch = execSync('git branch --show-current', { cwd: this.basePath, encoding: 'utf8' }).trim();
        results.push({
          check: 'branch',
          passed: branch === expected.branch,
          expected: expected.branch,
          actual: branch
        });
      }

      // Commit message contains
      if (expected.commit_contains !== undefined) {
        const message = execSync('git log -1 --pretty=%B', { cwd: this.basePath, encoding: 'utf8' }).trim();
        const contains = message.includes(expected.commit_contains);
        results.push({
          check: 'commit_contains',
          passed: contains,
          expected: expected.commit_contains,
          actual: message.substring(0, 100)
        });
      }
    } catch (error) {
      return {
        type: 'git_state',
        passed: false,
        reason: `Git error: ${error.message}`
      };
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'git_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'Git state matches' : 'Git state does not match'
    };
  }

  /**
   * 빌드 상태 확인
   */
  checkBuildState(expected) {
    const results = [];

    // Maven target 확인
    if (expected.maven_target) {
      const targetPath = path.join(this.basePath, expected.maven_target, 'target');
      const exists = fs.existsSync(targetPath);

      results.push({
        check: 'maven_target',
        passed: exists,
        expected: true,
        actual: exists,
        path: targetPath
      });

      // WAR/JAR 파일 확인
      if (exists && expected.artifact_type) {
        const artifactPattern = `*.${expected.artifact_type}`;
        const files = fs.readdirSync(targetPath).filter(f => f.endsWith(`.${expected.artifact_type}`));
        results.push({
          check: 'artifact_exists',
          passed: files.length > 0,
          expected: artifactPattern,
          actual: files.length > 0 ? files[0] : 'not found'
        });
      }
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'build_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'Build state matches' : 'Build state does not match'
    };
  }

  /**
   * 서비스 상태 확인 (포트)
   */
  checkServiceState(expected) {
    const results = [];

    for (const [serviceName, expectedState] of Object.entries(expected)) {
      if (expectedState.port) {
        try {
          execSync(`lsof -i :${expectedState.port}`, { encoding: 'utf8' });
          const isListening = true;

          results.push({
            service: serviceName,
            check: 'port',
            passed: isListening === (expectedState.running !== false),
            expected: expectedState.running !== false,
            actual: isListening,
            port: expectedState.port
          });
        } catch (error) {
          results.push({
            service: serviceName,
            check: 'port',
            passed: expectedState.running === false,
            expected: expectedState.running !== false,
            actual: false,
            port: expectedState.port
          });
        }
      }
    }

    const allPassed = results.every(r => r.passed);
    return {
      type: 'service_state',
      passed: allPassed,
      details: results,
      reason: allPassed ? 'Service state matches' : 'Service state does not match'
    };
  }

  /**
   * DB 상태 확인 (Placeholder)
   */
  checkDbState(expected) {
    // 실제 DB 연결은 프로젝트별로 구현
    return {
      type: 'db_state',
      passed: true,
      reason: 'DB state check - placeholder (implement per project)',
      expected
    };
  }

  /**
   * 크기 비교 헬퍼
   */
  compareSize(actual, expected) {
    if (typeof expected === 'number') {
      return actual === expected;
    }
    if (typeof expected === 'string') {
      if (expected.startsWith('>')) {
        return actual > parseInt(expected.slice(1), 10);
      }
      if (expected.startsWith('<')) {
        return actual < parseInt(expected.slice(1), 10);
      }
      if (expected.startsWith('>=')) {
        return actual >= parseInt(expected.slice(2), 10);
      }
      if (expected.startsWith('<=')) {
        return actual <= parseInt(expected.slice(2), 10);
      }
    }
    return false;
  }
}

module.exports = new StateGrader();
module.exports.StateGrader = StateGrader;
