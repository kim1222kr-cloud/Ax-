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

## 2026-10-04 · /make 리허설(compliance-gate·render-producer) 제안
- [x] lint: '책 제목' 라벨 인용은 카탈로그 제목과 일치할 때만 인정 (2026-10-04 반영, 회귀 테스트 추가)
- [x] check:approval: risk_notes 저자의 발행일 7일 이내 author-check 여부 경고 (반영)
- [x] approve: 레드 최종 승인자=approvers.json ceo 검증, --by 명단 불일치 경고 (반영)
- [x] compliance-checklist A: 대표 저서 자사 홍보 vs 대표 출연·개인 계정 기준 명문화 (반영)
- [x] brand.json essay muted #7A7066 → #6B6158 (대비 4.5:1) (반영)
- [x] build:short 가 out/shortform/contact-sheet.jpg 생성 — 렌더 프로듀서가 영상 장면을 눈으로 점검 가능 (반영)
- [ ] 숏폼 상단 헤더(브랜드·책 제목)를 상단 안전영역 아래로 내릴지 — 디자인 결정 필요(현재 장식 요소로 유지)
- [ ] 표지 없을 때 플레이스홀더를 더 작게/테두리형으로 — 실제 표지 수급 후 재평가

### 등록부(data/claims.json)
- [ ] 내부 판매자료로 company 등급 수치 확정(부수·기준일), '1위'의 서점·집계 기간 확정
- [ ] 주언규 현재 구독자 수 저자 측과 합의 후 등록(지금은 unverified)
