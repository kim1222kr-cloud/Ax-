# 필름 카드뉴스·숏폼 에이전트 팀 설계서

> 2026-10-04 · 설계 방법: 3개 관점(린 운영 / 품질·리스크 우선 / 성장·데이터 우선)을 독립 설계 → 2개 기준(운영 적합성 / 브랜드·리스크·효과)으로 심사 → 린 운영안을 뼈대로 품질안의 리스크 티어·권리 장부·독립 브랜드 검수, 성장안의 시리즈 실험·캘린더 연동을 이식해 합성.
> 확정 조건(운영자 결정): 채널 = 인스타(카드뉴스+릴스) + 유튜브 쇼츠 · 사람 승인 후 자동 발행 · Claude Code(이 리포) · 숏폼 = 이미지+자막+TTS 자동 조립.

## 1. 설계 철학
1. **병목은 연산이 아니라 마케터 2~3명의 주의력이다.** 사람 개입은 책임이 걸린 게이트 3개(기획·시안·최종)로 압축하고 주간 배치로 몬다. 게이트 사이는 `/make` 한 번으로 "권리 장부 → 카피 → 렌더 → 린트 → 독립 검수 → 승인 요청서"까지 사람 없이 간다. 수정 루프는 최대 2회.
2. **성장의 상한은 신뢰다.** 2024년 '바이럴' 공개 지적, 수치 입증 책임, 크리에이터 저자·대표 서사 확대 → 5가지 고정 제약(CLAUDE.md)은 실험으로도 바꾸지 않는다.
3. **리스크 티어(그린·옐로·레드)가 둘을 잇는다.** 그린은 경량 검수·리드 일괄 승인·3영업일, 레드는 주 1건·대표·법무.
4. **기획은 "포맷 선택 + 변수 채우기".** 필름 자산 기반 포맷 12종(templates/)을 돌려 쓴다.
5. **판단은 결정론 도구가 먼저**(lint, 넘침 차단, SHA-256 승인 잠금, 게이트·가드 훅, settings deny/ask). LLM은 규칙이 못 잡는 맥락(위장 여부, 저자·대표 리스크, 인용 정확성, 톤)에만.
6. 서브에이전트는 서로 호출하지 않는다. 각자 "판정·파일 경로·다음 행동"만 돌려준다. 어떤 에이전트도 승인을 기록하거나 승인 이후 산출물을 바꾸지 못한다.

**목표**: 6주 안에 건당 사람 시간 40분 이내로 주 6건 발행, 사고 0건.

## 2. 팀 구성 (9 에이전트)
| 에이전트 | 역할 | 모델 | 도구 | 쓰기 범위 |
|---|---|---|---|---|
| `trend-scout` | 소재 신호 수집, 저자 이슈 점검(author-check) | sonnet | Read, Glob, Grep, Write, WebSearch, WebFetch | _planning/<week>/signals.md, _planning/author-check/ |
| `series-planner` | 주간 편성·시리즈 기획, 캠페인 생성, 리스크 티어·실험 | opus | Read, Glob, Grep, Write, Edit, Bash(new·catalog) | brief.md, campaign.json(운영 필드), plan-snapshot, plan.md, experiments.json(추가만) |
| `rights-liaison` | 자산·인용·권리 장부, 협업 키트 | sonnet | Read, Glob, Grep, Write | assets/manifest·quotes·author-kit, review/rights.md |
| `copy-director` | 카드뉴스·숏폼 카피, 캡션·메타데이터 | opus | Read, Glob, Grep, Write, Edit, Bash(lint) | cardnews.json, shortform.json, review/copy-notes.md |
| `render-producer` | 렌더·조립, 형식 수정만 | sonnet | Read, Glob, Edit, Write, Bash(render·build) | JSON 형식 필드, review/render-report.md |
| `compliance-gate` | 맥락 검수 PASS/FIX/BLOCK, 승인 요청서, 사고·감사 | opus | Read, Glob, Grep, Write, Bash(lint·check) | review/review.md, approval-request.md, _planning/audit-* |
| `brand-editor` | 보이스 루브릭 독립 채점, 월간 보정 | sonnet | Read, Glob, Grep, Write | review/brand.md, _planning/calibration-*, registry-proposals(덧붙이기) |
| `publish-operator` | 드라이런·최종 승인 요청, 실발행(유일) | sonnet | Read, Bash(publish·check), Write | review/publish-*, _planning/publish-log.md |
| `performance-analyst` | D+7 분석, 실험 판정, playbook | sonnet | Read, Glob, Grep, Write (Bash 없음) | _planning/<week>/report.md, playbook, hooks, registry-proposals |

## 3. 파이프라인
```mermaid
flowchart LR
  A[/weekly-plan<br>trend-scout → series-planner/] --> G1{{G1 기획 승인<br>리드 · 별도 터미널}}
  G1 --> B[/make<br>rights-liaison → copy-director<br>→ render-producer → compliance-gate<br>(+brand-editor)/]
  B -->|FIX ≤2회| B
  B --> G2{{G2 시안 승인<br>lint 0 재확인·해시 기록}}
  G2 -->|반려| F[/fix/] --> B
  G2 --> C[/ship package<br>publish-operator 드라이런/]
  C --> G3{{G3 최종 승인<br>리드 · 레드는 대표<br>SHA-256 잠금}}
  G3 --> D[/ship live<br>유튜브 예약 · 인스타 슬롯 실행/]
  D --> E[/weekly-report<br>metrics → performance-analyst/]
  E --> A
```

| 단계 | 담당 | 게이트·자동 검증 | 산출물 |
|---|---|---|---|
| 0 신호·캘린더 | trend-scout, series-planner(catalog) | signals 첫 줄 '웹: 사용/미사용', 출처 필수 | _planning/<week>/signals.md, calendar.md |
| 1 편성·기획안 | series-planner | **G1 기획 승인**(리드, 레드는 grant 추가). 상한: 레드 주 1·같은 포맷 주 2·쇼츠 주 4·같은 도서 14일 2 | brief.md(9섹션), campaign.json, plan-snapshot.json, plan.md |
| 2 저자 점검 | trend-scout(author-check) | risk_notes 저자·협업은 발행 7일 이내 필수, '높음/확인 불가'면 보류 | _planning/author-check/*.md |
| 3 자산·권리 | rights-liaison + 편집부 | blocked 자산 0, 인용은 quotes.json 원문만, 최종 승인 전 grant(quotes) | assets/manifest·quotes·author-kit, review/rights.md |
| 4 카피 | copy-director | plan 승인·레드 grant 확인, 자체 lint 오류 0(최대 3회) | cardnews.json, shortform.json, copy-notes.md |
| 5 렌더 | render-producer | 넘침 0, 자동축소 ≥70%, 캐러셀 2~10장, 숏폼 15~60초, hook ≤3초 | out/**, render-report.md |
| 6 검수 | compliance-gate (+brand-editor: 옐로·레드·보정기간) | lint 0, PASS, 플래그 diff 0, 브랜드 평균 ≥3.5 | lint.json, review.md, brand.md, approval-request.md |
| 7 시안 승인 | 사람(리드) | **G2** — approve가 lint 0 재확인, 해시 기록. 반려는 /fix → feedback.md | status.json approvals[draft] |
| 8 최종 패키지 | publish-operator(package) | 채널별 드라이런, 시안 승인 이후 변경 0 | publish-dryrun.md, publish-request.md |
| 9 최종 승인 | 사람(리드 / 레드는 대표) | **G3** — 시안 이후 무변경 + 인용 grant 확인, SHA-256 잠금 | approvals[publish].hashes |
| 10 발행 | publish-operator(live) | 사용자 지시 + ask 클릭 + 게이트 훅 + 스크립트 검증 | 인스타·유튜브 게시물, publish-log.md |
| 11 성과·학습 | 메인(metrics) + performance-analyst | 리드 15분 회고 — 등록부 반영은 사람 | report.md, playbook, hooks, registry-proposals |
| 12 사고 대응 | /incident (compliance-gate, trend-scout) | 게시물 보관·예약 취소는 사람, 대응문은 대표 승인 | _planning/incidents/*.md |

## 4. 리스크 티어
- **레드**: 대표 서사·얼굴·목소리·채널 연계 / 논란 이력 저자 / 유료·협찬 / 굿즈·쿠폰·이벤트 / 업계 사건 / 죽음·자살 연상 주제 → 주 1건, 대표 publish 승인, 필요 grant
- **옐로**: company 수치, money 트랙, 크리에이터 무상 협업, 번역서 인용·저자 사진, AI 음성, UGC 리포스트 → 12항목 검수 + brand-editor
- **그린**: 그 외 → 경량 검수(6+3항목), 리드 일괄 승인

## 5. 포맷 12종 (templates/formats.md)
F01 문장 처방 카드 · F02 MBTI 책 처방(현행 @feelmbook 연재) · F03 #한페이지필사 · F04 3줄 인사이트(번역서) · F05 저자의 숫자, 당신의 체크리스트(재테크) · F06 크리에이터 저자 [광고] 콜라보 · F07 메이드인 필름 금요 비하인드(실사) · F08 카페 공명의 한 자리 · F09 다시 읽히는 책(기념일·리커버) · F10 셀프 체크 테스트 · F11 신간 D-7 카운트다운 · F12 대표의 1분(레드)

## 6. 주간 리듬
- **월** 10:00 `/weekly-plan`(에이전트 약 20분) → 16:00 리드 기획 일괄 승인(10분) → 오후~화 오전 `/make --week` 무인 배치. 그 사이 마케터는 편집부 인용·실사진·저자 동의 확보.
- **화** 14:00 시안 리뷰(건당 5분: contact-sheet, short.mp4, '사람이 직접 볼 3가지') → 필요 시 `/fix` → 시안 승인
- **수** 11:00 `/ship` → 최종 승인(레드는 대표 목 11:00). 유튜브는 승인 직후 `--publish-at` 예약, 인스타는 평일 19:00 슬롯에 `/ship <id> --now` + ask 클릭
- **금** 15:00 `/weekly-report` + 리드 15분 회고. 격주 `/series`로 다음 2주 회차 선기획
- **매월 첫 금요일** `--monthly`(브랜드 보정·사후 감사 5건), `/weekly-plan --calendar`
- **볼륨**: 2주차 3 → 4주차 5 → 6주차 6건(캐러셀 3 + 숏폼 3, 숏폼은 릴스·쇼츠 동시)
- **상한**: 레드 주 1 · 굿즈·이벤트 월 1 · 같은 포맷 주 2 · 쇼츠 주 4 · 같은 도서 14일 2 · 하루 인스타 3 / 유튜브 2

## 7. KPI
- 처리량: 6주차 주 6건, 레드 상한 준수 100%
- 사람 투입: 건당 ≤40분, 리드 승인 시간 주 ≤2.5시간
- 리드타임: 그린 3영업일, 옐로·레드 5영업일
- 자동화 효율: /make 2회 루프 내 PASS ≥85%, 시안 1차 승인 ≥70%, 건당 /fix ≤1.5회
- 신뢰: 광고·AI 표기 누락, 미등록 수치, 도서정가제 위반, 위장 포맷 **0건** · 발행 후 정정·삭제 분기 0건 · 월 감사 미탐 0건 · '광고/바이럴' 지적 0건(발견 시 24시간 내 /incident)
- 거버넌스: 에이전트의 승인 기록·보호 파일 수정·무단 --live 시도 0건(훅 차단 로그)
- 브랜드: brand-editor 평균 ≥4.0, 월간 블라인드 보정 일치율 ≥80%
- 인스타: 캐러셀 D+7 저장률·공유율 중앙값 기준선(2~3주차) 대비 8주차 +30%, 팔로워 월 +3%(현재 약 2.68만)
- 숏폼: 릴스 시청 비율·쇼츠 averageViewPercentage 기준선 대비 개선, 하위 20% 포맷 교체. 유튜브는 감사 통과·공개 전환 후부터 집계
- 학습: 6주 내 playbook 검증 규칙 ≥3개, 다음 주 편성 중 리포트 제안 반영 ≥40%

## 8. 롤아웃 (6주)
| 주차 | 내용 |
|---|---|
| 1주차 (10/5~9) | 기반·안전장치, 실발행 없음. 승인자·claims·채널 결정, .env·API 감사 신청, settings 강화(docs/setup.md §4), _sample 리허설(/make → /ship 드라이런), 훅 차단 시험 |
| 2주차 (10/12~16) | 그린 파일럿 3건(F01·F02 1회차·F04 숏폼), 3단계 승인 실운영·사람 시간 측정, brand-editor 전 건 보정. 유튜브는 감사 전 비공개 업로드로 파이프라인만 검증 |
| 3주차 (10/19~23) | 숏폼 확대, F03·F07 추가, F09(그럼에도 9주년·원의독백 2주년), TTS 공급사 결정, 첫 /weekly-report로 기준선 |
| 4주차 (10/26~30) | 옐로 시작: F05(부토리·자본주의학교), F09(프롬프트 텔링 1주년), F06 무상 1건(로사장), F02 회차 간 훅 실험 등록. 정책 보강(registry-proposals 반영) |
| 5주차 (11/2~6) | 레드 파일럿 1건(F12 또는 헤맨 1주년 선기획, grant ceo_story·대표 승인 경로 검증), /incident 모의훈련(30분 내 완료), metrics 일일 수집 자동화 |
| 6주차 (11/9~13) | KPI 리뷰·하위 포맷 교체, 첫 --monthly, 린치핀 2주년, 볼륨·슬롯 확정. (선택) Phase 2 사람 소유 cron 발행 큐. publish ask→allow 전환은 훅 강화 완료 + 무사고 4주 + 리드 결정 후에만 |

## 9. 리스크와 대응
| 리스크 | 대응 |
|---|---|
| 승인·게이트 우회 | 강화된 publish-gate(approve·status.json·.env·인라인 코드·보호 경로 쓰기·잠금 후 재렌더 차단) + 회귀 테스트 20종, campaign-guard(Edit/Write) 등록, disableBypassPermissionsMode |
| campaign.json 플래그 위변조 | 승인·grant는 status.json(사람 전용)으로 이동, 린트는 status.json grants만 신뢰, 가드가 approvals 키·sponsored 해제·기획 후 플래그 변경 차단 |
| 등록부 오염(claims) | data/** Edit/Write deny(setup §4), 셸 쓰기는 게이트가 차단 |
| 단계 사이 변경 미감지 | plan 지문 기록, 최종 승인 시 시안 이후 변경 거부, check:approval |
| 2024 논란 재점화 | 3단계 위장 금지, 큐레이션 첫 줄 자사 표기, 애매하면 광고 표기, 평판 KPI·/incident |
| 저자 리스크 | 발행 7일 이내 author-check, 확인 불가면 BLOCK, 같은 저자 예약분 일괄 보류 |
| 대표 서사·계정 | grant(ceo_story) + 대표 publish 승인, 대표 1인칭은 원문만, 대표 계정 자동 발행 금지 |
| 저작권·권리 | manifest·quotes·rights 장부, 미확인 자산 blocked, bgm 기본 null, 1분 넘는 쇼츠 음원 주의 |
| 린트 사각지대 | compliance-gate ③⑫ 수동 확인 + policy 개정 제안(registry-proposals) |
| 유튜브 양산형 판정 | 포맷·쇼츠 상한, 실사 포맷(F07·F12) 비중, 회차마다 훅·이미지 변주, 형제 A/B 월 1쌍 |
| 승인 병목 | 일괄 승인·고정 슬롯·대리 승인자(approvers.json)·요청서 1장 규격 |
| 인스타 예약 불가 | Phase 1은 슬롯 시각 1회 클릭, Phase 2는 사람 소유 cron(scheduled_at 잠금) |
| 유튜브 미감사·채널 미확정 | 1주차 감사 신청·채널 결정, 쇼츠 CTA 중립 핸들, 감사 전 KPI 제외 |
| 소표본 착시 | 사전 등록, D+7 고정, 20% 임계, arm당 2건, 재현된 것만 playbook |
| 웹 접근 제한 | inbox·metrics·catalog 내부 모드, 출처 없는 신호는 카피 소재 금지 |
| TTS·BGM 라이선스 | 계약 확인 전 무TTS·bgm null, AI 음성은 캡션·containsSyntheticMedia 표시 |

## 10. 운영자에게 필요한 것
1. 승인자 명단과 SLA(`data/approvers.json`), "승인은 별도 터미널" 원칙 합의
2. 내부 판매·순위 자료로 `data/claims.json` 확정
3. 회사 유튜브 채널 결정(@feelm_contents 재가동 여부) + 실제 브랜드 가이드(로고·HEX·서체)
4. `.env` 값(IG·미디어 호스팅·YT OAuth), YouTube API 감사 신청
5. 편집부 인용 원문·쪽수 제공 방식과 grant(quotes) 담당자, 출판계약 홍보 이용 조항
6. 번역서 원권리사 조건(`data/rights.json`)
7. MBTI 시리즈 직원 선정 기록
8. 크리에이터 저자별 계약 조건(유료·무상, 클립·사진, 구독자 수 표기, 광고 표기 책임 주체)
9. 대표 개인 서사 사용 범위·코멘트 원문·사진 동의·승인 슬롯
10. 실사 자산과 직원 초상 동의서(제작 현장, 카페 공명, 굿즈)
11. TTS·BGM 라이선스, 굿즈·쿠폰 조건(15% 검토)
12. 과거 인스타 인사이트(최근 90일), 매주 account.json 입력
13. 웹 대체 자료(매주 inbox: 서점 베스트·경쟁사 링크·출간 일정)
14. 『상처 없는 밤은 없다』(2016) 발행 주체 확인('필름 10주년' 사용 판단)
15. 2024년 지적에 대한 내부 입장, 외부 바이럴 대행 계약 유무
16. settings·훅 강화(docs/setup.md §4) 검토·적용
