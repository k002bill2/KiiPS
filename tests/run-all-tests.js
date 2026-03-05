#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const tests = [
  { name: 'Configuration', file: './test-config.js' },
  { name: 'Skills', file: './test-skills.js' },
  { name: 'Hook Activation', file: './test-hook-activation.js' },
  { name: 'ACE Framework', file: './test-ace-framework.js' },
  { name: 'Agent Evals', file: './agent-evals/run-agent-evals.js', isAgentEval: true }
];

async function runAllTests() {
  console.log('🧪 KiiPS SYSTEM INTEGRITY TESTS\n');
  console.log('Testing system components...\n');

  const results = [];
  let totalTests = 0;
  let passedTests = 0;

  for (const test of tests) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`📋 Running ${test.name} Tests...`);
    console.log(`${'='.repeat(60)}`);

    try {
      // Handle Agent Evals specially (spawned as subprocess)
      if (test.isAgentEval) {
        const { execSync } = require('child_process');
        const evalPath = path.join(__dirname, 'agent-evals/run-agent-evals.js');

        try {
          execSync(`node ${evalPath}`, {
            cwd: path.join(__dirname, 'agent-evals'),
            stdio: 'inherit',
            timeout: 120000
          });
          totalTests++;
          passedTests++;
          console.log(`\n✅ ${test.name}: PASS`);
          results.push({ name: test.name, passed: true });
        } catch (evalError) {
          totalTests++;
          console.log(`\n❌ ${test.name}: FAIL`);
          results.push({ name: test.name, passed: false, error: 'Agent evaluation failed' });
        }
        continue;
      }

      const testModule = require(test.file);
      const result = await testModule.run();

      totalTests++;
      if (result.passed) {
        passedTests++;
        console.log(`\n✅ ${test.name}: PASS`);
      } else {
        console.log(`\n❌ ${test.name}: FAIL`);
        if (result.details) {
          console.log('\nDetails:');
          console.log(JSON.stringify(result.details, null, 2));
        }
      }

      results.push({ name: test.name, ...result });
    } catch (error) {
      totalTests++;
      console.log(`\n❌ ${test.name}: ERROR - ${error.message}`);
      results.push({ name: test.name, passed: false, error: error.message });
    }
  }

  generateReport(results, totalTests, passedTests);
}

function generateReport(results, total, passed) {
  const passRate = ((passed / total) * 100).toFixed(1);

  console.log(`\n${'='.repeat(60)}`);
  console.log('📊 TEST SUMMARY');
  console.log(`${'='.repeat(60)}`);
  console.log(`Total Tests: ${total}`);
  console.log(`Passed:      ${passed} ✅`);
  console.log(`Failed:      ${total - passed} ❌`);
  console.log(`Pass Rate:   ${passRate}%`);
  console.log(`${'='.repeat(60)}\n`);

  // Generate markdown report
  const reportDate = new Date().toISOString().split('T')[0];
  const reportPath = path.join(__dirname, `test-results/report-${reportDate}.md`);
  const reportContent = generateMarkdownReport(results, passRate, reportDate);

  fs.writeFileSync(reportPath, reportContent);
  console.log(`📄 Detailed report saved: ${reportPath}\n`);

  // Exit with appropriate code
  process.exit(passed === total ? 0 : 1);
}

function generateMarkdownReport(results, passRate, reportDate) {
  const timestamp = new Date().toISOString();

  let report = `# KiiPS System Integrity Test Report\n\n`;
  report += `**Date**: ${reportDate}\n`;
  report += `**Timestamp**: ${timestamp}\n`;
  report += `**Pass Rate**: ${passRate}%\n\n`;
  report += `---\n\n`;

  report += `## Summary\n\n`;
  report += `| Test Suite | Status | Details |\n`;
  report += `|------------|--------|----------|\n`;

  for (const result of results) {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    const details = result.passed ? 'All checks passed' : 'See details below';
    report += `| ${result.name} | ${status} | ${details} |\n`;
  }

  report += `\n---\n\n`;

  // Detailed results
  for (const result of results) {
    report += `## ${result.name} Test\n\n`;
    report += `**Status**: ${result.passed ? '✅ PASSED' : '❌ FAILED'}\n\n`;

    if (result.details) {
      report += `### Details\n\n`;
      if (Array.isArray(result.details)) {
        for (const detail of result.details) {
          if (typeof detail === 'object') {
            report += `- **${detail.message || detail.skill || detail.file || 'Item'}**: `;
            report += `${detail.status || detail.passed ? '✅' : '❌'}\n`;
          } else {
            report += `- ${detail}\n`;
          }
        }
      } else {
        report += `\`\`\`json\n${JSON.stringify(result.details, null, 2)}\n\`\`\`\n`;
      }
      report += `\n`;
    }

    if (result.error) {
      report += `### Error\n\n`;
      report += `\`\`\`\n${result.error}\n\`\`\`\n\n`;
    }

    report += `---\n\n`;
  }

  report += `## Recommendations\n\n`;

  const failed = results.filter(r => !r.passed);
  if (failed.length === 0) {
    report += `✅ **All tests passed!** Your KiiPS system is healthy.\n\n`;
    report += `- System health: 100%\n`;
    report += `- All configurations valid\n`;
    report += `- All skills present and complete\n`;
    report += `- Hook activation working correctly\n`;
    report += `- ACE Framework fully operational\n`;
  } else {
    report += `⚠️ **${failed.length} test(s) failed.** Please review and fix:\n\n`;
    for (const fail of failed) {
      report += `### ${fail.name}\n\n`;
      if (fail.details) {
        report += `**Issues found**:\n`;
        if (Array.isArray(fail.details)) {
          for (const detail of fail.details) {
            if (!detail.passed || detail.status === 'MISSING' || detail.status === 'INCOMPLETE') {
              report += `- ${detail.message || detail.skill || detail.file}\n`;
            }
          }
        }
      }
      report += `\n`;
    }
  }

  report += `\n---\n\n`;
  report += `*Generated by KiiPS System Integrity Tests*\n`;

  return report;
}

// Run tests
runAllTests().catch(error => {
  console.error('❌ Fatal error running tests:', error);
  process.exit(1);
});
