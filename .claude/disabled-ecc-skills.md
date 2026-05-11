# Disabled ECC Skills (KiiPS Context Optimization)

> Last updated: 2026-05-08 (Phase 2)
> 목적: KiiPS 프로젝트와 무관한 ecc plugin skill 비활성화로 컨텍스트 토큰 절감.

## 현재 상태

- **활성 ECC skill: 19개** (목표 ~150개 중 ECC 부분)
- **비활성 ECC skill: 162개**
- **총 ECC skill: 181개**

## 활성으로 보존된 ECC 핵심 19개

KiiPS 스택(Spring Boot 2.4.2 / Java 8 / JPA / MyBatis / PostgreSQL,Tibero / Maven / SVN) 관련:

```
springboot-patterns
springboot-security
springboot-tdd
springboot-verification
jpa-patterns
java-coding-standards
backend-patterns
postgres-patterns
database-migrations
security-review
deployment-patterns
docker-patterns
documentation-lookup
verification-loop
terminal-ops
git-workflow
search-first
coding-standards
architecture-decision-records
```

## 비활성화 방식

각 skill 폴더의 `SKILL.md` 파일을 `SKILL.md.disabled`로 rename.
복원: `mv SKILL.md.disabled SKILL.md`

위치: `/Users/younghwankang/.claude/plugins/cache/ecc/ecc/1.10.0/skills/`

## 비활성화된 162개 (전체 목록)

```
agent-eval
agent-harness-construction
agent-introspection-debugging
agent-payment-x402
agent-sort
agentic-engineering
ai-first-engineering
ai-regression-testing
android-clean-architecture
api-connector-builder
api-design
article-writing
automation-audit-ops
autonomous-agent-harness
autonomous-loops
benchmark
blueprint
brand-voice
browser-qa
bun-runtime
canary-watch
carrier-relationship-management
ck
claude-api
claude-devfleet
click-path-audit
clickhouse-io
code-tour
codebase-onboarding
compose-multiplatform-patterns
configure-ecc
connections-optimizer
content-engine
content-hash-cache-pattern
context-budget
continuous-agent-loop
continuous-learning
continuous-learning-v2
cost-aware-llm-pipeline
council
cpp-coding-standards
cpp-testing
crosspost
csharp-testing
customer-billing-ops
customs-trade-compliance
dart-flutter-patterns
dashboard-builder
data-scraper-agent
deep-research
defi-amm-security
design-system
django-patterns
django-security
django-tdd
django-verification
dmux-workflows
dotnet-patterns
e2e-testing
ecc-tools-cost-audit
email-ops
energy-procurement
enterprise-agent-ops
eval-harness
evm-token-decimals
exa-search
fal-ai-media
finance-billing-ops
flutter-dart-code-review
foundation-models-on-device
frontend-design
frontend-patterns
frontend-slides
gan-style-harness
github-ops
golang-patterns
golang-testing
google-workspace-ops
healthcare-cdss-patterns
healthcare-emr-patterns
healthcare-eval-harness
healthcare-phi-compliance
hexagonal-architecture
hipaa-compliance
hookify-rules
inventory-demand-planning
investor-materials
investor-outreach
iterative-retrieval
jira-integration
knowledge-ops
kotlin-coroutines-flows
kotlin-exposed-patterns
kotlin-ktor-patterns
kotlin-patterns
kotlin-testing
laravel-patterns
laravel-plugin-discovery
laravel-security
laravel-tdd
laravel-verification
lead-intelligence
liquid-glass-design
llm-trading-agent-security
logistics-exception-management
manim-video
market-research
mcp-server-patterns
messages-ops
nanoclaw-repl
nestjs-patterns
nextjs-turbopack
nodejs-keccak256
nutrient-document-processing
nuxt4-patterns
openclaw-persona-forge
opensource-pipeline
perl-patterns
perl-security
perl-testing
plankton-code-quality
product-capability
product-lens
production-scheduling
project-flow-ops
prompt-optimizer
python-patterns
python-testing
pytorch-patterns
quality-nonconformance
ralphinho-rfc-pipeline
regex-vs-llm-structured-text
remotion-video-creation
repo-scan
research-ops
returns-reverse-logistics
rules-distill
rust-patterns
rust-testing
safety-guard
santa-method
security-bounty-hunter
security-scan
seo
skill-comply
skill-stocktake
social-graph-ranker
strategic-compact
swift-actor-persistence
swift-concurrency-6-2
swift-protocol-di-testing
swiftui-patterns
tdd-workflow
team-builder
token-budget-advisor
ui-demo
unified-notifications-ops
video-editing
videodb
visa-doc-translate
workspace-surface-audit
x-api
```

## 복원 방법

전체 복원:
```bash
cd ~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/
for d in */; do
  if [ -f "${d}SKILL.md.disabled" ]; then
    mv "${d}SKILL.md.disabled" "${d}SKILL.md"
  fi
done
```

개별 복원:
```bash
mv ~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/<skill-name>/SKILL.md.disabled \
   ~/.claude/plugins/cache/ecc/ecc/1.10.0/skills/<skill-name>/SKILL.md
```

## 주의사항

- ecc plugin 업데이트 시 `SKILL.md`가 새로 추가될 수 있음 → 업데이트 후 재실행 필요
- 핵심 19개를 다시 disable하지 않으려면 위 보존 목록을 KEEP 변수에 명시할 것
- bash `for k in $KEEP` 가 word-split 안 되는 환경이 있음 → 인라인 명시 권장
