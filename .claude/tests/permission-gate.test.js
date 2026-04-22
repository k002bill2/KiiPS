#!/usr/bin/env node
/**
 * permissionGate Unit Tests
 *
 * 서비스 제어·공유 빌드·프로덕션 설정·svn commit 에 대한 차단 판정 실증.
 *
 * 실행: node .claude/tests/permission-gate.test.js
 * exit 0 = 모두 통과, exit 1 = 실패
 */

"use strict";

const { checkPermission } = require("../hooks/permissionGate.js");

let pass = 0;
let fail = 0;

function ok(desc) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
  pass++;
}
function bad(desc, info) {
  console.log(`  \x1b[31m[FAIL]\x1b[0m ${desc}${info ? " — " + info : ""}`);
  fail++;
}

function expectBlocked(toolName, input, desc) {
  const r = checkPermission(toolName, input);
  if (r.blocked === true) {
    ok(`${desc} (reason: ${r.reason})`);
  } else {
    bad(desc, "expected blocked=true, actual=false");
  }
}
function expectAllowed(toolName, input, desc) {
  const r = checkPermission(toolName, input);
  if (r.blocked === false) {
    ok(desc);
  } else {
    bad(desc, `expected blocked=false, actual blocked by "${r.reason}"`);
  }
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  permissionGate Unit Tests");
console.log("═══════════════════════════════════════════════════════");
console.log("");

console.log("┌─ Bash: service control (blocked) ─");
expectBlocked("Bash", { command: "./start.sh" }, "./start.sh");
expectBlocked("Bash", { command: "./stop.sh" }, "./stop.sh");
expectBlocked("Bash", { command: "bash start.sh" }, "bash start.sh");
expectBlocked("Bash", { command: "/opt/kiips/start.sh" }, "absolute path start.sh");
expectBlocked("Bash", { command: "pkill -f java" }, "pkill -f");
expectBlocked("Bash", { command: "kill -9 1234" }, "kill -9");
expectBlocked("Bash", { command: "systemctl restart nginx" }, "systemctl restart");

console.log("");
console.log("┌─ Bash: VCS commit (blocked) ─");
expectBlocked("Bash", { command: 'svn commit -m "fix"' }, "svn commit");

console.log("");
console.log("┌─ Bash: allowed ─");
expectAllowed("Bash", { command: "ls -la" }, "ls -la");
expectAllowed("Bash", { command: "mvn compile" }, "mvn compile");
expectAllowed("Bash", { command: "svn status" }, "svn status (non-commit)");
expectAllowed("Bash", { command: "svn diff" }, "svn diff");
expectAllowed("Bash", { command: "cat restart.sh" }, "cat restart.sh (not restart command)");

console.log("");
console.log("┌─ Edit/Write: protected paths (blocked) ─");
expectBlocked("Edit", { file_path: "/x/KiiPS-HUB/pom.xml", new_string: "..." }, "pom.xml");
expectBlocked("Edit", { file_path: "/x/KiiPS-FD/pom.xml" }, "module pom.xml");
expectBlocked("Write", { file_path: "/x/start.sh", content: "..." }, "start.sh write");
expectBlocked("Edit", { file_path: "/x/stop.sh" }, "stop.sh edit");
expectBlocked("Edit", { file_path: "/x/src/main/resources/app-kiips.properties" }, "app-kiips.properties");
expectBlocked("Edit", { file_path: "/x/src/main/resources/app-stg.properties" }, "app-stg.properties");
expectBlocked("Write", { file_path: "/x/app-production.properties" }, "app-production.properties");

console.log("");
console.log("┌─ Edit/Write: allowed ─");
expectAllowed("Edit", { file_path: "/x/Foo.java" }, "Foo.java");
expectAllowed("Edit", { file_path: "/x/FooMapper.xml" }, "Mapper.xml");
expectAllowed("Edit", { file_path: "/x/app-local.properties" }, "app-local.properties");
expectAllowed("Edit", { file_path: "/x/app-dev.properties" }, "app-dev.properties");
expectAllowed("Edit", { file_path: "/x/index.jsp" }, "JSP file");
expectAllowed("Write", { file_path: "/x/readme.md" }, "README file");

console.log("");
console.log("┌─ AST filter: literal/comment/heredoc (allowed) ─");
expectAllowed(
  "Bash",
  { command: 'git commit -m "docs: describe svn commit workflow"' },
  "svn commit inside git commit -m dquote",
);
expectAllowed(
  "Bash",
  { command: "echo 'example: kill -9 <pid>'" },
  "kill -9 inside single quote",
);
expectAllowed(
  "Bash",
  { command: "# run ./start.sh to boot\nls" },
  "./start.sh inside shell comment",
);
expectAllowed(
  "Bash",
  { command: "cat <<EOF\nrun ./stop.sh then ./start.sh\nEOF" },
  "./start.sh/./stop.sh inside heredoc body",
);
expectAllowed(
  "Bash",
  { command: 'svn status && echo "svn commit later"' },
  "svn commit inside dquote after unrelated command",
);

console.log("");
console.log("┌─ AST filter: real commands still blocked ─");
expectBlocked("Bash", { command: "svn commit -m 'fix'" }, "real svn commit still blocked");
expectBlocked("Bash", { command: "kill -9 1234" }, "real kill -9 still blocked");
expectBlocked("Bash", { command: "./start.sh" }, "real ./start.sh still blocked");

console.log("");
console.log("┌─ Boundary / safety ─");
expectAllowed("Bash", {}, "empty tool_input → allowed (no command field)");
expectAllowed("Edit", {}, "empty tool_input → allowed (no file_path)");
expectAllowed("Read", { file_path: "/x/start.sh" }, "Read tool on start.sh → allowed");
expectAllowed("Glob", { pattern: "start.sh" }, "Glob on start.sh → allowed");

console.log("");
console.log("═══════════════════════════════════════════════════════");
const total = pass + fail;
if (fail === 0) {
  console.log(`  \x1b[32mALL PASS: ${pass}/${total} tests\x1b[0m`);
  console.log("═══════════════════════════════════════════════════════");
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAIL: ${fail}/${total} tests failed\x1b[0m`);
  console.log("═══════════════════════════════════════════════════════");
  process.exit(1);
}
