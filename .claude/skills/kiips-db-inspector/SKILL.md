---
name: kiips-db-inspector
description: "KiiPS MyBatis mapper 기반 테이블/컬럼 구조 조회 전용 스킬. Use when: 테이블 구조, 컬럼, DB 구조, 스키마 확인, mapper 분석, TB_"
user-invocable: false
---

# KiiPS DB Inspector

MyBatis mapper XML 및 Java Entity 기반으로 구조를 분석하는 **조회 전용** 스킬입니다.

## Purpose

### What This Skill Does
- **테이블 구조 탐색**: MyBatis mapper XML의 resultMap, sql 분석
- **컬럼 목록 추출**: result 태그, Java Entity 필드 파싱
- **테이블 관계 추적**: JOIN 쿼리 패턴 분석
- **쿼리 패턴 분석**: SELECT/INSERT/UPDATE 유형별 통계
- **DAO-Mapper 매핑**: namespace 매칭 확인

### What This Skill Does NOT Do
- 실제 DB 연결 또는 쿼리 실행
- 스키마 변경 작업
- 데이터 조회/수정

## When to Use

### User Prompt Keywords
```
"테이블 구조", "컬럼", "DB 구조", "스키마 확인", "mapper 분석",
"TB_", "DAO 매핑", "테이블 관계", "JOIN 분석"
```

---

## Data Sources

### 1. MyBatis Mapper XML

```
KiiPS-{SERVICE}/src/main/resources/mapper/{domain}/*.xml
```

**분석 대상 태그:**

| 태그 | 추출 정보 |
|------|----------|
| `<mapper namespace>` | DAO 클래스 매핑 |
| `<resultMap>` | 테이블-컬럼 매핑 |
| `<result column="..." property="...">` | 컬럼명 - Java 필드명 |
| `<sql id="...">` | 공통 SQL 조각 |
| `<select>` | 조회 쿼리 (테이블명, JOIN 관계) |
| `<insert>` | 등록 쿼리 (필수 컬럼 파악) |
| `<update>` | 수정 쿼리 (변경 가능 컬럼) |

### 2. Java Entity / VO 클래스

```
KiiPS-{SERVICE}/src/main/java/**/vo/*.java
KiiPS-{SERVICE}/src/main/java/**/dto/*.java
```

### 3. DAO 클래스

```
KiiPS-{SERVICE}/src/main/java/**/dao/*Dao.java
KiiPS-UTILS/src/main/java/**/DAO.java  (Base DAO)
```

---

## Analysis Capabilities

### 1. 테이블 구조 분석

Mapper XML에서 테이블 구조를 추출합니다:

```bash
# Mapper XML에서 테이블명 추출
grep -rn "FROM\|JOIN\|INTO\|UPDATE" KiiPS-FD/src/main/resources/mapper/ | \
    grep -oP 'TB_\w+' | sort -u

# resultMap에서 컬럼 매핑 추출
grep -A 20 '<resultMap' KiiPS-FD/src/main/resources/mapper/fd/FD0101.xml
```

**출력 형식:**

```
Table: TB_FD_FUND_MST
  FUND_CD        (VARCHAR)  -> fundCd
  FUND_NM        (VARCHAR)  -> fundNm
  FUND_TYPE_CD   (VARCHAR)  -> fundTypeCd
  SETUP_DT       (DATE)     -> setupDt
  USE_YN         (CHAR)     -> useYn
  REG_USER_ID    (VARCHAR)  -> regUserId
  REG_DT         (TIMESTAMP)-> regDt
  MOD_USER_ID    (VARCHAR)  -> modUserId
  MOD_DT         (TIMESTAMP)-> modDt
```

### 2. 테이블 관계 추적

JOIN 패턴을 분석하여 테이블 간 관계를 도출합니다:

```bash
# JOIN 관계 추출
grep -rn "JOIN" KiiPS-FD/src/main/resources/mapper/ | \
    grep -oP 'TB_\w+' | sort | uniq -c | sort -rn
```

**출력 형식:**

```
TB_FD_FUND_MST
  [1:N] TB_FD_FUND_DTL      ON FUND_CD
  [N:1] TB_CM_COMPANY        ON COMP_CD
  [N:1] TB_CM_CODE_DTL       ON FUND_TYPE_CD
```

### 3. 쿼리 통계

```bash
# 쿼리 유형별 통계
grep -c '<select' KiiPS-FD/src/main/resources/mapper/fd/*.xml
grep -c '<insert' KiiPS-FD/src/main/resources/mapper/fd/*.xml
grep -c '<update' KiiPS-FD/src/main/resources/mapper/fd/*.xml
```

### 4. DAO-Mapper 연결 확인

```bash
# DAO에서 호출하는 mapper ID 추출
grep -rn 'selectList\|selectOne\|insert\|update' \
    KiiPS-FD/src/main/java/**/dao/*.java | \
    grep -oP '"[^"]*"'
```

### 5. 컬럼 사용 빈도 분석

```bash
# 특정 컬럼이 어느 쿼리에서 사용되는지
grep -rn 'FUND_CD' KiiPS-FD/src/main/resources/mapper/
```

---

## Analysis Workflows

### Workflow 1: 특정 테이블 분석

```
1. 테이블명으로 mapper XML 검색
2. resultMap에서 컬럼 목록 추출
3. SELECT 쿼리에서 JOIN 관계 파악
4. INSERT 쿼리에서 필수 컬럼 파악
5. DAO 클래스에서 호출 패턴 확인
```

### Workflow 2: 모듈별 사용 현황

```
1. 모듈의 mapper 디렉토리 탐색
2. 모든 테이블명 추출 (TB_*)
3. 테이블별 CRUD 통계 집계
4. 핵심 테이블 식별 (참조 빈도 순)
```

### Workflow 3: 컬럼 영향 분석

```
1. 대상 컬럼명으로 전체 mapper 검색
2. 사용되는 쿼리 ID 목록화
3. 해당 DAO 메서드 추적
4. Service -> Controller 호출 체인 확인
```

---

## KiiPS 테이블 네이밍 규칙

| 접두사 | 도메인 | 예시 |
|--------|--------|------|
| `TB_FD_` | 펀드 | `TB_FD_FUND_MST` |
| `TB_IL_` | 투자원장 | `TB_IL_INVEST_MST` |
| `TB_AC_` | 회계 | `TB_AC_JOURNAL` |
| `TB_PG_` | 프로그램 | `TB_PG_PROGRAM_MST` |
| `TB_SY_` | 시스템 | `TB_SY_USER`, `TB_SY_CODE` |
| `TB_LP_` | LP관리 | `TB_LP_LP_MST` |
| `TB_EL_` | 전자원장 | `TB_EL_DOC_MST` |
| `TB_CM_` | 공통 | `TB_CM_CODE`, `TB_CM_MENU` |

---

## Constraints

### Read-Only Guarantee
- 이 스킬은 DB 연결을 시도하지 않습니다
- 파일 시스템의 mapper XML, Java 소스만 읽습니다
- 분석 결과만 제공합니다

### Accuracy Limitations
- Mapper XML 기반 분석이므로 실제 DB 스키마와 차이 가능
- 동적 SQL (`<if>`, `<choose>`)의 조건부 컬럼은 정확도 저하
- 뷰(View), 프로시저(Procedure)는 분석 대상 아님

---

## Integration

### With kiips-mybatis-guide
- DB 변경 작업 전 현재 구조 파악에 활용
- 구조 조회 전용으로 사용

### With Chain of Skills
- Incident Response 파이프라인의 DB 확인 단계에서 활용
- Feature Lifecycle에서 설계 단계 DB 구조 탐색에 활용

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
**Related**: kiips-mybatis-guide, kiips-mybatis-guide, kiips-backend
