/**
 * PostToolUse Orchestrator Hook
 *
 * Edit/Write 시 개별 hook 5-6개를 각각 프로세스로 spawn하는 대신,
 * 단일 Node.js 프로세스에서 모든 PostToolUse 검증을 순차 실행합니다.
 *
 * 통합 대상:
 *   1. autoFormatter.js   - 코드 포맷팅 (Edit|Write)
 *   2. buildChecker.js    - Maven 빌드 검증 (Edit|Write)
 *   3. scssValidator.sh   - SCSS 다크테마 검증 (Edit|Write, .scss only)
 *   4. gemini-collector.sh - Gemini 리뷰 수집 (Edit|Write)
 *   5. observe.js          - 학습 관찰 (Bash|Edit|Write)
 *   6. outputSecretFilter.js - 비밀번호 필터링 (Bash only)
 *
 * 성능: 6 프로세스 → 1 프로세스 (shell hooks는 child_process.execSync)
 *
 * @version 1.0.0
 */

const path = require("path");
const { execSync } = require("child_process");
const fs = require("fs");

// ─── Hook 모듈 로드 ─────────────────────────────────────────
const hooksDir = __dirname;
const autoFormatter = require(path.join(hooksDir, "autoFormatter.js"));
const buildChecker = require(path.join(hooksDir, "buildChecker.js"));
const observe = require(path.join(hooksDir, "observe.js"));
const agentState = require(path.join(hooksDir, "agentStateManager.js"));

let outputSecretFilter;
try {
  outputSecretFilter = require(path.join(hooksDir, "outputSecretFilter.js"));
} catch (e) {
  // outputSecretFilter가 없어도 진행
}

// ─── Shell Hook 실행 헬퍼 ──────────────────────────────────
function runShellHook(scriptName, stdinData, timeoutMs = 5000) {
  const scriptPath = path.join(hooksDir, scriptName);
  if (!fs.existsSync(scriptPath)) return;
  try {
    const result = execSync(`bash "${scriptPath}"`, {
      input: JSON.stringify(stdinData),
      timeout: timeoutMs,
      encoding: "utf8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    if (result && result.trim()) {
      process.stdout.write(result);
    }
  } catch (e) {
    // Shell hook 실패해도 전체 파이프라인 중단하지 않음
    process.stderr.write(`[Orchestrator] ${scriptName} error: ${e.message}\n`);
  }
}

// ─── 메인 오케스트레이션 ────────────────────────────────────
async function orchestrate(event) {
  const toolName = event.tool_name || event.tool || "";
  const toolInput = event.tool_input || {};
  const filePath = toolInput.file_path || "";
  const isEditWrite = ["Edit", "Write"].includes(toolName);
  const isBash = toolName === "Bash";
  const isScss = filePath.endsWith(".scss");

  // 1. AutoFormatter (Edit|Write only)
  if (isEditWrite) {
    try {
      const hookEvent = {
        tool: toolName,
        parameters: toolInput,
      };
      await autoFormatter.onPostToolUse(hookEvent);
    } catch (e) {
      process.stderr.write(`[Orchestrator] autoFormatter: ${e.message}\n`);
    }
  }

  // 2. BuildChecker (Edit|Write only, .java/.xml files)
  if (isEditWrite) {
    try {
      const context = { editedFiles: filePath ? [filePath] : [] };
      await buildChecker.onPostToolUse(context);
    } catch (e) {
      process.stderr.write(`[Orchestrator] buildChecker: ${e.message}\n`);
    }
  }

  // 3. SCSS Validator (Edit|Write only, .scss files)
  if (isEditWrite && isScss) {
    runShellHook("scssValidator.sh", event);
  }

  // 4. Gemini Collector (Edit|Write only)
  if (isEditWrite) {
    runShellHook("gemini-collector.sh", event);
  }

  // 5. OutputSecretFilter (Bash only)
  if (isBash && outputSecretFilter && outputSecretFilter.filterSecrets) {
    try {
      outputSecretFilter.filterSecrets(event);
    } catch (e) {
      process.stderr.write(`[Orchestrator] outputSecretFilter: ${e.message}\n`);
    }
  }

  // 6. Observe (항상 — 모든 도구)
  try {
    observe.processEvent(event);
  } catch (e) {
    process.stderr.write(`[Orchestrator] observe: ${e.message}\n`);
  }

  // 7. Agent State: stale 에이전트 정리 (매 50번째 호출마다)
  try {
    if (!orchestrate._callCount) orchestrate._callCount = 0;
    orchestrate._callCount++;
    if (orchestrate._callCount % 50 === 0) {
      agentState.cleanupStale();
    }
  } catch (e) {
    // 상태 정리 실패는 무시
  }
}

// ─── CLI Entry Point ────────────────────────────────────────
if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", async () => {
    try {
      const event = JSON.parse(input);
      await orchestrate(event);
      process.exit(0);
    } catch (e) {
      process.stderr.write(`[Orchestrator] Parse error: ${e.message}\n`);
      process.exit(0);
    }
  });
  // 전체 타임아웃 (빌드 포함 시 최대 3분)
  setTimeout(() => {
    process.exit(0);
  }, 180000);
}

module.exports = { orchestrate };
