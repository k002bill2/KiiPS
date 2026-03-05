const fs = require('fs');
const path = require('path');

async function run() {
  const skillsDir = '../.claude/skills';
  const skillRules = JSON.parse(fs.readFileSync('../skill-rules.json', 'utf8'));

  const kiipsSkills = [
    'kiips-maven-builder',
    'kiips-service-deployer',
    'kiips-api-tester',
    'kiips-log-analyzer',
    'kiips-feature-planner',
    'checklist-generator'
  ];

  const results = [];
  let passed = true;

  console.log(`\nChecking ${kiipsSkills.length} KiiPS skills...\n`);

  for (const skillName of kiipsSkills) {
    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    const exists = fs.existsSync(skillPath);

    if (!exists) {
      passed = false;
      results.push({
        skill: skillName,
        status: 'MISSING',
        message: 'SKILL.md not found',
        passed: false
      });
      console.log(`  ❌ ${skillName}: SKILL.md not found`);
      continue;
    }

    // Check structure
    const content = fs.readFileSync(skillPath, 'utf8');
    const checks = {
      hasYaml: content.startsWith('---'),
      hasPurpose: content.includes('## Purpose'),
      hasExamples: content.includes('## ') && (
        content.includes('Example') ||
        content.includes('Usage') ||
        content.includes('Commands')
      ),
      hasRelatedSkills: content.includes('## Related Skills')
    };

    const missingParts = [];
    if (!checks.hasYaml) missingParts.push('YAML frontmatter');
    if (!checks.hasPurpose) missingParts.push('Purpose section');
    if (!checks.hasExamples) missingParts.push('Examples/Usage section');
    if (!checks.hasRelatedSkills) missingParts.push('Related Skills section');

    if (missingParts.length > 0) {
      passed = false;
      results.push({
        skill: skillName,
        status: 'INCOMPLETE',
        message: `Missing: ${missingParts.join(', ')}`,
        passed: false
      });
      console.log(`  ⚠️  ${skillName}: INCOMPLETE - Missing ${missingParts.join(', ')}`);
    } else {
      results.push({
        skill: skillName,
        status: 'OK',
        message: 'Structure complete',
        passed: true
      });
      console.log(`  ✅ ${skillName}: OK`);
    }
  }

  // Check for orphaned skills (in skill-rules.json but no SKILL.md)
  console.log(`\nChecking for skill rule consistency...\n`);

  for (const [skillName, rule] of Object.entries(skillRules)) {
    // Skip non-skill rules
    if (rule.type !== 'tool' && rule.type !== 'skill') continue;

    const skillPath = path.join(skillsDir, skillName, 'SKILL.md');
    if (!fs.existsSync(skillPath) && kiipsSkills.includes(skillName)) {
      // Already handled above
      continue;
    } else if (!fs.existsSync(skillPath)) {
      console.log(`  ⚠️  ${skillName}: Defined in skill-rules.json but no SKILL.md found`);
    }
  }

  return { passed, details: results };
}

module.exports = { run };
