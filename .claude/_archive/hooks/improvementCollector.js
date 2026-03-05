#!/usr/bin/env node
/**
 * Improvement Collector Hook for KiiPS
 * Stop 이벤트에서 실행되어 세션 결과를 수집하고 실패/성공 패턴을 저장합니다.
 *
 * @version 1.0.0-KiiPS
 * @layer Layer 6 (Task Prosecution) - Self-Improvement Loop
 *
 * @hook-config
 * {"event": "Stop", "command": "node .claude/hooks/improvementCollector.js 2>/dev/null || true"}
 *
 * Detected Patterns:
 *   - agent_spawned 후 에러 발생 (agent spawn failure)
 *   - 동일 파일 3회 이상 수정 (repeated file edits)
 *   - Task tool 호출 후 결과 없이 종료 (incomplete task delegation)
 *
 * Pattern Frequency Threshold: 5 → stderr 경고 출력
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 경로 상수 ──────────────────────────────────────────────────────────────
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');
const TRACE_DIR = path.join(WORKSPACE_ROOT, '.temp/traces/sessions');
const IMPROVEMENT_ROOT = path.join(WORKSPACE_ROOT, '.temp/improvement/patterns');
const FAILURES_DIR = path.join(IMPROVEMENT_ROOT, 'failures');
const SUCCESSES_DIR = path.join(IMPROVEMENT_ROOT, 'successes');

// ─── 설정 ───────────────────────────────────────────────────────────────────
const CONFIG = {
  timeout: 5000,              // Hook 최대 실행 시간 (ms)
  frequencyWarningThreshold: 5, // 이 빈도 이상이면 stderr 경고
  maxPatternsPerFile: 1000,   // 패턴 파일 최대 수 (디렉토리 보호)
};

// ─── 유틸리티 ───────────────────────────────────────────────────────────────

/**
 * 디렉토리 생성 (없으면)
 */
function ensureDirs() {
  [FAILURES_DIR, SUCCESSES_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * JSONL 파일을 읽어 파싱된 이벤트 배열 반환
 * @param {string} filePath
 * @returns {Array<Object>}
 */
function readJsonl(filePath) {
  try {
    if (!fs.existsSync(filePath)) return [];
    return fs.readFileSync(filePath, 'utf8')
      .split('\n')
      .filter(line => line.trim())
      .map(line => {
        try { return JSON.parse(line); } catch (e) { return null; }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * 가장 최근 세션 디렉토리 경로 반환
 * @returns {string|null}
 */
function getLatestSessionDir() {
  try {
    if (!fs.existsSync(TRACE_DIR)) return null;
    const sessions = fs.readdirSync(TRACE_DIR)
      .filter(name => fs.statSync(path.join(TRACE_DIR, name)).isDirectory())
      .sort(); // sess_<timestamp> 형식이므로 문자열 정렬 = 시간 순
    if (sessions.length === 0) return null;
    return path.join(TRACE_DIR, sessions[sessions.length - 1]);
  } catch (e) {
    return null;
  }
}

/**
 * 현재 세션 ID를 환경변수 또는 최신 디렉토리명에서 추출
 * @returns {string}
 */
function resolveSessionId() {
  if (process.env.CLAUDE_SESSION_ID) return process.env.CLAUDE_SESSION_ID;
  const latestDir = getLatestSessionDir();
  if (latestDir) return path.basename(latestDir);
  return `sess_${Date.now()}`;
}

/**
 * 패턴 파일 저장
 * @param {string} dir - FAILURES_DIR or SUCCESSES_DIR
 * @param {Object} pattern
 */
function savePattern(dir, pattern) {
  const fileName = `pat_${pattern.pattern_id.replace('pat_', '')}.json`;
  const filePath = path.join(dir, fileName);
  fs.writeFileSync(filePath, JSON.stringify(pattern, null, 2), 'utf8');
}

/**
 * 특정 패턴 유형의 누적 빈도 계산
 * 동일 description의 기존 패턴 수를 카운트합니다.
 * @param {string} dir
 * @param {string} description
 * @returns {number}
 */
function countExistingPatterns(dir, description) {
  try {
    if (!fs.existsSync(dir)) return 0;
    const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
    let count = 0;
    for (const file of files) {
      try {
        const data = JSON.parse(fs.readFileSync(path.join(dir, file), 'utf8'));
        if (data.description === description) count++;
      } catch (e) { /* 파싱 실패 무시 */ }
    }
    return count;
  } catch (e) {
    return 0;
  }
}

// ─── 패턴 감지 로직 ─────────────────────────────────────────────────────────

/**
 * 패턴 1: agent_spawned 이벤트 이후 에러 발생
 *
 * events.jsonl에서 agent_spawned 직후(같은 session) 에러 이벤트가 있는지 검사합니다.
 * agentTracer.js는 현재 agent_spawned만 기록하므로, 동일 세션에서
 * error 필드가 있는 이벤트를 에러로 간주합니다.
 *
 * @param {Array<Object>} events
 * @returns {Object|null} 감지된 패턴 또는 null
 */
function detectAgentSpawnError(events) {
  const agentSpawnedIndices = events
    .map((e, i) => e.event === 'agent_spawned' ? i : -1)
    .filter(i => i !== -1);

  if (agentSpawnedIndices.length === 0) return null;

  // agent_spawned 이후 이벤트 중 error 필드가 있는 것 탐색
  for (const spawnIdx of agentSpawnedIndices) {
    const subsequentEvents = events.slice(spawnIdx + 1);
    const errorEvent = subsequentEvents.find(e =>
      e.error || e.event === 'error' || (e.data && e.data.error)
    );
    if (errorEvent) {
      const agentType = events[spawnIdx].data?.agent_type || 'unknown';
      return {
        type: 'failure',
        description: `Agent spawn followed by error (agent_type: ${agentType})`,
        detail: {
          agent_type: agentType,
          error: errorEvent.error || errorEvent.data?.error || 'unknown error',
          spawn_timestamp: events[spawnIdx].timestamp,
          error_timestamp: errorEvent.timestamp,
        }
      };
    }
  }
  return null;
}

/**
 * 패턴 2: 동일 파일 3회 이상 수정 (반복 수정 = 비효율)
 *
 * PostToolUse:Write/Edit 이벤트에서 file_path를 집계합니다.
 * agentTracer.js가 현재 agent_spawned만 기록하므로,
 * 해당 정보가 없으면 null을 반환합니다(graceful skip).
 *
 * @param {Array<Object>} events
 * @returns {Object|null}
 */
function detectRepeatedFileEdits(events) {
  // write/edit 관련 이벤트 필터
  const editEvents = events.filter(e =>
    e.event === 'tool_use' &&
    (e.data?.tool_name === 'Write' || e.data?.tool_name === 'Edit') &&
    e.data?.file_path
  );

  if (editEvents.length === 0) return null;

  // 파일별 수정 횟수 집계
  const fileCounts = {};
  for (const e of editEvents) {
    const fp = e.data.file_path;
    fileCounts[fp] = (fileCounts[fp] || 0) + 1;
  }

  // 3회 이상 수정된 파일 목록
  const repeatedFiles = Object.entries(fileCounts)
    .filter(([, count]) => count >= 3)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count);

  if (repeatedFiles.length === 0) return null;

  return {
    type: 'failure',
    description: 'Repeated file modifications (3+ times)',
    detail: {
      repeated_files: repeatedFiles,
      total_edit_events: editEvents.length,
    }
  };
}

/**
 * 패턴 3: Task tool 호출 후 결과 없이 종료
 *
 * agent_spawned 이벤트가 있고, task_completed 또는 agent_result 이벤트가
 * 없는 경우를 "결과 없이 종료"로 판단합니다.
 *
 * @param {Array<Object>} events
 * @returns {Object|null}
 */
function detectIncompleteTaskDelegation(events) {
  const spawnedAgents = events.filter(e => e.event === 'agent_spawned');
  if (spawnedAgents.length === 0) return null;

  const completedEvents = events.filter(e =>
    e.event === 'task_completed' ||
    e.event === 'agent_result' ||
    e.event === 'agent_finished'
  );

  // 스폰된 에이전트 수가 완료 이벤트 수보다 많으면 불완전
  if (spawnedAgents.length > completedEvents.length) {
    const incompleteCount = spawnedAgents.length - completedEvents.length;
    const incompleteAgents = spawnedAgents
      .slice(0, incompleteCount)
      .map(e => e.data?.agent_type || 'unknown');

    return {
      type: 'failure',
      description: `Task tool called but result missing (${incompleteCount} incomplete)`,
      detail: {
        spawned_count: spawnedAgents.length,
        completed_count: completedEvents.length,
        incomplete_count: incompleteCount,
        incomplete_agents: incompleteAgents,
      }
    };
  }
  return null;
}

/**
 * 세션 성공 패턴 감지
 * 에러 없이 agent_spawned + task_completed 쌍이 성립된 경우
 *
 * @param {Array<Object>} events
 * @returns {Object|null}
 */
function detectSuccessPattern(events) {
  const spawnedAgents = events.filter(e => e.event === 'agent_spawned');
  if (spawnedAgents.length === 0) return null;

  const completedEvents = events.filter(e =>
    e.event === 'task_completed' ||
    e.event === 'agent_result' ||
    e.event === 'agent_finished'
  );

  const hasError = events.some(e => e.error || e.event === 'error');

  if (!hasError && completedEvents.length >= spawnedAgents.length && spawnedAgents.length > 0) {
    return {
      type: 'success',
      description: `All ${spawnedAgents.length} agent(s) completed successfully`,
      detail: {
        spawned_count: spawnedAgents.length,
        completed_count: completedEvents.length,
        agent_types: spawnedAgents.map(e => e.data?.agent_type || 'unknown'),
      }
    };
  }
  return null;
}

// ─── 메인 수집 로직 ──────────────────────────────────────────────────────────

/**
 * 세션 데이터를 분석하여 패턴을 수집하고 저장합니다.
 * @param {string} sessionId
 */
function collectPatterns(sessionId) {
  // 세션 디렉토리 결정
  const sessionDir = fs.existsSync(path.join(TRACE_DIR, sessionId))
    ? path.join(TRACE_DIR, sessionId)
    : getLatestSessionDir();

  if (!sessionDir) return; // 세션 데이터 없으면 조용히 종료

  const eventsFile = path.join(sessionDir, 'events.jsonl');
  const events = readJsonl(eventsFile);

  if (events.length === 0) return;

  ensureDirs();

  const timestamp = new Date().toISOString();
  const detectedPatterns = [];

  // 실패 패턴 감지
  const failureDetectors = [
    detectAgentSpawnError,
    detectRepeatedFileEdits,
    detectIncompleteTaskDelegation,
  ];

  for (const detector of failureDetectors) {
    try {
      const result = detector(events);
      if (result) detectedPatterns.push(result);
    } catch (e) {
      // 개별 감지 실패는 무시 (fail-open)
    }
  }

  // 성공 패턴 감지
  try {
    const successResult = detectSuccessPattern(events);
    if (successResult) detectedPatterns.push(successResult);
  } catch (e) { /* 무시 */ }

  // 패턴 저장
  for (const detected of detectedPatterns) {
    const patternId = `pat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const targetDir = detected.type === 'failure' ? FAILURES_DIR : SUCCESSES_DIR;

    // 기존 동일 description 패턴의 빈도 계산
    const existingFrequency = countExistingPatterns(targetDir, detected.description);
    const newFrequency = existingFrequency + 1;

    const pattern = {
      pattern_id: patternId,
      type: detected.type,
      frequency: newFrequency,
      session_id: sessionId,
      description: detected.description,
      detail: detected.detail || {},
      detected_at: timestamp,
    };

    savePattern(targetDir, pattern);

    // 빈도 임계값 초과 시 stderr 경고
    if (newFrequency >= CONFIG.frequencyWarningThreshold) {
      process.stderr.write(
        `[ImprovementCollector] WARNING: Pattern frequency >= ${CONFIG.frequencyWarningThreshold}\n` +
        `  Pattern: "${detected.description}"\n` +
        `  Frequency: ${newFrequency}\n` +
        `  Run analyzer: node .claude/coordination/improvement-analyzer.js propose\n`
      );
    }
  }
}

// ─── 진입점 (stdin Hook 표준 패턴) ──────────────────────────────────────────

(async () => {
  // 타임아웃 보호 (5초)
  const timeoutHandle = setTimeout(() => {
    process.exit(0);
  }, CONFIG.timeout);
  timeoutHandle.unref(); // 메인 로직 완료 시 타임아웃 취소되도록

  try {
    // stdin에서 Stop 이벤트 JSON 읽기
    let stdinData = '';
    if (!process.stdin.isTTY) {
      stdinData = await new Promise(resolve => {
        let buf = '';
        process.stdin.setEncoding('utf8');
        process.stdin.on('data', chunk => { buf += chunk; });
        process.stdin.on('end', () => resolve(buf));
        // stdin이 닫히지 않는 경우 대비 내부 타임아웃
        setTimeout(() => resolve(buf), CONFIG.timeout - 500);
      });
    }

    // Stop 이벤트 파싱 (실패해도 계속 진행)
    let stopEvent = {};
    if (stdinData.trim()) {
      try { stopEvent = JSON.parse(stdinData); } catch (e) { /* 무시 */ }
    }

    // session_id 결정
    const sessionId = stopEvent.session_id
      || process.env.CLAUDE_SESSION_ID
      || resolveSessionId();

    collectPatterns(sessionId);

  } catch (e) {
    // 최상위 에러 - 조용히 종료 (Hook 실패가 Claude를 막으면 안 됨)
  } finally {
    clearTimeout(timeoutHandle);
    process.exit(0);
  }
})();
