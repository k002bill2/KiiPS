#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-diet 적용 결과 독립 검증 (에이전트 주장 불신).
보존(conservation): 아카이브 원본의 모든 non-blank·non-'---' 라인이 결과 파일 합본에 존재.
도달성(reachability): SKILL.md가 새 파일을 링크.
frontmatter 불변, 파일 범위. READ-ONLY (아무것도 변경 안 함)."""
import re, sys

ROOT = "/Users/younghwankang/WORK/WORKSPACE/KiiPS"
ARCH = ROOT + "/.claude/archive/harness-diet-2026-06-08/originals"

def norm_lines(path):
    try:
        with open(path, encoding="utf-8") as f:
            raw = f.read().splitlines()
    except FileNotFoundError:
        return None
    out = []
    for ln in raw:
        s = ln.strip()
        if not s:
            continue
        if s == "---":
            continue
        out.append(s)
    return out

def frontmatter(path):
    with open(path, encoding="utf-8") as f:
        txt = f.read()
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    return m.group(1) if m else None

def conservation(orig, results, name):
    o = norm_lines(orig)
    union = set()
    for r in results:
        rl = norm_lines(r)
        if rl is None:
            print(f"  [{name}] ❌ 결과 파일 없음: {r}")
            return False
        union |= set(rl)
    missing = [l for l in o if l not in union]
    print(f"  [{name}] 원본 substantive 라인 {len(o)} | 결과 합본 유니크 {len(union)} | 누락 {len(missing)}")
    if missing:
        print(f"  [{name}] ❌ 누락 라인 샘플(최대 8):")
        for l in missing[:8]:
            print("       -", l[:100])
        return False
    print(f"  [{name}] ✅ 보존 OK (원본 모든 라인 결과에 존재)")
    return True

ok = True

print("===== P10: svn-workflow.md (DELETE, not move) =====")
cur = norm_lines(ROOT + "/.claude/rules/svn-workflow.md")
curset = set(cur)
# 유지되어야 할 핵심
keep_must = ["1. **SVN 사용** - Git 명령어 대신 SVN 명령어 사용",
             "- `app-local.properties` 커밋 금지 (로컬 환경 설정)",
             "- 프로덕션 설정 파일 변경 시 반드시 사용자 확인"]
# 제거되어야 할 것
remove_must = ["| 업데이트 | `svn up` |", "[KiiPS-FD] fix: 펀드 목록 조회 오류 수정"]
for k in keep_must:
    s = "✅" if k in curset else "❌ 누락!"
    if k not in curset: ok = False
    print(f"  유지확인 {s}: {k[:60]}")
for r in remove_must:
    s = "✅ 제거됨" if r not in curset else "❌ 아직 존재!"
    if r in curset: ok = False
    print(f"  제거확인 {s}: {r[:60]}")
print(f"  현재 라인수: {len(cur)} (목표 ~15)")

print("\n===== P17: kiips-checklist-list-popup (SPLIT) =====")
base = ROOT + "/.claude/skills/kiips-checklist-list-popup"
ok &= conservation(ARCH + "/skills/kiips-checklist-list-popup/SKILL.md",
                   [base + "/SKILL.md", base + "/examples.md", base + "/reference.md"], "P17")
# frontmatter 불변
fo = frontmatter(ARCH + "/skills/kiips-checklist-list-popup/SKILL.md")
fn = frontmatter(base + "/SKILL.md")
fm_ok = (fo == fn)
ok &= fm_ok
print(f"  [P17] frontmatter 불변: {'✅' if fm_ok else '❌ 변경됨!'}")
# 도달성: SKILL.md가 examples/reference 링크
skill = open(base + "/SKILL.md", encoding="utf-8").read()
r_ex = "examples.md" in skill
r_ref = "reference.md" in skill
ok &= (r_ex and r_ref)
print(f"  [P17] 도달성: examples.md 링크 {'✅' if r_ex else '❌'} | reference.md 링크 {'✅' if r_ref else '❌'}")
notfor = "사용하지 말아야 할 때" in skill
ok &= notfor
print(f"  [P17] NOT-for 본문 섹션: {'✅' if notfor else '❌'}")

print("\n===== P49: kiips-frontend-guidelines (SPLIT) =====")
base2 = ROOT + "/.claude/skills/kiips-frontend-guidelines"
ok &= conservation(ARCH + "/skills/kiips-frontend-guidelines/SKILL.md",
                   [base2 + "/SKILL.md", base2 + "/reference.md"], "P49")
fo2 = frontmatter(ARCH + "/skills/kiips-frontend-guidelines/SKILL.md")
fn2 = frontmatter(base2 + "/SKILL.md")
fm_ok2 = (fo2 == fn2)
ok &= fm_ok2
print(f"  [P49] frontmatter 불변: {'✅' if fm_ok2 else '❌ 변경됨!'}")
skill2 = open(base2 + "/SKILL.md", encoding="utf-8").read()
r_ref2 = "reference.md" in skill2
ok &= r_ref2
print(f"  [P49] 도달성: reference.md 링크 {'✅' if r_ref2 else '❌'}")
# 폼 컴포넌트 CRITICAL 섹션 보존 확인
form_kept = "폼 컴포넌트 절대 규칙" in skill2
ok &= form_kept
print(f"  [P49] 폼 컴포넌트 절대 규칙(CRITICAL) 보존: {'✅' if form_kept else '❌'}")
# 다크모드는 reference로 이동(SKILL엔 본문 없어야, 단 링크/언급은 가능)
dark_in_ref = "다크모드 자동 연동" in open(base2 + "/reference.md", encoding="utf-8").read()
ok &= dark_in_ref
print(f"  [P49] 다크모드 섹션 reference.md 존재: {'✅' if dark_in_ref else '❌'}")
notfor2 = "사용하지 말아야 할 때" in skill2
ok &= notfor2
print(f"  [P49] NOT-for 본문 섹션: {'✅' if notfor2 else '❌'}")

print("\n===== 종합 =====")
print("ALL PASS ✅" if ok else "FAIL ❌ — 위 항목 확인")
sys.exit(0 if ok else 1)
