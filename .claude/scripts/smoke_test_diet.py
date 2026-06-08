#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""harness-diet smoke-test (기계 검증 가능 부분). 트리거 '발동'은 fresh 세션 필요 → 프롬프트로 안내.
READ-ONLY."""
import re, os, sys

ROOT = "/Users/younghwankang/WORK/WORKSPACE/KiiPS"
results = []

def chk(name, cond, detail=""):
    results.append((cond, name, detail))
    print(f"  {'✅' if cond else '❌'} {name}" + (f" — {detail}" if detail else ""))

def read(p):
    with open(p, encoding="utf-8") as f:
        return f.read()

def frontmatter(txt):
    m = re.match(r"^---\n(.*?)\n---\n", txt, re.S)
    return m.group(1) if m else None

print("===== 시나리오 1: SVN 안전장치 생존 (svn-workflow.md) =====")
svn = read(ROOT + "/.claude/rules/svn-workflow.md")
chk("SVN-우선 원칙 보존", "SVN 사용" in svn and "Git 명령어 대신" in svn)
chk("app-local.properties 커밋 금지 보존", "app-local.properties" in svn and "커밋 금지" in svn)
chk("프로덕션 설정 확인 보존", "프로덕션 설정 파일 변경 시" in svn)
chk("장황한 명령어 표 제거됨", "| 업데이트 | `svn up` |" not in svn)

print("\n===== 시나리오 2: checklist-popup 발동 + 보조파일 도달 =====")
base = ROOT + "/.claude/skills/kiips-checklist-list-popup"
cl = read(base + "/SKILL.md")
fm = frontmatter(cl)
chk("frontmatter 유효(name+description)", fm is not None and "name:" in fm and "description:" in fm)
chk("트리거 키워드 보존(체크리스트 목록/list popup)", "체크리스트 목록" in (fm or "") and "list popup" in (fm or ""))
chk("examples.md 존재+링크", os.path.exists(base + "/examples.md") and "examples.md" in cl)
chk("reference.md 존재+링크", os.path.exists(base + "/reference.md") and "reference.md" in cl)
chk("examples.md에 HTML/이벤트 코드 실재", "```" in read(base + "/examples.md"))

print("\n===== 시나리오 3: checklist NOT-for 작동 =====")
chk("'사용하지 말아야 할 때' 섹션 존재", "사용하지 말아야 할 때" in cl)
chk("일반 팝업→realgrid/regist-modal 유도 문구", ("kiips-realgrid-guide" in cl or "kiips-regist-modal-guide" in cl))

print("\n===== 시나리오 4: frontend reference 도달 =====")
base2 = ROOT + "/.claude/skills/kiips-frontend-guidelines"
fg = read(base2 + "/SKILL.md")
chk("frontend frontmatter 유효", frontmatter(fg) is not None)
chk("reference.md 존재+링크", os.path.exists(base2 + "/reference.md") and "reference.md" in fg)
chk("다크모드 상세가 reference.md에 실재", "다크모드 자동 연동" in read(base2 + "/reference.md"))
chk("폼 컴포넌트 CRITICAL 본문 보존", "폼 컴포넌트 절대 규칙" in fg)

print("\n===== 시나리오 5: frontend NOT-for 유도 =====")
chk("'사용하지 말아야 할 때' 섹션 존재", "사용하지 말아야 할 때" in fg)
chk("전용 스킬 유도(realgrid/search/regist/button/scss)",
    all(k in fg for k in ["kiips-realgrid-guide", "kiips-scss"]))

passed = sum(1 for c, _, _ in results if c)
total = len(results)
print(f"\n===== 기계 검증: {passed}/{total} PASS =====")
print("⚠️ 트리거 '실제 발동'은 fresh 세션에서만 확인 가능 — 아래 프롬프트로 수동 검증 권장.")
sys.exit(0 if passed == total else 1)
