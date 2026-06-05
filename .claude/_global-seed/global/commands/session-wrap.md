---
description: "세션 종료 정리 (COLLECT→SUMMARIZE→LEARN→HANDOFF)"
---

# /session-wrap - 세션 종료 정리

> Forge session-wrap의 4단계(Collect→Summarize→Learn→Handoff)를 범용화

세션을 정리하고 다음 세션을 위한 인수인계를 준비합니다.

---

## 4단계 Wrap 프로토콜

### 1. COLLECT (변경 수집)

다음을 수집하세요:

```bash
# VCS 변경사항 확인
git status  # 또는 svn status
```

출력:
- 변경된 파일 목록 + 변경 유형 (A/M/D)
- 영향받은 모듈 목록
- 빌드/테스트 최종 상태 (이번 세션에서 실행했다면)

### 2. SUMMARIZE (요약)

```markdown
## 세션 요약

### 완료된 작업
- [ ] 작업 1: ...

### 미완료 작업
- [ ] 작업 2: ... (이유: ...)

### 발견된 이슈
- 이슈 1: ...

### 기술 부채
- ...
```

### 3. LEARN (학습)

- `.claude/learning/observations.jsonl`에서 세션 관찰 패턴 요약
- 반복된 패턴이 있다면 `/learn` 호출 제안
- 메모리 파일 업데이트 필요 시 수행

### 4. HANDOFF (인수인계)

1. 컨텍스트 저장 (Dev Docs 업데이트 등)
2. 다음 세션 시작 가이드:
   ```
   다음 세션: /resume 으로 컨텍스트 복원
   미완료: [작업 목록]
   주의: [있다면]
   ```
3. VCS 커밋 필요 여부 안내

---

## 자동 체크리스트

세션 종료 전 확인:

- [ ] 변경된 파일에 미완성 코드 없는지 확인
- [ ] 디버깅용 임시 코드 제거
- [ ] 열린 TODO/FIXME 정리 또는 기록
- [ ] VCS 커밋 여부 사용자에게 확인

---

## 연동

- **observe.js hook**: 세션 관찰 데이터 활용
- **save-and-compact**: 컨텍스트 저장 + 압축
- **resume**: 다음 세션에서 복원
- **learn**: 패턴 학습 기록
