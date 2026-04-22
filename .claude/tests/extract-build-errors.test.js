#!/usr/bin/env node
/**
 * extractBuildErrors Synthetic Test
 *
 * buildChecker.js 의 Maven 출력 파싱 로직을 실제 mvn 실행 없이 검증.
 * 다양한 Maven 출력 포맷/에지 케이스로 회귀 안정성 확보.
 *
 * 실행: node .claude/tests/extract-build-errors.test.js
 * exit 0 = 모두 통과, exit 1 = 실패
 */

"use strict";

const bc = require("../hooks/buildChecker.js");
const extract = bc.extractBuildErrors;

let pass = 0;
let fail = 0;

function ok(msg) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
  pass++;
}
function bad(msg, info) {
  console.log(`  \x1b[31m[FAIL]\x1b[0m ${msg}${info ? " — " + info : ""}`);
  fail++;
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  extractBuildErrors Synthetic Test");
console.log("═══════════════════════════════════════════════════════");
console.log("");

// ─── Test 1: 빈 출력 / 성공 케이스 ────────────────────────
console.log("┌─ Test 1: 에지 케이스 ─");
{
  const r1 = extract("");
  if (Array.isArray(r1) && r1.length === 0) ok("빈 문자열 → []");
  else bad("빈 문자열", `length=${r1.length}`);

  const r2 = extract("[INFO] BUILD SUCCESS\n[INFO] Total time: 3.5 s");
  if (r2.length === 0) ok("BUILD SUCCESS 출력 → []");
  else bad("BUILD SUCCESS", `length=${r2.length}`);

  const r3 = extract("[WARNING] something deprecated");
  if (r3.length === 0) ok("[WARNING] 만 있는 출력 → []");
  else bad("WARNING 포함", `length=${r3.length}`);
}

// ─── Test 2: 단일 에러 파싱 ───────────────────────────────
console.log("");
console.log("┌─ Test 2: 단일 에러 파싱 ─");
{
  const output = [
    "[INFO] Compiling 5 source files to /p/target",
    "[ERROR] /p/src/main/java/com/kiips/Foo.java:[42,15] cannot find symbol",
    "[INFO] BUILD FAILURE",
  ].join("\n");

  const errors = extract(output);
  if (errors.length === 1) ok("에러 1개 추출");
  else bad("에러 개수", `actual=${errors.length}`);

  const e = errors[0] || {};
  if (e.file === "/p/src/main/java/com/kiips/Foo.java") ok("file 필드 정확");
  else bad("file 필드", `actual="${e.file}"`);
  if (e.line === 42) ok("line 필드 정확 (parseInt)");
  else bad("line 필드", `actual=${e.line}`);
  if (e.col === 15) ok("col 필드 정확");
  else bad("col 필드", `actual=${e.col}`);
  if (e.message === "cannot find symbol") ok("message 필드 정확");
  else bad("message 필드", `actual="${e.message}"`);
}

// ─── Test 3: 다수 에러 동일 파일 ──────────────────────────
console.log("");
console.log("┌─ Test 3: 다수 에러 파싱 ─");
{
  const output = [
    "[ERROR] /p/A.java:[1,1] error A",
    "[ERROR] /p/A.java:[2,1] error B",
    "[ERROR] /p/B.java:[10,5] error C",
  ].join("\n");

  const errors = extract(output);
  if (errors.length === 3) ok("3개 에러 모두 추출");
  else bad("에러 개수", `actual=${errors.length}`);

  const messages = errors.map((e) => e.message);
  if (
    JSON.stringify(messages) ===
    JSON.stringify(["error A", "error B", "error C"])
  )
    ok("순서 보존");
  else bad("메시지 순서", `actual=${JSON.stringify(messages)}`);

  const files = new Set(errors.map((e) => e.file));
  if (files.size === 2) ok("파일 그룹화 필요 없이 개별 에러 보존");
  else bad("파일 수", `actual=${files.size}`);
}

// ─── Test 4: 10개 제한 (slice) ───────────────────────────
console.log("");
console.log("┌─ Test 4: 최대 10개 제한 ─");
{
  const lines = [];
  for (let i = 1; i <= 15; i++) {
    lines.push(`[ERROR] /p/F${i}.java:[${i},1] error ${i}`);
  }
  const errors = extract(lines.join("\n"));
  if (errors.length === 10) ok("15개 입력 → 10개로 cap");
  else bad("cap 동작", `actual=${errors.length}`);

  if (errors[0].message === "error 1" && errors[9].message === "error 10")
    ok("처음 10개 보존 (1~10)");
  else
    bad(
      "10개 범위",
      `first="${errors[0].message}", last="${errors[9].message}"`,
    );
}

// ─── Test 5: 잘못된 형식 무시 ─────────────────────────────
console.log("");
console.log("┌─ Test 5: 잘못된 포맷 무시 ─");
{
  const output = [
    "[ERROR] not a java file.txt:[1,1] should skip",
    "[ERROR] /p/Real.java:[1,1] valid error",
    "[ERROR] malformed without location",
    "[ERROR] /p/X.java missing brackets",
  ].join("\n");

  const errors = extract(output);
  if (errors.length === 1) ok("잘못된 포맷 skip, valid만 1개");
  else bad("valid-only 카운트", `actual=${errors.length}`);

  if (errors[0] && errors[0].file === "/p/Real.java")
    ok("valid 에러만 정확 추출");
  else bad("valid 에러 필터링");
}

// ─── Test 6: 실제 Maven 출력 시뮬레이션 ───────────────────
console.log("");
console.log("┌─ Test 6: 실제 Maven 출력 시뮬레이션 ─");
{
  const realOutput = `
[INFO] Scanning for projects...
[INFO] ------------------------------------------------------------------------
[INFO] Building KiiPS-FD 1.0.0-SNAPSHOT
[INFO] ------------------------------------------------------------------------
[INFO] --- maven-compiler-plugin:3.8.1:compile (default-compile) @ KiiPS-FD ---
[INFO] Changes detected - recompiling the module!
[INFO] Compiling 12 source files to /Users/dev/KiiPS-FD/target/classes
[ERROR] COMPILATION ERROR :
[INFO] -------------------------------------------------------------
[ERROR] /Users/dev/KiiPS-FD/src/main/java/com/kiips/fd/FundService.java:[87,42] cannot find symbol
[ERROR]   symbol:   method getNavByDate(java.lang.String)
[ERROR]   location: class com.kiips.fd.FundDao
[ERROR] /Users/dev/KiiPS-FD/src/main/java/com/kiips/fd/FundController.java:[156,5] ';' expected
[INFO] 2 errors
[INFO] -------------------------------------------------------------
[INFO] BUILD FAILURE
  `.trim();

  const errors = extract(realOutput);
  if (errors.length === 2) ok("실제 Maven 출력 에러 2개 추출");
  else bad("실제 출력 에러 개수", `actual=${errors.length}`);

  if (errors[0].file && errors[0].file.includes("FundService.java"))
    ok("첫 에러: FundService.java");
  else bad("첫 에러 파일");
  if (errors[1].file && errors[1].file.includes("FundController.java"))
    ok("둘째 에러: FundController.java");
  else bad("둘째 에러 파일");

  // [ERROR] symbol: ... 라인 (continuation lines)은 cannot 패턴 안 맞으므로 스킵돼야 함
  // 상기 예제에서 'symbol:' 라인은 .java: 포함 안 하므로 스킵됨 ✓
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
const total = pass + fail;
if (fail === 0) {
  console.log(`  \x1b[32mALL PASS: ${pass}/${total} checks\x1b[0m`);
  console.log("═══════════════════════════════════════════════════════");
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAIL: ${fail}/${total} checks failed\x1b[0m`);
  console.log("═══════════════════════════════════════════════════════");
  process.exit(1);
}
