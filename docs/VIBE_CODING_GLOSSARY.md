# 바이브 코딩 (Vibe Coding) 용어 정리

> AI 기반 개발 시 자주 사용하는 용어를 정리한 문서입니다.

---

## 1. 기본 개념

| 용어 | 설명 |
|------|------|
| **Vibe Coding** | AI에게 자연어로 의도를 전달하고 코드를 생성하게 하는 개발 방식. Andrej Karpathy가 2025년 명명 |
| **Prompt Engineering** | AI에게 원하는 결과를 얻기 위해 지시문을 설계하는 기술 |
| **Context Window** | AI가 한 번에 참조할 수 있는 텍스트 양 (토큰 수) |
| **Token** | AI가 처리하는 텍스트의 최소 단위. 한글 1글자 ≈ 2-3 토큰 |
| **LLM (Large Language Model)** | 대규모 언어 모델. Claude, GPT 등 코드 생성의 기반 기술 |

---

## 2. 프로젝트 문서 용어

| 용어 | 풀네임 | 설명 |
|------|--------|------|
| **PRD** | Product Requirements Document | 제품 요구사항 정의서. 무엇을 만들지, 왜 만드는지 정의 |
| **TRD** | Technical Requirements Document | 기술 요구사항 정의서. PRD를 어떻게 구현할지 기술적으로 정의 |
| **SRS** | Software Requirements Specification | 소프트웨어 요구사항 명세서. 기능/비기능 요구사항 상세 기술 |
| **FSD** | Functional Specification Document | 기능 명세서. 각 기능의 동작 방식을 상세 정의 |
| **HLD** | High-Level Design | 고수준 설계. 시스템 아키텍처, 모듈 간 관계 정의 |
| **LLD** | Low-Level Design | 저수준 설계. 클래스, 메서드, DB 스키마 등 상세 설계 |
| **ERD** | Entity-Relationship Diagram | 개체-관계 다이어그램. DB 테이블 간 관계 시각화 |
| **ADR** | Architecture Decision Record | 아키텍처 결정 기록. 기술 선택의 근거를 문서화 |
| **RFC** | Request for Comments | 기술 제안서. 팀 내 기술적 변경 사항 논의용 문서 |
| **PoC** | Proof of Concept | 개념 증명. 아이디어의 실현 가능성을 검증하는 프로토타입 |
| **MVP** | Minimum Viable Product | 최소 기능 제품. 핵심 기능만 구현한 최초 출시 버전 |
| **SLA** | Service Level Agreement | 서비스 수준 협약. 가용성, 응답 시간 등 품질 기준 정의 |
| **KPI** | Key Performance Indicator | 핵심 성과 지표. 프로젝트 성공 여부를 측정하는 기준 |
| **UAT** | User Acceptance Testing | 사용자 인수 테스트. 최종 사용자가 요구사항 충족 여부 검증 |
| **QA** | Quality Assurance | 품질 보증. 소프트웨어 품질 검증 전반 |

---

## 3. 작업 흐름 용어

| 용어 | 설명 |
|------|------|
| **Scaffolding** | AI에게 프로젝트 초기 구조(뼈대)를 한번에 생성하게 하는 것 |
| **Iteration** | AI 결과물을 반복 수정하며 완성도를 높이는 과정 |
| **One-shot** | 한 번의 프롬프트로 원하는 결과를 얻는 것 |
| **Multi-turn** | 여러 차례 대화를 주고받으며 결과를 만드는 것 |
| **Plan Mode** | 코드 작성 전 AI에게 구현 계획을 먼저 세우게 하는 모드 |
| **Checkpoint** | 변경 전 현재 상태를 기록해두는 복원 지점 |
| **Rollback / Revert** | 이전 상태로 되돌리기 |
| **Spike** | 기술적 불확실성을 해소하기 위한 짧은 탐색/실험 작업 |
| **Timeboxing** | 특정 작업에 제한 시간을 두고 진행하는 방식 |

---

## 4. AI 에이전트 용어

| 용어 | 설명 |
|------|------|
| **Agentic Coding** | AI가 자율적으로 도구를 사용하며 코딩하는 방식 (바이브 코딩의 진화형) |
| **Tool Use** | AI가 파일 읽기/쓰기, 터미널 실행 등 도구를 직접 사용하는 것 |
| **Subagent** | 메인 AI가 특정 작업을 위임하는 하위 AI 인스턴스 |
| **MCP (Model Context Protocol)** | AI가 외부 서비스/도구와 표준화된 방식으로 연동하는 프로토콜 |
| **Hook** | 특정 이벤트(파일 저장, 커밋 등) 발생 시 자동 실행되는 스크립트 |
| **Context Compaction** | 대화가 길어질 때 핵심만 남기고 컨텍스트를 압축하는 것 |
| **RAG (Retrieval-Augmented Generation)** | 외부 문서를 검색해 AI 응답의 정확도를 높이는 기법 |
| **Function Calling** | AI가 외부 함수/API를 직접 호출하는 기능 |
| **Agent Team** | 여러 AI 에이전트가 역할을 분담해 협업하는 구조 |

---

## 5. 프롬프트 패턴

| 용어 | 설명 |
|------|------|
| **System Prompt** | AI의 역할과 규칙을 정의하는 최상위 지시문 (CLAUDE.md 등) |
| **Few-shot** | 예시를 몇 개 보여주고 패턴을 따르게 하는 기법 |
| **Zero-shot** | 예시 없이 지시만으로 결과를 얻는 기법 |
| **Chain of Thought (CoT)** | AI에게 단계별로 사고 과정을 거치게 하는 기법 |
| **Guardrail** | AI가 벗어나지 않도록 제한 조건을 설정하는 것 |
| **Hallucination** | AI가 존재하지 않는 API, 파일, 기능을 만들어내는 현상 |
| **Grounding** | 실제 코드베이스를 참조시켜 할루시네이션을 방지하는 것 |
| **Temperature** | AI 응답의 무작위성 조절 값. 낮을수록 일관적, 높을수록 창의적 |

---

## 6. 실무 도구 용어

| 용어 | 설명 |
|------|------|
| **CLAUDE.md** | 프로젝트 규칙을 AI에게 전달하는 설정 파일 |
| **Skill / Slash Command** | 자주 쓰는 작업을 명령어로 등록해 재사용하는 것 (`/commit`, `/review` 등) |
| **Diff** | AI가 제안하는 코드 변경 내역 |
| **Accept / Reject** | AI의 변경 제안을 승인 또는 거부 |
| **Sandbox** | AI의 파일/네트워크 접근을 제한하는 보안 영역 |
| **Worktree** | 격리된 Git 브랜치에서 AI가 독립적으로 작업하는 공간 |
| **Background Agent** | 백그라운드에서 자율적으로 작업하는 AI (PR 생성 등) |
| **Cursor Rules / .cursorrules** | Cursor IDE에서 AI 동작 규칙을 정의하는 설정 파일 |
| **Copilot Instructions** | GitHub Copilot에 프로젝트 맥락을 전달하는 설정 |

---

## 7. 개발 방법론 용어

| 용어 | 설명 |
|------|------|
| **TDD (Test-Driven Development)** | 테스트를 먼저 작성하고 코드를 구현하는 방법론 |
| **BDD (Behavior-Driven Development)** | 행동 시나리오 기반으로 개발하는 방법론 |
| **CI/CD** | 지속적 통합(Continuous Integration) / 지속적 배포(Continuous Deployment) |
| **DDD (Domain-Driven Design)** | 도메인(업무) 중심으로 소프트웨어를 설계하는 방법론 |
| **Agile** | 짧은 주기로 반복 개발하며 피드백을 반영하는 방법론 |
| **Sprint** | Agile에서 1-4주 단위의 개발 주기 |
| **Retrospective (회고)** | Sprint 종료 후 잘된 점/개선점을 돌아보는 회의 |
| **Technical Debt** | 빠른 개발을 위해 미뤄둔 코드 품질 개선 사항 |

---

## 8. 주의 용어 (안티패턴)

| 용어 | 설명 |
|------|------|
| **Prompt Injection** | 악의적 입력으로 AI의 동작을 조작하려는 공격 |
| **Vibe Debugging** | "잘 모르겠지만 AI한테 고쳐달라고 하자"식 디버깅 (안티패턴) |
| **Spaghetti Prompting** | 맥락 없이 이것저것 요청해 AI가 혼란에 빠지는 상태 |
| **Token Burn** | 불필요한 대화로 토큰(비용)을 낭비하는 것 |
| **Drift** | AI가 원래 요청에서 점점 벗어나는 현상 |
| **Copy-Paste Driven Development** | AI 생성 코드를 이해 없이 복붙하는 안티패턴 |
| **Over-engineering** | AI가 필요 이상으로 복잡한 솔루션을 생성하는 현상 |
| **Context Poisoning** | 잘못된 정보가 컨텍스트에 남아 이후 응답을 오염시키는 현상 |

---

> 마지막 업데이트: 2026-02-27
