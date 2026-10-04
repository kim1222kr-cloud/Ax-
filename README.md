# 필름 콘텐츠 엔진 · Feelm Content Agents

(주)필름 / 필름출판사의 **카드뉴스(인스타 캐러셀)와 숏폼(릴스·유튜브 쇼츠)**을 기획 → 제작 → 검수 → 발행하는 **Claude Code 에이전트 팀**입니다. 사람은 3번(기획·시안·최종) 승인만 하고, 그 사이는 에이전트가 처리합니다.

| 문서 | 내용 |
|---|---|
| [docs/research/feelm-research-report.md](docs/research/feelm-research-report.md) | 회사·도서·채널·**도서 광고 콘텐츠**·카피 DNA·리스크·벤치마크·규제 리서치 |
| [docs/agent-team-design.md](docs/agent-team-design.md) | 팀 설계서: 9개 에이전트, 파이프라인, 리스크 티어, KPI, 6주 롤아웃 |
| [docs/compliance-checklist.md](docs/compliance-checklist.md) | 광고 표기·도서정가제·수치·저작권·AI 표시 검수 기준 |
| [docs/setup.md](docs/setup.md) | 설치·API·권한 강화 등 사람이 할 일 |
| [templates/formats.md](templates/formats.md) | 포맷 12종(F01~F12) |
| [brand/voice-guide.md](brand/voice-guide.md) | 필름 보이스 3트랙 |
| [CLAUDE.md](CLAUDE.md) | 에이전트가 따르는 운영 규칙 |

## 한눈에 보기

```
/weekly-plan ──▶ [G1 기획 승인] ──▶ /make ──▶ [G2 시안 승인] ──▶ /ship ──▶ [G3 최종 승인] ──▶ 발행 ──▶ /weekly-report
 trend-scout                       rights-liaison                  publish-operator                        performance-analyst
 series-planner                    copy-director                   (드라이런·요청서)                        (D+7 분석·실험 판정)
                                   render-producer
                                   compliance-gate (+brand-editor)
```

- **승인은 사람만**, Claude Code 밖 별도 터미널에서: `npm run approve -- content/campaigns/<id> --stage plan|draft|publish --by "이름"`
- 최종 승인 순간 산출물이 SHA-256으로 잠기고, 이후 바뀌면 발행이 막힙니다.
- 에이전트는 승인 기록·정책 파일·`.env`·플랫폼 API에 접근할 수 없습니다(`.claude/settings.json` + `.claude/hooks/`).

## 빠른 시작

```bash
npm install && npx playwright install chromium
npm test                                     # 회귀 테스트(검수 규칙·게이트·템플릿·렌더)

# 샘플 렌더 (헤맨 만큼 내 땅이다)
npm run render:card -- content/campaigns/_sample-heman   # → out/cardnews/*.jpg, contact-sheet.jpg
npm run build:short -- content/campaigns/_sample-heman   # → out/shortform/short.mp4
npm run lint:copy   -- content/campaigns/_sample-heman

# 이번 주 편성 (Claude Code 안에서)
/weekly-plan 2026-W42 --n 3
```

## 도구

| 스크립트 | 설명 |
|---|---|
| `npm run catalog` | 최근 신간·출간 기념일·캠페인 공백 도서 |
| `npm run new -- --book <slug> --slug <s> --date <YYYY-MM-DD> --track <t> --deliverables <d> --format <F>` | 캠페인 폴더 생성 |
| `npm run render:card -- <캠페인>` | 카드뉴스 1080×1350 PNG/JPG + 컨택트 시트 (넘침 자동 축소·차단) |
| `npm run build:short -- <캠페인> [--no-tts]` | 숏폼 1080×1920 MP4 + 커버 + SRT (TTS: ElevenLabs·Typecast·CLOVA·Supertone 선택) |
| `npm run lint:copy -- <캠페인>` | 결정론 검수: 도서정가제·광고 표기·수익 보장·미입증 수치·인용·AI/가상인물 표시·플랫폼 한도 |
| `npm run approve -- <캠페인> …` | **사람 전용** 승인·grant·재오픈 |
| `npm run check:approval -- <캠페인>` | 승인 상태·승인 이후 변경 확인 |
| `npm run publish:ig / publish:yt -- <캠페인> [--live]` | 인스타·유튜브 발행 (기본 드라이런, --live는 최종 승인 + 무변경 필요) |
| `npm run metrics` | 인스타 Insights·YouTube Analytics 수집 |

## 폴더

```
.claude/agents/      9개 에이전트 정의          .claude/skills/   7개 명령(/weekly-plan …)
.claude/hooks/       publish-gate · campaign-guard
brand/               브랜드 토큰(가안) · 보이스 가이드
data/                catalog(53종) · claims(수치 등록부) · authors · rights · approvers · policy
templates/           포맷 F01~F12 규칙 + JSON 템플릿
tools/               렌더러 · 조립기 · 린터 · 승인 · 발행 · 측정 · 테스트
content/campaigns/   캠페인 폴더 · _planning(주간 계획·리포트·실험·캘린더) · _sample-heman · _preview-*
docs/                리서치 · 설계 · 검수 · 셋업
```

## 지금 상태와 다음 단계
- ✅ 리서치, 팀 설계, 에이전트·스킬·도구·검수·승인 잠금·게이트 훅, 템플릿 12종, 회귀 테스트
- ⏳ 사람이 할 일: [docs/setup.md](docs/setup.md) — API 키·유튜브 채널·승인자·수치 확정·브랜드 가이드·권한 강화
- 브랜드 컬러·폰트는 **가안**입니다. 실제 가이드를 받으면 `brand/brand.json`만 바꾸면 모든 템플릿에 반영됩니다.
