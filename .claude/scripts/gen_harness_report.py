#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-legacy-scan 워크플로우 결과(JSON)를 9개 섹션 마크다운 리포트로 변환.
adversarial 검증을 각 항목에 오버레이하고, 위험도/auto 플래그로 섹션을 라우팅한다.
READ-ONLY: 입력 JSON을 읽고 신규 리포트 파일 1개만 생성한다."""
import json, sys, os

SRC = sys.argv[1]
DST = sys.argv[2]

with open(SRC, encoding="utf-8") as f:
    R = json.load(f)

inv = R["inventory"]
plan = R["plan"]
items = plan["items"]
adv_list = R["adversarial"]
adv_by_id = {a["item_id"]: a for a in adv_list}

# ---- dedup-cruft filter: planner placeholder rows that only track a merge ----
def is_cruft(it):
    p = it.get("path", "")
    return ("병합" in p) or ("해당 없음" in p)

_cruft = [it["id"] for it in items if is_cruft(it)]
items = [it for it in items if not is_cruft(it)]

# ---- POST-AUDIT CORRECTIONS (verified by grep against the live harness) ----
# Inventory(run1, single Explore agent) labeled hooks "orphaned/dead" purely from
# "not directly in settings.json". A grep proved that is a false inference.
CORRECTIONS = [
    {
        "title": "‘orphaned hooks 10개 = likely dead code’ → 전원 생존 (0 dead)",
        "original": "Inventory anomaly #2 / category 'orphaned-hooks(10)': .claude/hooks/ 의 10개 훅이 settings.json 에 미와이어 → likely dead code.",
        "verify": 'grep -nE "buildChecker|impactAnalyzer|observe|shellContextTokenizer|..." .claude/hooks/postToolOrchestrator.js .claude/hooks/stopEvent.js  +  ethicalValidator.js/permissionGate.js 의 require',
        "evidence": "postToolOrchestrator.js(wired)가 autoFormatter(L28,148)·buildChecker(L29,158)·observe(L30,197)·agentStateManager(L31)·outputSecretFilter(L35,189)·themeCssVerGuard.sh(L171)·geminiAutoTrigger(L178)를 require/dispatch. stopEvent.js(wired)가 backupGc.sh(L154)·observationsRoller(L167) dispatch. shellContextTokenizer.js는 ethicalValidator.js(L49)+permissionGate.js(L42)가 require하는 공유 AST 라이브러리(isRealCodeMatch/isWellFormed 핵심).",
        "conclusion": "10개 전원 LIVE. ‘settings.json 직접 미등재 ≠ dead’ — KiiPS 훅은 통합 디스패처(postToolOrchestrator/stopEvent) 패턴. **이 10개는 삭제·축소 후보가 아니라 KEEP.** Adversarial 레이어가 해당 항목(P63)을 이미 SHRINK→KEEP 으로 자동 반전했고(‘orphan classification is a scanner artifact’), advisor 검토 + grep 으로 최종 확정.",
    },
    {
        "title": "‘.min.js 4종 = 소스/미니파이 둘 다 미와이어’ → 소스 .js 는 와이어/생존, .min.js 만 미사용 중복",
        "original": "Inventory anomaly #3: 4개 .min.js 목적 불명, 소스/미니파이 모두 미와이어.",
        "verify": 'settings.json hooks 블록 파싱 + grep "\\.min\\.js" .claude/settings.json',
        "evidence": "settings.json 은 소스 `.js`(ethicalValidator.js·permissionGate.js·postToolOrchestrator.js 등)를 와이어. `.min.js` 는 settings.json 어디에서도 참조되지 않고, 와이어된 `.js` 들은 `shellContextTokenizer`(=.js)를 require.",
        "conclusion": "소스 `.js` 4종은 **와이어/생존**(원 주장 일부 오류). `.min.js` 4종(ethicalValidator/permissionGate/postToolOrchestrator/shellContextTokenizer)은 **미사용 미니파이 중복** — 저위험 정리 후보. 단 외부 빌드 스텝이 재생성/소비하지 않는지 1회 확인 후 처리.",
    },
]

STALE_CAVEAT = (
    "⚠️ **‘stale fact’ 주장 주의**: 섹션 1·3·5의 일부 근거(포트 8301/8501, RealGrid 버전, 디렉토리명, 줄 수, "
    "특정 클래스 존재 여부 등)는 27개 per-skill 에이전트(sonnet)의 회상에 기반합니다. MyBatis-XML-부재처럼 프로젝트 "
    "메모리와 일치하는 항목도 있으나 **전부 검증된 것은 아닙니다**. 적용(apply) 단계에서 각 ‘stale fact’를 대상 파일로 "
    "스폿체크한 뒤에만 조치하세요 — sonnet 회상을 ground truth 로 취급 금지."
)

RISK_KO = {"low": "낮음", "medium": "중간", "high": "높음"}
CONF_KO = {"low": "낮음", "medium": "중간", "high": "높음"}
VERDICT_KO = {"uphold": "✅ 유지(uphold)", "downgrade": "⚠️ 하향(downgrade)", "reject": "⛔ 반려(reject)"}

def actual_action(it):
    """adversarial downgrade/reject 시 safer_action 으로 보정한 '권고 최종 조치'."""
    adv = adv_by_id.get(it["id"])
    if adv and adv["verdict"] in ("downgrade", "reject") and adv["safer_action"] not in ("", "none"):
        return adv["safer_action"]
    return it["action"]

def needs_human(it):
    adv = adv_by_id.get(it["id"])
    if it["risk"] == "high":
        return True
    if adv and adv.get("human_approval_required"):
        return True
    if adv and adv["verdict"] in ("downgrade", "reject"):
        return True
    return False

def diet_safe(it):
    adv = adv_by_id.get(it["id"])
    if not it.get("harness_diet_auto"):
        return False
    if it["risk"] != "low":
        return False
    if it["action"] == "KEEP":
        return False
    if adv and adv["verdict"] != "uphold":
        return False
    return True

def render(it, n=None):
    adv = adv_by_id.get(it["id"])
    head = f"#### {it['id']} · `{it['path']}`"
    lines = [head, ""]
    lines.append(f"- **현재 목적**: {it['current_purpose']}")
    lines.append(f"- **발견한 문제**: {it['problem']}")
    lines.append(f"- **근거**: {it['evidence']}")
    lines.append(f"- **추천 조치**: `{it['action']}`")
    mt = it.get("move_target", "").strip()
    if mt:
        lines.append(f"- **옮긴다면 추천 위치**: {mt}")
    lines.append(f"- **변경 시 위험도**: {RISK_KO.get(it['risk'], it['risk'])}")
    lines.append(f"- **신뢰도**: {CONF_KO.get(it['confidence'], it['confidence'])}")
    auto = "예 ✅" if it.get("harness_diet_auto") else "아니오 ❌ (사람 승인)"
    lines.append(f"- **/harness-diet 자동 처리 가능**: {auto}")
    if it.get("plan_note"):
        lines.append(f"- **실행 메모**: {it['plan_note']}")
    if adv:
        lines.append(f"- **🔴 Adversarial 반박**: {VERDICT_KO.get(adv['verdict'], adv['verdict'])}"
                     + (f" → 대안 `{adv['safer_action']}`" if adv['safer_action'] not in ('', 'none') else "")
                     + (f" · 사람승인필요" if adv.get('human_approval_required') else ""))
        lines.append(f"  - 반박근거: {adv['reason']}")
    lines.append("")
    return "\n".join(lines)

def section(title, subset, empty="_해당 없음._"):
    out = [f"## {title}", ""]
    if not subset:
        out.append(empty); out.append("")
        return "\n".join(out)
    for it in subset:
        out.append(render(it))
    return "\n".join(out)

# ---- group items ----
by_action = {}
for it in items:
    by_action.setdefault(it["action"], []).append(it)

keep   = by_action.get("KEEP", [])
shrink = by_action.get("SHRINK", [])
move   = by_action.get("MOVE", [])
split  = by_action.get("SPLIT", [])
convert= by_action.get("CONVERT", [])
delete = by_action.get("DELETE", [])

human  = [it for it in items if needs_human(it)]
diet   = [it for it in items if diet_safe(it)]

# adversarial stats
adv_stats = {"uphold": 0, "downgrade": 0, "reject": 0}
for a in adv_list:
    adv_stats[a["verdict"]] = adv_stats.get(a["verdict"], 0) + 1

# ---- build report ----
B = []
B.append("# 🩺 harness-legacy-scan — AI 코딩 하네스 감사 리포트")
B.append("")
B.append("> **읽기 전용 감사**. 이 리포트는 분석만 수행했으며 어떤 파일/설정/hook/MCP/권한도 변경하지 않았습니다.")
B.append("> 모든 조치(KEEP/SHRINK/MOVE/SPLIT/CONVERT/DELETE)는 **후보 분류**이며, 실제 적용은 별도 단계에서 사람 승인 후 진행합니다.")
B.append("")
B.append("| 항목 | 값 |")
B.append("|------|-----|")
B.append("| 워크플로우 | `harness-legacy-scan` (Dynamic Workflow, read-only) |")
B.append("| 에이전트 | 77 (Inventory 1 · Analysis 31 · Planner 1 · Adversarial 44) |")
B.append(f"| raw findings | 125 → dedup 후 **{len(items)} 항목**"
         + (f" (placeholder {len(_cruft)}건 제외)" if _cruft else "") + " |")
B.append("| Adversarial 검토 | 44건 (uphold {u} · downgrade {d} · reject {r}) |".format(
    u=adv_stats.get("uphold",0), d=adv_stats.get("downgrade",0), r=adv_stats.get("reject",0)))
B.append("| 읽기 전용 보장 | Explore/Plan 에이전트 타입(Edit/Write 도구 차단) + deny `rm`/`rm -rf` |")
B.append("")

# post-audit corrections callout (most important — verified facts override agent inference)
B.append("> ## ⛔ 사후 검증 정정 (POST-AUDIT CORRECTION) — 먼저 읽으세요")
B.append("> ")
B.append("> 인벤토리 단계(단일 스캐너)가 **추론을 증거로** 삼은 오판 2건을 grep 으로 검증해 정정했습니다. "
         "원 주장을 지우지 않고 보존하되, 아래 정정이 우선합니다. (이것이 읽기 전용 감사 + adversarial + 검증 게이트의 핵심 가치입니다.)")
B.append("> ")
for i, c in enumerate(CORRECTIONS, 1):
    B.append(f"> **정정 {i}. {c['title']}**")
    B.append(f"> - 원 주장: {c['original']}")
    B.append(f"> - 검증: `{c['verify']}`")
    B.append(f"> - 증거: {c['evidence']}")
    B.append(f"> - ✅ 결론: {c['conclusion']}")
    B.append("> ")
B.append("> " + STALE_CAVEAT)
B.append("")
if _cruft:
    B.append(f"_(planner dedup 추적용 placeholder {len(_cruft)}건 [{', '.join(_cruft)}] 은 렌더링에서 제외 — 실제 항목 수 {len(items)}.)_")
    B.append("")

# action distribution table
B.append("### 조치 분포 (planner 분류)")
B.append("")
B.append("| 조치 | 개수 | 의미 |")
B.append("|------|------|------|")
B.append(f"| KEEP | {len(keep)} | 현행 유지 |")
B.append(f"| SHRINK | {len(shrink)} | 길이/중복 축소 |")
B.append(f"| MOVE | {len(move)} | 전역→on-demand Skill 등으로 이동 |")
B.append(f"| SPLIT | {len(split)} | SKILL.md → reference.md/examples.md 분리 |")
B.append(f"| CONVERT | {len(convert)} | 커스텀 → 제품 네이티브 기능으로 대체 |")
B.append(f"| DELETE | {len(delete)} | 삭제 후보 |")
B.append(f"| **합계** | **{len(items)}** | |")
B.append("")
B.append(f"- **사람 승인 필요(위험)**: {len(human)}건")
B.append(f"- **/harness-diet 자동 처리 가능(low-risk)**: {len(diet)}건")
B.append("")

# inventory snapshot
B.append("### 인벤토리 스냅샷 + 이상 징후")
B.append("")
B.append("| 카테고리 | 개수 | 비고 |")
B.append("|----------|------|------|")
for c in inv["categories"]:
    cat = c["category"]
    note = c["notes"]
    if cat == "orphaned-hooks":
        cat = "~~orphaned-hooks~~ → **indirectly-wired-hooks**"
        note = "❌ 오판 정정: 10개 전원 LIVE (postToolOrchestrator/stopEvent dispatch + shellContextTokenizer는 보안훅이 require). ‘정정 1’ 참조."
    elif cat == "hook-minified-duplicates":
        note = "⚠️ .min.js 4종만 미사용 중복(저위험 정리 후보). 소스 .js 는 와이어/생존. ‘정정 2’ 참조."
    else:
        if len(note) > 90:
            note = note[:87] + "…"
    B.append(f"| {cat} | {c['item_count']} | {note} |")
B.append("")
B.append("**🚨 이상 징후 (Inventory Agent 탐지):**")
B.append("")
for i, a in enumerate(inv["anomalies"], 1):
    mark = ""
    if "ORPHANED HOOKS" in a or "orphan" in a.lower():
        mark = " — ❌ **정정됨: 위 ‘정정 1’ 참조. 10개 전원 LIVE(통합 디스패처 경유). dead code 아님 → 삭제 금지.**"
    elif "MINIFIED" in a or ".min.js" in a:
        mark = " — ⚠️ **부분 정정: 위 ‘정정 2’ 참조. 소스 .js 는 와이어/생존; .min.js 만 미사용 중복.**"
    B.append(f"{i}. {a}{mark}")
B.append("")
B.append("---")
B.append("")

# Section 1
B.append("## 1. 전체 요약")
B.append("")
B.append(plan["overall_summary"])
B.append("")

# Section 2-6
B.append("---")
B.append("")
B.append(section("2. 유지해야 할 항목 (KEEP)", keep))
B.append("---")
B.append("")
B.append(section("3. 줄여야 할 항목 (SHRINK)", shrink))
B.append("---")
B.append("")
B.append(section("4. 전역 지침에서 Skill로 옮길 항목 (MOVE)", move))
B.append("---")
B.append("")
B.append(section("5. Skill에서 reference.md / examples.md로 분리할 항목 (SPLIT)", split))
B.append("---")
B.append("")
# Section 6: DELETE + CONVERT (둘 다 '커스텀 하네스 제거' 성격)
B.append("## 6. 삭제 후보 (DELETE) + 네이티브 대체 (CONVERT)")
B.append("")
B.append("> `DELETE`는 완전 제거, `CONVERT`는 커스텀 구현을 제품 네이티브 기능으로 대체(=커스텀 제거)하는 것이므로 함께 묶습니다.")
B.append("")
B.append("### 6-A. DELETE")
B.append("")
if delete:
    for it in delete:
        B.append(render(it))
else:
    B.append("_해당 없음._\n")
B.append("### 6-B. CONVERT (네이티브로 대체)")
B.append("")
if convert:
    for it in convert:
        B.append(render(it))
else:
    B.append("_해당 없음._\n")
B.append("---")
B.append("")

# Section 7
B.append(section("7. 사람이 직접 승인해야 하는 위험한 변경", human,
                 empty="_위험도 high 이거나 Adversarial이 하향/반려한 항목 없음._"))
B.append("> 기준: 위험도 `높음` **또는** Adversarial이 `downgrade`/`reject` **또는** `human_approval_required=true`. "
         "권한/hook/MCP/보안 항목은 정의상 모두 여기에 포함됩니다.")
B.append("")
B.append("---")
B.append("")

# Section 8
B.append("## 8. /harness-diet로 넘겨도 되는 low-risk 변경 목록")
B.append("")
B.append("> 기준: `harness_diet_auto=true` **그리고** 위험도 `낮음` **그리고** Adversarial `uphold`(반박 통과). "
         "아래만 자동 처리 후보이며, 그 외 전부는 사람 검토 대상입니다.")
B.append("")
if diet:
    B.append("| ID | 경로 | 조치 | 실행 메모 |")
    B.append("|----|------|------|-----------|")
    for it in diet:
        note = it.get("plan_note", "").replace("|", "\\|")
        if len(note) > 70:
            note = note[:67] + "…"
        B.append(f"| {it['id']} | `{it['path']}` | {it['action']} | {note} |")
    B.append("")
    B.append("**상세:**")
    B.append("")
    for it in diet:
        B.append(render(it))
else:
    B.append("_low-risk 자동 처리 후보 없음 — 모든 변경이 사람 검토를 요합니다._")
    B.append("")
B.append("---")
B.append("")

# Section 9
diet_ids = ", ".join(it["id"] for it in diet) if diet else "(없음)"
B.append("## 9. /harness-diet 실행용 추천 프롬프트")
B.append("")
B.append("> `/harness-diet`는 아직 존재하지 않는 후속 커맨드입니다. 아래는 그 도구(또는 수동 적용 세션)에 넣을 추천 프롬프트입니다. "
         "**low-risk 화이트리스트만** 자동 적용하고, 나머지는 건너뛰며 보고하도록 설계했습니다.")
B.append("")
B.append("```text")
B.append("harness-legacy-scan 리포트(.claude/docs/harness-legacy-scan-report.md)를 입력으로 받아")
B.append("하네스 다이어트를 '제한적·증분적'으로 적용해줘.")
B.append("")
B.append("적용 범위 (화이트리스트 — 이 ID만 자동 적용):")
B.append(f"  {diet_ids}")
B.append("")
B.append("규칙:")
B.append("1. 위 화이트리스트 ID의 조치만 적용한다. 그 외 항목은 절대 건드리지 말고 '보류'로 보고.")
B.append("2. 권한(allowed-tools) / hook / MCP / 보안(settings.json, settings.local.json, .claude/mcp.json, .claude/hooks/**)은")
B.append("   이번에도 절대 수정하지 않는다. 발견만 재확인.")
B.append("3. 각 변경 전 대상 파일을 svn diff 가능한 상태로 백업하고, 변경 후 즉시 검증:")
B.append("   - SKILL.md 분리(SPLIT) 시: 원본 description/frontmatter 보존, reference.md/examples.md 링크 추가, skills-registry 갱신.")
B.append("   - rules 축소(SHRINK) 시: CLAUDE.md의 링크·표 무결성 확인.")
B.append("4. 3개 파일 이상 변경 시 multiFileGate 규칙대로 변경 목록을 먼저 제시하고 승인을 받는다.")
B.append("5. 한 번에 한 항목씩 적용→검증→다음. 회귀 발생 시 즉시 svn revert 후 보고.")
B.append("6. 완료 후 '적용/보류/실패' 3열 요약표를 출력한다.")
B.append("")
B.append("먼저 적용 계획(어떤 ID를 어떤 순서로)을 제시하고 내 승인을 기다려라.")
B.append("```")
B.append("")
B.append("**별도 사람 승인 트랙** (섹션 7, 자동 처리 금지): 아래는 가치가 크지만 위험하거나 외부 영향이 있어 "
         "반드시 대화형으로 하나씩 결정해야 합니다.")
B.append("")
hi_value = [it for it in human if it["action"] in ("CONVERT", "DELETE")] + \
           [it for it in human if it["action"] not in ("CONVERT", "DELETE")]
seen = set()
for it in hi_value[:12]:
    if it["id"] in seen:
        continue
    seen.add(it["id"])
    adv = adv_by_id.get(it["id"])
    tag = f" · 반박:{adv['verdict']}" if adv else ""
    B.append(f"- **{it['id']}** `{it['path']}` — {it['action']} (위험 {RISK_KO.get(it['risk'])}{tag})")
B.append("")
B.append("---")
B.append("")

# Appendix: full table
B.append("## 부록 A. 전체 63항목 요약표")
B.append("")
B.append("| ID | 경로 | 조치 | 위험 | 신뢰 | auto | 반박 |")
B.append("|----|------|------|------|------|------|------|")
for it in sorted(items, key=lambda x: (x["action"], x["id"])):
    adv = adv_by_id.get(it["id"])
    verdict = adv["verdict"] if adv else "—"
    auto = "✅" if it.get("harness_diet_auto") else "❌"
    p = it["path"]
    if len(p) > 48:
        p = "…" + p[-45:]
    B.append(f"| {it['id']} | `{p}` | {it['action']} | {RISK_KO.get(it['risk'],'')[:2]} | {CONF_KO.get(it['confidence'],'')[:2]} | {auto} | {verdict} |")
B.append("")
B.append("## 부록 B. 방법론")
B.append("")
B.append("- **7개 관점 에이전트**: Inventory · Global Context Tax · Skill Quality(스킬당 1, ×27) · Cross-Skill Overlap · Product Overlap · Safety&Permission · Refactor Planner · Adversarial Reviewer.")
B.append("- **읽기 전용 2중 보장**: (1) `Explore`/`Plan` 에이전트 타입이 Edit/Write/NotebookEdit 도구를 제거, (2) 기존 `permissionRules` deny `rm`/`rm -rf`.")
B.append("- **중복 탐지 보강**: 격리된 per-skill 에이전트는 스킬 간 중복을 원리적으로 못 보므로, 모든 description을 한 컨텍스트에서 비교하는 Cross-Skill Overlap 에이전트를 추가.")
B.append("- **Product Overlap 근거 고정**: 추측 대신 현재 관측된 네이티브 기능(plan mode, TodoWrite, sandbox, native hooks/skills/permissions, /code-review 등)을 1차 증거로 사용.")
B.append("- **Adversarial 게이트**: 모든 DELETE/SHRINK/MOVE/CONVERT 및 auto-flagged 항목을 독립 반박. 무비판적 자동 삭제를 차단.")
B.append("")

report = "\n".join(B)
os.makedirs(os.path.dirname(DST), exist_ok=True)
with open(DST, "w", encoding="utf-8") as f:
    f.write(report)

print(f"WROTE {DST}")
print(f"  bytes: {len(report.encode('utf-8'))}")
print(f"  items: {len(items)} | KEEP {len(keep)} SHRINK {len(shrink)} MOVE {len(move)} SPLIT {len(split)} CONVERT {len(convert)} DELETE {len(delete)}")
print(f"  human-approval: {len(human)} | diet-safe: {len(diet)}")
print(f"  adversarial: uphold {adv_stats.get('uphold',0)} / downgrade {adv_stats.get('downgrade',0)} / reject {adv_stats.get('reject',0)}")
