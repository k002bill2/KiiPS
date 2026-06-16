# Antigravity CLI Migration Plan (KiiPS) — ⚠️ SUPERSEDED (2026-06-15)

> **⚠️ 이 플랜은 무효화됨.** Gemini CLI 하네스(브리지·훅·커맨드)는 **2026-06-09 커밋 `cf7248f`에서
> 전면 제거**됨(memory `project_antigravity_migration`). 따라서 본 문서의 Phase 2(JSON 파싱 전환)·
> Phase 3(hooks migrate)·Phase 5(ACP) 등은 **대상 파일이 더 이상 존재하지 않아 실행 불가**다.
> 외부 모델 2차 리뷰가 필요하면 외부 CLI 브리지를 부활시키지 말고 **네이티브로 재제공**한다:
> Workflow가 리뷰어 `Agent`(opus)를 spawn하거나 `santa-loop`/`requesting-code-review`/`security-reviewer` 사용.
>
> 아래 원문은 **히스토리 + KEEP 레코드 추출용**으로만 보존한다.

---

## 🟢 KEEP 레코드 — 외부 sink sanitization 지식 (네이티브 미제공, 영구 보존)

> 삭제된 `gemini-bridge.js`가 보유했던 보안 가드. **네이티브 어떤 프리미티브도 외부 모델/서비스로
> 보내는 콘텐츠의 sanitization·민감파일 차단·감사로그를 자동 제공하지 않는다.** 향후 어떤 외부 sink
> (외부 LLM 리뷰, 원격 분석, 웹훅 등)를 도입하든 **먼저 아래를 재구현해야 한다.**

- **민감 파일 차단**: 외부로 전송 전 `app-*.properties`(prod/stg/production), `.env`, `app-tibero`,
  credentials, 키/토큰 파일을 페이로드에서 제외 (구 `SENSITIVE_FILE_PATTERNS`).
- **경로 탈출 방지**: 전송 대상 경로를 워크스페이스 루트로 정규화·검증 (구 `sanitizePath()`).
- **감사 로그**: 외부로 무엇을 언제 보냈는지 append-only 기록 — closed-source/외부 환경에서 더 중요 (구 `audit.log`).
- **샌드박스 env 제거**: 외부 프로세스 spawn 시 민감 환경변수를 명시적으로 삭제 (구 `lazyStart()`).

(원 위치는 본문 §4 참조 — 파일은 삭제됐으나 지식은 위로 추출됨.)

---

## 0. 현재 상태 스냅샷 (2026-05-29 시점)

- 로컬 `gemini` 바이너리: **v0.37.1** (`/Users/younghwankang/.nvm/versions/node/v25.6.0/bin/gemini`)
  - 이미 Antigravity 통합 빌드 — `gemini skills | hooks | extensions | mcp` 4개 서브커맨드 정식 노출
  - `gemini hooks migrate` 전용 마이그레이션 서브커맨드 보유
- KiiPS bridge 호출 카운트: 8/900 (2026-04-13 기준)
- 기존 통합 코드는 정상 동작 중 — Antigravity 전환으로 **즉시 깨지는 부분 없음**

---

## 1. KiiPS 통합 인벤토리 (변경 영향 대상)

| 파일 | 라인수 | 역할 | 변경 우선순위 |
|------|-------|------|--------------|
| `.claude/hooks/gemini-bridge.js` | 781 | review/scan/status 3-mode CLI | **HIGH** (출력 파싱 JSON화) |
| `.claude/hooks/geminiAutoTrigger.js` | 547 | UDS 소켓 lazy daemon, debounce 30s | LOW (변경 불필요) |
| `.claude/hooks/geminiReviewGate.js` | 199 | PreToolUse Critical 차단 | LOW (변경 불필요) |
| `.claude/hooks/postToolOrchestrator.js` L178 | — | trigger 호출 진입점 | LOW |
| `.claude/commands/gemini-scan.md` | 37 | `/gemini-scan` 슬래시 커맨드 | LOW |
| `.claude/settings.json` L54, 434, 446 | — | permissions.allow 패턴 3개 | NONE (그대로 호환) |
| `.claude/gemini-bridge/` | — | 데이터/감사 로그 디렉토리 | NONE |

---

## 2. Antigravity CLI 변경 요약

### 명칭/포지셔닝

| 구분 | Gemini CLI (이전) | Antigravity CLI (현행) |
|------|------------------|----------------------|
| 빌드 언어 | Node/TS | **Go (rewrite)** |
| 라이선스 | Apache 2.0 (open) | **closed-source** |
| 확장 명칭 | Extensions | **Antigravity Plugins** (커맨드명은 `extensions` 유지) |
| 인증 | API 키 | **"Continue with Google"** (Pro/Ultra) 또는 **"Use Google Cloud project"** (Enterprise) |
| Sunset | — | **2026-06-18 이후 Pro/Ultra/Free 차단** (Enterprise/GCP만 유지) |

### 새 명령 표면 (로컬 v0.37.1 검증)

- `gemini skills` — `list / enable / disable / install <git|path> / link / uninstall`
- `gemini hooks` — `migrate` (Claude Code → Gemini 훅 자동 변환)
- `gemini extensions` — `install / uninstall / list / update / disable / enable / link / new / validate / config`
- `gemini mcp` — `add / remove / list / enable / disable`

### 새 글로벌 옵션 (활용 가치 있는 것만)

| 옵션 | KiiPS 활용 포인트 |
|------|------------------|
| `-o, --output-format {text\|json\|stream-json}` | **bridge.js 정규식 파서 단순화 핵심** |
| `--approval-mode {default\|auto_edit\|yolo\|plan}` | `-y/--yolo` 대신 `auto_edit`로 안전성 ↑ |
| `--policy / --admin-policy` | `--allowed-tools` (DEPRECATED) 대체 |
| `--acp` | longlived agent IPC (장기 PoC 영역) |
| `-r, --resume [latest\|N]`, `--list-sessions` | bridge 자체 캐시 부담 ↓ |

### 스킬 스코프

- Global: `~/.gemini/antigravity/skills/`
- Workspace: `<workspace-root>/.agents/skills/`
- → KiiPS는 현재 `.claude/skills/` 만 사용. Antigravity에서 동일 스킬을 보려면 심볼릭 링크 필요.

---

## 3. 실행 플랜 (우선순위 순)

### Phase 1 — Sunset 대비 점검 [P0, 2026-06-18 이전 필수]

```bash
# 1. 현재 로그인 모드 확인
gemini --help | grep -A2 "auth\|login"
# 2. Pro/Ultra 티어 사용 중이면 → GCP project 모드 전환 평가
#    (KiiPS 운영 정책에 따라 결정)
```

**완료 기준**:
- [ ] 현재 인증 방식이 무엇인지 문서화 (`gemini-bridge/.auth-mode.txt`)
- [ ] 2026-06-18 이후에도 호출 가능한 티어인지 확인
- [ ] (필요 시) GCP 프로젝트/결제 계정 준비

### Phase 2 — 출력 파싱 JSON 전환 [P1, 1~2주]

**대상**: `.claude/hooks/gemini-bridge.js` L426-493 `runGemini()`, L503-549 `parseReviewOutput()`

**변경 안 (수술적 변경)**:

1. `runGemini(prompt, timeoutMs, format = "text")` — 시그니처에 `format` 추가
2. `execFileSync` 인자에 `["-p", "-", "-o", "json"]` (format === "json" 시)
3. `parseReviewOutput(raw)` — JSON 우선 파싱 + regex fallback
4. 회귀 테스트: 기존 reviews/*.json 중 3개를 새 파서로 재검증

**완료 기준**:
- [ ] `runGemini` 단위 테스트 (text/json 양쪽)
- [ ] `parseReviewOutput`이 동일 입력에 대해 동일 issues 배열 산출
- [ ] `bridge.js status` 출력 변화 없음

### Phase 3 — hooks migrate 산출물 비교 [P2, 선택]

```bash
# 임시 디렉토리에 마이그레이션 결과 받기 (덮어쓰기 금지)
cd /tmp/agm-check && gemini hooks migrate --src $CLAUDE_PROJECT_DIR/.claude/hooks
diff -ru /tmp/agm-check/output $CLAUDE_PROJECT_DIR/.claude/hooks/gemini-*.js
```

**판단 기준**:
- KiiPS 자체 훅이 더 정교하면 (debounce, audit log, sensitive file block 등) **유지**
- 마이그레이션 결과가 더 깔끔하면 **부분 채택** (단, 보안 가드 절대 제거 금지)

### Phase 4 — 스킬 디렉토리 공유 [P3, 선택]

```bash
# KiiPS는 SVN이므로 심링크는 SVN ignore 필수
cd $CLAUDE_PROJECT_DIR
mkdir -p .agents
ln -s ../.claude/skills .agents/skills
svn propset svn:ignore ".agents" .
```

**판단 기준**: Antigravity 인터랙티브 세션에서 KiiPS 스킬을 직접 호출하고 싶을 때만 진행. 그렇지 않으면 SKIP.

### Phase 5 — ACP 모드 PoC [P4, 장기]

- `--acp` 모드로 longlived agent 띄우고 stdin/stdout JSON-RPC로 통신
- 현재 daemon 구조(매 호출마다 spawn) 대비 latency/throughput 측정
- 결과 양호 시 별도 마이그레이션 계획 수립

---

## 4. 절대 변경하지 말 것 (Anti-Rationalization)

- `gemini-bridge.js` L42-53 `SENSITIVE_FILE_PATTERNS` — 민감 파일 차단 정규식
- `gemini-bridge.js` L55-77 `sanitizePath()` — 경로 탈출 방지
- `gemini-bridge.js` L349-364 `audit.log` 기록 — closed-source 환경에서 더 중요해짐
- `geminiAutoTrigger.js` L196-211 `lazyStart()` — sandbox 환경변수 명시적 삭제 (보안)
- `settings.json` permissions.allow 패턴 3개 — 변경 시 다른 훅 깨질 위험

---

## 5. 위험/리스크 매트릭스

| 리스크 | 확률 | 영향 | 완화 |
|--------|------|------|------|
| 2026-06-18 인증 차단 | **HIGH** | 전체 통합 중단 | Phase 1 필수 실행 |
| 출력 포맷 임의 변경 (closed-source) | MEDIUM | 정규식 파서 깨짐 | Phase 2 JSON 전환 |
| Antigravity 데이터 정책 변경 | MEDIUM | `audit.log` 가치 ↑ | 현재 가드 유지 |
| `gemini hooks migrate` 호환성 | LOW | 임시 폴더에서만 평가 | Phase 3 dry-run |
| `--allowed-tools` DEPRECATED 경고 | LOW | KiiPS는 미사용 | 영향 없음 |

---

## 6. 참조

- Discussion #27274: https://github.com/google-gemini/gemini-cli/discussions/27274
- Antigravity Docs Home: https://antigravity.google/docs/home
- CLI Overview: https://antigravity.google/docs/cli-overview
- CLI Features: https://antigravity.google/docs/cli-features
- Codelabs: https://codelabs.developers.google.com/getting-started-google-antigravity
- 본 분석 세션: 2026-05-29 (Claude Opus 4.7)

---

## 7. 다음 세션 진입점 (Resume Hook)

다음 세션에서 본 플랜을 이어가려면:

```
/resume antigravity-migration
또는
이 파일을 읽어줘: .claude/docs/antigravity-cli-migration-plan.md
```

**즉시 시작할 수 있는 작업**: Phase 1의 인증 모드 점검 (5분 작업).
