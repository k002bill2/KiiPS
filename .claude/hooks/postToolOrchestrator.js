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
 *   7. geminiRealtimeFeedback - Gemini 리뷰 완료 결과 실시간 주입 (v1.1)
 *
 * 성능: 6 프로세스 → 1 프로세스 (shell hooks는 child_process.execSync)
 *
 * @version 1.1.0 - Gemini 실시간 피드백 추가
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

// ─── Evidence State Path ────────────────────────────────────
const EVIDENCE_PATH = path.join(
  __dirname,
  "../gemini-bridge/.completion-evidence.json",
);

/**
 * Track verification evidence from Bash/Edit/Write tool calls.
 * Persists state to .completion-evidence.json for stopEvent.js to consume.
 */
function trackVerificationEvidence(toolName, toolInput) {
  try {
    // Load existing state (fail-open: start fresh on any read error)
    let state = {
      buildRun: false,
      scssCompileRun: false,
      mybatisCheckRun: false,
      editedFileTypes: [],
      lastEditAt: null,
      lastVerifyAt: null,
    };
    try {
      if (fs.existsSync(EVIDENCE_PATH)) {
        state = JSON.parse(fs.readFileSync(EVIDENCE_PATH, "utf8"));
        if (!Array.isArray(state.editedFileTypes)) state.editedFileTypes = [];
      }
    } catch (_) {
      // fail-open: use defaults
    }

    if (toolName === "Bash") {
      const cmd = (toolInput.command || "").toString();
      if (/mvn\s+(clean\s+)?(compile|package|test|verify)/.test(cmd)) {
        state.buildRun = true;
        state.lastVerifyAt = Date.now();
      }
      if (/sass\s|scss\s|node-sass|dart-sass/.test(cmd)) {
        state.scssCompileRun = true;
        state.lastVerifyAt = Date.now();
      }
      if (/grep.*xml|mybatis/i.test(cmd)) {
        state.mybatisCheckRun = true;
        state.lastVerifyAt = Date.now();
      }
    }

    if (toolName === "Edit" || toolName === "Write") {
      const filePath = (toolInput.file_path || "").toString();
      const ext = path.extname(filePath);
      // Only track compilable types; skip .md, .json, .sh, .js
      const TRACKED_EXTS = [".java", ".scss", ".xml"];
      if (
        ext &&
        TRACKED_EXTS.includes(ext) &&
        !state.editedFileTypes.includes(ext)
      ) {
        state.editedFileTypes.push(ext);
      }
      if (ext && TRACKED_EXTS.includes(ext)) {
        state.lastEditAt = Date.now();
      }
    }

    // Persist state
    const dir = path.dirname(EVIDENCE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(EVIDENCE_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch (_) {
    // fail-open: never interrupt the orchestration pipeline
  }
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

  // 7. Gemini 리뷰 실시간 피드백 (매 10번째 호출마다 확인)
  try {
    if (!orchestrate._callCount) orchestrate._callCount = 0;
    orchestrate._callCount++;
    if (orchestrate._callCount % 10 === 0) {
      checkGeminiReviewsRealtime();
    }
  } catch (e) {
    // 리뷰 피드백 실패는 무시
  }

  // 8. Agent State: stale 에이전트 정리 (매 50번째 호출마다)
  try {
    if (orchestrate._callCount % 50 === 0) {
      agentState.cleanupStale();
    }
  } catch (e) {
    // 상태 정리 실패는 무시
  }

  // 9. Evidence tracking (Bash|Edit|Write — 검증 증거 수집)
  try {
    trackVerificationEvidence(toolName, toolInput);
  } catch (e) {
    // 증거 수집 실패는 무시
  }
}

/**
 * Gemini 리뷰 실시간 피드백 (v1.1)
 *
 * .claude/gemini-bridge/reviews/ 에 새로 완료된 리뷰가 있으면
 * 현재 세션에 즉시 피드백을 주입합니다.
 * SessionStart가 아닌 PostToolUse 시점에서 실행되어 "실시간" 효과.
 */
function checkGeminiReviewsRealtime() {
  const reviewsDir = path.join(__dirname, "../gemini-bridge/reviews");
  const shownFile = path.join(
    __dirname,
    "../gemini-bridge/.shown-reviews.json",
  );

  if (!fs.existsSync(reviewsDir)) return;

  // 이미 표시한 리뷰 목록 로드
  let shown = [];
  try {
    if (fs.existsSync(shownFile)) {
      shown = JSON.parse(fs.readFileSync(shownFile, "utf8"));
    }
  } catch (_) {
    shown = [];
  }

  // 리뷰 파일 스캔
  const reviewFiles = fs
    .readdirSync(reviewsDir)
    .filter((f) => f.endsWith(".json") && !shown.includes(f));

  if (reviewFiles.length === 0) return;

  const newReviews = [];
  for (const f of reviewFiles) {
    try {
      const data = JSON.parse(
        fs.readFileSync(path.join(reviewsDir, f), "utf8"),
      );
      if (data.status === "completed" && data.needsAttention) {
        newReviews.push({ name: f, data });
      }
      // 완료된 리뷰는 표시 여부와 관계없이 shown에 추가 (재표시 방지)
      if (data.status === "completed") {
        shown.push(f);
      }
    } catch (_) {
      // 파싱 실패 무시
    }
  }

  // shown 목록 저장 (중복 표시 방지)
  try {
    const dir = path.dirname(shownFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(shownFile, JSON.stringify(shown, null, 2), "utf8");
  } catch (_) {}

  // 주의가 필요한 리뷰만 실시간 피드백
  if (newReviews.length === 0) return;

  const feedback = [
    ``,
    `┌─── GEMINI REVIEW FEEDBACK (realtime) ───────────────┐`,
  ];

  for (const review of newReviews) {
    const d = review.data;
    const issues = d.issues || [];
    const critical = issues.filter((x) => x.severity === "critical");
    const type = (d.scanType || "review").toUpperCase();

    feedback.push(`│ [${type}] ${review.name}`);
    feedback.push(
      `│   Issues: ${issues.length} (critical: ${critical.length})`,
    );

    // Critical 이슈 최대 3개 표시
    critical.slice(0, 3).forEach((issue) => {
      const text = (issue.text || "").substring(0, 70);
      feedback.push(`│   CRITICAL: ${text}`);
    });

    if (d.verdict) {
      feedback.push(`│   Verdict: ${d.verdict}`);
    }
  }

  feedback.push(`│`);
  feedback.push(`│ Run /gemini-handoff read for full details`);
  feedback.push(`└────────────────────────────────────────────────────┘`);
  feedback.push(``);

  // stderr로 출력하여 Claude가 인식
  process.stderr.write(feedback.join("\n"));
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
