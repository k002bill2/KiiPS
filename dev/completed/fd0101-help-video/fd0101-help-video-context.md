# FD0101 도움말+영상 — Context

> 마지막 업데이트: 2026-08-25 (세션: 스킬화 완료 직후)

## 산출물 위치 (정본)

| 자산 | 경로 | 비고 |
|------|------|------|
| 도움말 HTML | `docs/help/FD0101-펀드정보-도움말.html` | 자립형, 임베드 완료 |
| 안내영상 v2 | `docs/help/FD0101-guide.mp4` | 21.6MB, HTML이 참조 |
| ⚠️구버전 v1 | `docs/help/fd0101-guide-web.mp4` | 8.8MB, 미참조 — 정리 결정 대기 |
| 파이프라인 스킬 | `.claude/skills/kiips-screen-help-video/` | templates/에 영상 엔진 코드 영구 보존 |
| 트리거 등록 | 루트 `skill-rules.json`(37엔트리) · `.claude/SKILLS.md`(32개) · `skills-registry.json` | 무결성 테스트 통과 |

⚠️ 영상 Remotion 프로젝트 원본은 **세션 스크래치패드에 있어 세션 종료 시 소멸** —
재제작 시 스킬 `templates/`가 유일한 정본. 절차는 스킬 `examples.md` 참조.

## 핵심 아키텍처 결정

1. **문서 크롬 vs kx-* 모사 분리** — 도움말 자체 디자인 토큰과 KiiPS 실측 토큰을 분리.
   kx-*는 실제 라이트 화면 재현이 목적이라 다크모드에서도 라이트 유지(사용자 승인).
2. **디자인 취향(사용자 확정)** — 고딕(Pretendard)+딥 블루, 장식(세리프·스탬프·괘선) 거부.
   살아남은 것: 인주 빨강 마커, "제N장" 라벨, 72ch→폭 통일, keep-all.
3. **다크모드 3중 구조** — `:root` 라이트 / `@media prefers-dark + :not([data-theme=light])` /
   `[data-theme=dark]` + 토글(localStorage `fd0101HelpTheme`) + head 인라인 FOUC 방지.
4. **영상 카메라** — 사용자 제공 Camera.tsx 채택(비대칭 이징, rect→배율, 상한 3.0).
   줌 타깃 = union(스포트라이트, 팝오버). 소스는 DPR2(3840×2160) 필수.
5. **장면 길이 = 오디오 주도** — 8f 리드인 + 오디오 + 20f 테일(>전환 12f) 공식.
6. **스킬 구조 예외** — templates/ 하위 디렉토리는 31개 스킬 중 유일(코드 자산 보존 목적,
   SKILLS.md에 예외 명시).

## 제약·의존성

- 도움말: 외부 CDN 1개(jsdelivr Pretendard) — 오프라인 폴백 시스템 폰트
- 영상 재제작: `uvx edge-tts`(네트워크·**sandbox off 필수**), Remotion(npm), chrome-devtools MCP
- git 브랜치 작업(예외적) — 평소 KiiPS는 SVN. `.claude/`는 SVN 커밋 금지 유지
- 상세 함정 목록: 스킬 `reference.md` Part 2 + 메모리 `project_kiips_fd0101_help_page.md`

## 다음 단계 (재개 시 여기부터)

1. `fd0101-help-video-tasks.md`의 미결 결정 3건을 사용자에게 확인
2. 결정 반영(파일 정리) 후 커밋 초안 제시 → 승인 시 커밋/PR
3. (지시 시) FD0201 등 두 번째 화면에 스킬 적용해 재현성 검증
