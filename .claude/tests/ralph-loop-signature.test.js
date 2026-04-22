#!/usr/bin/env node
/**
 * Ralph Loop Signature Tracking Synthetic Test
 *
 * buildChecker.js 의 emitAutoCorrectFeedback 이 에러 시그니처 변경 (A→B→C)
 * 패턴을 정확히 감지하는지 실제 Maven 빌드 없이 검증.
 *
 * 테스트 시나리오:
 *  1. 같은 시그니처 3회 → 일반 카운터(autoFixAttempts) 발동, RALPH LOOP 메시지 X
 *  2. 다른 시그니처 3회 (A→B→C) → RALPH LOOP DETECTED 메시지 출력 확인
 *  3. 시그니처 추적 후 .pending-build.json 에 errorSignatureHistory 정확히 저장 확인
 *
 * 실행: node .claude/tests/ralph-loop-signature.test.js
 * exit 0 = 모두 통과, exit 1 = 실패
 */

"use strict";

const fs = require("fs");
const path = require("path");

const bc = require("../hooks/buildChecker.js");

// 테스트용 격리 상태 파일 (실제 .pending-build.json 영향 안 줌)
const ORIGINAL_PENDING = bc.PENDING_BUILD_FILE;
const TEST_PENDING = path.join(__dirname, ".test-pending-build.json");

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

/**
 * stderr 캡처 헬퍼
 */
function captureStderr(fn) {
  const orig = process.stderr.write.bind(process.stderr);
  let captured = "";
  process.stderr.write = (chunk) => {
    captured += chunk;
    return true;
  };
  try {
    fn();
  } finally {
    process.stderr.write = orig;
  }
  return captured;
}

/**
 * 격리 상태로 시작: 기존 .pending-build.json 백업, 테스트용 빈 상태 시드
 */
function setupIsolation() {
  // 실제 PENDING 백업 (있으면)
  if (fs.existsSync(ORIGINAL_PENDING)) {
    fs.copyFileSync(ORIGINAL_PENDING, ORIGINAL_PENDING + ".backup-test");
  }
  // 빈 상태로 초기화
  bc.clearPendingBuild();
}

/**
 * 격리 종료: 백업 복원
 */
function teardownIsolation() {
  if (fs.existsSync(ORIGINAL_PENDING + ".backup-test")) {
    fs.copyFileSync(ORIGINAL_PENDING + ".backup-test", ORIGINAL_PENDING);
    fs.unlinkSync(ORIGINAL_PENDING + ".backup-test");
  } else if (fs.existsSync(ORIGINAL_PENDING)) {
    fs.unlinkSync(ORIGINAL_PENDING);
  }
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  Ralph Loop Signature Tracking Synthetic Test");
console.log("═══════════════════════════════════════════════════════");
console.log("");

setupIsolation();

try {
  // ─── Test 1: computeErrorSignature 기본 동작 ───────────────
  console.log("┌─ Test 1: computeErrorSignature 함수 동작 ─");
  {
    const sig = bc.computeErrorSignature([
      {
        file: "/path/to/Foo.java",
        line: 10,
        col: 5,
        message: "cannot find symbol foo",
      },
    ]);
    if (sig === "Foo.java::cannot find symbol foo") ok("기본 시그니처 형식");
    else bad("기본 시그니처 형식", `actual="${sig}"`);

    const empty = bc.computeErrorSignature([]);
    if (empty === "") ok("빈 errors 배열은 빈 문자열");
    else bad("빈 errors 배열", `actual="${empty}"`);

    const noFile = bc.computeErrorSignature([{ message: "x" }]);
    if (noFile === "::x") ok("file 없는 에러도 처리");
    else bad("file 없는 에러", `actual="${noFile}"`);
  }

  // ─── Test 2: 같은 시그니처 3회 → 일반 카운터만 발동 ──────
  console.log("");
  console.log("┌─ Test 2: 같은 에러 3회 (시그니처 동일) ─");
  {
    bc.clearPendingBuild();
    const sameError = [
      { file: "/p/A.java", line: 1, col: 1, message: "cannot find symbol x" },
    ];

    let stderr1 = captureStderr(() =>
      bc.emitAutoCorrectFeedback("KiiPS-FD", sameError),
    );
    let stderr2 = captureStderr(() =>
      bc.emitAutoCorrectFeedback("KiiPS-FD", sameError),
    );
    let stderr3 = captureStderr(() =>
      bc.emitAutoCorrectFeedback("KiiPS-FD", sameError),
    );

    const allStderr = stderr1 + stderr2 + stderr3;

    if (!allStderr.includes("RALPH LOOP DETECTED"))
      ok("시그니처 동일 3회는 RALPH LOOP 트리거 안함");
    else bad("RALPH LOOP 오발동");

    if (stderr3.includes("AUTO-CORRECTION HALTED"))
      ok("3회 시도 후 일반 HALT 메시지 출력");
    else bad("일반 HALT 메시지 미출력", "stderr3 doesn't contain HALTED");

    const state = bc.loadPendingBuild();
    if (state.errorSignatureHistory && state.errorSignatureHistory.length === 3)
      ok("errorSignatureHistory 3개 저장됨");
    else
      bad(
        "history 길이",
        `actual=${state.errorSignatureHistory ? state.errorSignatureHistory.length : "missing"}`,
      );

    const sigs = (state.errorSignatureHistory || []).map((e) => e.sig);
    const allSame = sigs.every((s) => s === sigs[0]);
    if (allSame) ok("모든 시그니처가 동일");
    else bad("시그니처 동일성", `sigs=${JSON.stringify(sigs)}`);
  }

  // ─── Test 3: 다른 시그니처 3회 (A→B→C) → RALPH LOOP 트리거 ─
  console.log("");
  console.log("┌─ Test 3: 시그니처 변경 3회 (Ralph Loop 패턴) ─");
  {
    bc.clearPendingBuild();
    const errA = [
      { file: "/p/X.java", line: 1, col: 1, message: "missing semicolon" },
    ];
    const errB = [
      { file: "/p/X.java", line: 2, col: 1, message: "unresolved import" },
    ];
    const errC = [
      { file: "/p/X.java", line: 3, col: 1, message: "type mismatch" },
    ];
    const errD = [
      { file: "/p/X.java", line: 4, col: 1, message: "duplicate method" },
    ];

    let s1 = captureStderr(() => bc.emitAutoCorrectFeedback("KiiPS-IL", errA));
    let s2 = captureStderr(() => bc.emitAutoCorrectFeedback("KiiPS-IL", errB));
    let s3 = captureStderr(() => bc.emitAutoCorrectFeedback("KiiPS-IL", errC));
    let s4 = captureStderr(() => bc.emitAutoCorrectFeedback("KiiPS-IL", errD));

    const all = s1 + s2 + s3 + s4;
    // shifts >= 3 (A→B → 1, B→C → 2, C→D → 3) 발동은 4번째 호출 (errD)
    if (all.includes("RALPH LOOP DETECTED"))
      ok("시그니처 변경 3+회 시 RALPH LOOP DETECTED 메시지 출력");
    else bad("RALPH LOOP 메시지 미출력", "stderr 검색 실패");

    if (s4.includes("Each fix introduces a NEW error"))
      ok("정확한 가이던스 메시지 포함");
    else bad("가이던스 메시지");

    const state = bc.loadPendingBuild();
    const sigs = (state.errorSignatureHistory || []).map((e) => e.sig);
    if (sigs.length >= 4) ok(`history 누적 (${sigs.length}개)`);
    else bad("history 길이", `actual=${sigs.length}`);

    const uniqueCount = new Set(sigs).size;
    if (uniqueCount >= 3) ok(`고유 시그니처 ${uniqueCount}개 추적`);
    else bad("고유 시그니처 수", `actual=${uniqueCount}`);
  }

  // ─── Test 4: 빌드 성공 시 history 초기화 (간접 검증) ─────
  console.log("");
  console.log("┌─ Test 4: 상태 격리 / 초기화 동작 ─");
  {
    bc.clearPendingBuild();
    const state = bc.loadPendingBuild();
    if (state.autoFixAttempts === 0)
      ok("clearPendingBuild 후 autoFixAttempts=0");
    else bad("초기화 실패", `attempts=${state.autoFixAttempts}`);

    if (Array.isArray(state.errors) && state.errors.length === 0)
      ok("errors 배열 비어있음");
    else bad("errors 미초기화");
  }
} finally {
  teardownIsolation();
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
