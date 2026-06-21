# KiiPS DB Inspector — Reference

> **inline SQL DAO** 분석 상세 가이드. (이 프로젝트는 MyBatis mapper XML을 쓰지 않는다 —
> 쿼리는 `*APIDao.java`의 `StringBuffer`에 인라인 조립된다.)

---

## 정본 예시 DAO (실제 코드 — 직접 읽어 패턴 확인)

새 분석 시 아래 실파일을 먼저 열어 현재 패턴을 확인하라(이 문서의 발췌보다 실파일이 우선):

| 파일 | 보여주는 패턴 |
|------|--------------|
| `KiiPS-IL/src/main/java/com/kiips/il/dao/IL0139APIDao.java` | `extends DBSelecter`, WITH/RANK 복합 SELECT, `getTemplate(lib).queryForList` |
| `KiiPS-PG/src/main/java/com/kiips/pg/dao/PG0916APIDao.java` | 조건부 `sb.append(...);values.add(...)`, IN절(`InParameter`), `queryForMap` |
| `KiiPS-UTILS/src/main/java/com/kiips/util/SQLBuilder.java` | 공유 쿼리 빌더 정적 메서드(예: `FD1003M(lib, param)`) |
| `KIIPS-BATCH/src/main/java/com/kiips/batch/dao/DBSelecter.java` | 베이스 클래스, `getTemplate(LIB)` |

---

## DAO 골격

```java
@Repository
public class XXXXAPIDao extends DBSelecter {
    public XXXXAPIDao(@Qualifier("jdbcKiiPS") JdbcTemplate jt) { super(jt); }

    public List<Map<String,Object>> getLIST(String lib, Map<String,String> param) throws Exception {
        StringBuffer sb = new StringBuffer();
        List<Object> values = new ArrayList<>();
        sb.append("\n SELECT A.GDS_CD --상품코드 , A.GDS_NM --상품명 ");
        sb.append("\n   FROM "+lib+".TB_IL1014M A ");      // lib = 운용사 스키마(서버 제어값)
        sb.append("\n  WHERE A.DEL_YN = 'N' ");
        if (StringUtils.isNotBlank(param.get("GDS_CD"))) {
            sb.append("\n  AND A.GDS_CD = ? "); values.add(param.get("GDS_CD"));   // 사용자 값=? 바인딩
        }
        return getTemplate(lib).queryForList(sb.toString(), values.toArray());
    }
}
```

**핵심 규칙**
- **스키마**: `"+lib+".TB_xxx`. `lib`=운용사 스키마(멀티테넌트). 전 운용사 공유 마스터=`Constant.MAIN_LIB`("KIIPS").
- **바인딩**: 사용자 값은 위치 `?` + `values.add(...)`. **문자열 연결로 사용자 값을 넣지 말 것**
  (SQL Injection). `lib`만 신뢰값으로 연결.
- **IN절 다중값**: `InParameter p = TextUtil.getInstance().convMultipleConditionList(param.get("X"));`
  → `sb.append(... p.getInSql() ...)` + `values.addAll(p.getList())`.
- **실행**: `getTemplate(lib).queryForList(...)` / `queryForMap(...)` / `update(...)`.
- **공유 쿼리**: 여러 화면이 쓰는 쿼리는 `SQLBuilder.{화면ID}(lib, param)` 정적 메서드로 빌드.

---

## 분석 명령 (mapper XML이 아니라 *.java 대상)

> 이 환경 `grep --include`는 ugrep라 오작동 → **`find ... | xargs grep`** 으로 우회한다.

```bash
# 테이블이 어느 DAO에서 쓰이는지
find . -name "*Dao.java" -o -name "*DAO.java" | xargs grep -ln "TB_FD1003M"

# 컬럼 + 한글주석 추출 (SELECT 절 'A.COL --주석' 패턴)
find . -name "*Dao.java" | xargs grep -hoE "[A-Z]\.[A-Z_]+ +--.*" | sort -u

# JOIN 관계
find . -name "*Dao.java" | xargs grep -hE "JOIN .*TB_[A-Z]{2}[0-9]{4}"

# 쿼리 유형 통계 (실행 메서드 기준 — mapper 태그 아님)
find . -name "*Dao.java" | xargs grep -hoE "queryForList|queryForMap|update\(" | sort | uniq -c

# 공유 쿼리 빌더 목록
grep -oE "public static String [A-Z0-9_]+\(" KiiPS-UTILS/src/main/java/com/kiips/util/SQLBuilder.java
```

---

## 네이밍 & 공통 구조

**테이블**: `TB_{2글자 도메인}{4자리}{M|D}[NN]` — M=마스터, D=상세(D01/D02…).
예: `TB_IL1014M`, `TB_FD1003M`/`TB_FD1003D01`, `TB_AC1004D`, `TB_PG3011D01`.

**공통 감사 컬럼** (실측 빈도순 — 대부분의 테이블에 존재):

| 컬럼 | 설명 |
|------|------|
| `DEL_YN` | 삭제여부 `'Y'/'N'` (조회 시 보통 `DEL_YN='N'`). **USE_YN 아님** |
| `REG_DTM` / `REG_EMP` | 등록일시 / 등록자 사번 |
| `MODY_DTM` / `MODY_EMP` | 수정일시 / 수정자 사번 |

**공통코드**: `TB_CM_*`가 아니라 테이블함수 `MAIN_LIB.TBL_SY1007M('"+lib+"')`
(CDTP=그룹, CDDT=코드, DSCP=설명). 투자유형 마스터=`MAIN_LIB.TB_IL1014M`
(GDS_CD/GDS_NM/STK_GDS_TPCD: '1'=주식 '3'=채권).

---

## 분석 주의사항

- 인라인 SQL은 `if (...) { sb.append(...) }` 조건 분기로 컬럼/조건이 동적 추가됨 → 정적 grep은
  "조건부 컬럼"을 놓칠 수 있다. 해당 DAO 메서드 전체를 읽어 분기를 확인하라.
- 컬럼 **타입**은 소스에 없다(주석은 한글 설명일 뿐). 실제 타입은 DDL 확인 필요.
- 뷰/프로시저/테이블함수는 별도(예: `TBL_SY1007M`는 함수).

---

**Version**: 2.0.0
**Last Updated**: 2026-06-21 (mapper XML 픽션 → inline SQL DAO 현실로 전면 재작성, 실 DAO 검증 기반)
