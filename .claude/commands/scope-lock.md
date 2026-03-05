---
description: 지정된 파일만 수정 허용 - 범위 제한 모드
argument-hint: <파일1> [파일2] [파일3] ...
---

# Scope Lock - 범위 제한 모드

지정된 파일만 수정을 허용하여, 의도하지 않은 파일 변경을 방지합니다.

**Usage:** `/scope-lock <파일 경로들>`

**Examples:**
- `/scope-lock KiiPS-UI/src/main/resources/static/css/sass/layouts/_dark.scss`
- `/scope-lock KiiPS-FD/src/main/java/kr/co/kiips/fd/service/FundService.java KiiPS-FD/src/main/java/kr/co/kiips/fd/controller/FundController.java`
- `/scope-lock unlock` - 범위 제한 해제

---

## Instructions for Claude

### 활성화 시

1. **범위 등록**: 사용자가 지정한 파일 목록을 기억합니다
2. **확인 메시지 출력**:
   ```
   🔒 Scope Lock 활성화
   수정 허용 파일:
   - [파일1]
   - [파일2]
   범위 외 파일 수정 시 사용자 확인을 요청합니다.
   해제: "/scope-lock unlock" 또는 새 주제 시작
   ```

### 편집 시 동작

1. **범위 내 파일**: 정상적으로 수정
2. **범위 외 파일 수정이 필요할 때**:
   - 수정하기 **전에** 사용자에게 확인:
     ```
     ⚠️ Scope Lock: [파일명]은 범위 밖입니다.
     사유: [왜 이 파일 수정이 필요한지 설명]
     수정을 진행할까요?
     ```
   - 사용자 승인 후에만 수정

### 변경 계획 미리보기

편집을 시작하기 전에 변경 계획을 출력합니다:
```
📋 변경 계획:
1. [파일명] - [변경 내용 요약] (N줄 수정)
2. [파일명] - [변경 내용 요약] (N줄 추가)
```

### 완료 시 리포트

작업 완료 후 변경 요약을 출력합니다:
```
📊 변경 요약:
| 파일 | 추가 | 수정 | 삭제 |
|------|------|------|------|
| [파일명] | +N줄 | ~N줄 | -N줄 |
총 변경: N개 파일, +N줄, -N줄
```

### 해제 조건

다음 경우 Scope Lock이 해제됩니다:
- `/scope-lock unlock` 명시적 해제
- 사용자가 완전히 새로운 주제/작업을 시작할 때
- 세션 종료 시

---

## Critical Rules

- **범위 외 수정 금지**: 승인 없이 범위 밖 파일 수정 절대 금지
- **계획 먼저**: 편집 전 항상 변경 계획 출력
- **최소 변경**: 범위 내에서도 필요한 최소한만 수정
- **리포트 필수**: 작업 완료 시 반드시 변경 요약 출력
