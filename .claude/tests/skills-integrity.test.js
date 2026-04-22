#!/usr/bin/env node
/**
 * Skills Integrity Test
 *
 * .claude/skills/ 디렉토리 정합성 검증:
 *  1. 각 skill 디렉토리가 SKILL.md 보유
 *  2. SKILL.md 상단에 YAML frontmatter 존재 (name, description)
 *  3. name 필드 = 디렉토리명 일치
 *  4. description 필드 비어있지 않음
 *  5. orphan 파일 (SKILL.md 없는 디렉토리) 감지
 *
 * 실행: node .claude/tests/skills-integrity.test.js
 * exit 0 = clean, exit 1 = drift detected
 */

"use strict";

const fs = require("fs");
const path = require("path");

const PROJECT_ROOT = path.resolve(__dirname, "../..");
const SKILLS_DIR = path.join(PROJECT_ROOT, ".claude/skills");

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

/**
 * SKILL.md 파일 상단에서 YAML frontmatter 파싱
 * @returns {object|null} { name, description, ... }
 */
function parseFrontmatter(content) {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) {
    return null;
  }
  const endMatch = content.indexOf("\n---", 4);
  if (endMatch === -1) return null;
  const block = content.slice(4, endMatch);
  const result = {};
  for (const line of block.split(/\r?\n/)) {
    const m = line.match(/^([a-zA-Z_][\w-]*)\s*:\s*(.*)$/);
    if (m) {
      let val = m[2].trim();
      // 양쪽 따옴표 제거
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
console.log("  Skills Integrity Test");
console.log("═══════════════════════════════════════════════════════");
console.log("");

if (!fs.existsSync(SKILLS_DIR)) {
  bad(`skills 디렉토리 없음: ${SKILLS_DIR}`);
  process.exit(1);
}

const entries = fs
  .readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((e) => e.isDirectory());

console.log(`  총 ${entries.length}개 스킬 디렉토리 감지`);
console.log("");

// 통계
const skillCount = entries.length;
let withSkillMd = 0;
let withValidFrontmatter = 0;

console.log("┌─ SKILL.md 존재 + frontmatter 검증 ─");
for (const dir of entries) {
  const skillPath = path.join(SKILLS_DIR, dir.name);
  const mdPath = path.join(skillPath, "SKILL.md");

  if (!fs.existsSync(mdPath)) {
    bad(`MISSING SKILL.md: ${dir.name}/`);
    continue;
  }
  withSkillMd++;

  let content;
  try {
    content = fs.readFileSync(mdPath, "utf8");
  } catch (e) {
    bad(`${dir.name}/SKILL.md 읽기 실패: ${e.message}`);
    continue;
  }

  const fm = parseFrontmatter(content);
  if (!fm) {
    bad(`${dir.name}/SKILL.md: frontmatter 없음 또는 파싱 실패`);
    continue;
  }

  const issues = [];
  if (!fm.name) issues.push("name 필드 없음");
  else if (fm.name !== dir.name)
    issues.push(`name mismatch: fm="${fm.name}" dir="${dir.name}"`);

  if (!fm.description) issues.push("description 필드 없음");
  else if (fm.description.length < 10)
    issues.push(`description 너무 짧음 (${fm.description.length}자)`);

  if (issues.length === 0) {
    ok(`${dir.name} — name ✓ description ✓`);
    withValidFrontmatter++;
  } else {
    bad(`${dir.name} — ${issues.join(", ")}`);
  }
}

// 통계 요약
console.log("");
console.log("┌─ 전체 요약 ─");
if (withSkillMd === skillCount)
  ok(`SKILL.md 커버리지: ${withSkillMd}/${skillCount} (100%)`);
else
  bad(
    `SKILL.md 커버리지: ${withSkillMd}/${skillCount} (${Math.round((withSkillMd / skillCount) * 100)}%)`,
  );

if (withValidFrontmatter === skillCount)
  ok(`Frontmatter 유효: ${withValidFrontmatter}/${skillCount}`);
else
  bad(
    `Frontmatter 유효: ${withValidFrontmatter}/${skillCount} (${skillCount - withValidFrontmatter}개 수정 필요)`,
  );

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
