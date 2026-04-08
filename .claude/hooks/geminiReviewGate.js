/**
 * Gemini Review Gate Hook
 * PreToolUse 이벤트에서 실행되어 미해결 Critical Gemini 리뷰가 있는
 * 파일에 대한 Edit/Write 작업을 차단합니다.
 *
 * Fail-open: 내부 오류 발생 시 exit(0) (워크플로우 차단 금지)
 *
 * @version 1.0.0-KiiPS
 */

"use strict";

const fs = require("fs");
const path = require("path");

const REVIEWS_DIR =
  "/Users/younghwankang/WORK/WORKSPACE/KiiPS/.claude/gemini-bridge/reviews";
const ACKS_FILE =
  "/Users/younghwankang/WORK/WORKSPACE/KiiPS/.claude/gemini-bridge/.review-acks.json";

/** 리뷰 만료 시간: 24시간 (ms) */
const REVIEW_TTL_MS = 24 * 60 * 60 * 1000;

/** 스캔할 최대 리뷰 파일 수 (성능 제한) */
const MAX_REVIEWS_TO_SCAN = 30;

/**
 * acks 파일 로드. 파일이 없으면 빈 객체 반환.
 *
 * @returns {object} { reviewId: { acknowledgedAt: number }, ... }
 */
function loadAcks() {
  try {
    if (!fs.existsSync(ACKS_FILE)) {
      return {};
    }
    const raw = fs.readFileSync(ACKS_FILE, "utf8");
    return JSON.parse(raw);
  } catch (_e) {
    return {};
  }
}

/**
 * 리뷰 디렉토리에서 미해결 Critical 이슈를 검사합니다.
 *
 * @param {string} filePath - 편집 대상 파일 경로
 * @returns {{ reviewId: string, issues: object[] } | null}
 *   Critical 이슈가 있으면 첫 번째 매칭 결과, 없으면 null
 */
function checkGeminiReviews(filePath) {
  if (!filePath) return null;

  if (!fs.existsSync(REVIEWS_DIR)) return null;

  const acks = loadAcks();
  const targetBasename = path.basename(filePath);
  const now = Date.now();

  // 리뷰 파일 목록: 타임스탬프 기반 이름이므로 내림차순 = 최신순
  let reviewFiles;
  try {
    reviewFiles = fs
      .readdirSync(REVIEWS_DIR)
      .filter((f) => f.endsWith(".json"))
      .sort()
      .reverse()
      .slice(0, MAX_REVIEWS_TO_SCAN);
  } catch (_e) {
    return null;
  }

  for (const filename of reviewFiles) {
    let review;
    try {
      const raw = fs.readFileSync(path.join(REVIEWS_DIR, filename), "utf8");
      review = JSON.parse(raw);
    } catch (_e) {
      continue;
    }

    // 완료된 리뷰만 처리
    if (review.status !== "completed") continue;

    // 주의가 필요한 리뷰만 처리
    if (!review.needsAttention) continue;

    // 이미 확인 처리된 리뷰 스킵
    const reviewId = review.id || filename.replace(".json", "");
    if (acks[reviewId]) continue;

    // 24시간 초과 리뷰 스킵
    if (review.createdAt) {
      const reviewAge = now - new Date(review.createdAt).getTime();
      if (reviewAge > REVIEW_TTL_MS) continue;
    }

    // 파일 매칭: basename 비교 (리뷰 파일은 상대 경로일 수 있음)
    const reviewFiles_ = Array.isArray(review.files) ? review.files : [];
    const matchesFile = reviewFiles_.some(
      (f) => path.basename(f) === targetBasename,
    );
    if (!matchesFile) continue;

    // Critical 이슈만 수집
    const criticalIssues = (review.issues || []).filter(
      (issue) => issue.severity === "critical",
    );

    if (criticalIssues.length > 0) {
      return { reviewId, issues: criticalIssues };
    }
  }

  return null;
}

/**
 * 차단 메시지 생성
 *
 * @param {string} basename - 파일 basename
 * @param {string} reviewId - 리뷰 ID
 * @param {object[]} issues - Critical 이슈 목록
 * @returns {string}
 */
function formatBlockMessage(basename, reviewId, issues) {
  const issueLines = issues.map((i) => `  - ${i.text}`).join("\n");
  return (
    `\n` +
    `╔══════════════════════════════════════════════════════╗\n` +
    `║  GEMINI REVIEW GATE - Unresolved Critical Issues     ║\n` +
    `╚══════════════════════════════════════════════════════╝\n` +
    `\n` +
    `File: ${basename}\n` +
    `Review: ${reviewId}\n` +
    `\n` +
    `Critical issues:\n` +
    `${issueLines}\n` +
    `\n` +
    `Resolve these issues first, or acknowledge with:\n` +
    `  "I have reviewed the Gemini findings for ${reviewId}"\n` +
    `\n` +
    `To acknowledge all: /gemini-handoff read\n`
  );
}

// ─── CLI Entry Point (stdin JSON 파싱) ───────────────────────
if (require.main === module) {
  // 안전 타이머: 5초
  const safetyTimer = setTimeout(() => {
    process.stderr.write("[GeminiReviewGate] stdin timeout - allowing\n");
    process.exit(0);
  }, 5_000);

  const chunks = [];
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => chunks.push(chunk));
  process.stdin.on("end", () => {
    clearTimeout(safetyTimer);
    try {
      const input = chunks.join("");
      if (!input.trim()) {
        process.exit(0);
      }

      const event = JSON.parse(input);
      const toolName = (event.tool_name || "").toLowerCase();

      // Edit/Write 도구에서만 동작
      if (toolName !== "edit" && toolName !== "write") {
        process.exit(0);
      }

      const filePath = (event.tool_input || {}).file_path || "";
      if (!filePath) {
        process.exit(0);
      }

      const result = checkGeminiReviews(filePath);
      if (result) {
        const basename = path.basename(filePath);
        process.stderr.write(
          formatBlockMessage(basename, result.reviewId, result.issues),
        );
        process.exit(2); // block
      }

      process.exit(0); // allow
    } catch (_e) {
      // Fail-open: 내부 오류 시 차단하지 않음
      process.exit(0);
    }
  });

  process.stdin.resume();
}

module.exports = { checkGeminiReviews, loadAcks };
