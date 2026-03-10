# /session-wrap - 세션 종료 정리

> Forge session-wrap의 4단계(Collect→Diff→Write→Suggest)를 SVN + KiiPS 학습 시스템에 적응

세션을 정리하고 다음 세션을 위한 인수인계를 준비합니다.

---

## 4단계 Wrap 프로토콜

### 1. COLLECT (변경 수집)

다음을 수집하세요:

```bash
# SVN 변경사항 확인
svn status

# 세션 관찰 요약 (있는 경우)
# .claude/learning/observations.jsonl 최근 항목
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
- [ ] 작업 2: ...

### 미완료 작업
- [ ] 작업 3: ... (이유: ...)

### 발견된 이슈
- 이슈 1: ...

### 기술 부채
- ...
```

### 3. LEARN (학습)

세션에서 발견된 패턴을 학습 시스템에 기록:

- `.claude/learning/observations.jsonl`에 세션 관찰이 있다면 패턴 요약
- 반복된 패턴이 있다면 `/learn` 호출 제안
- 메모리 파일 업데이트 필요 시 수행

### 4. HANDOFF (인수인계)

다음 세션을 위한 컨텍스트 저장:

1. **Dev Docs 업데이트**: `/update-dev-docs` 또는 `/save-and-compact` 호출
2. **다음 세션 안내**:
   ```
   ## 다음 세션 시작 시
   - `/resume` 으로 컨텍스트 복원
   - 미완료 작업: [목록]
   - 주의사항: [있다면]
   ```
3. **SVN 커밋 상태**: 커밋 필요한 변경사항 안내

---

## 자동 체크리스트

세션 종료 전 확인:

- [ ] 변경된 파일에 미완성 코드 없는지 확인
- [ ] 디버깅용 임시 코드 (console.log, System.out.println) 제거
- [ ] 열린 TODO/FIXME 정리 또는 기록
- [ ] SVN 커밋 여부 사용자에게 확인

---

## 연동

- **observe.js hook**: 세션 관찰 데이터 활용
- **save-and-compact**: 컨텍스트 저장 + 압축
- **resume**: 다음 세션에서 복원
- **learn**: 패턴 학습 기록
