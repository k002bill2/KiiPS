/**
 * Cross-Tool Reader Hook
 * SessionStart 이벤트에서 Gemini CLI 분석 결과 파일을 감지하여 알림 출력
 *
 * 역할: Gemini가 .temp/coordination/cross-tool/responses/ 에 저장한
 *       분석 보고서를 Claude 세션 시작 시 자동으로 감지합니다.
 *
 * v2.0: 병렬 실행 배치 감지 추가
 *   - 동일 날짜에 여러 파일이 동시 생성된 경우 배치로 묶어 표시
 *   - 병렬 실행 여부 판단 (2개 이상 파일의 mtime 차이 < BATCH_WINDOW_MS)
 *
 * @version 2.0.0
 */

const fs = require("fs");
const path = require("path");

const RESPONSES_DIR = ".temp/coordination/cross-tool/responses";
const REVIEWS_DIR = ".claude/gemini-bridge/reviews";
const STATE_FILE = ".temp/coordination/cross-tool/handoff-state.json";

/**
 * 병렬 실행으로 거의 동시에 생성된 파일로 판단하는 시간 창 (ms)
 * gemini-parallel.sh 의 배치 간 대기 시간을 감안해 넉넉하게 설정
 */
const BATCH_WINDOW_MS = 5 * 60 * 1000; // 5분

function run() {
  try {
    if (!fs.existsSync(RESPONSES_DIR)) return;

    // 상태 파일 읽기 (마지막으로 처리한 파일 목록)
    let state = { processed_files: [], last_check: null };
    if (fs.existsSync(STATE_FILE)) {
      try {
        state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8"));
        state.processed_files = state.processed_files || [];
      } catch (e) {
        state = { processed_files: [], last_check: null };
      }
    }

    // responses/ 디렉토리의 파일 목록 (mtime 포함)
    const files = fs
      .readdirSync(RESPONSES_DIR)
      .filter((f) => f.endsWith(".json") || f.endsWith(".md"))
      .map((f) => {
        const filePath = path.join(RESPONSES_DIR, f);
        const stat = fs.statSync(filePath);
        return {
          name: f,
          path: filePath,
          size: stat.size,
          mtimeMs: stat.mtimeMs,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));

    if (files.length === 0) return;

    // 미처리 파일 필터링
    const unread = files.filter((f) => !state.processed_files.includes(f.name));

    if (unread.length === 0) return;

    // 병렬 배치 그룹핑: mtime 차이가 BATCH_WINDOW_MS 이내인 파일끼리 묶기
    const batches = groupIntoBatches(unread, BATCH_WINDOW_MS);
    const isParallelRun =
      unread.length >= 2 && batches.some((b) => b.length >= 2);

    // 알림 출력
    console.log("\n╔══════════════════════════════════════════╗");
    if (isParallelRun) {
      console.log("║   GEMINI 병렬 분석 결과 대기 중          ║");
    } else {
      console.log("║   GEMINI 분석 결과 대기 중               ║");
    }
    console.log("╚══════════════════════════════════════════╝");

    if (isParallelRun) {
      // 병렬 실행 결과: 배치 단위로 그룹 표시
      console.log(
        `\n미처리 Gemini 보고서 ${unread.length}개 발견 (${batches.length}개 배치):\n`,
      );
      batches.forEach((batch, batchIdx) => {
        const batchTime = new Date(batch[0].mtimeMs).toLocaleTimeString(
          "ko-KR",
        );
        console.log(
          `  [배치 ${batchIdx + 1}] ${batchTime} — ${batch.length}개 파일`,
        );
        batch.forEach((file, i) => {
          const sizeKb = (file.size / 1024).toFixed(1);
          const taskType = detectTaskType(file.name);
          console.log(`    ${i + 1}. [${taskType}] ${file.name} (${sizeKb}KB)`);
        });
        console.log("");
      });
    } else {
      // 단일 실행 결과: 기존 방식
      console.log(`\n미처리 Gemini 보고서 ${unread.length}개 발견:\n`);
      unread.forEach((file, i) => {
        const sizeKb = (file.size / 1024).toFixed(1);
        const taskType = detectTaskType(file.name);
        console.log(`  ${i + 1}. [${taskType}] ${file.name} (${sizeKb}KB)`);
      });
    }

    console.log("처리 방법:");
    console.log("  /gemini-handoff read  → 최신 결과 읽고 실행 계획 수립");
    if (isParallelRun) {
      console.log("  (병렬 실행 결과 — 일괄 처리 권장)");
    }
    console.log("──────────────────────────────────────────────\n");
  } catch (error) {
    // 훅 실패는 조용히 무시 (세션 시작을 막으면 안 됨)
  }

  // ── Gemini Bridge reviews 디렉토리 확인 ──
  try {
    if (!fs.existsSync(REVIEWS_DIR)) return;

    const reviewFiles = fs
      .readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .map((f) => {
        const filePath = path.join(REVIEWS_DIR, f);
        try {
          const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
          return { name: f, path: filePath, data };
        } catch (_) {
          return null;
        }
      })
      .filter(Boolean);

    const unshown = reviewFiles.filter((f) => f.data.status === "completed");

    if (unshown.length === 0) return;

    console.log("\n╔══════════════════════════════════════════╗");
    console.log("║   GEMINI REVIEW 결과 대기 중             ║");
    console.log("╚══════════════════════════════════════════╝");
    console.log(`\n미확인 리뷰 ${unshown.length}건:\n`);

    unshown.forEach((f, i) => {
      const d = f.data;
      const icon = d.needsAttention ? "⚠️ " : "✅";
      const type = d.scanType || "review";
      const issueCount = (d.issues || []).length;
      const critical = (d.issues || []).filter(
        (x) => x.severity === "critical",
      ).length;
      console.log(`  ${icon} ${i + 1}. [${type.toUpperCase()}] ${f.name}`);
      if (issueCount > 0) {
        console.log(`     이슈 ${issueCount}건 (critical: ${critical})`);
        (d.issues || [])
          .filter((x) => x.severity === "critical")
          .slice(0, 3)
          .forEach((issue) => {
            console.log(`     🔴 ${issue.text}`);
          });
      }
      if (d.verdict) console.log(`     verdict: ${d.verdict}`);
    });

    console.log("\n──────────────────────────────────────────────\n");
  } catch (_) {
    // 리뷰 읽기 실패는 무시
  }
}

/**
 * 파일 목록을 mtime 기준 배치로 그룹핑
 * BATCH_WINDOW_MS 이내에 생성된 파일들을 같은 배치로 묶음
 *
 * @param {Array} files - { name, path, size, mtimeMs } 배열
 * @param {number} windowMs - 배치 판단 시간 창 (ms)
 * @returns {Array[]} 배치 배열의 배열
 */
function groupIntoBatches(files, windowMs) {
  if (files.length === 0) return [];

  // mtime 오름차순 정렬
  const sorted = [...files].sort((a, b) => a.mtimeMs - b.mtimeMs);

  const batches = [];
  let currentBatch = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const prev = sorted[i - 1];
    const curr = sorted[i];

    if (curr.mtimeMs - prev.mtimeMs <= windowMs) {
      // 이전 파일과 시간 창 내 → 같은 배치
      currentBatch.push(curr);
    } else {
      // 시간 창 초과 → 새 배치
      batches.push(currentBatch);
      currentBatch = [curr];
    }
  }
  batches.push(currentBatch);

  return batches;
}

/**
 * 파일명에서 작업 유형 추출
 */
function detectTaskType(filename) {
  if (filename.includes("security-scan")) return "SECURITY";
  if (filename.includes("codebase-audit")) return "AUDIT";
  if (filename.includes("impact-")) return "IMPACT";
  if (filename.includes("darktheme-audit")) return "DARK-THEME";
  if (filename.includes("predeploy")) return "PRE-DEPLOY";
  if (filename.includes("tech-research")) return "RESEARCH";
  if (filename.includes("docs-")) return "DOCS";
  return "ANALYSIS";
}

/**
 * Gemini Auto-Reviewer Daemon 상태 확인
 * 세션 시작 시 데몬 실행 여부를 확인하고 안내 메시지 출력
 */
function checkGeminiDaemon() {
  try {
    const PID_FILE = ".claude/gemini-bridge/daemon.pid";

    if (!fs.existsSync(PID_FILE)) {
      console.log("\n╔══════════════════════════════════════════╗");
      console.log("║   GEMINI AUTO-REVIEWER 데몬 미실행       ║");
      console.log("╚══════════════════════════════════════════╝");
      console.log("");
      console.log("자동 코드 리뷰를 위해 별도 터미널에서 실행하세요:");
      console.log("  bash .claude/hooks/start-gemini-daemon.sh");
      console.log("");
      console.log("──────────────────────────────────────────────\n");
      return;
    }

    const pid = parseInt(fs.readFileSync(PID_FILE, "utf8").trim(), 10);
    if (isNaN(pid)) {
      console.log("\n⚠️  Gemini daemon PID file corrupt. Restart with:");
      console.log("  bash .claude/hooks/start-gemini-daemon.sh restart\n");
      return;
    }

    try {
      process.kill(pid, 0); // 프로세스 존재 확인
      console.log(`\n✅ Gemini auto-reviewer daemon running (PID: ${pid})\n`);
    } catch (e) {
      if (e.code === "ESRCH") {
        // stale PID
        console.log("\n╔══════════════════════════════════════════╗");
        console.log("║   GEMINI AUTO-REVIEWER 데몬 중단됨       ║");
        console.log("╚══════════════════════════════════════════╝");
        console.log("");
        console.log("데몬이 비정상 종료되었습니다. 재시작하세요:");
        console.log("  bash .claude/hooks/start-gemini-daemon.sh restart");
        console.log("");
        console.log("──────────────────────────────────────────────\n");
        try {
          fs.unlinkSync(PID_FILE);
        } catch (_) {}
      }
    }
  } catch (_) {
    // 데몬 확인 실패는 무시
  }
}

// 실행: 데몬 확인, 그 다음 메인 로직
checkGeminiDaemon();
run();
