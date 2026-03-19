---
name: kiips-backend-guidelines
description: "KiiPS 백엔드 개발 가이드 - Controller/Service/DAO 표준 패턴, API 설계, 트랜잭션 관리. Use when: controller, service, dao, API, endpoint, REST"
---

# KiiPS Backend Guidelines

> KiiPS Spring Boot 백엔드 표준 패턴 가이드

---

## Quick Reference

| 계층 | 패턴 | 위치 |
|------|------|------|
| Controller | `@RestController` + `@RequestMapping` | `**/controller/*.java` |
| Service | `@Service` + `@Transactional` | `**/service/*.java` |
| DAO | `extends DAO` + `SqlSession` | `**/dao/*.java` |
| Mapper | MyBatis XML | `**/mapper/*.xml` |

---

## Controller 패턴

```java
@RestController
@RequestMapping("/api/{domain}")
public class XxxController {

    @Autowired
    private XxxService xxxService;

    @PostMapping("/selectList")
    public ResponseEntity<?> selectList(@RequestBody Map<String, Object> param) {
        return ResponseEntity.ok(xxxService.selectList(param));
    }

    @PostMapping("/save")
    public ResponseEntity<?> save(@RequestBody Map<String, Object> param) {
        return ResponseEntity.ok(xxxService.save(param));
    }
}
```

### 규칙
- `@PostMapping` 사용 (GET은 조회 파라미터 노출 위험)
- `ResponseEntity`로 응답 래핑
- Controller에 비즈니스 로직 금지 (Service 위임)

---

## Service 패턴

```java
@Service
public class XxxService {

    @Autowired
    private XxxDAO xxxDAO;

    public List<Map<String, Object>> selectList(Map<String, Object> param) {
        return xxxDAO.selectList(param);
    }

    @Transactional(rollbackFor = Exception.class)
    public int save(Map<String, Object> param) {
        // CUD 작업은 반드시 @Transactional
        return xxxDAO.save(param);
    }
}
```

### 규칙
- CUD 메서드: `@Transactional(rollbackFor = Exception.class)` 필수
- 조회 메서드: `@Transactional` 불필요
- 서비스 간 호출: `Common_API_Service` 사용 (직접 DAO 참조 금지)

---

## DAO 패턴

```java
@Repository
public class XxxDAO extends DAO {

    public List<Map<String, Object>> selectList(Map<String, Object> param) {
        return sqlSession.selectList("xxx.mapper.selectList", param);
    }

    public int save(Map<String, Object> param) {
        return sqlSession.insert("xxx.mapper.save", param);
    }
}
```

### 규칙
- `extends DAO` 상속 필수 (SqlSession 주입)
- Mapper namespace: `{domain}.mapper.{method}`
- SQL Injection 방지: MyBatis `#{}` 바인딩 필수 (`${}` 금지)

---

## API Gateway 통신

```
Client → Gateway(8088) → Service(port)
         x-api-key 검증
```

- 서비스 간 통신: `Common_API_Service.callApi()` 사용
- Gateway 포트: 8088
- `x-api-key` 헤더 검증 필수

---

## Tech Stack

- Spring Boot 2.4.2
- Java 8
- MyBatis (SqlSession 기반)
- PostgreSQL
