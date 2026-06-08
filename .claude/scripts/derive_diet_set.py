#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-legacy-scan 결과에서 'low-risk 자동 적용 후보'를 안전 필터로 도출.
READ-ONLY 분석. 어떤 파일도 변경하지 않음."""
import json, os, re

R = json.load(open(os.path.join(os.environ["TMPDIR"], "harness_result.json")))
items = R["plan"]["items"]
adv = {a["item_id"]: a for a in R["adversarial"]}

# cruft 제외
items = [it for it in items if "병합" not in it["path"] and "해당 없음" not in it["path"]]

# 절대 건드리면 안 되는 경로(hooks/settings/mcp/권한/앱코드)
FORBIDDEN = re.compile(r"\.claude/hooks/|settings\.json|settings\.local\.json|mcp\.json|permissionRules|allowed-tools|output-styles|/KiiPS-(HUB|COMMON|UTILS|FD|IL|AC|SY|LP|EL)/|app-.*\.properties")

def forbidden(it):
    return bool(FORBIDDEN.search(it["path"]))

def tier(it):
    a = adv.get(it["id"])
    v = a["verdict"] if a else "none"
    if forbidden(it):
        return "MANUAL_forbidden_zone"
    if it["action"] in ("DELETE", "CONVERT"):
        return "MANUAL_delete_or_convert"
    if v in ("downgrade", "reject"):
        return "MANUAL_adv_flagged"
    if it["risk"] == "high":
        return "MANUAL_high_risk"
    if it["risk"] == "medium":
        return "REVIEW_medium"
    # risk low, action SHRINK/SPLIT/MOVE, adv uphold/none, safe zone
    if it["action"] in ("SHRINK", "SPLIT", "MOVE"):
        return "AUTO_safe"
    return "REVIEW_other"

buckets = {}
for it in items:
    buckets.setdefault(tier(it), []).append(it)

order = ["AUTO_safe", "REVIEW_medium", "MANUAL_adv_flagged", "MANUAL_high_risk",
         "MANUAL_delete_or_convert", "MANUAL_forbidden_zone", "REVIEW_other"]
for t in order:
    lst = buckets.get(t, [])
    print(f"\n===== {t} ({len(lst)}) =====")
    for it in lst:
        a = adv.get(it["id"])
        v = a["verdict"] if a else "—"
        mt = (" → " + it["move_target"]) if it.get("move_target") else ""
        note = it.get("plan_note", "")[:95]
        print(f'  {it["id"]:>4} {it["action"]:<7} risk={it["risk"]:<6} adv={v:<9} auto={str(it["harness_diet_auto"])[:1]} | {it["path"][:60]}{mt}')
        print(f'        ↳ {note}')

print("\n\n===== AUTO_safe 상세(적용 후보) =====")
for it in buckets.get("AUTO_safe", []):
    a = adv.get(it["id"])
    print(f'\n### {it["id"]} [{it["action"]} | risk {it["risk"]} | adv {a["verdict"] if a else "none"}]')
    print("path:", it["path"])
    print("problem:", it["problem"][:300])
    print("plan_note:", it.get("plan_note", ""))
    if a:
        print("adv_reason:", a["reason"][:250])
