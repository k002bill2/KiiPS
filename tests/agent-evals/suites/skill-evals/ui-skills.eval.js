/**
 * KiiPS UI Skills Evaluation Suite
 *
 * Evaluates: kiips-ui-component-builder, kiips-realgrid-guide
 *
 * Tests UI component and RealGrid skill activation patterns.
 */

module.exports = {
  name: 'UI Skills Evaluation',
  description: 'Evaluates UI component builder and RealGrid builder skills',
  parallel: true,

  tasks: [
    // ============================================
    // kiips-ui-component-builder Tests
    // ============================================

    {
      id: 'ui-builder-activation-korean',
      description: 'Korean: 화면 컴포넌트 should activate ui-component-builder',
      input: { prompt: '화면 컴포넌트 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder']
        }
      ]
    },

    {
      id: 'ui-builder-activation-english',
      description: 'English: UI component should activate ui-component-builder',
      input: { prompt: 'Create a UI component for the dashboard' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder']
        }
      ]
    },

    {
      id: 'ui-builder-activation-page',
      description: 'Page creation should activate ui-component-builder',
      input: { prompt: '새 페이지 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder']
        }
      ]
    },

    {
      id: 'ui-builder-manager-detection',
      description: 'UI work should detect ui-manager',
      input: { prompt: '화면 컴포넌트 개발' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'ui-manager'
          }
        }
      ]
    },

    // ============================================
    // kiips-realgrid-guide Tests
    // ============================================

    {
      id: 'realgrid-activation-korean',
      description: 'Korean: RealGrid should activate realgrid-builder',
      input: { prompt: 'RealGrid 테이블 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide']
        }
      ]
    },

    {
      id: 'realgrid-activation-english',
      description: 'English: grid should activate realgrid-builder',
      input: { prompt: 'Create a data grid with RealGrid' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide']
        }
      ]
    },

    {
      id: 'realgrid-activation-table',
      description: 'Table keyword should activate realgrid-builder',
      input: { prompt: '테이블 컴포넌트 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide']
        }
      ]
    },

    {
      id: 'realgrid-with-excel',
      description: 'Grid with Excel should activate realgrid-builder',
      input: { prompt: 'RealGrid 엑셀 다운로드 기능 추가' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide']
        }
      ]
    },

    // ============================================
    // Combined UI Scenarios
    // ============================================

    {
      id: 'combined-ui-with-grid',
      description: 'UI page with grid should activate both UI skills',
      input: { prompt: '펀드 목록 화면에 RealGrid 테이블 추가해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-ui-component-builder', 'kiips-realgrid-guide']
        }
      ]
    },

    {
      id: 'combined-full-ui-page',
      description: 'Full page creation should activate multiple UI skills',
      input: { prompt: 'RealGrid로 펀드 목록 조회 페이지 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-realgrid-guide', 'kiips-ui-component-builder']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'ui-manager'
          }
        }
      ]
    },

    // ============================================
    // UI with Planning
    // ============================================

    {
      id: 'ui-with-detail-planning',
      description: 'Detail page UI should activate both planner and UI builder',
      input: { prompt: '상세 페이지 화면 설계하고 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-detail-page-planner', 'kiips-ui-component-builder']
        }
      ]
    },

    // ============================================
    // Negative Tests
    // ============================================

    {
      id: 'ui-negative-backend',
      description: 'Backend-only prompt should NOT activate UI skills',
      input: { prompt: 'REST API 엔드포인트 테스트해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-api-tester']
        }
      ]
    },

    {
      id: 'ui-negative-build',
      description: 'Build-only prompt should NOT activate UI skills',
      input: { prompt: 'Maven 빌드 실행' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-maven-builder']
        }
      ]
    }
  ]
};
