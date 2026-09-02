/**
 * Camera.tsx — Remotion 화면 소개 영상용 카메라 레이어 (사용자 제공 설계 채택)
 * rect 좌표는 source 논리 좌표계(여기서는 3840×2160 캡처 픽셀) 기준.
 */
import React, { useMemo } from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type Rect = { x: number; y: number; width: number; height: number };

export type CameraKeyframe = {
  at: number;
  hold: number;
  rect: Rect | null;
  zoomIn?: number;
  zoomOut?: number;
  padding?: number;
  maxScale?: number;
};

type CamState = { scale: number; cx: number; cy: number };

/** expo-out: 빠르게 출발 → 도착에서 감속. "탁 붙는" 느낌 */
export const EASE_IN = Easing.bezier(0.16, 1, 0.3, 1);
/** ease-in-out: 줌아웃 전용 (급격하면 멀미) */
export const EASE_OUT = Easing.bezier(0.65, 0, 0.35, 1);

const DEFAULTS = { zoomIn: 0.55, zoomOut: 0.85, padding: 120, maxScale: 3.0 } as const;

/**
 * 홀드 중 미세 줌("정지화면 티 제거"). **기본값 0 — 켜지 말 것.**
 *
 * 0 이 아니면 scale 이 매 프레임 소수점 5자리로 바뀌어 전 픽셀이 서브픽셀만큼 밀린다.
 * 그러면 정지 화면인 홀드 구간을 인코더가 매 프레임 새로 부호화한다.
 * FD0102(20씬 / 3분 27초 / 1080p CRF30) 실측:
 *   - 홀드 프레임 비용  4.15 kB → 0.19 kB (96% 감소, 순수 정지 구간 기준)
 *   - 비디오 스트림     20.70 MiB → 13.46 MiB (35% 감소)
 * 홀드가 영상의 ~85%라 이 상수 하나가 파일 크기의 최대 지렛대다.
 * 화질은 완전히 동일하다(같은 해상도·같은 CRF). 얻는 것은 미세한 "살아있는 느낌"뿐이므로
 * 되살릴 이유가 생기면 그 대가(수 MiB)를 알고 켤 것.
 */
const DRIFT_PER_SECOND = 0;

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

function rectToCam(rect: Rect, src: Rect, kf: CameraKeyframe): CamState {
  const pad = kf.padding ?? DEFAULTS.padding;
  const maxScale = kf.maxScale ?? DEFAULTS.maxScale;
  const scale = clamp(
    Math.min(src.width / (rect.width + pad * 2), src.height / (rect.height + pad * 2)),
    1,
    maxScale,
  );
  return { scale, cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
}

const REST = (src: Rect): CamState => ({ scale: 1, cx: src.width / 2, cy: src.height / 2 });
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const blend = (a: CamState, b: CamState, t: number): CamState => ({
  scale: lerp(a.scale, b.scale, t),
  cx: lerp(a.cx, b.cx, t),
  cy: lerp(a.cy, b.cy, t),
});

function evaluate(timeSec: number, keyframes: CameraKeyframe[], src: Rect): CamState {
  const rest = REST(src);
  for (const kf of keyframes) {
    const inDur = kf.zoomIn ?? DEFAULTS.zoomIn;
    const outDur = kf.zoomOut ?? DEFAULTS.zoomOut;
    const start = kf.at;
    const holdStart = start + inDur;
    const holdEnd = holdStart + kf.hold;
    const end = holdEnd + outDur;
    if (timeSec < start || timeSec > end) continue;
    const target = kf.rect ? rectToCam(kf.rect, src, kf) : rest;
    if (timeSec < holdStart) {
      const t = interpolate(timeSec, [start, holdStart], [0, 1], {
        easing: EASE_IN, extrapolateLeft: "clamp", extrapolateRight: "clamp",
      });
      return blend(rest, target, t);
    }
    if (timeSec <= holdEnd) {
      const held = timeSec - holdStart;
      return { ...target, scale: target.scale * (1 + held * DRIFT_PER_SECOND * 4) };
    }
    const t = interpolate(timeSec, [holdEnd, end], [0, 1], {
      easing: EASE_OUT, extrapolateLeft: "clamp", extrapolateRight: "clamp",
    });
    return blend(target, rest, t);
  }
  return { ...rest, scale: 1 + timeSec * DRIFT_PER_SECOND };
}

function toTransform(cam: CamState, src: Rect): string {
  const s = cam.scale;
  let tx = src.width / 2 - cam.cx * s;
  let ty = src.height / 2 - cam.cy * s;
  tx = clamp(tx, src.width - src.width * s, 0);
  ty = clamp(ty, src.height - src.height * s, 0);
  return `translate3d(${tx.toFixed(3)}px, ${ty.toFixed(3)}px, 0) scale(${s.toFixed(5)})`;
}

export const Camera: React.FC<{
  keyframes: CameraKeyframe[];
  source: { width: number; height: number };
  spotlight?: boolean;
  children: React.ReactNode;
}> = ({ keyframes, source, spotlight = true, children }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();
  const t = frame / fps;
  const src: Rect = { x: 0, y: 0, width: source.width, height: source.height };

  const cam = useMemo(
    () => evaluate(t, keyframes, src),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t, keyframes, source.width, source.height],
  );

  const vignette = interpolate(cam.scale, [1, 1.8], [0, 0.42], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ overflow: "hidden", backgroundColor: "#0b1220" }}>
      <div
        style={{
          width: source.width,
          height: source.height,
          transform: `scale(${width / source.width}) ${toTransform(cam, src)}`,
          transformOrigin: "0 0",
          willChange: "transform",
        }}
      >
        {children}
      </div>
      {spotlight && vignette > 0.001 && (
        <AbsoluteFill
          style={{
            pointerEvents: "none",
            background: `radial-gradient(ellipse 62% 58% at 50% 48%, rgba(0,0,0,0) 40%, rgba(6,12,24,${vignette}) 100%)`,
          }}
        />
      )}
    </AbsoluteFill>
  );
};
