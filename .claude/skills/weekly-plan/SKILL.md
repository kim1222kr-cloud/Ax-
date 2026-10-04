---
name: weekly-plan
description: 월요일 주간 편성. 소재 신호 수집 → 출간 캘린더·성과 반영 → 캠페인 폴더·기획안·리스크 티어 생성까지 진행하고, 리드의 기획 일괄 승인 직전에 멈춘다. --signals-only 로 수시 트렌드 점검, --calendar 로 월간 8주 캘린더 갱신.
argument-hint: "[YYYY-Www] [--n 3~6] [--signals-only] [--calendar]"
---

# /weekly-plan — 주간 편성·기획안

## 인자 ($ARGUMENTS)
- `YYYY-Www`: 대상 주. 기본값은 이번 주 수요일부터 다음 주 화요일까지의 슬롯.
- `--n`: 캠페인 수. 롤아웃 기본값은 2주차 3 → 4주차 5 → 6주차 6.
- `--signals-only`: 신호와 72시간 신속 대응 후보만 뽑고 끝낸다.
- `--calendar`: 매월 첫 주에 content/campaigns/_planning/calendar.md(8주 롤링 출간·기념일 캘린더)도 갱신한다.

## 원칙
서브에이전트끼리는 서로를 호출하지 않는다. 메인 세션이 아래 순서대로 부르고, 각 결과 텍스트에서 파일 경로를 받아 다음 단계로 넘긴다.

## 단계
1. **준비**: content/campaigns/_planning/<week>/ 폴더를 만들고(없으면), 지난주 report.md, 최신 data/metrics/*.json, _planning/<week>/account.json(사람 입력)이 있는지 확인한다. 없는 것은 결과 첫머리에 '입력 공백'으로 적는다.
2. **trend-scout**(모드 signals, 주차 전달)를 호출한다. 반환에서 웹 사용 여부를 확인한다. 웹을 못 썼고 _planning/inbox/도 비어 있으면 사용자에게 '서점 주간 베스트 캡처와 경쟁사 링크 3개'를 inbox에 넣어 달라고 요청하되, 내부 신호만으로 계속 진행한다.
3. `--signals-only`면 여기서 끝낸다. signals.md의 신속 대응 후보 3개(포맷, 훅 초안, 도서, 예상 티어, 승인자)를 보여준다. 채택하면 /weekly-plan으로 정식 기획을 다시 돌린다(기획 승인은 생략할 수 없다).
4. **series-planner**를 호출한다. 넘길 것: 주차, --n, signals.md 경로, 지난주 report.md, playbook.md, `--calendar` 여부. 플래너는 `npm run catalog -- --json --days 120`과 `npm run new -- --book … --slug … --date … --track … --deliverables … --format …`를 실행하고 brief.md(9섹션), campaign.json 운영 필드, review/plan-snapshot.json, plan.md, experiments.json 등록을 만든다.
5. **저자 점검**: author_collab가 있거나 data/authors.json에 risk_notes가 있는 저자의 캠페인마다 trend-scout를 author-check 모드로 호출한다. 판정이 '높음'·'확인 불가'면 series-planner를 1회 다시 불러 plan.md에서 그 캠페인을 '보류'로 표시하게 한다.
6. **메인 세션 검증**(Read): 각 brief.md 9섹션 / campaign.json에 format_id·risk_tier·primary_metric·deliverables / 상한(레드 주 1건, 같은 포맷 주 2회, 쇼츠 주 4개, 같은 도서 14일 2회, 트랙별 1회 이상, 주말 슬롯 0개). 어긋나면 series-planner를 1회만 다시 부른다.
7. **사람 게이트 G1 — 여기서 멈추고 보여준다**
   - 캘린더 표(요일, 슬롯, 캠페인, 포맷, 티어, 승인자)
   - 대표·법무 grant가 필요한 건과 요청 문안 (`npm run approve -- content/campaigns/<id> --grant ceo_story|legal --by "<이름>"`)
   - 자료 요청 목록: 편집부 인용·쪽수(assets/quotes-source.*), 실사진·초상 동의, 저자 동의, MBTI 선정 기록
   - plan.md의 승인 명령 블록을 그대로 보여주고 안내: **"에이전트는 승인하지 않습니다. Claude Code 밖의 별도 터미널에서 실행한 뒤 `/make --week`로 이어가세요."**
