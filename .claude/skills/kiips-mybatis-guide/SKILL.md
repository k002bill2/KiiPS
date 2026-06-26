---
name: kiips-mybatis-guide
description: "KiiPS SQL 바인딩·SQL Injection 방지 참조 가이드 (inline SQL DAO 기준 — MyBatis mapper XML 미사용). Use when: SQL 바인딩, 파라미터 바인딩, SQL Injection 방지, ${} 위험, mybatis, 쿼리 안전, ? 바인딩, InParameter. NOT for: DAO 구조/컬럼 조회(use kiips-db-inspector), 계층/서비스 패턴(use kiips-backend), 인증·암호화 등 일반 보안(use kiips-security-guide)"
---

# KiiPS SQL 바인딩 & Injection 방지 가이드

> ⚠️ **이 프로젝트는 MyBatis mapper XML을 사용하지 않습니다 (mapper XML 0개).** SQL은 Java DAO 내
> `StringBuffer`로 **인라인 조립** + **위치 `?` 바인딩**(JdbcTemplate)으로 작성합니다. 이 문서는 그
> 환경에서의 **안전한 바인딩 규칙**과 **SQL Injection 방지**를 다룹니다.
> 실제 DAO 골격·분석법 → `kiips-db-inspector` · 계층 패턴 → `kiips-backend`.

---

## Quick Reference — 바인딩 원칙

| 들어가는 값 | 방법 | 예시 |
|------------|------|------|
| **사용자 입력값** (WHERE 조건/검색어/저장값) | 위치 `?` + `values.add(...)` | `sb.append("AND A.GDS_CD = ? "); values.add(param.get("GDS_CD"));` |
| **IN절 다중값** | `InParameter` 헬퍼 | `InParameter p = TextUtil.getInstance().convMultipleConditionList(x); ... values.addAll(p.getList());` |
| **스키마명 `lib`** (서버 제어, 멀티테넌트) | 문자열 연결 허용 | `sb.append("FROM "+lib+".TB_IL1014M ");` |
| **정렬 컬럼/방향** (동적) | **화이트리스트 검증 후** 연결 | 서버측 허용 컬럼 목록 대조 필수 |

> MyBatis의 `#{}`(PreparedStatement 바인딩) ↔ 이 프로젝트의 위치 `?` + `values`가 같은 역할이다.
> MyBatis의 `${}`(문자열 치환, 위험) ↔ 이 프로젝트의 `"+변수+"` 문자열 연결에 해당 — **사용자 값에는 절대 쓰지 말 것**.

---

## Part 1: 안전한 바인딩 (✅) vs 위험 (❌)

```java
// ✅ 안전: 사용자 값은 위치 ? 바인딩
sb.append("\n WHERE A.USER_ID = ? ");        values.add(param.get("USER_ID"));
sb.append("\n   AND A.USE_YN  = ? ");        values.add("Y");
// LIKE 검색도 ? 바인딩
sb.append("\n   AND A.USER_NM LIKE '%'||?||'%' "); values.add(param.get("USER_NM").replaceAll("'",""));
return getTemplate(lib).queryForList(sb.toString(), values.toArray());

// ❌ 금지: 사용자 값을 문자열로 연결 (SQL Injection)
sb.append("\n WHERE A.USER_ID = '" + param.get("USER_ID") + "' ");   // 절대 금지

// ⭕ 허용: 스키마명 lib (서버 제어값, 사용자 입력 아님)
sb.append("\n   FROM "+lib+".TB_SY1001M A ");
```

**문자열 연결이 허용되는 유일한 경우**: `lib`(운용사 스키마명) 등 **서버가 제어하는 신뢰값**, 또는
**화이트리스트로 검증된** 식별자(정렬 컬럼명 등). 사용자에게서 온 값은 예외 없이 `?`.

---

## Part 2: SQL Injection 방지 체크리스트

### 코드 리뷰 검증 항목
1. **사용자 값 = `?` 바인딩**: WHERE 조건·검색어·INSERT/UPDATE 값이 전부 `?` + `values.add`인가
2. **문자열 연결 점검**: `"... + param.get(...) + ..."`처럼 사용자 값을 SQL에 직접 연결한 곳이 없는가
3. **`lib` 외 연결 금지**: `"+변수+"` 연결이 `lib`/화이트리스트 식별자에만 쓰이는가
4. **LIKE**: `'%'||?||'%'` (바인딩) 사용. `'%'+키워드+'%'` (연결) 금지
5. **IN절**: `InParameter`(`convMultipleConditionList`) 사용. 사용자 값을 콤마로 직접 잇지 말 것

### 자동 검증 Grep (mapper XML이 아니라 *.java DAO 대상)

```bash
# 사용자 값으로 의심되는 문자열 연결 탐지 (param.get을 SQL에 직접 연결)
find . -name "*Dao.java" -o -name "*DAO.java" | xargs grep -nE '"\s*\+\s*param\.get' 2>/dev/null

# append 안에서 따옴표로 감싼 변수 연결 탐지 (잠재 위험)
find . -name "*Dao.java" | xargs grep -nE "append\(.*'\"\s*\+\s*[a-zA-Z]" 2>/dev/null
```

> 참고: MyBatis 도입 시의 `#{}`/`${}`·`<if>`/`<foreach>`·`<resultMap>` 문법은 이 프로젝트에
> 해당 사항이 없어 본 가이드에서 제외했다. 동적 조건은 Java `if`로 `sb.append(...)`를 분기해 구성한다.

---

**Version**: 3.0.0
**Last Updated**: 2026-06-21 (mapper XML 문법 섹션 제거, inline SQL 바인딩·Injection 방지로 SHRINK)
