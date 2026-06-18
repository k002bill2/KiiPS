# KiiPS DB Inspector — Reference

> MyBatis mapper 분석 상세 가이드

---

## Mapper XML 구조 분석

### 기본 구조

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="FD0101">

    <!-- 공통 SQL 조각 -->
    <sql id="columns">
        A.FUND_CD, A.FUND_NM, A.FUND_TYPE_CD,
        A.SETUP_DT, A.CLOSE_DT, A.USE_YN
    </sql>

    <!-- resultMap: 테이블-컬럼 매핑 -->
    <resultMap id="fundMap" type="map">
        <result column="FUND_CD" property="fundCd"/>
        <result column="FUND_NM" property="fundNm"/>
        <result column="FUND_TYPE_CD" property="fundTypeCd"/>
    </resultMap>

    <!-- 조회 -->
    <select id="getList" resultType="map">
        SELECT <include refid="columns"/>
        FROM TB_FD_FUND_MST A
        WHERE A.USE_YN = 'Y'
        <if test="fundNm != null and fundNm != ''">
            AND A.FUND_NM LIKE '%' || #{fundNm} || '%'
        </if>
        ORDER BY A.FUND_CD
    </select>

    <!-- 상세 조회 -->
    <select id="getDetail" resultType="map">
        SELECT A.*, B.COMP_NM
        FROM TB_FD_FUND_MST A
        LEFT JOIN TB_CM_COMPANY B ON A.COMP_CD = B.COMP_CD
        WHERE A.FUND_CD = #{fundCd}
    </select>

    <!-- 등록 -->
    <insert id="insertData">
        INSERT INTO TB_FD_FUND_MST (
            FUND_CD, FUND_NM, FUND_TYPE_CD,
            REG_USER_ID, REG_DT
        ) VALUES (
            #{fundCd}, #{fundNm}, #{fundTypeCd},
            #{regUserId}, SYSDATE
        )
    </insert>

    <!-- 수정 -->
    <update id="updateData">
        UPDATE TB_FD_FUND_MST
        SET FUND_NM = #{fundNm},
            FUND_TYPE_CD = #{fundTypeCd},
            MOD_USER_ID = #{modUserId},
            MOD_DT = SYSDATE
        WHERE FUND_CD = #{fundCd}
    </update>

</mapper>
```

---

## 분석 명령어 레퍼런스

### 테이블 검색

```bash
# 모듈 내 모든 테이블명 추출
grep -rohP 'TB_\w+' KiiPS-FD/src/main/resources/mapper/ | sort -u

# 특정 테이블 사용처 검색
grep -rln 'TB_FD_FUND_MST' KiiPS-FD/src/main/resources/mapper/

# 테이블별 사용 빈도
grep -rohP 'TB_\w+' KiiPS-FD/src/main/resources/mapper/ | \
    sort | uniq -c | sort -rn | head -20
```

### 컬럼 검색

```bash
# resultMap에서 컬럼 추출
grep -A 50 '<resultMap' KiiPS-FD/src/main/resources/mapper/fd/FD0101.xml | \
    grep '<result' | grep -oP 'column="[^"]*"'

# 특정 컬럼 사용처 검색
grep -rn 'FUND_CD' KiiPS-FD/src/main/resources/mapper/ --include="*.xml"

# INSERT 쿼리의 필수 컬럼 추출
grep -A 20 '<insert' KiiPS-FD/src/main/resources/mapper/fd/FD0101.xml
```

### JOIN 관계 분석

```bash
# JOIN 패턴 추출 (테이블 관계)
grep -rn 'JOIN' KiiPS-FD/src/main/resources/mapper/ --include="*.xml" | \
    grep -oP '(LEFT |RIGHT |INNER )?JOIN\s+TB_\w+'

# ON 조건으로 연결 키 파악
grep -B1 -A1 'JOIN' KiiPS-FD/src/main/resources/mapper/fd/FD0101.xml | \
    grep -oP 'ON\s+\w+\.\w+\s*=\s*\w+\.\w+'
```

### 쿼리 통계

```bash
# 모듈별 CRUD 통계
echo "=== FD Module ==="
echo -n "SELECT: "; grep -rc '<select' KiiPS-FD/src/main/resources/mapper/ | \
    awk -F: '{s+=$2} END{print s}'
echo -n "INSERT: "; grep -rc '<insert' KiiPS-FD/src/main/resources/mapper/ | \
    awk -F: '{s+=$2} END{print s}'
echo -n "UPDATE: "; grep -rc '<update' KiiPS-FD/src/main/resources/mapper/ | \
    awk -F: '{s+=$2} END{print s}'
```

### DAO-Mapper 매핑

```bash
# DAO 클래스에서 mapper ID 추출
grep -rn 'selectList\|selectOne\|insert\|update' \
    KiiPS-FD/src/main/java/ --include="*Dao.java" | \
    grep -oP '"[A-Z][A-Za-z0-9]*\.\w+"'

# namespace와 DAO 클래스 매핑 확인
grep -rn 'namespace=' KiiPS-FD/src/main/resources/mapper/ --include="*.xml" | \
    sed 's/.*namespace="\([^"]*\)".*/\1/'
```

---

## KiiPS 공통 테이블 구조

### 공통 감사(Audit) 컬럼

대부분의 KiiPS 테이블에 포함되는 공통 컬럼:

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `REG_USER_ID` | VARCHAR | 등록자 ID |
| `REG_DT` | TIMESTAMP | 등록일시 |
| `MOD_USER_ID` | VARCHAR | 수정자 ID |
| `MOD_DT` | TIMESTAMP | 수정일시 |
| `USE_YN` | CHAR(1) | 사용여부 ('Y'/'N') |

### 공통 코드 테이블

```
TB_CM_CODE_GROUP  — 코드 그룹 (GRP_CD, GRP_NM)
TB_CM_CODE_DTL    — 코드 상세 (GRP_CD, DTL_CD, DTL_NM)
TB_CM_MENU        — 메뉴 (MENU_CD, MENU_NM, PARENT_CD)
TB_SY_USER        — 사용자 (USER_ID, USER_NM, DEPT_CD)
```

---

## 동적 SQL 분석 주의사항

### `<if>` 태그

조건부 컬럼이므로 항상 포함되지는 않음:

```xml
<if test="fundNm != null and fundNm != ''">
    AND A.FUND_NM LIKE '%' || #{fundNm} || '%'
</if>
```

-> `FUND_NM` 컬럼은 "조건부 사용"으로 표시

### `<choose>` / `<when>` 태그

분기별 다른 컬럼 사용 -> 분기별로 별도 분석 필요

### `<foreach>` 태그

배열/리스트 파라미터 -> IN 절 사용으로 표시

---

**Version**: 1.0.0
**Last Updated**: 2026-03-13
