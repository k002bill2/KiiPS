---
name: project_kiips_inline_sql_dao
description: KiiPS 백엔드 SQL은 mapper XML이 아니라 Java DAO 내 StringBuffer 인라인 방식. 투자유형 마스터=TB_IL1014M.
metadata: 
  node_type: memory
  type: project
  originSessionId: 73351127-7f3c-46e7-90e9-88150f9d3f01
---

KiiPS 백엔드는 **MyBatis mapper XML을 쓰지 않는다**. SQL은 각 `*APIDao.java`(예: `KiiPS-IL/.../dao/IL0139APIDao.java`)에서 `StringBuffer sb; sb.append("\n SELECT ...")` 로 **인라인 조립** 후 `getTemplate(lib).queryForList(...)`(JdbcTemplate, `DBSelecter` 상속)로 실행한다. `resources/mapper/*.xml`에는 `logback-spring.xml` 류만 있고 쿼리 XML은 없다.

**Why:** mapper XML/`#{}` 바인딩을 찾으면 안 나온다. `kiips-db-inspector`·`kiips-mybatis-guide` 스킬은 XML 매퍼 전제라 이 프로젝트엔 부분적으로만 맞다.

**How to apply:**
- 쿼리/컬럼 검색은 `.xml`이 아니라 `find . -name "*.java" | xargs grep "테이블명"` 으로. (이 환경 `grep --include`는 ugrep라 오작동 → `find ... | xargs grep` 우회)
- `lib` = 운용사 스키마(멀티테넌트), `Constant.MAIN_LIB`("KIIPS"/STG="KIIPS_STG") = 전 운용사 공유 마스터 스키마.
- 공통코드는 테이블함수 `MAIN_LIB.TBL_SY1007M(lib)` (CDTP=그룹, CDDT=코드, DSCP=설명).
- 투자유형(상품코드 GDS_CD) 마스터 = `MAIN_LIB.TB_IL1014M` (GDS_CD/GDS_NM/STK_GDS_TPCD/ORDER_NO/DEL_YN). `STK_GDS_TPCD '1'=주식 '3'=채권`. 콤보 소스 = `CommonAPIDao.getGdsCd()`. 앱에 INSERT 경로 없는 DBA 관리 참조데이터.

관련: IL0139 투자유형 섹션은 `gdsopt gds{GDS_CD}` 클래스로 표시 분기([[feedback_realgrid_helper_matrix]] 무관, JSP 패턴).
