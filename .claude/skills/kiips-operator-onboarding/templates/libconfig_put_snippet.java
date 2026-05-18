// =============================================================
// LibConfiguration.java put() 라인 스니펫
// 적용 위치: KiiPS-UTILS/src/main/java/com/kiips/util/LibConfiguration.java
//
// 두 곳에 삽입:
//   1) LIBList (PRD)         - line ~82-200 구역
//   2) LIB_STG_List (STG)    - line ~615-740 구역
//
// 치환 변수:
//   {CODE}        : 운용사 코드 (대문자, 예: HANWHA)
//   {sign_class}  : SCSS sign 클래스 접미사 (예: HANWHA 또는 bg / bg2 등 재사용)
//   {logo_file}   : 로고 파일명 (예: logo_hanwha)
//   {LIB_NAME}    : DB LIB명 (PRD: LIB_HANWHA, STG: LIB_HANWHA_DEV, DEMO: LIB_HANWHA_DEMO)
//   {signup_jsp}  : signup 또는 signup_{code_lower} (표준형이면 signup)
//   {korean_name} : 한글 회사명 주석 (예: 한화벤처스(주))
//
// 들여쓰기 주의: 기존 라인의 들여쓰기/탭 패턴 그대로 복제 (24 spaces 또는 6 tabs 혼용 가능)
// =============================================================

// PRD 라인 예시:
                        put("{CODE}", 	            "sign-{sign_class}|{logo_file}|{LIB_NAME}|{signup_jsp}");                       //{korean_name}

// STG 라인 예시 ({LIB_NAME}이 _DEV 접미사):
                        put("{CODE}", 	            "sign-{sign_class}|{logo_file}|{LIB_NAME}_DEV|{signup_jsp}");                       //{korean_name}
