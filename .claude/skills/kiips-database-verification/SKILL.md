---
name: KiiPS DB Verification
description: |
  DB 관련 작업 검증 가이드, MyBatis 안전 패턴, DBA 승인 프로세스.
  Use when: DB 관련 작업 검증, MyBatis 쿼리 검증, 마이그레이션 작업
version: 1.0.0
priority: critical
enforcement: block
category: guardrail
tags:
  - db
  - mybatis
  - sql-safety
  - verification
author: KiiPS Development Team
lastUpdated: 2026-03-03
---

# KiiPS DB Verification

> DB 변경 안전성 검증 가드레일

---

## Quick Reference

| 작업 | 위험도 | 필요 승인 |
|------|--------|----------|
| SELECT 쿼리 추가 | 낮음 | 불필요 |
| INSERT/UPDATE/DELETE 변경 | 중간 | 코드 리뷰 |
| 테이블 구조 변경 | 높음 | DBA 승인 |
| 테이블/인덱스 삭제 | 치명적 | DBA + PM 승인 |

---

## 차단 패턴 (자동 차단)

ethicalValidator.js와 연동하여 다음 패턴을 자동 차단:
- 구조 변경 DDL (ALTER/DROP)
- 대량 삭제 (WHERE 없는 DELETE)
- MyBatis `${}` 직접 삽입 (ORDER BY 예외)

---

## MyBatis 안전 패턴

### 안전 (`#{}` 바인딩)
```xml
<select id="selectList" parameterType="map" resultType="map">
    SELECT * FROM TB_TABLE
    WHERE USER_ID = #{userId}
    AND STATUS = #{status}
</select>
```

### 위험 (`${}` 직접 삽입 - Injection 가능)
```xml
<!-- 금지: ${} 직접 삽입 -->
WHERE USER_ID = '${userId}'
```

### 허용 예외 (ORDER BY 동적 정렬)
```xml
<!-- 예외: 정렬 컬럼 (값 화이트리스트 검증 필수) -->
ORDER BY ${sortColumn} ${sortDirection}
```

---

## 변경 절차

1. **변경 스크립트 작성** → DDL 파일로 관리
2. **영향 분석** → 관련 Mapper/DAO/Service 확인
3. **DBA 리뷰** → 인덱스, 제약조건, 성능 검토
4. **스테이징 적용** → 스테이징 환경에서 테스트
5. **프로덕션 적용** → DBA가 직접 실행

---

## 관련 스킬
- `kiips-mybatis-guide`: MyBatis 상세 가이드
- `kiips-security-guide`: SQL Injection 방어 종합
