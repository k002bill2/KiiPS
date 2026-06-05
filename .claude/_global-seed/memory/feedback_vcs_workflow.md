---
name: VCS 워크플로우 실제 사용 패턴
description: KiiPS는 SVN(IntelliJ)+Git(.claude/) 이중 VCS 구조. SVN CLI 커밋 커맨드는 불필요.
type: feedback
---

KiiPS 소스 코드는 SVN으로 형상관리하지만, SVN 커밋은 **IntelliJ에서 수동**으로 수행한다.
Git은 `.claude/` 설정 파일(스킬, 커맨드, 훅, 에이전트 등)을 관리하는 용도로만 사용한다.

**Why:** SVN CLI 커밋 자동화(`/svn-commit`)는 실제 워크플로우와 맞지 않음. 사용자는 IntelliJ의 SVN 통합을 사용.

**How to apply:**
- SVN commit 관련 CLI 자동화 커맨드를 제안하지 말 것
- `.claude/` 변경사항 커밋은 Git 기반 커맨드 사용
- 소스 코드 변경 후 "커밋하시겠습니까?" 같은 제안 시 SVN이 아닌 IntelliJ 사용을 안내
