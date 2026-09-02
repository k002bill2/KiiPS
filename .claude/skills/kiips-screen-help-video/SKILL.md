---
name: kiips-screen-help-video
description: "KiiPS 화면코드 1개(FD0101, FD0201 등)를 입력받아 ①인터랙티브 도움말 HTML(docs/help/)과 ②성우 내레이션 안내영상(MP4)을 제작·임베드하는 2단계 파이프라인. Use when: 화면 도움말, 도움말 페이지, 도움말 만들어, 화면 소개 영상, 안내 영상, 튜토리얼 영상, 화면 가이드 영상, 내레이션 영상, help video, 사용법 안내, 가이드 투어. NOT for: 일반 페이지 생성(kiips-page-harness), RealGrid 설정(kiips-realgrid-guide), 검색필터 구현(kiips-search-filter-guide), 접근성 단독 점검(kiips-a11y-guide), 일반 영상 편집(ecc:video-editing)"
---

# KiiPS 화면 도움말 + 안내영상 파이프라인

> 화면코드 하나를 받아 **인터랙티브 도움말 HTML**(연습 화면 시뮬레이션 + 핫스팟 + 가이드 투어)과 **성우 내레이션 MP4**를 만들고 도움말에 임베드한다.

## 기준 구현체 (정본)

| 산출물 | 정본 경로 |
|--------|-----------|
| 도움말 HTML | `docs/help/FD0101-펀드정보-도움말.html` (리포 상대경로. 자립형 단일 HTML, 외부 의존은 Pretendard CDN 1건) |
| 영상 프로젝트 | 이 스킬의 `templates/` (Camera.tsx · Video.tsx · build_scenes.py · remotion-project.md) — **영상 프로젝트는 세션 스크래치패드에 스캐폴드되어 세션 종료 시 소멸**하므로 templates/가 유일한 정본이다 |

> ⚠️ 이 스킬은 "그대로 복사" 코드 자산을 담는 `templates/` 하위 디렉토리를 포함한다 — 문서는 평면 구조(reference.md·examples.md), 템플릿 자산만 예외.

## Purpose

### What This Skill Does
- 대상 화면의 실제 동작(필터·툴바·그리드·모달)을 소스에서 실측한 뒤, FD0101 정본을 이식해 새 화면 도움말 HTML을 제작
- Remotion 4.x + edge-tts 로 DPR2 스틸 기반 줌/커서/캡션 안내영상을 렌더
- 오디오 가청·화면 스틸·용량(30MiB) 증거 기반 검증 후 도움말에 `<video>` 임베드

### What This Skill Does NOT Do
- 실제 KiiPS JSP 화면의 생성·수정 (도움말은 kx-* 모사 레이어일 뿐)
- 도움말 내용의 발명 — 화면 동작 서술은 반드시 소스/실측 근거 필요

### Related Skills
| 스킬 | 연동 포인트 |
|------|------------|
| kiips-search-filter-guide | 필터 자동재조회 비대칭 등 도움말 서술의 소스 근거 확인 |
| kiips-button-guide | 툴바 버튼 화면ID 분기 실측 |
| ecc:remotion-video-creation | Remotion 일반 베스트 프랙티스 (본 스킬 절차가 우선) |

## When to Use

### User Prompt Keywords
화면 도움말, 도움말 페이지, 도움말 만들어, 화면 소개 영상, 안내 영상, 튜토리얼 영상, 화면 가이드 영상, 내레이션 영상, help video, 사용법 안내, 가이드 투어

> 이 키워드 목록은 frontmatter description 및 루트 `skill-rules.json` promptTriggers와 한 벌로 동기 유지.

### Intent Patterns
```
(FD|PG|MI|IL)\d{4}.*?(도움말|안내|가이드|튜토리얼|영상)
(도움말|help).*?(페이지|화면|만들|생성)
(안내|가이드|튜토리얼).*?(영상|비디오|video|mp4)
```

## 파이프라인 개요 (2단계 6절차)

```
[1단계: 도움말]  A.사실확인 → B.도움말 HTML 제작 → 브라우저 실측 검증
[2단계: 영상]    C.스틸 캡처+TTS+렌더 → D.용량 예산 게이트 → E.오디오/스틸 검증 → F.임베드
```

> 용량은 **생성 시점에 결정한다.** 다 만든 뒤 압축하는 단계는 없다 — 예산을 넘으면 렌더 파라미터를 고쳐 다시 만든다.

### 절차 1 — 화면 사실 확인 (제작 전)
[reference.md](reference.md) Part 2 A절 체크리스트 수행: 대용량 HTML "캡처" 정체 확인, 필터 자동재조회 비대칭(`inc_filter_main.jsp:201`), 툴바 버튼 화면ID 분기 실측, 기존 도움말 체계 존재 여부.

### 절차 2 — 도움말 HTML 제작
[reference.md](reference.md) Part 1 을 읽고 FD0101 정본에서 이식한다. (제작 중 함정은 Part 2 B절)
- **그대로 복사(엔진)**: 문서 토큰 3중 블록, kx CSS 라이브러리, 핫스팟/투어 엔진, 포커스 트랩, 테마 토글 등 — 8절 "그대로 복사" 목록
- **화면마다 교체**: `THEME_KEY`(화면별 고유 키!), `.kx-screen` 마크업, 가상 데이터/렌더/모달, `.hs` 세트+팝오버, IC 아이콘 맵, 시뮬레이션 시나리오 — 8절 "화면마다 교체" 목록 + ID 바인딩 계약 준수

### 절차 3 — 브라우저 실측 검증
chrome-devtools MCP 로 file:// 열어 reference.md Part 1 8절 "이식 후 검증 체크" 전 항목 수행: 라이트/다크/시스템 3상태, 핫스팟 마커 개수 = `.hs` 개수, 조회 후 마커 재배치, 투어 완주+방향키/Esc, 모달 Tab 순환·포커스 복원, localStorage 키 고유성, 900px 미만·reduced-motion.

### 절차 4 — 영상 제작
[examples.md](examples.md) 절차서를 따른다 (실명령 포함. 캡처·렌더·오디오 함정은 reference.md Part 2 C·D절).
0. templates/ 를 스크래치패드에 스캐폴드 (remotion-project.md 참조) → `npm install`
1. DPR2 스틸 캡처 (`emulate 1920x1080x2`, **렉트 실측은 캡처와 같은 패스**)
2. edge-tts 내레이션 (`uvx edge-tts --voice ko-KR-SunHiNeural --rate=-5%`, **sandbox off 필수**)
3. `build_scenes.py` SCENES 테이블 작성 → `python3 build_scenes.py` → `src/scenes.ts` 자동 생성
4. `./node_modules/.bin/remotion render src/index.ts <화면코드> out/<화면코드>-guide.mp4 --crf=26 --scale=0.6666666666666666 --audio-bitrate=64k` (sandbox off · `npx` 는 샌드박스에서 실패)

### 절차 5 — 용량 예산 게이트 (렌더 직후 · 검증 전)
[examples.md](examples.md) 7절 수행. **압축 단계가 아니라 판정 게이트다** — 초과하면 렌더 파라미터를 고쳐 다시 만든다.
- 목표 **≤ 12 MiB**(도움말 임베드 권장) / 하드 한도 30 MiB
- 스트림 분해로 원인 특정: 오디오 > 2 MiB → `--audio-bitrate=64k` 누락 / 홀드 > 1 kB per frame → 드리프트 켜짐
- 초과 시 순서: ①오디오 플래그 → ②드리프트 0 → ③`--scale`(720p) → ④`--crf` +2 → ⑤씬·내레이션 축소(**사용자 확인**)
- ①~③은 **화질 손실 없음**. 후처리 트랜스코딩 금지 — 세대 손실만 붙는다
- 화질 판정은 **임베드 표시 크기(1290px)로 축소해** 비교. 1080p 확대 비교는 과잉 판정

### 절차 6 — 오디오/스틸 검증 → 임베드 (+ reference.md Part 2 E절 수행)
- 씬별 홀드 시점 `remotion still` 스틸 추출로 화면 검증
- **오디오는 번들 ffmpeg PCM 추출 → 3지점 피크 확인**이 유일한 증거 (afinfo 는 트랙 존재만 증명)
- 영상 길이는 인코더 로그 프레임 카운트로 대조 (mdls 불가 — Part 2 C절)
- **도움말 HTML과 같은 디렉토리**에 배치, `<video controls preload="metadata">` 블록 임베드 (examples.md 9절 — 정본 마크업 그대로)
- 임베드 후 `<video>` `readyState === 4` 재생 실측 검증
- 구버전 미디어 파일 공존 정리 여부를 명시적으로 결정 (조용히 방치 금지)
- 대용량 mp4 커밋 전 사용자 확인

## 함정 체크리스트 요약 (전문 → [reference.md](reference.md) Part 2)

- 필터 **제거만** 자동재조회 (추가는 조회 버튼 필요) — 도움말 서술에 반영
- `THEME_KEY` 미교체 시 화면 간 테마 상태 공유
- 핫스팟 anchor 오타는 **조용히 마커 숨김** — 개수 육안 확인
- 렉트 실측을 별도 패스에서 하면 scrollY 편차 (실측 16px)
- 씬 길이 = 8f 리드인 + 오디오 + 20f 테일 (테일 > 전환 12f)
- `take_screenshot` 은 워크스페이스 루트 안에만 저장 가능 → mv 경유
- 용량은 **생성 시점**에 결정 — 3대 지렛대(**드리프트 0** · **`--audio-bitrate=64k`** · **`--scale=…`(720p)**), 실측 28.74 → 약 10 MiB. 다 만든 뒤 압축 금지(세대 손실)
- **CRF 는 해상도 종속** — 720p 로 낮추면 CRF 도 26→28 로 올려야 실익이 난다 (CRF 26 은 1080p 대비 10%↓뿐)
- TTS 는 sandbox off / 오디오 검증은 PCM 피크만 유효
- 스크래치패드 영상 프로젝트는 세션 종료 시 소멸 — 보존물은 저장소로

## 어디에 뭐가 있나

| 필요한 것 | 위치 |
|-----------|------|
| 도움말 HTML 구조·이식 체크리스트 전문 | [reference.md](reference.md) Part 1 |
| 반복 함정 체크리스트 전문 (A~E절) | [reference.md](reference.md) Part 2 |
| 영상 제작 절차서 (실명령) | [examples.md](examples.md) |
| 용량 예산·지렛대·초과 시 대응 | [examples.md](examples.md) 7절 |
| 카메라 레이어 (그대로 복사) | [templates/Camera.tsx](templates/Camera.tsx) |
| 장면 렌더 구조 예시 | [templates/Video.tsx](templates/Video.tsx) |
| 씬 매니페스트 생성기 (SCENES 만 교체) | [templates/build_scenes.py](templates/build_scenes.py) |
| Remotion 프로젝트 구성 요약 | [templates/remotion-project.md](templates/remotion-project.md) |
