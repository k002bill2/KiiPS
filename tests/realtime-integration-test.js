const fs = require('fs');
const skillRules = JSON.parse(fs.readFileSync('../skill-rules.json', 'utf8'));

// 테스트 시나리오 3개
const testScenarios = [
  { prompt: 'KiiPS-FD 빌드해줘', expectedSkills: ['kiips-maven-builder'], expectedManager: 'build-manager' },
  { prompt: '펀드 목록 그리드 만들어줘', expectedSkills: ['kiips-ui-component-builder'], expectedManager: 'ui-manager' },
  { prompt: '새로운 투자기업 조회 기능 개발해줘', expectedSkills: ['kiips-feature-planner'], expectedManager: 'feature-manager' }
];

// Manager 감지 로직
const managerPatterns = {
  'build-manager': { keywords: ['빌드', 'build', 'maven', 'compile', 'package'], patterns: [/빌드.*?(해|해줘)/, /(build|compile).*?service/i] },
  'deployment-manager': { keywords: ['배포', 'deploy', 'start', 'stop', 'restart'], patterns: [/(배포|start).*?(해|해줘)/] },
  'feature-manager': { keywords: ['기능', 'feature', '개발', 'implement'], patterns: [/(새로운|new).*?(기능|feature)/i, /기능.*?(개발|추가)/] },
  'ui-manager': { keywords: ['UI', '화면', '페이지', 'RealGrid', '그리드', 'JSP'], patterns: [/(UI|화면|그리드).*?(만들|생성|개발)/i] }
};

function detectManager(prompt) {
  const lowerPrompt = prompt.toLowerCase();
  for (const [managerId, config] of Object.entries(managerPatterns)) {
    if (config.keywords.some(k => lowerPrompt.includes(k.toLowerCase()))) return managerId;
    if (config.patterns.some(p => p.test(prompt))) return managerId;
  }
  return null;
}

function shouldActivateSkill(prompt, rule) {
  const lowerPrompt = prompt.toLowerCase();
  if (rule.promptTriggers?.keywords?.some(kw => lowerPrompt.includes(kw.toLowerCase()))) return true;
  if (rule.promptTriggers?.intentPatterns?.some(p => new RegExp(p, 'i').test(prompt))) return true;
  return false;
}

console.log('\n🧪 실시간 통합 테스트\n');
console.log('='.repeat(60));

let allPassed = true;
let passCount = 0;

for (const scenario of testScenarios) {
  console.log(`\n📋 시나리오: "${scenario.prompt}"`);

  // Skill 활성화 테스트
  const activatedSkills = [];
  for (const [skillName, rule] of Object.entries(skillRules)) {
    if (shouldActivateSkill(scenario.prompt, rule)) {
      activatedSkills.push(skillName);
    }
  }

  const skillMatch = scenario.expectedSkills.every(s => activatedSkills.includes(s));
  console.log(`   Skills: ${skillMatch ? '✅' : '❌'} ${activatedSkills.filter(s => scenario.expectedSkills.includes(s)).join(', ') || '(없음)'}`);
  if (!skillMatch) {
    console.log(`   (활성화됨: ${activatedSkills.slice(0,5).join(', ')}...)`);
  }

  // Manager 감지 테스트
  const detectedManager = detectManager(scenario.prompt);
  const managerMatch = detectedManager === scenario.expectedManager;
  console.log(`   Manager: ${managerMatch ? '✅' : '❌'} ${detectedManager || '(없음)'}`);

  const scenarioPassed = skillMatch && managerMatch;
  if (scenarioPassed) passCount++;
  else allPassed = false;

  console.log(`   결과: ${scenarioPassed ? '✅ PASS' : '❌ FAIL'}`);
}

console.log('\n' + '='.repeat(60));
console.log(`\n📊 최종 결과: ${allPassed ? '✅' : '❌'} ${passCount}/3 시나리오 통과\n`);

process.exit(allPassed ? 0 : 1);
