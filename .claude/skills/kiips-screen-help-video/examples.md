# KiiPS 화면 도움말+안내영상 — Examples (영상 파이프라인 실명령)

FD0101 실증 기반 절차서. 판단·절차는 [SKILL.md](SKILL.md), 도움말 아키텍처·함정 체크리스트는 [reference.md](reference.md) 에 있습니다.

프로젝트 루트: 세션 스크래치패드에 새로 스캐폴드한 영상 프로젝트 디렉토리 (이하 `$PROJ`).
⚠️ 스크래치패드는 세션 종료 시 소멸한다 — 소스 템플릿의 정본은 이 스킬의 `templates/`(Camera.tsx · Video.tsx · build_scenes.py · remotion-project.md)이며, 재제작은 캡처 단계부터 재실행을 전제한다.
구성: Remotion 4.x (React 18 + `@remotion/transitions` + `@remotion/google-fonts`), 컴포지션 `<화면코드>` 1920x1080@30fps (`src/Root.tsx`), 소스 좌표계 3840x2160 = DPR2 캡처 원본 (`src/Video.tsx: SRC`).
(아래 명령 예시는 FD0101 기준 — 화면코드·파일명만 치환)

---

## 0. 프로젝트 스캐폴드

```bash
mkdir -p $PROJ/{src,public/audio,out}
# package.json 핵심: dependencies에 remotion/@remotion/cli/@remotion/transitions/@remotion/google-fonts ^4.0.0, react/react-dom ^18.3.1
# scripts: "render": "remotion render src/index.ts FD0101 out/fd0101-guide.mp4 --crf=26 --scale=0.6666666666666666 --audio-bitrate=64k"
#          (--crf / --scale / --audio-bitrate 세 플래그 모두 필수 — 근거는 6절)
# ⚠️ 샌드박스에서는 npm/npx가 ~/.npm/_cacache 쓰기 차단으로 실패한다.
#    npm은 이를 "root 소유 파일 → sudo chown" 으로 오진 안내하니 믿지 말 것.
#    캐시를 프로젝트 안으로 돌리면 샌드박스 유지한 채 설치된다.
cd $PROJ && npm install --no-audit --no-fund --cache "$PROJ/.npmcache" > install.log 2>&1; echo "exit=$?"
test -x ./node_modules/.bin/remotion && echo "설치 OK" || echo "설치 실패"
```

> ⚠️ **`npm install ... | tail` 금지** — 파이프라인 exit code는 tail의 것이라 설치 실패가 "exit 0"으로 보고된다.
> 로그는 파일로 받고 **산출물(`node_modules/.bin/remotion`) 존재**로 확인한다.
> 이후 모든 remotion 명령은 `npx` 대신 **`./node_modules/.bin/remotion`** 를 직접 호출한다(npx는 캐시 우회 옵션이 없음).

`src/index.ts`는 `registerRoot(RemotionRoot)` 한 줄, `src/Root.tsx`는 `<Composition id="FD0101" component={Fd0101Video} durationInFrames={TOTAL_FRAMES} fps={FPS} width={1920} height={1080}/>`.
전체 구성 요약 → [templates/remotion-project.md](templates/remotion-project.md). Camera.tsx/Video.tsx/build_scenes.py 는 templates/ 에서 복사.

---

## 1. DPR2 스틸 캡처 프로토콜 (chrome-devtools MCP)

원칙: **뷰포트 1920x1080 + DPR2 에뮬레이션** → PNG는 3840x2160 물리 픽셀. 렉트는 CSS px로 실측하고 매니페스트에서 x2 한다.

```
# (a) 뷰포트+DPR 에뮬레이션 — 캡처 전 1회
mcp__plugin_ecc_chrome-devtools__emulate  viewport: "1920x1080x2"

# (b) 대상 상태 연출(투어 스텝 진입 등)과 렉트 실측을 "캡처와 같은 패스"에서 실행
mcp__plugin_ecc_chrome-devtools__evaluate_script:
  () => {
    const u = (a,b)=>{ if(!a) return b; if(!b) return a;
      const l=Math.min(a.left,b.left), t=Math.min(a.top,b.top);
      return {left:l, top:t,
        width: Math.max(a.right,b.right)-l, height: Math.max(a.bottom,b.bottom)-t}; };
    const r1 = document.querySelector('#tourSpot')?.getBoundingClientRect();
    const r2 = document.querySelector('#tourPop')?.getBoundingClientRect();
    const r = u(r1, r2);   // 스포트라이트+말풍선 union
    return { x:r.left, y:r.top, w:r.width, h:r.height, scrollY: window.scrollY };
  }

# (c) 같은 패스에서 즉시 캡처 — 파일은 반드시 워크스페이스 루트(작업 디렉토리) 안 경로만 허용됨
mcp__plugin_ecc_chrome-devtools__take_screenshot  filePath: "shots/tour-01.png"  (format: png)

# (d) 캡처본을 프로젝트로 이동
mv <워크스페이스>/shots/tour-01.png $PROJ/public/tour-01.png
```

**함정 2건 (실측으로 확인됨):**
- 렉트 실측을 **별도 패스**(다른 evaluate 호출 세션)에서 하면 scrollY 편차로 좌표가 어긋난다. 반드시 캡처 직전 같은 패스에서 union 렉트 + `window.scrollY`를 함께 회수하고, scrollY가 다르면 보정한다 (`src/Video.tsx`의 `SPOT_CENTERS` 주석: "2차 실측을 캡처 scrollY로 보정한 값").
- `take_screenshot`의 filePath는 **워크스페이스 루트 밖(스크래치패드 등)을 거부**한다. 루트 안에 저장 후 `mv`.

필요 스틸(FD0101 기준 16장): `00-initial.png`, `01-loaded.png`, `tour-01..10.png`, `modal-tab1..3.png`, `confirm-save.png` → 전부 `$PROJ/public/`.

---

## 2. 성우 내레이션 (edge-tts)

```bash
# (a) 1클립 시험 — 반드시 샌드박스 off (edge-tts는 speech.platform.bing.com 접속, 샌드박스 네트워크 화이트리스트 밖)
uvx edge-tts --voice ko-KR-SunHiNeural --rate=-5% \
  --text "펀드정보 화면은 검색필터, 버튼 툴바, 펀드 목록 세 구역으로 구성됩니다." \
  --write-media $PROJ/public/audio/s00.mp3

# (b) 들어보고 톤 확정 후 배치 생성 (클립별 --text 반복; 클립 id는 scene id와 1:1)
for id in intro s00 s01 t01 t02 t03 t04 t05 t06 t07 t08 t09 t10 m1 m2 m3 confirm outro; do
  uvx edge-tts --voice ko-KR-SunHiNeural --rate=-5% \
    --text "$(스크립트[$id])" --write-media $PROJ/public/audio/$id.mp3
done

# (c) 길이 측정 (macOS 내장)
afinfo $PROJ/public/audio/s00.mp3 | grep "estimated duration"
```

`--rate=-5%`: 기본 속도가 안내영상에는 빨라서 5% 감속이 실측 적정값.

---

## 3. 매니페스트 구동 — `build_scenes.py` → `src/scenes.ts`

`$PROJ/build_scenes.py`가 단일 진실원. 씬 테이블(id, img, audio, badge, caption, **CSS px 렉트**, padding, maxScale)을 파이썬에 선언하고 실행하면 `src/scenes.ts`를 자동 생성한다 (직접 수정 금지 헤더 포함).

```bash
python3 $PROJ/build_scenes.py
# 출력 예(FD0101 실측): scenes: 18, total frames(after transitions): 4776 = 159.2s
# — total frames 는 클립별 오디오 길이에 따라 달라지는 값. 씬 수만 고정 참조.
```

핵심 산식 (build_scenes.py:74, 80):
- **`dur = 8f 리드인 + ceil(audioSec × 30) + 20f 테일`** — 오디오는 `<Sequence from={8}>`로 8프레임 뒤에 시작(Video.tsx:212), 테일 20f는 **전환 12f보다 길어야** 페이드 중 다음 내레이션이 겹치지 않는다.
- `audioSec`은 `afinfo`의 `estimated duration:` 파싱 (build_scenes.py:65-69).
- 렉트는 CSS px 입력 → **`×2` 하여 소스(3840x2160) 좌표로 기록** (`{k: round(v*2,1)}`).
- 총 길이 = `Σdur − 12×(씬수−1)` (TransitionSeries가 전환만큼 겹침).

캡처를 다시 뜨거나 내레이션을 바꾸면 **스크립트 재실행만** 하면 된다.

---

## 4. 카메라 계약 — `src/Camera.tsx`

씬당 키프레임 1개: `at:0.27s`에 시작, `hold = durSec − 0.27 − 0.55 − 0.85 − 0.45` (Video.tsx:196-197).

- **비대칭 이징**: 펀치인 0.55s `Easing.bezier(0.16,1,0.3,1)`(expo-out, "탁 붙는" 느낌) / 줌아웃 0.85s `Easing.bezier(0.65,0,0.35,1)`(ease-in-out — 급하면 멀미).
- **배율 산출**: `scale = clamp( min(srcW/(rectW+2·pad), srcH/(rectH+2·pad)), 1, maxScale )` (Camera.tsx:41-45). **상한 3.0** 기본; 소형 타깃(t05 등)은 배율을 올리는 게 아니라 **padding을 90으로 줄이고** maxScale 3.2 정도만 허용.
- **가장자리 클램프**: `tx∈[srcW−srcW·s, 0]`, `ty∈[srcH−srcH·s, 0]` (Camera.tsx:90-91) — 화면 밖 검은 여백 방지.
- **홀드 드리프트**: `DRIFT_PER_SECOND = 0` — **끈 상태가 기본이고 켜지 말 것**. 홀드 중 미세 줌을 주면
  `scale`이 매 프레임 바뀌어 전 픽셀이 서브픽셀만큼 밀리고, 정지 화면인 홀드를 인코더가 매 프레임 새로 부호화한다.
  FD0102 실측: 홀드 프레임 **4.15 kB → 0.19 kB(96%↓)**, 비디오 스트림 **20.70 → 13.46 MiB(35%↓)**, 화질은 동일.
  홀드가 영상의 ~85%라 파일 크기의 최대 지렛대다 (근거·주석은 [templates/Camera.tsx](templates/Camera.tsx)).
- **비네트**: `scale 1→1.8`에 opacity `0→0.42` radial-gradient 오버레이 (Camera.tsx:112-114, 129-135).
- 최종 transform: `scale(1920/3840)` 다운스케일 후 카메라 transform 적용, `transformOrigin:"0 0"`.

---

## 5. 커서 연출 — `src/Video.tsx` Cursor

- 타깃 좌표는 `SPOT_CENTERS`(스포트라이트 중심, **캡처 좌표계 CSS px 실측값**) → 렌더 시 `×2`로 소스 좌표화 (`<Cursor tx={spot.x*2} ty={spot.y*2}/>`, Video.tsx:209).
- 이동: `spring({frame: frame-6, config:{damping:17, stiffness:130}, durationInFrames:22})` — 오프셋 시작점 `(tx+620, ty+480)`을 화면 내로 clamp 후 스포트라이트 중심으로 스프링 이동.
- 클릭 리플: frame 30→50에 반경 0→90px 확장 원(테두리 `rgba(197,55,44,α)`, α는 1−rip 페이드).
- 커서 SVG는 58px, drop-shadow 포함. frame 4→10 페이드인.

캡션 바(하단, `rgba(11,17,28,0.9)` 카드 + 번호 배지 `#C5372C`)와 타이틀 카드(intro/outro)는 spring damping 200 슬라이드업.

---

## 6. 렌더

```bash
cd $PROJ
# ⚠️ sandbox off 필수 — 최초 실행 시 Chrome Headless Shell 을 storage.googleapis.com 에서 받는다
#    (샌드박스에서는 getaddrinfo ENOTFOUND 로 죽음). `remotion still` 도 동일.
#    1080p 유지 (기본)
./node_modules/.bin/remotion render src/index.ts FD0101 out/fd0101-guide.mp4 \
  --crf=30 --audio-bitrate=64k > render.log 2>&1
#    720p (권장 — 도움말 임베드 표시 폭이 645 CSS px 라 DPR2 에서도 1:1)
./node_modules/.bin/remotion render src/index.ts FD0101 out/fd0101-guide.mp4 \
  --crf=26 --scale=0.6666666666666666 --audio-bitrate=64k > render.log 2>&1
echo "exit=$?"; ls -la out/   # 산출물 존재로 확인 — 로그 tail 만 보고 성공 판정 금지
```

- **`--audio-bitrate=64k` 필수**: 기본값은 **AAC 317 kbps 스테레오 48 kHz**인데 내레이션 원본은 edge-tts **48 kbps 모노 24 kHz**다.
  없는 정보를 만들 수 없으니 음질 이득은 0이고 용량만 7배가 된다. FD0102 실측 **오디오 7.85 → 1.52 MiB(81%↓)**.
- **`--crf` 는 해상도에 맞춰**: 1080p는 30, 720p는 26 전후. 해상도를 낮추면 픽셀당 정보량이 늘어 같은 CRF도 더 흐려 보인다.
- **`--scale=0.6666666666666666`** 로 720p 렌더: 1080p를 인코딩 후 다운스케일하는 것보다 낫다 —
  브라우저가 목표 해상도에서 텍스트를 직접 래스터라이즈하고 3840px 스틸도 한 번만 리샘플링된다.
- 크기 목표는 **30MiB 미만**(도움말 임베드 배포 한도). 위 3가지(드리프트 0 · 오디오 64k · 720p)를 다 적용하면
  FD0102 기준 **28.74 → 약 10 MiB**.
- 폰트는 `@remotion/google-fonts/NotoSansKR`의 `loadFont("normal", {weights:["400","700","900"], subsets:["korean","latin"]})` — 렌더 시 자동 로드, 별도 폰트 파일 불필요 (Video.tsx:15,19-22).

---

## 7. 용량 예산 게이트 — 렌더 직후 (압축하지 말고 다시 만든다)

**원칙: 크기는 인코딩 전에 이미 정해진다.** 세 지렛대가 전부 렌더 파라미터라, 다 만든 뒤 압축할 일이 없다.
후처리 트랜스코딩은 오히려 나쁘다 — 실측: 1080p→720p 트랜스코드 **9.69 MiB** vs 720p 직접 렌더 CRF28 **10.94 MiB**.
직접 렌더가 크지만 **화질이 더 낫다**(브라우저가 목표 해상도에서 텍스트를 직접 래스터라이즈하고, 3840px 스틸도 리샘플링 1회).
초과하면 **렌더 파라미터를 고쳐 다시 만든다.**

### 예산

| 대상 | 한도 | 근거 |
|------|------|------|
| 도움말 임베드 (권장) | **≤ 12 MiB** | git 저장소가 텍스트 위주 — 영상 1개가 저장소를 지배하면 안 됨 |
| SendUserFile 전송 | < 30 MiB | 하드 한도 |
| git 커밋 | **사용자 확인 필수** | 재렌더할 때마다 이전 버전도 영구 보관 |

### 생성 시 3대 지렛대 (기본값에 반영됨 — 끄지 말 것)

| # | 지렛대 | 위치 | 실측 효과 (FD0102) | 화질 |
|---|--------|------|-------------------|------|
| ① | 홀드 드리프트 0 | `Camera.tsx: DRIFT_PER_SECOND` | 비디오 20.70 → **13.46 MiB** | 완전 동일 |
| ② | 오디오 64 kbps | `--audio-bitrate=64k` | 오디오 7.85 → **1.52 MiB** | 완전 동일 |
| ③ | 720p 직접 렌더 | `--scale=0.6666666666666666` + `--crf=26~28` | 15.19 → **10.94 MiB** | 임베드 크기에서 구분 불가 |

합계 **28.74 → 10.94 MiB (62%↓)**. ★ **CRF 는 해상도 종속** — 720p 에서 CRF 26 은 13.62 MiB(1080p 대비 10%↓뿐)라
해상도를 낮춘 값어치가 없다. 해상도를 내리면 CRF 도 함께 올려야 한다.

### 점검 (1분)

```bash
ls -la out/<화면코드>-guide.mp4                                    # (a) 총 크기
for s in v a; do                                                   # (b) 스트림 분해 — 어느 쪽이 문제인지
  b=$(ffprobe -v error -select_streams $s -show_entries packet=size -of csv=p=0 \
      out/<화면코드>-guide.mp4 | awk '{t+=$1} END{print t}')
  python3 -c "print('$s: %.2f MiB' % ($b/1048576))"
done
# (c) 홀드 프레임 비용 — 드리프트가 켜져 있는지 판별 (씬 홀드 구간 프레임 범위로)
ffprobe -v error -select_streams v -show_entries packet=size -of csv=p=0 out/<화면코드>-guide.mp4 \
 | awk 'NR>=3340 && NR<=3500 {t+=$1; n++} END{printf "홀드 평균 %.2f kB/frame\n", t/n/1024}'
#    0.2 kB 근처 = 정상 / 2~4 kB = 드리프트 켜짐
```

### 예산 초과 시 — 위에서부터 순서대로

1. **오디오 > 2 MiB** → `--audio-bitrate=64k` 누락. 플래그 넣고 재렌더 (무손실)
2. **홀드 > 1 kB/frame** → `DRIFT_PER_SECOND` 가 0 이 아님. `Camera.tsx` 고치고 재렌더 (무손실)
3. **해상도 1080p** → `--scale=0.6666666666666666` + `--crf=28` 로 재렌더 (임베드 크기에서 무손실)
4. **여전히 초과** → `--crf` 를 2씩 올려 재렌더 (720p 기준 28 → 30)
5. **그래도 초과** → 씬 수·내레이션 길이 축소. **콘텐츠 결정이므로 사용자 확인 필수**

### 화질 판정은 반드시 임베드 표시 크기로

도움말 CSS 가 `width:min(645px,100%)` — 실제 표시는 **645 CSS px**, DPR2 에서 **1290 디바이스 px**.
**1080p 로 확대해 비교하면 과잉 판정한다.** 반드시 1290px 로 축소해 비교할 것.

```bash
FR=<텍스트가 가장 작은 씬의 홀드 프레임>
for f in before.mp4 after.mp4; do
  ffmpeg -y -ss $(python3 -c "print($FR/30)") -i "$f" -frames:v 1 \
    -vf scale=1290:-2:flags=lanczos "$TMPDIR/q_$(basename "$f" .mp4).png"
done
ffmpeg -y -i "$TMPDIR/q_before.png" -i "$TMPDIR/q_after.png" -filter_complex \
  "[0:v]crop=900:190:380:280[a];[1:v]crop=900:190:380:280[b];[a][b]vstack" "$TMPDIR/q_cmp.png"
# q_cmp.png 를 Read 로 열어 육안 비교 (위=before, 아래=after)
```

---

## 8. 검증 (증거 기반)

```bash
# (a) 화면 검증 — 각 씬 홀드 시점 스틸 추출 (홀드 진입 ≈ 씬시작 + 0.27+0.55s ≈ +25f)
./node_modules/.bin/remotion still src/index.ts FD0101 out/check-t01.png --frame=<씬누적시작+40>
#     ⚠️ 인자를 반드시 따옴표로 — `set -- $pair` 식 분리는 --frame= 을 비워 전부 프레임 0 이 나온다
#        (증상: 추출한 스틸 파일 크기가 전부 동일)

# (b) 오디오 검증 — afinfo는 "오디오 트랙 존재"만 증명, 실제 소리 유무는 PCM 피크로 확인
#     주의1: afconvert는 비디오 mp4 입력을 거부함 → remotion 번들 ffmpeg 사용
#     주의2: 번들 ffmpeg에는 s16le "먹서"가 없다 (Requested output format 's16le' is not known)
#            → raw PCM 대신 wav 컨테이너로 받고 python wave 모듈로 읽는다 (2026-09-02 실측)
./node_modules/.bin/remotion ffmpeg -y -i out/fd0101-guide.mp4 \
  -vn -acodec pcm_s16le -ac 1 -ar 8000 "$TMPDIR/aud.wav"
python3 - <<'EOF'
import wave, struct, os
w = wave.open(os.environ['TMPDIR'] + '/aud.wav', 'rb')
n, sr = w.getnframes(), w.getframerate()
raw = w.readframes(n); w.close()
print("길이 %.1f초 (%d분 %d초)" % (n/sr, int(n/sr)//60, int(n/sr)%60))
for name, frac in [("초반", .10), ("중반", .50), ("후반", .90)]:
    off = int(n*frac)
    seg = struct.unpack('<16000h', raw[off*2:(off+16000)*2])
    print(name, "peak =", max(abs(s) for s in seg))
EOF
# 3지점 모두 peak > 1000 수준이면 내레이션 실재. 0 근처면 무음(오디오 누락).
# 보너스: wav 길이(초)가 build_scenes.py의 total frames/30 과 일치하면 (c)의 길이 검증도 동시에 끝난다.

# (c) 영상 길이 검증 — mdls는 /private/tmp 미인덱싱으로 못 읽음(pitfalls C절).
#     렌더 인코더 로그의 프레임 카운트 = build_scenes.py 출력 total frames 대조가 증거.

# (d) 크기 확인
ls -la out/fd0101-guide.mp4   # 30MiB 미만 확인
```

---

## 9. 도움말 페이지 임베드

도움말 HTML의 hero(개요) 섹션에 video-preview 블록 삽입 — 정본 `docs/help/FD0101-펀드정보-도움말.html:528-529` 실제 마크업:

```html
<div class="video-preview">
  <video src="FD0101-guide.mp4" controls preload="metadata" playsinline aria-label="펀드정보 화면 안내 영상"></video>
  <p class="vp-cap">▶ 안내 영상 (2분 39초) — 화면 구성부터 저장까지 음성으로 안내합니다.</p>
</div>
```

- mp4는 **도움말 HTML과 같은 디렉토리**에 배치 (하위 `video/` 디렉토리 아님). `src` 파일명은 대소문자까지 실제 파일과 일치시킨다.
- 스타일은 인라인 style이 아니라 문서 CSS 클래스 `.video-preview video`가 처리 (`width:min(645px,100%)`, `border-radius:12px`, 보더·섀도 — 정본 :136-137).
- `preload="metadata"`: 페이지 로드 시 영상 본체를 받지 않음(도움말 번들 비대화 방지).
- `poster` 속성은 쓰지 않는다 — 이 파이프라인에는 포스터 이미지 생성 단계가 없다.
- 임베드 후 검증(pitfalls E절): `<video>` `readyState === 4` 재생 실측 + 구버전 미디어 파일 공존 정리 여부 명시적 결정.

---

**수정 루프 요약**: 스틸 재캡처 or 내레이션 수정 → `python3 build_scenes.py` → `./node_modules/.bin/remotion render ... --crf=26 --scale=0.6666666666666666 --audio-bitrate=64k` (sandbox off) → 7번 검증. 렉트/커서 좌표는 항상 캡처와 같은 패스 실측값(CSS px)을 build_scenes.py `SCENES` 테이블과 `SPOT_CENTERS`에 반영한다.
