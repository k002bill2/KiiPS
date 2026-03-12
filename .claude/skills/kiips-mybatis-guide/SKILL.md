---
name: kiips-mybatis-guide
description: "MyBatis 종합 가이드 - mapper.xml 패턴, 동적 SQL, TypeHandler, 성능 최적화"
---

# KiiPS MyBatis Guide

> KiiPS 프로젝트의 MyBatis 사용 표준 패턴 및 보안 가이드

---

## Quick Reference

```
#{} → PreparedStatement 파라미터 바인딩 (안전, 기본값)
${} → 문자열 직접 치환 (위험, 테이블명/컬럼명에만 제한적 사용)
```

| 상황 | 사용 | 예시 |
|------|------|------|
| WHERE 조건값 | `#{}` | `WHERE id = #{userId}` |
| LIKE 검색 | `#{}` + `CONCAT` | `WHERE name LIKE CONCAT('%', #{keyword}, '%')` |
| IN 절 | `<foreach>` | `<foreach item="id" collection="list">` |
| ORDER BY | `${}` (화이트리스트) | `ORDER BY ${orderColumn}` |
| 테이블명 | `${}` (화이트리스트) | `FROM ${tableName}` |

---

## Part 1: 바인딩 기본 규칙

### #{} — 파라미터 바인딩 (기본)

```xml
<!-- ✅ 안전: PreparedStatement로 변환 -->
<select id="selectUser" resultType="UserVO">
    SELECT USER_ID, USER_NM, DEPT_CD
    FROM TB_SY1001M
    WHERE USER_ID = #{userId}
      AND USE_YN = #{useYn}
</select>
```

내부 동작:
```sql
-- PreparedStatement
SELECT USER_ID, USER_NM, DEPT_CD FROM TB_SY1001M WHERE USER_ID = ? AND USE_YN = ?
```

### ${} — 문자열 치환 (제한적 사용)

```xml
<!-- ⚠️ 주의: 직접 치환, SQL Injection 위험 -->
<!-- 반드시 서버측 화이트리스트 검증 후 사용 -->
<select id="selectDynamic" resultType="map">
    SELECT ${columns}
    FROM ${tableName}
    ORDER BY ${orderColumn} ${orderDirection}
</select>
```

**${} 허용 케이스 (서버측 화이트리스트 필수)**:
1. 테이블명 동적 지정
2. 컬럼명 동적 지정 (ORDER BY, SELECT 절)
3. ASC/DESC 정렬 방향

**${} 금지 케이스**:
1. WHERE 조건값
2. INSERT VALUES
3. 사용자 입력값 직접 사용

---

## Part 2: KiiPS DAO 패턴

### 표준 DAO 구조

```java
@Repository
public class TB_SY1001M_DAO {

    @Autowired
    private SqlSessionTemplate sqlSession;

    private static final String NAMESPACE = "kiips.sy.TB_SY1001M";

    // 목록 조회
    public List<Map<String, Object>> selectList(Map<String, Object> param) {
        return sqlSession.selectList(NAMESPACE + ".selectList", param);
    }

    // 단건 조회
    public Map<String, Object> selectOne(Map<String, Object> param) {
        return sqlSession.selectOne(NAMESPACE + ".selectOne", param);
    }

    // 등록
    public int insert(Map<String, Object> param) {
        return sqlSession.insert(NAMESPACE + ".insert", param);
    }

    // 수정
    public int update(Map<String, Object> param) {
        return sqlSession.update(NAMESPACE + ".update", param);
    }

    // 삭제
    public int delete(Map<String, Object> param) {
        return sqlSession.delete(NAMESPACE + ".delete", param);
    }
}
```

### VO 기반 DAO (모델 클래스 사용)

```java
@Repository
public class TB_FD1001M_DAO {

    @Autowired
    private SqlSessionTemplate sqlSession;

    private static final String NAMESPACE = "kiips.fd.TB_FD1001M";

    public List<TB_FD1001M> selectList(TB_FD1001M model) {
        return sqlSession.selectList(NAMESPACE + ".selectList", model);
    }

    // ❌ 절대 금지: 문자열 연결 쿼리
    // public List<Map> findByName(String name) {
    //     return sqlSession.selectList("SELECT * FROM TB WHERE NAME = '" + name + "'");
    // }
}
```

---

## Part 3: Mapper XML 패턴

### 파일 위치

```
KiiPS-{MODULE}/src/main/resources/mapper/{domain}/
  ├── TB_{MODULE}NNNNM_SQL.xml    # 마스터 테이블
  ├── TB_{MODULE}NNNND_SQL.xml    # 디테일 테이블
  └── TB_{MODULE}NNNNH_SQL.xml    # 이력 테이블
```

### 표준 mapper 구조

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="kiips.fd.TB_FD1001M">

    <!-- 목록 조회 -->
    <select id="selectList" parameterType="map" resultType="map">
        SELECT A.FUND_CD
             , A.FUND_NM
             , A.FUND_TYPE
             , TO_CHAR(A.REG_DT, 'YYYY-MM-DD') AS REG_DT
          FROM TB_FD1001M A
         WHERE 1=1
        <if test="fundCd != null and fundCd != ''">
           AND A.FUND_CD = #{fundCd}
        </if>
        <if test="fundNm != null and fundNm != ''">
           AND A.FUND_NM LIKE CONCAT('%', #{fundNm}, '%')
        </if>
         ORDER BY A.FUND_CD
    </select>

    <!-- 단건 조회 -->
    <select id="selectOne" parameterType="map" resultType="map">
        SELECT A.*
          FROM TB_FD1001M A
         WHERE A.FUND_CD = #{fundCd}
    </select>

    <!-- 등록 -->
    <insert id="insert" parameterType="map">
        INSERT INTO TB_FD1001M (
            FUND_CD, FUND_NM, FUND_TYPE,
            REG_ID, REG_DT
        ) VALUES (
            #{fundCd}, #{fundNm}, #{fundType},
            #{regId}, NOW()
        )
    </insert>

    <!-- 수정 -->
    <update id="update" parameterType="map">
        UPDATE TB_FD1001M
           SET FUND_NM   = #{fundNm}
             , FUND_TYPE  = #{fundType}
             , MOD_ID     = #{modId}
             , MOD_DT     = NOW()
         WHERE FUND_CD    = #{fundCd}
    </update>

    <!-- 삭제 -->
    <delete id="delete" parameterType="map">
        DELETE FROM TB_FD1001M
         WHERE FUND_CD = #{fundCd}
    </delete>

</mapper>
```

---

## Part 4: 동적 SQL

### if 태그

```xml
<where>
    <if test="userId != null and userId != ''">
        AND USER_ID = #{userId}
    </if>
    <if test="userNm != null and userNm != ''">
        AND USER_NM LIKE CONCAT('%', #{userNm}, '%')
    </if>
    <if test="deptCd != null and deptCd != ''">
        AND DEPT_CD = #{deptCd}
    </if>
</where>
```

### choose / when / otherwise

```xml
<choose>
    <when test="searchType == 'NAME'">
        AND USER_NM LIKE CONCAT('%', #{keyword}, '%')
    </when>
    <when test="searchType == 'ID'">
        AND USER_ID = #{keyword}
    </when>
    <otherwise>
        AND (USER_NM LIKE CONCAT('%', #{keyword}, '%')
             OR USER_ID LIKE CONCAT('%', #{keyword}, '%'))
    </otherwise>
</choose>
```

### foreach (IN 절)

```xml
<!-- List 파라미터 -->
<select id="selectByIds" parameterType="map" resultType="map">
    SELECT * FROM TB_SY1001M
     WHERE USER_ID IN
    <foreach item="id" collection="userIds" open="(" separator="," close=")">
        #{id}
    </foreach>
</select>
```

### set 태그 (부분 업데이트)

```xml
<update id="updateSelective" parameterType="map">
    UPDATE TB_FD1001M
    <set>
        <if test="fundNm != null">FUND_NM = #{fundNm},</if>
        <if test="fundType != null">FUND_TYPE = #{fundType},</if>
        MOD_DT = NOW()
    </set>
    WHERE FUND_CD = #{fundCd}
</update>
```

---

## Part 5: MERGE / UPSERT 패턴 (PostgreSQL)

```xml
<!-- PostgreSQL ON CONFLICT (UPSERT) -->
<insert id="merge" parameterType="map">
    INSERT INTO TB_FD1001M (
        FUND_CD, FUND_NM, FUND_TYPE, REG_ID, REG_DT
    ) VALUES (
        #{fundCd}, #{fundNm}, #{fundType}, #{regId}, NOW()
    )
    ON CONFLICT (FUND_CD)
    DO UPDATE SET
        FUND_NM   = EXCLUDED.FUND_NM,
        FUND_TYPE  = EXCLUDED.FUND_TYPE,
        MOD_ID     = #{regId},
        MOD_DT     = NOW()
</insert>
```

**주의**: MERGE/UPSERT의 ON 절에도 반드시 `#{}` 사용

---

## Part 6: SQL Injection 방지 체크리스트

### 코드 리뷰 시 검증 항목

1. **${} 사용 전수 검사**: mapper.xml에서 `${}` 검색
2. **화이트리스트 검증**: `${}` 사용 시 서버 측 허용값 목록 존재 확인
3. **문자열 연결 금지**: DAO에서 `"..." + variable + "..."` 패턴 탐지
4. **LIKE 패턴**: `LIKE '%${keyword}%'` 대신 `LIKE CONCAT('%', #{keyword}, '%')` 사용
5. **IN 절**: 직접 `${}` 대신 `<foreach>` 사용

### 자동 검증 Grep 패턴

```bash
# 위험한 ${} 사용 탐지 (테이블명/컬럼명 외)
grep -rn '\${' --include='*.xml' KiiPS-*/src/main/resources/mapper/ | \
  grep -v 'tableName\|orderColumn\|orderDirection\|columns'

# DAO 문자열 연결 탐지
grep -rn '\".*SELECT\|INSERT\|UPDATE\|DELETE.*\"\s*+' --include='*.java' KiiPS-*/src/
```

---

## Part 7: 성능 최적화

### 페이징 처리

```xml
<!-- PostgreSQL LIMIT/OFFSET -->
<select id="selectListPaging" parameterType="map" resultType="map">
    SELECT A.*
      FROM TB_FD1001M A
     WHERE 1=1
    <include refid="searchCondition"/>
     ORDER BY A.FUND_CD
     LIMIT #{pageSize} OFFSET #{offset}
</select>
```

### 배치 처리

```xml
<!-- 배치 INSERT -->
<insert id="insertBatch" parameterType="list">
    INSERT INTO TB_FD1002D (FUND_CD, SEQ, ITEM_NM, REG_ID, REG_DT)
    VALUES
    <foreach item="item" collection="list" separator=",">
        (#{item.fundCd}, #{item.seq}, #{item.itemNm}, #{item.regId}, NOW())
    </foreach>
</insert>
```

### sql / include 재사용

```xml
<sql id="searchCondition">
    <if test="fundCd != null and fundCd != ''">
        AND A.FUND_CD = #{fundCd}
    </if>
    <if test="fundNm != null and fundNm != ''">
        AND A.FUND_NM LIKE CONCAT('%', #{fundNm}, '%')
    </if>
</sql>

<select id="selectList" parameterType="map" resultType="map">
    SELECT * FROM TB_FD1001M A WHERE 1=1
    <include refid="searchCondition"/>
</select>

<select id="selectCount" parameterType="map" resultType="int">
    SELECT COUNT(*) FROM TB_FD1001M A WHERE 1=1
    <include refid="searchCondition"/>
</select>
```
