# 시안 승인 요청서 (draft): 2026-10-14-heman-sentence — 리허설

> **리허설 경로입니다.** 아래 경로와 명령은 스크래치 리허설 폴더 기준입니다. 실제 캠페인 `content/campaigns/2026-10-14-heman-sentence`는 아직 기획 승인 대기 상태입니다. 이 폴더의 plan 기록(by `rehearsal-fixture`)은 픽스처이고 실제 승인이 아닙니다.

- 작성: compliance-gate · 2026-10-04 · 검수 라운드 1 · 판정 **PASS**(상세: review/review.md)
- 캠페인: 『헤맨 만큼 내 땅이다』 / 작가 김상현 · essay · F01 문장 처방 카드 · 발행 슬롯 2026-10-14(수) 19:00 KST
- 티어: **green** (수치 0 · 본문 인용 0 · 대표 서사 0 · 유료·협찬 0 · AI 음성 0)
- 승인자(data/approvers.json 기준): **마케팅 리드**(부재 시 대리). 그린이라 draft·publish 모두 리드 승인입니다.
  - ⚠ data/approvers.json의 `lead.name`·`deputy.name`이 비어 있습니다. `--by`에 쓸 이름과 같게 먼저 채워 주세요.
- 시안 승인 SLA: 화 14:00 (10-13)

## 산출물

| 구분 | 경로 |
|---|---|
| 카드뉴스 컨택트 시트 | out/cardnews/contact-sheet.jpg (6장, 01~06.jpg) |
| 숏폼 영상 | out/shortform/short.mp4 (17.2초, 6장면, 무음·bgm 없음) |
| 숏폼 커버 | out/shortform/cover.jpg |
| 자막 | out/shortform/captions.srt |

## 캡션 첫 줄

- 인스타 캐러셀(cardnews.caption): **올해, 생각보다 멀리 돌아왔나요?**
- 인스타 릴스(shortform.caption): **올해, 생각보다 멀리 돌아왔나요?**
- 유튜브 쇼츠 제목(shortform.title): **올해, 생각보다 멀리 돌아왔나요? #헤맨만큼내땅이다**
- 유튜브 설명 첫 줄: 멀리 돌아온 길도, 헤맨 시간도 결국 당신의 땅이 됩니다.

## 사람이 직접 볼 3가지

1. **첫 장·첫 3초 훅**
   - 카드 01장: kicker "올해, 생각보다 멀리 돌아왔나요?" + title "당신이 헤맨 길은 / 전부 **당신의 땅**이 됩니다"
   - 숏폼 hook(0~2.6초): "올해, 생각보다 / **멀리 돌아왔나요?**"
   - 확인할 것: 저장하고 싶은 문장인지, 2030 직장인·취준생의 10월 상황에 맞는지. **short.mp4는 꼭 재생해 주세요.** 검수에서는 장면 프레임 이미지만 확인했고, 최종 영상의 장면 순서와 무음 여부는 재생해서 보지 못했습니다.
2. **수치·인용 근거**
   - 수치: **없음**(claims id 사용 0).
   - 인용: 본문 인용 **없음**. quote 장(카드 03장, 숏폼 4장면)은 **책 제목** "헤맨 만큼 내 땅이다"이고, 출처를 "— 책 제목에 담긴 문장"으로 표기했습니다. catalog 제목과 글자 단위로 일치합니다.
   - book 장 카피 "성공 공식이 아니라 헤매는 나를 믿는 법"(카드 05장), "시행착오는 자산이고, 성장은 보상이다"(숏폼 5장면)는 공식 책 소개 문구(data/catalog.json)와 일치합니다. 인용부호 없이 썼습니다.
   - 확인할 것: 캡션의 "작가 김상현이 책 제목에 담은 한 문장" 표현. brief 훅 3의 '신작'은 출간 11개월이 지나 사실관계가 애매해 뺐습니다. 되살리지 않기를 권합니다.
3. **광고·AI 표기**
   - 광고 표기: **해당 없음.** 출판사 자사 계정의 자사 도서 홍보이고, 유료·협찬·도서 제공을 받은 제3자 추천인이 없습니다(sponsored false). 카드 배지·영상 시작/끝·[광고] 제목 모두 없는 것이 맞습니다.
   - 단, 유튜브 쇼츠는 **필름 출판사 채널**에 올려야 합니다. 대표 채널(@writer_kimsanghyun)이나 대표 인스타(@s_h93k)에 올리면 레드로 재기획해야 합니다.
   - AI 표기: **해당 없음.** TTS 없음(voice none), AI 이미지 없음. containsSyntheticMedia는 false가 맞습니다.

## lint 경고

- `npm run lint:copy` 결과 **오류 0 · 경고 0**. 남긴 경고가 없습니다.

## 기획 이후 변경 diff

- **없음.** format_id F01 · risk_tier green · sponsored false · author_collab null · deliverables cardnews+shortform · featured_books [] 모두 plan-snapshot과 같습니다.

## 사람이 기록해야 할 grant

- **지금은 없음.** 본문 인용·대표 서사·업계 사건 언급이 없습니다.
- 조건부: 편집부가 본문 인용 1문장을 주어 quote 장을 바꾸면, 재렌더·재검수 후 **G3 전에** 편집부가 아래를 기록해야 합니다.
  - `npm run approve -- /tmp/claude-0/-home-user-Ax-/71a3a882-f6d4-541e-a72e-1a5c2e2ab2e9/scratchpad/rehearsal/2026-10-14-heman-sentence --grant quotes --by "<편집부 이름>" --ids q1`

## 시안 승인 명령 (Claude Code 밖 별도 터미널에서 담당자가 직접 실행)

```
npm run approve -- /tmp/claude-0/-home-user-Ax-/71a3a882-f6d4-541e-a72e-1a5c2e2ab2e9/scratchpad/rehearsal/2026-10-14-heman-sentence --stage draft --by "<이름>"
```

(실제 캠페인에서는 경로를 `content/campaigns/2026-10-14-heman-sentence`로 바꿉니다. 실제 캠페인은 기획 승인부터 먼저 기록해야 합니다.)

## G3(최종 승인) 전에 챙길 것

- **author-check 재점검**: `_planning/author-check/kim-sanghyun-2026-10-04.md`는 10-10까지만 유효합니다. 발행일 10-14를 덮지 못하므로 10-07~10-13 사이에 다시 돌려야 합니다. 결과가 '높음'·'확인 불가'면 보류합니다.
- 표지 자산을 등록해 재렌더하면, 또는 카피를 바꾸면 이 시안 승인은 다시 받아야 합니다(최종 승인 때 SHA-256 잠금).

---

**PASS는 승인이 아닙니다. 승인은 담당자가 직접 기록합니다.**
