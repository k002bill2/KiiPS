# FD0101 도움말+영상 — Tasks

> 체크 기준: 실행 증거 확보 시에만 [x] (verification.md 규칙)

## A. 완료 (증거 확보됨)

- [x] 도움말 HTML — 핫스팟 10·투어·시뮬레이션·다크모드·반응형 (콘솔 0건, 3모드 실측)
- [x] 안내영상 v2 — 카메라 워크+커서+내레이션 159초 (4776프레임, PCM 가청 검증)
- [x] 영상 임베드 — 645px 미리보기, readyState 4 실측, 고지문 삭제
- [x] 스킬 `kiips-screen-help-video` — 8파일, 검증 12건 반영, 등록 3처, 테스트 4종 통과

## B. 미결 결정 — 2026-08-25 사용자 결정 완료

- [x] v1 mp4 삭제 (확인 시점에 이미 부재 — 목표 상태 달성)
- [x] `.gemini/skill-rules.json` 동기화 — 제작 파이프라인이므로 `claudeOnly` 목록에 등재
- [x] 커밋에 mp4(21.6MB) 포함 결정

## C. 마무리 작업

- [x] B 결정 반영 + 유령 디렉토리(`docs/help/.claude/` observe.js 오생성) 정리
- [x] `git status` 전수 확인 (커밋 후 클린 0건)
- [x] 커밋 3건: `1745b3e` docs(help) / `6a6a58f` feat(harness) / `801b02c` chore(dev-docs)
- [ ] PR 생성 여부 확인 (`docs/fd0101-help-page` → main) ← **마지막 남은 결정**

## D. 선택 (사용자 지시 시에만)

- [ ] FD0201 등 두 번째 화면에 스킬 적용 — 파이프라인 재현성 실전 검증 (예상 1~2시간)
- [ ] reduced-motion 정적 영상 버전 (예상 20분)
- [ ] 영상 t05 maxScale 3.0 고정 재렌더 (예상 15분)

## 완료 정의

B·C 전체 체크 시 **개발완료** — `dev/active/fd0101-help-video/` → `dev/completed/`로 이동.
