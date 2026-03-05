# KiiPS 프로젝트 LSP 설정 가이드

> **Language Server Protocol for Java Development**

---

## 📋 개요

KiiPS 프로젝트에서 Java LSP를 사용하여 다음 기능을 활용할 수 있습니다:

- **코드 자동완성** - 클래스, 메서드, 변수 자동완성
- **정의로 이동** - 클래스/메서드 정의로 빠른 이동
- **참조 찾기** - 코드 사용처 검색
- **타입 정보** - Hover로 타입 정보 확인
- **코드 검증** - 컴파일 오류 실시간 확인

---

## 🚀 설치 완료 내역

### 1️⃣ Eclipse JDT Language Server 설치

```bash
✅ jdtls 1.54.0 설치 완료
   경로: /opt/homebrew/bin/jdtls
```

### 2️⃣ LSP 설정 추가

```bash
✅ .claude/settings.json 업데이트 완료
```

**설정 내용**:
```json
{
  "lsp": {
    "java": {
      "command": "/opt/homebrew/bin/jdtls",
      "args": [
        "-data",
        "${workspaceFolder}/.jdt"
      ],
      "initializationOptions": {
        "workspace": "${workspaceFolder}",
        "settings": {
          "java": {
            "home": "/opt/homebrew/opt/openjdk/libexec/openjdk.jdk/Contents/Home",
            "configuration": {
              "runtimes": [
                {
                  "name": "JavaSE-1.8",
                  "path": "/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home",
                  "default": true
                }
              ]
            },
            "project": {
              "referencedLibraries": [
                "**/*.jar"
              ]
            },
            "maven": {
              "downloadSources": true,
              "downloadJavadoc": false
            }
          }
        }
      },
      "rootPatterns": [
        "pom.xml",
        ".git"
      ],
      "filetypes": [
        "java"
      ]
    }
  }
}
```

---

## ✅ 설정 확인

### LSP 서버 버전 확인

```bash
jdtls --version
```

**예상 출력**:
```
Eclipse JDT Language Server 1.54.0
```

### Java 설치 확인

```bash
# Java 21 (LSP 서버 실행용)
/opt/homebrew/bin/java -version

# Java 8 (KiiPS 프로젝트 빌드용)
/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home/bin/java -version
```

---

## 🎯 LSP 사용 방법

### Claude Code에서 LSP 사용

```bash
# 1. KiiPS 프로젝트로 이동
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS

# 2. Claude 시작
claude

# 3. Java 파일에서 LSP 기능 사용 가능!
```

### LSP 도구 사용

Claude Code에서 `LSP` 도구를 사용하여 Java 코드 분석:

```javascript
// 예: 메서드 정의 찾기
LSP(
  operation: "goToDefinition",
  filePath: "KiiPS-FD/src/main/java/com/kiips/fd/controller/FdController.java",
  line: 42,
  character: 15
)

// 예: 참조 찾기
LSP(
  operation: "findReferences",
  filePath: "KiiPS-COMMON/src/main/java/com/kiips/common/service/CommonService.java",
  line: 28,
  character: 20
)

// 예: Hover 정보
LSP(
  operation: "hover",
  filePath: "KiiPS-UTILS/src/main/java/com/kiips/utils/dao/BaseDAO.java",
  line: 15,
  character: 10
)
```

---

## 🔧 주요 LSP 기능

### 1. 정의로 이동 (goToDefinition)

**사용 시나리오**:
- 클래스 정의 찾기
- 메서드 구현 확인
- 인터페이스 정의 보기

**예시**:
```java
// FdController.java:42
CommonService commonService; // ← Hover하면 정의 위치 표시
```

**LSP 명령**:
```bash
operation: goToDefinition
filePath: KiiPS-FD/src/main/java/com/kiips/fd/controller/FdController.java
line: 42
character: 15
```

---

### 2. 참조 찾기 (findReferences)

**사용 시나리오**:
- 메서드 사용처 검색
- 클래스 사용 분석
- 리팩토링 영향 범위 파악

**예시**:
```java
// CommonService.java:28
public Result getData() { ... } // ← 이 메서드가 어디서 호출되는지?
```

**LSP 명령**:
```bash
operation: findReferences
filePath: KiiPS-COMMON/src/main/java/com/kiips/common/service/CommonService.java
line: 28
character: 20
```

---

### 3. Hover 정보 (hover)

**사용 시나리오**:
- 타입 정보 확인
- 메서드 시그니처 보기
- JavaDoc 읽기

**예시**:
```java
// BaseDAO.java:15
List<Map<String, Object>> result; // ← 타입 정보 표시
```

**LSP 명령**:
```bash
operation: hover
filePath: KiiPS-UTILS/src/main/java/com/kiips/utils/dao/BaseDAO.java
line: 15
character: 10
```

---

### 4. 심볼 목록 (documentSymbol)

**사용 시나리오**:
- 파일 내 모든 클래스/메서드 보기
- 코드 구조 파악

**LSP 명령**:
```bash
operation: documentSymbol
filePath: KiiPS-FD/src/main/java/com/kiips/fd/controller/FdController.java
line: 1
character: 1
```

---

### 5. 작업공간 심볼 검색 (workspaceSymbol)

**사용 시나리오**:
- 프로젝트 전체에서 클래스/메서드 검색

**LSP 명령**:
```bash
operation: workspaceSymbol
filePath: KiiPS-HUB/pom.xml
line: 1
character: 1
```

---

## 🏗️ KiiPS 프로젝트 LSP 활용 예시

### 예시 1: 서비스 메서드 추적

```bash
# 1. FdService의 getData 메서드 정의 찾기
LSP(goToDefinition, "KiiPS-FD/src/.../FdService.java", 42, 15)

# 2. 해당 메서드가 어디서 호출되는지 찾기
LSP(findReferences, "KiiPS-FD/src/.../FdService.java", 42, 15)

# 3. Controller → Service → DAO 호출 체인 추적
```

### 예시 2: Maven Multi-Module 의존성 추적

```bash
# 1. KiiPS-COMMON의 CommonService 정의
LSP(goToDefinition, "KiiPS-COMMON/src/.../CommonService.java", 28, 20)

# 2. KiiPS-FD에서 CommonService 사용처 찾기
LSP(findReferences, "KiiPS-COMMON/src/.../CommonService.java", 28, 20)

# 결과: KiiPS-FD, KiiPS-IL 등에서 사용 중임을 확인
```

### 예시 3: DAO 메서드 분석

```bash
# 1. BaseDAO의 selectList 메서드 정의
LSP(goToDefinition, "KiiPS-UTILS/src/.../BaseDAO.java", 50, 25)

# 2. Hover로 메서드 시그니처 확인
LSP(hover, "KiiPS-UTILS/src/.../BaseDAO.java", 50, 25)

# 3. 모든 사용처 찾기
LSP(findReferences, "KiiPS-UTILS/src/.../BaseDAO.java", 50, 25)
```

---

## 🔄 LSP 작동 원리

### 초기화 프로세스

```
Claude Code 시작
    ↓
LSP 설정 로드 (.claude/settings.json)
    ↓
jdtls 서버 시작
    ↓
프로젝트 분석 (pom.xml 기반)
    ↓
Maven 의존성 다운로드
    ↓
Java 소스 인덱싱
    ↓
LSP 준비 완료! ✅
```

### 작업 디렉토리

LSP 작업 데이터는 다음 위치에 저장됩니다:

```bash
KiiPS/.jdt/
├── config/           # LSP 설정
├── workspaces/       # 워크스페이스 데이터
└── cache/            # 인덱싱 캐시
```

**참고**: `.jdt/` 디렉토리는 `.gitignore`에 추가되어 있습니다.

---

## 🛠️ 트러블슈팅

### 문제 1: LSP가 시작되지 않음

**증상**:
```
LSP 기능이 작동하지 않음
```

**해결**:
```bash
# 1. jdtls 설치 확인
which jdtls

# 2. jdtls 버전 확인
jdtls --version

# 3. .jdt/ 디렉토리 삭제 후 재시작
rm -rf .jdt/
# Claude 재시작
```

---

### 문제 2: Maven 의존성 인식 안 됨

**증상**:
```
import가 빨간색으로 표시됨
Maven jar 파일을 찾지 못함
```

**해결**:
```bash
# 1. Maven 빌드
cd KiiPS-HUB/
mvn clean install

# 2. LSP 재시작
rm -rf ../KiiPS-FD/.jdt/
# Claude 재시작
```

---

### 문제 3: Java 버전 불일치

**증상**:
```
jdtls가 Java 버전 오류를 출력
```

**해결**:
```bash
# 1. Java 버전 확인
java -version  # 21.0.8이어야 함

# 2. Java 경로 확인
/usr/libexec/java_home -V

# 3. settings.json의 java.home 확인
cat .claude/settings.json | jq '.lsp.java.initializationOptions.settings.java.home'
```

---

### 문제 4: LSP 느림

**증상**:
```
LSP 응답이 느림
인덱싱에 시간이 오래 걸림
```

**해결**:
```bash
# 1. .jdt/ 캐시 정리
rm -rf .jdt/

# 2. Maven 로컬 저장소 정리
mvn dependency:purge-local-repository

# 3. 메모리 설정 증가
# .claude/settings.json에 추가:
# "lsp": {
#   "java": {
#     "args": ["-Xmx2G", "-data", "${workspaceFolder}/.jdt"]
#   }
# }
```

---

### 문제 5: Multi-Module 프로젝트 인식 안 됨

**증상**:
```
KiiPS-HUB의 하위 모듈을 인식하지 못함
```

**해결**:
```bash
# 1. KiiPS-HUB에서 Claude 시작 (중요!)
cd /Users/younghwankang/WORK/WORKSPACE/KiiPS
claude

# 2. pom.xml이 있는지 확인
ls KiiPS-HUB/pom.xml

# 3. rootPatterns 확인
cat .claude/settings.json | jq '.lsp.java.rootPatterns'
# ["pom.xml", ".git"]
```

---

## 📊 성능 최적화

### LSP 메모리 설정

**기본 설정** (1GB):
```json
{
  "lsp": {
    "java": {
      "args": ["-data", "${workspaceFolder}/.jdt"]
    }
  }
}
```

**대용량 프로젝트** (2GB):
```json
{
  "lsp": {
    "java": {
      "args": ["-Xmx2G", "-data", "${workspaceFolder}/.jdt"]
    }
  }
}
```

**최대 성능** (4GB):
```json
{
  "lsp": {
    "java": {
      "args": ["-Xmx4G", "-XX:+UseG1GC", "-data", "${workspaceFolder}/.jdt"]
    }
  }
}
```

---

## 🎓 LSP 활용 팁

### 1. 빠른 코드 탐색

```bash
# Ctrl+Click 대신 LSP 사용
# 1. 정의로 이동
LSP(goToDefinition, ...)

# 2. 구현으로 이동
LSP(goToImplementation, ...)

# 3. 타입 정의로 이동
LSP(goToTypeDefinition, ...)
```

### 2. 리팩토링 영향 분석

```bash
# 메서드 이름 변경 전 영향 범위 확인
LSP(findReferences, ...)
# → 20개 파일에서 사용 중
# → 신중하게 변경 필요!
```

### 3. 코드 문서화

```bash
# JavaDoc 자동 확인
LSP(hover, ...)
# → 메서드 설명, 파라미터, 리턴 타입 표시
```

### 4. 의존성 추적

```bash
# 클래스 의존성 체인 추적
LSP(findReferences, "CommonService", ...)
# → FdService, IlService, PgService에서 사용
# → 변경 시 3개 서비스 영향
```

---

## 🔐 보안 고려사항

### LSP 데이터 관리

```bash
# .jdt/ 디렉토리는 Git에 커밋하지 마세요
echo ".jdt/" >> .gitignore

# SVN ignore 설정
svn propset svn:ignore ".jdt" .
```

### 민감 정보 보호

LSP는 다음을 인덱싱하지 않습니다:
- `.env` 파일
- `password` 파일
- `app-kiips.properties` (프로덕션 설정)

---

## 📝 추가 리소스

### 공식 문서

- **Eclipse JDT LS**: https://github.com/eclipse-jdtls/eclipse.jdt.ls
- **Claude Code LSP**: https://docs.claude.ai/code/lsp
- **LSP Specification**: https://microsoft.github.io/language-server-protocol/

### KiiPS 관련 문서

- **프로젝트 가이드**: `CLAUDE.md`
- **아키텍처**: `architecture.md`
- **백업 가이드**: `.scripts/README-BACKUP.md`
- **재설치 가이드**: `.scripts/REINSTALL-GUIDE.md`

---

## ✅ 설정 체크리스트

### 설치 확인
- [x] jdtls 설치 완료
- [x] Java 21 설치 (LSP 서버용)
- [x] Java 8 설치 (KiiPS 빌드용)
- [x] .claude/settings.json 업데이트

### 설정 확인
- [x] LSP 명령 경로: `/opt/homebrew/bin/jdtls`
- [x] Java 8 경로: `/Library/Java/JavaVirtualMachines/jdk-1.8.jdk/Contents/Home`
- [x] Root pattern: `pom.xml`, `.git`
- [x] Maven 소스 다운로드: 활성화

### 기능 테스트
- [ ] goToDefinition 작동 확인
- [ ] findReferences 작동 확인
- [ ] hover 작동 확인
- [ ] documentSymbol 작동 확인

---

## 🎉 완료!

KiiPS 프로젝트에서 Java LSP를 사용할 준비가 완료되었습니다!

**다음 단계**:
1. Claude 재시작
2. KiiPS 프로젝트 열기
3. Java 파일에서 LSP 기능 테스트
4. 코드 탐색 및 분석 시작!

---

**Last Updated**: 2025-12-29
**LSP Version**: jdtls 1.54.0
**Java Version**: Java 8 (KiiPS) + Java 21 (LSP)
