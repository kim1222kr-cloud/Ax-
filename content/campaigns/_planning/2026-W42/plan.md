# 2026-W42 편성안 (10-12 월 ~ 10-16 금) · 롤아웃 2주차 그린 파일럿 3건

> 작성 2026-10-04(일) · series-planner · 상태: **G1 기획 승인 대기**(에이전트는 승인하지 않는다)
> 입력: signals.md(2026-W42) · playbook.md(출발 가설만 있음) · calendar.md · series/F02.md · `npm run catalog -- --json --days 120`
> 입력 공백: 지난주 report.md 없음(첫 주) · data/metrics 없음(저장률·공유율 상·하위 3건 산출 불가) · account.json 없음 · inbox 0건 · data/approvers.json의 리드·대리·편집부·법무 이름 공란 · assets/quotes.json 0건 · data/rights.json 0건

## 1. 캘린더

| 요일 | 슬롯 | 캠페인 ID | 포맷 | 트랙 | 티어 | 채널 | primary_metric | 승인자 |
|---|---|---|---|---|---|---|---|---|
| 수 10-14 | 19:00 KST | 2026-10-14-heman-sentence | F01 문장 처방 카드 (캐러셀 6장 + 숏폼 15~20초) | essay | 그린 | 인스타 캐러셀·릴스 / 유튜브 쇼츠(비공개 업로드) | saves_rate | plan·draft·publish 리드 |
| 목 10-15 | 19:00 KST | 2026-10-15-mbti-infp | F02 MBTI 책 처방 1회차 INFP (캐러셀 7장) | essay | 그린 | 인스타 캐러셀 | shares_rate | plan·draft·publish 리드 |
| 금 10-16 | 19:00 KST | 2026-10-16-streetwise-3lines | F04 3줄 인사이트, 숏폼만 (20~30초) | insight | 그린 | 인스타 릴스 / 유튜브 쇼츠(비공개 업로드) | reels_watch_ratio | plan·draft·publish 리드 |

- 승인자 '리드'는 마케팅 리드이고, 부재 시 data/approvers.json의 대리가 승인한다. 두 이름 모두 **현재 공란**이다.
- 유튜브는 API 감사 전이라 세 건 모두 **비공개 업로드로 파이프라인만 검증**한다. 성과 집계는 인스타만 한다.
- 숏폼 두 건은 모두 무TTS(`voice: none`), `bgm: null`이다. TTS 공급사는 3주차에 결정한다.

### 편성 판단
- **F01 → 『헤맨 만큼 내 땅이다』**: 대표 저자 책 중 제목 문장이 바로 처방 문장이 되는 책이다(quotes.json 0건 → "— 책 제목에 담긴 문장"으로 대체). 『당신은 결국 무엇이든 해내는 사람』은 W43 수능 D-30(10-20, 72시간 창) F01용으로 남겼다. 『그럼에도 불구하고』는 W43 9주년 F09용이다. 같은 책 14일 2회 상한과 연속 노출을 피하려는 배치다. 수치를 쓰지 않고 대표 서사를 제외해 그린을 유지한다.
- **F02 → INFP 1회차**: 기존 연재의 ISTJ×『불안한 날에 니체를 읽는다』와 겹치지 않는 유형을 골랐다. 직원 선정 기록이 없어 '필름이 펴낸 책 중 INFP에게'로 쓰고 수치는 넣지 않는다. 대표 도서 『잘 살고 싶은 마음이 어렵게 느껴질 때』, featured 『네 새벽은 언제쯤 괜찮아지려나』·『때가 되면 너의 정원에 꽃이 필 거야』. 셋 다 캠페인 이력이 없고, W43 후보 도서와 겹치지 않는다.
- **F04 → 『생존 지능』 숏폼**: 번역서 신간 4종 중 저자 권위(전 골드만삭스 CEO, 공식 경력 사실)가 가장 분명하다. 『오늘 일, 재밌었어』는 출판사 재확인이 필요해 제외했고, 『린치핀』은 2주년(11-13)용으로 남겼다. rights.json 항목이 없어 직접 인용 0, 저자 사진 없음, 요약형이다. 금요일 슬롯이 CTA "저장해두고 월요일에 다시"와 맞물린다.

## 2. 상한·규칙 점검

| 항목 | 기준 | W42 | 판정 |
|---|---|---|---|
| 캠페인 수 | --n 3 | 3 | OK |
| 레드 | 주 1건 이하 | 0 | OK |
| 같은 포맷 | 주 2회 이하 | F01·F02·F04 각 1 | OK |
| 쇼츠 | 주 4개 이하 | 2 (F01, F04) | OK |
| 같은 도서 | 14일 안 2회 이하 | 모든 도서 1회 (heman-mankeum, jal-salgo-sipeun, ne-saebyeok, jeongwon-kkot, streetwise) | OK |
| 주말 슬롯 | 0 | 0 | OK |
| 하루 인스타 3 / 유튜브 2 | 상한 | 10-14: 인스타 2·유튜브 1 / 10-15: 1·0 / 10-16: 1·1 | OK |
| 굿즈·이벤트 | 월 1건 | 0 | OK |
| 트랙별 1회 이상 | essay·money·insight | essay 2 · insight 1 · **money 0** | 예외(아래) |

**money 트랙 그린 후보 없음**: 리스크 기준상 'money 트랙'은 그 자체로 옐로다. 따라서 그린 3건 파일럿 주간에는 money 캠페인을 넣을 수 없다. 최근 120일 money 신간 5종(nurse-27eok, agent-workflow, bu-chulbalseon, wolbaedang-eunte, leverage-circle)은 모두 이력이 0이지만 F05 옐로다. 롤아웃 설계(docs/agent-team-design.md §8)상 옐로는 4주차(W44)에 시작하므로, W44에 F05(부토리·자본주의학교)로 money 트랙을 시작한다. 큐레이션에 money 도서를 섞어 essay 트랙으로 우회하는 편성은 하지 않았다.

## 3. 대표·법무 grant가 필요한 건
- **없음**(3건 모두 그린, needs_grants = []).
- 조건부 1건: 2026-10-14-heman-sentence를 편집부 본문 인용으로 바꾸면 G3 전에 편집부 grant(quotes)가 필요하다. 기본값인 책 제목 문장으로 가면 필요 없다. 해당 시 편집부가 별도 터미널에서 실행할 명령:
  `npm run approve -- content/campaigns/2026-10-14-heman-sentence --grant quotes --by "<편집부 이름>" --ids <quotes.json id>`

## 4. 자료 요청 (필수 5 · 권장/선택 4)

| # | 자료 | 대상 캠페인 | 넣을 곳 | 기한 | 구분 |
|---|---|---|---|---|---|
| 1 | 마케팅 리드·대리(+편집부) 이름 | 전체 | data/approvers.json (사람이 직접) | G1 전 | 필수 |
| 2 | 기존 @feelmbook MBTI 연재에서 다룬 유형·도서·회차 번호 (INFP 중복 여부) | mbti-infp | 리드 회신 | G1 전 | 필수 |
| 3 | 세 권의 판매 중 여부(재고·절판)와 『네 새벽은…』 노출 판본(원판/리커버) | mbti-infp | 영업 회신 | G1 전 | 필수 |
| 4 | 세 권의 출판사 공식 책 소개 문구 (요약 근거용) | mbti-infp | assets/book-source.* | 10-08(목) | 필수 |
| 5 | 『생존 지능』 공식 책 소개·목차·저자 소개 (3원칙 요약 근거용) | streetwise-3lines | assets/book-source.* | 10-08(목) | 필수 |
| 6 | 표지 이미지: 헤맨 만큼 내 땅이다 / 잘 살고 싶은… / 네 새벽은… / 때가 되면… / 생존 지능 | 전체 | 각 캠페인 assets/cover*.* | 10-08(목) | 권장(없으면 타이포 플레이스홀더) |
| 7 | 편집부 승인 본문 인용 1문장과 쪽수 | heman-sentence | assets/quotes-source.* | 10-08(목) | 선택(없으면 제목 문장) |
| 8 | 『생존 지능』 원권리사 조건 | 다음 F04부터 | data/rights.json (사람이 직접) | — | 선택 |
| 9 | MBTI 직원 선정 기록(유형별 도서·선정자·'100권' 근거) | F02 2회차부터 | assets/mbti-selection.* | — | 선택 |

- 10-09(금)은 한글날 휴일이다. 자료 기한을 10-08(목)로 잡았다.
- 실사진·초상 동의, 저자 동의: 이번 주 해당 없음(대표 사진·출연, 저자 협업 없음).
- 도서 등록 요청: 없음(세 캠페인의 다섯 권 모두 catalog에 있음).

## 5. 일정 (approvers.json SLA 기준)
- **G1 기획 승인**: 10-08(목) 16:00까지 권장(휴일 전에 /make를 돌리고 자료를 받을 여유 확보). 늦어도 10-12(월) 16:00 SLA.
- `/make --week`: G1 직후(rights-liaison → copy-director → render-producer → compliance-gate + brand-editor 전 건 보정)
- **G2 시안 승인**: 10-13(화) 14:00
- **G3 최종 승인**: 10-14(수) 11:00, 3건 일괄
- 발행: 인스타는 각 슬롯 19:00에 `/ship <id> --now` + ask 클릭. 유튜브는 비공개 업로드.
- 2주차 측정: 건당 사람 투입 시간(목표 ≤40분), 리드 승인 시간을 기록한다(design §7).

## 6. 기획 승인 명령 (사람이 Claude Code 밖 별도 터미널에서 실행)

```bash
# 에이전트는 이 명령을 실행하거나 대행하지 않는다. 리드(부재 시 대리)가 Claude Code 밖의 별도 터미널에서 직접 실행한다.
# --by 는 data/approvers.json 의 lead.name 과 같은 표기로 쓴다(현재 공란이라 먼저 채워야 한다).
npm run approve -- content/campaigns/2026-10-14-heman-sentence --stage plan --by "<리드 이름>"
npm run approve -- content/campaigns/2026-10-15-mbti-infp --stage plan --by "<리드 이름>"
npm run approve -- content/campaigns/2026-10-16-streetwise-3lines --stage plan --by "<리드 이름>"

# 확인(읽기 전용)
npm run check:approval -- content/campaigns/2026-10-14-heman-sentence
npm run check:approval -- content/campaigns/2026-10-15-mbti-infp
npm run check:approval -- content/campaigns/2026-10-16-streetwise-3lines
```

승인 뒤에는 `/make --week`로 이어간다. 기획 승인 이후 format_id·risk_tier·sponsored·author_collab·deliverables·featured_books·book과 review/plan-snapshot.json은 잠긴다. 바꾸려면 재기획해야 한다.

### 리드가 승인 전에 볼 3가지 (약 10분)
1. F01 도서: 『헤맨 만큼 내 땅이다』(이번 주) + 『당신은 결국…』(W43 수능 D-30)으로 나눈 배치에 동의하는가.
2. F02: INFP와 세 권의 짝, 회차 표기 "1회차"(기존 연재 번호와 충돌하지 않는지), 목요일 슬롯.
3. F04: 숏폼만으로 갈지, 캐러셀도 같이 만들지(deliverables는 승인 후 잠김).

## 7. 실험
- **이번 주 등록 없음**(experiments.json 변경 없음, 3건 모두 experiment: null).
- 사유: 2주차는 기준선 설정 주간이다. experiments.json은 추가만 할 수 있어서 arm의 campaigns 목록을 나중에 늘릴 수 없다. 회차 2건 이상이 확정되지 않은 상태에서 등록하면 arm당 2건 기준을 채울 수 없다.
- 기준선 기록: F01 cover는 질문형 kicker + 확언형 title, F02 1회차 subtitle은 질문형, F04 hook은 질문형 + 권위형 sub. performance-analyst가 hooks.md에 기록한다.
- 다음 등록 예정(W44 `/series F02`): F02 회차 간 훅 교대. 초안은 variable "cover_hook_type", arms question/affirm, primary_metric shares_rate, threshold 0.2, min_posts_per_arm 2, window "D+7". 2~5회차를 교대 배정하고, 1회차는 사후에 arm으로 넣지 않는다(사전 등록 원칙).
- 형제 A/B(-a/-b): 이번 주 없음(월 1쌍 이하).

## 8. 다음 주(W43, 10-19~10-23) 편성 메모 — 참고용, 확정 아님
- **10-20(화) 수능 D-30**: F01 『당신은 결국 무엇이든 해내는 사람』(그린, 72시간 창 10-19~10-21). 성적·합격을 약속하지 않고, 불안을 자극하지 않으며, 판매 수치(10만 부·1위)를 쓰지 않는다. 신속 대응 창이라 **W43 기획 승인을 10-14 전후에 받아야** 맞출 수 있다.
- **10-23(금) F09 두 건이 겹친다**: 『그럼에도 불구하고』 9주년(캐러셀+쇼츠, 대표 서사 금지)과 『원의독백』 2주년. 하나는 10-22(목)로 하루 떼거나 포맷을 나눈다. 원의독백은 F06 협업이 되면 무상 옐로/유료 레드, 발행 7일 이내 author-check.
- **F03 필사**: quotes.json이 0건이라 편집부 grant(quotes)가 먼저 필요하다. 니체 엮음서의 회복 서사는 ceo_story grant 없이는 금지다.
- **F07 비하인드**: 직원 초상 동의서가 있을 때만 하고, 생성형 AI 이미지는 금지다.
- W44 『프롬프트 텔링』: 출간일(10.27 vs 11월)을 확정하기 전에는 '1주년' 표기를 보류한다.
- 주언규(hoksi-don-yaegi): 리스크 때문에 계속 제외한다. 착수하려면 author-check가 필수다.
