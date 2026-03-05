/**
 * Log Analyzer - KiiPS 로그 분석 엔진
 *
 * 에러 패턴 매칭, 성능 메트릭 추출, 통계 집계를 수행합니다.
 */

const fs = require('fs');
const path = require('path');

class LogAnalyzer {
  constructor(configPath, patternsPath) {
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    this.patterns = JSON.parse(fs.readFileSync(patternsPath, 'utf-8'));

    // 컴파일된 정규식 캐시
    this.compiledPatterns = this.compilePatterns();
  }

  /**
   * 패턴들을 RegExp 객체로 컴파일
   */
  compilePatterns() {
    const compiled = {
      errors: {},
      performance: {},
      stackTrace: {},
      service: {},
      timestamp: {}
    };

    // 에러 패턴 컴파일
    for (const [key, pattern] of Object.entries(this.patterns.errorPatterns)) {
      compiled.errors[key] = new RegExp(pattern.pattern, pattern.flags);
    }

    // 성능 패턴 컴파일
    for (const [key, pattern] of Object.entries(this.patterns.performancePatterns)) {
      compiled.performance[key] = new RegExp(pattern.pattern, pattern.flags);
    }

    // 스택 트레이스 패턴
    for (const [key, pattern] of Object.entries(this.patterns.stackTracePatterns)) {
      compiled.stackTrace[key] = new RegExp(pattern.pattern, pattern.flags);
    }

    // 서비스 이름 패턴
    for (const [key, pattern] of Object.entries(this.patterns.servicePatterns)) {
      compiled.service[key] = new RegExp(pattern.pattern, pattern.flags);
    }

    // 타임스탬프 패턴
    for (const [key, pattern] of Object.entries(this.patterns.timestampPatterns)) {
      compiled.timestamp[key] = new RegExp(pattern.pattern, pattern.flags);
    }

    return compiled;
  }

  /**
   * 로그 라인 배열 분석
   * @param {string[]} lines - 로그 라인 배열
   * @param {string} filePath - 로그 파일 경로
   * @returns {object} 분석 결과
   */
  analyzeLines(lines, filePath) {
    const result = {
      timestamp: new Date().toISOString(),
      filePath,
      service: this.extractServiceName(filePath),
      errors: [],
      warnings: [],
      slowQueries: [],
      stats: {
        totalLines: lines.length,
        errorCount: 0,
        warningCount: 0,
        criticalCount: 0,
        slowQueryCount: 0
      },
      hasErrors: false,
      hasCritical: false
    };

    let inStackTrace = false;
    let currentStackTrace = [];
    let currentError = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // 제외 패턴 체크 (DEBUG, TRACE 등)
      if (this.shouldExclude(line)) {
        continue;
      }

      // 에러 패턴 매칭
      const errorMatch = this.matchErrorPattern(line);
      if (errorMatch) {
        if (currentError && inStackTrace) {
          // 이전 에러의 스택 트레이스 저장
          currentError.stackTrace = currentStackTrace.join('\n');
          currentStackTrace = [];
        }

        currentError = {
          line: i + 1,
          message: line.trim(),
          type: errorMatch.type,
          severity: errorMatch.severity,
          timestamp: this.extractTimestamp(line),
          stackTrace: null
        };

        if (errorMatch.severity === 'critical') {
          result.errors.push(currentError);
          result.stats.criticalCount++;
          result.hasCritical = true;
        } else if (errorMatch.severity === 'error') {
          result.errors.push(currentError);
          result.stats.errorCount++;
        } else {
          result.warnings.push(currentError);
          result.stats.warningCount++;
        }

        result.hasErrors = true;
        inStackTrace = true;
        continue;
      }

      // 스택 트레이스 수집
      if (inStackTrace) {
        if (this.isStackTraceLine(line)) {
          currentStackTrace.push(line.trim());
        } else {
          // 스택 트레이스 종료
          if (currentError) {
            currentError.stackTrace = currentStackTrace.join('\n');
          }
          inStackTrace = false;
          currentStackTrace = [];
          currentError = null;
        }
      }

      // 성능 패턴 매칭 (Slow Query)
      const perfMatch = this.matchPerformancePattern(line);
      if (perfMatch) {
        result.slowQueries.push({
          line: i + 1,
          message: line.trim(),
          type: perfMatch.type,
          value: perfMatch.value,
          threshold: perfMatch.threshold,
          timestamp: this.extractTimestamp(line)
        });
        result.stats.slowQueryCount++;
      }
    }

    // 마지막 스택 트레이스 처리
    if (currentError && inStackTrace && currentStackTrace.length > 0) {
      currentError.stackTrace = currentStackTrace.join('\n');
    }

    return result;
  }

  /**
   * 제외 패턴 체크
   */
  shouldExclude(line) {
    const excludePatterns = this.config.monitoring.excludePatterns || [];
    return excludePatterns.some(pattern => line.includes(pattern));
  }

  /**
   * 에러 패턴 매칭
   */
  matchErrorPattern(line) {
    for (const [type, regex] of Object.entries(this.compiledPatterns.errors)) {
      if (regex.test(line)) {
        const patternConfig = this.patterns.errorPatterns[type];
        return {
          type,
          severity: patternConfig.severity,
          description: patternConfig.description
        };
      }
    }
    return null;
  }

  /**
   * 성능 패턴 매칭
   */
  matchPerformancePattern(line) {
    for (const [type, regex] of Object.entries(this.compiledPatterns.performance)) {
      const match = line.match(regex);
      if (match && match[1]) {
        const value = parseInt(match[1], 10);
        const threshold = this.patterns.performancePatterns[type].threshold;

        if (value > threshold) {
          return {
            type,
            value,
            threshold,
            description: this.patterns.performancePatterns[type].description
          };
        }
      }
    }
    return null;
  }

  /**
   * 스택 트레이스 라인 체크
   */
  isStackTraceLine(line) {
    return this.compiledPatterns.stackTrace.start.test(line) ||
           this.compiledPatterns.stackTrace.causedBy.test(line);
  }

  /**
   * 서비스 이름 추출
   */
  extractServiceName(filePath) {
    const match = filePath.match(this.compiledPatterns.service.extractService);
    return match ? match[1] : 'Unknown';
  }

  /**
   * 타임스탬프 추출
   */
  extractTimestamp(line) {
    const match = line.match(this.compiledPatterns.timestamp.iso8601);
    return match ? match[0] : null;
  }

  /**
   * 다중 분석 결과 집계
   * @param {object[]} results - 분석 결과 배열
   * @returns {object} 집계된 통계
   */
  aggregateResults(results) {
    const aggregated = {
      timestamp: new Date().toISOString(),
      totalServices: new Set(results.map(r => r.service)).size,
      totalErrors: 0,
      totalWarnings: 0,
      totalCritical: 0,
      totalSlowQueries: 0,
      errorsByService: {},
      errorsByType: {},
      topErrors: [],
      criticalServices: []
    };

    // 서비스별, 타입별 집계
    for (const result of results) {
      aggregated.totalErrors += result.stats.errorCount;
      aggregated.totalWarnings += result.stats.warningCount;
      aggregated.totalCritical += result.stats.criticalCount;
      aggregated.totalSlowQueries += result.stats.slowQueryCount;

      // 서비스별 에러 수
      if (!aggregated.errorsByService[result.service]) {
        aggregated.errorsByService[result.service] = 0;
      }
      aggregated.errorsByService[result.service] += result.stats.errorCount + result.stats.criticalCount;

      // 타입별 에러 수
      for (const error of result.errors) {
        if (!aggregated.errorsByType[error.type]) {
          aggregated.errorsByType[error.type] = 0;
        }
        aggregated.errorsByType[error.type]++;
      }

      // Critical 서비스 목록
      if (result.hasCritical) {
        aggregated.criticalServices.push({
          service: result.service,
          criticalCount: result.stats.criticalCount,
          errors: result.errors.filter(e => e.severity === 'critical')
        });
      }
    }

    // Top 5 에러 타입
    aggregated.topErrors = Object.entries(aggregated.errorsByType)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }));

    return aggregated;
  }

  /**
   * 알림 필요 여부 판단
   * @param {object} analysis - 분석 결과
   * @returns {object} 알림 정보
   */
  checkAlertThresholds(analysis) {
    const thresholds = this.config.alertThresholds;
    const alerts = [];

    // Critical 에러 체크
    if (analysis.stats.criticalCount > 0) {
      alerts.push({
        level: 'critical',
        message: `Critical errors detected: ${analysis.stats.criticalCount}`,
        service: analysis.service
      });
    }

    // 에러 임계값 체크
    if (analysis.stats.errorCount > thresholds.error.critical) {
      alerts.push({
        level: 'critical',
        message: `Error count (${analysis.stats.errorCount}) exceeds critical threshold (${thresholds.error.critical})`,
        service: analysis.service
      });
    } else if (analysis.stats.errorCount > thresholds.error.warning) {
      alerts.push({
        level: 'warning',
        message: `Error count (${analysis.stats.errorCount}) exceeds warning threshold (${thresholds.error.warning})`,
        service: analysis.service
      });
    }

    // Slow Query 체크
    if (analysis.stats.slowQueryCount > 10) {
      alerts.push({
        level: 'warning',
        message: `High number of slow queries: ${analysis.stats.slowQueryCount}`,
        service: analysis.service
      });
    }

    return {
      hasAlerts: alerts.length > 0,
      alerts
    };
  }
}

module.exports = LogAnalyzer;
