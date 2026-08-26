#!/usr/bin/env python3
"""실측 렉트 + 오디오 길이 → src/scenes.ts 생성.
렉트는 캡처 시점 CSS px(1920x1080 기준). 소스 좌표(3840x2160)는 x2.
dur = 8f(리드인) + ceil(audioSec*30) + 20f(테일, 전환 12f보다 길게)."""
import json, math, re, subprocess, os

HERE = os.path.dirname(os.path.abspath(__file__))
AUDIO = os.path.join(HERE, "public", "audio")
FPS = 30

# ── SCENES: 화면별로 교체 ─────────────────────────────────────────────
# (id, img, audio, badge, caption, rectCSS{x,y,w,h} or None, padding, maxScale)
#  - rect 는 캡처와 같은 패스에서 실측한 CSS px (스포트라이트+말풍선 union)
#  - rect=None 이면 줌 없음 (intro/outro 타이틀 카드 등)
#  - 소형 타깃은 maxScale 을 올리기보다 padding 을 90 으로 줄일 것
# 아래 2건은 형태 예시 — 대상 화면의 씬 목록으로 전량 교체한다.
SCENES = [
    ("intro", None, "intro.mp3", None, None, None, 120, 3.0),
    ("t01", "tour-01.png", "t01.mp3", "1",
     "검색필터 — 조건 7가지를 조합합니다. 새로 고른 조건은 조회를 눌러야 반영됩니다.",
     dict(x=475.5, y=187.4, w=320, h=330.7), 120, 3.0),
]
# ────────────────────────────────────────────────────────────────────

def audio_sec(name):
    out = subprocess.run(["afinfo", os.path.join(AUDIO, name)],
                         capture_output=True, text=True).stdout
    m = re.search(r"estimated duration:\s*([0-9.]+)", out)
    return float(m.group(1))

entries = []
for sid, img, aud, badge, caption, rect, pad, mx in SCENES:
    sec = audio_sec(aud)
    dur = 8 + math.ceil(sec * FPS) + 20
    e = {"id": sid, "audio": f"audio/{aud}", "audioSec": round(sec, 3), "dur": dur}
    if img: e["img"] = img
    if badge: e["badge"] = badge
    if caption: e["caption"] = caption
    if rect:
        e["rect"] = {k: round(v * 2, 1) for k, v in rect.items()}  # source(3840x2160) 좌표
        e["padding"] = pad
        e["maxScale"] = mx
    entries.append(e)

ts = ("// 자동 생성 파일 — build_scenes.py가 만듦. 직접 수정 금지.\n"
      "export type SceneEntry = {\n"
      "  id: string; audio: string; audioSec: number; dur: number;\n"
      "  img?: string; badge?: string; caption?: string;\n"
      "  rect?: { x: number; y: number; w: number; h: number };\n"
      "  padding?: number; maxScale?: number;\n"
      "};\n"
      f"export const SCENES: SceneEntry[] = {json.dumps(entries, ensure_ascii=False, indent=2)};\n")

with open(os.path.join(HERE, "src", "scenes.ts"), "w") as f:
    f.write(ts)

total = sum(e["dur"] for e in entries) - 12 * (len(entries) - 1)
print(f"scenes: {len(entries)}, total frames(after transitions): {total} = {total/30:.1f}s")
