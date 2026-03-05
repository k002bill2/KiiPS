#!/usr/bin/env node
/**
 * Agent Tracer Hook for KiiPS
 * PostToolUse:Task 이벤트에서 자동으로 에이전트 호출을 트레이싱합니다.
 *
 * @version 2.0.0-KiiPS
 *
 * @hook-config
 * {"event": "PostToolUse", "matcher": "Task", "command": "node .claude/hooks/agentTracer.js 2>/dev/null || true"}
 */

const fs = require('fs');
const path = require('path');

const FEEDBACK_LOOP_PATH = path.join(__dirname, '../coordination/feedback-loop.js');

const TRACE_DIR = '.temp/traces/sessions';
const AGGREGATE_FILE = '.temp/traces/aggregate-metrics.json';

// stdin에서 도구 입력 읽기
let inputData = '';
process.stdin.setEncoding('utf8');

process.stdin.on('data', (chunk) => {
  inputData += chunk;
});

process.stdin.on('end', () => {
  try {
    const input = JSON.parse(inputData);

    // Task 도구 호출이 아니면 무시
    if (input.tool_name !== 'Task') {
      process.exit(0);
    }

    // 세션 ID 생성
    const sessionId = process.env.CLAUDE_SESSION_ID || `sess_${Date.now()}`;
    const sessionDir = path.join(TRACE_DIR, sessionId);

    // 디렉토리 생성
    if (!fs.existsSync(sessionDir)) {
      fs.mkdirSync(sessionDir, { recursive: true });
    }

    const now = new Date().toISOString();
    const agentType = input.tool_input?.subagent_type || 'unknown';
    const isBackground = input.tool_input?.run_in_background || false;

    // --- agent_spawned 이벤트 기록 ---
    const spawnedEvent = {
      event: 'agent_spawned',
      timestamp: now,
      session_id: sessionId,
      project: 'KiiPS',
      data: {
        agent_type: agentType,
        description: input.tool_input?.description || '',
        model: input.tool_input?.model || 'default',
        run_in_background: isBackground
      }
    };

    const eventsFile = path.join(sessionDir, 'events.jsonl');
    fs.appendFileSync(eventsFile, JSON.stringify(spawnedEvent) + '\n');
    recordToFeedbackLoop(input, sessionId);

    // --- agent_completed 이벤트 기록 (tool_result에 output이 있는 경우) ---
    const toolResult = input.tool_result;
    const hasOutput = toolResult &&
      (toolResult.output !== undefined || toolResult.result !== undefined || toolResult.content !== undefined);

    if (hasOutput) {
      const completedEvent = {
        event: 'agent_completed',
        timestamp: now,
        session_id: sessionId,
        project: 'KiiPS',
        data: {
          agent_type: agentType,
          output_length: String(toolResult.output || toolResult.result || toolResult.content || '').length,
          has_error: toolResult.is_error || false
        }
      };
      fs.appendFileSync(eventsFile, JSON.stringify(completedEvent) + '\n');
    }

    // --- 세션 메타데이터 업데이트 ---
    const metaFile = path.join(sessionDir, 'metadata.json');
    let metadata = {
      created: now,
      agent_count: 0,
      events_count: 0
    };

    if (fs.existsSync(metaFile)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metaFile, 'utf8'));
      } catch (e) {
        // 파싱 실패시 기본값 사용
      }
    }

    metadata.agent_count = (metadata.agent_count || 0) + 1;
    metadata.events_count = (metadata.events_count || 0) + (hasOutput ? 2 : 1);
    metadata.last_updated = now;
    metadata.last_agent = agentType;

    fs.writeFileSync(metaFile, JSON.stringify(metadata, null, 2));

    // --- metrics.json 생성/업데이트 ---
    const metricsFile = path.join(sessionDir, 'metrics.json');
    let metrics = {
      session_id: sessionId,
      total_agents: 0,
      agent_types: {},
      total_events: 0,
      start_time: now,
      last_activity: now,
      duration_ms: 0,
      background_agents: 0
    };

    if (fs.existsSync(metricsFile)) {
      try {
        metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf8'));
      } catch (e) {
        // 파싱 실패시 기본값 사용
      }
    }

    metrics.total_agents = (metrics.total_agents || 0) + 1;
    metrics.total_events = (metrics.total_events || 0) + (hasOutput ? 2 : 1);
    metrics.last_activity = now;
    metrics.agent_types = metrics.agent_types || {};
    metrics.agent_types[agentType] = (metrics.agent_types[agentType] || 0) + 1;

    if (isBackground) {
      metrics.background_agents = (metrics.background_agents || 0) + 1;
    }

    // duration_ms: start_time 대비 경과 시간
    if (metrics.start_time) {
      metrics.duration_ms = new Date(now) - new Date(metrics.start_time);
    }

    fs.writeFileSync(metricsFile, JSON.stringify(metrics, null, 2));

    // --- 누적 aggregate-metrics.json 업데이트 ---
    updateAggregateMetrics(sessionId, agentType, metrics);

    process.exit(0);
  } catch (error) {
    // 에러 발생해도 프로세스는 성공으로 종료 (다른 작업 방해 안함)
    process.exit(0);
  }
});

/**
 * feedback-loop에 실행 메트릭 기록
 */
function recordToFeedbackLoop(input, sessionId) {
  try {
    if (!fs.existsSync(FEEDBACK_LOOP_PATH)) return;
    const feedbackLoop = require(FEEDBACK_LOOP_PATH);

    feedbackLoop.recordExecutionMetrics({
      executionId: sessionId,
      taskType: input.tool_input?.subagent_type || 'unknown',
      layer: 'layer6_task_prosecution',
      agentId: input.tool_input?.subagent_type || 'unknown',
      success: true, // PostToolUse에서 호출되므로 일단 성공 가정
      duration: 0, // duration은 completedAgents에서 계산
      errorCount: 0,
      conflictCount: 0,
      parallelAgents: 1
    });
  } catch (e) {
    // fail-open: feedback-loop 연동 실패해도 기본 트레이싱은 유지
  }
}

/**
 * aggregate-metrics.json 누적 통계 업데이트
 */
function updateAggregateMetrics(sessionId, agentType, sessionMetrics) {
  try {
    // .temp/traces 디렉토리 존재 확인
    const tracesDir = path.dirname(AGGREGATE_FILE);
    if (!fs.existsSync(tracesDir)) {
      fs.mkdirSync(tracesDir, { recursive: true });
    }

    let aggregate = {
      total_sessions: 0,
      total_agents_spawned: 0,
      agent_type_distribution: {},
      avg_agents_per_session: 0,
      last_updated: new Date().toISOString()
    };

    if (fs.existsSync(AGGREGATE_FILE)) {
      try {
        aggregate = JSON.parse(fs.readFileSync(AGGREGATE_FILE, 'utf8'));
      } catch (e) {
        // 파싱 실패시 기본값 사용
      }
    }

    // sessions 디렉토리에서 현재 세션 수 계산 (정확한 카운트)
    let sessionCount = aggregate.total_sessions || 0;
    try {
      const sessionsDir = TRACE_DIR;
      if (fs.existsSync(sessionsDir)) {
        const dirs = fs.readdirSync(sessionsDir).filter(name => {
          return fs.statSync(path.join(sessionsDir, name)).isDirectory();
        });
        sessionCount = dirs.length;
      }
    } catch (e) {
      // 디렉토리 읽기 실패시 기존 값 유지
    }

    // 에이전트 타입 분포 업데이트
    aggregate.agent_type_distribution = aggregate.agent_type_distribution || {};
    aggregate.agent_type_distribution[agentType] =
      (aggregate.agent_type_distribution[agentType] || 0) + 1;

    // 총 에이전트 수 업데이트
    aggregate.total_agents_spawned = (aggregate.total_agents_spawned || 0) + 1;

    // 세션 수 및 평균 업데이트
    aggregate.total_sessions = sessionCount;
    aggregate.avg_agents_per_session = sessionCount > 0
      ? Math.round((aggregate.total_agents_spawned / sessionCount) * 10) / 10
      : 0;

    aggregate.last_updated = new Date().toISOString();

    fs.writeFileSync(AGGREGATE_FILE, JSON.stringify(aggregate, null, 2));
  } catch (e) {
    // aggregate 업데이트 실패는 무시 (fail-open)
  }
}

// 타임아웃 (5초 후 종료)
setTimeout(() => {
  process.exit(0);
}, 5000);
