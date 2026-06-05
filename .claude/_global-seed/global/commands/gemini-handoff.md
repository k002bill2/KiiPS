---
description: Gemini 분석/리뷰 결과 읽기 및 처리
---

# /gemini-handoff — Gemini 결과 처리

Gemini CLI가 백그라운드에서 생성한 분석 보고서와 코드 리뷰 결과를 읽고 처리합니다.

## 사용법

`/gemini-handoff $ARGUMENTS`

- `read` — 미처리 분석 보고서와 리뷰를 모두 읽고 요약
- `status` — Gemini Bridge 현재 상태 (호출 수, 대기 리뷰 등) 확인

## 처리 흐름

### 1. 분석 보고서 (cross-tool responses)

`.temp/coordination/cross-tool/responses/` 에 저장된 Gemini 분석 보고서를 읽습니다.

```
보고서 읽기 → 이슈 분석 → 실행 계획 수립 → 처리 완료 마킹
```

### 2. 코드 리뷰 결과

`.claude/gemini-bridge/reviews/` 에 저장된 리뷰 결과를 읽습니다.

```
리뷰 읽기 → critical 이슈 우선 처리 → verdict 확인 → shown 마킹
```

## 수행 단계

1. `.temp/coordination/cross-tool/responses/` 디렉토리의 미처리 JSON 파일 읽기
2. `.claude/gemini-bridge/reviews/` 디렉토리에서 status=completed인 미표시 리뷰 읽기
3. critical 이슈를 우선으로 정리하여 보여주기
4. 각 이슈에 대한 수정 방향 제안
5. 처리 완료된 파일에 shown/processed 마킹

## 상태 확인

```bash
node .claude/hooks/gemini-bridge.js status
```

## 참고

- Gemini 리뷰는 `stopEvent.js` 훅이 자동 수집한 변경 파일을 기반으로 실행됩니다
- 보안 스캔은 `/gemini-scan` 명령으로 수동 실행할 수 있습니다
- 일일 호출 한도: 900회
