# SVN Workflow Rules

> KiiPS는 Git이 아닌 SVN을 사용합니다.

## 기본 규칙

1. **SVN 사용** - Git 명령어 대신 SVN 명령어 사용
2. **업데이트** - 작업 전 `svn up` 으로 최신 소스 동기화
3. **커밋 전 확인** - `svn status` + `svn diff` 로 변경사항 검토

## 주요 명령어

| 작업 | 명령어 |
|------|--------|
| 업데이트 | `svn up` |
| 상태 확인 | `svn status` |
| 변경 내용 | `svn diff` |
| 커밋 | `svn commit -m "메시지"` |
| 되돌리기 | `svn revert <파일>` |
| 추가 | `svn add <파일>` |
| 로그 확인 | `svn log -l 10` |

## 커밋 메시지 규칙

```
[모듈] 작업유형: 변경 내용 요약

예시:
[KiiPS-FD] fix: 펀드 목록 조회 오류 수정
[KiiPS-UI] feat: PG0444 신규 페이지 추가
[KiiPS-COMMON] refactor: 공통 유틸 메서드 정리
```

## 주의사항

- `.claude/` 디렉토리는 SVN 커밋 대상이 아님 (로컬 전용)
- `app-local.properties` 커밋 금지 (로컬 환경 설정)
- 프로덕션 설정 파일 변경 시 반드시 사용자 확인
