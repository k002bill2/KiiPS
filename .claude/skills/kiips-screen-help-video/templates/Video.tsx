import React from "react";
import {
  AbsoluteFill,
  Audio,
  Img,
  Sequence,
  staticFile,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { loadFont } from "@remotion/google-fonts/NotoSansKR";
import { Camera, CameraKeyframe } from "./Camera";
import { SCENES, SceneEntry } from "./scenes";

const { fontFamily } = loadFont("normal", {
  weights: ["400", "700", "900"],
  subsets: ["korean", "latin"],
});

export const FPS = 30;
const TRANSITION = 12;
const SRC = { width: 3840, height: 2160 };

export const TOTAL_FRAMES =
  SCENES.reduce((a, s) => a + s.dur, 0) - TRANSITION * (SCENES.length - 1);

const Ink = "#0B111C";
const Marker = "#C5372C";

/* 커서 타깃: 스포트라이트 중심 (캡처 좌표계 CSS px — 2차 실측을 캡처 scrollY로 보정한 값) */
const SPOT_CENTERS: Record<string, { x: number; y: number }> = {
  t01: { x: 540.5, y: 208.4 },
  t02: { x: 668.5, y: 208.4 },
  t03: { x: 924.5, y: 208.4 },
  t04: { x: 1107.2, y: 208.4 },
  t05: { x: 510.3, y: 320.7 },
  t06: { x: 1222.6, y: 320.6 },
  t07: { x: 1300.2, y: 320.6 },
  t08: { x: 1007.6, y: 478.1 },
  t09: { x: 1370.6, y: 364.0 },
  t10: { x: 1146.3, y: 320.6 },
  confirm: { x: 952.5, y: 570.0 },
};

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/* 가짜 커서 — source 좌표계 안에서 스포트라이트로 이동 후 클릭 리플 */
const Cursor: React.FC<{ tx: number; ty: number }> = ({ tx, ty }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const move = spring({ frame: frame - 6, fps, config: { damping: 17, stiffness: 130 }, durationInFrames: 22 });
  const sx = clamp(tx + 620, 260, 3580);
  const sy = clamp(ty + 480, 260, 1960);
  const x = sx + (tx - sx) * move;
  const y = sy + (ty - sy) * move;
  const appear = interpolate(frame, [4, 10], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const rip = interpolate(frame, [30, 50], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <>
      {rip > 0 && rip < 1 && (
        <div
          style={{
            position: "absolute",
            left: tx - 90 * rip,
            top: ty - 90 * rip,
            width: 180 * rip,
            height: 180 * rip,
            borderRadius: "50%",
            border: `6px solid rgba(197,55,44,${0.75 * (1 - rip)})`,
          }}
        />
      )}
      <svg
        viewBox="0 0 24 24"
        style={{
          position: "absolute",
          left: x,
          top: y,
          width: 58,
          height: 58,
          opacity: appear,
          filter: "drop-shadow(0 4px 10px rgba(0,0,0,.45))",
        }}
      >
        <path d="M5.5 3.2 18.6 12l-5.6 1.1-2.9 5.4z" fill="#111827" stroke="#FFFFFF" strokeWidth="1.6" strokeLinejoin="round" />
      </svg>
    </>
  );
};

const CaptionBar: React.FC<{ caption: string; badge?: string }> = ({ caption, badge }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const barIn = spring({ frame: frame - 4, fps, config: { damping: 200 } });
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 40,
        display: "flex",
        justifyContent: "center",
        opacity: barIn,
        transform: `translateY(${(1 - barIn) * 44}px)`,
        fontFamily,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          maxWidth: 1560,
          background: "rgba(11,17,28,0.9)",
          borderRadius: 16,
          padding: "20px 34px",
          boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        }}
      >
        {badge ? (
          <div
            style={{
              flex: "0 0 auto",
              width: 50,
              height: 50,
              borderRadius: "50%",
              background: Marker,
              color: "#fff",
              fontSize: 26,
              fontWeight: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "3px solid rgba(255,255,255,0.85)",
            }}
          >
            {badge}
          </div>
        ) : (
          <div style={{ flex: "0 0 auto", width: 12, height: 50, borderRadius: 6, background: "#0F62C4" }} />
        )}
        <div
          style={{
            color: "#F4F7FB",
            fontSize: 31,
            fontWeight: 700,
            lineHeight: 1.42,
            letterSpacing: "-0.01em",
            wordBreak: "keep-all",
          }}
        >
          {caption}
        </div>
      </div>
    </div>
  );
};

const TitleCard: React.FC<{ big: string; small: string; sub?: string }> = ({ big, small, sub }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const up = spring({ frame, fps, config: { damping: 200 } });
  const up2 = spring({ frame: frame - 12, fps, config: { damping: 200 } });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${Ink} 0%, #16233B 60%, #1B3A66 100%)`,
        alignItems: "center",
        justifyContent: "center",
        fontFamily,
      }}
    >
      <div style={{ color: "#8FB4E8", fontSize: 30, fontWeight: 700, letterSpacing: "0.2em", opacity: up, transform: `translateY(${(1 - up) * 30}px)` }}>
        {small}
      </div>
      <div style={{ color: "#FFFFFF", fontSize: 84, fontWeight: 900, marginTop: 28, letterSpacing: "-0.02em", opacity: up2, transform: `translateY(${(1 - up2) * 40}px)` }}>
        {big}
      </div>
      {sub && (
        <div style={{ color: "#AEB9CC", fontSize: 30, fontWeight: 400, marginTop: 30, opacity: up2 }}>{sub}</div>
      )}
    </AbsoluteFill>
  );
};

const Scene: React.FC<{ e: SceneEntry }> = ({ e }) => {
  const durSec = e.dur / FPS;
  const keyframes: CameraKeyframe[] = e.rect
    ? [
        {
          at: 0.27,
          hold: Math.max(1, durSec - 0.27 - 0.55 - 0.85 - 0.45),
          rect: { x: e.rect.x, y: e.rect.y, width: e.rect.w, height: e.rect.h },
          padding: e.padding,
          maxScale: e.maxScale,
        },
      ]
    : [];
  const spot = SPOT_CENTERS[e.id];
  return (
    <AbsoluteFill style={{ fontFamily }}>
      <Camera keyframes={keyframes} source={SRC}>
        <Img src={staticFile(e.img!)} style={{ width: SRC.width, height: SRC.height, display: "block" }} />
        {spot && <Cursor tx={spot.x * 2} ty={spot.y * 2} />}
      </Camera>
      {e.caption && <CaptionBar caption={e.caption} badge={e.badge} />}
      <Sequence from={8} layout="none">
        <Audio src={staticFile(e.audio)} />
      </Sequence>
    </AbsoluteFill>
  );
};

const renderScene = (e: SceneEntry) => {
  if (e.id === "intro") {
    return (
      <AbsoluteFill>
        <TitleCard big="펀드정보 화면 안내" small="KiiPS 화면 가이드 · FD0101" sub="조회 · 목록 읽기 · 상세 수정까지 한 번에" />
        <Sequence from={8} layout="none"><Audio src={staticFile(e.audio)} /></Sequence>
      </AbsoluteFill>
    );
  }
  if (e.id === "outro") {
    return (
      <AbsoluteFill>
        <TitleCard big="더 자세한 내용은 도움말 페이지에서" small="FD0101-펀드정보-도움말.html" sub="연습 화면에서 직접 눌러보며 배울 수 있습니다" />
        <Sequence from={8} layout="none"><Audio src={staticFile(e.audio)} /></Sequence>
      </AbsoluteFill>
    );
  }
  return <Scene e={e} />;
};

export const Fd0101Video: React.FC = () => {
  return (
    <TransitionSeries>
      {SCENES.map((e, i) => (
        <React.Fragment key={e.id}>
          {i > 0 && (
            <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: TRANSITION })} />
          )}
          <TransitionSeries.Sequence durationInFrames={e.dur}>
            {renderScene(e)}
          </TransitionSeries.Sequence>
        </React.Fragment>
      ))}
    </TransitionSeries>
  );
};
