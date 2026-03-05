#!/usr/bin/env node
/**
 * Safe Notification Handler
 * osascript command injection 방지를 위해 execFile + 배열 인자 사용
 *
 * @version 1.0.0
 * @hook-config
 * {"event": "Notification", "matcher": "", "command": "node .claude/hooks/notificationHandler.js"}
 */

const { execFile } = require("child_process");

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});

process.stdin.on("end", () => {
  try {
    const data = JSON.parse(input);
    const message = String(data.message || "")
      .replace(/[^\w\sㄱ-ㅎㅏ-ㅣ가-힣.,!?:;\-()[\]{}@#%&*/+=<>~ ]/g, "")
      .slice(0, 200);

    if (!message) {
      process.exit(0);
    }

    // execFile은 셸을 거치지 않으므로 command injection 불가
    execFile(
      "osascript",
      [
        "-e",
        `display notification "${message}" with title "Claude Code - KiiPS"`,
      ],
      { timeout: 5000 },
      (err) => {
        // 알림 실패는 무시
        process.exit(0);
      },
    );
  } catch (e) {
    process.exit(0);
  }
});

setTimeout(() => {
  process.exit(0);
}, 6000);
