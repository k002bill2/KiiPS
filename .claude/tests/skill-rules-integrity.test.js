#!/usr/bin/env node
/**
 * Skill-Rules Integrity Test
 *
 * .claude/skills/ (실제) ↔ .claude/skill-rules.json (트리거 메타데이터) 정합성 검증.
 *
 * 검사 항목:
 *  1. SKILL.md 존재 → skill-rules.json 등록 여부 (missing 감지)
 *  2. skill-rules.json 항목 → SKILL.md 존재 여부 (orphan 감지)
 *  3. skill-rules.json JSON 유효성
 *
 * 누락 stub 생성: --generate-stubs 플래그
 *
 * 실행:
 *   node .claude/tests/skill-rules-integrity.test.js          # 검증만
 *   node .claude/tests/skill-rules-integrity.test.js --stubs  # 누락 stub 출력
 *
 * exit 0 = clean, exit 1 = drift detected
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude/skills");
const RULES_FILE = path.join(PROJECT_ROOT, ".claude/skill-rules.json");

const args = process.argv.slice(2);
const generateStubs = args.includes("--stubs") || args.includes("--generate-stubs");

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
function warn(msg) {
  console.log(`  \x1b[33m[WARN]\x1b[0m ${msg}`);
}

function parseFrontmatter(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return null;
  const endMatch = content.indexOf("\n---", 4);
  if (endMatch === -1) return null;
  const block = content.slice(4, endMatch);
  const result = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      result[m[1]] = val;
    }
  }
  return result;
}

console.log("");
console.log("═══════════════════════════════════════════════════════");
console.log("  Skill-Rules Integrity Test");
console.log("═══════════════════════════════════════════════════════");
console.log("");

// 1. skill-rules.json 로드 + JSON 유효성
let rules;
try {
  rules = JSON.parse(fs.readFileSync(RULES_FILE, "utf8"));
  ok("skill-rules.json JSON 유효");
} catch (e) {
  bad(`skill-rules.json 파싱 실패: ${e.message}`);
  process.exit(1);
}
const ruleKeys = new Set(Object.keys(rules));

// 2. 실제 SKILL.md 디렉토리 스캔
const skillDirs = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory())
  .map((e) => e.name);

const skillsWithMd = skillDirs.filter((d) =>
  fs.existsSync(path.join(SKILLS_DIR, d, "SKILL.md")),
);

console.log("");
console.log(`  실제 skill: ${skillsWithMd.length}개`);
console.log(`  rules.json 항목: ${ruleKeys.size}개`);
console.log("");

// 3. 누락 (SKILL.md 있지만 rules.json 없음)
console.log("┌─ Missing in skill-rules.json ─");
const missing = [];
for (const skill of skillsWithMd) {
  if (!ruleKeys.has(skill)) {
    missing.push(skill);
  }
}
if (missing.length === 0) {
  ok("모든 skill이 rules.json에 등록됨");
} else {
  warn(`${missing.length}개 skill이 rules.json에 미등록 (트리거 미설정 상태)`);
  missing.forEach((s) => console.log(`     - ${s}`));
}

// 4. Orphan (rules.json 항목이 실제 SKILL.md 없음)
console.log("");
console.log("┌─ Orphan in skill-rules.json ─");
const orphans = [];
for (const key of ruleKeys) {
  if (!skillsWithMd.includes(key)) {
    orphans.push(key);
  }
}
if (orphans.length === 0) {
  ok("rules.json에 orphan 항목 없음");
} else {
  bad(`${orphans.length}개 orphan 발견 (skill 삭제됐지만 rules.json 잔존)`);
  orphans.forEach((s) => console.log(`     - ${s}`));
}

// 5. Stub 생성 (옵션)
if (generateStubs && missing.length > 0) {
  console.log("");
  console.log("┌─ Generated stubs (수동 검토 후 skill-rules.json 추가) ─");
  console.log("");
  const stubs = {};
  for (const skill of missing) {
    const mdPath = path.join(SKILLS_DIR, skill, "SKILL.md");
    let desc = "";
    try {
      const content = fs.readFileSync(mdPath, "utf8");
      const fm = parseFrontmatter(content);
      desc = (fm && fm.description) || "";
    } catch (_) {}
    stubs[skill] = {
      type: "guideline",
      enforcement: "suggest",
      priority: "medium",
      description: desc.slice(0, 100),
      promptTriggers: {
        keywords: ["TODO: add keywords"],
        intentPatterns: [],
      },
      fileTriggers: {
        pathPatterns: [],
        contentPatterns: [],
      },
    };
  }
  console.log(JSON.stringify(stubs, null, 2));
  console.log("");
  warn("위 stub을 검토 후 skill-rules.json에 수동 추가 (자동 적용 안 함)");
}

console.log("");
console.log("═══════════════════════════════════════════════════════");

// 정합성 결정: orphan은 FAIL, missing은 WARN (skill-rules.json은 선택적 큐레이션)
const total = pass + fail;
if (fail === 0) {
  if (missing.length > 0) {
    console.log(
      `  \x1b[33mPASS WITH WARNINGS: ${pass}/${total} ✓ (${missing.length}개 stub 권장)\x1b[0m`,
    );
  } else {
    console.log(`  \x1b[32mALL PASS: ${pass}/${total}\x1b[0m`);
  }
  console.log("═══════════════════════════════════════════════════════");
  process.exit(0);
} else {
  console.log(`  \x1b[31mFAIL: ${fail}/${total}\x1b[0m`);
  console.log("═══════════════════════════════════════════════════════");
  process.exit(1);
}
