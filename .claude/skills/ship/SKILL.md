---
name: ship
description: 시안 승인된 캠페인을 최종 승인 패키지로 묶고, 최종 승인 뒤에는 실발행한다. 유튜브는 승인 직후 --publish-at 으로 예약 업로드, 인스타그램은 API 예약 기능이 없어 슬롯 시각에 다시 실행해 ask 프롬프트를 한 번 클릭받는다.
argument-hint: "<campaign-id> [--channels ig-carousel,ig-reels,yt] [--slot <KST ISO>] [--now]"
disable-model-invocation: true
---

# /ship — 최종 승인 요청 패키지와 발행

## 인자 ($ARGUMENTS)
`<campaign-id> [--channels ig-carousel,ig-reels,yt] [--slot <YYYY-MM-DDTHH:mm:00+09:00>] [--now]`
- --slot 기본값은 campaign.json의 scheduled_at.
- --now는 인스타그램 슬롯 시각에 다시 실행할 때 쓴다.

## 단계
1. status.json을 Read한다. draft 승인이 없으면 멈추고 /make 결과를 안내한다.
2. publish 승인이 없으면 **publish-operator**(package 모드) → review/publish-dryrun.md, review/publish-request.md.
   **사람 게이트 G3 — 멈추고 보여준다**: 승인자(레드는 대표) / 드라이런 요약(캡션 첫 줄, 해시태그 수, 장수, 유튜브 제목, containsSyntheticMedia, 광고·AI 표기) / 시안 승인 이후 변경 여부(있으면 시안 재승인 먼저) / 본문 인용이 있으면 grants.quotes 필요 / 별도 터미널 명령 `npm run approve -- content/campaigns/<id> --stage publish --by "<이름>"` / "승인하는 순간 campaign.json, cardnews.json, shortform.json, out/**이 잠깁니다."
3. publish 승인이 있으면 publish-operator(package 모드)를 다시 불러 같은 세션에서 드라이런을 돌리고 승인자 적격성과 무변경을 확인한다.
4. 사용자에게 채널과 슬롯을 한 번에 확인받는다. 예: "<캠페인> 유튜브는 <slot>에 예약 업로드하고, 인스타 캐러셀·릴스는 <slot>에 실행합니다. 진행할까요?" **명시적 지시가 없으면 멈춘다.**
5. **publish-operator**(live 모드) 실행. 채널마다 ask 프롬프트 → publish-gate 훅 → 스크립트의 승인 검증을 거친다.
   - 유튜브: 바로 `--live --publish-at <slot>`로 예약 업로드.
   - 인스타그램: 지금이 슬롯 10분 전 이후면 `--live` 실행. 그보다 이르면 실행하지 않고 "슬롯 시각에 `/ship <id> --now`를 다시 실행하세요(주말 슬롯 없음)"라고 안내한다.
   - (선택, Phase 2) 사람이 소유한 OS cron 큐가 인스타그램 실행을 대신할 수 있다 — 에이전트는 관여하지 않는다.
6. 결과 보고: permalink·url, 공개 상태(유튜브 감사 전 비공개 고정 여부), publish-log.md 기록, D+1·D+3·D+7 측정 예정일. 차단되면 사유와 다음 사람 행동만 보고하고 우회하지 않는다.
