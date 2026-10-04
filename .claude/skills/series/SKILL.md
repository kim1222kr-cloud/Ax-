---
name: series
description: 시리즈 포맷 하나로 여러 회차를 한 번에 기획해 일괄 기획 승인으로 넘길 때 쓴다(예: MBTI 4회차, 한 페이지 필사 4주, 신간 D-7·D-3·D-day). --var 를 주면 회차 사이에 변수 하나를 교대하는 실험을 사전 등록한다.
argument-hint: "<F번호> --book <slug>[,…] --n <편수> [--start YYYY-MM-DD] [--every 7d] [--var hook|cover|length|voice]"
---

# /series — 시리즈 회차 일괄 기획

## 인자 ($ARGUMENTS)
`<F번호> --book <slug>[,<slug>…] --n <편수> [--start YYYY-MM-DD] [--every 7d] [--var hook|cover|length|voice]`
- 예: `/series F02 --book nietzsche-buran --n 4 --start 2026-10-19 --var hook`
- 예: `/series F11 --book <신간 slug> --n 3` (D-7·D-3·D-day)

## 단계
1. 읽기: templates/formats.md의 해당 포맷 규칙, templates/cardnews/<F>.json, templates/shortform/<F>.json, content/campaigns/_planning/series/<F>.md(시리즈 바이블: 고정 kicker, 슬라이드 순서, 고정 해시태그, 요일, 지난 회차 성과). 템플릿이 없으면 멈추고 템플릿 작성을 요청한다(templates/는 사람이 관리).
2. 포맷 전제 확인
   - F02: 직원 선정 기록(assets/mbti-selection.* 또는 사람 제공 자료)이 없으면 '필름이 펴낸 책' 프레임으로 바꿔야 한다고 알린다.
   - F06·F12(레드 후보): 회차마다 대표·법무 승인 부담이 크므로 --n 2 이하를 권한다.
3. **series-planner** 호출: 회차 표(회차, 도서, 변수 값, 발행일, 티어)와 회차별 `npm run new -- --book … --slug … --date … --track … --deliverables … --format <F>`. `--var`가 있으면 회차 사이 변수 교대 실험을 experiments.json에 등록한다(형제 캠페인 복제 방식은 쓰지 않는다).
4. **메인 세션 검증**: 회차 사이 훅 중복 / 같은 도서 14일 2회·같은 포맷 주 2회·쇼츠 주 4개·레드 주 1건 초과 / 주말 슬롯. 어긋나면 날짜 조정을 위해 series-planner를 1회 다시 부른다.
5. **사람 게이트 G1 — 멈추고** content/campaigns/_planning/<week>/series-<F>.md의 회차 표와 별도 터미널용 일괄 승인 명령을 보여준다:
   `for c in <id1> <id2> …; do npm run approve -- content/campaigns/$c --stage plan --by "<이름>"; done`
   안내: "회차마다 시안 승인과 최종 승인은 따로 받습니다. 승인 뒤 `/make --week`로 일괄 제작하세요."
