#!/usr/bin/env node
/**
 * Registry Integrity Test
 *
 * agents-registry.json 선언과 .claude/agents/ 실제 파일의 정합성 검증.
 * - registry 선언 → 파일 존재 확인 (missing entry 감지)
 * - 실제 파일 → registry 포함 확인 (orphan 파일 감지)
 * - stats 자동 검산 (totalAgents, sharedProtocols)
 *
 * 실행: node .claude/tests/registry-integrity.test.js
 * exit 0 = clean, exit 1 = drift detected
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const REGISTRY = path.join(PROJECT_ROOT, ".claude/agents-registry.json");
const AGENTS_DIR = path.join(PROJECT_ROOT, ".claude/agents");

let pass = 0;
let fail = 0;

function ok(msg) {
  console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
  pass++;
}
function bad(msg) {
  console.log(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
  fail++;
}

function walk(dir, out = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) walk(full, out);
    else if (e.isFile() && e.name.endsWith(".md")) out.push(full);
  }
  return out;
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  Registry Integrity Test");
console.log("═══════════════════════════════════════════════════════");
console.log("");

// 1. Registry 로드
let registry;
try {
  registry = JSON.parse(fs.readFileSync(REGISTRY, "utf8"));
  ok("agents-registry.json 로드 성공");
} catch (e) {
  bad(`registry 로드 실패: ${e.message}`);
  process.exit(1);
}

// 2. Registry 선언 → 파일 존재 확인
console.log("");
console.log("┌─ Registry 선언 → 파일 존재 ─");
const declaredFiles = new Set();
for (const [name, info] of Object.entries(registry.agents || {})) {
  const absPath = path.join(PROJECT_ROOT, info.file);
  declaredFiles.add(path.resolve(absPath));
  if (fs.existsSync(absPath)) ok(`agent: ${name} → ${info.file}`);
  else bad(`MISSING: ${name} declares ${info.file} but file not found`);
}

for (const [name, filePath] of Object.entries(registry.shared || {})) {
  const absPath = path.join(PROJECT_ROOT, filePath);
  declaredFiles.add(path.resolve(absPath));
  if (fs.existsSync(absPath)) ok(`shared: ${name} → ${filePath}`);
  else bad(`MISSING: shared ${name} declares ${filePath} but file not found`);
}

// 3. 실제 파일 → registry 포함 확인 (orphan 감지)
console.log("");
console.log("┌─ 실제 파일 → registry 포함 여부 ─");
const actualFiles = walk(AGENTS_DIR);
for (const f of actualFiles) {
  const rel = path.relative(PROJECT_ROOT, f);
  if (declaredFiles.has(path.resolve(f))) ok(`registered: ${rel}`);
  else bad(`ORPHAN: ${rel} exists but not in registry`);
}

// 4. Stats 검산
console.log("");
console.log("┌─ Stats 자동 검산 ─");
const actualAgentCount = Object.keys(registry.agents || {}).length;
const actualSharedCount = Object.keys(registry.shared || {}).length;
const stats = registry.stats || {};

if (stats.totalAgents === actualAgentCount)
  ok(`totalAgents: ${stats.totalAgents} ✓`);
else
  bad(
    `totalAgents drift: declared=${stats.totalAgents}, actual=${actualAgentCount}`,
  );

if (stats.sharedProtocols === actualSharedCount)
  ok(`sharedProtocols: ${stats.sharedProtocols} ✓`);
else
  bad(
    `sharedProtocols drift: declared=${stats.sharedProtocols}, actual=${actualSharedCount}`,
  );

// 5. _generated 타임스탬프 stale 경고 (30일 초과)
console.log("");
console.log("┌─ _generated 타임스탬프 ─");
if (registry._generated) {
  const genMs = Date.parse(registry._generated);
  if (!isNaN(genMs)) {
    const ageDays = Math.floor((Date.now() - genMs) / (24 * 60 * 60 * 1000));
    if (ageDays <= 30) ok(`_generated: ${ageDays}일 경과 (신선)`);
    else if (ageDays <= 60)
      console.log(
        `  \x1b[33m[WARN]\x1b[0m _generated: ${ageDays}일 경과 (stale 주의)`,
      );
    else bad(`_generated: ${ageDays}일 경과 (매우 stale, 검토 필요)`);
  } else bad("_generated 파싱 불가");
} else bad("_generated 필드 없음");

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
