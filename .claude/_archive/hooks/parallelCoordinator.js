/**
 * Parallel Coordinator Hook for ACE Framework
 * Layer 5 (Cognitive Control) 병렬 작업 조정 Hook
 *
 * Task 도구 호출 시 락 획득, 충돌 감지, 진행 상태 추적을 담당합니다.
 *
 * @version 3.0.1-KiiPS
 * @layer Layer 5 (Cognitive Control)
 */

const fs = require("fs");
const path = require("path");

// ACE Framework 경로
const COORDINATION_DIR = path.join(__dirname, "../coordination");
const FILE_LOCK_MANAGER = path.join(COORDINATION_DIR, "file-lock-manager.js");
const TASK_ALLOCATOR = path.join(COORDINATION_DIR, "task-allocator.js");
const CHECKPOINT_MANAGER = path.join(COORDINATION_DIR, "checkpoint-manager.js");

// 병렬 작업 상태 저장
const PARALLEL_STATE_PATH = path.join(
  __dirname,
  "../ace-framework/parallel-state.json",
);

// ACE Layer 1 윤리 원칙 파일 경로
const LAYER1_PATH = path.join(
  __dirname,
  "../ace-framework/layer1-aspirational.md",
);

/**
 * 병렬 작업 상태 구조
 */
const DEFAULT_PARALLEL_STATE = {
  activeAgents: [],
  taskQueue: [],
  activeLocks: [],
  lastUpdated: null,
  sessionId: null,
};

/**
 * ACE Layer 1 윤리 원칙 로드
 * layer1-aspirational.md에서 "2.1 절대 위반 금지 사항" + "2.2 KiiPS 특화 위험 작업 목록" 섹션 추출
 */
function loadEthicalPrinciples() {
  try {
    if (fs.existsSync(LAYER1_PATH)) {
      const content = fs.readFileSync(LAYER1_PATH, "utf8");
      // "### 2.1" 섹션부터 다음 "---" 구분자 전까지 추출
      const principlesStart = content.indexOf("### 2.1");
      const principlesEnd = content.indexOf("---", principlesStart + 1);
      if (principlesStart > 0) {
        const extracted = content.substring(
          principlesStart,
          principlesEnd > principlesStart
            ? principlesEnd
            : principlesStart + 2000,
        );
        return extracted.substring(0, 1500); // 토큰 절약
      }
    }
  } catch (e) {
    /* fail-open */
  }

  // 폴백: 핵심 원칙만
  return (
    "## ACE Layer 1 Principles\n" +
    "- 데이터 무결성: 사용자 데이터 손상/유실/노출 금지\n" +
    "- 투명성: 오류/충돌/불확실성 은폐 금지\n" +
    "- 해악 방지: 시스템 손상 가능 작업 실행 금지\n" +
    "- 경계 존중: 할당된 권한/범위 초과 금지\n" +
    "- MyBatis #{} 만 사용, ${} 금지\n" +
    "- 프로덕션 DB 직접 변경 차단\n" +
    "- .env, credentials 파일 접근 금지"
  );
}

/**
 * 병렬 상태 로드
 */
function loadParallelState() {
  try {
    if (fs.existsSync(PARALLEL_STATE_PATH)) {
      return JSON.parse(fs.readFileSync(PARALLEL_STATE_PATH, "utf8"));
    }
  } catch (error) {
    console.error("[ParallelCoordinator] Error loading state:", error.message);
  }
  return { ...DEFAULT_PARALLEL_STATE, sessionId: generateSessionId() };
}

/**
 * 병렬 상태 저장 (Atomic Write: .tmp 파일에 쓴 후 rename)
 */
function saveParallelState(state) {
  try {
    state.lastUpdated = new Date().toISOString();
    const dir = path.dirname(PARALLEL_STATE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Atomic write: .tmp 파일에 쓴 후 rename으로 교체
    const tmpPath = PARALLEL_STATE_PATH + ".tmp";
    fs.writeFileSync(tmpPath, JSON.stringify(state, null, 2), "utf8");
    fs.renameSync(tmpPath, PARALLEL_STATE_PATH);
  } catch (error) {
    console.error("[ParallelCoordinator] Error saving state:", error.message);
  }
}

/**
 * 세션 ID 생성
 */
function generateSessionId() {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Task 도구 호출 전 조정
 *
 * @param {object} event - Hook 이벤트
 * @returns {object} { decision: 'allow'|'block', modifiedInput?: object, message?: string }
 */
async function onTaskPreExecute(event) {
  const { tool_input } = event;
  const state = loadParallelState();

  const taskInfo = {
    taskId: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    subagentType: tool_input.subagent_type,
    description: tool_input.description,
    prompt: tool_input.prompt,
    startTime: Date.now(),
    status: "pending",
  };

  // 0. 에이전트 가용성 체크 (task-allocator 연동)
  try {
    if (fs.existsSync(TASK_ALLOCATOR)) {
      const taskAllocator = require(TASK_ALLOCATOR);
      const availability = taskAllocator.checkAgentAvailability();
      if (!availability.available) {
        process.stderr.write("[ACE] WARNING: " + availability.warning + "\n");
      }
    }
  } catch (e) {
    /* fail-open */
  }

  // 1. 대상 모듈 추출 (프롬프트에서)
  const targetModules = extractTargetModules(tool_input.prompt);

  // 2. 모듈별 락 획득 시도
  if (targetModules.length > 0) {
    const lockResult = await acquireModuleLocks(
      targetModules,
      taskInfo.taskId,
      tool_input.subagent_type,
    );

    if (!lockResult.success) {
      // 락 실패 시 stderr에 경고 출력 (사용자에게 보임) + exit(2)로 차단
      const msg = formatLockFailureMessage(lockResult);
      process.stderr.write(msg + "\n");
      return {
        decision: "block",
        message: msg,
      };
    }

    taskInfo.acquiredLocks = lockResult.acquiredLocks;
  }

  // 3. 충돌 감지
  const conflictCheck = detectPotentialConflicts(state, taskInfo);
  if (conflictCheck.hasConflict) {
    // 충돌 경고를 stderr로 출력 (사용자에게 표시됨)
    const warning = formatConflictWarning(conflictCheck);
    process.stderr.write(warning + "\n");
  }

  // 4. 작업 큐에 추가 (acquiredLocks 포함 - Post에서 lockId로 직접 해제)
  state.activeAgents.push({
    taskId: taskInfo.taskId,
    agentType: tool_input.subagent_type,
    description: tool_input.description,
    startTime: taskInfo.startTime,
    targetModules,
    acquiredLocks: taskInfo.acquiredLocks || [],
    status: "running",
  });

  saveParallelState(state);

  // 5. 수정된 입력 반환 (작업 ID 추가)
  const modifiedInput = {
    ...tool_input,
    prompt: injectCoordinationContext(tool_input.prompt, taskInfo),
  };

  return {
    decision: "allow",
    modifiedInput,
    taskId: taskInfo.taskId,
  };
}

/**
 * Task 도구 실행 후 정리
 *
 * @param {object} event - Hook 이벤트
 * PostToolUse 이벤트에서 tool_input.subagent_type으로 에이전트를 탐색하여
 * 저장된 lockId로 직접 락을 해제합니다.
 */
async function onTaskPostExecute(event) {
  const state = loadParallelState();
  const success = event.success !== false;

  // 에이전트 탐색 우선순위:
  // 1) tool_input.subagent_type (PostToolUse 이벤트에 포함)
  // 2) event.task_id (Claude 내부 ID, 우연히 일치하는 경우)
  // 3) 가장 오래된 활성 에이전트 (fallback)
  const agentType = event.tool_input?.subagent_type;
  let agentIndex = -1;

  if (agentType) {
    agentIndex = state.activeAgents.findIndex((a) => a.agentType === agentType);
  }
  if (agentIndex < 0 && event.task_id) {
    agentIndex = state.activeAgents.findIndex(
      (a) => a.taskId === event.task_id,
    );
  }
  if (agentIndex < 0 && state.activeAgents.length > 0) {
    agentIndex = 0; // fallback: 가장 오래된 에이전트
  }

  if (agentIndex >= 0) {
    const agent = state.activeAgents[agentIndex];
    agent.status = success ? "completed" : "failed";
    agent.endTime = Date.now();
    agent.duration = agent.endTime - agent.startTime;

    // 저장된 lockId로 직접 락 해제
    await releaseAgentLocks(agent);

    logTaskCompletion(agent.taskId, success, event.result);

    // 완료된 에이전트 이력 추가
    if (!state.completedAgents) state.completedAgents = [];
    state.completedAgents.push({
      ...agent,
      completedAt: new Date().toISOString(),
    });
    // 최근 20개만 유지
    if (state.completedAgents.length > 20) {
      state.completedAgents = state.completedAgents.slice(-20);
    }

    state.activeAgents.splice(agentIndex, 1);
  } else {
    logTaskCompletion(event.task_id || "unknown", success, event.result);
  }

  saveParallelState(state);

  if (success) {
    await considerCheckpoint(event);
  }
}

/**
 * 프롬프트에서 대상 KiiPS 모듈 추출
 */
function extractTargetModules(prompt) {
  const modulePattern = /KiiPS-([A-Z]{2,10})/gi;
  const matches = prompt.match(modulePattern) || [];
  // 접두어를 'KiiPS-'로 정규화 (toUpperCase 시 KIIPS-로 변환되는 버그 방지)
  return [
    ...new Set(matches.map((m) => "KiiPS-" + m.split("-")[1].toUpperCase())),
  ];
}

/**
 * 모듈 락 획득 시도
 */
async function acquireModuleLocks(modules, taskId, agentType) {
  const acquiredLocks = [];
  const failedLocks = [];

  try {
    // file-lock-manager 모듈 동적 로드
    if (fs.existsSync(FILE_LOCK_MANAGER)) {
      const lockManager = require(FILE_LOCK_MANAGER);

      for (const moduleName of modules) {
        const result = lockManager.acquireLock({
          agentId: agentType,
          module: moduleName,
          operation: "write",
          estimatedDuration: 60000, // 1분
          purpose: `Task ${taskId}`,
        });

        if (result.success) {
          acquiredLocks.push({
            module: moduleName,
            lockId: result.lockId,
          });
        } else {
          failedLocks.push({
            module: moduleName,
            reason: result.error,
            heldBy: result.existingLock?.agentId,
            queuePosition: result.queuePosition,
          });
        }
      }
    }
  } catch (error) {
    console.error(
      "[ParallelCoordinator] Lock acquisition error:",
      error.message,
    );
  }

  return {
    success: failedLocks.length === 0,
    acquiredLocks,
    failedLocks,
  };
}

/**
 * 에이전트 객체의 acquiredLocks를 lockId로 직접 해제
 * (purpose 문자열 매칭 방식의 불일치 문제 해소)
 */
async function releaseAgentLocks(agent) {
  if (!agent.acquiredLocks || agent.acquiredLocks.length === 0) return;
  try {
    if (fs.existsSync(FILE_LOCK_MANAGER)) {
      const lockManager = require(FILE_LOCK_MANAGER);
      for (const lock of agent.acquiredLocks) {
        lockManager.releaseLock({
          lockId: lock.lockId,
          agentId: agent.agentType,
        });
      }
    }
  } catch (error) {
    console.error("[ParallelCoordinator] Lock release error:", error.message);
  }
}

/**
 * 잠재적 충돌 감지
 */
function detectPotentialConflicts(state, newTask) {
  const conflicts = [];

  for (const activeAgent of state.activeAgents) {
    // 같은 모듈을 대상으로 하는 작업 감지
    const overlappingModules =
      newTask.targetModules?.filter((m) =>
        activeAgent.targetModules?.includes(m),
      ) || [];

    if (overlappingModules.length > 0) {
      conflicts.push({
        existingTask: activeAgent.taskId,
        existingAgent: activeAgent.agentType,
        overlappingModules,
        runningSince: Date.now() - activeAgent.startTime,
      });
    }
  }

  return {
    hasConflict: conflicts.length > 0,
    conflicts,
  };
}

/**
 * 조정 컨텍스트를 프롬프트에 주입 (ACE Layer 1 원칙 포함)
 */
function injectCoordinationContext(prompt, taskInfo) {
  // ACE 원칙 로드 및 주입
  const principles = loadEthicalPrinciples();

  const context = `
<ace-principles>
${principles}
</ace-principles>

[PARALLEL COORDINATION CONTEXT]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Task ID: ${taskInfo.taskId}
Start Time: ${new Date(taskInfo.startTime).toISOString()}
Target Modules: ${taskInfo.acquiredLocks?.map((l) => l.module).join(", ") || "None"}

**IMPORTANT**:
• 이 작업은 병렬 에이전트 중 하나입니다
• 다른 에이전트와 같은 파일을 수정하지 마세요
• 완료 시 결과를 명확히 보고하세요
• 충돌 발생 시 Primary Coordinator에게 알리세요
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;
  return context + prompt;
}

/**
 * 락 실패 메시지 포맷
 */
function formatLockFailureMessage(lockResult) {
  let message = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  message += "🔒 LOCK ACQUISITION FAILED\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (const failed of lockResult.failedLocks) {
    message += `❌ ${failed.module}\n`;
    message += `   Reason: ${failed.reason}\n`;
    if (failed.heldBy) {
      message += `   Held by: ${failed.heldBy}\n`;
    }
    if (failed.queuePosition) {
      message += `   Queue position: ${failed.queuePosition}\n`;
    }
    message += "\n";
  }

  message += "**Options:**\n";
  message += "• 다른 모듈 작업을 먼저 진행하세요\n";
  message += "• 락 보유 에이전트 완료를 기다리세요\n";
  message += "• Primary Coordinator에게 강제 해제를 요청하세요\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  return message;
}

/**
 * 충돌 경고 메시지 포맷
 */
function formatConflictWarning(conflictCheck) {
  let message = "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";
  message += "⚠️  POTENTIAL CONFLICT DETECTED\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n";

  for (const conflict of conflictCheck.conflicts) {
    message += `Overlapping modules: ${conflict.overlappingModules.join(", ")}\n`;
    message += `Active task: ${conflict.existingTask} (${conflict.existingAgent})\n`;
    message += `Running for: ${Math.round(conflict.runningSince / 1000)}s\n\n`;
  }

  message += "**Note:** Primary Coordinator will merge conflicts if needed.\n";
  message += "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n";

  return message;
}

/**
 * 작업 완료 로깅
 */
function logTaskCompletion(taskId, success, result) {
  console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(
    `${success ? "✅" : "❌"} TASK ${success ? "COMPLETED" : "FAILED"}: ${taskId}`,
  );
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

/**
 * 체크포인트 생성 고려
 */
async function considerCheckpoint(event) {
  try {
    // 성공적인 빌드 후 체크포인트 생성
    if (
      event.tool_input?.prompt?.includes("빌드") ||
      event.tool_input?.prompt?.includes("build")
    ) {
      if (fs.existsSync(CHECKPOINT_MANAGER)) {
        const cpManager = require(CHECKPOINT_MANAGER);
        cpManager.createCheckpoint({
          agentId: event.tool_input.subagent_type,
          trigger: "after_successful_build",
          description: `Auto checkpoint after task: ${event.task_id}`,
        });
      }
    }
  } catch (error) {
    console.error("[ParallelCoordinator] Checkpoint error:", error.message);
  }
}

/**
 * 병렬 작업 현황 조회
 */
function getParallelStatus() {
  const state = loadParallelState();

  return {
    sessionId: state.sessionId,
    activeAgentCount: state.activeAgents.length,
    activeAgents: state.activeAgents.map((a) => ({
      taskId: a.taskId,
      agentType: a.agentType,
      description: a.description,
      runningFor: Date.now() - a.startTime,
      targetModules: a.targetModules,
    })),
    lastUpdated: state.lastUpdated,
  };
}

/**
 * 모든 작업 강제 중단 (Primary 전용)
 */
function forceStopAllTasks(reason) {
  const state = loadParallelState();

  // 모든 락 해제
  for (const agent of state.activeAgents) {
    releaseAgentLocks(agent);
  }

  // 상태 초기화
  state.activeAgents = [];
  state.taskQueue = [];
  saveParallelState(state);

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🛑 ALL PARALLEL TASKS STOPPED");
  console.log(`Reason: ${reason}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  return { success: true, reason };
}

// Export for Claude Code Hook system
module.exports = {
  onTaskPreExecute,
  onTaskPostExecute,
  getParallelStatus,
  forceStopAllTasks,
  extractTargetModules,
  detectPotentialConflicts,
};

// Claude Code Hook CLI 진입점
if (require.main === module) {
  const hookType = process.argv[2] || "post"; // 'pre' or 'post'
  let inputData = "";

  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    inputData += chunk;
  });
  process.stdin.on("end", async () => {
    let event = {};
    try {
      event = JSON.parse(inputData);
    } catch (e) {
      /* fail-open */
    }

    try {
      if (hookType === "pre") {
        const result = await onTaskPreExecute(event);
        if (result && result.decision === "block") {
          console.error(result.message);
          process.exit(2);
        }
      } else {
        await onTaskPostExecute(event);
      }
    } catch (e) {
      console.error("[ParallelCoordinator] Hook error:", e.message);
      // fail-open: 에러가 있어도 작업을 차단하지 않음
      process.exit(0);
    }
  });
}
