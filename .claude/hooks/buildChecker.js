/**
 * Build Checker Hook (Deferred Mode v3.0 — Auto-Correction Loop)
 *
 * 코드 변경 후 빌드 필요 여부를 축적하고,
 * 일정 수 이상 Java 파일이 변경되었을 때만 빌드를 실행합니다.
 *
 * v3.0 변경:
 *   - 컴파일 에러 발견 시 구조화된 피드백을 stderr로 출력
 *   - Claude가 에러를 인식하고 자동 수정을 시도하는 "자동 교정 루프" 구현
 *   - 에러 상태를 .pending-build.json에 저장하여 추적
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execAsync = util.promisify(exec);

// 빌드 대기 파일 추적
const PENDING_BUILD_FILE = path.join(__dirname, "../state/.pending-build.json");
const BUILD_THRESHOLD = 3; // Java 파일 3개 이상 변경 시 빌드 실행

/**
 * 환경변수 기반 임계값 (운영/개발 환경별 차등화 가능)
 * - RALPH_LOOP_ATTEMPTS: 같은 에러 반복 허용 횟수 (default 3)
 * - RALPH_LOOP_SHIFTS:   에러 시그니처 변경 허용 횟수 (default 3)
 *
 * 예시:
 *   운영 (보수적):  RALPH_LOOP_ATTEMPTS=2 RALPH_LOOP_SHIFTS=2
 *   개발 (관대):    RALPH_LOOP_ATTEMPTS=5 RALPH_LOOP_SHIFTS=5
 */
function envInt(name, fallback) {
  const v = parseInt(process.env[name] || "", 10);
  return Number.isFinite(v) && v > 0 ? v : fallback;
}
const MAX_AUTO_FIX_ATTEMPTS = envInt("RALPH_LOOP_ATTEMPTS", 3);
const MAX_SIGNATURE_SHIFTS = envInt("RALPH_LOOP_SHIFTS", 3);

/**
 * 에러 배열에서 대표 시그니처 생성
 * 시그니처 = 첫 에러 메시지 첫 50자 + 첫 에러 파일 베이스명
 * 같은 코드 변경 → 같은 컴파일 에러 → 같은 시그니처
 * 땜빵 → 새 에러 발생 → 다른 시그니처 (Ralph Loop A→B→C 패턴)
 */
function computeErrorSignature(errors) {
  if (!Array.isArray(errors) || errors.length === 0) return "";
  const top = errors[0] || {};
  const msg = String(top.message || "")
    .slice(0, 50)
    .replace(/\s+/g, " ")
    .trim();
  const baseName = String(top.file || "")
    .split("/")
    .pop();
  return `${baseName}::${msg}`;
}

/**
 * 빌드 대기 목록 로드
 */
function loadPendingBuild() {
  try {
    if (fs.existsSync(PENDING_BUILD_FILE)) {
      return JSON.parse(fs.readFileSync(PENDING_BUILD_FILE, "utf8"));
    }
  } catch (_) {}
  return { files: [], lastCheck: 0 };
}

/**
 * 빌드 대기 목록 저장
 */
function savePendingBuild(state) {
  try {
    const dir = path.dirname(PENDING_BUILD_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(
      PENDING_BUILD_FILE,
      JSON.stringify(state, null, 2),
      "utf8",
    );
  } catch (_) {}
}

/**
 * 빌드 대기 목록 초기화
 */
function clearPendingBuild() {
  savePendingBuild({
    files: [],
    lastCheck: Date.now(),
    errors: [],
    autoFixAttempts: 0,
  });
}

/**
 * 자동 교정 피드백을 stderr로 출력
 * Claude Code는 PostToolUse stderr 출력을 문제로 인식하고 자동 수정을 시도함
 * @param {string} moduleName - 빌드 실패 모듈
 * @param {Array} errors - 에러 배열 [{file, line, col, message}]
 */
function emitAutoCorrectFeedback(moduleName, errors) {
  const pending = loadPendingBuild();

  // 에러 시그니처 추적 (Ralph Loop A→B→C 악순환 감지)
  const currentSig = computeErrorSignature(errors);
  if (!Array.isArray(pending.errorSignatureHistory)) {
    pending.errorSignatureHistory = [];
  }
  if (currentSig) {
    pending.errorSignatureHistory.push({
      sig: currentSig,
      ts: Date.now(),
    });
    // 최근 10개만 유지
    if (pending.errorSignatureHistory.length > 10) {
      pending.errorSignatureHistory = pending.errorSignatureHistory.slice(-10);
    }
  }

  // 시그니처 변경 횟수 계산 (인접한 시그니처가 다른 경우)
  const recent = pending.errorSignatureHistory.slice(-MAX_SIGNATURE_SHIFTS - 1);
  let shifts = 0;
  for (let i = 1; i < recent.length; i++) {
    if (recent[i].sig !== recent[i - 1].sig) shifts++;
  }

  // Ralph Loop 가드 #1: 시그니처 악순환 감지 (A→B→C)
  if (shifts >= MAX_SIGNATURE_SHIFTS) {
    process.stderr.write(
      `\n⛔ [BuildChecker] RALPH LOOP DETECTED — error signature shifted ${shifts} times in ${moduleName}.\n` +
        `Pattern: ${recent.map((r) => r.sig.split("::")[1] || "?").join(" → ")}\n` +
        `Each fix introduces a NEW error. STOP and re-design the approach.\n` +
        `Reference: .claude/rules/ralph-loop-detection.md (자동 롤백 프로토콜)\n` +
        `Reset: delete .claude/state/.pending-build.json\n\n`,
    );
    pending.autoFixAttempts = MAX_AUTO_FIX_ATTEMPTS; // 추가 자동 수정 차단
    pending.errors = errors;
    savePendingBuild(pending);
    return;
  }

  // Ralph Loop 가드 #2: 이미 한계 도달 상태면 즉시 반환 (재시작 방지)
  if ((pending.autoFixAttempts || 0) >= MAX_AUTO_FIX_ATTEMPTS) {
    process.stderr.write(
      `\n⛔ [BuildChecker] AUTO-CORRECTION STILL HALTED for ${moduleName}.\n` +
        `Run: cd KiiPS-HUB && mvn clean compile -pl :${moduleName} -am\n` +
        `Then manually clear: delete .claude/state/.pending-build.json\n\n`,
    );
    return;
  }

  const attempts = (pending.autoFixAttempts || 0) + 1;

  // Ralph Loop 방지: 한계 도달 시 카운터를 MAX에 고정 (리셋하지 않음)
  if (attempts >= MAX_AUTO_FIX_ATTEMPTS) {
    process.stderr.write(
      `\n⛔ [BuildChecker] AUTO-CORRECTION HALTED — ${attempts} attempts failed for ${moduleName}.\n` +
        `Ralph Loop detected. Manual intervention required.\n` +
        `Run: cd KiiPS-HUB && mvn clean compile -pl :${moduleName} -am\n\n`,
    );
    // 카운터를 MAX에 고정 — 0으로 리셋하지 않아 다음 편집에서도 가드에 걸림
    pending.autoFixAttempts = MAX_AUTO_FIX_ATTEMPTS;
    pending.errors = errors;
    savePendingBuild(pending);
    return;
  }

  // 에러 상태 저장 (추적용)
  pending.autoFixAttempts = attempts;
  pending.errors = errors;
  pending.lastErrorTime = Date.now();
  savePendingBuild(pending);

  // 구조화된 에러 피드백 출력 → Claude가 자동 수정 시도
  const feedback = [
    ``,
    `╔══════════════════════════════════════════════════════════════╗`,
    `║  ⚠️  BUILD FAILED — AUTO-CORRECTION REQUIRED (attempt ${attempts}/${MAX_AUTO_FIX_ATTEMPTS})  ║`,
    `╠══════════════════════════════════════════════════════════════╣`,
    `║  Module: ${moduleName.padEnd(49)}║`,
    `╚══════════════════════════════════════════════════════════════╝`,
    ``,
  ];

  errors.forEach((err, i) => {
    feedback.push(`  ${i + 1}. ${err.file}:${err.line} — ${err.message}`);
  });

  feedback.push(``);
  feedback.push(
    `ACTION REQUIRED: Fix the compilation errors above, then save the files.`,
  );
  feedback.push(`The build will re-verify automatically after the next edit.`);
  feedback.push(``);

  process.stderr.write(feedback.join("\n"));
}

/**
 * Hook entry point
 * @param {object} context - Hook 실행 컨텍스트
 */
async function onPostToolUse(context) {
  try {
    const editedFiles = context.editedFiles || [];

    if (editedFiles.length === 0) {
      return;
    }

    // Java 파일만 필터링
    const javaFiles = editedFiles.filter((f) => f.endsWith(".java"));
    if (javaFiles.length === 0) {
      return; // Java 파일이 아니면 빌드 불필요
    }

    // 빌드 대기 목록에 추가
    const pending = loadPendingBuild();
    for (const f of javaFiles) {
      if (!pending.files.includes(f)) {
        pending.files.push(f);
      }
    }
    savePendingBuild(pending);

    // 임계치 미달 시 축적만 하고 종료
    if (pending.files.length < BUILD_THRESHOLD) {
      console.log(
        `[BuildChecker] ${pending.files.length}/${BUILD_THRESHOLD} Java files changed. Build deferred.`,
      );
      return;
    }

    // 임계치 도달 → 빌드 실행
    const editedModules = getEditedModules(pending.files);

    if (editedModules.size === 0) {
      return;
    }

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("BUILD VERIFICATION (deferred)");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    console.log(`Accumulated ${pending.files.length} Java file(s)\n`);

    // 각 모듈에서 빌드 실행
    let hasErrors = false;
    for (const modulePath of editedModules) {
      await checkBuild(modulePath);
    }

    // 에러가 있으면 파일 목록만 초기화 (autoFixAttempts 유지)
    const postBuild = loadPendingBuild();
    if (postBuild.errors && postBuild.errors.length > 0) {
      postBuild.files = []; // 파일 목록만 초기화하여 다음 수정 후 재빌드 가능
      savePendingBuild(postBuild);
    } else {
      clearPendingBuild();
    }

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    console.error("[BuildChecker] Error:", error.message);
  }
}

/**
 * 수정된 파일로부터 모듈 경로 추출
 * @param {Array} files - 파일 경로 배열
 * @returns {Set} - 모듈 경로 Set
 */
function getEditedModules(files) {
  const modules = new Set();

  for (const filePath of files) {
    // Java 파일만 체크
    if (!filePath.endsWith(".java")) {
      continue;
    }

    // KiiPS 모듈 패턴 매칭
    const match = filePath.match(/(KiiPS-[A-Z]+|KIIPS-[A-Z]+)/);
    if (match) {
      const moduleName = match[1];
      // 프로젝트 루트 기준으로 모듈 경로 생성
      modules.add(moduleName);
    }
  }

  return modules;
}

/**
 * 특정 모듈에서 Maven 빌드 실행
 * @param {string} moduleName - 모듈 이름
 */
async function checkBuild(moduleName) {
  console.log(`🔨 Running build for ${moduleName}...`);

  // KiiPS 프로젝트 루트 경로 계산 (.claude/hooks에서 2단계 상위)
  const kiipsRoot = path.resolve(__dirname, "../..");
  const kiipsHub = path.join(kiipsRoot, "KiiPS-HUB");

  try {
    // Maven 멀티모듈 빌드: KiiPS-HUB에서 특정 모듈만 빌드
    const { stdout, stderr } = await execAsync(
      `mvn clean compile -pl :${moduleName} -am -DskipTests`,
      {
        cwd: kiipsHub,
        timeout: 120000, // 2분 타임아웃 (멀티모듈 빌드는 시간 소요)
        env: {
          ...process.env,
          JAVA_HOME:
            process.env.JAVA_HOME ||
            "/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home",
        },
      },
    );

    // 빌드 성공
    if (stdout.includes("BUILD SUCCESS")) {
      console.log(`✅ Build successful in ${moduleName}`);
      // 성공 시 자동 교정 카운터 리셋
      const pending = loadPendingBuild();
      if (pending.autoFixAttempts > 0) {
        console.log(
          `  ✨ Auto-correction succeeded after ${pending.autoFixAttempts} attempt(s)`,
        );
        pending.autoFixAttempts = 0;
        pending.errors = [];
        pending.errorSignatureHistory = []; // 빌드 성공 시 시그니처 히스토리 초기화
        savePendingBuild(pending);
      }
      return;
    }

    // 빌드 실패 - 구조화된 에러 추출
    const errors = extractBuildErrors(stderr + stdout);

    if (errors.length === 0) {
      console.log(`⚠️  Build completed with warnings in ${moduleName}`);
    } else {
      // v3.0: 자동 교정 루프 — stderr로 구조화된 피드백 출력
      emitAutoCorrectFeedback(moduleName, errors);
    }
  } catch (error) {
    // 빌드 명령 실패
    if (error.code === "ETIMEDOUT") {
      console.log(`⏱️  Build timeout for ${moduleName} (exceeded 120s)`);
    } else {
      // exec 에러에도 stderr에서 컴파일 에러 추출 시도
      const errorOutput = (error.stderr || "") + (error.stdout || "");
      const errors = extractBuildErrors(errorOutput);
      if (errors.length > 0) {
        emitAutoCorrectFeedback(moduleName, errors);
      } else {
        console.log(`❌ Build error for ${moduleName}: ${error.message}`);
        console.log("💡 Ensure JAVA_HOME is set and Maven is available");
      }
    }
  }
}

/**
 * Maven 출력에서 컴파일 에러 추출 (v3.0: 구조화된 에러 객체 반환)
 * @param {string} output - Maven 출력
 * @returns {Array} - 에러 객체 배열 [{file, line, col, message}]
 */
function extractBuildErrors(output) {
  const errors = [];
  const lines = output.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // [ERROR] 라인 찾기
    if (line.includes("[ERROR]") && line.includes(".java:")) {
      // 파일명과 라인 번호 추출
      const match = line.match(/\[ERROR\]\s+(.+\.java):\[(\d+),(\d+)\]\s+(.+)/);
      if (match) {
        const [, file, lineNum, col, message] = match;
        errors.push({
          file: file.trim(),
          line: parseInt(lineNum, 10),
          col: parseInt(col, 10),
          message: message.trim(),
        });
      }
    }
  }

  return errors.slice(0, 10); // 최대 10개까지만
}

// ─── CLI Entry Point (stdin JSON 파싱) ───────────────────────
if (require.main === module) {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => {
    input += chunk;
  });
  process.stdin.on("end", async () => {
    try {
      const event = JSON.parse(input);
      const filePath = (event.tool_input || {}).file_path || "";
      // PostToolUse 컨텍스트 구성
      const context = {
        editedFiles: filePath ? [filePath] : [],
      };
      await onPostToolUse(context);
      process.exit(0);
    } catch (e) {
      process.stderr.write(`[BuildChecker] Parse error: ${e.message}\n`);
      process.exit(0);
    }
  });
  setTimeout(() => {
    process.exit(0);
  }, 150000); // 빌드 타임아웃 2.5분
}

// Export for Claude Code Hook system + 합성 테스트 가능성
module.exports = {
  onPostToolUse,
  // 테스트 전용 export (Ralph Loop 시그니처 추적 + Maven 파싱 검증용)
  computeErrorSignature,
  emitAutoCorrectFeedback,
  extractBuildErrors,
  loadPendingBuild,
  savePendingBuild,
  clearPendingBuild,
  PENDING_BUILD_FILE,
  MAX_AUTO_FIX_ATTEMPTS,
  MAX_SIGNATURE_SHIFTS,
};
