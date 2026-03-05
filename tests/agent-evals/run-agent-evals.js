#!/usr/bin/env node

/**
 * KiiPS AI Agent Evaluation Runner (v2.0)
 *
 * Main entry point for running agent evaluations.
 * Based on Anthropic's "Demystifying Evals for AI Agents" guide.
 *
 * Usage:
 *   node run-agent-evals.js                    # Run all suites (k=3)
 *   node run-agent-evals.js --suite skill      # Run skill evals only
 *   node run-agent-evals.js --k 5              # Run with 5 trials
 *   node run-agent-evals.js --grader llm       # Use LLM grader
 *   node run-agent-evals.js --json             # JSON output for CI/CD
 *   node run-agent-evals.js --trend            # Include trend analysis
 *
 * @see https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents
 */

const fs = require('fs');
const path = require('path');
const EvalHarness = require('./lib/eval-harness');
const CodeGrader = require('./lib/graders/code-grader');
const ConsoleReporter = require('./lib/reporters/console-reporter');
const MarkdownReporter = require('./lib/reporters/markdown-reporter');

// New v2.0 imports
let JSONReporter, TrendAnalyzer, LLMGrader;
try {
  JSONReporter = require('./lib/reporters/json-reporter');
  TrendAnalyzer = require('./lib/reporters/trend-analyzer');
  LLMGrader = require('./lib/graders/llm-grader');
} catch (e) {
  // Optional modules - graceful fallback
}

// Parse command line arguments
const args = process.argv.slice(2);

/**
 * Extract argument value from CLI args
 * @param {string} flag - The flag to look for
 * @returns {string|null} The value or null
 */
function getArgValue(flag) {
  const index = args.indexOf(flag);
  if (index !== -1 && args[index + 1] && !args[index + 1].startsWith('-')) {
    return args[index + 1];
  }
  return null;
}

const options = {
  suite: getArgValue('--suite'),
  task: getArgValue('--task'),
  k: parseInt(getArgValue('--k') || '3', 10),
  grader: getArgValue('--grader') || 'code',
  verbose: args.includes('--verbose') || args.includes('-v'),
  real: args.includes('--real'),
  json: args.includes('--json'),
  trend: args.includes('--trend'),
  regression: args.includes('--regression'),
  help: args.includes('--help') || args.includes('-h')
};

// Show help
if (options.help) {
  console.log(`
KiiPS AI Agent Evaluation Runner (v2.0)
Based on Anthropic's "Demystifying Evals for AI Agents" Guide

Usage:
  node run-agent-evals.js [options]

Options:
  --suite <name>     Run specific suite (skill, agent, workflow)
  --task <id>        Run specific task only
  --k <n>            Number of trials per task (default: 3)
  --grader <type>    Grader type: code, llm, all (default: code)
  --json             Output JSON for CI/CD integration
  --trend            Include trend analysis in output
  --regression       Check for performance regression
  --verbose, -v      Show detailed output
  --real             Enable real execution mode
  --help, -h         Show this help message

Examples:
  node run-agent-evals.js                     # Run all suites (k=3)
  node run-agent-evals.js --suite skill       # Run skill evals only
  node run-agent-evals.js --k 5               # Run with 5 trials
  node run-agent-evals.js --grader llm        # Use LLM grader (claude-sonnet-4)
  node run-agent-evals.js --json              # CI/CD mode with JSON output
  node run-agent-evals.js --trend             # Include trend analysis

Metrics:
  Pass@k  - Probability of at least 1 success in k trials
  Pass^k  - Probability of ALL k trials succeeding
`);
  process.exit(0);
}

// Load configuration
const configPath = path.join(__dirname, 'evals.config.json');
let config;

try {
  config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (error) {
  console.error('Failed to load config:', error.message);
  process.exit(1);
}

// Override config based on CLI options
if (options.real) {
  config.environment.mode = 'real';
  config.environment.mockByDefault = false;
}

if (options.verbose) {
  config.output.verbose = true;
}

/**
 * Load evaluation suites
 */
function loadSuites() {
  const suites = [];
  const suitesDir = path.join(__dirname, 'suites');

  // Define suite types and their paths
  const suiteTypes = {
    'skill-evals': {
      path: path.join(suitesDir, 'skill-evals'),
      type: 'skill-evals'
    },
    'agent-evals': {
      path: path.join(suitesDir, 'agent-evals'),
      type: 'agent-evals'
    },
    'workflow-evals': {
      path: path.join(suitesDir, 'workflow-evals'),
      type: 'workflow-evals'
    }
  };

  // Filter suites if specific suite requested
  const targetSuites = options.suite
    ? Object.entries(suiteTypes).filter(([key]) =>
        key.startsWith(options.suite) || key.includes(options.suite)
      )
    : Object.entries(suiteTypes);

  for (const [name, suiteConfig] of targetSuites) {
    if (!config.suites[suiteConfig.type]?.enabled) {
      continue;
    }

    if (!fs.existsSync(suiteConfig.path)) {
      console.log(`Suite directory not found: ${suiteConfig.path}`);
      continue;
    }

    // Load all .eval.js files in the suite directory
    const files = fs.readdirSync(suiteConfig.path)
      .filter(f => f.endsWith('.eval.js'));

    for (const file of files) {
      try {
        const suiteDef = require(path.join(suiteConfig.path, file));
        suites.push({
          ...suiteDef,
          type: suiteConfig.type,
          file: file
        });
      } catch (error) {
        console.error(`Failed to load suite ${file}:`, error.message);
      }
    }
  }

  // If no suites loaded, create a demo suite
  if (suites.length === 0) {
    console.log('No evaluation suites found. Running demo evaluation...\n');
    suites.push(createDemoSuite());
  }

  return suites;
}

/**
 * Create a demo evaluation suite for testing the framework
 */
function createDemoSuite() {
  return {
    name: 'Demo Skill Activation Eval',
    type: 'skill-evals',
    parallel: true,
    tasks: [
      {
        id: 'demo-maven-builder-activation',
        input: { prompt: 'KiiPS-FD 빌드해줘' },
        graders: [
          {
            type: 'activation',
            method: 'activation',
            expect: ['kiips-maven-builder']
          }
        ]
      },
      {
        id: 'demo-service-deployer-activation',
        input: { prompt: 'KiiPS-IL 서비스 배포해줘' },
        graders: [
          {
            type: 'activation',
            method: 'activation',
            expect: ['kiips-service-deployer']
          }
        ]
      },
      {
        id: 'demo-ui-skills-activation',
        input: { prompt: 'RealGrid로 펀드 목록 화면 만들어줘' },
        graders: [
          {
            type: 'activation',
            method: 'activation',
            expect: ['kiips-realgrid-guide', 'kiips-ui-component-builder']
          }
        ]
      },
      {
        id: 'demo-log-analyzer-activation',
        input: { prompt: '에러 로그 분석해줘' },
        graders: [
          {
            type: 'activation',
            method: 'activation',
            expect: ['kiips-log-analyzer']
          }
        ]
      },
      {
        id: 'demo-feature-planner-activation',
        input: { prompt: '새 기능 개발 계획 세워줘' },
        graders: [
          {
            type: 'activation',
            method: 'activation',
            expect: ['kiips-feature-planner']
          }
        ]
      }
    ]
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('');
  console.log('🚀 Starting KiiPS AI Agent Evaluation (v2.0)...');
  console.log(`   k=${options.k} trials | grader=${options.grader}`);
  console.log('');

  // Initialize harness
  const harness = new EvalHarness(config);

  // Register code-based graders
  harness.registerGrader('code', new CodeGrader(config.graders.types.code));
  harness.registerGrader('activation', new CodeGrader(config.graders.types.code));
  harness.registerGrader('pattern', new CodeGrader(config.graders.types.code));
  harness.registerGrader('artifact', new CodeGrader(config.graders.types.code));
  harness.registerGrader('structure', new CodeGrader(config.graders.types.code));
  harness.registerGrader('command', new CodeGrader(config.graders.types.code));
  harness.registerGrader('state', new CodeGrader(config.graders.types.code));
  harness.registerGrader('toolCall', new CodeGrader(config.graders.types.code));
  harness.registerGrader('decomposition', new CodeGrader(config.graders.types.code));
  harness.registerGrader('workerAssignment', new CodeGrader(config.graders.types.code));

  // Register LLM grader if requested and available
  if ((options.grader === 'llm' || options.grader === 'all') && LLMGrader) {
    const llmGrader = new LLMGrader(config.graders?.llm || {
      model: 'claude-sonnet-4',
      rubricPath: path.join(__dirname, 'rubrics')
    });
    harness.registerGrader('llm', llmGrader);
    console.log('   LLM Grader enabled (claude-sonnet-4)\n');
  }

  // Register reporters
  const consoleReporter = new ConsoleReporter({
    verbose: config.output.verbose,
    colors: config.output.colors
  });
  consoleReporter.attachToHarness(harness);
  harness.registerReporter(consoleReporter);

  const markdownReporter = new MarkdownReporter({
    outputDir: path.join(__dirname, config.output.resultsDir),
    includeConfig: true
  });
  harness.registerReporter(markdownReporter);

  // Register JSON reporter if requested and available
  if (options.json && JSONReporter) {
    const jsonReporter = new JSONReporter({
      outputDir: path.join(__dirname, config.output.resultsDir),
      historyFile: 'history.jsonl'
    });
    harness.registerReporter(jsonReporter);
  }

  // Load and run suites
  let suites = loadSuites();

  // Filter by specific task if requested
  if (options.task) {
    suites = suites.map(suite => ({
      ...suite,
      tasks: suite.tasks.filter(task => task.id === options.task || task.id.includes(options.task))
    })).filter(suite => suite.tasks.length > 0);
  }

  if (suites.length === 0) {
    console.log('No suites to run.');
    process.exit(0);
  }

  const totalTasks = suites.reduce((sum, s) => sum + s.tasks.length, 0);
  console.log(`Found ${suites.length} suite(s), ${totalTasks} task(s)\n`);

  try {
    // Run evaluation with k trials
    const results = await harness.runAll(suites, { k: options.k });

    // Add k value to results
    results.k = options.k;

    // Trend analysis if requested
    if (options.trend && TrendAnalyzer) {
      const analyzer = new TrendAnalyzer({
        historyFile: path.join(__dirname, config.output.resultsDir, 'history.jsonl')
      });
      const trendReport = analyzer.generateTrendReport(30);

      console.log('\n📈 Trend Analysis (Last 30 Days):');
      console.log('─'.repeat(50));

      if (trendReport.status === 'ok') {
        const trend = trendReport.trend.passRate;
        const arrow = trend.direction === 'improving' ? '↗' :
          (trend.direction === 'declining' ? '↘' : '→');
        console.log(`   Direction: ${arrow} ${trend.direction}`);
        console.log(`   Change: ${trend.change >= 0 ? '+' : ''}${(trend.change * 100).toFixed(1)}%`);
        console.log(`   Mean: ${(trendReport.statistics.mean * 100).toFixed(1)}%`);
        console.log(`   Std Dev: ${(trendReport.statistics.stdDev * 100).toFixed(1)}%`);
      } else {
        console.log(`   ${trendReport.message}`);
      }

      // Regression check
      if (options.regression) {
        const regression = analyzer.detectRegression(results);
        if (regression.hasRegression) {
          console.log('\n⚠️  REGRESSION DETECTED');
          console.log(`   Severity: ${regression.severity}`);
          console.log(`   Current: ${(regression.currentPassRate * 100).toFixed(1)}%`);
          console.log(`   Recent Avg: ${(regression.recentAverage * 100).toFixed(1)}%`);
          console.log(`   Change: ${(regression.change * 100).toFixed(1)}%`);
          if (regression.recommendation) {
            console.log(`\n   ${regression.recommendation}`);
          }
        }
      }
    }

    // Display Pass@k and Pass^k summary
    if (options.k > 1 && results.metrics) {
      console.log('\n📊 Multi-Trial Metrics:');
      console.log('─'.repeat(50));
      console.log(`   Pass@1: ${((results.metrics['pass@1'] || 0) * 100).toFixed(1)}%`);
      console.log(`   Pass@${options.k}: ${((results.metrics[`pass@${options.k}`] || 0) * 100).toFixed(1)}%`);
      console.log(`   Pass^1: ${((results.metrics['pass^1'] || 0) * 100).toFixed(1)}%`);
      console.log(`   Pass^${options.k}: ${((results.metrics[`pass^${options.k}`] || 0) * 100).toFixed(1)}%`);
    }

    // Exit with appropriate code
    const threshold = config.metrics?.passRateThreshold || 0.85;
    const passed = results.summary.overallPassRate >= threshold;

    if (options.json && JSONReporter) {
      console.log(`\n📄 JSON output: ${path.join(config.output.resultsDir, 'latest.json')}`);
    }

    process.exit(passed ? 0 : 1);

  } catch (error) {
    console.error('Evaluation failed:', error);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = { loadSuites, createDemoSuite };
