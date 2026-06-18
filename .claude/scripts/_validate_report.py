import json, os
R = json.load(open(os.path.join(os.environ["TMPDIR"], "harness_result.json")))
items = R["plan"]["items"]
adv = {a["item_id"]: a for a in R["adversarial"]}
auto = [it for it in items if it.get("harness_diet_auto")]
print("harness_diet_auto=true total:", len(auto))
print("  risk=low:", sum(1 for it in auto if it["risk"] == "low"))
print("  risk=low & action != KEEP:", sum(1 for it in auto if it["risk"] == "low" and it["action"] != "KEEP"))
print("  + adv none/uphold:", sum(1 for it in auto if it["risk"] == "low" and it["action"] != "KEEP" and (it["id"] not in adv or adv[it["id"]]["verdict"] == "uphold")))
print()
print("=== diet-safe ===")
for it in items:
    if it.get("harness_diet_auto") and it["risk"] == "low" and it["action"] != "KEEP" and (it["id"] not in adv or adv[it["id"]]["verdict"] == "uphold"):
        print(it["id"], it["path"], it["action"], "| adv:", adv.get(it["id"], {}).get("verdict", "none"))
print()
print("=== adversarial REJECT (do not touch) ===")
for a in R["adversarial"]:
    if a["verdict"] == "reject":
        print("-", a["item_id"], a["path"], "|", a["original_action"], "->", a["safer_action"])
print()
print("=== DELETE ===")
for it in items:
    if it["action"] == "DELETE":
        print(it["id"], it["path"], "| adv:", adv.get(it["id"], {}).get("verdict", "none"), "| risk", it["risk"])
print()
print("=== top CONVERT (native replacement) ===")
for it in items:
    if it["action"] == "CONVERT":
        print(it["id"], it["path"], "| adv:", adv.get(it["id"], {}).get("verdict", "none"))
