/**
 * KiiPS Analysis Skills Evaluation Suite
 *
 * Evaluates: kiips-api-tester, kiips-log-analyzer
 *
 * Tests API testing and log analysis skill activation patterns.
 */

module.exports = {
  name: 'Analysis Skills Evaluation',
  description: 'Evaluates API tester and log analyzer skills',
  parallel: true,

  tasks: [
    // ============================================
    // kiips-api-tester Tests
    // ============================================

    {
      id: 'api-tester-activation-korean',
      description: 'Korean: API 테스트 should activate api-tester',
      input: { prompt: 'KiiPS-FD API 테스트 실행해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester']
        }
      ]
    },

    {
      id: 'api-tester-activation-english',
      description: 'English: API test should activate api-tester',
      input: { prompt: 'Test the REST API endpoints' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester']
        }
      ]
    },

    {
      id: 'api-tester-activation-endpoint',
      description: 'Endpoint keyword should activate api-tester',
      input: { prompt: '엔드포인트 검증해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester']
        }
      ]
    },

    {
      id: 'api-tester-activation-gateway',
      description: 'Gateway API test should activate api-tester',
      input: { prompt: 'API Gateway 라우팅 테스트' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester']
        }
      ]
    },

    // ============================================
    // kiips-log-analyzer Tests
    // ============================================

    {
      id: 'log-analyzer-activation-korean',
      description: 'Korean: 로그 분석 should activate log-analyzer',
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
      id: 'log-analyzer-activation-english',
      description: 'English: log analyze should activate log-analyzer',
      input: { prompt: 'Analyze the service logs for errors' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer']
        }
      ]
    },

    {
      id: 'log-analyzer-activation-error',
      description: 'Error investigation should activate log-analyzer',
      input: { prompt: '서비스 에러 원인 찾아줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer']
        }
      ]
    },

    {
      id: 'log-analyzer-activation-debug',
      description: 'Debug logs should activate log-analyzer',
      input: { prompt: '디버그 로그 확인해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer']
        }
      ]
    },

    // ============================================
    // Combined Analysis (both skills)
    // ============================================

    {
      id: 'combined-api-log-analysis',
      description: 'API error with logs should activate both',
      input: { prompt: 'API 에러 로그 분석하고 테스트해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester', 'kiips-log-analyzer']
        }
      ]
    },

    // ============================================
    // Manager Detection
    // ============================================

    {
      id: 'analysis-manager-detection',
      description: 'Deploy-related analysis should detect deployment-manager',
      input: { prompt: '배포된 서비스 로그 분석해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-log-analyzer']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'deployment-manager'
          }
        }
      ]
    }
  ]
};
