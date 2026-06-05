---
name: KiiPS 로컬 OCI 사설망 접근 — PCAssist 필수
description: app-local.properties의 dev.hikari.jdbc-url(10.0.0.7 등 OCI 사설 IP) 도달성 확보를 위해 PCAssist 프로그램 실행이 선행되어야 함
type: project
originSessionId: afa66468-d312-42d4-a8cb-1885dae8d8ab
---
KiiPS 로컬 개발 환경에서 OCI 사설망 주소(예: `10.0.0.7:1521/kiips_pdb1...`)에 접근하려면 사용자의 워크스테이션에서 **PCAssist** 프로그램을 실행해야 한다. 일반 시스템 VPN이 아니라 PCAssist가 OCI VCN 라우팅을 잡아준다.

**Why:** `KiiPS-IL/app-local.properties`의 `spring.datasource.dev.hikari.jdbc-url`은 OCI 사설 IP(`10.0.0.7`)를 가리키고, `DatabaseChainedTXMngConfig.java`는 `prefix="spring.datasource.dev.hikari"`로 이 값을 읽는다. PCAssist가 꺼져 있으면 HikariCP가 connection 생성 시점에 `IO Error: The Network Adapter could not establish the connection` 으로 실패한다(2026-04-29 사례).

**How to apply:**
- 로컬 IL/도메인 모듈이 부팅 단계에서 DB connection 실패하면 **코드/설정 의심 전에 PCAssist 실행 여부를 먼저 확인**한다.
- `nc -vz 10.0.0.7 1521`로 도달성 사전 검증 가능.
- `app-local.properties`의 `dev.hikari` 호스트를 공인 IP로 임의 변경하지 말 것 — PCAssist 사용이 의도된 운영 방식.
- 같은 패턴이 다른 도메인 모듈(FD/AC/SY/EL/LP/MES/RT 등)에도 적용될 가능성 높음.
