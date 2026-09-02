# Remotion 프로젝트 구성 요약 (FD0101 실증본 기준)

영상 프로젝트를 세션 스크래치패드에 스캐폴드할 때 이 구성을 그대로 재현한다.
디렉토리: `$PROJ/{src,public/audio,out}` + 루트에 `package.json`, `tsconfig.json`, `build_scenes.py`.

## package.json

```json
{
  "name": "fd0101-guide-video",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "render": "remotion render src/index.ts FD0101 out/fd0101-guide.mp4 --crf=30"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "remotion": "^4.0.0",
    "@remotion/cli": "^4.0.0",
    "@remotion/transitions": "^4.0.0",
    "@remotion/google-fonts": "^4.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.1",
    "typescript": "^5.5.0"
  }
}
```

- `name` / `render` 스크립트의 컴포지션 id·출력 파일명은 대상 화면코드로 치환 (예: FD0201 → `fd0201-guide.mp4`).
- **플래그 3개 필수** (30MiB 한도) — render 스크립트 문자열에 반드시 포함. 수동 실행도 동일:
  `./node_modules/.bin/remotion render src/index.ts <화면코드> out/<파일>.mp4 --crf=26 --scale=0.6666666666666666 --audio-bitrate=64k`
  - `--audio-bitrate=64k` — 기본 317 kbps 스테레오는 모노 TTS 를 7배로 부풀린다 (실측 7.85 → 1.52 MiB)
  - `--scale=0.6666…` — 720p. 도움말 임베드 표시 폭이 645 CSS px 라 DPR2 에서도 1:1
  - `--crf` — 1080p 는 30, 720p 는 26~28
  - `npx` 는 샌드박스에서 실패하므로 **로컬 바이너리 직접 호출**, 렌더 자체는 **sandbox off** 필요

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

## src/index.ts — 진입점 (1줄 등록)

```ts
import { registerRoot } from "remotion";
import { RemotionRoot } from "./Root";

registerRoot(RemotionRoot);
```

## src/Root.tsx — 컴포지션 선언

```tsx
import React from "react";
import { Composition } from "remotion";
import { Fd0101Video, TOTAL_FRAMES, FPS } from "./Video";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="FD0101"
      component={Fd0101Video}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={1920}
      height={1080}
    />
  );
};
```

- `id`는 화면코드, `component`는 Video.tsx의 export 이름과 일치시킨다.
- `TOTAL_FRAMES`/`FPS`는 Video.tsx가 `src/scenes.ts`(build_scenes.py 자동 생성)에서 파생 — 직접 하드코딩 금지.

## src/ 나머지 파일

| 파일 | 출처 | 비고 |
|------|------|------|
| `src/Camera.tsx` | [Camera.tsx](Camera.tsx) 그대로 복사 | 화면 무관 공용 카메라 레이어 |
| `src/Video.tsx` | [Video.tsx](Video.tsx) 복사 후 화면별 수정 | `SPOT_CENTERS` 실측값 교체, intro/outro TitleCard 문구, export 컴포넌트명 |
| `src/scenes.ts` | `python3 build_scenes.py` 가 자동 생성 | 직접 수정 금지 |
| `build_scenes.py` | [build_scenes.py](build_scenes.py) 복사 후 `SCENES` 배열만 교체 | 산식(8f+오디오+20f, ×2 렉트)은 유지 |

## public/ 자산

- `public/*.png` — DPR2 스틸 (3840x2160 물리 픽셀)
- `public/audio/*.mp3` — edge-tts 내레이션 (scene id와 1:1)
- 폰트 파일 불필요 — `@remotion/google-fonts/NotoSansKR` 이 렌더 시 자동 로드
