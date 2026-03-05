#!/usr/bin/env node
/**
 * Log Watcher Daemon - KiiPS 로그 실시간 모니터링
 *
 * Node.js 내장 fs.watch를 사용하여 로그 파일 변경을 감지하고 분석합니다.
 * 외부 의존성 없이 동작합니다.
 *
 * Usage:
 *   node log-watcher-daemon.js [--config=path/to/config.json]
 */

const fs = require('fs');
const path = require('path');
const { EventEmitter } = require('events');

// 로컬 모듈 import
const LogAnalyzer = require('./log-analyzer.js');
const DevDocsUpdater = require('./dev-docs-updater.js');

class LogWatcherDaemon extends EventEmitter {
  constructor(configPath, patternsPath) {
    super();

    // 설정 로드
    this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
    this.configPath = configPath;

    // 분석 엔진 초기화
    this.analyzer = new LogAnalyzer(configPath, patternsPath);

    // Dev Docs Updater 초기화
    this.devDocsUpdater = this.config.devDocs.enabled
      ? new DevDocsUpdater(this.config)
      : null;

    // 감시 상태
    this.watchers = new Map();
    this.filePositions = new Map();
    this.debounceTimers = new Map();

    // 통계
    this.stats = {
      startTime: new Date(),
      filesWatched: 0,
      totalAnalyses: 0,
      totalErrors: 0,
      lastUpdate: null
    };

    // 프로세스 종료 핸들러
    process.on('SIGINT', () => this.shutdown());
    process.on('SIGTERM', () => this.shutdown());
  }

  /**
   * Daemon 시작
   */
  async start() {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🚀 KiiPS Log Watcher Daemon Starting...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('');
    console.log(`📁 Working directory: ${process.cwd()}`);
    console.log(`⚙️  Config: ${this.configPath}`);
    console.log(`📊 Dev Docs: ${this.config.devDocs.enabled ? 'Enabled' : 'Disabled'}`);
    console.log('');

    try {
      // 로그 파일 패턴 확장
      const logFiles = this.expandWatchPaths();

      if (logFiles.length === 0) {
        console.warn('⚠️  No log files found. Waiting for files to be created...');
      } else {
        console.log(`📂 Found ${logFiles.length} log file(s):`);
        logFiles.forEach(file => console.log(`   - ${file}`));
        console.log('');
      }

      // 각 파일 감시 시작
      for (const filePath of logFiles) {
        await this.watchFile(filePath);
      }

      // 디렉토리 감시 (새 로그 파일 생성 감지)
      this.watchDirectories();

      console.log('✅ Daemon started successfully');
      console.log('');
      console.log('📡 Monitoring log files... (Press Ctrl+C to stop)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');

      // 상태 출력 타이머 (30초마다)
      setInterval(() => this.printStatus(), 30000);

    } catch (error) {
      console.error('❌ Failed to start daemon:', error.message);
      process.exit(1);
    }
  }

  /**
   * Watch 경로 확장 (glob-like pattern → 실제 파일 목록)
   */
  expandWatchPaths() {
    const files = [];

    for (const pattern of this.config.watchPaths) {
      // 간단한 glob 처리: KiiPS-*/logs/log.*.log
      const parts = pattern.split('*');

      if (parts.length === 1) {
        // * 없음 - 직접 경로
        if (fs.existsSync(pattern)) {
          files.push(pattern);
        }
      } else {
        // * 포함 - 패턴 매칭
        const expandedFiles = this.expandPattern(pattern);
        files.push(...expandedFiles);
      }
    }

    return files;
  }

  /**
   * 패턴 확장 (간단한 glob 구현)
   */
  expandPattern(pattern) {
    const files = [];

    // KiiPS-*/logs/log.*.log 형태 처리
    const match = pattern.match(/^([^*]+)\*([^*]+)\*(.*)$/);

    if (!match) {
      return files;
    }

    const [, prefix, middle, suffix] = match;

    try {
      // prefix 디렉토리의 항목들 탐색
      const baseDir = path.dirname(prefix);
      const entries = fs.readdirSync(baseDir);

      for (const entry of entries) {
        const dirPath = path.join(baseDir, entry);

        if (!fs.statSync(dirPath).isDirectory()) {
          continue;
        }

        // middle 부분 확인 (logs/)
        const middlePath = path.join(dirPath, middle);

        if (!fs.existsSync(middlePath)) {
          continue;
        }

        // suffix 부분 확인 (log.*.log)
        const logFiles = fs.readdirSync(middlePath);

        for (const logFile of logFiles) {
          if (this.matchesSuffix(logFile, suffix)) {
            files.push(path.join(middlePath, logFile));
          }
        }
      }
    } catch (error) {
      console.warn(`⚠️  Pattern expansion failed for ${pattern}:`, error.message);
    }

    return files;
  }

  /**
   * Suffix 패턴 매칭
   */
  matchesSuffix(filename, pattern) {
    // log.*.log → log.2025-12-31-0.log
    const regex = pattern.replace(/\*/g, '.*');
    return new RegExp(`^${regex}$`).test(filename);
  }

  /**
   * 파일 감시 시작
   */
  async watchFile(filePath) {
    if (this.watchers.has(filePath)) {
      return; // 이미 감시 중
    }

    try {
      // 파일 크기 체크
      const stats = fs.statSync(filePath);

      if (stats.size > this.config.monitoring.maxFileSize) {
        console.warn(`⚠️  File too large (${stats.size} bytes): ${filePath}`);
        return;
      }

      // 현재 파일 끝 위치 저장
      this.filePositions.set(filePath, stats.size);

      // fs.watch로 파일 감시
      const watcher = fs.watch(filePath, (eventType) => {
        if (eventType === 'change') {
          this.handleFileChange(filePath);
        }
      });

      this.watchers.set(filePath, watcher);
      this.stats.filesWatched++;

      console.log(`👁️  Watching: ${filePath}`);

    } catch (error) {
      console.warn(`⚠️  Cannot watch file ${filePath}:`, error.message);
    }
  }

  /**
   * 디렉토리 감시 (새 로그 파일 생성 감지)
   */
  watchDirectories() {
    const directories = new Set();

    // Watch 경로에서 디렉토리 추출
    for (const pattern of this.config.watchPaths) {
      const dir = path.dirname(pattern.replace(/\*/g, ''));
      directories.add(dir);
    }

    for (const dir of directories) {
      if (fs.existsSync(dir)) {
        fs.watch(dir, (eventType, filename) => {
          if (eventType === 'rename' && filename) {
            const filePath = path.join(dir, filename);

            // 새 로그 파일 감지
            if (fs.existsSync(filePath) && filePath.includes('log.')) {
              console.log(`📂 New file detected: ${filePath}`);
              this.watchFile(filePath);
            }
          }
        });
      }
    }
  }

  /**
   * 파일 변경 처리 (debounced)
   */
  handleFileChange(filePath) {
    // Debounce: 500ms 내 중복 이벤트 무시
    const timerId = this.debounceTimers.get(filePath);

    if (timerId) {
      clearTimeout(timerId);
    }

    const newTimerId = setTimeout(async () => {
      await this.analyzeFileChanges(filePath);
      this.debounceTimers.delete(filePath);
    }, this.config.debounceDelay);

    this.debounceTimers.set(filePath, newTimerId);
  }

  /**
   * 파일 변경 분석
   */
  async analyzeFileChanges(filePath) {
    try {
      const stats = fs.statSync(filePath);
      const currentPos = this.filePositions.get(filePath) || 0;

      if (stats.size <= currentPos) {
        // 파일 크기가 줄었거나 같음 (로그 로테이션?)
        this.filePositions.set(filePath, stats.size);
        return;
      }

      // 새로 추가된 라인만 읽기
      const newLines = await this.readNewLines(filePath, currentPos);

      if (newLines.length === 0) {
        return;
      }

      // 로그 분석
      const analysis = this.analyzer.analyzeLines(newLines, filePath);

      this.stats.totalAnalyses++;
      this.stats.totalErrors += analysis.stats.errorCount + analysis.stats.criticalCount;
      this.stats.lastUpdate = new Date();

      // 콘솔 출력
      this.printAnalysisResult(analysis);

      // Dev Docs 업데이트
      if (this.devDocsUpdater && analysis.hasErrors) {
        await this.devDocsUpdater.updateFromSingleAnalysis(analysis);
      }

      // 알림 체크
      const alerts = this.analyzer.checkAlertThresholds(analysis);

      if (alerts.hasAlerts) {
        this.printAlerts(alerts);
      }

      // 파일 위치 업데이트
      this.filePositions.set(filePath, stats.size);

    } catch (error) {
      console.error(`❌ Error analyzing ${filePath}:`, error.message);
    }
  }

  /**
   * 새 라인 읽기 (position부터)
   */
  async readNewLines(filePath, startPos) {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(filePath, {
        start: startPos,
        encoding: 'utf-8'
      });

      let buffer = '';
      const lines = [];

      stream.on('data', chunk => {
        buffer += chunk;
        const parts = buffer.split('\n');

        // 마지막 부분은 불완전할 수 있으므로 buffer에 보관
        buffer = parts.pop();
        lines.push(...parts);
      });

      stream.on('end', () => {
        if (buffer) {
          lines.push(buffer);
        }

        // 최대 버퍼 크기 제한
        const maxLines = this.config.monitoring.maxBufferSize;

        resolve(lines.slice(-maxLines));
      });

      stream.on('error', reject);
    });
  }

  /**
   * 분석 결과 출력
   */
  printAnalysisResult(analysis) {
    if (!analysis.hasErrors && analysis.stats.slowQueryCount === 0) {
      return; // 정상 - 출력 안함
    }

    console.log('');
    console.log(`⚡ Analysis: ${analysis.service}`);

    if (analysis.hasCritical) {
      console.log(`🔴 Critical: ${analysis.stats.criticalCount}`);
    }

    if (analysis.stats.errorCount > 0) {
      console.log(`🟡 Errors: ${analysis.stats.errorCount}`);
    }

    if (analysis.stats.warningCount > 0) {
      console.log(`🟠 Warnings: ${analysis.stats.warningCount}`);
    }

    if (analysis.stats.slowQueryCount > 0) {
      console.log(`🐢 Slow Queries: ${analysis.stats.slowQueryCount}`);
    }

    // Top 3 에러 출력
    if (analysis.errors.length > 0) {
      console.log('');
      console.log('Top Errors:');

      analysis.errors.slice(0, 3).forEach((error, idx) => {
        console.log(`  ${idx + 1}. [${error.type}] ${error.message.slice(0, 80)}...`);
      });
    }

    console.log('');
  }

  /**
   * 알림 출력
   */
  printAlerts(alertInfo) {
    console.log('');
    console.log('🚨 ━━━ ALERTS ━━━');

    for (const alert of alertInfo.alerts) {
      const icon = alert.level === 'critical' ? '🔴' : '🟡';
      console.log(`${icon} [${alert.level.toUpperCase()}] ${alert.message}`);
    }

    console.log('━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  /**
   * 상태 출력
   */
  printStatus() {
    const uptime = Math.floor((new Date() - this.stats.startTime) / 1000);
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = uptime % 60;

    console.log('');
    console.log('📊 ━━━ STATUS ━━━');
    console.log(`Uptime: ${hours}h ${minutes}m ${seconds}s`);
    console.log(`Files Watched: ${this.stats.filesWatched}`);
    console.log(`Total Analyses: ${this.stats.totalAnalyses}`);
    console.log(`Total Errors: ${this.stats.totalErrors}`);

    if (this.stats.lastUpdate) {
      console.log(`Last Update: ${this.stats.lastUpdate.toLocaleString()}`);
    }

    console.log('━━━━━━━━━━━━━━━━━');
    console.log('');
  }

  /**
   * Daemon 종료
   */
  shutdown() {
    console.log('');
    console.log('🛑 Shutting down...');

    // 모든 watcher 종료
    for (const [filePath, watcher] of this.watchers.entries()) {
      watcher.close();
      console.log(`   Stopped watching: ${filePath}`);
    }

    this.printStatus();

    console.log('✅ Daemon stopped');
    process.exit(0);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Main Entry Point
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if (require.main === module) {
  const scriptDir = __dirname;

  // 명령줄 인자 파싱
  const args = process.argv.slice(2);
  const configArg = args.find(arg => arg.startsWith('--config='));

  const configPath = configArg
    ? configArg.split('=')[1]
    : path.join(scriptDir, 'config.json');

  const patternsPath = path.join(scriptDir, 'patterns.json');

  // Daemon 시작
  const daemon = new LogWatcherDaemon(configPath, patternsPath);
  daemon.start().catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  });
}

module.exports = LogWatcherDaemon;
