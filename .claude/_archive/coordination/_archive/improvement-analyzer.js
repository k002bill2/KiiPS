#!/usr/bin/env node
/**
 * Improvement Analyzer for KiiPS
 * 수집된 패턴을 분석하고, 리포트를 생성하고, 개선 제안을 만드는 CLI 도구입니다.
 *
 * @version 1.0.0-KiiPS
 * @layer Layer 6 (Task Prosecution) - Self-Improvement Loop
 *
 * Usage:
 *   node .claude/coordination/improvement-analyzer.js analyze   # 패턴 빈도 집계
 *   node .claude/coordination/improvement-analyzer.js report    # 마크다운 리포트 생성
 *   node .claude/coordination/improvement-analyzer.js propose   # 개선 제안 JSON 생성
 */

'use strict';

const fs = require('fs');
const path = require('path');

// ─── 경로 상수 ──────────────────────────────────────────────────────────────
const WORKSPACE_ROOT = path.resolve(__dirname, '../..');
const IMPROVEMENT_ROOT = path.join(WORKSPACE_ROOT, '.temp/improvement');
const PATTERNS_DIR = path.join(IMPROVEMENT_ROOT, 'patterns');
const FAILURES_DIR = path.join(PATTERNS_DIR, 'failures');
const SUCCESSES_DIR = path.join(PATTERNS_DIR, 'successes');
const REPORTS_DIR = path.join(IMPROVEMENT_ROOT, 'reports');
const PROPOSALS_DIR = path.join(IMPROVEMENT_ROOT, 'proposals');

// ─── 설정 ───────────────────────────────────────────────────────────────────
const CONFIG = {
  proposalThreshold: 5,   // 빈도 이 이상이면 개선 제안 생성
  topPatternsCount: 10,   // 리포트에 표시할 상위 패턴 수
};

// ─── 카테고리 분류 ───────────────────────────────────────────────────────────
const PATTERN_CATEGORIES = {
  'agent_spawn': {
    label: 'Agent Spawn Errors',
    keywords: ['agent spawn', 'agent_type', 'spawn followed by error'],
  },
  'repeated_edit': {
    label: 'Repeated File Edits',
    keywords: ['repeated file modifications', 'file modification'],
  },
  'incomplete_delegation': {
    label: 'Incomplete Task Delegation',
    keywords: ['task tool', 'result missing', 'incomplete'],
  },
  'success': {
    label: 'Successful Completions',
    keywords: ['completed successfully', 'all.*agent'],
  },
  'other': {
    label: 'Other Patterns',
    keywords: [],
  },
};

/**
 * 패턴 description으로 카테고리를 결정합니다.
 * @param {string} description
 * @returns {string} 카테고리 키
 */
function categorize(description) {
  const lower = description.toLowerCase();
  for (const [key, cat] of Object.entries(PATTERN_CATEGORIES)) {
    if (key === 'other') continue;
    const matches = cat.keywords.some(kw => {
      // 정규식 패턴(.*) 지원
      if (kw.includes('.*')) {
        return new RegExp(kw, 'i').test(lower);
      }
      return lower.includes(kw);
    });
    if (matches) return key;
  }
  return 'other';
}

// ─── 공통 유틸 ───────────────────────────────────────────────────────────────

/**
 * 디렉토리 생성
 */
function ensureDirs() {
  [FAILURES_DIR, SUCCESSES_DIR, REPORTS_DIR, PROPOSALS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
}

/**
 * 디렉토리에서 모든 JSON 파일 읽기
 * @param {string} dir
 * @returns {Array<Object>}
 */
function readAllJson(dir) {
  if (!fs.existsSync(dir)) return [];
  try {
    return fs.readdirSync(dir)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try {
          return JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
  } catch (e) {
    return [];
  }
}

/**
 * 현재 날짜를 YYYY-MM-DD 형식으로 반환
 * @returns {string}
 */
function todayString() {
  return new Date().toISOString().split('T')[0];
}

// ─── ANALYZE 명령 ────────────────────────────────────────────────────────────

/**
 * 패턴 분석: .temp/improvement/patterns/ 의 모든 JSON 읽어서
 * 빈도 집계 및 카테고리 분류 결과를 반환합니다.
 *
 * @returns {Object} 분석 결과
 */
function analyze() {
  const failures = readAllJson(FAILURES_DIR);
  const successes = readAllJson(SUCCESSES_DIR);
  const allPatterns = [...failures, ...successes];

  if (allPatterns.length === 0) {
    return {
      total: 0,
      failure_count: 0,
      success_count: 0,
      by_description: {},
      by_category: {},
      top_patterns: [],
      analyzed_at: new Date().toISOString(),
    };
  }

  // description별 빈도 집계
  const byDescription = {};
  for (const p of allPatterns) {
    const key = p.description || 'unknown';
    if (!byDescription[key]) {
      byDescription[key] = {
        description: key,
        type: p.type,
        total_frequency: 0,
        session_ids: [],
        category: categorize(key),
        latest_detected_at: p.detected_at || '',
      };
    }
    // 각 패턴 파일의 frequency는 "이 description의 누적 발생 횟수"이므로
    // 파일 수를 더하는 방식(1씩)으로 집계합니다.
    byDescription[key].total_frequency += 1;
    if (p.session_id && !byDescription[key].session_ids.includes(p.session_id)) {
      byDescription[key].session_ids.push(p.session_id);
    }
    // 최신 detected_at 유지
    if (p.detected_at && p.detected_at > byDescription[key].latest_detected_at) {
      byDescription[key].latest_detected_at = p.detected_at;
    }
  }

  // 카테고리별 집계
  const byCategory = {};
  for (const entry of Object.values(byDescription)) {
    const cat = entry.category;
    if (!byCategory[cat]) {
      byCategory[cat] = {
        label: PATTERN_CATEGORIES[cat]?.label || cat,
        count: 0,
        total_frequency: 0,
        types: { failure: 0, success: 0 },
      };
    }
    byCategory[cat].count++;
    byCategory[cat].total_frequency += entry.total_frequency;
    byCategory[cat].types[entry.type] = (byCategory[cat].types[entry.type] || 0) + 1;
  }

  // 상위 패턴 (빈도 내림차순)
  const topPatterns = Object.values(byDescription)
    .sort((a, b) => b.total_frequency - a.total_frequency)
    .slice(0, CONFIG.topPatternsCount);

  return {
    total: allPatterns.length,
    failure_count: failures.length,
    success_count: successes.length,
    by_description: byDescription,
    by_category: byCategory,
    top_patterns: topPatterns,
    analyzed_at: new Date().toISOString(),
  };
}

// ─── REPORT 명령 ─────────────────────────────────────────────────────────────

/**
 * 마크다운 리포트 생성
 * 분석 결과를 마크다운으로 출력하고 .temp/improvement/reports/ 에 저장합니다.
 *
 * @returns {string} 생성된 리포트 파일 경로
 */
function report() {
  ensureDirs();
  const result = analyze();
  const date = todayString();
  const ts = new Date().toISOString();

  // ── 마크다운 작성 ──
  const lines = [];

  lines.push(`# KiiPS Agent Improvement Report`);
  lines.push(`**Generated**: ${ts}`);
  lines.push(`**Date**: ${date}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // 요약 섹션
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total patterns collected | ${result.total} |`);
  lines.push(`| Failure patterns | ${result.failure_count} |`);
  lines.push(`| Success patterns | ${result.success_count} |`);
  lines.push(`| Unique descriptions | ${Object.keys(result.by_description).length} |`);
  lines.push(`| Proposal threshold (frequency >= ${CONFIG.proposalThreshold}) | ${
    Object.values(result.by_description).filter(d => d.total_frequency >= CONFIG.proposalThreshold && d.type === 'failure').length
  } patterns |`);
  lines.push('');

  if (result.total === 0) {
    lines.push('> No patterns collected yet. Run sessions to generate data.');
    lines.push('');
  }

  // 카테고리별 분류
  if (Object.keys(result.by_category).length > 0) {
    lines.push('## Patterns by Category');
    lines.push('');
    lines.push(`| Category | Unique Patterns | Total Frequency | Failures | Successes |`);
    lines.push(`|----------|-----------------|-----------------|----------|-----------|`);

    const sortedCategories = Object.entries(result.by_category)
      .sort((a, b) => b[1].total_frequency - a[1].total_frequency);

    for (const [, cat] of sortedCategories) {
      lines.push(
        `| ${cat.label} | ${cat.count} | ${cat.total_frequency} | ${cat.types.failure || 0} | ${cat.types.success || 0} |`
      );
    }
    lines.push('');
  }

  // 상위 패턴 목록
  if (result.top_patterns.length > 0) {
    lines.push(`## Top ${result.top_patterns.length} Patterns (by frequency)`);
    lines.push('');

    for (let i = 0; i < result.top_patterns.length; i++) {
      const p = result.top_patterns[i];
      const emoji = p.type === 'failure' ? '[FAIL]' : '[OK]';
      const needsProposal = p.type === 'failure' && p.total_frequency >= CONFIG.proposalThreshold;
      lines.push(`### ${i + 1}. ${emoji} ${p.description}`);
      lines.push('');
      lines.push(`- **Type**: ${p.type}`);
      lines.push(`- **Category**: ${PATTERN_CATEGORIES[p.category]?.label || p.category}`);
      lines.push(`- **Frequency**: ${p.total_frequency}`);
      lines.push(`- **Affected sessions**: ${p.session_ids.length}`);
      lines.push(`- **Latest occurrence**: ${p.latest_detected_at}`);
      if (needsProposal) {
        lines.push(`- **Action required**: Improvement proposal recommended (frequency >= ${CONFIG.proposalThreshold})`);
      }
      lines.push('');
    }
  }

  // 권장 사항
  lines.push('## Recommendations');
  lines.push('');

  const highFreqFailures = Object.values(result.by_description)
    .filter(d => d.type === 'failure' && d.total_frequency >= CONFIG.proposalThreshold);

  if (highFreqFailures.length > 0) {
    lines.push(`### Immediate Action Required (${highFreqFailures.length} patterns)`);
    lines.push('');
    for (const p of highFreqFailures) {
      lines.push(`- **${p.description}** (frequency: ${p.total_frequency})`);
    }
    lines.push('');
    lines.push('Run the following to generate proposals:');
    lines.push('```bash');
    lines.push('node .claude/coordination/improvement-analyzer.js propose');
    lines.push('```');
    lines.push('');
  } else {
    lines.push('No patterns have reached the proposal threshold yet.');
    lines.push(`Threshold: failure pattern frequency >= ${CONFIG.proposalThreshold}`);
    lines.push('');
  }

  lines.push('---');
  lines.push('');
  lines.push('*Generated by improvement-analyzer.js v1.0.0-KiiPS*');

  const reportContent = lines.join('\n');

  // 파일 저장
  const reportFileName = `report_${date}_${Date.now()}.md`;
  const reportPath = path.join(REPORTS_DIR, reportFileName);
  fs.writeFileSync(reportPath, reportContent, 'utf8');

  // stdout 출력
  console.log(reportContent);
  console.error(`\n[ImprovementAnalyzer] Report saved: ${reportPath}`);

  return reportPath;
}

// ─── PROPOSE 명령 ────────────────────────────────────────────────────────────

/**
 * 개선 제안 생성
 * 빈도 CONFIG.proposalThreshold 이상인 실패 패턴에 대해 제안 JSON 생성.
 *
 * @returns {Array<Object>} 생성된 제안 목록
 */
function propose() {
  ensureDirs();
  const result = analyze();

  const highFreqFailures = Object.values(result.by_description)
    .filter(d => d.type === 'failure' && d.total_frequency >= CONFIG.proposalThreshold)
    .sort((a, b) => b.total_frequency - a.total_frequency);

  if (highFreqFailures.length === 0) {
    console.log(JSON.stringify({
      status: 'no_proposals',
      message: `No failure patterns with frequency >= ${CONFIG.proposalThreshold}`,
      total_failure_patterns: result.failure_count,
      threshold: CONFIG.proposalThreshold,
    }, null, 2));
    return [];
  }

  const proposals = [];

  for (const pattern of highFreqFailures) {
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const category = pattern.category;

    // 카테고리별 구체적인 개선 제안 생성
    const recommendation = buildRecommendation(category, pattern);

    const proposal = {
      proposal_id: proposalId,
      pattern_description: pattern.description,
      pattern_type: pattern.type,
      category: category,
      category_label: PATTERN_CATEGORIES[category]?.label || category,
      frequency: pattern.total_frequency,
      affected_sessions: pattern.session_ids,
      priority: pattern.total_frequency >= CONFIG.proposalThreshold * 2 ? 'high' : 'medium',
      recommendation: recommendation,
      proposed_at: new Date().toISOString(),
      status: 'proposed',
    };

    proposals.push(proposal);

    // 파일 저장
    const fileName = `${proposalId}.json`;
    const filePath = path.join(PROPOSALS_DIR, fileName);
    fs.writeFileSync(filePath, JSON.stringify(proposal, null, 2), 'utf8');
  }

  // stdout 출력
  console.log(JSON.stringify({
    status: 'proposals_generated',
    count: proposals.length,
    proposals_dir: PROPOSALS_DIR,
    proposals: proposals,
  }, null, 2));

  console.error(`\n[ImprovementAnalyzer] ${proposals.length} proposal(s) saved to: ${PROPOSALS_DIR}`);

  return proposals;
}

/**
 * 카테고리 및 패턴 정보 기반으로 구체적인 개선 권고사항을 생성합니다.
 * @param {string} category
 * @param {Object} pattern
 * @returns {Object}
 */
function buildRecommendation(category, pattern) {
  const base = {
    summary: '',
    target_file: '',
    action: '',
    rationale: `Frequency ${pattern.total_frequency} exceeds threshold ${CONFIG.proposalThreshold}.`,
  };

  switch (category) {
    case 'agent_spawn':
      return {
        ...base,
        summary: 'Add error handling after agent spawn in Task tool calls',
        target_file: '.claude/hooks/agentTracer.js',
        action: [
          'Add error event recording to agentTracer.js (currently only records agent_spawned)',
          'In SKILL.md or agent prompt: Add explicit error recovery steps after Task spawn',
          'Consider adding a PostToolUse:Task error handler hook',
        ],
      };

    case 'repeated_edit':
      return {
        ...base,
        summary: 'Reduce repeated file edits by improving initial analysis',
        target_file: 'CLAUDE.md (Editing Rules section)',
        action: [
          'Enforce "Read file before Edit" pattern in agent instructions',
          'Add checkpoint before bulk edits (CLAUDE.md rule: "체크포인트")',
          'Use Search/Grep before Edit to verify current state',
          'Consider adding a pre-edit hook that warns on 2nd+ edit to same file',
        ],
      };

    case 'incomplete_delegation':
      return {
        ...base,
        summary: 'Ensure Task delegations have explicit completion signals',
        target_file: '.claude/hooks/agentTracer.js',
        action: [
          'Record task_completed events in agentTracer.js (PostToolUse:Task result)',
          'In Task tool calls: require explicit "return result" instruction in description',
          'Add timeout detection for long-running sub-agents',
          'Update CLAUDE.md to require completion confirmation in delegation patterns',
        ],
      };

    case 'success':
      return {
        ...base,
        summary: 'Capture and replicate successful delegation patterns',
        target_file: '.claude/skills/',
        action: [
          'Extract successful agent interaction patterns as SKILL.md templates',
          'Document the agent_types and task structures that consistently succeed',
          'Add success pattern examples to relevant SKILL.md files',
        ],
        rationale: `${pattern.total_frequency} successful completions recorded - patterns worth capturing.`,
      };

    default:
      return {
        ...base,
        summary: `Investigate and address pattern: "${pattern.description}"`,
        target_file: '.claude/coordination/',
        action: [
          `Manually review pattern occurrences in: .temp/improvement/patterns/failures/`,
          'Identify root cause from session events in .temp/traces/sessions/',
          'Propose targeted fix after manual inspection',
        ],
      };
  }
}

// ─── 진입점 ─────────────────────────────────────────────────────────────────

const COMMANDS = {
  analyze: () => {
    const result = analyze();
    console.log(JSON.stringify(result, null, 2));
  },
  report: () => {
    report();
  },
  propose: () => {
    propose();
  },
};

const command = process.argv[2];

if (!command || !COMMANDS[command]) {
  console.log(JSON.stringify({
    usage: 'node .claude/coordination/improvement-analyzer.js <command>',
    commands: {
      analyze: 'Read all pattern JSONs, aggregate frequencies, categorize by type',
      report:  'Generate markdown report + save to .temp/improvement/reports/',
      propose: 'Generate improvement proposals for high-frequency failure patterns',
    },
    pattern_dirs: {
      failures: FAILURES_DIR,
      successes: SUCCESSES_DIR,
    },
    proposal_threshold: CONFIG.proposalThreshold,
    version: '1.0.0-KiiPS',
  }, null, 2));
  process.exit(0);
}

try {
  COMMANDS[command]();
} catch (err) {
  console.error(`[ImprovementAnalyzer] Error running "${command}":`, err.message);
  process.exit(1);
}
