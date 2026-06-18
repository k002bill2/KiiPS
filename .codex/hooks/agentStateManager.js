/**
 * Agent State Manager
 * 에이전트 실행 상태를 추적하고 경쟁 조건(race condition)을 방지합니다.
 *
 * 상태 파일: .claude/agents/agent-state.json
 * 락 파일: .claude/agents/.state.lock (atomic write 보장)
 *
 * @version 1.0.0-KiiPS
 */

const fs = require("fs");
const path = require("path");

const STATE_FILE = path.join(
  process.cwd(),
  ".claude",
  "learning",
  "agent-state.json",
);
const LOCK_FILE = path.join(
  process.cwd(),
  ".claude",
  "learning",
  ".state.lock",
);
const LOCK_TIMEOUT_MS = 5000;
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10분 이상 running이면 stale

// ─── Lock 관리 ─────────────────────────────────────────────

function acquireLock() {
  const deadline = Date.now() + LOCK_TIMEOUT_MS;
  while (Date.now() < deadline) {
    try {
      // O_EXCL: 파일이 이미 존재하면 에러 → atomic lock
      fs.writeFileSync(LOCK_FILE, String(process.pid), { flag: "wx" });
      return true;
    } catch (e) {
      if (e.code === "EEXIST") {
        // 락 파일이 너무 오래됐으면 강제 해제
        try {
          const stat = fs.statSync(LOCK_FILE);
          if (Date.now() - stat.mtimeMs > LOCK_TIMEOUT_MS) {
            fs.unlinkSync(LOCK_FILE);
            continue;
          }
        } catch (_) {}
        // 10ms 대기 후 재시도
        const waitUntil = Date.now() + 10;
        while (Date.now() < waitUntil) {}
        continue;
      }
      return false;
    }
  }
  return false;
}

function releaseLock() {
  try {
    fs.unlinkSync(LOCK_FILE);
  } catch (_) {}
}

// ─── 상태 읽기/쓰기 ───────────────────────────────────────

function readState() {
  try {
    if (!fs.existsSync(STATE_FILE)) return {};
    return JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
  } catch (_) {
    return {};
  }
}

function writeState(state) {
  const dir = path.dirname(STATE_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ─── Public API ────────────────────────────────────────────

/**
 * 에이전트 상태 조회
 * @param {string} agentId
 * @returns {{ status: string, lastRun: string|null, metadata: object }}
 */
function getAgentState(agentId) {
  const states = readState();
  return (
    states[agentId] || {
      status: "idle",
      lastRun: null,
      metadata: {},
    }
  );
}

/**
 * 에이전트 상태 업데이트 (lock 기반 atomic write)
 * @param {string} agentId
 * @param {'idle'|'running'|'completed'|'failed'} status
 * @param {object} metadata - 추가 메타데이터
 */
function setAgentState(agentId, status, metadata = {}) {
  if (!acquireLock()) {
    process.stderr.write(
      `[AgentState] Failed to acquire lock for ${agentId}\n`,
    );
    return false;
  }
  try {
    const states = readState();
    states[agentId] = {
      status,
      lastRun: new Date().toISOString(),
      ...metadata,
    };
    writeState(states);
    return true;
  } finally {
    releaseLock();
  }
}

/**
 * 모든 에이전트 상태 요약
 * @returns {{ running: string[], idle: string[], failed: string[], stale: string[] }}
 */
function getSummary() {
  const states = readState();
  const now = Date.now();
  const summary = {
    running: [],
    idle: [],
    completed: [],
    failed: [],
    stale: [],
  };

  for (const [agentId, state] of Object.entries(states)) {
    if (
      state.status === "running" &&
      state.lastRun &&
      now - new Date(state.lastRun).getTime() > STALE_THRESHOLD_MS
    ) {
      summary.stale.push(agentId);
    } else if (summary[state.status]) {
      summary[state.status].push(agentId);
    }
  }
  return summary;
}

/**
 * Stale 상태 에이전트 자동 정리
 * running 상태가 STALE_THRESHOLD_MS 이상 지속되면 failed로 변경
 */
function cleanupStale() {
  if (!acquireLock()) return 0;
  try {
    const states = readState();
    const now = Date.now();
    let cleaned = 0;

    for (const [agentId, state] of Object.entries(states)) {
      if (
        state.status === "running" &&
        state.lastRun &&
        now - new Date(state.lastRun).getTime() > STALE_THRESHOLD_MS
      ) {
        states[agentId] = {
          ...state,
          status: "failed",
          lastRun: new Date().toISOString(),
          failReason: "stale_timeout",
        };
        cleaned++;
      }
    }

    if (cleaned > 0) writeState(states);
    return cleaned;
  } finally {
    releaseLock();
  }
}

// ─── CLI Entry Point ───────────────────────────────────────

if (require.main === module) {
  const [, , command, agentId, status, ...rest] = process.argv;

  switch (command) {
    case "get":
      console.log(JSON.stringify(getAgentState(agentId || "unknown"), null, 2));
      break;
    case "set":
      if (!agentId || !status) {
        console.error("Usage: agentStateManager.js set <agentId> <status>");
        process.exit(1);
      }
      setAgentState(
        agentId,
        status,
        rest.length > 0 ? JSON.parse(rest[0]) : {},
      );
      console.log(`[AgentState] ${agentId} → ${status}`);
      break;
    case "summary":
      console.log(JSON.stringify(getSummary(), null, 2));
      break;
    case "cleanup":
      const cleaned = cleanupStale();
      console.log(`[AgentState] Cleaned ${cleaned} stale agent(s)`);
      break;
    default:
      console.error(
        "Usage: agentStateManager.js <get|set|summary|cleanup> [agentId] [status]",
      );
      process.exit(1);
  }
}

module.exports = {
  getAgentState,
  setAgentState,
  getSummary,
  cleanupStale,
};
