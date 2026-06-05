---
description: "Fresh-Context 독립 검증 - 확인 편향 제거"
argument-hint: "[module] [--effort=low|medium|high]"
---

# /verify — Fresh-Context 검증

구현 완료 후 별도 컨텍스트에서 빌드/테스트/보안을 검증합니다.
확인 편향(confirmation bias)을 제거하여 "아마 될 것" 같은 추측을 방지합니다.

## 사용법

```
/verify                          # 변경된 모듈 자동 감지, effort=medium
/verify <module>                 # 특정 모듈 검증
/verify <module> --high          # 높은 수준 검증
/verify --only compile           # 컴파일만 검증
/verify --only security          # 보안 검사만
```

## 실행 절차

$ARGUMENTS 파싱:
- 첫 번째 인자: 모듈명 (없으면 자동 감지)
- `--low`, `--medium`, `--high`, `--max`: effort 수준
- `--only <step>`: 특정 단계만 (compile/build/test/security)

### 단계

1. **변경 감지**: VCS status 또는 최근 수정 파일에서 대상 모듈과 파일 파악
2. **에이전트 소환**: verify-agent를 별도 컨텍스트로 실행 (Agent tool)
3. **파이프라인 실행**: Compile → Build → Test → Security → Review (순서 고정)
4. **결과 보고**: PASS/FAIL 구조화된 결과 반환

### 에이전트 프롬프트 구성

verify-agent에게 다음 정보를 전달:
- 검증 대상 모듈명
- 변경 파일 목록
- effort 수준
- 검증 단계 제한 (--only)
- 프로젝트 루트 경로

## 핵심 규칙

- **Read-Only**: verify-agent는 코드를 수정하지 않음 (판정만)
- **Fresh Context**: 구현 에이전트의 컨텍스트와 완전히 분리
- **증거 필수**: 모든 판정에 실행 출력 첨부
- **순서 고정**: Compile → Build → Test → Security (건너뛰기 금지)
