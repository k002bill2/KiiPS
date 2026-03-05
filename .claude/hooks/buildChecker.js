/**
 * Build Checker Hook (Deferred Mode v2.0)
 *
 * 코드 변경 후 빌드 필요 여부를 축적하고,
 * 일정 수 이상 Java 파일이 변경되었을 때만 빌드를 실행합니다.
 *
 * 변경: 매 Edit/Write마다 Maven 컴파일 실행 → 축적 후 조건부 실행
 */

const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const util = require("util");

const execAsync = util.promisify(exec);

// 빌드 대기 파일 추적
const PENDING_BUILD_FILE = path.join(
  __dirname,
  "../gemini-bridge/.pending-build.json",
);
const BUILD_THRESHOLD = 3; // Java 파일 3개 이상 변경 시 빌드 실행

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
  savePendingBuild({ files: [], lastCheck: Date.now() });
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
    for (const modulePath of editedModules) {
      await checkBuild(modulePath);
    }

    // 빌드 완료 후 대기 목록 초기화
    clearPendingBuild();

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
      return;
    }

    // 빌드 실패 - 에러 추출
    const errors = extractBuildErrors(stderr + stdout);

    if (errors.length === 0) {
      console.log(`⚠️  Build completed with warnings in ${moduleName}`);
    } else if (errors.length < 5) {
      console.log(`\n❌ Build failed in ${moduleName}:\n`);
      errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error}`);
      });
      console.log("\n💡 Please fix these errors before continuing.\n");
    } else {
      console.log(
        `\n❌ ${errors.length} compilation errors found in ${moduleName}!`,
      );
      console.log(
        "💡 Consider reviewing the changes or running build manually:\n",
      );
      console.log(
        `   cd KiiPS-HUB && mvn clean compile -pl :${moduleName} -am\n`,
      );
    }
  } catch (error) {
    // 빌드 명령 실패
    if (error.code === "ETIMEDOUT") {
      console.log(`⏱️  Build timeout for ${moduleName} (exceeded 120s)`);
    } else {
      console.log(`❌ Build error for ${moduleName}: ${error.message}`);
      console.log("💡 Ensure JAVA_HOME is set and Maven is available");
    }
  }
}

/**
 * Maven 출력에서 컴파일 에러 추출
 * @param {string} output - Maven 출력
 * @returns {Array} - 에러 메시지 배열
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
        const fileName = path.basename(file);
        errors.push(`${fileName}:${lineNum} - ${message.trim()}`);
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

// Export for Claude Code Hook system
module.exports = { onPostToolUse };
