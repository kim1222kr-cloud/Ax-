# 등록부·정책·보이스 개정 제안

> 에이전트는 여기에 **덧붙이기만** 한다. data/claims.json · data/policy.json · brand/voice-guide.md · .claude/settings.json 반영은 사람(리드)이 검토 후 직접 한다. 처리한 항목은 체크하고 날짜를 적는다.

## 2026-10-04 · 팀 구축 시점 제안 (설계 심사 결과)

### 정책(data/policy.json) — 에이전트·도구가 수정할 수 없도록 잠겨 있어 사람이 반영
- [ ] `platform.carousel_max`: 20 → **10** (Instagram Content Publishing API children 상한 10. 린트·발행 스크립트는 이미 10으로 강제 중)
- [ ] `ai._law` 주석 정정: "AI 기본법 제31조는 AI사업자 의무 — 자사 채널에 올리는 출판사는 원칙적으로 '이용자'(과기정통부 해설). 사내 투명성 원칙 + YouTube·Meta 플랫폼 정책으로 표시" (docs/compliance-checklist.md G절)
- [ ] `claims.patterns` 추가: `"\\d+\\s*권"`, `"(?<!\\d\\s*)베스트셀러"`(숫자 없는 베스트셀러), `"국민\\s*에세이"`, `"모두가\\s*읽은"`
- [ ] `sensitive` 추가: `{ "pattern": "회생|투병", "approval_key": "ceo_story" }`, `{ "pattern": "자살|자해|극단적\\s*선택", "approval_key": "legal", "reason": "자살 연상 표현 — 109 안내 필요" }`
- [ ] `tone_warnings`에 '광고 아님', '내돈내산' 추가(위장 표현)

### 권한(.claude/settings.json) — docs/setup.md 의 스니펫 참고
- [ ] Edit/Write deny 확장: `data/**`, `brand/**`, `templates/**`, `tools/**`, `.claude/**` (에이전트·스킬 파일 작성이 끝난 뒤 적용)
- [ ] `campaign-guard.mjs` 를 PreToolUse `Edit|Write|MultiEdit` 훅으로 등록
- [ ] allow 추가: `Bash(npm run catalog:*)`, `Bash(npm run check:approval:*)`
- [ ] `permissions.disableBypassPermissionsMode: "disable"`
- [ ] deny `Read(.env.*)` → `Read(.env.local)`, `Read(.env.production)` 로 좁히기(.env.example 은 config/env.example 로 이동해 두었음)

### 등록부(data/claims.json)
- [ ] 내부 판매자료로 company 등급 수치 확정(부수·기준일), '1위'의 서점·집계 기간 확정
- [ ] 주언규 현재 구독자 수 저자 측과 합의 후 등록(지금은 unverified)
