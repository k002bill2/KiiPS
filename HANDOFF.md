# HANDOFF — KiiPS 공통 기능 도움말 (2026-09-04)

## 상태 요약

| 항목 | 상태 |
|------|------|
| 1단계 도움말 HTML | ✅ **완료·검증 끝** — `docs/help/COMMON-공통기능-도움말.html` (1,886줄 / 129KB — 영상 임베드 + GNB/메가메뉴 + 경로 2갈래 포함) |
| 2단계 안내영상 | ✅ **완료·검증 끝** — `docs/help/COMMON-guide.mp4` (10.23 MiB / 4분 41.8초 / 18씬), 도움말 hero 에 임베드 완료 |
| git | `git add -N` 상태(untracked→intent-to-add) + mp4 untracked. **커밋 안 함 — 사용자 확인 대기** |

2026-09-04 후속 세션에서 2단계 완주. 남은 것은 **커밋 여부 결정**과 아래 「사용자 결정 대기」 3건뿐.

---

## 1단계 결과 (재작업 불필요)

FD0102 도움말을 베이스로 복제해 **모든 화면 공통 기능** 문서를 만들었다.
FD0101·FD0102 원본은 **건드리지 않았다**.

### 왜 FD0102가 베이스인가
커밋 #31의 스크롤스파이 보정(`docTop()` = `getBoundingClientRect().top + scrollY`)이 FD0102에만 있다.
SKILL.md는 FD0101을 정본이라 하지만 **복제 기준은 FD0102가 맞다**.

### 문서 구성
1. 공통 기능이란 (5단 뼈대) / 2. 화면 직접 만져보기 (핫스팟 13 + 투어) /
3. 업무 따라하기 (조회·즐겨찾기·목록·엑셀·테마/새창/세션) / 4. 화면마다 다른 것 + 화면별 도움말 링크 / 5. 주의사항·FAQ

### 이 문서 고유 사항 (이식 계약)
- `THEME_KEY = 'kiipsCommonHelpTheme'` (head FOUC 스크립트 + 토글 JS 2곳 일치)
- **`?theme=` 파라미터 처리 구현** — KiiPS `ScreenHelp()`가 `header_function.jsp:1131`에서 넘기는 값.
  우선순위 `?theme=` > localStorage > 시스템. **FD0101·FD0102에는 이 처리가 없다**(미구현 결함).
- `scrollBehavior()` 헬퍼 — reduced-motion이면 `'auto'`. **FD0101·FD0102는 `behavior:'smooth'` 하드코딩(접근성 결함)**.
- 엔진의 `#related table.doc td:first-child` 자동 화면링크 변환은 `table.doc.scrlinks`로 좁혀 이 문서에서 무효화
  (제4장 표 2개가 "항목명"을 화면 링크로 둔갑시키는 오작동 방지)
- 신규 kx 컴포넌트: `.kx-utilbar .kx-pagehead .kx-star .kx-tagbar .kx-tags .kx-tag .kx-rowset .kx-badge .kx-rowpop .kx-favlist`
  - `.kx-timer{padding-left:20px}` / `.kx-tags{padding-left:14px}` — **핫스팟 마커(anchor 좌상단 -10px)가 글자를 가리지 않게 확보한 자리. 줄이지 말 것.**
  - 색상은 실측: `label-required #de2f2f`, `label-init #4E5DBF` (`theme.css:11197,11202`)

### ID 바인딩 계약 (엔진이 이름으로 부른다 — 개명 금지)
`closeMenu()` (핫스팟 클릭 핸들러가 호출) · `closeModal()` (Esc 체인이 호출) · `toast()` · `closeConfirm()` · `confirmBox` · `overlay` · `placeMarkers()` · `renderRows()`
> 이 세션에서 `closeXMenu`/`closePanel`로 개명했다가 **핫스팟이 안 열리고 Esc가 안 먹는 버그**를 만들었다.

### 시뮬레이션 초기화 순서 함정
`paintTags()`가 `placeMarkers()`를 부르는데 엔진의 `stage`는 **더 뒤에서 `var` 선언**(호이스팅으로 `undefined`).
→ `relayout()` 가드(`if(typeof stage!=="undefined" && stage)`)로 감쌌다. **직접 `placeMarkers()` 호출 금지.**

### 검증 완료 (증거)
- 헤드리스(jsdom, 검증 스크립트는 세션 스크래치패드에 있었으므로 소멸): JS 에러 0 · 핫스팟 13/13 · 투어 1→13 완주 · Esc 체인 · 필터 비대칭 · 전체보기 토글 · 즐겨찾기 재정렬/이동 · 6컬럼 정렬 · 행수 순환
- 브라우저 실측(aside + CDP): 마커 13개 실배치(좌표0 0건·겹침 0) · 라이트/다크/**시스템다크**/시스템다크+명시라이트 · **다크 팔레트 2벌 19/19 토큰 일치** · 820px(TOC none·문서 가로스크롤 없음) · 560px · reduced-motion(스크롤 즉시 이동 실측) · `?theme=` 5케이스
- Codex 리뷰 6라운드 11건 + 자체 3건 + 실측 2건 = **16건 수정**

### 미해결
- ~~Codex 7차 리뷰 `review-mtmbrmym-9mi18r`~~ → **hang 확정 후 취소**(2026-09-04).
  판별: `job.status`는 계속 `running`인데 **로그 mtime 이 25분 정지**. 산출물 0건이라 6라운드 결과가 최종.
  (`cancel` 은 상태파일에 쓰므로 **sandbox off 필요** — 샌드박스에서는 EPERM)

---

## 2단계 결과 (2026-09-04 완료 · 재작업 불필요)

산출물: `docs/help/COMMON-guide.mp4` — **10,912,753 B (10.41 MiB) · 268.6초(4분 28.6초) · 8057프레임 · 18씬**

### 실제로 쓴 절차 (HANDOFF 예측과 다른 점만)
- **캡처는 `aside repl` 단일 세션 배치 루프**로 했다. 120초 타임아웃 + base64 stdout 크기 때문에 4배치로 쪼갰고,
  투어 상태를 탭에 남겨 이어받아 `#tourNext` 만 눌렀다 → **13스텝 전부 `scrollY 1325` 고정**, 좌표 편차 0.
- `page.screenshot()` (path 없이 Buffer) → `grep '^B64_x:' | base64 -d` 로 파일 저장. 컨텍스트에 base64 미노출.
- 렉트는 `#tourSpot` + `#tourPop` union 을 **스크린샷과 같은 evaluate 패스**에서 실측 (CSS px, build_scenes.py 가 ×2).

### 씬 18개 (HANDOFF 표 그대로)
`intro · s00 · t01~t13 · s01 · fav · outro`

### 비대칭 데모 스틸은 **찍었으나 씬에서 제외**했다
`public/asym1.png`(태그 추가) · `asym2.png`(✕ 제거 후 자동재조회) 는 캡처했지만 채택하지 않았다. 사유 2건:
1. `asym1` 에 **토스트가 찍혔다**(조건 추가 시 토스트 발생, 1.2초 대기로는 부족 — 2.8초 필요했음)
2. `#kxTags` 렉트가 **h=24px 한 줄**이라 줌하면 "목록이 안 바뀌었다"는 맥락이 화면 밖으로 나간다
→ 비대칭은 **t06 내레이션이 말로** 설명한다("추가는 수동, 제거는 자동"). 다시 넣으려면 위 2건을 먼저 해결할 것.

### 검증 증거
| 항목 | 결과 |
|------|------|
| 용량 게이트 | 총 **10.41 MiB** ≤ 12 MiB 목표 · 비디오 8.16 / 오디오 **1.97** MiB(64k 적용 확인) |
| 드리프트 0 | t06 순수 홀드 **0.16 kB/frame** (2~4 면 드리프트 켜짐) |
| 오디오 PCM 3지점 | peak **13878 / 13011 / 13825** (모두 > 1000) |
| 길이 대조 | wav 268.6초 = `build_scenes.py` 8057f/30 **정확히 일치** |
| 씬 스틸 | s00·t08·t13·s01·fav·outro 6장 추출, **파일 크기 전부 상이**(--frame 인자 정상) · 육안 3장 확인 |
| 임베드 | `readyState 4` · `duration 268.6` · `currentTime 3.96`(실재생) · 1280×720 · 표시폭 645px · error null |

### 홀드 비용 측정의 함정 (새로 발견 — 스킬에 반영 필요)
examples.md 7절 (c) 의 `NR>=3340 && NR<=3500` 같은 **고정 범위를 그대로 쓰면 오판한다.**
그 구간이 씬 경계와 겹치면 줌아웃 + 전환 + 다음 씬 펀치인이 섞여 **2.04 kB/frame** 이 나오고 "드리프트 켜짐"으로 읽힌다.
반드시 `scenes.ts` 의 누적 프레임으로 **순수 홀드 구간**(씬시작+25 ~ 씬끝−39)을 계산해 측정할 것.

### 영상 프로젝트 위치 (세션 종료 시 소멸)
`$SCRATCH/common-video/` — 스틸 18장·오디오 18클립·`build_scenes.py`(SCENES 교체본)·`src/Video.tsx`(SPOT_CENTERS 13건).
보존물은 mp4 뿐이다. **재제작하려면 캡처부터 다시** 해야 한다.

---

## (참고) 2단계 착수 당시 계획 — 실행 완료됨


스킬 `kiips-screen-help-video`의 `examples.md` 절차서를 따른다. **아래는 이미 결정·검증된 사항이라 다시 조사하지 말 것.**

### 사전 확인 완료
- `uvx` 있음 (`~/.local/bin/uvx`) — edge-tts 실행 가능
- **DPR2 캡처 3840×2160 확인** (aside + CDP `Emulation.setDeviceMetricsOverride{width:1920,height:1080,deviceScaleFactor:2}`)
  → `build_scenes.py`의 `×2` 좌표계 전제 성립. 스틸 1장 0.39 MiB / base64 539 KB
- `#tourNext` 존재 — 투어를 스텝 단위로 몰 수 있다

### 캡처는 chrome-devtools 아님 — aside 로 한다
절차서는 chrome-devtools MCP를 쓰지만 **비활성**(CLAUDE.md 오버라이드). `aside repl` 사용.
이 대체가 오히려 낫다: **렉트 실측과 스크린샷을 같은 `evaluate` 패스**에서 처리해
절차서가 경고한 "별도 패스 → scrollY 편차 16px" 함정을 구조적으로 회피한다.

```bash
# 로컬 서버 (file:// 은 aside 가 거부한다)
cd docs/help && python3 -m http.server 8899 --bind 127.0.0.1 &
URL='http://127.0.0.1:8899/COMMON-%EA%B3%B5%ED%86%B5%EA%B8%B0%EB%8A%A5-%EB%8F%84%EC%9B%80%EB%A7%90.html?theme=light'

# 스틸 저장 — base64 를 컨텍스트에 찍지 말고 파이프로 바로 파일에 (검증된 방식)
aside repl "...console.log('B64:'+Buffer.from(await page.screenshot()).toString('base64'))" \
  | grep "^B64:" | sed 's/^B64://' | base64 -d > $PROJ/public/tour-01.png
```
> `aside` CLI 는 **샌드박스에서 데몬 소켓이 막힌다** → 모든 aside 호출은 `dangerouslyDisableSandbox: true`.
> `page` API 에 `waitForTimeout`·`emulateMedia`·`setViewportSize`·`keyboard` **없음**.
> 대기는 `new Promise(r=>setTimeout(r,ms))`, 미디어/뷰포트는 `page._sendToTarget('Emulation.*')` CDP 직접 호출.
> `page.screenshot({path})` 는 워크스페이스 밖 경로를 거부하지만, **path 없이 부르면 Buffer 를 반환**한다 — 이쪽을 쓴다.

### 캡처 전 필수 설정 (전부 근거 있음)
1. `Emulation.setEmulatedMedia {features:[{name:'prefers-reduced-motion',value:'reduce'}]}`
   — `tourPlace()`가 `window.scrollTo({behavior:scrollBehavior()})`를 쓴다. reduce가 아니면 클릭 200ms 후 렉트가 **스크롤 도중 값**이다. 캡처 후 해제.
2. `?theme=light` 로 진입 (localStorage 에 이전 테스트 잔재 있음)
3. 토스트를 띄우는 동작(조회·태그 ✕) 뒤에는 **2.8초 이상** 대기 — 안 그러면 스틸에 토스트가 찍힌다

### 씬 구성 (18씬 — FD0101 과 동수)
투어 순서를 그대로 따른다. 렉트 = `#tourSpot` + `#tourPop` union (CSS px, `build_scenes.py`가 ×2).

| id | 화면 | 렉트 |
|----|------|------|
| `intro` | 타이틀 카드 "모든 화면에 똑같이 있는 것들" | 없음 |
| `s00` | 초기 상태(마커 13개 보임) | 없음/전체 |
| `t01`~`t13` | 투어 1~13스텝 | tourSpot+tourPop union |
| `s01` | 조회 후 목록 5행 | 그리드 |
| `fav` | 즐겨찾기 패널 열림 | `.kx-modal` |
| `outro` | 마무리 카드 | 없음 |

**내레이션 대본은 문서의 팝오버 본문을 압축해 쓴다. 새로운 사실 주장을 대본에 만들지 말 것** —
팝오버 문구는 Codex 6라운드로 검증된 것이고, 대본에 새로 넣은 문장은 아무도 검증하지 않는다.
유일한 예외로 고려할 것: **"추가는 수동 / 제거는 자동"** 비대칭 시연용 스틸 2장
(태그 추가 후 Total 0 → ✕ 제거 후 자동 재조회) — 이 문서의 핵심 주제라 영상에서 보여줄 값어치가 있다.

### 렌더
```bash
./node_modules/.bin/remotion render src/index.ts COMMON out/COMMON-guide.mp4 \
  --crf=28 --scale=0.6666666666666666 --audio-bitrate=64k > render.log 2>&1
```
- **`--crf=28`** (720p). SKILL.md 절차 4의 `--crf=26` 은 낡은 값 — examples.md §7 실측이 근거
- `npm install --cache "$PROJ/.npmcache"` (샌드박스 npm 캐시 차단 우회) · 렌더/TTS 는 sandbox off
- **미니 렌더 먼저**: 2씬짜리 SCENES 로 오디오 검증까지 한 바퀴 돌린 뒤 전체 렌더.
  18씬 풀렌더는 5~10분이고, 폰트 로드 실패나 `×2` 오류를 그 뒤에 발견하면 비싸다

### 임베드
hero 섹션에 `.video-preview` 블록을 **되살린다**(복제 시 제거했음. CSS 클래스는 그대로 있다).
```html
<div class="video-preview">
  <video src="COMMON-guide.mp4" controls preload="metadata" playsinline aria-label="공통 기능 안내 영상"></video>
  <p class="vp-cap">▶ 안내 영상 (N분 N초) — …</p>
</div>
```
길이는 `build_scenes.py` 출력 `total frames / 30`. 임베드 후 `readyState === 4` 실측.

### 완료 기준
- mp4 **≤ 12 MiB** (하드 한도 30) · 오디오 PCM 3지점 peak > 1000 · 씬별 스틸 육안 확인
- 임베드 후 `readyState === 4`
- **커밋 전 사용자 확인** (mp4 ~10 MiB 가 git 에 영구 보관됨)

---

## 사용자 결정 대기 (하지 않고 남겨둔 것)

1. FD0101·FD0102 도움말에 이 공통 문서로 가는 링크/콜아웃 추가
2. `?theme=` 미처리 + reduced-motion `behavior:'smooth'` 결함을 FD0101·FD0102 에도 적용
3. 스킬 문서 갱신 — `reference.md` 에 "공통 기능은 COMMON 도움말로 링크, 재서술 금지" + "복제 기준은 FD0101 아닌 FD0102(docTop 보정 포함)" + "chrome-devtools → aside 캡처 절차"

## 정리 필요
- 로컬 HTTP 서버 `python3 -m http.server 8899` (docs/help) — 세션 종료로 죽었을 수 있음
- Aside 탭 2개 (127.0.0.1:8899)

---

## 2026-09-04 후속 정정 2건 (사용자 지시)

### ① 내레이션 발음 — "피피에스" 시도 후 **"키입스"로 확정** (2회 왕복)
`script.tsv` 의 intro·s00 2곳. 화면 텍스트(`Video.tsx:225` TitleCard "KiiPS 화면 가이드")는 계속 유지.

경위 — 지시 "kiips 를 pps로 읽어"를 문자 그대로 받아 **"피피에스"** 로 적었으나,
사용자가 완성본을 듣고 **"아직도 pps 로 나온다"** 며 되돌리기를 지시 → **"키입스"** 로 확정.

> ⚠️ **발음 지시는 텍스트로 검증할 수 없다.** 모델은 TTS 출력을 들을 수 없어 대본·파일 길이로만 확인 가능하고,
> 청취 판정은 사용자만 할 수 있다. 다음에 발음 변경 요청이 오면 **1클립 시험본을 먼저 들려주고** 확정할 것 —
> 이번엔 전체 재렌더를 2회(약 10분) 더 돌렸다.
> 확정값: 한글 **"키입스"** (알파벳 표기는 한국어 TTS 가 어떻게 읽을지 보장되지 않으므로 한글로 적는다).

### ② 즐겨찾기 목록 호출 경로 정정 — 도움말이 **없는 버튼을 만들어냈다**
**소스 실측 (근거)**
| 확인 | 결과 |
|------|------|
| `inc_page_header.jsp` · 상단 유틸 바 | 즐겨찾기 버튼 **0건** — 연습화면의 `#kxFav` 는 허구였다 |
| 실제 호출 | ① **F8** (`toggleFavoritesPanel()`) ② 펼친 메뉴 하단 `submenu-favorite-footer > a.favorite-link` 「★ 즐겨찾기 목록(단축키 F8)」 |
| 핫스팟 ④ (★배지+화면코드) | **정확했다** — `inc_page_header.jsp:11` `bkmrk_star` + `SCREEN_SHORT_CUT` + `setMyScrn()` |
| ⚠️ 존재 범위 | F8·즐겨찾기는 **`sidemenu_left_navi_new.jsp` · `sidemenu_menutop_line_mega.jsp` 2종에만**. 구버전 3종(`left_navi` · `menutop_line` · `futureslap`)은 0건 → "모든 화면 공통" 문서로서 **hedge 여부는 사용자 결정 대기** |
| `sidemenu_menutop_line_new.jsp` | include **0건 = 죽은 파일**. 문구는 있으나 F8 핸들러 없음 — 근거로 쓰지 말 것 |
| 3번째 경로 | `sidemenu_right.jsp`(footer_sidemenu.jsp 가 include) 우측 설정 패널 탭. 문서 4장에 이미 서술돼 있어 손대지 않았다 |

**연습화면 변경** — `#kxFav` 제거 + GNB/메가메뉴 신설(실제 `nav-item > mega-dropdown > submenu-favorite-footer` 구조 모사)
- 핫스팟 ③ anchor = `#kxGnbFund`(**상시 보이는 GNB 항목**). ⚠️ 닫힌 드롭다운 안 요소를 anchor 로 삼으면
  `getBoundingClientRect()` 가 0 이라 **마커가 에러 없이 사라진다**. 대신 3스텝 진입 시 `openMega()` + 링크 `.hl` 하이라이트.
- 새 함수명은 `openMega/closeMega` — **`closeMenu()` 는 엑셀 드롭다운 전용**이라 재사용·개명 금지.
- z-index 층위: 메가 40 < 팝오버 50 < `#tourSpot` 60 < `#tourPop` 61.
- `.kx-stage.megaon` 으로 메뉴가 열린 동안 다른 마커를 `opacity:.18` (3번만 1.0).

**이 과정에서 잡은 버그 2건 (재발 주의)**
1. **투어 버튼 버블링** — `#tourNext` 클릭이 document 까지 올라가 내가 등록한 `closeMega` 를 호출,
   `tourShow()` 가 방금 연 메뉴를 곧바로 닫았다. → 문서 클릭 핸들러에 `if(e.target.closest("#tourPop")) return;`
2. **말풍선이 메뉴를 통째로 가림** — 둘 다 GNB 바로 아래에 열려 자리가 겹쳤다.
   → 메뉴가 열려 있으면 팝오버·`#tourPop` 을 **메뉴 오른쪽**으로 비킨다(`mega.getBoundingClientRect()` 기준).

**t03 카메라 — maxScale 3.0 은 못 쓴다**
렉트가 `#tourSpot ∪ #tourPop ∪ .kx-mega` 3자 union(768×400 CSS)이라 넓다. 3.0/2.6/1.7/1.35 모두 말풍선이 잘렸고
**1.15 에서야 전체가 담겼다**(padding 130). 스틸 육안 확인 4회로 확정 — 계산만 믿지 말 것.

**검증 (18/18 실측)**
마커 13/13·좌표0 0건 · `#kxFav` 제거 · F8 열기/닫기 · 메가 링크 열기 · Esc 체인(패널→메가→팝오버) ·
투어 3스텝 메뉴 자동 펼침 + 4스텝 닫힘 · 팝오버/메뉴 겹침 0 · 마커 opacity(3번 1.0 / 나머지 0.18) · **JS 에러 0**

**영상 재제작 결과**
- 스틸 18장 **전량 재캡처**(GNB 로 스테이지 높이가 바뀌어 기존 좌표 전부 무효) · TTS 18클립 재생성 · SPOT_CENTERS 13건 교체
- **7.57 MiB / 277.2초(4분 37초) / 8313프레임** — 비디오 5.25 + 오디오 2.03 MiB
- 홀드 0.13~0.19 kB/frame · PCM peak 5851/14183/6435 · wav 277.2초 = 매니페스트 일치 · 임베드 `readyState 4`·`currentTime 4.46`

**⚠️ 캡처 배치는 자족적으로 짤 것** — 배치 사이에 탭이 바뀌면 투어 상태가 유실돼 **step 이 1/13 부터 다시 시작**한다
(증상: `spot` 좌표가 전 스텝 동일, `touring=false` 라 `tourPlace()` 가 위치를 안 잡음).
각 배치가 `tourStart` 부터 목표 스텝까지 직접 몰고 가도록 했다. 탭도 URL 로 찾아 `attachBrowserTab` 할 것(`attachActiveBrowserTab` 은 다른 창에 붙는다).

---

## Codex 리뷰 REJECT → 반영 (2026-09-04)

Codex 가 **REJECT** 판정. Major 3 / Minor 2 전부 반영하고 실측으로 닫았다.

| 등급 | 지적 | 조치 | 실측 증거 |
|------|------|------|-----------|
| Major | 메가 ★ 가 표시만 바뀌고 실제 `favs` 와 무관 → "추가했다"는데 목록에 없음 | ★ 클릭이 `favs` 를 직접 갱신 + `paintMegaStars()` 로 **헤더★·목록·메가★ 3방향 동기화** | 등록 `list_has_FD0103:true` · 해제 `list_removed:true` · 헤더★→메가★ `true` |
| Major | 모달 종료 후 포커스가 **숨겨진** `#kxFavLink` 로 복귀 | `closeMega(refocus)` 신설(메뉴 안에 포커스가 있었으면 `megaBtn.focus()`) + 링크에서 패널 열 때 invoker 를 `megaBtn` 으로 정규화 | `focusAfterClose:kxGnbFund` · `escFocus:kxGnbFund` |
| Major | 좁은 화면(≈700px↓)에서 팝오버가 메뉴와 **재겹침** | 오른쪽 여백 부족 시 옆이 아니라 **메뉴 아래**로 내리는 폴백 | 1920/1100/820 **전부 `overlap:false`**, 1100·820 은 `popBelow:true` |
| Minor | 엑셀 드롭다운과 메가메뉴 동시 표시 | 서로 열 때 상대를 닫음(`closeMenu()`↔`closeMega()`) | `mutex_megaClosed:true` |
| Minor | schema 설명이 새 GNB 를 누락 | ① 을 "상단 메뉴 · 유틸 바"로 확장 + aria-label 반영 | — |

> Codex 가 "Pass" 한 것도 기록: `closeMenu()` 오염 없음 · `stage` 호이스팅 가드 유효 · 리스너 누수 없음 · `#kxGnbFund` anchor 교체 타당.
> ⚠️ Codex 는 **diff 를 볼 수 없었다**(`add -N` 상태라 빈 파일→1,850줄 전량 추가로 보임) → 현재 코드와 실제 SVN JSP 를 정적 대조하는 방식으로 리뷰했다. 다음에도 같은 제약이 걸린다.

---

## 즐겨찾기 목록 경로 = **2갈래** (사용자 결정, 2026-09-04)

### 소스 근거
| 경로 | 적용 범위 | 근거 |
|------|-----------|------|
| 화면 이름 옆 **★ 배지**로 등록·해제 | **모든 본 화면 공통** | `inc_page_header.jsp:11` `bkmrk_star`+`SCREEN_SHORT_CUT`, `setMyScrn()` 정의는 `footer_sidemenu.jsp:303` |
| **우측 설정 패널 › 즐겨찾기 탭**(`#MY_FAVOTIT_MENU`, 드래그 정렬) | **공통 — 레이아웃 무관** | `footer_sidemenu.jsp:14` 가 `Menu/sidemenu_right.jsp` include (`:370` 탭 아이콘, `:478` 패널). **685개 화면**이 이 footer 사용(FD0102 포함) |
| **F8 · 펼친 메뉴 하단 「★ 즐겨찾기 목록(단축키 F8)」** | **신규 레이아웃 2종 기관만** | `sidemenu_left_navi_new.jsp:815` / `sidemenu_menutop_line_mega.jsp:551` 의 `e.key==='F8'` |

- 구버전 3종(`sidemenu_left_navi` · `sidemenu_menutop_line` · `..._futureslap`)은 즐겨찾기 **0건** → F8 없음
- `footer_sidemenu2.jsp`(349개, 팝업 위주)는 `.bkmrk_num` 애니메이션만 — 목록 기능 없음
- ⚠️ `sidemenu_menutop_line_new.jsp` 는 **include 0건 = 죽은 파일**. "즐겨찾기 목록(단축키 F8)" 문구는 있으나 **F8 핸들러가 없다** — 근거로 쓰지 말 것

### 문서 서술 방식 (연습화면은 신규 메뉴 그대로 유지)
팝오버 ③ · 3-2 본문 · 내레이션 t03 을 **ⓐ/ⓑ** 로 나눴다.
- **ⓐ 모든 화면 공통** — 오른쪽 설정 패널 › 즐겨찾기 탭(★)
- **ⓑ 새 메뉴를 쓰는 기관** — 위에 더해 F8 / 펼친 메뉴 하단 링크
- **등록은 공통**(화면 이름 옆 ★ 배지)
- 판별 기준을 **사용자가 스스로 확인**할 수 있게 적었다: "메뉴를 펼쳤을 때 그 줄이 보이지 않으면 ⓐ를 쓰는 화면".
  기관명·내부 레이아웃 파일명은 노출하지 않는다.

### 최종 산출물
`COMMON-guide.mp4` **7.91 MiB / 282.2초(4분 42초) / 8463프레임** (비디오 5.55 + 오디오 2.06 MiB)
임베드 `readyState 4` · `duration 282.2` · `currentTime 4.46` · 1280×720 · 표시폭 645px

### ⚠️ 오디오 3지점 peak 검사는 **씬 경계에서 오탐한다**
이번 렌더에서 "초반 peak = 0" 이 나왔다. 무음이 아니라 **10% 지점(28.2초)이 씬 경계 테일에 우연히 걸린 것**이다.
판정은 3지점이 아니라 **구간 스캔**으로 할 것 — 0~44초 2초 간격 peak 12000~15000, **2초 이상 연속 무음 0건**, 전체 0.5초 창 중 무음 14.2%(씬 사이 공백).

### Codex 재리뷰 결과 (2026-09-04, 2회차)
**Major 3 · Minor 2 전부 `Fixed` 판정.** 새 blocker 1건이 나와 함께 닫았다.

> **blocker** — 2갈래로 나눈 뒤에도 `schema ①`(:668-670)과 `추천 순서`(:698-700)가
> "펼친 메뉴 즐겨찾기/F8"을 **조건 없이** 서술해 ⓐ/ⓑ 구분과 모순.
> Minor 5(schema 에 GNB 반영)를 고치면서 내가 만든 모순이다.

조치 — 3곳을 "새 메뉴를 쓰는 기관" 한정으로 바꾸고 **공통 경로(우측 설정 패널)를 먼저** 놓았다:
`schema aria-label` · `schema ① 박스`(+ `.schema .box .sub` 로 공통 경로 주석) · `추천 순서` 문장.
> 인라인 `style="opacity:.85"` 를 썼다가 **`.schema .box .sub` 클래스로 교체** — 프로젝트의 인라인 style 금지 규칙.

실측: `schema_hasCondition/hasCommon` true · `rec_hasCommonFirst/hasCondition/commonLabel` true ·
`pop_hasBoth` true · `subStyled` true · 마커 13 · 메가★↔목록 `favSync` true · **JS 에러 0**
> ⚠️ 검증 셀렉터 주의: `.callout.info` 는 문서에 **4개**다. `:last-child` 같은 위치 셀렉터로 잡으면 엉뚱한 블록을 읽는다
> (1차 검증에서 실제로 false 오탐). `textContent.includes('추천 순서')` 로 찾을 것.

**영상은 재렌더하지 않았다** — 수정 3곳은 문서 본문이고, `s00` 캡션·내레이션은 5단 뼈대만 말할 뿐 F8 을 언급하지 않는다(확인함).

---

## 최종 산출물 (2026-09-04 세션 종료 시점)

| 파일 | 상태 |
|------|------|
| `docs/help/COMMON-공통기능-도움말.html` | 1,886줄 / 128 KB — GNB·메가메뉴 + 즐겨찾기 경로 ⓐ/ⓑ 2갈래 + 영상 임베드 |
| `docs/help/COMMON-guide.mp4` | **7.71 MiB / 281.8초(4분 41초) / 8452프레임** (비디오 5.36 + 오디오 2.06) |
| 검증 | 무음 13.5%·**2초이상 연속무음 0건**·구간 peak 12000~15300 · 임베드 `readyState 4`·`currentTime 4.46` |
| git | **커밋 안 함 — mp4 커밋 여부는 여전히 사용자 결정 대기** |

---

## 상단 레이아웃 심플화 + 포커스 정정 (2026-09-04, 사용자 지적 2건)

### ① 상단이 너무 복잡 → **1줄로 통합**
| | 이전 | 지금 |
|---|---|---|
| 상단 | `.kx-gnb`(메뉴 줄) + `.kx-utilbar`(브레드크럼+유틸 줄) = **2줄** | `.kx-gnb` 한 줄 — 왼쪽 `.kx-navset`(메뉴), 오른쪽 `.kx-util-right`(시계·연장·로그아웃·새창) |
| 브레드크럼 | 유틸바 안 | `.kx-pagehead` 안으로 이동(작은 보조 줄). 끝의 "출자자정보"는 바로 아래 화면명과 **중복이라 제거** |
`.kx-utilbar` CSS 는 미사용 주석으로 남겼고, `.kx-pagehead` 를 `flex-direction:column` 으로 바꿔 2줄 배치.
문서 1장도 `① 상단 바` / `② 페이지 헤더(브레드크럼 포함)` 로 갱신.

### ② 포커스 위치 어긋남 — 원인은 **스틸이 낡은 것**
스틸 캡처(13:29) 이후에도 HTML 을 계속 고쳤다(2갈래 서술·schema `.sub` 줄 추가 등, 14:35 까지).
→ 스틸 속 화면과 렉트·`SPOT_CENTERS` 가 어긋났고, **에러 없이 렌더까지 통과**했다.
> **철칙: 캡처는 문서를 확정한 뒤 마지막에 한 번에.** 문서를 고쳤으면 스틸도 다시 찍는다.

재발 방지로 캡처 루프에 **정합성 자동 검증**을 넣었다 — `onAnchor`(스포트라이트 중심 ↔ 현재 스텝 anchor 중심 거리 < 10px).
이번 캡처는 **13스텝 전부 `onAnchor:true`**, `scrollY` 1808 완전 일관.

### ⚠️ Aside 캡처 함정 (오래 헤맴 — 반드시 기록)
**`page.screenshot()` 은 웹뷰의 실제 렌더 크기로 찍는다. `deviceScaleFactor` 는 반영되지 않는다.**
- **백그라운드 탭은 1440x900 으로 작게 렌더된다** → `openTab` 으로 새로 연 탭에서 찍으면 1440x900.
  **사용자가 보고 있는 '활성' 탭**은 창 크기(2280x1323)로 렌더되고, 여기에 DPR2 를 걸면 **3840x2160** 이 나온다.
  → `openOurs()` 는 **기존 도움말 탭을 찾아 attach** 한다. `openTab` 금지.
- 우회 시도는 전부 실패했다(기록): `clip.scale:2` → 화면이 **2x2 타일링**, `captureBeyondViewport:true` + `clip.y` → **clip.y 무시**되고 스크롤 위치가 찍힘, `Browser.setWindowBounds` → 무효.
- `Emulation` override 는 **이미 걸려 있으면 재설정이 무시**된다. `location.reload()` 도 override 를 날린다.
- ⚠️ **탭을 전부 닫으면 Aside 앱이 종료된다.** 마지막 탭을 닫지 말 것(이번에 3회 재시작했다).

### 최종 산출물
`COMMON-guide.mp4` **10.23 MiB / 281.8초(4분 41초) / 8452프레임** (비디오 7.88 + 오디오 2.06)
길이 매니페스트 일치 · 2초이상 연속무음 0건 · 구간 peak 5269~13953 · 임베드 `readyState 4`·`currentTime 4.23`
