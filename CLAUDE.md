# (주)필름 콘텐츠 엔진 — 카드뉴스·숏폼 에이전트 팀

이 리포는 필름출판사((주)필름, 인스타그램 @feelmbook)의 도서 홍보용 **카드뉴스(인스타 캐러셀)·숏폼(릴스·유튜브 쇼츠)**을 기획 → 제작 → 검수 → 발행하는 Claude Code 에이전트 팀이다. 회사·도서·채널·리스크 배경은 `docs/research/feelm-research-report.md`, 팀 설계는 `docs/agent-team-design.md`.

## 고정 제약 5가지 (실험으로도 바꾸지 않는다)
1. **사연·일반인 위장 금지** — 고민 상담·감동 사연처럼 시작해 마지막에 책 광고로 뒤집는 구성, 일반인·가상 독자 화자, 가짜 후기, 바이럴 계정 금지. 출판사 콘텐츠임을 처음부터 드러낸다.
2. **광고 표기는 첫 줄에** — 경제적 이해관계(유료·협찬·도서 제공)가 있으면 캡션·설명 첫 줄 30자 안 '[광고]', 카드 1장 배지, 영상 시작·끝, 유튜브 제목 맨 앞. 애매하면 표기한다.
3. **수치는 `data/claims.json` 등록분만** — usage_note·시점 표기 준수, unverified 금지, 큐레이션(여러 권)에는 수치 금지.
4. **인용은 편집부 승인 원문만** — `assets/quotes.json` 과 글자 그대로 일치. 지어낸 문장을 인용처럼 쓰지 않는다.
5. **대표 개인 서사는 대표 승인 후에만** — 17억 빚·건강·가족 등은 grant(ceo_story) 기록이 있어야 한다.

## 승인은 사람만 한다
- 3단계 게이트: **기획(plan) → 시안(draft) → 최종(publish)**. 담당자가 **Claude Code 밖 별도 터미널**에서 `npm run approve -- content/campaigns/<id> --stage <단계> --by "<이름>"` 실행.
- grant: `--grant quotes|ceo_story|legal --by …` (편집부·대표·법무), 재작업: `--reopen --by … --note …`
- 최종 승인 순간 campaign.json·cardnews.json·shortform.json·out/** 가 SHA-256으로 잠긴다. 이후 바뀌면 발행이 막힌다.
- 에이전트는 approve 를 실행·출력하지 않고, status.json·data/**·brand/**·templates/**·tools/**·.claude/** 를 수정하지 않으며, .env 를 읽지 않고, 플랫폼 API를 직접 호출하지 않는다. 권한·훅 거부는 **우회하지 말고 그대로 보고**한다(`.claude/hooks/publish-gate.mjs`가 Bash를 검사한다).

## 팀과 명령
| 명령 | 하는 일 | 사람 게이트 |
|---|---|---|
| `/weekly-plan` | trend-scout → series-planner: 신호·편성·기획안 | G1 기획 승인 |
| `/series <F> …` | 시리즈 회차 일괄 기획 + 회차 간 실험 | G1 |
| `/make <id>` · `/make --week` | rights-liaison → copy-director → render-producer → compliance-gate(+brand-editor) | G2 시안 승인 |
| `/fix <id> "<피드백>"` | 반려 반영·재렌더·재검수 | G2 재승인 |
| `/ship <id>` | publish-operator: 드라이런·최종 승인 요청 → 발행 | G3 최종 승인 + 발행 지시 |
| `/weekly-report` | metrics → performance-analyst(+월간 보정·감사) | 리드 15분 회고 |
| `/incident <id> "<지적>"` | 사고 대응 초안 | 대표 승인 |

서브에이전트끼리는 서로 호출하지 않는다 — 스킬(메인 세션)이 순서대로 부른다.

## 필름 보이스 (상세: `brand/voice-guide.md`)
- **essay** 감성 에세이: 2인칭 존댓말 위로·확언, 문장형 제목(질문형 / "당신은 결국 ~사람" 확언형)
- **money** 재테크·경제경영: 담백한 정보·실행, 체크리스트, "저자의 개인 사례이며 수익을 보장하지 않습니다" 필수
- **insight** 해외 번역서: 공식 경력 사실 기반 저자 권위 + 3줄 인사이트
- 표기: "작가 김상현"(동명이인 국대떡볶이 김상현과 구분), "창업오빠 강호동", 로사장=김다솔 1인. 해시태그 5개 이하.

## 도구 (npm 스크립트)
- `npm run catalog -- --json --days 120` 신간·기념일·캠페인 공백
- `npm run new -- --book <slug> --slug <s> --date <YYYY-MM-DD> --track <t> --deliverables <d> --format <F>`
- `npm run render:card -- content/campaigns/<id>` → out/cardnews/NN.jpg·png, contact-sheet.jpg (슬라이드: cover/quote/text/list/stat/book/cta, 2~10장)
- `npm run build:short -- content/campaigns/<id> [--no-tts]` → out/shortform/short.mp4·cover.jpg·captions.srt (장면: hook/caption/quote/book/cta)
- `npm run lint:copy -- content/campaigns/<id>` 결정론 검수 → review/lint.json
- `npm run check:approval -- content/campaigns/<id>` 승인 상태(읽기 전용)
- `npm run publish:ig -- <캠페인> --type carousel|reels [--live]`, `npm run publish:yt -- <캠페인> [--live] [--publish-at …]` (기본 드라이런)
- `npm run metrics` 성과 수집 · `npm test` 회귀 테스트

## 파일 지도
- `content/campaigns/<YYYY-MM-DD-slug>/` campaign.json · brief.md · cardnews.json · shortform.json · assets/(manifest·quotes·author-kit) · review/(plan-snapshot·copy-notes·rights·render-report·lint·review·brand·approval-request·publish-dryrun·publish-request·feedback) · status.json(사람·스크립트 전용) · out/
- `content/campaigns/_planning/` 주간 signals·plan·report, calendar, playbook, hooks, experiments, publish-log, registry-proposals, inbox, series, author-check, incidents
- `templates/` 포맷 F01~F12 규칙(formats.md)과 JSON 템플릿 · `brand/` 토큰·보이스 · `data/` catalog·claims·authors·rights·approvers·policy · `docs/` 리서치·설계·검수 체크리스트·셋업

## 규정 요약 (상세: `docs/compliance-checklist.md`)
도서정가제(할인 10%·합산 15%, 재정가 12개월) · 공정위 추천·보증 심사지침(2024-12 제목/첫 부분, 2026-06 AI 가상인물 표시) · 인스타 API 캐러셀 10장·해시태그 5개 · 유튜브 감사 전 업로드 비공개 고정 · AI 음성/이미지는 사내 원칙상 표시(AI 기본법상 필름은 '이용자').
