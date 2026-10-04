---
name: make
description: 핵심 명령. 기획 승인된 캠페인을 권리 장부 → 카피 → 렌더 → 린트 → 독립 검수 → 시안 승인 요청서까지 한 번에 진행한다(수정 루프 최대 2회). --week 는 plan_approved 캠페인 전체를 배치로 돌린다(카피 병렬, 렌더 순차).
argument-hint: "<campaign-id> | --week [YYYY-Www]"
---

# /make — 제작·검수 원샷

## 인자 ($ARGUMENTS)
- `<campaign-id>` 또는 `--week [YYYY-Www]`
- `--week`면 Glob으로 content/campaigns/*/status.json을 찾아 stage가 plan_approved인 캠페인을 모두 대상으로 한다. 이름이 '_'로 시작하는 폴더는 뺀다.

## 단계 (캠페인마다)
0. **사전 확인**(메인 세션 Read)
   - status.json approvals에 stage "plan"이 없으면 건너뛰고 '기획 승인 대기'.
   - stage가 draft_approved 이상이면 /fix를 안내하고 건너뛴다.
   - risk_tier가 red인데 brief ⑦의 grant(ceo_story, legal)가 status.json grants에 없으면 '대표·법무 grant 대기'로 건너뛴다.
   - campaign.json 플래그가 review/plan-snapshot.json과 다르면 멈추고 재기획을 요청한다.
1. **rights-liaison** → assets/manifest.json, assets/quotes.json, review/rights.md (F06·F12면 assets/author-kit.md). brief에 필수로 적힌 자산이 blocked이면 기록하고 계속한다(카피는 허용 자산만 쓴다).
2. **copy-director** (캠페인 경로, brief·템플릿·rights.md 경로 전달) → cardnews.json, shortform.json, review/copy-notes.md. 자체 lint 3회 뒤에도 오류가 남으면 멈추고 보고.
3. **render-producer** → out/**, review/render-report.md. 'copy-director 반환'이 있으면 copy-director → render-producer를 1회 다시 돌린다.
4. **검수**: compliance-gate(review 모드). risk_tier가 yellow·red이거나 롤아웃 2~3주차면 brand-editor(score 모드)도 따로 호출한다. 두 에이전트에게 서로의 결과를 넘기지 않는다.
5. **수정 루프(최대 2회)**: compliance가 FIX이거나 brand가 '수정 요청'이면 수정안(review/review.md, review/brand.md) 경로를 넘긴다 — 문구는 copy-director, 형식은 render-producer. 그다음 render-producer로 재렌더 → 재검수. 2회 뒤에도 FIX·'수정 요청'이거나 BLOCK이면 멈추고 사유와 필요한 사람 결정을 보고한다.
6. PASS이고 brand-editor를 돌렸으면 메인 세션이 review/approval-request.md 끝에 '브랜드 점수: 평균 x.x (review/brand.md)' 한 줄을 덧붙인다.

## 배치 실행 (--week)
- 1~2단계(권리·카피)는 캠페인별 병렬 호출.
- 3단계(렌더·조립)는 Playwright·ffmpeg 자원 때문에 한 건씩 순차.
- 4단계(검수)는 다시 병렬.
- 실패한 캠페인 때문에 나머지를 멈추지 않는다. 마지막에 성공·보류·실패를 표로 보여준다.

## 사람 게이트 G2 — 멈추고 보여준다
캠페인별: 판정·티어 / 산출물 경로(out/cardnews/contact-sheet.jpg, out/shortform/short.mp4, cover.jpg) / 캡션 첫 줄 / **사람이 직접 볼 3가지** / 남은 lint 경고 / 편집부 인용 grant 필요 여부(최종 승인 전 필수) / 별도 터미널 명령:
`npm run approve -- content/campaigns/<id> --stage draft --by "<이름>"` (approve가 lint 오류 0을 다시 확인한다)
반려·수정 의견은 `/fix <id> "<피드백>"`으로 받는다고 안내한다.
