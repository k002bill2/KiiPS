# KiiPS Service Ports

> 서비스별 로컬 포트 매핑 — 자동 감지 + 수동 보정
> 최종 감지일: 2026-04-22

## 핵심 서비스

| 서비스 | 포트 | 모듈 | 감지 방법 |
|--------|------|------|-----------|
| API Gateway | 8088 | KIIPS-APIGateway | 알려진 값 (app-*.properties 접근 제한) |
| UI (WAR) | 8100 | KiiPS-UI | 자동 감지 ✅ |
| Common | 8701 | KiiPS-COMMON | 알려진 값 (app-*.properties 접근 제한) |
| Login | 8801 | (Login 서비스 별도) | 알려진 값 |

## 도메인 서비스 (자동 감지)

| 서비스 | 포트 | 모듈 | 감지 방법 |
|--------|------|------|-----------|
| FD (펀드) | 8601 | KiiPS-FD | 자동 감지 ✅ |
| IL (투자) | 8401 | KiiPS-IL | 자동 감지 ✅ |
| AC | 8901 | KiiPS-AC | 자동 감지 ✅ |
| SY | 8301 | KiiPS-SY | 자동 감지 ✅ |
| LP | 8101 | KiiPS-LP | 자동 감지 ✅ |
| EL | 8201 | KiiPS-EL | 자동 감지 ✅ |
| BATCH | (app-*.properties 참조) | KIIPS-BATCH | 자동 감지 실패 |
| HELP | (app-*.properties 참조) | KIIPS-HELP | 자동 감지 실패 |
| AI (챗봇) | 9191 | KIIPS-AI | application.properties `server.port` 확인 ✅ (2026-07-23) |

> AI 챗봇 실제 화면: `http://localhost:9191/CHAT` (UI_Controller → stream.jsp). 루트 `/`는 정적 데모(index.html).

## 포트 충돌 주의

`UI 8100` 과 `LP 8101` 이 근접 — 동시 실행 시 영향 없음이나, 실수 방지를 위해 시작 스크립트는 포트 중복 체크 권장.

## 환경별 설정

- `app-local.properties` — 로컬 개발
- `app-stg.properties` — 스테이징
- `app-kiips.properties` — 운영
- `app-tibero.properties` — Tibero DB 환경

> ⚠️ 위 4개 파일은 `settings.json` permissionRules에서 **deny 등록** — 직접 읽기/편집 불가.
> 포트 확인 시 해당 서비스를 기동 후 `lsof -i :<port>` 로 검증.

## 자동 감지 명령

```bash
# 모든 모듈 포트 스캔
for m in KiiPS-* KIIPS-*; do
  [ -d "$m" ] || continue
  port=$(find "$m/src/main/resources" -name "*.yml" -o -name "*.properties" 2>/dev/null \
         | xargs grep -h "server.port\|server:" 2>/dev/null \
         | grep -oE "[0-9]{4}" | head -1)
  printf "  %-22s %s\n" "$m" "${port:-(config blocked)}"
done
```
