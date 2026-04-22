# Harness Boundaries (하네스 경계 및 한계)

> KiiPS PreToolUse 가드 체계(ethicalValidator · permissionGate · shellContextTokenizer)의
> 명시적 한계·회피 방법·향후 개선 경로.
>
> **대상 독자**: 하네스를 확장/디버깅하거나, 가드가 예상과 다른 판정을 내렸을 때 원인을 찾는 개발자.
>
> **마지막 업데이트**: 2026-04-22 (v3.5.2 Known 해결 문서화)

---

## 1. AST 필터 한계 — DQUOTE 내부 command substitution

### 1.1 증상

`ethicalValidator v3.4.0` 과 `permissionGate v3.5.1` 은 매치된 위험 패턴이
shell literal/comment/heredoc 내부인지 `shellContextTokenizer.js` 로 판정한 뒤,
literal 내부면 false-positive 로 간주하여 차단을 **skip** 합니다.

이 로직의 사각지대: **DQUOTE 내부의 `$(...)` / backtick `` `...` `` command substitution**.

```bash
# 예시 1: DQUOTE 내부 command substitution
bash -c "echo $(rm -rf /tmp/x)"
#                 ^^^^^^^^^^^^^  실제 실행되지만 tokenizer 는 DQUOTE 내부로 분류하여 skip

# 예시 2: eval 호출
eval "rm -rf $TARGET"
#     ^^^^^^^^^^^^^^^^  실제 실행 (eval 의미상), tokenizer 는 DQUOTE 로 분류

# 예시 3: backtick (deprecated 문법이나 여전히 실행됨)
echo "result: `kill -9 1234`"
#              ^^^^^^^^^^^^^  실제 실행, tokenizer 는 DQUOTE 로 분류
```

현재 tokenizer 는 DQUOTE 에 진입하면 `STATE_DQUOTE` 를 유지하고, 내부의 `$()` / backtick 을
**새 OUTSIDE 문맥으로 재진입**하지 않습니다. 따라서 `$()` 안의 위험 명령은 literal 텍스트로
간주되어 가드가 차단을 놓칩니다.

### 1.2 공격 표면 평가

| 요인 | 평가 |
|------|------|
| Claude 가 자발적으로 이 패턴을 구성할 확률 | **낮음** — 일반적으로 직접 명령 형태로 생성 |
| 사용자가 프롬프트로 요청할 확률 | 중간 — legitimate use case 존재 (예: `echo "backup at $(date)"`) |
| 우회로 악용될 가능성 | 이론적으로 가능 — 예: `bash -c "rm $(echo evil)"` 이 rm 가드를 통과 |
| fail-closed 안전망 | **있음** — Edit/Write file_path 는 AST 필터 미적용, 여전히 regex 로 차단 |

### 1.3 회피 방법 (사용자/개발자)

1. **명령을 분해하라**: `bash -c "rm $(generate_target)"` 대신 `TARGET=$(generate_target); rm "$TARGET"` 처럼 DQUOTE 내부 substitution 을 제거.
2. **사용자 승인을 우회하지 말라**: 가드가 놓친다고 해서 위험 명령을 쓰지 말 것 — CLAUDE.md 의 "Executing actions with care" 원칙 유지.
3. **의심스러우면 rollback**: `KIIPS_PERMISSION_GATE_AST=off` 로 AST 필터만 끄면 regex-only 모드로 돌아가 더 보수적으로 차단 (false-positive 증가 감수).

### 1.4 해결 경로 (향후 작업)

tokenizer 의 STATE 머신에 nested context 를 추가해야 합니다:

```
STATE_DQUOTE 진입 중 '$(' 만나면:
  → STATE_DQUOTE 를 stack 에 push
  → STATE_OUTSIDE 로 전이 (괄호 depth=1)
  → ')' 만나면 stack pop, DQUOTE 복귀

STATE_DQUOTE 진입 중 backtick '`' 만나면:
  → STATE_DQUOTE 를 stack 에 push
  → STATE_OUTSIDE 로 전이
  → 닫는 '`' 만나면 stack pop, DQUOTE 복귀
```

추가 사전 작업:
- `tests/shell-context-tokenizer.test.js` 에 nested substitution 케이스 8-10 개 추가
- `permission-gate.test.js`, `ethical-validator.test.js` 에 회귀 시나리오 추가
- 하네스 회귀 스크립트(`tests/hook-regression.sh`) 페이로드 추가

의존성 0 원칙 유지를 위해 bash 완전 파서는 도입하지 않습니다 (mvdan/sh 등 외부 라이브러리 배제).

---

## 2. Rollback env 의 세션 중간 한계

### 2.1 증상

`KIIPS_PERMISSION_GATE=off`, `KIIPS_PERMISSION_GATE_AST=off`,
`KIIPS_ETHICAL_VALIDATOR=off` 같은 rollback 환경변수는
**Claude Code 프로세스의 환경**에 존재해야 훅 spawn 시점에 상속됩니다.

세션 중간에 사용자가 쉘에서 `export KIIPS_PERMISSION_GATE=off` 를 실행해도,
이미 실행 중인 Claude Code 프로세스의 env 는 변경되지 않으므로, 이후 훅이 spawn 될 때
이 변수가 상속되지 **않습니다**.

### 2.2 재현 시나리오

```bash
# 세션 A: Claude Code 가 실행 중
claude-code  # PID 12345, env: KIIPS_PERMISSION_GATE 미설정

# 세션 B (별개 쉘): 사용자가 rollback 을 시도
export KIIPS_PERMISSION_GATE=off

# 세션 A 로 복귀: 훅 spawn 시 env 는 여전히 원래 값 (gate active)
# → 사용자가 의도한 rollback 이 적용되지 않음
```

### 2.3 회피 방법

**올바른 rollback 절차 (3 가지 중 하나):**

1. **세션 재시작** (권장):
   ```bash
   # 현재 Claude Code 세션 종료 후 rollback env 와 함께 재기동
   KIIPS_PERMISSION_GATE=off claude-code
   ```

2. **wrapper script 에 env 영구화**:
   ```bash
   # ~/.zshrc 또는 ~/.bashrc 에 추가 (영구)
   export KIIPS_PERMISSION_GATE=off
   # 또는 프로젝트 `.envrc` (direnv 사용 시)
   ```

3. **settings.json 의 훅 경로 직접 주석 처리** (일시적 완전 비활성):
   ```json
   // "command": "node ./.claude/hooks/permissionGate.js"
   ```
   세션 재시작 없이 적용되지만, 변경 사항이 SVN/Git 에 반영되지 않도록 주의.

### 2.4 왜 이 한계를 "버그" 로 분류하지 않는가

- 이는 Unix 프로세스 env 상속 모델의 정상 동작
- Claude Code 훅은 `child_process.spawn` 으로 시작되어 부모 env 를 상속
- "런타임 중 env 변경 후 hot-reload" 를 지원하려면 훅이 파일 기반 설정(예: `.claude/hooks/.rollback-state`)을 매번 읽어야 함 — 성능/복잡도 trade-off 가 현재 방침(의존성 0, fail-closed)과 충돌

### 2.5 향후 개선 (선택적)

만약 "세션 중간 rollback" 이 강한 요구사항이 된다면:

```js
// 훅 진입 시 파일 기반 override 체크
const override = fs.existsSync(".claude/hooks/.disabled-gates")
  ? JSON.parse(fs.readFileSync(".claude/hooks/.disabled-gates", "utf8"))
  : {};
if (override.permissionGate === true) { process.exit(0); }
```

이 방식은:
- 매 훅 실행마다 파일 I/O 1회 추가 (수 ms)
- 사용자가 `.claude/hooks/.disabled-gates` 를 편집하면 즉시 반영
- `.gitignore` 에 등록하여 SVN/Git 에 커밋되지 않도록 보호

현재는 구현하지 않음 (세션 재시작으로 충분하며, 복잡도 증가 회피).

---

## 3. 요약 표

| 한계 | 영향 범위 | 회피 방법 | 해결 난이도 |
|------|----------|----------|------------|
| DQUOTE 내부 `$()` / backtick | ethicalValidator · permissionGate | 명령 분해 또는 AST rollback | 중 (tokenizer stack 확장) |
| rollback env 세션 중간 미적용 | 모든 rollback 가능 훅 | 세션 재시작 | 낮음 (파일 기반 override 추가) |
| Edit/Write file_path AST 미적용 | ethicalValidator v3.4.0 · permissionGate v3.5.1 | — (의도적 설계) | 해당 없음 |

---

## 참조

- `hooks/shellContextTokenizer.js` — AST 필터 구현
- `hooks/ethicalValidator.js` — Tier A 가드 (v3.4.0 AST 적용)
- `hooks/permissionGate.js` — Tier A 가드 (v3.5.1 AST 적용)
- `CHANGELOG.md` v3.4.0 / v3.5.0 / v3.5.1 / v3.5.2 — 릴리즈 맥락
- `docs/architecture.html` 2a 섹션 — PreToolUse 8중 가드 시각화
