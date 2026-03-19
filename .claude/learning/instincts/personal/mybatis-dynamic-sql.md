---
id: mybatis-dynamic-sql
trigger: "MyBatis 동적 SQL 조건 작성 시"
confidence: 0.7
domain: "mybatis-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 10
---

# MyBatis 동적 SQL: <where> + <if> 패턴

## Action
동적 조건절은 `<where>` 태그로 감싸고 각 조건은 `<if test="...">` 사용. AND/OR 접두사는 MyBatis가 자동 처리.

```xml
<select id="selectList" resultType="Map">
  SELECT * FROM TABLE_NAME
  <where>
    <if test="param1 != null and param1 != ''">
      AND COLUMN1 = #{param1}
    </if>
    <if test="param2 != null and param2 != ''">
      AND COLUMN2 LIKE '%' || #{param2} || '%'
    </if>
  </where>
</select>
```

## Evidence
- KiiPS 프로젝트 전반의 mapper.xml 표준 패턴
- 39회 mybatis 도메인 관찰에서 일관된 패턴
