---
id: api-controller-standard
trigger: "Controller 또는 API 엔드포인트 작성 시"
confidence: 0.7
domain: "api-pattern"
source: "observations-bootstrap"
created: "2026-03-19"
updated: "2026-03-19"
observations: 17
---

# Controller 표준 패턴

## Action
KiiPS Controller는 다음 패턴을 따름:

```java
@RestController
@RequestMapping("/api/{도메인}")
public class XxxController {

    @Autowired
    private XxxService xxxService;

    @PostMapping("/list")
    public ResponseEntity<Map<String, Object>> selectList(
            @RequestBody Map<String, Object> param) {
        return ResponseEntity.ok(xxxService.selectList(param));
    }
}
```

- POST 메서드 기본 사용 (GET은 조회에만)
- `@RequestBody Map<String, Object>` 파라미터
- `ResponseEntity<Map<String, Object>>` 반환
- Service → DAO → MyBatis Mapper 호출 체인

## Evidence
- 17회 api-pattern 관찰
- KiiPS 백엔드 가이드라인
