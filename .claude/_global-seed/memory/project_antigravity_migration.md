---
name: project-antigravity-migration
description: Google Gemini CLI → Antigravity CLI 전환 플랜. 2026-06-18 Pro/Ultra/Free 티어 sunset. KiiPS bridge 5-Phase 마이그레이션 로드맵.
metadata: 
  node_type: memory
  type: project
  originSessionId: 74d668b0-ce4e-459b-a965-39c37dc08b32
---

KiiPS의 `.claude/hooks/gemini-bridge.js` 외 4개 파일이 Gemini CLI에 의존. Google이 2026-06-18 부로 Pro/Ultra/Free 티어의 Gemini CLI 서비스를 종료하고 Antigravity CLI로 통합. 로컬 `gemini` v0.37.1은 이미 Antigravity 빌드(`gemini skills|hooks|extensions|mcp` 노출).

**Why**: closed-source 전환 + 인증 모드 변경 + 출력 포맷 임의 변경 위험 때문에 KiiPS가 자체 정규식 파서로 stdout 파싱하는 현재 구조가 장기적으로 깨질 가능성 있음.

**How to apply**:
- 새 세션에서 Gemini/Antigravity 관련 작업을 받으면, 먼저 `.claude/docs/antigravity-cli-migration-plan.md` 를 읽고 Phase 진행 상태 확인.
- **Phase 1 (인증 점검) 완료됨 (2026-05-29)** — `.claude/gemini-bridge/.auth-mode.txt` 참조. 다음 후보는 Phase 2(출력 JSON 파싱)이나 현재 "보류".
- `gemini-bridge.js` 의 `SENSITIVE_FILE_PATTERNS`, `sanitizePath()`, `audit.log` 기록 부분은 **절대 제거 금지** (보안 가드).
- 코드 변경은 반드시 사용자 승인 후 진행.
- **핵심 구조**: KiiPS 코드에는 `oauth-personal` 참조가 0건. `gemini-bridge.js` L481 `execFileSync("gemini",["-p","-"])`로 CLI를 호출할 뿐, 인증은 gemini가 `~/.gemini/` 전역설정(oauth-personal + oauth_creds.json)으로 스스로 처리 → 6/18 차단 시 수리 지점은 KiiPS 코드가 아니라 **전역 인증**(GCP/API키 재로그인) 또는 bridge에 API키 env 주입.

**Status (2026-05-29, Phase 1 완료)**: 인증 모드 = `oauth-personal`(개인 Google 계정) 확인. `.auth-mode.txt` 작성 완료. 6/18 대응 = **보류**(호출 8/900·검증전용, 차단 시 대응). 계정 티어 자체는 미확정(계정 콘솔 사안). Phase 2~5 미트리거.

**예약된 재점검**: 2026-06-17 09:00 KST 1회 remote routine 등록됨 (`trig_01SDJN5zEKri4wXudWZ2LFBE`, sonnet-4-6). 역할 = sunset 날짜 공개정보 재확인 + 로컬 점검 체크리스트 + Slack DM 발송. ⚠️ remote라 로컬 `~/.gemini` 직접 점검 불가 — 실제 인증 확인은 사용자가 그날 로컬에서. 관리: https://claude.ai/code/routines/trig_01SDJN5zEKri4wXudWZ2LFBE

관련: [[project-harness-engineering-status]]
