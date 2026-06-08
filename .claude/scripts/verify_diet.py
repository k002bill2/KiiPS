#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-diet 적용 결과 독립 검증 (에이전트/자기 주장 불신).
보존(conservation): 아카이브 원본의 모든 BODY non-blank 라인이 결과 파일 합본에 존재.
  (SPLIT은 본문을 재배치 — frontmatter는 별개로 검사. round-2에서 description은 의도적으로 narrow됨.)
도달성(reachability): SKILL.md가 새 파일을 링크. frontmatter 유효(name+description).
READ-ONLY (아무것도 변경 안 함)."""
import re, os, sys

ROOT = "/Users/younghwankang/WORK/WORKSPACE/KiiPS"
ARCH = ROOT + "/.claude/archive/harness-diet-2026-06-08/originals"

def body_lines(path):
    """frontmatter 블록을 제외한 본문의 non-blank, non-'---' 라인."""
    try:
        txt = open(path, encoding="utf-8").read()
    except FileNotFoundError:
        return None
    # strip leading frontmatter (--- ... ---)
    m = re.match(r"^---\n.*?\n---\n", txt, re.S)
    if m:
        txt = txt[m.end():]
    out = []
    for ln in txt.splitlines():
        s = ln.strip()
        if not s or s == "---":
            continue
        out.append(s)
    return out

def frontmatter(path):
    txt = open(path, encoding="utf-8").read()
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    return m.group(1) if m else None

def conservation(orig, results, name):
    o = body_lines(orig)
    union = set()
    for r in results:
        rl = body_lines(r)
        if rl is None:
            print(f"  [{name}] ❌ 결과 파일 없음: {r}"); return False
        union |= set(rl)
    missing = [l for l in o if l not in union]
    print(f"  [{name}] 원본 BODY 라인 {len(o)} | 결과 합본 유니크 {len(union)} | 누락 {len(missing)}")
    if missing:
        print(f"  [{name}] ❌ 본문 누락 샘플:")
        for l in missing[:8]:
            print("       -", l[:100])
        return False
    print(f"  [{name}] ✅ 본문 보존 OK")
    return True

def fm_valid(path, label):
    fm = frontmatter(path)
    ok = fm is not None and "name:" in fm and "description:" in fm
    print(f"  [{label}] frontmatter 유효(name+description): {'✅' if ok else '❌'}")
    return ok

ok = True

print("===== P10: svn-workflow.md (DELETE) =====")
cur = set(body_lines(ROOT + "/.claude/rules/svn-workflow.md"))
for k in ["1. **SVN 사용** - Git 명령어 대신 SVN 명령어 사용",
          "- `app-local.properties` 커밋 금지 (로컬 환경 설정)",
          "- 프로덕션 설정 파일 변경 시 반드시 사용자 확인"]:
    s = k in cur; ok &= s
    print(f"  유지확인 {'✅' if s else '❌ 누락!'}: {k[:55]}")
for r in ["| 업데이트 | `svn up` |", "[KiiPS-FD] fix: 펀드 목록 조회 오류 수정"]:
    g = r not in cur; ok &= g
    print(f"  제거확인 {'✅' if g else '❌ 잔존!'}: {r[:55]}")

print("\n===== P17: checklist-list-popup (SPLIT, body 보존) =====")
base = ROOT + "/.claude/skills/kiips-checklist-list-popup"
ok &= conservation(ARCH + "/skills/kiips-checklist-list-popup/SKILL.md",
                   [base + "/SKILL.md", base + "/examples.md", base + "/reference.md"], "P17")
ok &= fm_valid(base + "/SKILL.md", "P17")
sk = open(base + "/SKILL.md", encoding="utf-8").read()
r = ("examples.md" in sk and "reference.md" in sk); ok &= r
print(f"  [P17] 도달성(examples+reference 링크): {'✅' if r else '❌'}")
nf = "사용하지 말아야 할 때" in sk; ok &= nf
print(f"  [P17] NOT-for 섹션: {'✅' if nf else '❌'}")

print("\n===== P49: frontend-guidelines (SPLIT, body 보존) =====")
b2 = ROOT + "/.claude/skills/kiips-frontend-guidelines"
ok &= conservation(ARCH + "/skills/kiips-frontend-guidelines/SKILL.md",
                   [b2 + "/SKILL.md", b2 + "/reference.md"], "P49")
ok &= fm_valid(b2 + "/SKILL.md", "P49")
sk2 = open(b2 + "/SKILL.md", encoding="utf-8").read()
r2 = "reference.md" in sk2; ok &= r2
print(f"  [P49] 도달성(reference 링크): {'✅' if r2 else '❌'}")
fk = "폼 컴포넌트 절대 규칙" in sk2; ok &= fk
print(f"  [P49] 폼 컴포넌트 CRITICAL 보존: {'✅' if fk else '❌'}")
nf2 = "사용하지 말아야 할 때" in sk2; ok &= nf2
print(f"  [P49] NOT-for 섹션: {'✅' if nf2 else '❌'}")
dk = "다크모드 자동 연동" in open(b2 + "/reference.md", encoding="utf-8").read(); ok &= dk
print(f"  [P49] 다크모드 reference.md 존재: {'✅' if dk else '❌'}")

print("\n===== P23: kiips-test-runner (round-2, dead stopEvent 제거) =====")
t = open(ROOT + "/.claude/skills/kiips-test-runner/SKILL.md", encoding="utf-8").read()
ok &= fm_valid(ROOT + "/.claude/skills/kiips-test-runner/SKILL.md", "P23")
dead = ("runAutoTests" not in t and "✅ 100% (Java)" not in t); ok &= dead
print(f"  [P23] dead 자동실행 콘텐츠 제거: {'✅' if dead else '❌ 잔존!'}")
useful = "mvn test -pl" in t; ok &= useful
print(f"  [P23] 유용 콘텐츠(수동 실행) 보존: {'✅' if useful else '❌'}")

print("\n===== P29: periodic-cleanup NOT-for =====")
nf3 = "사용하지 말아야 할 때" in open(ROOT + "/.claude/commands/periodic-cleanup.md", encoding="utf-8").read(); ok &= nf3
print(f"  [P29] NOT-for 섹션: {'✅' if nf3 else '❌'}")

print("\n===== 종합 =====")
print("ALL PASS ✅" if ok else "FAIL ❌ — 위 항목 확인")
sys.exit(0 if ok else 1)
