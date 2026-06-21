---
name: kiips-db-inspector
description: "KiiPS inline SQL DAO 기반 테이블/컬럼 구조 조회 전용 스킬. Use when: 테이블 구조, 컬럼, DB 구조, 스키마 확인, DAO SQL 분석, TB_"
user-invocable: false
---

# KiiPS DB Inspector

Java DAO 내 **inline SQL(StringBuffer)** 을 grep으로 분석해 테이블/컬럼/관계를 파악하는 **조회 전용** 스킬입니다.

> ⚠️ **이 프로젝트는 MyBatis mapper XML을 쓰지 않습니다.** `resources/mapper/`에는 쿼리 XML이
> 없습니다(logback 등 설정 XML만). 쿼리는 각 `*APIDao.java`가 `StringBuffer sb`에 인라인 조립합니다.
> 따라서 **분석 대상은 `*.xml`이 아니라 `*Dao.java`** 입니다. 상세 패턴 → `reference.md`.

## Purpose

### What This Skill Does
- **테이블 구조 탐색**: DAO의 `sb.append("... FROM TB_xxx ...")`에서 테이블/컬럼 추출
- **컬럼 목록 추출**: SELECT 절의 `A.COL_NM --주석` 패턴 + VO 필드 파싱
- **테이블 관계 추적**: JOIN 절 패턴 분석
- **쿼리 패턴 분석**: queryForList/queryForMap/update 호출 유형 통계

### What This Skill Does NOT Do
- 실제 DB 연결/쿼리 실행 · 스키마 변경 · 데이터 조회·수정

## When to Use

```
"테이블 구조", "컬럼", "DB 구조", "스키마 확인", "DAO SQL 분석",
"TB_", "DAO 매핑", "테이블 관계", "JOIN 분석"
```

---

## 실제 DAO 패턴 (분석 전제)

```java
@Repository
public class IL0139APIDao extends DBSelecter {
    public IL0139APIDao(@Qualifier("jdbcKiiPS") JdbcTemplate jt) { super(jt); }

    public List<Map<String,Object>> getLIST(String lib, Map<String,String> param) throws Exception {
        StringBuffer sb = new StringBuffer();
        List<Object> values = new ArrayList<>();
        sb.append("\n SELECT A.GDS_CD          --상품코드 ");
        sb.append("\n      , A.INVT_AMT        --투자금액 ");
        sb.append("\n   FROM "+lib+".TB_IL1014M A ");          // lib = 운용사 스키마(서버 제어)
        sb.append("\n  WHERE A.DEL_YN = 'N' ");
        sb.append("\n    AND A.GDS_CD = ? "); values.add(param.get("GDS_CD"));   // 사용자 값 = ? 바인딩
        return getTemplate(lib).queryForList(sb.toString(), values.toArray());
    }
}
```

- **스키마**: `"+lib+".TB_xxx` — `lib`는 운용사 스키마(멀티테넌트, 서버 제어값). 전 운용사 공유
  마스터는 `Constant.MAIN_LIB`("KIIPS").
- **바인딩**: 사용자 값은 위치 `?` + `values.add(...)`. IN절 다중값은
  `TextUtil.getInstance().convMultipleConditionList(...)` → `InParameter` → `values.addAll(p.getList())`.
- **실행**: `getTemplate(lib).queryForList(...)` / `queryForMap(...)` / `update(...)` (JdbcTemplate, `DBSelecter` 상속).
- **공유 쿼리 빌더**: `com.kiips.util.SQLBuilder`의 정적 메서드(예: `SQLBuilder.FD1003M(lib, param)`)가
  같은 StringBuffer 패턴으로 SQL 문자열을 반환.

---

## 분석 명령 (mapper XML이 아니라 *.java 대상)

> 이 환경의 `grep --include`는 ugrep라 오작동 → **`find ... | xargs grep`** 으로 우회한다.

```bash
# 1) 테이블이 어느 DAO에서 쓰이는지
find . -name "*Dao.java" -o -name "*DAO.java" | xargs grep -ln "TB_IL1014M"

# 2) 특정 테이블의 컬럼 + 주석 추출 (SELECT 절의 'A.COL --주석' 패턴)
find . -name "*Dao.java" | xargs grep -hE "TB_IL1014M|sb.append" | grep -oE "[A-Z]\.[A-Z_]+ +--.*"

# 3) JOIN 관계
find . -name "*Dao.java" | xargs grep -hE "JOIN .*TB_[A-Z]{2}[0-9]{4}"

# 4) 쿼리 유형 통계 (실행 메서드 기준)
find . -name "*Dao.java" | xargs grep -hoE "queryForList|queryForMap|update\(" | sort | uniq -c

# 5) 컬럼 사용처
find . -name "*Dao.java" | xargs grep -ln "INVT_AMT"
```

---

## KiiPS 테이블 네이밍 규칙

`TB_{2글자 도메인}{4자리}{M|D}[NN]` — **M**=마스터, **D**=상세(D01/D02… 멀티 상세).

| 도메인 | 예시 | 도메인 | 예시 |
|--------|------|--------|------|
| `TB_IL` 투자원장 | `TB_IL1014M` | `TB_SY` 시스템 | `TB_SY1001M` |
| `TB_FD` 펀드 | `TB_FD1003M`, `TB_FD1003D01` | `TB_LP` LP관리 | `TB_LP…` |
| `TB_AC` 회계 | `TB_AC1001M`, `TB_AC1004D` | `TB_PG` 프로그램 | `TB_PG3011D01` |
| `TB_EL` 전자원장 | `TB_EL1001M` | `TB_CS` | `TB_CS1001M` |

> 공통코드는 `TB_CM_*`가 **아니라** 테이블함수 `MAIN_LIB.TBL_SY1007M(lib)`
> (CDTP=그룹, CDDT=코드, DSCP=설명). 투자유형 마스터=`MAIN_LIB.TB_IL1014M`.

---

## Constraints

- DB 연결 시도 안 함 — `*Dao.java` 소스만 읽고 분석 결과만 제공.
- **정확도 한계**: 인라인 SQL은 조건 분기(`if`로 `sb.append` 추가)가 많아 동적 컬럼은 누락 가능.
  뷰/프로시저는 대상 아님. 컬럼 타입은 소스에 없으므로(주석 추정) 실제 DDL과 차이 가능.

---

**Version**: 2.0.0
**Last Updated**: 2026-06-21 (mapper XML 전제 → inline SQL DAO 현실로 교정)
**Related**: kiips-mybatis-guide(바인딩/SQL Injection 규칙), kiips-backend(Controller·Service·DAO 계층)
