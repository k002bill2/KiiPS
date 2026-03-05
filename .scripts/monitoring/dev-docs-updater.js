/**
 * Dev Docs Updater - Dev Docs 자동 업데이트
 *
 * 로그 분석 결과를 dev/active/log-analysis-summary.md에 기록합니다.
 */

const fs = require('fs');
const path = require('path');

class DevDocsUpdater {
  constructor(config) {
    this.config = config;
    this.devDocsPath = path.join(process.cwd(), config.devDocs.path);

    // dev/active 디렉토리 생성
    const devDir = path.dirname(this.devDocsPath);
    if (!fs.existsSync(devDir)) {
      fs.mkdirSync(devDir, { recursive: true });
    }
  }

  /**
   * 분석 결과로 Dev Docs 업데이트
   * @param {object} analysis - 단일 분석 결과
   */
  async updateFromSingleAnalysis(analysis) {
    const content = this.generateSingleServiceReport(analysis);
    await this.writeDevDocs(content);
  }

  /**
   * 집계된 분석 결과로 Dev Docs 업데이트
   * @param {object} aggregated - 집계된 분석 결과
   * @param {object[]} allAnalyses - 모든 분석 결과
   */
  async updateFromAggregated(aggregated, allAnalyses) {
    const content = this.generateAggregatedReport(aggregated, allAnalyses);
    await this.writeDevDocs(content);
  }

  /**
   * 단일 서비스 리포트 생성
   */
  generateSingleServiceReport(analysis) {
    const timestamp = new Date().toISOString();
    const actionItems = this.extractActionItems(analysis);

    let content = `# 로그 분석 요약 (자동 생성)

**생성 시간**: ${timestamp}
**서비스**: ${analysis.service}
**분석 파일**: \`${analysis.filePath}\`

---

## 🚨 Critical Alerts

`;

    if (analysis.hasCritical) {
      const criticalErrors = analysis.errors.filter(e => e.severity === 'critical');
      content += `⚠️ **${criticalErrors.length}개의 Critical 에러 감지**\n\n`;

      criticalErrors.slice(0, 5).forEach((error, idx) => {
        content += `### ${idx + 1}. ${error.type}\n`;
        content += `- **메시지**: ${error.message}\n`;
        content += `- **라인**: ${error.line}\n`;
        if (error.timestamp) {
          content += `- **시각**: ${error.timestamp}\n`;
        }
        if (error.stackTrace) {
          content += `- **스택 트레이스**:\n\`\`\`\n${error.stackTrace.split('\n').slice(0, 10).join('\n')}\n\`\`\`\n`;
        }
        content += '\n';
      });
    } else {
      content += '✅ Critical 에러 없음\n\n';
    }

    content += `---

## 📊 통계

| 항목 | 수량 |
|------|------|
| 총 라인 수 | ${analysis.stats.totalLines} |
| Critical 에러 | ${analysis.stats.criticalCount} |
| 일반 에러 | ${analysis.stats.errorCount} |
| 경고 | ${analysis.stats.warningCount} |
| Slow Query | ${analysis.stats.slowQueryCount} |

`;

    if (analysis.errors.length > 0) {
      content += `### 에러 타입별 분포

`;
      const errorsByType = {};
      analysis.errors.forEach(e => {
        errorsByType[e.type] = (errorsByType[e.type] || 0) + 1;
      });

      Object.entries(errorsByType)
        .sort((a, b) => b[1] - a[1])
        .forEach(([type, count]) => {
          content += `- **${type}**: ${count}건\n`;
        });
      content += '\n';
    }

    if (analysis.slowQueries.length > 0) {
      content += `### Slow Queries (Top 5)

`;
      analysis.slowQueries.slice(0, 5).forEach((query, idx) => {
        content += `${idx + 1}. **${query.value}ms** (threshold: ${query.threshold}ms) - Line ${query.line}\n`;
        content += `   \`\`\`\n   ${query.message}\n   \`\`\`\n\n`;
      });
    }

    content += `---

## ✅ Action Items

`;

    if (actionItems.length > 0) {
      actionItems.forEach((item, idx) => {
        content += `${idx + 1}. ${item}\n`;
      });
    } else {
      content += '✨ 모든 로그가 정상입니다.\n';
    }

    content += `\n---

## 📝 Notes

- 이 문서는 자동으로 생성됩니다.
- 실시간 업데이트: ${this.config.devDocs.updateInterval}ms 간격
- 문제 발견 시 즉시 조치하세요.

---

*Last updated: ${timestamp}*
`;

    return content;
  }

  /**
   * 집계 리포트 생성 (다중 서비스)
   */
  generateAggregatedReport(aggregated, allAnalyses) {
    const timestamp = new Date().toISOString();

    let content = `# KiiPS 로그 분석 요약 (전체 서비스)

**생성 시간**: ${timestamp}
**분석 서비스**: ${aggregated.totalServices}개

---

## 🚨 전체 현황

| 항목 | 수량 |
|------|------|
| Critical 에러 | ${aggregated.totalCritical} |
| 일반 에러 | ${aggregated.totalErrors} |
| 경고 | ${aggregated.totalWarnings} |
| Slow Query | ${aggregated.totalSlowQueries} |

`;

    if (aggregated.criticalServices.length > 0) {
      content += `### ⚠️ Critical 서비스

`;
      aggregated.criticalServices.forEach(svc => {
        content += `#### ${svc.service}
- Critical 에러: ${svc.criticalCount}건

`;
        svc.errors.slice(0, 3).forEach((error, idx) => {
          content += `${idx + 1}. **${error.type}**: ${error.message}\n`;
        });
        content += '\n';
      });
    }

    content += `---

## 📊 서비스별 에러 현황

`;

    const sortedServices = Object.entries(aggregated.errorsByService)
      .sort((a, b) => b[1] - a[1]);

    if (sortedServices.length > 0) {
      sortedServices.forEach(([service, count]) => {
        const indicator = count > 50 ? '🔴' : count > 20 ? '🟡' : '🟢';
        content += `- ${indicator} **${service}**: ${count}건\n`;
      });
    } else {
      content += '✅ 모든 서비스 정상\n';
    }

    content += `\n---

## 🔝 Top 5 에러 타입

`;

    if (aggregated.topErrors.length > 0) {
      aggregated.topErrors.forEach((error, idx) => {
        content += `${idx + 1}. **${error.type}**: ${error.count}건\n`;
      });
    } else {
      content += '✅ 에러 없음\n';
    }

    content += `\n---

## ✅ Recommended Actions

`;

    const actions = this.extractAggregatedActions(aggregated, allAnalyses);
    if (actions.length > 0) {
      actions.forEach((action, idx) => {
        content += `${idx + 1}. ${action}\n`;
      });
    } else {
      content += '✨ 현재 조치 필요 사항 없음\n';
    }

    content += `\n---

## 📂 상세 분석

`;

    allAnalyses.forEach(analysis => {
      const hasIssues = analysis.hasErrors || analysis.stats.slowQueryCount > 0;
      const icon = analysis.hasCritical ? '🔴' : hasIssues ? '🟡' : '🟢';

      content += `### ${icon} ${analysis.service}

- 파일: \`${path.basename(analysis.filePath)}\`
- 에러: ${analysis.stats.errorCount + analysis.stats.criticalCount}건
- 경고: ${analysis.stats.warningCount}건
- Slow Query: ${analysis.stats.slowQueryCount}건

`;
    });

    content += `\n---

*Last updated: ${timestamp}*
`;

    return content;
  }

  /**
   * 액션 아이템 추출 (단일 분석)
   */
  extractActionItems(analysis) {
    const items = [];

    if (analysis.hasCritical) {
      items.push(`🚨 **긴급**: ${analysis.service}의 Critical 에러 ${analysis.stats.criticalCount}건 조사 필요`);
    }

    if (analysis.stats.errorCount > 50) {
      items.push(`⚠️ ${analysis.service}의 에러 급증 (${analysis.stats.errorCount}건) - 원인 파악 필요`);
    }

    if (analysis.stats.slowQueryCount > 10) {
      items.push(`🐢 ${analysis.service}의 Slow Query ${analysis.stats.slowQueryCount}건 - 쿼리 최적화 검토`);
    }

    // 특정 에러 타입별 권장 사항
    const errorTypes = {};
    analysis.errors.forEach(e => {
      errorTypes[e.type] = (errorTypes[e.type] || 0) + 1;
    });

    if (errorTypes.nullPointer && errorTypes.nullPointer > 5) {
      items.push(`🔍 NullPointerException 다발 (${errorTypes.nullPointer}건) - null 체크 로직 보완`);
    }

    if (errorTypes.sqlError && errorTypes.sqlError > 3) {
      items.push(`💾 DB 에러 발생 (${errorTypes.sqlError}건) - 커넥션 풀 및 쿼리 검토`);
    }

    if (errorTypes.timeout && errorTypes.timeout > 5) {
      items.push(`⏱️ Timeout 에러 빈발 (${errorTypes.timeout}건) - API timeout 설정 조정 검토`);
    }

    return items;
  }

  /**
   * 집계된 액션 아이템 추출
   */
  extractAggregatedActions(aggregated, allAnalyses) {
    const items = [];

    if (aggregated.totalCritical > 0) {
      items.push(`🚨 **최우선**: Critical 에러 ${aggregated.totalCritical}건 즉시 조치`);
    }

    if (aggregated.totalErrors > 100) {
      items.push(`⚠️ 전체 에러 ${aggregated.totalErrors}건 - 시스템 전반 점검 필요`);
    }

    // Critical 서비스 우선 조치
    aggregated.criticalServices.forEach(svc => {
      items.push(`🔴 ${svc.service}: Critical 에러 ${svc.criticalCount}건 조사`);
    });

    // Top 에러 타입 대응
    if (aggregated.topErrors.length > 0 && aggregated.topErrors[0].count > 20) {
      items.push(`🔝 ${aggregated.topErrors[0].type} 에러 집중 대응 (${aggregated.topErrors[0].count}건)`);
    }

    return items;
  }

  /**
   * Dev Docs 파일 쓰기
   */
  async writeDevDocs(content) {
    try {
      await fs.promises.writeFile(this.devDocsPath, content, 'utf-8');
      console.log(`✅ Dev Docs updated: ${this.devDocsPath}`);
    } catch (error) {
      console.error(`❌ Failed to update Dev Docs: ${error.message}`);
      throw error;
    }
  }

  /**
   * Dev Docs 읽기
   */
  async readDevDocs() {
    try {
      if (fs.existsSync(this.devDocsPath)) {
        return await fs.promises.readFile(this.devDocsPath, 'utf-8');
      }
      return null;
    } catch (error) {
      console.error(`❌ Failed to read Dev Docs: ${error.message}`);
      return null;
    }
  }
}

module.exports = DevDocsUpdater;
