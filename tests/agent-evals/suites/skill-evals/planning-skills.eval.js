/**
 * KiiPS Planning Skills Evaluation Suite
 *
 * Evaluates: kiips-feature-planner, kiips-detail-page-planner
 *
 * Tests feature and page planning skill activation patterns.
 */

module.exports = {
  name: 'Planning Skills Evaluation',
  description: 'Evaluates feature planner and detail page planner skills',
  parallel: true,

  tasks: [
    // ============================================
    // kiips-feature-planner Tests
    // ============================================

    {
      id: 'feature-planner-activation-korean',
      description: 'Korean: 기능 계획 should activate feature-planner',
      input: { prompt: '새 기능 개발 계획 세워줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner']
        }
      ]
    },

    {
      id: 'feature-planner-activation-english',
      description: 'English: feature plan should activate feature-planner',
      input: { prompt: 'Create a feature development plan' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner']
        }
      ]
    },

    {
      id: 'feature-planner-activation-plan',
      description: 'Plan keyword should activate feature-planner',
      input: { prompt: '플랜 작성해줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner']
        }
      ]
    },

    {
      id: 'feature-planner-manager-detection',
      description: 'Feature planning should detect feature-manager',
      input: { prompt: '신규 기능 개발 계획' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner']
        },
        {
          type: 'state',
          method: 'state',
          expect: {
            'output.managerAgent': 'feature-manager'
          }
        }
      ]
    },

    // ============================================
    // kiips-detail-page-planner Tests
    // ============================================

    {
      id: 'detail-planner-activation-korean',
      description: 'Korean: 상세 페이지 should activate detail-page-planner',
      input: { prompt: '펀드 상세 페이지 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-detail-page-planner']
        }
      ]
    },

    {
      id: 'detail-planner-activation-detail',
      description: 'Detail page keyword should activate detail-page-planner',
      input: { prompt: 'Create a detail view page' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-detail-page-planner']
        }
      ]
    },

    {
      id: 'detail-planner-with-ui',
      description: 'Detail page with UI should activate both planners and UI skills',
      input: { prompt: '펀드 상세 페이지 화면 만들어줘' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-detail-page-planner', 'kiips-ui-component-builder']
        }
      ]
    },

    // ============================================
    // Combined Planning Scenarios
    // ============================================

    {
      id: 'combined-feature-with-detail',
      description: 'Feature with detail page should activate both planners',
      input: { prompt: '신규 기능 계획과 상세 페이지 설계' },
      graders: [
        {
          type: 'activation',
          method: 'activation',
          expect: ['kiips-feature-planner', 'kiips-detail-page-planner']
        }
      ]
    },

    // ============================================
    // Negative Tests
    // ============================================

    {
      id: 'planner-negative-build',
      description: 'Build-only prompt should NOT activate planners',
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
