const fs = require('fs');

async function run() {
  const skillRules = JSON.parse(fs.readFileSync('../skill-rules.json', 'utf8'));

  const testScenarios = [
    {
      input: "KiiPS-FD 빌드해줘",
      expected: ['kiips-maven-builder'],
      description: "Korean build request"
    },
    {
      input: "build KiiPS-IL service",
      expected: ['kiips-maven-builder'],
      description: "English build request"
    },
    {
      input: "KiiPS-IL 배포",
      expected: ['kiips-service-deployer'],
      description: "Korean deployment request"
    },
    {
      input: "deploy to staging",
      expected: ['kiips-service-deployer'],
      description: "English deployment request"
    },
    {
      input: "로그 확인",
      expected: ['kiips-log-analyzer'],
      description: "Korean log check request"
    },
    {
      input: "check logs for errors",
      expected: ['kiips-log-analyzer'],
      description: "English log analysis request"
    },
    {
      input: "API 테스트",
      expected: ['kiips-api-tester'],
      description: "Korean API test request"
    },
    {
      input: "test API endpoints",
      expected: ['kiips-api-tester'],
      description: "English API test request"
    },
    {
      input: "feature plan for new payment module",
      expected: ['kiips-feature-planner'],
      description: "Feature planning request"
    },
    {
      input: "체크리스트 생성",
      expected: ['checklist-generator'],
      description: "Korean checklist generation request"
    },
    {
      input: "create deployment checklist",
      expected: ['checklist-generator'],
      description: "English checklist creation request"
    }
  ];

  const results = [];
  let passed = true;

  console.log(`\nRunning ${testScenarios.length} hook activation scenarios...\n`);

  for (const scenario of testScenarios) {
    const activated = simulateActivation(scenario.input, skillRules);
    const match = scenario.expected.every(skill => activated.includes(skill));

    const extraActivated = activated.filter(s => !scenario.expected.includes(s));

    results.push({
      input: scenario.input,
      description: scenario.description,
      expected: scenario.expected,
      activated: activated,
      match: match,
      extraActivated: extraActivated,
      passed: match
    });

    if (!match) {
      passed = false;
      console.log(`  ❌ "${scenario.description}"`);
      console.log(`     Input: "${scenario.input}"`);
      console.log(`     Expected: ${scenario.expected.join(', ')}`);
      console.log(`     Activated: ${activated.join(', ') || 'NONE'}`);
    } else {
      console.log(`  ✅ "${scenario.description}"`);
      if (extraActivated.length > 0) {
        console.log(`     Extra activated: ${extraActivated.join(', ')}`);
      }
    }
  }

  // Manager Detection Tests
  console.log(`\n\nRunning Manager detection tests...\n`);

  const managerScenarios = [
    {
      input: "KiiPS-FD, KiiPS-IL, KiiPS-PG 빌드해줘",
      expectedManager: 'build-manager',
      description: "Multi-service build request"
    },
    {
      input: "전체 서비스 빌드",
      expectedManager: 'build-manager',
      description: "Korean all services build request"
    },
    {
      input: "KiiPS-FD 배포하고 헬스체크 해줘",
      expectedManager: 'deployment-manager',
      description: "Deployment with health check"
    },
    {
      input: "deploy all services to staging",
      expectedManager: 'deployment-manager',
      description: "English multi-service deployment"
    },
    {
      input: "새로운 펀드 관리 기능 개발해줘",
      expectedManager: 'feature-manager',
      description: "Korean feature development request"
    },
    {
      input: "feature development for investment tracking",
      expectedManager: 'feature-manager',
      description: "English feature development request"
    },
    {
      input: "펀드 목록 UI 만들어줘, RealGrid 사용",
      expectedManager: 'ui-manager',
      description: "Korean UI creation with RealGrid"
    },
    {
      input: "create responsive investment dashboard page",
      expectedManager: 'ui-manager',
      description: "English UI creation request"
    }
  ];

  const managerResults = [];
  let managerTestsPassed = true;

  for (const scenario of managerScenarios) {
    const detectedManager = detectManagerAgent(scenario.input);
    const match = detectedManager === scenario.expectedManager;

    managerResults.push({
      input: scenario.input,
      description: scenario.description,
      expected: scenario.expectedManager,
      detected: detectedManager,
      passed: match
    });

    if (!match) {
      managerTestsPassed = false;
      console.log(`  ❌ "${scenario.description}"`);
      console.log(`     Input: "${scenario.input}"`);
      console.log(`     Expected: ${scenario.expectedManager}`);
      console.log(`     Detected: ${detectedManager || 'NONE'}`);
    } else {
      console.log(`  ✅ "${scenario.description}"`);
    }
  }

  passed = passed && managerTestsPassed;

  return {
    passed,
    details: {
      skillActivation: results,
      managerDetection: managerResults
    }
  };
}

function simulateActivation(input, skillRules) {
  const activated = [];

  for (const [skillName, rule] of Object.entries(skillRules)) {
    let matched = false;

    // Keyword matching
    if (rule.promptTriggers?.keywords) {
      matched = rule.promptTriggers.keywords.some(kw =>
        input.toLowerCase().includes(kw.toLowerCase())
      );
    }

    // Intent pattern matching
    if (!matched && rule.promptTriggers?.intentPatterns) {
      matched = rule.promptTriggers.intentPatterns.some(pattern => {
        try {
          return new RegExp(pattern, 'i').test(input);
        } catch (error) {
          console.warn(`Invalid regex pattern in ${skillName}: ${pattern}`);
          return false;
        }
      });
    }

    if (matched && !activated.includes(skillName)) {
      activated.push(skillName);
    }
  }

  return activated;
}

/**
 * Detect Manager Agent from user prompt
 * (Simulates userPromptSubmit.js detectManagerAgent logic)
 */
function detectManagerAgent(prompt) {
  const lowerPrompt = prompt.toLowerCase();

  const managerDetectionRules = [
    {
      manager: 'build-manager',
      keywords: ['빌드', 'build', 'maven', 'compile', 'package', 'mvn'],
      patterns: [
        /빌드.*?(해|해줘|해주세요|하자)/,
        /(build|compile|package).*?(service|module|project)/i,
        /KiiPS-(FD|IL|PG|AC|SY|LP|EL|RT|BATCH|MOBILE|KSD|AI).*?(빌드|build)/i,
        /(전체|모든|all|multi|multiple|여러).*?(빌드|build)/i
      ],
      skills: ['kiips-maven-builder']
    },
    {
      manager: 'deployment-manager',
      keywords: ['배포', 'deploy', 'start', 'stop', 'restart', '시작', '중지', '재시작', 'health check', '헬스체크'],
      patterns: [
        /(배포|deploy|start|stop|restart).*?(해|해줘|해주세요)/,
        /(전체|모든|all|multi|multiple|여러).*?(배포|deploy)/i,
        /(health|헬스).*?(check|체크|확인)/i
      ],
      skills: ['kiips-service-deployer', 'kiips-api-tester', 'kiips-log-analyzer']
    },
    {
      manager: 'feature-manager',
      keywords: ['feature', '기능', 'develop', '개발', '구현', 'implement'],
      patterns: [
        /(새로운|new).*?(기능|feature)/i,
        /(기능|feature).*?(개발|develop|구현|implement)/i,
        /(개발|develop|구현|implement).*?(기능|feature|module|모듈)/i
      ],
      skills: ['kiips-feature-planner']
    },
    {
      manager: 'ui-manager',
      keywords: ['UI', 'UX', '화면', '페이지', 'page', '그리드', 'grid', 'RealGrid', 'chart', '차트', 'responsive', '반응형', 'dashboard'],
      patterns: [
        /(UI|UX|화면|페이지|page).*?(만들|create|생성|개발)/i,
        /(그리드|grid|RealGrid).*?(사용|use|추가|add)/i,
        /(responsive|반응형).*?(design|디자인|page|페이지)/i,
        /(dashboard|대시보드).*?(만들|create|개발)/i
      ],
      skills: ['kiips-ui-component-builder', 'kiips-realgrid-guide', 'kiips-responsive-validator', 'kiips-a11y-checker', 'kiips-scss-theme-manager']
    }
  ];

  // Complexity assessment
  let complexity = 'single_service';
  if (/(전체|모든|all|multi|multiple|여러)/.test(lowerPrompt)) {
    complexity = 'multi_service';
  }

  // Find matching manager
  for (const rule of managerDetectionRules) {
    // Check keywords
    const keywordMatch = rule.keywords.some(kw => lowerPrompt.includes(kw.toLowerCase()));

    // Check patterns
    const patternMatch = rule.patterns.some(pattern => pattern.test(prompt));

    if (keywordMatch || patternMatch) {
      // For multi-service operations, always use manager
      // For single-service operations, only use manager if complexity warrants it
      if (complexity === 'multi_service' || keywordMatch) {
        return rule.manager;
      }
    }
  }

  return null;
}

module.exports = { run };
