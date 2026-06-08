# SVN Workflow Rules

> KiiPS는 Git이 아닌 SVN을 사용합니다.

## 기본 규칙

1. **SVN 사용** - Git 명령어 대신 SVN 명령어 사용
2. **업데이트** - 작업 전 `svn up` 으로 최신 소스 동기화
3. **커밋 전 확인** - `svn status` + `svn diff` 로 변경사항 검토

## 주의사항

- `.claude/` 디렉토리는 SVN 커밋 대상이 아님 (로컬 전용)
- `app-local.properties` 커밋 금지 (로컬 환경 설정)
- 프로덕션 설정 파일 변경 시 반드시 사용자 확인
