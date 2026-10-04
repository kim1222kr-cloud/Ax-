# 검수 결과: 2026-10-14-heman-sentence (리허설 · 라운드 1)

- 작성: compliance-gate · 2026-10-04 · 모드 review
- 경로: 스크래치 리허설 폴더다. 실제 content/campaigns가 아니다. 실제 캠페인 `content/campaigns/2026-10-14-heman-sentence`는 아직 기획 승인 대기 상태다.
- status.json: stage `plan_approved`. plan 기록의 by는 `rehearsal-fixture`이며 실제 승인이 아니다. status.json은 읽기만 했다.
- 기준 문서: docs/compliance-checklist.md(A~I). data/policy.json 주석보다 이 문서를 우선했다.
- brand-editor 결과(review/brand.md)는 읽지 않았다(독립 판정).

## 판정: **PASS**

| 항목 | 값 |
|---|---|
| 티어 | green (campaign.json·plan-snapshot.json 일치) |
| 검수 깊이 | 그린 6+3: ①②③④⑥⑪ + 브랜드 간이 3항목 |
| lint:copy | 오류 0 · 경고 0 (review/lint.json, 2026-10-04 재실행) |
| 기획 이후 변경 | 없음 |
| BLOCK 사유 | 없음 |
| FIX 수정안 | 0건 |
| 남은 경고 | 0건 |

PASS는 승인이 아니다. 시안 승인은 담당자가 별도 터미널에서 직접 기록한다(review/approval-request.md).

---

## 1. lint:copy

- 실행: `npm run lint:copy -- <리허설 경로>` → `✔ 오류 0 · 경고 0`
- review/lint.json: `errors 0, warnings 0, issues []`
- 남길 경고 원문: 없음(회사자료수치·인용승인·재테크표현·광고표기 경고 모두 0건).

## 2. 기획 이후 변경 (campaign.json vs review/plan-snapshot.json)

| 필드 | plan-snapshot | campaign.json | diff |
|---|---|---|---|
| format_id | F01 | F01 | 없음 |
| risk_tier | green | green | 없음 |
| sponsored | false | false | 없음 |
| author_collab | null | null | 없음 |
| deliverables | cardnews, shortform | cardnews, shortform | 없음 |
| featured_books | [] | [] | 없음 |
| (참고) primary_metric | saves_rate | saves_rate | 없음 |
| (참고) needs_grants | [] | — | 산출물상 grant가 필요한 요소 없음 |

→ 무사유 변경 없음. BLOCK 대상 아님.

## 3. 항목별 근거 (그린 깊이)

### ① 사연·일반인 위장, 가짜 후기, 가상인물 — 통과
- 공감 구간은 모두 2인칭 일반 서술이다. 1인칭 일반인 화자, 가상 독자 사연, 후기형 문장이 없다.
  - where: cardnews.slides[2].title·body("계획한 길보다 돌아간 길이 더 길었던 올해" / "세운 계획은 자꾸 미뤄지고…"), shortform.scenes[2]·[3].text
- 마지막 장 광고 반전 구성이 아니다. 책 정보는 5장(book)에서 자연스럽게 나오고, 1장부터 출판사 표기가 있다.
  - where: 모든 카드 상단 'FEELM'·하단 '@feelmbook'(contact-sheet.jpg 육안 확인), cardnews.slides[3] 하단 "『헤맨 만큼 내 땅이다』 작가 김상현 · 필름", 숏폼 전 장면 상단 'FEELM / 헤맨 만큼 내 땅이다'
- 가상인물·AI 인물 없음(virtual_person 장면 없음).

### ② 광고 표기 위치와 타당성 — 해당 없음(타당)
- sponsored false · author_collab null · disclosure null(cardnews.json, shortform.json). 렌더 결과에도 배지가 없다(contact-sheet.jpg 01장 확인).
- 판단 근거: 출판사(광고주)가 자사 계정(@feelmbook·필름 출판사 채널)에서 자사 도서를 직접 홍보하는 게시물이다. 제3자 추천·보증인(유료·협찬·도서 제공을 받은 인플루언서·저자 채널)이 없어 추천·보증 심사지침의 표기 대상이 아니다. 저자가 (주)필름 대표지만, 대표가 화자·출연자·게시 계정으로 등장하지 않고 카피는 출판사 시점("작가 김상현이 책 제목에 담은 한 문장을 건넵니다")이다. 그래서 이해관계가 애매하다고 보지 않았다.
- 조건: 유튜브 쇼츠가 **필름 출판사 채널**에 비공개로 올라가야 한다. 대표 채널(@writer_kimsanghyun)이나 대표 인스타(@s_h93k)에 게시하면 이 판단이 바뀌고(대표 채널 연계 = 레드), 재검수해야 한다.
- 캡션 첫 줄(cardnews.caption, shortform.caption): "올해, 생각보다 멀리 돌아왔나요?" / 유튜브 제목(shortform.title): "올해, 생각보다 멀리 돌아왔나요? #헤맨만큼내땅이다" — 표기 대상이 아니라 [광고] 없음이 맞다.

### ③ 수치 — 통과(수치 0)
- 카드·숏폼·캡션·제목·설명·태그·해시태그·captions.srt 전체에 숫자 표현이 없다(슬라이드 번호 '01 / 06' 같은 렌더러 UI만 있음).
- claims id 사용 없음. kimsanghyun-50man(company)과 heman-aladin-44(verified) 미사용(brief 6절과 일치).
- 린트가 못 잡는 표현 점검: '100권', 숫자 없는 '베스트셀러', '국민 에세이', '모두가 읽은', '50만', '신작', '스테디셀러', '화제의' — 모두 없음.
  - 참고: copy-notes 메모 1대로 brief 훅 3의 '신작'을 '책 제목에 담은'으로 바꿨다(cardnews.caption 4행). 출간 11개월·후속 엮음서(2026-05-20)가 있어 '신작'은 사실관계가 애매하므로, 바꾼 것이 맞다. 다시 '신작'으로 되돌리지 않기를 권한다.
- 큐레이션 아님(featured_books []).

### ④ 인용 — 통과(본문 인용 0)
- assets/quotes.json: quotes [] · total_chars 0. status.json grants {} → 본문 인용이 없으므로 grants.quotes가 필요 없다.
- quote 장·장면은 **책 제목** 문장이다. 글자 단위 대조 결과(마크업·줄바꿈 제거):
  - cardnews.slides[3].text "헤맨 만큼 내 땅이다" = data/catalog.json heman-mankeum.title "헤맨 만큼 내 땅이다" → 일치. 출처 표기 page "— 책 제목에 담긴 문장".
  - shortform.scenes[4].text "헤맨 만큼 내 땅이다" = catalog title → 일치. source "— 책 제목에 담긴 문장"(scene-3 프레임에서 육안 확인).
  - captions.srt 큐 4 "헤맨 만큼 내 땅이다" → 일치.
- 공식 책 소개 문구(catalog notes '카피:')는 인용부호 없이 book 장 카피로만 썼다. 글자 대조:
  - cardnews.slides[5].copy "성공 공식이 아니라 헤매는 나를 믿는 법" = catalog notes → 일치
  - shortform.scenes[5].copy "시행착오는 자산이고, 성장은 보상이다" = catalog notes → 일치(captions.srt 큐 5 동일)
- 그 밖의 문장(cover title "당신이 헤맨 길은 전부 당신의 땅이 됩니다", slides[4].body 등)은 인용부호·출처 없이 쓴 카피다. 저자 문장처럼 보이게 꾸민 곳이 없다. 대표 1인칭 문장도 없다.
- 쪽수 없음 · 200자/600자: 본문 인용 0자라 해당 없음.

### ⑥ 자산 권리 — 통과
- assets/manifest.json files [] → blocked 자산 0건. cardnews.json·shortform.json에 `image`·`cover` 필드가 없어 참조 자체가 없다.
- book 장·장면은 제목 타이포 플레이스홀더다(contact-sheet 05장, scene-4 프레임 확인). 외부 서점 표지 이미지·핫링크는 없다.
- 초상 없음(대표·직원·일반인 사진/영상 0). bgm null, 상업 음원 없음. 폰트는 brand 기본(Pretendard·Noto Serif KR, OFL)이다.

### ⑪ AI 음성·이미지 표기 — 통과(대상 아님)
- shortform.voice.provider "none", `--no-tts` 빌드(render-report 2절). AI 음성 고지 대상이 아니다. 끝 장면에 AI 고지가 없는 것이 맞다(scene-5 프레임 확인).
- cardnews.ai_label false, AI 이미지 없음(배경은 브랜드 단색·타이포).
- containsSyntheticMedia: 대상이 아니므로 **false**가 맞다(publish 단계 드라이런에서 확인).

## 4. 브랜드 간이 3항목

| 항목 | 판정 | 근거 |
|---|---|---|
| 첫 장 훅 | 통과 | 01장: 질문형 kicker "올해, 생각보다 멀리 돌아왔나요?" + 2인칭 확언형 title "당신이 헤맨 길은 / 전부 **당신의 땅**이 됩니다". 숏폼 hook 2.6초(3초 이내) 질문형. brief 5절 권장 조합과 일치 |
| 한 장 한 메시지 | 통과 | 1 확언 훅 → 2 공감 상황 → 3 책 제목 문장 → 4 2인칭 해석 → 5 책 소개 → 6 저장·공유. 숏폼도 같은 흐름 |
| 자극어·클리셰 없음 | 통과 | policy tone_warnings(충격·경악·소름·역대급·미쳤다·실화냐) 0. 과장 수식어·낚시형 표현 없음 |

## 5. 육안 점검 (Read로 연 파일)

- out/cardnews/contact-sheet.jpg, out/cardnews/01.jpg, out/shortform/cover.jpg, 중간 렌더 프레임 .work/shortform/scene-1~5.png
- **표기 위치**: 광고 배지 대상 아님(배지 없음 확인). 출판사 표기 FEELM·@feelmbook 전 장 노출. quote 장 출처 줄 "— 책 제목에 담긴 문장" 노출.
- **카드 모바일 잘림**: 01장 텍스트가 x≈75~940, y≈465~875 범위라 4:5 원본과 프로필 그리드 3:4 중앙 크롭 모두에서 잘리지 않는다. 6장 모두 넘침·축소 없음(render-report 1절과 일치).
- **숏폼 안전영역**: 핵심 텍스트는 y≈650~1420 범위로 상단 220px·하단 420px 구간 밖이다. 상단 헤더(FEELM / 책 제목, y≈118)는 UI에 가려질 수 있지만 장식 요소이고, 게시 계정명(@feelmbook)이 플랫폼 UI로 함께 보이므로 ①의 출판사 표시는 유지된다.
- **확인하지 못한 범위**: 최종 short.mp4의 인코딩 결과(실제 프레임 순서·오디오 트랙 무음 여부)는 재생해서 확인하지 못했다. 허용된 Bash가 lint:copy·check:approval뿐이다. 장면 프레임 PNG와 captions.srt(6큐, 0.000–17.150초)로 갈음했다. 시안 승인 때 사람이 직접 재생해 확인해야 한다.
- 참고(판정 영향 없음): muted(#7A7066) 소형 텍스트 대비가 약 4.2:1이다(render-report 토큰 제안 1). 출처 줄 "— 책 제목에 담긴 문장"도 이 색이다. 컴플라이언스상 읽을 수 있는 수준이라 FIX로 보지 않았다.

## 6. 깊이 밖이지만 확인한 사항 (참고)

- ⑦ 저자 리스크: kim-sanghyun은 고위험 저자가 아니다(risk_notes는 동명이인 주의 1건). `_planning/author-check/kim-sanghyun-2026-10-04.md` 판정 '낮음(신뢰도 중)'. **유효기간이 2026-10-10까지라 발행일 10-14를 덮지 못한다.** 시안 단계 BLOCK 사유는 아니지만, G3(publish) 전 10-07~10-13 사이에 재점검이 필요하다. 재점검 결과가 '높음'·'확인 불가'면 보류한다.
- ⑧ 대표 서사: 대표 개인 서사(17억·빚·파산·회생·건강·가족)·대표 얼굴·목소리·1인칭 문장·대표 채널 유도 0. grants.ceo_story 불필요.
- ⑫ 사실관계: 저자 표기가 모든 위치에서 '작가 김상현'이다(cardnews.book_title·caption·slides[5].author, shortform.description·tags·book 장면 author, 해시태그 #작가김상현). '김상현' 단독·@sanghyun_kim 태그 없음. 출간일·순위를 언급하지 않는다. 민감소재·뉴스재킹 없음.
- ⑩ 도서정가제: 할인·사은품·쿠폰·굿즈 없음 → 해당 없음.
- H 플랫폼: 캐러셀 6장(API 2~10장), 해시태그 각 5개, 유튜브 제목 28자·태그 합계 약 45자, 숏폼 17.2초 9:16. 모두 기준 안이다. 유튜브는 API 감사 전이라 비공개 고정이다.

## 7. FIX 수정안

- **없음.** 고칠 파일·슬라이드가 없다.

## 8. 사람 확인 필요 (승인 전 또는 G3 전)

1. **short.mp4 재생 확인**(시안 승인 전): 장면 6개 순서, 무음(오디오 트랙 없음 또는 무음), 자막 위치.
2. **승인자 이름 공란**: data/approvers.json의 lead.name·deputy.name·editorial.name이 비어 있다. `--by` 표기와 같은 이름을 사람이 채워야 한다(data/**는 에이전트가 고치지 않는다).
3. **author-check 재점검**(G3 전): 유효기간 10-10 만료. 10-07~10-13 사이에 다시 돌린다.
4. **유튜브 업로드 채널 확인**(G3 전): 필름 출판사 채널·비공개여야 한다. 대표 채널 게시는 레드 재기획 대상이다.
5. **재검수 조건**: 아래 중 하나라도 생기면 이 PASS는 무효이고 재검수한다.
   - 편집부 본문 인용으로 교체(→ quotes.json 등록, lint '인용승인' 경고, G3 전 grant quotes 필수)
   - 표지 자산 등록 후 재렌더
   - 캡션에 '신작'·수치·대표 서사 추가
6. **리허설 표기**: 이 검수는 리허설 경로 기준이다. 실제 캠페인은 사람이 기획 승인을 기록한 뒤 다시 제작·검수해야 한다.

---

## 정책 제안 (제안만 — policy·claims·tools는 수정하지 않음)

1. **lint title_quote 판정 강화** (tools/lint-copy.mjs 16~17행): 지금은 quote 장의 page/source에 '책 제목'이라는 글자만 있으면 title_quote로 분류해 quotes.json 대조를 건너뛴다. 그래서 본문 문장이나 지어낸 문장에 "— 책 제목에 담긴 문장"만 붙여도 린트를 통과한다. text(마크업·줄바꿈 제거)가 data/catalog.json의 해당 도서 title(또는 등록된 부제)과 일치할 때만 title_quote로 인정하고, 불일치하면 '인용불일치' 오류로 처리하기를 제안한다. 이번 캠페인은 수동 대조로 일치를 확인했다.
2. **author-check 유효기간과 발행일 비교 자동화**: risk_notes가 있는 저자는 scheduled_at 기준 7일 이내 author-check가 있는지 check:approval(또는 lint 경고)이 표시하도록 제안한다. 이번처럼 점검일과 발행일 간격이 10일이면 G3 직전에 놓치기 쉽다.
3. **approve의 --by 검증**: tools/approve.mjs는 `--by`가 비어 있는지만 본다. data/approvers.json의 해당 역할 name과 일치하는지 검사하고, name이 공란이면 경고하기를 제안한다.
4. **체크리스트 A에 '대표 저서 자사 채널 홍보' 기준 명문화**: "출판사 계정이 대표 저서를 출판사 시점으로 홍보하면 광고주 직접 광고로 추천·보증 표기 대상 아님. 대표가 화자·출연자로 등장하거나 대표 개인 계정·채널에 게시하면 표기 + grant(ceo_story) + 레드." 같은 문장을 넣어 검수자마다 판단이 갈리지 않게 하자.
