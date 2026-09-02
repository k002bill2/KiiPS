# KiiPS 화면 도움말+안내영상 — Reference

도움말 HTML 재사용 아키텍처(Part 1)와 반복 함정 체크리스트(Part 2). 판단·절차는 [SKILL.md](SKILL.md), 영상 파이프라인 실명령은 [examples.md](examples.md) 에 있습니다.

## Part 1. 도움말 페이지 재사용 아키텍처

기준 파일: `docs/help/FD0101-펀드정보-도움말.html` (리포 상대경로. 자립형 단일 HTML, 1423줄. 외부 의존은 Pretendard CDN 1건뿐)

---

## 1. 문서 크롬 토큰 체계 (라이트/다크 3중 구조)

**계약**: 문서(도움말 자체)의 모든 색은 `--ink/--body/--muted/--paper/--card/--line/--accent/--marker/--warn/--code-*` 등 `:root` 토큰만 참조한다. 하드코딩 색은 kx 레이어에만 허용.

- **3중 정의 구조** (라인 16~81):
  1. `:root` — 라이트 팔레트 전체 정의 (기본값)
  2. `@media (prefers-color-scheme:dark){ :root:not([data-theme="light"]) }` — 시스템 다크 + 명시적 라이트 선택 아님일 때
  3. `:root[data-theme="dark"]` — 토글로 명시 선택했을 때
  - **②와 ③의 팔레트는 반드시 동일 사본**이어야 한다 (두 블록이 같은 값 복붙). 하나만 고치면 시스템 다크와 토글 다크가 어긋난다.
- **FOUC 방지 head 스크립트** (라인 10~11): `<style>`보다 앞에서 `localStorage.getItem(THEME_KEY)`를 읽어 `'dark'|'light'`면 `document.documentElement.setAttribute('data-theme', …)`. try/catch 필수.
- **토글 JS** (라인 1313~1341): `themeNow()` = data-theme 속성 우선, 없으면 `matchMedia('(prefers-color-scheme: dark)')`. 클릭 시 반대값을 속성 + localStorage에 기록하고 `themePaint()`로 아이콘(SUN/MOON)·aria-label 갱신. matchMedia change 리스너로 시스템 변경 시에도 아이콘 재도색.
- 저장 키: `THEME_KEY='fd0101HelpTheme'` — **화면별 고유 키** (8절 참조).

## 2. kx-* 화면 모사 레이어 (문서 토큰과 분리)

**계약**: 실제 KiiPS 화면을 본뜬 요소는 전부 `kx-` 접두사 클래스 + `--kx-*` 토큰만 쓴다. 문서 토큰과 절대 섞지 않는다.

- `--kx-*` 토큰(라인 41~53)은 **원본 SCSS 실측값**: `--kx-font`(NexonLv2Gothic 스택), `--kx-primary:#007BFF`, 그리드 헤더 `#F0F0F0`/보더 `#A49A91` 등.
- **설계 결정(라인 55 주석)**: 다크 모드는 문서 크롬만 바꾼다. **kx 모사 화면은 다크 오버라이드 없음** — 실제 라이트 화면 재현이 목적이므로 배경 `#fff` 하드코딩 유지. 이 비대칭은 의도된 것이며 이식 시에도 유지.
- **구조 계약**: `.kx-stage`(position:relative — 핫스팟 좌표계) > `.kx-scroll`(overflow-x:auto) > `.kx-screen`(min-width:900px, kx 폰트/사이즈 루트). 이 3층은 핫스팟·투어 엔진이 셀렉터로 직접 참조하므로 클래스명 변경 금지.
- 제공 컴포넌트 라이브러리: `kx-filterbar/kx-filter/kx-select/kx-daterange`, `kx-toolbar/kx-btn(.outline/.plain)/kx-unit/kx-count`, `kx-grid(.sum/.kx-empty/.kx-status.run|prep|clr)/kx-paging/kx-spin`, 모달 세트(`kx-overlay/kx-modal/kx-tabs/kx-pane/kx-fieldset/kx-frow/kx-f/kx-minigrid/kx-modal-foot`), `kx-toast/kx-confirm`.

## 3. 핫스팟 시스템

**계약**: `.hs` 버튼은 `.kx-stage`의 **직계 자식**으로 두고 두 data 속성만 채우면 엔진이 나머지를 처리한다.
- `data-anchor` — 모사 화면 안 대상 요소의 CSS 셀렉터 (예: `#kxSearch`, `#kxFilterbar .kx-filter:nth-child(1) .kx-select`)
- `data-pop` — `<div hidden>` 팝오버 풀 안의 팝오버 id
- 버튼 텍스트 = 번호(투어 순서의 정본), `aria-expanded="false"` + `aria-label="설명 보기: …"` 초기값 필수.

**엔진 동작**:
- `placeMarkers()` (라인 1223~): 각 `.hs`의 anchor를 `querySelector`로 찾아 `getBoundingClientRect` 차이로 stage 좌표에 절대배치(좌상단 -10px 오프셋). **anchor가 없거나 가로 스크롤로 화면 밖이면 마커 자동 숨김** — 셀렉터 오타는 조용히 사라지므로 이식 후 마커 개수 육안 확인 필요.
- 재배치 트리거: `resize`, `kx-scroll`의 scroll, `load`, 400ms 타이머(웹폰트 반영 후), 그리고 **`renderRows()` 끝에서 명시 호출**. → **계약: 시뮬레이션 JS가 화면 레이아웃을 바꾸면 반드시 `placeMarkers()`를 호출한다.**
- 팝오버 열기: 클릭 시 팝오버를 `stage.appendChild(pop)`로 **스테이지 좌표계로 재부모화**한 뒤 버튼 offsetTop/Left 기준 배치(좌우 8px 클램프). 열림 상태는 `openPop/openBtn` 단일 쌍 — 동시에 1개만. 바깥 클릭/Esc/스크롤로 닫힘.
- 팝오버 마크업 계약: `.popover > h5(>span.n 번호) + p + p.tip(선택)`. 이 innerHTML을 투어가 그대로 재사용한다(4절).

## 4. 가이드 투어 (Driver.js 스타일)

**계약: 투어는 별도 스텝 정의가 없다.** `document.querySelectorAll('.kx-stage .hs')`를 **버튼 텍스트 숫자로 정렬**해 스텝 배열을 만들고, 각 스텝 본문은 `data-pop` 팝오버의 innerHTML을 복사한다. → 핫스팟+팝오버만 잘 만들면 투어는 공짜. 번호 변경 시 `.hs` 텍스트와 팝오버 안 `<span class="n">` **두 곳**을 함께 고친다.

- 스포트라이트: `#tourSpot` — `box-shadow: 0 0 0 3px 흰테두리, 0 0 0 9999px 딤` 트릭 + left/top/width/height transition으로 부드럽게 이동. anchor rect + 6px 패딩.
- `#tourPop`: 팝오버 재사용 + `tour-x` 닫기 + `tour-foot`(카운터 `n / N`, 이전/다음 버튼, 마지막 스텝은 "완료").
- `tourPlace()`: anchor가 가로 스크롤 밖이면 `kxScroll.scrollLeft` 자동 조정, 세로는 `window.scrollTo`로 뷰포트 확보. resize/scroll에 재배치 바인딩.
- 키보드: `→` 다음, `←` 이전, `Esc` 종료 (touring 중에만).
- `.kx-stage.touring` 동안 일반 `.hs`는 opacity 0 + pointer-events none.

## 5. 시뮬레이션 JS 패턴

전역 상태 2개: `loaded`(조회 여부), `unit`(단위 배수). 데이터는 `FUNDS` 배열(전부 허구 — 각주로 명시).

- **조회**: `#kxSearch` 클릭 → 기존 행/합계 숨김 → `kx-spin.on` → `setTimeout 600ms` → `renderRows()` + toast. `renderRows()`는 행 생성 시 `tabIndex=0`, `dataset.idx`, `aria-label`(더블클릭/Enter 안내)을 부여하고, 합계행·페이징·Total 건수를 갱신한 뒤 **`placeMarkers()` 호출**.
- **단위전환**: `#kxUnit` change → `unit` 갱신 → `loaded`일 때만 재렌더. `fmt()`가 나누기만 하므로 **표시만 바뀌고 데이터 불변** — 도움말 본문 서술과 일치시키는 장치.
- **더블클릭 모달**: `#kxRows`에 위임 리스너 3개 — click(행 `.sel` 단일 선택), dblclick(`openModal(FUNDS[idx])`), keydown Enter(모달 열기). `openModal`은 필드별 `textContent` 주입 + `selectTab(0)` + `lastFocus` 저장 + 열고 닫기버튼에 포커스. 닫으면 `lastFocus` 복원. 오버레이 자신 클릭 시 닫힘.
- **탭**: tabs/panes 배열 + `selectTab(i)`가 `.on`, `aria-selected` 동기 토글.
- **저장확인**: 저장/임시저장 → `openConfirm(mode)`가 **`confirmInvoker`(호출 버튼)를 기억**하고 메시지 분기 → 확인 시 toast("연습 화면 — 실제 저장 안 됨" 명시), 닫을 때 포커스를 호출 버튼으로 복원(body로 떨어뜨리지 않음).
- **토스트**: 단일 `#kxToast` + 타이머 리셋(2.6s), `role="status" aria-live="polite"`.
- **화면 링크 스텁**: `.scr-link` 클릭 → preventDefault + "실제 KiiPS에서는 「…」 화면으로 이동합니다" 토스트.

## 6. 접근성 장치

- **포커스 트랩** (라인 1190~1203): document 레벨 단일 Tab 핸들러. 스코프 판정은 **confirm 우선, 다음 overlay** — 겹침 시 위 다이얼로그만 순환. 포커스 가능 요소는 `button,select,[tabindex='0']` 중 `offsetParent!==null`(보이는 것만) 필터. 첫/끝 요소에서 순환.
- **Esc 우선순위 체인** (라인 1264~1270): confirm > 상세 모달 > 팝오버 순으로 하나만 닫음. 투어 Esc는 별도 핸들러.
- **포커스 복원 2중**: 모달은 `lastFocus`, confirm은 `confirmInvoker`.
- **aria**: 모달 `role=dialog aria-modal aria-labelledby`, confirm `role=alertdialog`, 탭 `role=tablist/tab/tabpanel + aria-selected/aria-controls`, 핫스팟 `aria-expanded` + `aria-label`, 스키마 다이어그램 `role=img aria-label`(구조를 문장으로 서술), toast `aria-live`.
- **reduced-motion**: `@media (prefers-reduced-motion:reduce)` 3곳 — 핫스팟 펄스 제거, reveal 즉시 표시, 모달/confirm/투어 spot·pop 애니메이션·smooth scroll 제거.
- 키보드 대체 경로: 그리드 행 Enter, 투어 방향키, 모든 인터랙티브 요소 `:focus-visible` 아웃라인.

## 7. 한국어 조판

- `body`: `word-break:keep-all` + `overflow-wrap:break-word` (어절 단위 줄바꿈 + 긴 토큰 오버플로 방지 — 쌍으로 필수).
- 제목: `text-wrap:balance` + 음수 `letter-spacing`(-0.02~-0.035em, 한글 헤드라인 조임).
- 폰트 이원화: 문서 = Pretendard(jsdelivr CDN — **유일한 외부 의존**, 오프라인이면 폴백 스택으로 동작), kx = NexonLv2Gothic 스택(실제 화면 재현).
- 숫자: 그리드 셀 `font-variant-numeric:tabular-nums`, 금액 `toLocaleString("ko-KR")`, 투어 카운터도 tabular-nums.
- 반응형: 900px 이하 TOC 숨김, 560px 이하 본문/제목 축소. 표는 전부 `.table-wrap`/`.kx-scroll`로 자체 가로 스크롤.

## 8. 이식 경계 — FD0201 등 새 화면 체크리스트

### 그대로 복사 (엔진 — 수정 금지)
- 문서 크롬 토큰 3중 블록 전체(라이트 `:root` + 다크 2벌) 및 문서 컴포넌트 CSS(toc/hero/step-list/callout/acc/table.doc/schema/kbd 등)
- FOUC head 스크립트 (키 이름만 교체)
- kx CSS 라이브러리 전체 — 새 화면에 없는 컴포넌트가 필요할 때만 **원본 SCSS 실측으로 추가**(임의 색 발명 금지)
- 핫스팟 엔진: `placeMarkers()` / 팝오버 열기·재부모화·닫기 / resize·scroll·load·400ms 재배치 바인딩
- 투어 엔진 전체 (스텝이 `.hs`에서 자동 파생되므로 무설정)
- 포커스 트랩 / Esc 체인 / toast / confirm / 테마 토글 / pgBar·toTop / 스크롤 스파이 / reveal IntersectionObserver / 아이콘 주입 헬퍼(`icsvg`, CMAP)
- reduced-motion·반응형 미디어쿼리, `word-break:keep-all` 조판 규칙

### 화면마다 교체 (콘텐츠 + 바인딩)
1. `<title>`, TOC brand, hero(eyebrow/h1/lead/meta/영상 src), footer, 각 장 본문·표·FAQ
2. **`THEME_KEY`** → `'fd0201HelpTheme'` 등 화면별 키 (놓치기 쉬움 — 안 바꾸면 화면 간 테마 상태 공유)
3. `.kx-screen` 내부 마크업 — 새 화면의 필터/툴바/그리드/모달 구성으로 재작성 (3층 래퍼 구조와 클래스명은 유지)
4. `FUNDS` 가상 데이터 + `renderRows()` 행 템플릿 + `openModal()` 필드 매핑 + 탭 개수(tabs/panes 배열)
5. `.hs` 세트: 번호·`data-anchor`·`data-pop`·`aria-label` + 팝오버 풀 내용 (번호는 `.hs` 텍스트와 팝오버 `span.n` 양쪽 동기)
6. `IC` 아이콘 맵 — **섹션 id를 키로 매칭**하므로 섹션 id를 바꾸면 함께 갱신, TOC href·스크롤 스파이도 id 의존
7. 시뮬레이션 시나리오(조회 지연·toast 문구·confirm 문구·단위 옵션)를 새 화면 실제 동작에 맞춤

### ID 바인딩 계약 (가장 흔한 파손 지점)
JS는 전부 **요소 id로 바인딩**한다. 마크업을 갈아끼우면 이 id들을 유지하거나 바인딩을 함께 수정해야 한다:
`kxScreen, kxFilterbar, kxCount, kxUnit, kxSearch, kxExcel, kxSpin, kxGrid, kxThAmt, kxSumRow, kxSumKrw, kxRows, kxPaging, kxOverlay, kxModalTitle, kxClose, kxCloseBtn, kxTabBtn0..2, kxPane0..2, kxSave, kxTemp, kxConfirm, kxConfirmMsg, kxConfirmOk, kxConfirmNo, kxToast, tourStart` + 클래스 셀렉터 `.kx-stage / .kx-scroll / .hs / .scr-link / .reveal / .toc nav a`.

### 이식 후 검증 체크
- [ ] 라이트/다크/시스템 3상태 모두 렌더 (다크 2벌 팔레트 동일 확인)
- [ ] 핫스팟 마커 개수 = `.hs` 개수 (누락 = anchor 셀렉터 오타로 자동 숨김된 것)
- [ ] 조회 → 마커 재배치 유지 (레이아웃 바꾸는 새 시뮬레이션에 `placeMarkers()` 호출 포함 여부)
- [ ] 투어 ①→끝 완주 + 방향키/Esc
- [ ] 모달·confirm에서 Tab 순환, Esc 우선순위, 닫은 후 포커스 복원
- [ ] localStorage 키가 새 화면 고유인지
- [ ] 가로 900px 미만·reduced-motion 동작

---

## Part 2. 반복 함정 체크리스트 (A~E절)

### A. 소스·화면 사실 확인 (제작 전)
- [ ] **대용량 HTML "캡처" 정체 확인** — 수십 MB HTML은 화면 캡처가 아니라 기존 도움말 번들일 수 있음(head가 "Bundled Page" JS 로더면 오판 신호) → 렌더해서 정체 확인, 그 문서의 동작 서술은 소스 근거 없으면 불신
- [ ] **필터 자동재조회 비대칭** — 조건 **추가**는 자동조회 없음(조회 버튼/F2 필요, itemAdded 빈 껍데기) / 태그 **제거**는 preventPost 아니면 즉시 자동 재조회(`inc_filter_main.jsp:201`, 해당 include 쓰는 전 화면 공통) → 도움말 서술 전 이 비대칭 반영
- [ ] **툴바 버튼 구성은 화면별 분기 실측** — 등록/삭제가 상시 노출된다고 가정 금지, 버튼 include JSP의 화면ID 분기를 직접 확인
- [ ] **기존 도움말 체계(별도 도움말 모듈/JSP) 존재 여부 확인** — 병렬 체계 신설 전 보존·중복 판단

### B. 도움말 HTML 제작
- [ ] **정본 vs Artifact 사본 = 1파일 2계약 불가** — 발행용 사본은 골격 태그 제거본으로 분리
- [ ] **한글 줄내림** — `body{word-break:keep-all;overflow-wrap:break-word}` 필수, 문단별 max-width(ch)로 좁히면 컨테이너와 어긋남 → 폭 통일
- [ ] **카피–CSS 결합** — 본문의 "OO색 번호" 류 색 언급은 마커 CSS와 짝 → 색 변경 시 카피 동시 수정
- [ ] **다크모드 3중 구조** (`:root` 라이트 / `@media prefers-dark + :not([data-theme=light])` / `[data-theme=dark]`) + head 인라인 스크립트로 FOUC 방지. 화면 모사 영역은 다크에서도 라이트 유지(스크린샷처럼 읽히게)
- [ ] **CDN 폰트는 오프라인/인트라넷에서 폴백만 됨** — 기능 무관하나 인지하고 결정
- [ ] **모바일 검증은 emulate viewport로만** — 데스크톱 창은 500px 미만 리사이즈 불가
- [ ] **file:// 새 탭 최초 오픈의 "Unsafe attempt to load URL" 콘솔 오류 1건** = DevTools MCP 탭 전환 아티팩트 → 재로드해서 0건 확인, 문서 결함으로 오판 금지
- [ ] **장식성 디자인(세리프·스탬프·배경 패턴)은 축소 위험 큼** — 기능적 개선(가독 폭, 마커, 라벨)만 살아남는 경향 → 장식은 사용자 승인 전 최소화

### C. 안내영상 캡처·렌더
- [ ] **스틸은 DPR2로 캡처**(`emulate 1920x1080x2`) — 2~3배 줌이 네이티브 해상도가 되게
- [ ] **줌 타깃 rect는 캡처와 같은 패스에서 실측** — 별도 패스는 scrollY가 어긋남(실측 16px 편차)
- [ ] **장면 길이 공식** — 8f 리드인 + 오디오 길이 + 20f 테일(테일 > 전환 12f) → 내레이션 겹침 방지
- [ ] **MCP take_screenshot은 워크스페이스 루트 안에만 저장 가능** → 저장소 임시폴더 경유 후 mv
- [ ] **렌더 용량** — 기본 CRF는 전송 한도(SendUserFile 30MiB) 초과 가능 → `--crf=30` 재렌더(화면 콘텐츠는 화질 손실 체감 없음)
- [ ] **전환 프레임 스틸의 이중노출 외관은 정상 crossfade** — 결함 오판 금지
- [ ] **영상 길이 증거** — `mdls`는 /private/tmp 미인덱싱으로 못 읽음 → 인코더 로그의 프레임 카운트가 증거
- [ ] **줌 배율 상한 이탈** — 소형 타깃 가독성 사유로 상한 초과 시 보고 후 진행
- [ ] **홀드 드리프트가 켜져 있으면 용량이 폭증** — `Camera.tsx: DRIFT_PER_SECOND` 는 **0 이 기본**.
      0 이 아니면 `scale` 이 매 프레임 바뀌어 정지 화면인 홀드를 인코더가 매번 새로 부호화한다.
      실측(FD0102): 홀드 프레임 **4.15 kB → 0.19 kB**, 비디오 **20.70 → 13.46 MiB**, 화질 동일
- [ ] **오디오 기본값이 모노 음성을 7배로 부풀림** — 기본 AAC **317 kbps 스테레오 48 kHz** vs 원본 edge-tts **48 kbps 모노 24 kHz**.
      `--audio-bitrate=64k` 필수. 실측 **7.85 → 1.52 MiB(81%↓)**, 음질 차이 없음
- [ ] **1080p 는 임베드 표시 해상도의 1.5배 낭비** — 도움말 CSS 가 `width:min(645px,100%)` 라
      DPR2 에서도 1290 디바이스 px. `--scale=0.6666666666666666`(720p)이 거의 1:1이고 손해는 전체화면뿐.
      1080p 를 인코딩 후 다운스케일하지 말고 **처음부터 720p 로 렌더**할 것
- [ ] **VP9/WebM 은 CRF 척도가 x264 와 다름(0~63)** — x264 CRF 30 상당은 VP9 CRF 40~45.
      같은 숫자를 쓰면 오히려 커진다(실측 CRF34 = **+35%**). 인코딩도 13분/회라 H.264 로 충분하면 쫓지 말 것

### D. 오디오·내레이션
- [ ] **TTS(`uvx edge-tts`)는 sandbox off 필수**
- [ ] **오디오 가청 검증** — afinfo는 트랙 존재만 증명 / afconvert는 비디오 mp4 거부 / file:// 오리진 격리로 브라우저 검증 불가 → **번들 ffmpeg(`./node_modules/.bin/remotion ffmpeg`)로 PCM 추출 후 3지점 피크 확인**이 유일한 증거
- [ ] **번들 ffmpeg 에 `s16le` 먹서가 없다** — `-f s16le` 는 `Requested output format 's16le' is not known` 로 실패.
      `-vn -acodec pcm_s16le -ac 1 -ar 8000 x.wav` 로 받아 python `wave` 모듈로 읽을 것 (examples.md 8절)

### E. 임베드·산출물 관리
- [ ] **file:// 같은 폴더 미디어는 오리진 격리와 무관하게 `<video>` 재생됨** — readyState 4로 실측 검증
- [ ] **저장소에 대용량 바이너리(수십 MB mp4) 추가 시 커밋 전 사용자 확인**
- [ ] **구버전 미디어 파일 공존 정리 여부를 명시적으로 결정** — 조용히 방치 금지
- [ ] **scratchpad의 영상 프로젝트는 세션 종료 시 소멸** — 재제작은 캡처 단계부터 재실행 전제, 보존 필요물은 저장소로 이동
