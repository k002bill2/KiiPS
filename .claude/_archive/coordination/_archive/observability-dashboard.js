#!/usr/bin/env node
/**
 * Agent Observability Dashboard for KiiPS
 * CLI로 에이전트 활동 메트릭과 세션 통계를 출력합니다.
 *
 * @version 1.0.0-KiiPS
 * @layer Cognitive Control (Layer 5)
 *
 * Usage:
 *   node .claude/coordination/observability-dashboard.js summary
 *   node .claude/coordination/observability-dashboard.js sessions
 *   node .claude/coordination/observability-dashboard.js agent-types
 */

const fs = require('fs');
const path = require('path');

const TRACES_DIR = path.join(process.cwd(), '.temp/traces');
const SESSIONS_DIR = path.join(TRACES_DIR, 'sessions');
const AGGREGATE_FILE = path.join(TRACES_DIR, 'aggregate-metrics.json');

// 타임아웃 (5초) - Hook 호환성을 위해 유지
const timeout = setTimeout(() => {
  process.exit(0);
}, 5000);

/**
 * JSON 파일 안전 로드 (기본값 반환)
 */
function loadJson(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
  } catch (e) {
    // 파싱 실패시 기본값 반환
  }
  return defaultValue;
}

/**
 * 세션 디렉토리 목록 로드 (최신순)
 */
function loadSessionDirs() {
  try {
    if (!fs.existsSync(SESSIONS_DIR)) {
      return [];
    }
    return fs.readdirSync(SESSIONS_DIR)
      .filter(name => fs.statSync(path.join(SESSIONS_DIR, name)).isDirectory())
      .sort()
      .reverse();
  } catch (e) {
    return [];
  }
}

/**
 * 밀리초를 사람이 읽기 좋은 문자열로 변환
 */
function formatDuration(ms) {
  if (!ms || ms <= 0) return '0s';
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

/**
 * ISO 날짜 문자열을 로컬 표시 형식으로 변환
 */
function formatDate(isoStr) {
  if (!isoStr) return 'N/A';
  try {
    const d = new Date(isoStr);
    const pad = n => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ` +
           `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  } catch (e) {
    return isoStr;
  }
}

/**
 * 구분선 출력
 */
function printLine(char = '-', len = 60) {
  console.log(char.repeat(len));
}

// ============================================================
// command: summary
// aggregate-metrics.json을 읽어 전체 요약 출력
// ============================================================
function cmdSummary() {
  const aggregate = loadJson(AGGREGATE_FILE, null);
  const sessionDirs = loadSessionDirs();

  printLine('=', 60);
  console.log('  KiiPS Agent Observability - Summary');
  printLine('=', 60);

  if (!aggregate) {
    console.log('');
    console.log('  [INFO] aggregate-metrics.json 파일이 없습니다.');
    console.log('         agentTracer hook이 실행되면 자동 생성됩니다.');
    console.log('');
    console.log(`  세션 디렉토리 수: ${sessionDirs.length}`);
    console.log('');
    printLine('=', 60);
    return;
  }

  console.log('');
  console.log(`  총 세션 수          : ${aggregate.total_sessions || 0}`);
  console.log(`  총 에이전트 호출 수  : ${aggregate.total_agents_spawned || 0}`);
  console.log(`  세션당 평균 에이전트 : ${aggregate.avg_agents_per_session || 0}`);
  console.log(`  마지막 업데이트      : ${formatDate(aggregate.last_updated)}`);
  console.log('');

  const dist = aggregate.agent_type_distribution || {};
  const distEntries = Object.entries(dist).sort((a, b) => b[1] - a[1]);

  if (distEntries.length > 0) {
    console.log('  에이전트 타입 분포 (Top 5):');
    printLine('-', 60);
    const topEntries = distEntries.slice(0, 5);
    const maxCount = topEntries[0][1];
    for (const [type, count] of topEntries) {
      const barLen = Math.round((count / maxCount) * 20);
      const bar = '#'.repeat(barLen).padEnd(20);
      const pct = aggregate.total_agents_spawned > 0
        ? Math.round((count / aggregate.total_agents_spawned) * 100)
        : 0;
      console.log(`  ${type.padEnd(20)} [${bar}] ${count} (${pct}%)`);
    }
    console.log('');
  }

  printLine('=', 60);
}

// ============================================================
// command: sessions
// 최근 10개 세션의 metadata + metrics 요약 출력
// ============================================================
function cmdSessions() {
  const sessionDirs = loadSessionDirs();

  printLine('=', 60);
  console.log('  KiiPS Agent Observability - Recent Sessions');
  printLine('=', 60);
  console.log(`  전체 세션 수: ${sessionDirs.length}`);
  console.log('');

  if (sessionDirs.length === 0) {
    console.log('  [INFO] 기록된 세션이 없습니다.');
    console.log('');
    printLine('=', 60);
    return;
  }

  const recent = sessionDirs.slice(0, 10);

  for (let i = 0; i < recent.length; i++) {
    const sessId = recent[i];
    const sessDir = path.join(SESSIONS_DIR, sessId);

    const metadata = loadJson(path.join(sessDir, 'metadata.json'), {});
    const metrics = loadJson(path.join(sessDir, 'metrics.json'), null);

    printLine('-', 60);
    console.log(`  [${i + 1}] ${sessId}`);

    if (metrics) {
      // metrics.json이 있는 경우
      const agentTypesStr = Object.entries(metrics.agent_types || {})
        .map(([t, c]) => `${t}(${c})`)
        .join(', ') || 'N/A';
      console.log(`       시작 시각  : ${formatDate(metrics.start_time)}`);
      console.log(`       마지막 활동 : ${formatDate(metrics.last_activity)}`);
      console.log(`       경과 시간   : ${formatDuration(metrics.duration_ms)}`);
      console.log(`       에이전트 수 : ${metrics.total_agents || 0} (백그라운드: ${metrics.background_agents || 0})`);
      console.log(`       이벤트 수   : ${metrics.total_events || 0}`);
      console.log(`       에이전트 타입: ${agentTypesStr}`);
    } else {
      // metrics.json 없는 경우 metadata.json으로 표시
      console.log(`       생성 시각   : ${formatDate(metadata.created)}`);
      console.log(`       마지막 갱신 : ${formatDate(metadata.last_updated)}`);
      console.log(`       에이전트 수 : ${metadata.agent_count || 0}`);
      console.log(`       이벤트 수   : ${metadata.events_count || 0}`);
      console.log(`       마지막 에이전트: ${metadata.last_agent || 'N/A'}`);
      console.log(`       [metrics.json 없음 - 구버전 세션]`);
    }
    console.log('');
  }

  if (sessionDirs.length > 10) {
    console.log(`  ... 외 ${sessionDirs.length - 10}개 세션`);
    console.log('');
  }

  printLine('=', 60);
}

// ============================================================
// command: agent-types
// 에이전트 타입별 사용 빈도 및 통계 출력
// ============================================================
function cmdAgentTypes() {
  printLine('=', 60);
  console.log('  KiiPS Agent Observability - Agent Type Distribution');
  printLine('=', 60);

  // aggregate에서 타입 분포 가져오기
  const aggregate = loadJson(AGGREGATE_FILE, null);

  // 세션별 metrics.json에서 추가 집계
  const sessionDirs = loadSessionDirs();
  const liveDistribution = {};
  let liveTotal = 0;
  let sessionsWithMetrics = 0;
  let sessionsWithoutMetrics = 0;

  for (const sessId of sessionDirs) {
    const metricsPath = path.join(SESSIONS_DIR, sessId, 'metrics.json');
    const metrics = loadJson(metricsPath, null);

    if (metrics && metrics.agent_types) {
      sessionsWithMetrics++;
      for (const [type, count] of Object.entries(metrics.agent_types)) {
        liveDistribution[type] = (liveDistribution[type] || 0) + count;
        liveTotal += count;
      }
    } else {
      sessionsWithoutMetrics++;
      // metrics.json 없는 세션은 metadata.json의 last_agent 사용
      const metaPath = path.join(SESSIONS_DIR, sessId, 'metadata.json');
      const meta = loadJson(metaPath, {});
      if (meta.last_agent) {
        liveDistribution[meta.last_agent] = (liveDistribution[meta.last_agent] || 0) + (meta.agent_count || 1);
        liveTotal += (meta.agent_count || 1);
      }
    }
  }

  console.log('');
  console.log(`  분석 세션 수   : ${sessionDirs.length}`);
  console.log(`  metrics.json   : ${sessionsWithMetrics}개 세션`);
  console.log(`  구버전(meta만) : ${sessionsWithoutMetrics}개 세션`);
  console.log(`  집계 에이전트  : ${liveTotal}개`);
  console.log('');

  const entries = Object.entries(liveDistribution).sort((a, b) => b[1] - a[1]);

  if (entries.length === 0) {
    console.log('  [INFO] 집계된 에이전트 타입 데이터가 없습니다.');
    console.log('');
    printLine('=', 60);
    return;
  }

  printLine('-', 60);
  console.log('  에이전트 타입별 사용 빈도:');
  console.log('');

  const maxCount = entries[0][1];
  for (const [type, count] of entries) {
    const barLen = Math.round((count / maxCount) * 25);
    const bar = '#'.repeat(barLen).padEnd(25);
    const pct = liveTotal > 0 ? Math.round((count / liveTotal) * 100) : 0;
    console.log(`  ${type.padEnd(22)} [${bar}] ${String(count).padStart(3)} (${String(pct).padStart(3)}%)`);
  }

  console.log('');

  // aggregate와 비교 (aggregate가 있는 경우)
  if (aggregate && aggregate.agent_type_distribution) {
    const aggDist = aggregate.agent_type_distribution;
    const aggEntries = Object.entries(aggDist).sort((a, b) => b[1] - a[1]);

    if (aggEntries.length > 0) {
      printLine('-', 60);
      console.log('  aggregate-metrics.json 기준 (Hook 누적 기록):');
      console.log('');
      const aggTotal = Object.values(aggDist).reduce((s, v) => s + v, 0);
      const aggMax = aggEntries[0][1];
      for (const [type, count] of aggEntries) {
        const barLen = Math.round((count / aggMax) * 25);
        const bar = '#'.repeat(barLen).padEnd(25);
        const pct = aggTotal > 0 ? Math.round((count / aggTotal) * 100) : 0;
        console.log(`  ${type.padEnd(22)} [${bar}] ${String(count).padStart(3)} (${String(pct).padStart(3)}%)`);
      }
      console.log('');
    }
  }

  printLine('=', 60);
}

// ============================================================
// 메인 실행
// ============================================================
const command = process.argv[2] || 'summary';

switch (command) {
  case 'summary':
    cmdSummary();
    break;
  case 'sessions':
    cmdSessions();
    break;
  case 'agent-types':
    cmdAgentTypes();
    break;
  default:
    console.log('');
    console.log('Usage: node .claude/coordination/observability-dashboard.js <command>');
    console.log('');
    console.log('Commands:');
    console.log('  summary      전체 에이전트 활동 요약');
    console.log('  sessions     최근 10개 세션 목록');
    console.log('  agent-types  에이전트 타입별 사용 빈도');
    console.log('');
    break;
}

clearTimeout(timeout);
process.exit(0);
